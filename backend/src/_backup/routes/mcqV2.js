const express = require('express');
const {
  getFacultySubjects,
  getSubjectChapters,
  getChapterMaterials,
  generateMCQs,
  getMCQSessions,
  getMCQSession
} = require('../controllers/mcqControllerV2');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/mcq/subjects
 * @desc    Get faculty's subjects for MCQ generation
 * @access  Private (Faculty, Admin)
 */
router.get('/subjects', protect, authorize('Faculty', 'Admin'), getFacultySubjects);

/**
 * @route   GET /api/mcq/subjects/:subjectId/chapters
 * @desc    Get chapters for a subject
 * @access  Private (Faculty, Admin)
 */
router.get('/subjects/:subjectId/chapters', protect, authorize('Faculty', 'Admin'), getSubjectChapters);

/**
 * @route   GET /api/mcq/chapters/:chapterId/materials
 * @desc    Get PDF materials for a chapter
 * @access  Private (Faculty, Admin)
 */
router.get('/chapters/:chapterId/materials', protect, authorize('Faculty', 'Admin'), getChapterMaterials);

/**
 * @route   POST /api/mcq/generate
 * @desc    Generate MCQs from selected material with topic
 * @access  Private (Faculty, Admin)
 */
router.post('/generate', protect, authorize('Faculty', 'Admin'), generateMCQs);

/**
 * @route   GET /api/mcq/sessions
 * @desc    Get faculty's MCQ generation history
 * @access  Private (Faculty, Admin)
 */
router.get('/sessions', protect, authorize('Faculty', 'Admin'), getMCQSessions);

/**
 * @route   GET /api/mcq/sessions/:sessionId
 * @desc    Get specific MCQ session details
 * @access  Private (Faculty, Admin)
 */
router.get('/sessions/:sessionId', protect, authorize('Faculty, Admin'), getMCQSession);

module.exports = router;
