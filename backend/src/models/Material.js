const mongoose = require('mongoose');

/**
 * Material Model
 * Represents learning materials (PDFs, videos, links, documents) within a chapter
 */
const materialSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Chapter is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: [200, 'Material title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['PDF', 'Video', 'Link', 'Document', 'PPT', 'Image', 'Other'],
    required: [true, 'Material type is required']
  },
  
  // File reference (for uploaded materials)
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  
  // URL (for external links, videos, etc.)
  url: {
    type: String,
    maxlength: [500, 'URL cannot exceed 500 characters'],
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Basic URL validation
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  
  // File metadata (stored when file is uploaded)
  fileMetadata: {
    originalName: String,
    mimeType: String,
    size: Number, // in bytes
    filePath: String
  },
  
  // Display order within the chapter
  order: {
    type: Number,
    default: 1,
    min: [1, 'Order must be at least 1']
  },
  
  // Duration (for videos or estimated reading time in minutes)
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Published'
  },
  
  // Access control
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Download settings
  allowDownload: {
    type: Boolean,
    default: true
  },
  
  // View count
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Download count
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // Tags for searchability
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
materialSchema.index({ chapter: 1, order: 1 });
materialSchema.index({ subject: 1 });
materialSchema.index({ type: 1 });
materialSchema.index({ status: 1 });
materialSchema.index({ createdBy: 1 });
materialSchema.index({ tags: 1 });

// Virtual for formatted file size
materialSchema.virtual('formattedSize').get(function() {
  if (!this.fileMetadata || !this.fileMetadata.size) return 'N/A';
  
  const bytes = this.fileMetadata.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to increment view count
materialSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment download count
materialSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static method to get materials by chapter
materialSchema.statics.findByChapter = function(chapterId) {
  return this.find({ chapter: chapterId, status: { $ne: 'Archived' } })
    .populate('file', 'filename originalname fileSize filePath')
    .populate('createdBy', 'name email')
    .sort({ order: 1, createdAt: 1 });
};

// Static method to get materials by subject
materialSchema.statics.findBySubject = function(subjectId) {
  return this.find({ subject: subjectId, status: { $ne: 'Archived' } })
    .populate('chapter', 'title chapterNumber')
    .populate('file', 'filename originalname fileSize filePath')
    .populate('createdBy', 'name email')
    .sort({ order: 1, createdAt: 1 });
};

// Static method to reorder materials
materialSchema.statics.reorderMaterials = async function(chapterId, materialOrders) {
  const bulkOps = materialOrders.map(({ materialId, newOrder }) => ({
    updateOne: {
      filter: { _id: materialId, chapter: chapterId },
      update: { order: newOrder }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

// Pre-save middleware
materialSchema.pre('save', function(next) {
  // Ensure either file or url is provided based on type
  if (this.type === 'Link' && !this.url) {
    return next(new Error('URL is required for Link type materials'));
  }
  if (['PDF', 'Document', 'PPT', 'Image'].includes(this.type) && !this.file && !this.url) {
    return next(new Error('File or URL is required for this material type'));
  }
  next();
});

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
