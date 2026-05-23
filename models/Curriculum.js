const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  regulationType: { 
    type: String, 
    enum: ['cbcs', 'nep', 'autonomous', 'affiliated'],
    default: 'cbcs'
  },
  version: { type: String, default: '1.0' },
  effectiveFromYear: { type: Number, default: null },
  effectiveToYear: { type: Number, default: null },
  totalSemesters: { type: Number, default: null },
  totalCredits: { type: Number, default: null },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
