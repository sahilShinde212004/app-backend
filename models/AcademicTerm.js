const mongoose = require('mongoose');

const academicTermSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

// Unique constraint: year + semester
academicTermSchema.index({ year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('AcademicTerm', academicTermSchema);
