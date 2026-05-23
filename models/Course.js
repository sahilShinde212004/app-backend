const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  duration: { type: Number, default: null },
  totalSemesters: { type: Number, default: null },
  description: { type: String, default: null },
  type: { 
    type: String, 
    enum: ['core', 'elective', 'open_elective'],
    default: 'core'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
