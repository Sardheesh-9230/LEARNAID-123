const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         totalDepartments:
 *                           type: number
 *                         totalSubjects:
 *                           type: number
 *                         totalActiveUsers:
 *                           type: number
 *                     userStats:
 *                       type: object
 *                     departmentStats:
 *                       type: array
 *                     recentActivities:
 *                       type: array
 */
router.get('/dashboard', protect, authorize('Admin'), analyticsController.getDashboardAnalytics);

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Analytics timeframe
 *     responses:
 *       200:
 *         description: User analytics data
 */
router.get('/users', protect, authorize('Admin'), analyticsController.getUserAnalytics);

/**
 * @swagger
 * /api/analytics/departments/{id}:
 *   get:
 *     summary: Get department analytics
 *     tags: [Analytics]
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
 *         description: Department analytics data
 */
router.get('/departments/:id', protect, analyticsController.getDepartmentAnalytics);

/**
 * @swagger
 * /api/analytics/activities:
 *   get:
 *     summary: Get activity logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *     responses:
 *       200:
 *         description: Activity logs
 */
router.get('/activities', protect, authorize('Admin'), analyticsController.getActivityLogs);

module.exports = router;