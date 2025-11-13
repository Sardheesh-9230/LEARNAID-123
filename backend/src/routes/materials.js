const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getMaterialsByChapter,
  getMaterialsBySubject,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
  recordDownload,
  downloadMaterialFile,
  viewMaterialFile
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images, videos
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|jpg|jpeg|png|gif|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents, images, and videos are allowed'));
    }
  }
});

// Get materials by subject
router.get('/subjects/:subjectId/materials', protect, getMaterialsBySubject);

// Get materials by chapter
router.get('/chapters/:chapterId/materials', protect, getMaterialsByChapter);

// Create material in a chapter (with file upload)
router.post('/chapters/:chapterId/materials', protect, authorize('Faculty', 'Admin'), upload.single('file'), createMaterial);

// Reorder materials in a chapter
router.put('/chapters/:chapterId/materials/reorder', protect, authorize('Faculty', 'Admin'), reorderMaterials);

// Get single material
router.get('/:id', protect, getMaterialById);

// View material file (open in browser)
router.get('/:id/view', protect, viewMaterialFile);

// Download material file
router.get('/:id/file', protect, downloadMaterialFile);

// Update material (with optional file upload)
router.put('/:id', protect, authorize('Faculty', 'Admin'), upload.single('file'), updateMaterial);

// Delete material
router.delete('/:id', protect, authorize('Faculty', 'Admin'), deleteMaterial);

// Record download
router.post('/:id/download', protect, recordDownload);

module.exports = router;
