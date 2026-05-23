require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Test teacher credentials
const testTeachers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@university.edu',
    password: 'Teacher@123',
    role: 'teacher',
    phone: '+1-555-0101',
    bio: 'Computer Science Department Head',
    isActive: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@university.edu',
    password: 'Teacher@456',
    role: 'teacher',
    phone: '+1-555-0102',
    bio: 'Mathematics Lecturer',
    isActive: true
  },
  {
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'robert.williams@university.edu',
    password: 'Teacher@789',
    role: 'teacher',
    phone: '+1-555-0103',
    bio: 'Physics Lecturer',
    isActive: true
  },
  {
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@university.edu',
    password: 'Teacher@101',
    role: 'teacher',
    phone: '+1-555-0104',
    bio: 'English Literature Lecturer',
    isActive: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@university.edu',
    password: 'Admin@123',
    role: 'admin',
    phone: '+1-555-0105',
    bio: 'System Administrator',
    isActive: true
  }
];

async function seedTeachers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fyp-app');
    console.log('✅ Connected to MongoDB');

    // Clear existing teachers (optional)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Hash passwords and insert teachers
    const hashedTeachers = [];
    for (const teacher of testTeachers) {
      const hashed = await bcrypt.hash(teacher.password, 10);
      hashedTeachers.push({
        ...teacher,
        password: hashed
      });
    }

    const createdUsers = await User.insertMany(hashedTeachers);
    console.log(`✅ Seeded ${createdUsers.length} teachers successfully\n`);

    // Display credentials
    console.log('📋 Test Teacher Credentials:');
    console.log('================================');
    testTeachers.forEach((teacher, idx) => {
      console.log(`\n${idx + 1}. ${teacher.firstName} ${teacher.lastName} (${teacher.role})`);
      console.log(`   Email:    ${teacher.email}`);
      console.log(`   Password: ${teacher.password}`);
    });
    console.log('\n================================');
    console.log('✨ Seed completed successfully!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedTeachers();
