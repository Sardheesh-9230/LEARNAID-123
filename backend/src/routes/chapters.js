const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const {
  createChapter,
  getChapters,
  getChapterById,
  getChaptersByCourse,
  updateChapter,
  deleteChapter,
  uploadChapterPDF,
  addChapterResource,
  reorderChapters,
  updateChapterStatus
} = require('../controllers/chapterController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chapters/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chapter-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs only for chapter uploads
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Validation rules
const chapterValidation = [
  body('title').notEmpty().withMessage('Chapter title is required'),
  body('chapterNumber').isInt({ min: 1 }).withMessage('Valid chapter number is required'),
  body('course').notEmpty().withMessage('Course ID is required')
];

// Protected routes
router.use(protect);

// GET routes
router.get('/', getChapters);
router.get('/course/:courseId', getChaptersByCourse);
router.get('/:id', getChapterById);

// POST routes
router.post('/', authorize('Faculty', 'Admin'), chapterValidation, createChapter);
router.post('/:id/upload-pdf', authorize('Faculty', 'Admin'), upload.single('pdf'), uploadChapterPDF);
router.post('/:id/resources', authorize('Faculty', 'Admin'), upload.single('file'), addChapterResource);

// PUT routes
router.put('/:id', authorize('Faculty', 'Admin'), updateChapter);
router.put('/reorder', authorize('Faculty', 'Admin'), reorderChapters);

// PATCH routes
router.patch('/:id/status', authorize('Faculty', 'Admin'), updateChapterStatus);

// DELETE routes
router.delete('/:id', authorize('Faculty', 'Admin'), deleteChapter);

module.exports = router;
