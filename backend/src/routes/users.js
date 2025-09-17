const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - role
 *         - department
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: Full name
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         role:
 *           type: string
 *           enum: [Student, Faculty, Staff, Admin]
 *           description: User role
 *         department:
 *           type: string
 *           description: Department ID
 *         phone:
 *           type: string
 *           description: Phone number
 *         address:
 *           type: string
 *           description: Address
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Account status
 *         section:
 *           type: string
 *           description: Section (for students)
 *         batch:
 *           type: string
 *           description: Batch year (for students)
 *         semester:
 *           type: number
 *           description: Current semester (for students)
 *         guardianName:
 *           type: string
 *           description: Guardian name (for students)
 *         guardianPhone:
 *           type: string
 *           description: Guardian phone (for students)
 *         designation:
 *           type: string
 *           description: Job designation (for faculty/staff)
 *         qualification:
 *           type: string
 *           description: Educational qualification (for faculty)
 *         experience:
 *           type: number
 *           description: Years of experience (for faculty)
 *         specialization:
 *           type: array
 *           items:
 *             type: string
 *           description: Areas of specialization (for faculty)
 *         enrolledSubjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Enrolled subject IDs (for students)
 *         assignedSubjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Assigned subject IDs (for faculty)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastLogin:
 *           type: string
 *           format: date-time
 */

// Validation middleware
const createUserValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['Student', 'Faculty', 'Staff', 'Admin']).withMessage('Invalid role'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters')
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status')
];

const allocateSubjectsValidation = [
  body('subjectIds').isArray({ min: 1 }).withMessage('At least one subject ID is required'),
  body('subjectIds.*').isMongoId().withMessage('Valid subject IDs are required')
];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Student, Faculty, Staff, Admin]
 *         description: Filter by user role
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or email
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', protect, authorize('Admin', 'Faculty'), userController.getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               - email
 *               - password
 *               - role
 *               - department
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [Student, Faculty, Staff, Admin]
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               section:
 *                 type: string
 *                 description: Required for students
 *               batch:
 *                 type: string
 *                 description: Required for students
 *               guardianName:
 *                 type: string
 *                 description: Optional for students
 *               guardianPhone:
 *                 type: string
 *                 description: Optional for students
 *               designation:
 *                 type: string
 *                 description: Required for faculty/staff
 *               qualification:
 *                 type: string
 *                 description: Required for faculty
 *               experience:
 *                 type: number
 *                 description: Required for faculty
 *               specialization:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional for faculty
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/', protect, authorize('Admin'), createUserValidation, userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', protect, authorize('Admin'), updateUserValidation, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', protect, authorize('Admin'), userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/allocate-subjects:
 *   post:
 *     summary: Allocate subjects to a student
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectIds
 *             properties:
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of subject IDs to allocate
 *     responses:
 *       200:
 *         description: Subjects allocated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Student not found
 */
router.post('/:id/allocate-subjects', protect, authorize('Admin', 'Faculty'), allocateSubjectsValidation, userController.allocateSubjects);

/**
 * @swagger
 * /api/users/{id}/assign-subjects:
 *   post:
 *     summary: Assign subjects to a faculty member
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Faculty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectIds
 *             properties:
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of subject IDs to assign
 *     responses:
 *       200:
 *         description: Subjects assigned successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Faculty not found
 */
router.post('/:id/assign-subjects', protect, authorize('Admin'), allocateSubjectsValidation, userController.assignSubjects);

/**
 * @swagger
 * /api/users/bulk/create:
 *   post:
 *     summary: Bulk create users from CSV
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with user data
 *     responses:
 *       200:
 *         description: Users created successfully
 *       400:
 *         description: Invalid file format
 */
router.post('/bulk/create', protect, authorize('Admin'), userController.bulkCreateUsers);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     usersByRole:
 *                       type: object
 *                     usersByDepartment:
 *                       type: object
 */
router.get('/stats', protect, authorize('Admin'), userController.getUserStats);

module.exports = router;