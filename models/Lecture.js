const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoPath: { type: String, default: null }, // Cloudinary URL stored here
  thumbnailPath: { type: String, default: null },
  fileSize: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  progress: { type: Number, default: 0 }, // Processing progress percentage
  errorMessage: { type: String, default: null },
  duration: { type: Number, default: 0 }, // Duration in seconds
  language: { type: String, default: 'en' },
  lectureNumber: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);
