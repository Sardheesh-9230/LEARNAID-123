const Material = require('../models/Material');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const File = require('../models/File');

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
      .populate('file', 'filename originalname fileSize filePath mimeType')
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
    
    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Create material
    const material = await Material.create({
      chapter: chapterId,
      subject: chapter.subject,
      title,
      description,
      type,
      url,
      file,
      fileMetadata,
      order: order || 1,
      duration,
      status: status || 'Published',
      isPublic: isPublic !== undefined ? isPublic : true,
      allowDownload: allowDownload !== undefined ? allowDownload : true,
      tags,
      createdBy: req.user._id
    });
    
    // Populate the created material
    const populatedMaterial = await Material.findById(material._id)
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code year section')
      .populate('file', 'filename originalname fileSize filePath')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: populatedMaterial
    });
  } catch (error) {
    console.error('Error creating material:', error);
    
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
    if (file) material.file = file;
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
      .populate('file', 'filename originalname fileSize filePath')
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
    
    // Optionally delete associated file
    if (material.file) {
      try {
        await File.findByIdAndDelete(material.file);
      } catch (error) {
        console.error('Error deleting associated file:', error);
        // Continue with material deletion even if file deletion fails
      }
    }
    
    await material.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
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

module.exports = {
  getMaterialsByChapter,
  getMaterialsBySubject,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
  recordDownload
};
