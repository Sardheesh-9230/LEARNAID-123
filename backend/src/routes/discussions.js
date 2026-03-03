const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const { protect } = require('../middleware/auth');

// All routes require auth
router.use(protect);

// ─── List discussions for a subject ─────────────────────────────────────────
// GET /api/discussions?subjectId=<id>
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'subjectId is required' });
    }
    const discussions = await Discussion.find({ subject: subjectId })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: discussions });
  } catch (err) {
    console.error('GET /discussions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Get all subjects that have discussions (for faculty overview) ───────────
// GET /api/discussions/faculty/overview  ← MUST be before /:id to avoid shadowing
router.get('/faculty/overview', async (req, res) => {
  try {
    const overview = await Discussion.aggregate([
      { $group: {
        _id: '$subject',
        subjectName: { $first: '$subjectName' },
        totalDiscussions: { $sum: 1 },
        openDiscussions: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        lastActivity: { $max: '$updatedAt' }
      }},
      { $sort: { lastActivity: -1 } }
    ]);
    res.json({ success: true, data: overview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Get single discussion (with replies) ───────────────────────────────────
// GET /api/discussions/:id
router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id).lean();
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    res.json({ success: true, data: discussion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Create a discussion ─────────────────────────────────────────────────────
// POST /api/discussions
router.post('/', async (req, res) => {
  try {
    const { title, content, subjectId, subjectName } = req.body;
    if (!title || !content || !subjectId) {
      return res.status(400).json({ success: false, message: 'title, content and subjectId are required' });
    }
    const discussion = await Discussion.create({
      title: title.trim(),
      content: content.trim(),
      subject: subjectId,
      subjectName: subjectName || '',
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role
    });
    res.status(201).json({ success: true, data: discussion });
  } catch (err) {
    console.error('POST /discussions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Add a reply ─────────────────────────────────────────────────────────────
// POST /api/discussions/:id/replies
router.post('/:id/replies', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    discussion.replies.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: text.trim()
    });
    await discussion.save();
    const saved = discussion.toObject();
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error('POST /discussions/:id/replies error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Update discussion status (faculty only: resolve / pin) ─────────────────
// PATCH /api/discussions/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, isPinned } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    // Only author or faculty/admin can update
    const isOwner = discussion.author.toString() === req.user._id.toString();
    const isFacultyOrAdmin = ['Faculty', 'Admin', 'Staff'].includes(req.user.role);
    if (!isOwner && !isFacultyOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (status) discussion.status = status;
    if (typeof isPinned === 'boolean') discussion.isPinned = isPinned;
    await discussion.save();
    res.json({ success: true, data: discussion.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Delete discussion ───────────────────────────────────────────────────────
// DELETE /api/discussions/:id
router.delete('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }
    const isOwner = discussion.author.toString() === req.user._id.toString();
    const isFacultyOrAdmin = ['Faculty', 'Admin', 'Staff'].includes(req.user.role);
    if (!isOwner && !isFacultyOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await discussion.deleteOne();
    res.json({ success: true, message: 'Discussion deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
