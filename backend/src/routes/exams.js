const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  updateExamStatus,
  getExamsByCourse,
  getExamStatistics,
  getUpcomingExams
} = require('../controllers/ciaExamController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const examValidation = [
  body('title').notEmpty().withMessage('Exam title is required'),
  body('examType').isIn(['CIA1', 'CIA2', 'CIA3', 'Semester', 'Assignment', 'Quiz']).withMessage('Valid exam type is required'),
  body('course').notEmpty().withMessage('Course ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('duration').isInt({ min: 1 }).withMessage('Valid duration is required'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Valid total marks is required'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Valid passing marks is required')
];

// Protected routes
router.use(protect);

// GET routes
router.get('/', getExams);
router.get('/upcoming', getUpcomingExams);
router.get('/course/:courseId', getExamsByCourse);
router.get('/:id', getExamById);
router.get('/:id/statistics', authorize('Faculty', 'Admin'), getExamStatistics);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), examValidation, createExam);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateExam);

// PATCH routes
router.patch('/:id/status', authorize('Faculty', 'Admin'), updateExamStatus);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteExam);

module.exports = router;
