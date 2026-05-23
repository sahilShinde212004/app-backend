const express = require('express');
const jwt = require('jsonwebtoken');
const Lecture = require('../models/Lecture');
const SubjectTeacher = require('../models/SubjectTeacher');
const Subject = require('../models/Subject');
const User = require('../models/User');
const CourseSubject = require('../models/CourseSubject');
const Classroom = require('../models/Classroom');

const router = express.Router();

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

// GET /api/lectures/subjects — Get all subjects assigned to the teacher
router.get('/subjects', authMiddleware, async (req, res) => {
  try {
    // Get all subjects where this teacher is assigned
    const subjectTeachers = await SubjectTeacher.find({ userId: req.userId })
      .populate({
        path: 'subjectId',
        populate: [
          { path: 'courseSubjectId' },
          { path: 'classroomId' }
        ]
      });

    if (!subjectTeachers || subjectTeachers.length === 0) {
      return res.json({ subjects: [] });
    }

    const subjects = subjectTeachers.map(st => ({
      id: st.subjectId._id,
      name: st.subjectId.name,
      code: st.subjectId.code,
      description: st.subjectId.description,
      credits: st.subjectId.credits,
      teacherRole: st.role,
      classroom: st.subjectId.classroomId
    }));

    res.json({ subjects });
  } catch (err) {
    console.error('[Lectures] Get subjects error:', err.message);
    res.status(500).json({ error: 'Server error fetching subjects' });
  }
});

// POST /api/lectures — Create a new lecture
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subjectId, title, description, videoPath, thumbnailPath, fileSize, duration, lectureNumber } = req.body;

    // Validate required fields
    if (!subjectId || !title || !videoPath) {
      return res.status(400).json({ error: 'subjectId, title, and videoPath are required' });
    }

    // Verify teacher is assigned to this subject
    const subjectTeacher = await SubjectTeacher.findOne({
      subjectId,
      userId: req.userId
    });

    if (!subjectTeacher) {
      return res.status(403).json({ error: 'You are not assigned to this subject' });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Create lecture
    const lecture = await new Lecture({
      subjectId,
      title,
      description: description || null,
      createdBy: req.userId,
      videoPath,
      thumbnailPath: thumbnailPath || null,
      fileSize: fileSize || 0,
      duration: duration || 0,
      lectureNumber: lectureNumber || 0,
      status: 'uploaded',
      isPublished: false
    }).save();

    // Fire-and-forget: notify the Python processing server with filename & lecture_id
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    const filename = (lecture.videoPath || '').split('/').pop(); // e.g. "Lecture-1779447189109.wav"
    fetch(`${pythonServerUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename:   filename,
        lecture_id: lecture._id.toString()
      })
    })
      .then(r => r.ok
        ? console.log(`[Lectures] ✅ Processing triggered — filename: ${filename}, lecture_id: ${lecture._id}`)
        : r.text().then(t => console.warn(`[Lectures] ⚠️ Processing server responded with ${r.status}: ${t}`))
      )
      .catch(err => console.warn(`[Lectures] ⚠️ Could not reach processing server: ${err.message}`));

    res.status(201).json({
      message: 'Lecture created successfully',
      lecture: {
        id: lecture._id,
        title: lecture.title,
        subjectId: lecture.subjectId,
        videoPath: lecture.videoPath,
        status: lecture.status,
        createdAt: lecture.createdAt
      }
    });
  } catch (err) {
    console.error('[Lectures] Create error:', err.message);
    res.status(500).json({ error: 'Server error creating lecture' });
  }
});

// GET /api/lectures/:id — Get lecture details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
      .populate('subjectId')
      .populate('createdBy', 'firstName lastName email');

    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify teacher created this lecture or is assigned to subject
    const isCreator = lecture.createdBy._id.toString() === req.userId;
    const isTeacher = await SubjectTeacher.findOne({
      subjectId: lecture.subjectId._id,
      userId: req.userId
    });

    if (!isCreator && !isTeacher) {
      return res.status(403).json({ error: 'You do not have access to this lecture' });
    }

    res.json({ lecture });
  } catch (err) {
    console.error('[Lectures] Get details error:', err.message);
    res.status(500).json({ error: 'Server error fetching lecture' });
  }
});

// PUT /api/lectures/:id — Update lecture
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, isPublished, lectureNumber } = req.body;

    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify teacher created this lecture
    if (lecture.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own lectures' });
    }

    // Update fields
    if (title) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (isPublished !== undefined) lecture.isPublished = isPublished;
    if (lectureNumber !== undefined) lecture.lectureNumber = lectureNumber;

    await lecture.save();

    res.json({
      message: 'Lecture updated successfully',
      lecture
    });
  } catch (err) {
    console.error('[Lectures] Update error:', err.message);
    res.status(500).json({ error: 'Server error updating lecture' });
  }
});

// DELETE /api/lectures/:id — Delete lecture
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    // Verify teacher created this lecture
    if (lecture.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own lectures' });
    }

    await Lecture.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lecture deleted successfully' });
  } catch (err) {
    console.error('[Lectures] Delete error:', err.message);
    res.status(500).json({ error: 'Server error deleting lecture' });
  }
});

// GET /api/lectures/subject/:subjectId — Get all lectures for a subject
router.get('/subject/:subjectId', authMiddleware, async (req, res) => {
  try {
    const lectures = await Lecture.find({ subjectId: req.params.subjectId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName');

    res.json({ lectures });
  } catch (err) {
    console.error('[Lectures] Get subject lectures error:', err.message);
    res.status(500).json({ error: 'Server error fetching lectures' });
  }
});

module.exports = router;
