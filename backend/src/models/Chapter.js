const mongoose = require('mongoose');

/**
 * Chapter Model
 * Represents a chapter within a subject with materials
 */
const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [200, 'Chapter title cannot exceed 200 characters']
  },
  chapterNumber: {
    type: Number,
    required: [true, 'Chapter number is required'],
    min: [1, 'Chapter number must be at least 1']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  content: {
    type: String,
    maxlength: [50000, 'Content cannot exceed 50000 characters']
  },
  
  // PDF Material
  pdfFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  
  // Topics covered in this chapter
  topics: [{
    type: String,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  }],
  
  // Learning Outcomes for this chapter
  learningOutcomes: [{
    type: String,
    maxlength: [500, 'Learning outcome cannot exceed 500 characters']
  }],
  
  // Course Outcomes (COs) mapping
  courseOutcomes: [{
    coNumber: {
      type: String,
      required: true,
      enum: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6']
    },
    coDescription: {
      type: String,
      required: true,
      maxlength: [1000, 'CO description cannot exceed 1000 characters']
    },
    weightage: {
      type: Number,
      min: [0, 'Weightage cannot be negative'],
      max: [100, 'Weightage cannot exceed 100'],
      default: 0
    },
    bloomsLevel: {
      type: String,
      enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
      default: 'L1'
    }
  }],
  
  // Duration (in hours)
  estimatedDuration: {
    type: Number,
    min: [1, 'Duration must be at least 1 hour'],
    max: [100, 'Duration cannot exceed 100 hours']
  },
  
  // Chapter Resources
  resources: [{
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Resource title cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: ['PDF', 'Video', 'Link', 'Document', 'Other'],
      required: true
    },
    url: {
      type: String,
      maxlength: [500, 'URL cannot exceed 500 characters']
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  
  // Order within course
  displayOrder: {
    type: Number,
    default: 1
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Compound index for subject and chapter number uniqueness
chapterSchema.index({ subject: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ subject: 1, displayOrder: 1 });
chapterSchema.index({ status: 1 });

// Methods
chapterSchema.methods.toJSON = function() {
  const chapter = this.toObject();
  chapter.id = chapter._id.toString();
  return chapter;
};

// Static method to get chapters by subject
chapterSchema.statics.findBySubject = function(subjectId) {
  return this.find({ subject: subjectId })
    .populate('pdfFile', 'filename originalname fileSize filePath')
    .populate('resources.fileId', 'filename originalname fileSize')
    .sort({ displayOrder: 1, chapterNumber: 1 });
};

// Static method to reorder chapters
chapterSchema.statics.reorderChapters = async function(subjectId, chapterOrders) {
  const bulkOps = chapterOrders.map((order, index) => ({
    updateOne: {
      filter: { _id: order.chapterId, subject: subjectId },
      update: { displayOrder: index + 1 }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;
