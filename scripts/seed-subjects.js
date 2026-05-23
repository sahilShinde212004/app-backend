require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const SubjectTeacher = require('../models/SubjectTeacher');

async function seedSubjectsAndTeachers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://fayazkhanxid411:9a2RotpFMaCBxCji@cluster0.45kxbus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/educonnect');
    console.log('✅ Connected to MongoDB');

    // Find John Smith (teacher from seed-teachers.js)
    const teacher1 = await User.findOne({ email: 'john.smith@university.edu' });
    const teacher2 = await User.findOne({ email: 'sarah.johnson@university.edu' });

    if (!teacher1 || !teacher2) {
      console.log('❌ Teachers not found. Please run seed-teachers.js first.');
      process.exit(1);
    }

    // Clear existing subjects and assignments
    await Subject.deleteMany({});
    await SubjectTeacher.deleteMany({});
    console.log('🗑️  Cleared existing subjects and subject assignments');

    const dummyCourseSubjectId1 = new mongoose.Types.ObjectId();
    const dummyCourseSubjectId2 = new mongoose.Types.ObjectId();
    const dummyCourseSubjectId3 = new mongoose.Types.ObjectId();
    const dummyClassroomId1 = new mongoose.Types.ObjectId();
    const dummyClassroomId2 = new mongoose.Types.ObjectId();

    // Create Subjects
    const subjects = await Subject.insertMany([
      {
        courseSubjectId: dummyCourseSubjectId1,
        name: 'Cloud Computing',
        code: 'CS701',
        classroomId: dummyClassroomId1,
        description: 'Introduction to Cloud Computing and AWS',
        credits: 4,
      },
      {
        courseSubjectId: dummyCourseSubjectId2,
        name: 'Artificial Intelligence',
        code: 'CS702',
        classroomId: dummyClassroomId1,
        description: 'Fundamentals of AI',
        credits: 4,
      },
      {
        courseSubjectId: dummyCourseSubjectId3,
        name: 'Mathematics III',
        code: 'MA301',
        classroomId: dummyClassroomId2,
        description: 'Advanced Engineering Mathematics',
        credits: 3,
      }
    ]);

    // Assign Subjects to Teachers
    await SubjectTeacher.insertMany([
      {
        subjectId: subjects[0]._id, // Cloud Computing
        userId: teacher1._id,       // John Smith
        role: 'primary'
      },
      {
        subjectId: subjects[1]._id, // Artificial Intelligence
        userId: teacher1._id,       // John Smith
        role: 'primary'
      },
      {
        subjectId: subjects[2]._id, // Mathematics III
        userId: teacher2._id,       // Sarah Johnson
        role: 'primary'
      }
    ]);

    console.log(`✅ Assigned subjects to teachers successfully!`);
    console.log('-------------------------------------------');
    console.log(`John Smith teaches: Cloud Computing, Artificial Intelligence`);
    console.log(`Sarah Johnson teaches: Mathematics III`);
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding subjects:', err);
    process.exit(1);
  }
}

seedSubjectsAndTeachers();
