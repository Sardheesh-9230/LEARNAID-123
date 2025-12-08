const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const File = require('../models/File');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

/**
 * @desc    Create a new chapter
 * @route   POST /api/subjects/:subjectId/chapters
 * @access  Private/Faculty
 */
exports.createChapter = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Get subjectId from URL params
    const subjectId = req.params.subjectId;

    const {
      title,
      chapterNumber,
      description,
      content,
      topics,
      learningOutcomes,
      estimatedDuration,
      displayOrder,
      status
    } = req.body;

    console.log('📥 Creating chapter with data:', {
      subjectId,
      title,
      chapterNumber,
      topics: topics,
      learningOutcomes: learningOutcomes,
      estimatedDuration,
      status
    });

    // Verify subject exists (Course and Subject are the same model)
    const subject = await Course.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if user has permission to add chapters to this subject
    if (req.user.role === 'Faculty' && subject.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add chapters to this subject'
      });
    }

    // Check if chapter number already exists for this subject
    const existingChapter = await Chapter.findOne({ subject: subjectId, chapterNumber });
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: `Chapter number ${chapterNumber} already exists for this subject`
      });
    }

    // Create chapter - note: Chapter model uses 'subject' field
    const chapter = await Chapter.create({
      title,
      chapterNumber,
      subject: subjectId, // Use subject field as per Chapter model
      description: description || '',
      content: content || '',
      topics: topics ? (Array.isArray(topics) ? topics : [topics]) : [],
      learningOutcomes: learningOutcomes ? (Array.isArray(learningOutcomes) ? learningOutcomes : [learningOutcomes]) : [],
      estimatedDuration: estimatedDuration || 1,
      displayOrder: displayOrder || chapterNumber,
      status: status || 'Draft',
      createdBy: req.user.id
    });

    // Populate subject details
    await chapter.populate('subject', 'name code');

    console.log('✅ Chapter created successfully:', chapter._id);

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    console.error('❌ Create chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message
    });
  }
};

/**
 * @desc    Get all chapters
 * @route   GET /api/chapters
 * @access  Private
 */
exports.getChapters = async (req, res, next) => {
  try {
    const { subject, status } = req.query;

    const filter = {};
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const chapters = await Chapter.find(filter)
      .populate('subject', 'name code')
      .populate('pdfFile', 'filename originalname fileSize filePath')
      .populate('resources.fileId', 'filename originalname fileSize')
      .sort({ displayOrder: 1, chapterNumber: 1 });

    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message
    });
  }
};

/**
 * @desc    Get single chapter by ID
 * @route   GET /api/chapters/:id
 * @access  Private
 */
exports.getChapterById = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('course', 'name code faculty')
      .populate('pdfFile', 'filename originalname fileSize filePath uploadDate')
      .populate('resources.fileId', 'filename originalname fileSize filePath')
      .populate('createdBy', 'name email');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Get chapter by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter',
      error: error.message
    });
  }
};

/**
 * @desc    Get chapters by course
 * @route   GET /api/chapters/course/:courseId
 * @access  Private
 */
exports.getChaptersByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const chapters = await Chapter.findByCourse(courseId);

    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('Get chapters by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message
    });
  }
};

/**
 * @desc    Get chapters by subject
 * @route   GET /api/subjects/:subjectId/chapters
 * @access  Private
 */
exports.getChaptersBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    console.log('📥 Fetching chapters for subject:', subjectId);

    const subject = await Course.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const chapters = await Chapter.find({ subject: subjectId })
      .populate('subject', 'name code')
      .populate('pdfFile', 'filename originalname fileSize filePath')
      .populate('resources.fileId', 'filename originalname fileSize')
      .sort({ displayOrder: 1, chapterNumber: 1 });

    console.log(`✅ Found ${chapters.length} chapters for subject`);

    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('❌ Get chapters by subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message
    });
  }
};

/**
 * @desc    Update chapter
 * @route   PUT /api/chapters/:id
 * @access  Private/Faculty
 */
