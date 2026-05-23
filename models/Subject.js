const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  courseSubjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseSubject', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  description: { type: String, default: null },
  credits: { type: Number, default: null },
  syllabus: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
