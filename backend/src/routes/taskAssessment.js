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

module.exports = router;
