const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');

const router = express.Router();

// POST /api/auth/login — Teacher Login Only
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Only teachers can login
    if (!['teacher', 'pending_teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only teachers can access this application' });
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account is inactive' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        departmentId: user.departmentId
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me — verify token & return current user
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Enforce teacher-only access
    if (!['teacher', 'pending_teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only teachers can access this application' });
    }

    if (!user.isActive) return res.status(403).json({ error: 'Account is inactive' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/users/:id — Get user profile (requires auth)
router.get('/users/:id', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret');
    
    // Verify requester is a teacher
    const requester = await User.findById(decoded.id);
    if (!['teacher', 'pending_teacher', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only teachers can access this application' });
    }

    const user = await User.findById(req.params.id).select('-password').populate('departmentId', 'name code');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// PUT /api/auth/profile — Update user profile (requires auth)
router.put('/profile', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret');
    
    // Verify requester is a teacher
    const requester = await User.findById(decoded.id);
    if (!['teacher', 'pending_teacher', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: 'Only teachers can access this application' });
    }

    const { firstName, lastName, phone, bio, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(avatar && { avatar })
      },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (err) {
    console.error('[Auth] Profile update error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
