const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  role: {
    type: String,
    enum: ['pending_teacher', 'student', 'teacher', 'admin'],
    default: 'student'
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  rollNumber: { type: String, default: null },
  phone: { type: String, default: null },
  bio: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
