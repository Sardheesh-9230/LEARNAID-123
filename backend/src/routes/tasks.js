const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask,
  autoGenerateTasks,
  getTasksByStudent,
  getTasksByFaculty,
  getTaskById,
  updateTask,
  submitTask,
  deleteTask,
  getTaskStatistics,
  getOverdueTasks
} = require('../controllers/taskAssignmentController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const taskValidation = [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('course').notEmpty().withMessage('Course ID is required'),
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').notEmpty().withMessage('Task description is required'),
  body('taskType').isIn(['MCQ Practice', 'Descriptive', 'Coding', 'Project', 'Reading']).withMessage('Valid task type is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

// Protected routes
router.use(protect);

// GET routes
router.get('/student/:studentId', getTasksByStudent);
router.get('/faculty/:facultyId', authorize('Faculty', 'Admin'), getTasksByFaculty);
router.get('/course/:courseId/statistics', authorize('Faculty', 'Admin'), getTaskStatistics);
router.get('/course/:courseId/overdue', authorize('Faculty', 'Admin'), getOverdueTasks);
router.get('/:id', getTaskById);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), taskValidation, createTask);
router.post('/auto-generate', authorize('Faculty', 'Admin'), autoGenerateTasks);
router.post('/:id/submit', authorize('Student'), submitTask);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateTask);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteTask);

module.exports = router;
