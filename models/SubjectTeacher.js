const mongoose = require('mongoose');

const subjectTeacherSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['primary', 'co_teacher', 'assistant'],
    default: 'primary'
  },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Unique constraint: each teacher can only have one role per subject
subjectTeacherSchema.index({ subjectId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('SubjectTeacher', subjectTeacherSchema);
