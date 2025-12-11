const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  enterMarks,
  bulkEnterMarks,
  updateMarks,
  getMarksByStudent,
  getMarksByExam,
  getChapterWisePerformance,
  getWeakStudentsByChapter,
  getExamPerformance,
  deleteMarks,
  getCOAnalysisBySubject,
  getCOAnalysisBySubjectAndExam
} = require('../controllers/examMarksController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const marksValidation = [
  body('exam').notEmpty().withMessage('Exam ID is required'),
  body('student').notEmpty().withMessage('Student ID is required'),
  body('questionMarks').isArray({ min: 1 }).withMessage('Question marks array is required'),
  body('questionMarks.*.question').notEmpty().withMessage('Question ID is required'),
  body('questionMarks.*.marksObtained').isFloat({ min: 0 }).withMessage('Valid marks obtained is required')
];

// Protected routes
router.use(protect);

// GET routes
router.get('/student/:studentId', getMarksByStudent);
router.get('/exam/:examId', authorize('Faculty', 'Admin'), getMarksByExam);
router.get('/exam/:examId/chapter-performance', authorize('Faculty', 'Admin'), getChapterWisePerformance);
router.get('/exam/:examId/weak-students', authorize('Faculty', 'Admin'), getWeakStudentsByChapter);
router.get('/exam/:examId/performance', authorize('Faculty', 'Admin'), getExamPerformance);
router.get('/co-analysis/subject/:subjectId', authorize('Faculty', 'Admin'), getCOAnalysisBySubject);
router.get('/co-analysis/subject/:subjectId/exam/:examType', authorize('Faculty', 'Admin'), getCOAnalysisBySubjectAndExam);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), marksValidation, enterMarks);
router.post('/bulk', authorize('Faculty', 'Admin'), bulkEnterMarks);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateMarks);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteMarks);

module.exports = router;
