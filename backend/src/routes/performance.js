const express = require('express');
const router = express.Router();
const {
  getPerformanceByStudent,
  getPerformanceByCourse,
  getWeakStudents,
  getWeakStudentsByChapter,
  getTopPerformers,
  getCourseStatistics,
  updateChapterPerformance,
  recalculatePerformance
} = require('../controllers/studentPerformanceController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.use(protect);

// GET routes
router.get('/student/:studentId', getPerformanceByStudent);
router.get('/course/:courseId', authorize('Faculty', 'Admin'), getPerformanceByCourse);
router.get('/course/:courseId/weak-students', authorize('Faculty', 'Admin'), getWeakStudents);
router.get('/course/:courseId/chapter/:chapterId/weak-students', authorize('Faculty', 'Admin'), getWeakStudentsByChapter);
router.get('/course/:courseId/top-performers', authorize('Faculty', 'Admin'), getTopPerformers);
router.get('/course/:courseId/statistics', authorize('Faculty', 'Admin'), getCourseStatistics);

// PUT routes
router.put('/:id/chapter', authorize('Faculty', 'Admin'), updateChapterPerformance);

// POST routes
router.post('/:id/recalculate', authorize('Faculty', 'Admin'), recalculatePerformance);

module.exports = router;
