const express  = require('express');
const multer   = require('multer');
const jwt      = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { convertToMp3 } = require('../utils/ffmpeg');

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
router.post('/upload-lecture', authMiddleware, upload.single('audio'), async (req, res) => {
  console.log(`[Upload] User ${req.userId}: ${req.body.className} / ${req.body.subjectName}`);
  try {
    const { className, subjectName } = req.body;
    const file = req.file;

    if (!file || !className || !subjectName) {
      return res.status(400).json({ error: 'Missing audio file, className, or subjectName' });
    }

    console.log(`[Upload] File received - MIME: ${file.mimetype}, Size: ${file.size} bytes`);

    // Detect audio format from magic bytes
    const detectedFormat = detectAudioFormat(file.buffer);
    console.log(`[Upload] Detected audio format: ${detectedFormat}`);

    // Convert audio to MP3 format
    console.log('[Upload] Converting audio to MP3...');
    const mp3Buffer = await convertToMp3(file.buffer, detectedFormat);

    console.log(`[Upload] MP3 conversion successful (${mp3Buffer.length} bytes)`);
    
    const result = await uploadToCloudinary(mp3Buffer, className, subjectName);
    console.log(`[Upload] ✅ Uploaded to Cloudinary - URL: ${result.secure_url}`);
    
    // Trigger Python processing server immediately after upload
    const pythonServerUrl = 'https://bunion-transpose-tinkling.ngrok-free.dev';
    const filename = result.secure_url.split('/').pop(); // Extract filename from URL
    
    console.log(`[Upload] 📤 Notifying Python server...`);
    console.log(`   URL: ${pythonServerUrl}/process`);
    console.log(`   Filename: ${filename}`);
    
    try {
      const requestBody = {
        filename: filename,
        lecture_id: 'pending'  // No lecture ID yet; will be created by frontend
      };
      console.log(`[Upload] 📮 Request body:`, JSON.stringify(requestBody));
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const pythonResponse = await fetch(`${pythonServerUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      console.log(`[Upload] 📬 Python server responded with status: ${pythonResponse.status}`);
      
      if (pythonResponse.ok) {
        console.log(`[Upload] ✅ Processing triggered on Python server`);
      } else {
        const responseText = await pythonResponse.text();
        console.warn(`[Upload] ⚠️ Python server responded with ${pythonResponse.status}: ${responseText}`);
      }
    } catch (err) {
      console.error(`[Upload] ❌ Could not reach Python server:`, err.message);
      // Don't fail the upload if Python server is unreachable - still return the Cloudinary URL
    }
    
    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
