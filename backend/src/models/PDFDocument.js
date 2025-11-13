const mongoose = require('mongoose');

/**
 * PDFDocument Model
 * Represents uploaded PDF/documents for MCQ generation and processing
 */
const pdfDocumentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  filename: {
    type: String,
    required: [true, 'Stored filename is required'],
    unique: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  
  // Content information
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'error'],
    default: 'uploaded'
  },
  
  // Text extraction
  extractedText: {
    type: String
  },
  textExtractionDate: Date,
  
  // MCQ generation
  mcqGenerated: {
    type: Boolean,
    default: false
  },
  mcqCount: {
    type: Number,
    default: 0,
    min: [0, 'MCQ count cannot be negative']
  },
  mcqGenerationDate: Date,
  
  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user is required']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastProcessed: Date,
  
  // Access tracking
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
pdfDocumentSchema.index({ uploadedBy: 1 });
pdfDocumentSchema.index({ subject: 1 });
pdfDocumentSchema.index({ status: 1 });
pdfDocumentSchema.index({ uploadDate: -1 });
pdfDocumentSchema.index({ filename: 1 });

// Virtual for formatted file size
pdfDocumentSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file type
pdfDocumentSchema.virtual('fileType').get(function() {
  const ext = this.originalName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF Document';
    case 'doc':
    case 'docx': return 'Word Document';
    case 'ppt':
    case 'pptx': return 'PowerPoint Presentation';
    default: return 'Document';
  }
});

// Method to increment view count
pdfDocumentSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment download count
pdfDocumentSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to update processing status
pdfDocumentSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  this.lastProcessed = new Date();
  
  // Update additional fields based on status
  Object.assign(this, additionalData);
  
  return this.save();
};

// Static method to find by user
pdfDocumentSchema.statics.findByUser = function(userId) {
  return this.find({ uploadedBy: userId })
    .populate('uploadedBy', 'name email')
    .sort({ uploadDate: -1 });
};

// Static method to find by subject
pdfDocumentSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: new RegExp(subject, 'i') })
    .populate('uploadedBy', 'name email')
    .sort({ uploadDate: -1 });
};

// Pre-save middleware
pdfDocumentSchema.pre('save', function(next) {
  // Set lastProcessed date when status changes
  if (this.isModified('status') && this.status !== 'uploaded') {
    this.lastProcessed = new Date();
  }
  
  next();
});

const PDFDocument = mongoose.model('PDFDocument', pdfDocumentSchema);

module.exports = PDFDocument;