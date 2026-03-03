const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMaterialsForCO,
  generateCOSpecificQuestions,
  regenerateSingleQuestion,
  generateWithoutMaterials,
  createAssessmentTask
} = require('../controllers/taskAssessmentController');
const {
  loadMaterialContent,
  generateMCQQuestions,
  generateShortAnswerQuestions,
  generateCodingQuestions,
  generateMixedQuestions,
  clearVectorStore
} = require('../services/questionGenerator');

/**
 * @route   GET /api/materials/subject/:subjectId/co/:coNumber
 * @desc    Get all materials for a specific CO
 * @access  Private (Faculty)
 */
router.get('/materials/subject/:subjectId/co/:coNumber', protect, getMaterialsForCO);

/**
 * @route   POST /api/mcq-generator/generate-co-specific
 * @desc    Generate CO-specific questions from multiple materials using RAG
 * @access  Private (Faculty)
 */
router.post('/mcq-generator/generate-co-specific', protect, generateCOSpecificQuestions);

/**
 * @route   POST /api/mcq-generator/regenerate-single
 * @desc    Regenerate a single question
 * @access  Private (Faculty)
 */
router.post('/mcq-generator/regenerate-single', protect, regenerateSingleQuestion);

/**
 * @route   POST /api/mcq-generator/generate-without-materials
 * @desc    Generate questions using LLM only (without materials)
 * @access  Private (Faculty)
 */
router.post('/mcq-generator/generate-without-materials', protect, generateWithoutMaterials);

/**
 * @route   POST /api/tasks/create-assessment-task
 * @desc    Create assessment task with questions for multiple students
 * @access  Private (Faculty)
 */
router.post('/tasks/create-assessment-task', protect, createAssessmentTask);

/**
 * @route   POST /api/question-generator/load-material
 * @desc    Load material content into vector store for question generation
 * @access  Private (Faculty)
 */
router.post('/question-generator/load-material', protect, async (req, res) => {
  try {
    const { materialId } = req.body;
    
    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required'
      });
    }
    
    const chunksLoaded = await loadMaterialContent(materialId);
    
    res.json({
      success: true,
      message: `Material loaded successfully with ${chunksLoaded} chunks`,
      chunksLoaded
    });
  } catch (error) {
    console.error('Error loading material:', error);
    res.status(500).json({
      success: false,
      message: `Failed to load material: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/question-generator/generate-mcq
 * @desc    Generate MCQ questions
 * @access  Private (Faculty)
 */
router.post('/question-generator/generate-mcq', protect, async (req, res) => {
  try {
    const {
      topics,
      courseOutcome,
      difficulty = 'Medium',
      numberOfQuestions = 5,
      materialId = null
    } = req.body;
    
    if (!topics || !courseOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Topics and course outcome are required'
      });
    }
    
    const questions = await generateMCQQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions,
      materialId
    });
    
    res.json({
      success: true,
      message: `Generated ${questions.length} MCQ questions`,
      questions
    });
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate MCQ questions: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/question-generator/generate-short-answer
 * @desc    Generate Short Answer questions
 * @access  Private (Faculty)
 */
router.post('/question-generator/generate-short-answer', protect, async (req, res) => {
  try {
    const {
      topics,
      courseOutcome,
      difficulty = 'Medium',
      numberOfQuestions = 5,
      maxWords = 200,
      materialId = null
    } = req.body;
    
    if (!topics || !courseOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Topics and course outcome are required'
      });
    }
    
    const questions = await generateShortAnswerQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions,
      maxWords,
      materialId
    });
    
    res.json({
      success: true,
      message: `Generated ${questions.length} Short Answer questions`,
      questions
    });
  } catch (error) {
    console.error('Error generating Short Answer questions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate Short Answer questions: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/question-generator/generate-coding
 * @desc    Generate Coding questions
 * @access  Private (Faculty)
 */
router.post('/question-generator/generate-coding', protect, async (req, res) => {
  try {
    const {
      topics,
      courseOutcome,
      difficulty = 'Medium',
      numberOfQuestions = 3,
      programmingLanguage = 'Python',
      materialId = null
    } = req.body;
    
    if (!topics || !courseOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Topics and course outcome are required'
      });
    }
    
    const questions = await generateCodingQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions,
      programmingLanguage,
      materialId
    });
    
    res.json({
      success: true,
      message: `Generated ${questions.length} Coding questions`,
      questions
    });
  } catch (error) {
    console.error('Error generating Coding questions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate Coding questions: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/question-generator/generate-mixed
 * @desc    Generate mixed type questions (MCQ + Short Answer + Coding)
 * @access  Private (Faculty)
 */
router.post('/question-generator/generate-mixed', protect, async (req, res) => {
  try {
    const {
      topics,
      courseOutcome,
      difficulty = 'Medium',
      mcqCount = 3,
      shortAnswerCount = 2,
      codingCount = 1,
      programmingLanguage = 'Python',
      materialId = null
    } = req.body;
    
    if (!topics || !courseOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Topics and course outcome are required'
      });
    }
    
    const questions = await generateMixedQuestions({
      topics,
      courseOutcome,
      difficulty,
      mcqCount,
      shortAnswerCount,
      codingCount,
      programmingLanguage,
      materialId
    });
    
    res.json({
      success: true,
      message: `Generated ${questions.length} mixed questions`,
      questions,
      breakdown: {
        mcq: questions.filter(q => q.questionType === 'MCQ').length,
        shortAnswer: questions.filter(q => q.questionType === 'Short Answer').length,
        coding: questions.filter(q => q.questionType === 'Coding').length
      }
    });
  } catch (error) {
    console.error('Error generating mixed questions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate mixed questions: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/question-generator/clear-cache
 * @desc    Clear vector store cache
 * @access  Private (Faculty)
 */
router.post('/question-generator/clear-cache', protect, async (req, res) => {
  try {
    clearVectorStore();
    res.json({
      success: true,
      message: 'Vector store cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: `Failed to clear cache: ${error.message}`
    });
  }
});

module.exports = router;
