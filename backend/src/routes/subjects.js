const express = require('express');
const { body } = require('express-validator');
const subjectController = require('../controllers/subjectController');
const chapterController = require('../controllers/subjectChapterController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - department
 *         - credits
 *         - semester
 *       properties:
 *         _id:
 *           type: string
 *           description: Subject ID
 *         name:
 *           type: string
 *           description: Subject name
 *         code:
 *           type: string
 *           description: Subject code (unique within department)
 *         description:
 *           type: string
 *           description: Subject description
 *         department:
 *           type: string
 *           description: Department ID
 *         faculty:
 *           type: string
 *           description: Assigned faculty ID
 *         credits:
 *           type: number
 *           description: Credit hours
 *         semester:
 *           type: number
 *           description: Semester number
 *         isActive:
 *           type: boolean
 *           description: Subject status
 *         prerequisites:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of prerequisite subject IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Validation middleware
const createSubjectValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('faculty').optional().isMongoId().withMessage('Valid faculty ID is required'),
  body('prerequisites').optional().isArray().withMessage('Prerequisites must be an array'),
  body('prerequisites.*').optional().isMongoId().withMessage('Valid prerequisite subject IDs are required')
];

const updateSubjectValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
  body('credits').optional().isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('faculty').optional().isMongoId().withMessage('Valid faculty ID is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('prerequisites').optional().isArray().withMessage('Prerequisites must be an array'),
  body('prerequisites.*').optional().isMongoId().withMessage('Valid prerequisite subject IDs are required')
];

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all subjects with filtering
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Filter by semester
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Filter by assigned faculty ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or code
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/', protect, subjectController.getSubjects);

/**
 * @swagger
 * /api/subjects/student/my-subjects:
 *   get:
 *     summary: Get student's enrolled subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's enrolled subjects
 */
router.get('/student/my-subjects', protect, authorize('Student'), subjectController.getMySubjects);

/**
 * @swagger
 * /api/subjects/faculty/my-subjects:
 *   get:
 *     summary: Get faculty's assigned subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty's assigned subjects
 */
router.get('/faculty/my-subjects', protect, authorize('Faculty', 'Admin'), subjectController.getFacultySubjects);

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - department
 *               - credits
 *               - semester
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               department:
 *                 type: string
 *               credits:
 *                 type: number
 *               semester:
 *                 type: number
 *               description:
 *                 type: string
 *               faculty:
 *                 type: string
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
router.post('/', protect, authorize('Admin'), createSubjectValidation, subjectController.createSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject details
 */
router.get('/:id', protect, subjectController.getSubjectById);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject updated successfully
 */
router.put('/:id', protect, authorize('Admin'), updateSubjectValidation, subjectController.updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 */
router.delete('/:id', protect, authorize('Admin'), subjectController.deleteSubject);

/**
 * @swagger
 * /api/subjects/{id}/faculty:
 *   post:
 *     summary: Assign faculty to subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facultyId
 *             properties:
 *               facultyId:
 *                 type: string
 *                 description: Faculty user ID
 *               isPrimary:
 *                 type: boolean
 *                 description: Is this the primary faculty for the subject
 *               isExternal:
 *                 type: boolean
 *                 description: Is this an external faculty
 *     responses:
 *       200:
 *         description: Faculty assigned successfully
 */
router.post('/:id/faculty', protect, authorize('Admin'), subjectController.assignFacultyToSubject);

/**
 * @swagger
 * /api/subjects/{id}/faculty/{facultyId}:
 *   delete:
 *     summary: Remove faculty from subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Faculty user ID
 *     responses:
 *       200:
 *         description: Faculty removed successfully
 */
router.delete('/:id/faculty/:facultyId', protect, authorize('Admin'), subjectController.removeFacultyFromSubject);

// Sync student enrollments - Auto-enroll students based on matching criteria
router.post('/sync-enrollments', protect, authorize('Admin', 'Faculty'), subjectController.syncStudentEnrollments);

// ========================================
// CHAPTER ROUTES (Nested under subjects)
// ========================================

// Get all chapters for a subject
router.get('/:subjectId/chapters', protect, chapterController.getChaptersBySubject);

// Create chapter for a subject
router.post('/:subjectId/chapters', protect, authorize('Faculty', 'Admin'), chapterController.createChapter);

// Reorder chapters in a subject
router.put('/:subjectId/chapters/reorder', protect, authorize('Faculty', 'Admin'), chapterController.reorderChapters);

// Get single chapter
router.get('/chapters/:id', protect, chapterController.getChapterById);

// Update chapter
router.put('/chapters/:id', protect, authorize('Faculty', 'Admin'), chapterController.updateChapter);

// Delete chapter
router.delete('/chapters/:id', protect, authorize('Faculty', 'Admin'), chapterController.deleteChapter);

module.exports = router;