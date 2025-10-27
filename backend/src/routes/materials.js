const express = require('express');
const router = express.Router();
const {
  getMaterialsByChapter,
  getMaterialsBySubject,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
  recordDownload
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');

// Get materials by subject
router.get('/subjects/:subjectId/materials', protect, getMaterialsBySubject);

// Get materials by chapter
router.get('/chapters/:chapterId/materials', protect, getMaterialsByChapter);

// Create material in a chapter
router.post('/chapters/:chapterId/materials', protect, authorize('Faculty', 'Admin'), createMaterial);

// Reorder materials in a chapter
router.put('/chapters/:chapterId/materials/reorder', protect, authorize('Faculty', 'Admin'), reorderMaterials);

// Get single material
router.get('/:id', protect, getMaterialById);

// Update material
router.put('/:id', protect, authorize('Faculty', 'Admin'), updateMaterial);

// Delete material
router.delete('/:id', protect, authorize('Faculty', 'Admin'), deleteMaterial);

// Record download
router.post('/:id/download', protect, recordDownload);

module.exports = router;
