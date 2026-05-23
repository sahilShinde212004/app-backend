const mongoose = require('mongoose');

const courseSubjectSchema = new mongoose.Schema({
  curriculumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  semester: { type: Number, required: true },
  credits: { type: Number, default: null },
  type: { 
    type: String, 
    enum: ['core', 'elective', 'open_elective'],
    default: 'core'
  },
  description: { type: String, default: null },
  syllabus: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Unique constraint: curriculum + code + semester
courseSubjectSchema.index({ curriculumId: 1, code: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('CourseSubject', courseSubjectSchema);
