const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/pdfs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs, Word documents, and PowerPoint files
  const allowedTypes = /pdf|doc|docx|ppt|pptx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
    file.mimetype.includes('pdf') || 
    file.mimetype.includes('document') || 
    file.mimetype.includes('presentation');
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, and PowerPoint files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * @swagger
 * /api/pdf/upload:
 *   post:
 *     summary: Upload PDF/Document for MCQ generation
 *     tags: [PDF]
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
 *                 description: PDF, Word, or PowerPoint file
 *               subject:
 *                 type: string
 *                 description: Subject name or ID
 *               description:
 *                 type: string
 *                 description: File description
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or missing required fields
 */
router.post('/upload', protect, authorize('Faculty', 'Admin'), upload.single('file'), async (req, res) => {
  try {
    console.log('📥 PDF Upload Request:', {
      hasFile: !!req.file,
      body: req.body,
      user: req.user?._id
    });

    const { subject, description } = req.body;
    
    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!subject || subject.trim().length === 0) {
      console.error('❌ Subject is required but not provided');
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    console.log('📄 PDF Upload Details:', {
      file: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      type: req.file.mimetype,
      subject: subject,
      uploadedBy: req.user._id
    });

    // Create a PDF document record in MongoDB
    const pdfData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      subject: subject.trim(),
      description: description?.trim() || '',
      uploadedBy: req.user._id,
      uploadDate: new Date(),
      status: 'uploaded',
      // MCQ generation status
      mcqGenerated: false,
      mcqCount: 0
    };

    // For now, we'll store this as a simple document
    // In a real app, you might want to create a PDFDocument model
    const PDFDocument = require('../models/PDFDocument');
    const pdfDoc = await PDFDocument.create(pdfData);

    console.log('✅ PDF uploaded successfully:', pdfDoc._id);

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        id: pdfDoc._id,
        filename: pdfDoc.filename,
        originalName: pdfDoc.originalName,
        subject: pdfDoc.subject,
        uploadDate: pdfDoc.uploadDate,
        status: pdfDoc.status
      }
    });

  } catch (error) {
    console.error('❌ Error uploading PDF:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading PDF',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/pdf:
 *   get:
 *     summary: Get all uploaded PDFs for the authenticated user
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of uploaded PDFs
 */
router.get('/', protect, async (req, res) => {
  try {
    console.log('📚 Fetching PDFs for user:', req.user?._id)
    
    const PDFDocument = require('../models/PDFDocument');
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'Faculty') {
      // Faculty can see PDFs they uploaded or PDFs for subjects they teach
      query = {
        $or: [
          { uploadedBy: req.user._id },
          // You can add subject-based filtering here if needed
        ]
      };
    } else if (req.user.role === 'Admin') {
      // Admin can see all PDFs
      query = {};
    } else {
      // Students can see PDFs for their enrolled subjects
      query = { subject: { $in: req.user.enrolledSubjects || [] } };
    }
    
    const pdfs = await PDFDocument.find(query)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 })
      .lean();
    
    console.log(`✅ Found ${pdfs.length} PDFs for user ${req.user.name}`)
    
    res.json({
      success: true,
      data: pdfs.map(pdf => ({
        id: pdf._id,
        filename: pdf.filename,
        originalName: pdf.originalName,
        subject: pdf.subject,
        uploadedBy: pdf.uploadedBy,
        uploadDate: pdf.uploadDate,
        status: pdf.status,
        fileSize: pdf.fileSize
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fetching PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PDFs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/pdf/download/{id}:
 *   get:
 *     summary: Download uploaded PDF by ID
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PDF document ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: PDF not found
 */
router.get('/download/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the PDF document
    const PDFDocument = require('../models/PDFDocument');
    const pdfDoc = await PDFDocument.findById(id);
    
    if (!pdfDoc) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(pdfDoc.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on disk'
      });
    }
    
    // Increment download count
    await pdfDoc.incrementDownloadCount();
    
    // Set headers for PDF download
    res.setHeader('Content-Type', pdfDoc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfDoc.originalName}"`);
    res.setHeader('Content-Length', pdfDoc.fileSize);
    
    // Stream the file
    const stream = fs.createReadStream(pdfDoc.filePath);
    stream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading PDF',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/pdf/{id}:
 *   get:
 *     summary: Get PDF document info by ID
 *     tags: [PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PDF document ID
 *     responses:
 *       200:
 *         description: PDF document information
 *       404:
 *         description: PDF not found
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const PDFDocument = require('../models/PDFDocument');
    const pdfDoc = await PDFDocument.findById(id)
      .populate('uploadedBy', 'name email');
    
    if (!pdfDoc) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: pdfDoc
    });
    
  } catch (error) {
    console.error('❌ Error fetching PDF info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching PDF information',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  if (error.message.includes('Only PDF, Word, and PowerPoint files are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Only PDF, Word, and PowerPoint files are allowed.'
    });
  }
  
  next(error);
});

module.exports = router;