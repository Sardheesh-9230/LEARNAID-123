const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');
const Material = require('../models/Material');

/**
 * Chapter Controller for Subject-based system
 */

// Get all chapters for a subject
const getChaptersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    const chapters = await Chapter.find({ subject: subjectId })
      .populate('pdfFile', 'filename originalname fileSize filePath')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ displayOrder: 1, chapterNumber: 1 });
    
    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapters',
      error: error.message
    });
  }
};

// Get single chapter by ID
const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('subject', 'name code year section')
      .populate('pdfFile', 'filename originalname fileSize filePath')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
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
    console.error('Error fetching chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapter',
      error: error.message
    });
  }
};

// Create new chapter
const createChapter = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const {
      title,
      chapterNumber,
      description,
      content,
      topics,
      learningOutcomes,
      estimatedDuration,
      resources,
      status,
      displayOrder
    } = req.body;
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Check if chapter number already exists
    const existingChapter = await Chapter.findOne({
      subject: subjectId,
      chapterNumber
    });
    
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: `Chapter ${chapterNumber} already exists for this subject`
      });
    }
    
    const chapter = await Chapter.create({
      subject: subjectId,
      title,
      chapterNumber,
      description,
      content,
      topics,
      learningOutcomes,
      estimatedDuration,
      resources,
      status: status || 'Published',
      displayOrder: displayOrder || chapterNumber,
      createdBy: req.user._id
    });
    
    const populatedChapter = await Chapter.findById(chapter._id)
      .populate('subject', 'name code year section')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: populatedChapter
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating chapter',
      error: error.message
    });
  }
};

// Update chapter
const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    const {
      title,
      chapterNumber,
      description,
      content,
      topics,
      learningOutcomes,
      estimatedDuration,
      resources,
      status,
      displayOrder,
      pdfFile
    } = req.body;
    
    // Check for chapter number conflicts
    if (chapterNumber && chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await Chapter.findOne({
        subject: chapter.subject,
        chapterNumber,
        _id: { $ne: chapter._id }
      });
      
      if (existingChapter) {
        return res.status(400).json({
          success: false,
          message: `Chapter ${chapterNumber} already exists for this subject`
        });
      }
    }
    
    // Update fields
    if (title) chapter.title = title;
    if (chapterNumber) chapter.chapterNumber = chapterNumber;
    if (description !== undefined) chapter.description = description;
    if (content !== undefined) chapter.content = content;
    if (topics) chapter.topics = topics;
    if (learningOutcomes) chapter.learningOutcomes = learningOutcomes;
    if (estimatedDuration) chapter.estimatedDuration = estimatedDuration;
    if (resources) chapter.resources = resources;
    if (status) chapter.status = status;
    if (displayOrder) chapter.displayOrder = displayOrder;
    if (pdfFile) chapter.pdfFile = pdfFile;
    
    chapter.updatedBy = req.user._id;
    
    await chapter.save();
    
    const updatedChapter = await Chapter.findById(chapter._id)
      .populate('subject', 'name code year section')
      .populate('pdfFile', 'filename originalname fileSize filePath')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: updatedChapter
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating chapter',
      error: error.message
    });
  }
};

// Delete chapter
const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Delete associated materials
    await Material.deleteMany({ chapter: chapter._id });
    
    await chapter.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Chapter and associated materials deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting chapter',
      error: error.message
    });
  }
};

// Reorder chapters
const reorderChapters = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { chapterOrders } = req.body;
    
    if (!chapterOrders || !Array.isArray(chapterOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Chapter orders array is required'
      });
    }
    
    await Chapter.reorderChapters(subjectId, chapterOrders);
    
    const updatedChapters = await Chapter.find({ subject: subjectId })
      .sort({ displayOrder: 1, chapterNumber: 1 });
    
    res.status(200).json({
      success: true,
      message: 'Chapters reordered successfully',
      data: updatedChapters
    });
  } catch (error) {
    console.error('Error reordering chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reordering chapters',
      error: error.message
    });
  }
};

module.exports = {
  getChaptersBySubject,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters
};
