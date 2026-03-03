const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: { type: String },
  authorRole: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Admin'] },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  subjectName: { type: String },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: { type: String },
  authorRole: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Admin'] },
  replies: [replySchema],
  status: {
    type: String,
    enum: ['open', 'closed', 'resolved'],
    default: 'open'
  },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true });

discussionSchema.index({ subject: 1, createdAt: -1 });
discussionSchema.index({ author: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);
