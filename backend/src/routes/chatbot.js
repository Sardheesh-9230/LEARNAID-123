const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Material = require('../models/Material');
const Chapter = require('../models/Chapter');
const Subject = require('../models/Subject');

/**
 * @route   POST /api/chatbot/query
 * @desc    Process student query using RAG (Retrieval-Augmented Generation)
 * @access  Private (Student)
 */
router.post('/query', protect, authorize('student'), async (req, res) => {
  try {
    const { question, subjectId, chapterId } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Get student's enrolled subjects and materials
    const query = {
      status: 'active'
    };

    // Filter by subject if provided
    if (subjectId) {
      query.subject = subjectId;
    }

    // Filter by chapter if provided
    if (chapterId) {
      query.chapter = chapterId;
    }

    // Fetch relevant materials
    const materials = await Material.find(query)
      .populate('chapter', 'name')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    // Simple keyword-based retrieval (replace with vector search for production)
    const relevantMaterials = materials.filter(material => {
      const searchText = `${material.title} ${material.description} ${material.chapter?.name} ${material.subject?.name}`.toLowerCase();
      const keywords = question.toLowerCase().split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => searchText.includes(keyword));
    });

    // Generate response based on materials
    let response;
    if (relevantMaterials.length > 0) {
      const materialInfo = relevantMaterials.map(m => ({
        title: m.title,
        type: m.type,
        description: m.description,
        subject: m.subject?.name,
        chapter: m.chapter?.name,
        url: m.url || `/materials/${m._id}`
      }));

      response = {
        answer: `I found ${relevantMaterials.length} relevant material(s) that might help answer your question. Here's what I found:`,
        materials: materialInfo,
        hasResults: true
      };
    } else {
      response = {
        answer: "I couldn't find specific materials related to your question. Could you try rephrasing or asking about a specific subject or chapter?",
        materials: [],
        hasResults: false,
        suggestions: [
          "Try asking about a specific subject or chapter",
          "Check your available courses and materials",
          "Contact your teacher for additional resources"
        ]
      };
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your question',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/materials
 * @desc    Get all available materials for student
 * @access  Private (Student)
 */
router.get('/materials', protect, authorize('student'), async (req, res) => {
  try {
    const { subjectId, type } = req.query;

    const query = { status: 'active' };

    if (subjectId) {
      query.subject = subjectId;
    }

    if (type) {
      query.type = type;
    }

    const materials = await Material.find(query)
      .populate('chapter', 'name order')
      .populate('subject', 'name code')
      .sort({ 'chapter.order': 1, order: 1 });

    res.json({
      success: true,
      count: materials.length,
      data: materials
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching materials',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/subjects
 * @desc    Get all subjects available to student
 * @access  Private (Student)
 */
router.get('/subjects', protect, authorize('student'), async (req, res) => {
  try {
    const subjects = await Subject.find({ status: 'active' })
      .populate('department', 'name code')
      .select('name code description department');

    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/chapters/:subjectId
 * @desc    Get chapters for a specific subject
 * @access  Private (Student)
 */
router.get('/chapters/:subjectId', protect, authorize('student'), async (req, res) => {
  try {
    const { subjectId } = req.params;

    const chapters = await Chapter.find({ 
      subject: subjectId,
      status: 'active' 
    })
    .populate('subject', 'name code')
    .sort({ order: 1 });

    res.json({
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
});

module.exports = router;
