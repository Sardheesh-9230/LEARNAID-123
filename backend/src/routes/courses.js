const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByFaculty,
  getCoursesByDepartment,
  updateCourseStatus,
  getCourseStats
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const courseValidation = [
  body('name').notEmpty().withMessage('Course name is required'),
  body('code').notEmpty().withMessage('Course code is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('subject').notEmpty().withMessage('Subject is required')
];

// Public routes (none for courses)

// Protected routes
router.use(protect);

// GET routes
router.get('/', getCourses);
router.get('/faculty/:facultyId', authorize('Faculty', 'Admin'), getCoursesByFaculty);
router.get('/department/:departmentId', authorize('Faculty', 'Admin'), getCoursesByDepartment);
router.get('/:id', getCourseById);
router.get('/:id/stats', authorize('Faculty', 'Admin'), getCourseStats);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), courseValidation, createCourse);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateCourse);

// PATCH routes
router.patch('/:id/status', authorize('Faculty', 'Admin'), updateCourseStatus);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteCourse);

module.exports = router;
