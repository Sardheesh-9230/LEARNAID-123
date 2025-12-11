const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const Subject = require('./src/models/Subject');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Setup initial data
const setupDatabase = async () => {
  try {
    console.log('🚀 Starting database setup...\n');

    // Clear existing data (optional - remove this in production)
    await User.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user first (needed for department creation)
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@learnaid.edu',
      password: adminPassword,
      role: 'Admin',
      phone: '+1234567890',
      address: 'Administrative Office',
      status: 'Active'
    });

    // Save admin without department first
    const tempAdmin = await adminUser.save();
    console.log('✅ Created admin user');

    // Create a temporary faculty user for department head
    console.log('�‍🏫 Creating temporary faculty for department heads...');
    const facultyPassword = await bcrypt.hash('faculty123', 12);
    const tempFacultyUser = new User({
      name: 'Dr. John Smith',
      email: 'john.smith@learnaid.edu',
      password: facultyPassword,
      role: 'Faculty',
      phone: '+1234567891',
      address: 'Faculty Block A',
      designation: 'Professor',
      qualification: 'Ph.D. in Computer Science',
      experience: 15,
      specialization: ['Data Structures', 'Algorithms', 'Machine Learning'],
      status: 'Active'
    });

    const tempFaculty = await tempFacultyUser.save();
    console.log('✅ Created temporary faculty');

    // Create departments with all required fields
    console.log('�📚 Creating departments...');
    const departments = [
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering focusing on software development, algorithms, and emerging technologies.',
        hod: tempFaculty._id,
        establishedYear: 1995,
        sections: ['A', 'B', 'C'],
        maxStudentsPerSection: 60,
        status: 'Active',
        contactInfo: {
          email: 'cse@learnaid.edu',
          phone: '+1234567800',
          location: 'Academic Block A, Floor 2'
        },
        facilities: [
          { name: 'Computer Lab 1', capacity: 40, type: 'Laboratory' },
          { name: 'Computer Lab 2', capacity: 40, type: 'Laboratory' },
          { name: 'Seminar Hall', capacity: 100, type: 'Classroom' }
        ],
        createdBy: tempAdmin._id,
        isActive: true
      },
      {
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        description: 'Department of Electronics and Communication Engineering focusing on electronics, communication systems, and signal processing.',
        hod: tempFaculty._id,
        establishedYear: 1990,
        sections: ['A', 'B'],
        maxStudentsPerSection: 60,
        status: 'Active',
        contactInfo: {
          email: 'ece@learnaid.edu',
          phone: '+1234567801',
          location: 'Academic Block B, Floor 1'
        },
        facilities: [
          { name: 'Electronics Lab', capacity: 30, type: 'Laboratory' },
          { name: 'Communication Lab', capacity: 30, type: 'Laboratory' }
        ],
        createdBy: tempAdmin._id,
        isActive: true
      },
      {
        name: 'Mechanical Engineering',
        code: 'MECH',
        description: 'Department of Mechanical Engineering focusing on design, manufacturing, and thermal systems.',
        hod: tempFaculty._id,
        establishedYear: 1985,
        sections: ['A', 'B'],
        maxStudentsPerSection: 60,
        status: 'Active',
        contactInfo: {
          email: 'mech@learnaid.edu',
          phone: '+1234567802',
          location: 'Engineering Block, Floor 1'
        },
        facilities: [
          { name: 'Machine Shop', capacity: 25, type: 'Workshop' },
          { name: 'Thermal Lab', capacity: 30, type: 'Laboratory' }
        ],
        createdBy: tempAdmin._id,
        isActive: true
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Update admin and faculty with department
    await User.findByIdAndUpdate(tempAdmin._id, { department: createdDepartments[0]._id });
    await User.findByIdAndUpdate(tempFaculty._id, { department: createdDepartments[0]._id });

    console.log('✅ Updated users with department assignments');
    console.log('   Admin Email: admin@learnaid.edu');
    console.log('   Admin Password: admin123');
    console.log('   Faculty Email: john.smith@learnaid.edu');
    console.log('   Faculty Password: faculty123');

    // Create some sample subjects for CSE department
    console.log('📖 Creating sample subjects...');
    const subjects = [
      {
        name: 'Data Structures and Algorithms',
        code: 'CS101',
        department: createdDepartments[0]._id,
        faculty: tempFaculty._id,
        credits: 4,
        semester: 3,
        description: 'Introduction to data structures and algorithms',
        isActive: true
      },
      {
        name: 'Database Management Systems',
        code: 'CS201',
        department: createdDepartments[0]._id,
        credits: 3,
        semester: 4,
        description: 'Database concepts and SQL',
        isActive: true
      },
      {
        name: 'Operating Systems',
        code: 'CS301',
        department: createdDepartments[0]._id,
        credits: 4,
        semester: 5,
        description: 'Operating system concepts and implementation',
        isActive: true
      },
      {
        name: 'Computer Networks',
        code: 'CS401',
        department: createdDepartments[0]._id,
        credits: 3,
        semester: 6,
        description: 'Network protocols and communication',
        isActive: true
      }
    ];

    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    // Update department with subjects and head
    await Department.findByIdAndUpdate(
      createdDepartments[0]._id,
      { 
        $push: { subjects: { $each: createdSubjects.map(s => s._id) } }
      }
    );

    // Update faculty with assigned subjects
    await User.findByIdAndUpdate(
      tempFaculty._id,
      { 
        $push: { assignedSubjects: { $each: createdSubjects.map(s => s._id) } }
      }
    );

    // Create a sample student
    console.log('👨‍🎓 Creating sample student...');
    const studentPassword = await bcrypt.hash('student123', 12);
    const studentUser = new User({
      name: 'Alice Johnson',
      email: 'alice.johnson@learnaid.edu',
      password: studentPassword,
      role: 'Student',
      department: createdDepartments[0]._id, // CSE
      phone: '+1234567892',
      address: 'Hostel Block B',
      section: 'A',
      batch: '2024',
      semester: 3,
      guardianName: 'Robert Johnson',
      guardianPhone: '+1234567893',
      enrolledSubjects: [createdSubjects[0]._id], // Enrolled in DS&A
      status: 'Active'
    });

    await studentUser.save();
    console.log('✅ Created sample student');
    console.log('   Email: alice.johnson@learnaid.edu');
    console.log('   Password: student123');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Departments: ${createdDepartments.length}`);
    console.log(`   - Subjects: ${createdSubjects.length}`);
    console.log(`   - Users: 3 (1 Admin, 1 Faculty, 1 Student)`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@learnaid.edu / admin123');
    console.log('   Faculty: john.smith@learnaid.edu / faculty123');
    console.log('   Student: alice.johnson@learnaid.edu / student123');

    console.log('\n🌐 API Endpoints:');
    console.log('   - Health Check: http://localhost:5000/health');
    console.log('   - API Documentation: http://localhost:5000/api-docs');
    console.log('   - Login: POST http://localhost:5000/api/auth/login');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run setup
const runSetup = async () => {
  await connectDB();
  await setupDatabase();
};

runSetup();