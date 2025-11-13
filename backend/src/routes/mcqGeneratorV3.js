const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  generateMCQs,
  getSubjectsForFaculty,
  getChaptersBySubject,
  getMaterialsByChapter
} = require('../controllers/mcqGeneratorV3');

/**
 * @route   GET /api/mcq-generator/subjects
 * @desc    Get all subjects for logged-in faculty
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/subjects',
  protect,
  authorize('Faculty', 'Admin'),
  getSubjectsForFaculty
);

/**
 * @route   GET /api/mcq-generator/subjects/:subjectId/chapters
 * @desc    Get all chapters for a subject
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/subjects/:subjectId/chapters',
  protect,
  authorize('Faculty', 'Admin'),
  [
    param('subjectId')
      .isMongoId()
      .withMessage('Invalid subject ID')
  ],
  getChaptersBySubject
);

/**
 * @route   GET /api/mcq-generator/chapters/:chapterId/materials
 * @desc    Get all PDF materials for a chapter
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/chapters/:chapterId/materials',
  protect,
  authorize('Faculty', 'Admin'),
  [
    param('chapterId')
      .isMongoId()
      .withMessage('Invalid chapter ID')
  ],
  getMaterialsByChapter
);

/**
 * @route   POST /api/mcq-generator/generate
 * @desc    Generate MCQs from PDF material using AI
 * @access  Private (Faculty, Admin)
 */
router.post(
  '/generate',
  protect,
  authorize('Faculty', 'Admin'),
  [
    body('materialId')
      .isMongoId()
      .withMessage('Valid material ID is required'),
    
    body('topics')
      .trim()
      .notEmpty()
      .withMessage('Topics are required')
      .isLength({ min: 3, max: 500 })
      .withMessage('Topics must be between 3 and 500 characters'),
    
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Number of questions must be between 1 and 50')
      .toInt(),
    
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard')
  ],
  generateMCQs
);

module.exports = router;
