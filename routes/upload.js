const express  = require('express');
const multer   = require('multer');
const jwt      = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// JWT auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Token verification failed:', err.message);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// POST /api/upload-lecture
router.post('/upload-lecture', authMiddleware, upload.single('audio'), async (req, res) => {
  console.log(`[Upload] User ${req.userId}: ${req.body.className} / ${req.body.subjectName}`);
  try {
    const { className, subjectName } = req.body;
    const file = req.file;

    if (!file || !className || !subjectName) {
      return res.status(400).json({ error: 'Missing audio file, className, or subjectName' });
    }

    const result = await uploadToCloudinary(file.buffer, className, subjectName);
    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
