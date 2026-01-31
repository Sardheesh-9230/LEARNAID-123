const Material = require('../models/Material');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const File = require('../models/File');
const fs = require('fs').promises;
const path = require('path');

const normalizeStoredPath = (p) => {
  if (!p || typeof p !== 'string') return p;
  return p.replace(/\\/g, '/');
};

const resolveMaterialFileInfo = async (material) => {
  const meta = material?.fileMetadata || {};

  const filePath = normalizeStoredPath(meta.filePath || meta.path);
  const mimeType = meta.mimeType || meta.mimetype;
  const originalName = meta.originalName || meta.originalname;
  const size = meta.size;

  const basename = filePath ? path.basename(filePath) : undefined;

  if (filePath) {
    return { filePath, mimeType, originalName, basename, size };
  }

  if (material?.file) {
    const fileRecord = await File.findById(material.file).select('path mimetype originalName filename').lean();
    if (fileRecord?.path) {
      const recordPath = normalizeStoredPath(fileRecord.path);
      return {
        filePath: recordPath,
        mimeType: fileRecord.mimetype,
        originalName: fileRecord.originalName || fileRecord.filename,
        basename: path.basename(recordPath),
        size: fileRecord.size
      };
    }
  }

  return null;
};

const tryFindBySize = async ({ dirs, size, ext }) => {
  if (!size || !Number.isFinite(size)) return null;
  const matches = [];

  for (const dir of dirs) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        if (ext && path.extname(entry).toLowerCase() !== ext) continue;
        const full = path.join(dir, entry);
        try {
          const st = await fs.stat(full);
          if (st.isFile() && st.size === size) {
            matches.push(full);
            if (matches.length > 1) return { ambiguous: true, matches };
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {
      // ignore missing dirs
    }
  }

  return matches.length === 1 ? { path: matches[0] } : null;
};

const resolveExistingPhysicalPath = async (fileInfo) => {
  if (!fileInfo?.filePath) return null;

  const candidatePaths = [];

  // 1) Stored relative path (normalized)
  candidatePaths.push(path.join(process.cwd(), fileInfo.filePath));

  // 2) Common uploads/materials locations by basename
  if (fileInfo.basename) {
    candidatePaths.push(path.join(process.cwd(), 'uploads', 'materials', fileInfo.basename));
    candidatePaths.push(path.join(process.cwd(), 'uploads/materials', fileInfo.basename));
  }

  // 3) If backend is started from repo root, also try backend/uploads
  if (fileInfo.basename) {
    candidatePaths.push(path.join(process.cwd(), 'backend', 'uploads', 'materials', fileInfo.basename));
  }

  for (const candidate of candidatePaths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch (_) {
      // keep trying
    }
  }

  // Final fallback: search uploads dirs by recorded file size (handles renamed/moved files)
  const ext = fileInfo.basename ? path.extname(fileInfo.basename).toLowerCase() : undefined;
  const uploadsDirs = [
    path.join(process.cwd(), 'uploads', 'materials'),
    path.join(process.cwd(), 'uploads', 'pdfs'),
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'backend', 'uploads', 'materials'),
    path.join(process.cwd(), 'backend', 'uploads', 'pdfs')
  ];

  const sizeSearch = await tryFindBySize({ dirs: uploadsDirs, size: fileInfo.size, ext });
  if (sizeSearch?.path) return sizeSearch.path;
  if (sizeSearch?.ambiguous) return null;

  return null;
};

/**
 * @desc    Get all materials for a chapter
 * @route   GET /api/chapters/:chapterId/materials
 * @access  Private (Faculty, Student, Admin)
 */
const getMaterialsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    
    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    const materials = await Material.findByChapter(chapterId);
    
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching materials',
      error: error.message
    });
  }
};

/**
 * @desc    Get all materials for a subject
 * @route   GET /api/subjects/:subjectId/materials
 * @access  Private (Faculty, Student, Admin)
 */
const getMaterialsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const materials = await Material.findBySubject(subjectId);
    
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching materials',
      error: error.message
    });
  }
};

