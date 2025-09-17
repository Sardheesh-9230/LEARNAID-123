const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         _id:
 *           type: string
 *           description: Department ID
 *         name:
 *           type: string
 *           description: Department name
 *         code:
 *           type: string
 *           description: Department code (unique)
 *         description:
 *           type: string
 *           description: Department description
 *         head:
 *           type: string
 *           description: Department head (Faculty ID)
 *         faculty:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of faculty IDs
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of subject IDs
 *         isActive:
 *           type: boolean
 *           description: Department status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Validation middleware
const createDepartmentValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('head').optional().isMongoId().withMessage('Valid head faculty ID is required')
];

const updateDepartmentValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('head').optional().isMongoId().withMessage('Valid head faculty ID is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments with filtering
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of departments
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
 *                     $ref: '#/components/schemas/Department'
 */
router.get('/', protect, departmentController.getDepartments);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               head:
 *                 type: string
 *                 description: Faculty ID
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Department with this code already exists
 */
router.post('/', protect, authorize('Admin'), createDepartmentValidation, departmentController.createDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department details
 *       404:
 *         description: Department not found
 */
router.get('/:id', protect, departmentController.getDepartmentById);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               head:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 */
router.put('/:id', protect, authorize('Admin'), updateDepartmentValidation, departmentController.updateDepartment);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 *       400:
 *         description: Cannot delete department with active users or subjects
 */
router.delete('/:id', protect, authorize('Admin'), departmentController.deleteDepartment);

/**
 * @swagger
 * /api/departments/{id}/faculty:
 *   get:
 *     summary: Get all faculty in a department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: List of faculty members
 */
router.get('/:id/faculty', protect, departmentController.getDepartmentFaculty);

/**
 * @swagger
 * /api/departments/{id}/students:
 *   get:
 *     summary: Get all students in a department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Filter by section
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by batch
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Filter by semester
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/:id/students', protect, departmentController.getDepartmentStudents);

/**
 * @swagger
 * /api/departments/{id}/subjects:
 *   get:
 *     summary: Get all subjects in a department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Filter by semester
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/:id/subjects', protect, departmentController.getDepartmentSubjects);

/**
 * @swagger
 * /api/departments/{id}/stats:
 *   get:
 *     summary: Get department statistics
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department statistics
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
 *                     totalStudents:
 *                       type: number
 *                     totalFaculty:
 *                       type: number
 *                     totalSubjects:
 *                       type: number
 *                     studentsBySection:
 *                       type: object
 *                     studentsBySemester:
 *                       type: object
 */
router.get('/:id/stats', protect, departmentController.getDepartmentStats);

module.exports = router;