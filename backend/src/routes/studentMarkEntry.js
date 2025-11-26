const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const {
  enterStudentMarks,
  bulkEnterMarks,
  getMarksBySubjectAndExam,
  getStudentSubjectMarks,
  getFacultyMarksSummary,
  updateMarkStatus,
  deleteMarkEntry,
  getMarkEntryStatistics
} = require('../controllers/studentMarkEntryController');

const router = express.Router();

// Validation middleware
const markEntryValidation = [
  body('student')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('subject')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('examType')
    .notEmpty()
    .withMessage('Exam type is required')
    .isIn(['CIA1', 'CIA2', 'MODEL'])
    .withMessage('Exam type must be CIA1, CIA2, or MODEL'),
  body('marksObtained')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Marks must be a positive number'),
  body('totalMarks')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Total marks must be at least 1'),
  body('remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
  body('isAbsent')
    .optional()
    .isBoolean()
    .withMessage('isAbsent must be a boolean'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  body('semester')
    .optional()
    .isIn(['Odd', 'Even'])
    .withMessage('Semester must be Odd or Even')
];

const bulkMarkEntryValidation = [
  body('subject')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  body('examType')
    .notEmpty()
    .withMessage('Exam type is required')
    .isIn(['CIA1', 'CIA2', 'MODEL'])
    .withMessage('Exam type must be CIA1, CIA2, or MODEL'),
  body('marksData')
    .isArray({ min: 1 })
    .withMessage('Marks data must be a non-empty array'),
  body('marksData.*.student')
    .notEmpty()
    .withMessage('Student ID is required for each entry')
    .isMongoId()
    .withMessage('Invalid student ID in marks data'),
  body('marksData.*.marksObtained')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Marks must be a positive number'),
  body('marksData.*.isAbsent')
    .optional()
    .isBoolean()
    .withMessage('isAbsent must be a boolean')
];

// Apply authentication to all routes
router.use(protect);

// GET routes

/**
 * @route   GET /api/student-marks/subject/:subjectId/exam/:examType
 * @desc    Get marks by subject and exam type
 * @access  Private/Faculty/Admin
 */
router.get('/subject/:subjectId/exam/:examType', 
  authorize('Faculty', 'Admin'), 
  getMarksBySubjectAndExam
);

/**
 * @route   GET /api/student-marks/student/:studentId/subject/:subjectId
 * @desc    Get student's marks for all exams in a subject
 * @access  Private/Faculty/Admin/Student (own marks)
 */
router.get('/student/:studentId/subject/:subjectId', 
  getStudentSubjectMarks
);

/**
 * @route   GET /api/student-marks/faculty/summary
 * @desc    Get faculty's mark entry summary
 * @access  Private/Faculty/Admin
 */
router.get('/faculty/summary', 
  authorize('Faculty', 'Admin'), 
  getFacultyMarksSummary
);

/**
 * @route   GET /api/student-marks/statistics
 * @desc    Get mark entry statistics for dashboard
 * @access  Private/Faculty/Admin
 */
router.get('/statistics', 
  authorize('Faculty', 'Admin'), 
  getMarkEntryStatistics
);

// POST routes

/**
 * @route   POST /api/student-marks
 * @desc    Enter marks for a student
 * @access  Private/Faculty/Admin
 */
router.post('/', 
  authorize('Faculty', 'Admin'), 
  markEntryValidation, 
  enterStudentMarks
);

/**
 * @route   POST /api/student-marks/bulk
 * @desc    Bulk enter marks for multiple students
 * @access  Private/Faculty/Admin
 */
router.post('/bulk', 
  authorize('Faculty', 'Admin'), 
  bulkMarkEntryValidation, 
  bulkEnterMarks
);

// PUT routes

/**
 * @route   PUT /api/student-marks/:id/status
 * @desc    Update marks status (Draft/Final/Published)
 * @access  Private/Faculty/Admin
 */
router.put('/:id/status', 
  authorize('Faculty', 'Admin'),
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['Draft', 'Final', 'Published'])
      .withMessage('Status must be Draft, Final, or Published')
  ],
  updateMarkStatus
);

// DELETE routes

/**
 * @route   DELETE /api/student-marks/:id
 * @desc    Delete mark entry
 * @access  Private/Faculty/Admin
 */
router.delete('/:id', 
  authorize('Faculty', 'Admin'), 
  deleteMarkEntry
);

module.exports = router;