exports.updateChapter = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let chapter = await Chapter.findById(req.params.id).populate('subject');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && chapter.subject.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this chapter'
      });
    }

    // If chapter number is being changed, check for duplicates
    if (req.body.chapterNumber && req.body.chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({
        subject: chapter.subject._id,
        chapterNumber: req.body.chapterNumber,
        _id: { $ne: chapter._id }
      });

      if (existingChapter) {
        return res.status(400).json({
          success: false,
          message: 'Chapter number already exists for this subject'
        });
      }
    }

    // Update chapter
    req.body.updatedBy = req.user.id;
    chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('subject', 'name code')
     .populate('pdfFile', 'filename originalname fileSize');

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message
    });
  }
};

/**
 * @desc    Delete chapter
 * @route   DELETE /api/chapters/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('subject');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && chapter.subject.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chapter'
      });
    }

    // Check if chapter has associated exam questions
    const ExamQuestion = require('../models/ExamQuestion');
    const questionCount = await ExamQuestion.countDocuments({ chapter: chapter._id });

    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete chapter with existing exam questions. Please delete all questions first.'
      });
    }

    await chapter.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message
    });
  }
};

/**
 * @desc    Upload PDF to chapter
 * @route   POST /api/chapters/:id/upload-pdf
 * @access  Private/Faculty
 */
exports.uploadChapterPDF = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('course');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && chapter.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload PDF to this chapter'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    // Create file record
    const file = await File.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fileType: 'chapter_pdf',
      uploadedBy: req.user.id,
      relatedTo: chapter._id,
      relatedModel: 'Chapter'
    });

    // Update chapter with PDF file ID
    chapter.pdfFile = file._id;
    await chapter.save();

    await chapter.populate('pdfFile', 'filename originalname fileSize filePath');

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        chapter,
        file
      }
    });
  } catch (error) {
    console.error('Upload chapter PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading PDF',
      error: error.message
    });
  }
};

/**
 * @desc    Add resource to chapter
 * @route   POST /api/chapters/:id/resources
 * @access  Private/Faculty
 */
exports.addChapterResource = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('course');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && chapter.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add resources to this chapter'
      });
    }

    const { title, type, url, description } = req.body;

    const resource = {
      title,
      type,
      url,
      description
    };

    // If file is uploaded
    if (req.file) {
      const file = await File.create({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        fileType: 'chapter_resource',
        uploadedBy: req.user.id,
        relatedTo: chapter._id,
        relatedModel: 'Chapter'
      });

      resource.fileId = file._id;
    }

    chapter.resources.push(resource);
    await chapter.save();

    res.status(200).json({
      success: true,
      message: 'Resource added successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Add chapter resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding resource',
      error: error.message
    });
  }
};

/**
 * @desc    Reorder chapters
 * @route   PUT /api/chapters/reorder
 * @access  Private/Faculty
 */
exports.reorderChapters = async (req, res, next) => {
  try {
    const { courseId, chapterOrders } = req.body;

    if (!courseId || !chapterOrders || !Array.isArray(chapterOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and chapter orders array are required'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reorder chapters for this course'
      });
    }

    await Chapter.reorderChapters(courseId, chapterOrders);

    const updatedChapters = await Chapter.findByCourse(courseId);

    res.status(200).json({
      success: true,
      message: 'Chapters reordered successfully',
      data: updatedChapters
    });
  } catch (error) {
    console.error('Reorder chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering chapters',
      error: error.message
    });
  }
};

/**
 * @desc    Update chapter status
 * @route   PATCH /api/chapters/:id/status
 * @access  Private/Faculty
 */
exports.updateChapterStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Draft', 'Published', 'Archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const chapter = await Chapter.findById(req.params.id).populate('course');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && chapter.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this chapter'
      });
    }

    chapter.status = status;
    chapter.updatedBy = req.user.id;
    await chapter.save();

    res.status(200).json({
      success: true,
      message: `Chapter status updated to ${status}`,
      data: chapter
    });
  } catch (error) {
    console.error('Update chapter status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter status',
      error: error.message
    });
  }
};
