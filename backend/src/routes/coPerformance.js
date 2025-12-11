const express = require('express');
const {
  analyzeLaggingCOsAndAssignTasks,
  getStudentCOPerformance,
  getSubjectCOAnalysis,
  analyzeCOPerformanceByExam,
  bulkAssignCOTasks
} = require('../controllers/coPerformanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/co-performance/analyze:
 *   post:
 *     summary: Analyze CO performance and assign improvement tasks
 *     tags: [CO Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - subjectId
 *             properties:
 *               studentId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               academicYear:
 *                 type: string
 *                 default: "2024-2025"
 *               threshold:
 *                 type: number
 *                 default: 50
 *     responses:
 *       200:
 *         description: CO performance analysis completed
 *       404:
 *         description: Student or subject not found
 *       500:
 *         description: Server error
 */
router.post('/analyze-lagging-cos', protect, analyzeLaggingCOsAndAssignTasks);

/**
 * @swagger
 * /api/co-performance/student/{studentId}/subject/{subjectId}:
 *   get:
 *     summary: Get CO performance for a specific student and subject
 *     tags: [CO Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *           default: "2024-2025"
 *     responses:
 *       200:
 *         description: CO performance data retrieved
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/student/:studentId/subject/:subjectId', protect, getStudentCOPerformance);

/**
 * @swagger
 * /api/co-performance/subject/{subjectId}/analysis:
 *   get:
 *     summary: Get subject-wise CO analysis for all students
 *     tags: [CO Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *           default: "2024-2025"
 *     responses:
 *       200:
 *         description: Subject CO analysis data retrieved
 *       500:
 *         description: Server error
 */
router.get('/subject/:subjectId/analysis', protect, getSubjectCOAnalysis);

/**
 * @swagger
 * /api/co-performance/analyze-by-exam:
 *   post:
 *     summary: Analyze CO performance for all students by specific exam type
 *     tags: [CO Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectId
 *               - examType
 *             properties:
 *               subjectId:
 *                 type: string
 *               examType:
 *                 type: string
 *                 enum: [CIA1, CIA2, MODEL]
 *               threshold:
 *                 type: number
 *                 default: 50
 *               academicYear:
 *                 type: string
 *                 default: "2024-2025"
 *               semester:
 *                 type: string
 *                 enum: [Odd, Even]
 *     responses:
 *       200:
 *         description: CO performance analysis by exam completed
 *       404:
 *         description: Subject not found or no marks data
 *       500:
 *         description: Server error
 */
router.post('/analyze-by-exam', protect, analyzeCOPerformanceByExam);

/**
 * @swagger
 * /api/co-performance/bulk-assign-tasks:
 *   post:
 *     summary: Bulk assign improvement tasks to students based on weak COs
 *     tags: [CO Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectId
 *               - examType
 *               - studentsData
 *             properties:
 *               subjectId:
 *                 type: string
 *               examType:
 *                 type: string
 *                 enum: [CIA1, CIA2, MODEL]
 *               studentsData:
 *                 type: array
 *               threshold:
 *                 type: number
 *               academicYear:
 *                 type: string
 *               semester:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tasks assigned successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Server error
 */
router.post('/bulk-assign-tasks', protect, bulkAssignCOTasks);

module.exports = router;