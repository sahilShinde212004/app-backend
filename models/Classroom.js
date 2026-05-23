const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  description: { type: String, default: null },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  academicTermId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
  curriculumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: {
    type: String,
    enum: ['public', 'invite_only', 'restricted'],
    default: 'public'
  },
  maxStudents: { type: Number, default: null },
  coverImage: { type: String, default: null },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

// Unique constraint
classroomSchema.index({ courseId: 1, academicTermId: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Classroom', classroomSchema);
