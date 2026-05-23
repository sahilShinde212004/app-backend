require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const SubjectTeacher = require('../models/SubjectTeacher');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fyp-app');
    console.log('✅ Connected to MongoDB at:', process.env.MONGODB_URI ? 'Remote URI from .env' : 'Localhost fallback');

    const teachers = await User.find({ role: 'teacher' });
    console.log(`\n👨‍🏫 Found ${teachers.length} teachers.`);
    for (let t of teachers) {
      console.log(` - ${t.firstName} ${t.lastName} (${t.email})`);
    }

    const subjects = await Subject.find({});
    console.log(`\n📚 Found ${subjects.length} subjects.`);
    for (let s of subjects) {
      console.log(` - ${s.name} (${s.code})`);
    }

    const subjectTeachers = await SubjectTeacher.find({}).populate('userId subjectId');
    console.log(`\n🔗 Found ${subjectTeachers.length} subject assignments.`);
    for (let st of subjectTeachers) {
      console.log(` - ${st.userId?.firstName} ${st.userId?.lastName} teaches ${st.subjectId?.name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ DB Check error:', err);
    process.exit(1);
  }
}

checkDb();
