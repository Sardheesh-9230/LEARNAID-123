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
  body('phone').optional({ nullable: true, checkFalsy: true }).matches(/^\+?[1-9][\d\s\-()]{9,15}$/).withMessage('Valid phone number is required'),
  body('address').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters')
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional({ nullable: true, checkFalsy: true }).matches(/^\+?[1-9][\d\s\-()]{9,15}$/).withMessage('Valid phone number is required'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  // Role-specific field validations
  body('designation').optional().isIn(['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer', 'Head of Department']).withMessage('Invalid designation'),
  body('qualification').optional().trim().isLength({ max: 200 }).withMessage('Qualification must be less than 200 characters'),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
  body('specialization').optional().isArray().withMessage('Specialization must be an array'),
  body('section').optional().isIn(['A', 'B', 'C']).withMessage('Section must be A, B, or C'),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('batch').optional().matches(/^20\d{2}$/).withMessage('Batch must be a valid year (e.g., 2024)'),
  // Additional student fields
  body('guardianName').optional({ nullable: true, checkFalsy: true }).trim().isLength({ min: 2, max: 100 }).withMessage('Guardian name must be between 2 and 100 characters'),
  body('guardianPhone').optional({ nullable: true, checkFalsy: true }).matches(/^\+?[1-9][\d\s\-()]{9,15}$/).withMessage('Valid guardian phone number is required'),
  body('studentId').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Student ID must be between 3 and 20 characters'),
  body('gpa').optional().isFloat({ min: 0, max: 10 }).withMessage('GPA must be between 0 and 10'),
  // Additional faculty fields
  body('employeeId').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Employee ID must be between 3 and 20 characters')
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
 * /api/users/students:
 *   get:
 *     summary: Get all students
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', protect, authorize('Faculty', 'Admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const students = await User.find({ role: 'Student' })
      .select('name email studentId department year section')
      .populate('department', 'name code')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      users: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
});

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
 * /api/users/{id}/password:
 *   put:
 *     summary: Change user password (Admin only)
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
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minimum: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       404:
 *         description: User not found
 */
router.put('/:id/password', protect, authorize('Admin'), userController.changeUserPassword);

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
 * /api/users/{id}/unassign-subjects:
 *   delete:
 *     summary: Remove subjects from a faculty member
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
 *                 description: Array of subject IDs to unassign
 *     responses:
 *       200:
 *         description: Subjects unassigned successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Faculty not found
 */
router.delete('/:id/unassign-subjects', protect, authorize('Admin'), allocateSubjectsValidation, userController.unassignSubjects);

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