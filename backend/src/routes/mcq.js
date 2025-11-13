const express = require('express');
const router = express.Router();
const { generateMCQs, extractTopics } = require('../controllers/mcqController');
const { protect, authorize } = require('../middleware/auth');

// Generate MCQs from material
router.post('/generate', protect, authorize('Faculty', 'Admin'), generateMCQs);

// Extract topics from material
router.post('/extract-topics', protect, authorize('Faculty', 'Admin'), extractTopics);

module.exports = router;