/**
 * @desc    Get single material by ID
 * @route   GET /api/materials/:id
 * @access  Private (Faculty, Student, Admin)
 */
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code year section')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Increment view count
    material.incrementViewCount();
    
    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching material',
      error: error.message
    });
  }
};

/**
 * @desc    Create new material
 * @route   POST /api/chapters/:chapterId/materials
 * @access  Private (Faculty, Admin)
 */
const createMaterial = async (req, res) => {
  try {
    const { chapterId } = req.params;
    
    console.log('📥 Creating material:', {
      chapterId,
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      } : 'No file received',
      headers: req.headers['content-type']
    });
    
    const {
      title,
      description,
      type,
      url,
      order,
      duration,
      status,
      isPublic,
      allowDownload,
      tags
    } = req.body;
    
    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Prepare material data
    const materialData = {
      chapter: chapterId,
      subject: chapter.subject,
      title,
      description: description || '',
      type,
      order: order ? parseInt(order) : 1,
      duration: duration ? parseInt(duration) : 0,
      status: status || 'Published',
      isPublic: isPublic !== undefined ? isPublic === 'true' : true,
      allowDownload: allowDownload !== undefined ? allowDownload === 'true' : true,
      createdBy: req.user._id
    };

    // Handle file upload if present
    if (req.file) {
      const normalizedUploadPath = (req.file.path || '').replace(/\\/g, '/');
      // Create a File record first with all required fields (matching File model schema)
      const fileData = {
        originalName: req.file.originalname,   // File model field: originalName
        filename: req.file.filename,           // File model field: filename  
        path: normalizedUploadPath,            // Normalize to forward slashes for cross-OS compatibility
        size: req.file.size,                   // File model field: size (not fileSize)
        mimetype: req.file.mimetype,           // File model field: mimetype (not mimeType)
        uploadedBy: req.user._id,              // File model field: uploadedBy
        relatedTo: {
          id: chapterId,                       // File model field: relatedTo.id
          type: 'Subject'                      // File model field: relatedTo.type (using Subject since chapter belongs to subject)
        },
        category: 'document'                   // File model field: category (default is 'other', but 'document' fits better)
      };
      
      console.log('📄 Creating File record with correct field names:', fileData);
      const fileRecord = await File.create(fileData);
      materialData.file = fileRecord._id;
      
      // Also store in fileMetadata for compatibility
      materialData.fileMetadata = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: normalizedUploadPath
      };
    } else if (url) {
      // If no file but URL provided
      materialData.url = url;
    }

    // Handle tags if provided
    if (tags) {
      try {
        materialData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        // If tags is not JSON, split by comma
        materialData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    
    console.log('📝 Material data to save:', materialData);
    
    // Create material
    const material = await Material.create(materialData);
    
    // Populate the created material
    const populatedMaterial = await Material.findById(material._id)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code year section')
      .populate('createdBy', 'name email');
    
    console.log('✅ Material created successfully:', material._id);
    
    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: populatedMaterial
    });
  } catch (error) {
    console.error('❌ Error creating material:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating material',
      error: error.message
    });
  }
};

