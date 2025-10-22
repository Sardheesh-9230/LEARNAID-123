const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  getQuestionsByExam,
  getQuestionsByChapter,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  getChapterDistribution,
  reorderQuestions
} = require('../controllers/examQuestionController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const questionValidation = [
  body('exam').notEmpty().withMessage('Exam ID is required'),
  body('chapter').notEmpty().withMessage('Chapter ID is required'),
  body('questionNumber').isInt({ min: 1 }).withMessage('Valid question number is required'),
  body('questionText').notEmpty().withMessage('Question text is required'),
  body('questionType').isIn(['Short Answer', 'Long Answer', 'MCQ', 'True/False', 'Fill in Blank', 'Numerical']).withMessage('Valid question type is required'),
  body('marks').isInt({ min: 1 }).withMessage('Valid marks is required')
];

// Protected routes
router.use(protect);

// GET routes
router.get('/', getQuestions);
router.get('/exam/:examId', getQuestionsByExam);
router.get('/exam/:examId/chapter-distribution', authorize('Faculty', 'Admin'), getChapterDistribution);
router.get('/chapter/:chapterId', getQuestionsByChapter);
router.get('/:id', getQuestionById);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), questionValidation, createQuestion);
router.post('/bulk', authorize('Faculty', 'Admin'), bulkCreateQuestions);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateQuestion);
router.put('/exam/:examId/reorder', authorize('Faculty', 'Admin'), reorderQuestions);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteQuestion);

module.exports = router;
