const express  = require('express');
const multer   = require('multer');
const jwt      = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { convertToMp3 } = require('../utils/ffmpeg');
const Lecture = require('../models/Lecture');
const SubjectTeacher = require('../models/SubjectTeacher');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Detect audio format from magic bytes (file signature)
function detectAudioFormat(buffer) {
  if (!buffer || buffer.length < 4) return 'aac'; // default

  const header = buffer.slice(0, 12);
  
  // MP3 (ID3 tag or frame sync)
  if ((header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) || 
      (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33)) {
    return 'mp3';
  }
  
  // WAV (RIFF header)
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
    return 'wav';
  }
  
  // M4A/AAC (ftyp atom)
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    return 'aac';
  }
  
  // OGG (OggS header)
  if (header[0] === 0x4F && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53) {
    return 'ogg';
  }
  
  // FLAC (fLaC marker)
  if (header[0] === 0x66 && header[1] === 0x4C && header[2] === 0x61 && header[3] === 0x43) {
    return 'flac';
  }

  return 'aac'; // default fallback
}

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
// Expected body fields: audio (file), subjectId, title, description (opt), lectureNumber (opt)
router.post('/upload-lecture', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { subjectId, title, description, lectureNumber } = req.body;
    const file = req.file;

    if (!file || !subjectId || !title) {
      return res.status(400).json({ error: 'Missing audio file, subjectId, or title' });
    }

    // Verify teacher is assigned to this subject
    const subjectTeacher = await SubjectTeacher.findOne({ subjectId, userId: req.userId });
    if (!subjectTeacher) {
      return res.status(403).json({ error: 'You are not assigned to this subject' });
    }

    console.log(`[Upload] File received - MIME: ${file.mimetype}, Size: ${file.size} bytes`);

    // Detect format, convert to MP3, upload to Cloudinary
    const detectedFormat = detectAudioFormat(file.buffer);
    const mp3Buffer = await convertToMp3(file.buffer, detectedFormat);
    const result = await uploadToCloudinary(mp3Buffer, subjectId, title);
    console.log(`[Upload] ✅ Cloudinary URL: ${result.secure_url}`);

    // Create lecture record in DB now that we have the Cloudinary URL
    const lecture = await new Lecture({
      subjectId,
      title,
      description: description || null,
      createdBy: req.userId,
      videoPath: result.secure_url,
      fileSize: file.size,
      lectureNumber: lectureNumber || 0,
      status: 'processing'
    }).save();

    console.log(`[Upload] ✅ Lecture saved - ID: ${lecture._id}`);

    // Notify Python server with real lecture ID
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'https://bunion-transpose-tinkling.ngrok-free.dev';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const pythonResponse = await fetch(`${pythonServerUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_id: lecture._id.toString(),
          audio_url: result.secure_url,
          filename: result.secure_url.split('/').pop()
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      console.log(`[Upload] Python server status: ${pythonResponse.status}`);
    } catch (err) {
      console.error(`[Upload] ❌ Python server unreachable:`, err.message);
      // Don't fail — lecture is already saved
    }

    res.status(201).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      lecture: {
        id: lecture._id,
        title: lecture.title,
        status: lecture.status
      }
    });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