/**
 * @desc    Update material
 * @route   PUT /api/materials/:id
 * @access  Private (Faculty, Admin)
 */
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    const {
      title,
      description,
      type,
      url,
      file,
      fileMetadata,
      order,
      duration,
      status,
      isPublic,
      allowDownload,
      tags
    } = req.body;
    
    // Update fields
    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    if (type) material.type = type;
    if (url !== undefined) material.url = url;
    if (fileMetadata) material.fileMetadata = fileMetadata;
    if (order) material.order = order;
    if (duration) material.duration = duration;
    if (status) material.status = status;
    if (isPublic !== undefined) material.isPublic = isPublic;
    if (allowDownload !== undefined) material.allowDownload = allowDownload;
    if (tags) material.tags = tags;
    
    material.updatedBy = req.user._id;
    
    await material.save();
    
    // Populate the updated material
    const updatedMaterial = await Material.findById(material._id)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code year section')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: updatedMaterial
    });
  } catch (error) {
    console.error('Error updating material:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating material',
      error: error.message
    });
  }
};

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private (Faculty, Admin)
 */
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    console.log('🗑️ Deleting material:', {
      id: material._id,
      title: material.title,
      hasFile: !!material.file,
      hasFileMetadata: !!material.fileMetadata
    });
    
    // Delete physical file if exists
    if (material.fileMetadata && material.fileMetadata.filePath) {
      try {
        const filePath = path.join(process.cwd(), material.fileMetadata.filePath);
        await fs.unlink(filePath);
        console.log('✅ Physical file deleted:', filePath);
      } catch (fileError) {
        console.error('⚠️ Error deleting physical file:', fileError.message);
        // Continue with deletion even if physical file is missing
      }
    }
    
    // Delete File record from database
    if (material.file) {
      try {
        const fileRecord = await File.findByIdAndDelete(material.file);
        if (fileRecord) {
          console.log('✅ File record deleted from DB:', fileRecord._id);
        }
      } catch (error) {
        console.error('⚠️ Error deleting File record:', error.message);
        // Continue with material deletion
      }
    }
    
    // Delete Material record
    await material.deleteOne();
    console.log('✅ Material record deleted from DB');
    
    res.status(200).json({
      success: true,
      message: 'Material and associated files deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting material',
      error: error.message
    });
  }
};

/**
 * @desc    Reorder materials
 * @route   PUT /api/chapters/:chapterId/materials/reorder
 * @access  Private (Faculty, Admin)
 */
const reorderMaterials = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { materialOrders } = req.body; // Array of { materialId, newOrder }
    
    if (!materialOrders || !Array.isArray(materialOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Material orders array is required'
      });
    }
    
    await Material.reorderMaterials(chapterId, materialOrders);
    
    const updatedMaterials = await Material.findByChapter(chapterId);
    
    res.status(200).json({
      success: true,
      message: 'Materials reordered successfully',
      data: updatedMaterials
    });
  } catch (error) {
    console.error('Error reordering materials:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reordering materials',
      error: error.message
    });
  }
};

/**
 * @desc    Record material download
 * @route   POST /api/materials/:id/download
 * @access  Private (Faculty, Student, Admin)
 */
const recordDownload = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    if (!material.allowDownload) {
      return res.status(403).json({
        success: false,
        message: 'Download not allowed for this material'
      });
    }
    
    await material.incrementDownloadCount();
    
    res.status(200).json({
      success: true,
      message: 'Download recorded'
    });
  } catch (error) {
    console.error('Error recording download:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording download',
      error: error.message
    });
  }
};

/**
 * @desc    Download material file
 * @route   GET /api/materials/:id/file
 * @access  Private (Faculty, Student, Admin)
 */
const downloadMaterialFile = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    if (!material.allowDownload) {
      return res.status(403).json({
        success: false,
        message: 'Download not allowed for this material'
      });
    }

    const fileInfo = await resolveMaterialFileInfo(material);
    if (!fileInfo || !fileInfo.filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = await resolveExistingPhysicalPath(fileInfo);
    if (!filePath) {
      console.error('File not found on server for material:', material._id, fileInfo.filePath);
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server. Please re-upload the material file.'
      });
    }
    
    // Increment download count
    await material.incrementDownloadCount();
    
    // Set headers for download
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName || 'download'}"`);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });
    
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading material',
      error: error.message
    });
  }
};

/**
 * @desc    View material file (open in browser)
 * @route   GET /api/materials/:id/view
 * @access  Private (Faculty, Student, Admin)
 */
const viewMaterialFile = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    const fileInfo = await resolveMaterialFileInfo(material);
    if (!fileInfo || !fileInfo.filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = await resolveExistingPhysicalPath(fileInfo);
    if (!filePath) {
      console.error('File not found on server for material:', material._id, fileInfo.filePath);
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server. Please re-upload the material file.'
      });
    }
    
    // Increment view count
    await material.incrementViewCount();
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName || 'view'}"`);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });
    
  } catch (error) {
    console.error('Error viewing material:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while viewing material',
      error: error.message
    });
  }
};

module.exports = {
  getMaterialsByChapter,
  getMaterialsBySubject,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
  recordDownload,
  downloadMaterialFile,
  viewMaterialFile
};
