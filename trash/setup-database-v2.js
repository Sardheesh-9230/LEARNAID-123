const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const Subject = require('./src/models/Subject');

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Starting database setup...');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Step 1: Create admin user first (will assign to department later)
    console.log('👤 Creating admin user...');
    // Create a dummy department ID for now
    const dummyId = new mongoose.Types.ObjectId();

    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@learnaid.edu',
      password: 'admin123', // Let the pre-save middleware handle hashing
      role: 'Admin',
      department: dummyId, // Temporary, will update later
      employeeId: 'ADM001',
      phone: '+919876543200',
      address: 'Admin Office, LearnAID Institute',
      status: 'Active'
    });

    // Step 2: Create a CSE faculty user for HOD role
    console.log('🧑‍🏫 Creating CSE HOD faculty...');
    const cseHOD = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@learnaid.edu',
      password: 'faculty123', // Let the pre-save middleware handle hashing
      role: 'Faculty',
      department: dummyId, // Temporary, will update later
      employeeId: 'CSE001',
      phone: '+919876543220',
      address: 'Faculty Quarters, Block A',
      designation: 'Professor',
      qualification: 'Ph.D. in Computer Science',
      experience: 15,
      specialization: ['Data Structures', 'Algorithms', 'Machine Learning'],
      status: 'Active'
    });

    // Step 3: Create admin department with proper structure
    console.log('🏛️ Creating admin department...');
    const adminDept = await Department.create({
      name: 'Administration',
      code: 'ADMIN',
      description: 'Administrative Department for system management and operations',
      hod: cseHOD._id, // Use CSE HOD temporarily
      establishedYear: 2000,
      contactInfo: {
        email: 'admin@learnaid.edu',
        phone: '+919876543200',
        location: 'Admin Block, Ground Floor'
      },
      facilities: [
        { name: 'Administrative Office', description: 'Main admin office', capacity: 10 },
        { name: 'Conference Room', description: 'Meeting room for administration', capacity: 20 }
      ],
      sections: ['A'],
      programs: [
        { name: 'Administrative Services', duration: 1, type: 'Certificate' }
      ],
      createdBy: adminUser._id
    });

    // Step 4: Create academic departments
    console.log('🏛️ Creating academic departments...');
    
    // Create CSE Department
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering offering undergraduate and postgraduate programs in computing technologies.',
      hod: cseHOD._id,
      establishedYear: 2005,
      contactInfo: {
        email: 'cse@learnaid.edu',
        phone: '+919876543210',
        location: 'Academic Block A, Floor 3'
      },
      facilities: [
        { name: 'Computer Lab 1', description: 'Programming laboratory', capacity: 40 },
        { name: 'Computer Lab 2', description: 'Software development lab', capacity: 40 },
        { name: 'Research Lab', description: 'Advanced research facility', capacity: 20 },
        { name: 'Conference Room', description: 'Department meeting room', capacity: 25 }
      ],
      sections: ['A', 'B', 'C'],
      programs: [
        { name: 'B.Tech Computer Science', duration: 4, type: 'Undergraduate' },
        { name: 'M.Tech Computer Science', duration: 2, type: 'Postgraduate' }
      ],
      createdBy: adminUser._id
    });

    // Update CSE HOD with correct department
    await User.findByIdAndUpdate(cseHOD._id, { department: cseDept._id });

    // Create ECE HOD
    const eceHOD = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@learnaid.edu',
      password: 'faculty123', // Let the pre-save middleware handle hashing
      role: 'Faculty',
      department: dummyId, // Temporary
      employeeId: 'ECE001',
      phone: '+919876543221',
      address: 'Faculty Quarters, Block B',
      designation: 'Professor',
      qualification: 'Ph.D. in Electronics Engineering',
      experience: 12,
      specialization: ['Digital Signal Processing', 'Communication Systems'],
      status: 'Active'
    });

    const eceDept = await Department.create({
      name: 'Electronics and Communication Engineering',
      code: 'ECE',
      description: 'Department of Electronics and Communication Engineering specializing in electronics and communication systems.',
      hod: eceHOD._id,
      establishedYear: 2008,
      contactInfo: {
        email: 'ece@learnaid.edu',
        phone: '+919876543211',
        location: 'Academic Block B, Floor 2'
      },
      facilities: [
        { name: 'Electronics Lab', description: 'Basic electronics laboratory', capacity: 30 },
        { name: 'Communication Lab', description: 'Communication systems lab', capacity: 30 },
        { name: 'Digital Lab', description: 'Digital electronics laboratory', capacity: 25 }
      ],
      sections: ['A', 'B'],
      programs: [
        { name: 'B.Tech Electronics & Communication', duration: 4, type: 'Undergraduate' }
      ],
      createdBy: adminUser._id
    });

    // Update ECE HOD with correct department
    await User.findByIdAndUpdate(eceHOD._id, { department: eceDept._id });

    // Create MECH HOD
    const mechHOD = await User.create({
      name: 'Dr. Anjali Verma',
      email: 'anjali.verma@learnaid.edu',
      password: 'faculty123', // Let the pre-save middleware handle hashing
      role: 'Faculty',
      department: dummyId, // Temporary
      employeeId: 'MECH001',
      phone: '+919876543222',
      address: 'Faculty Quarters, Block C',
      designation: 'Associate Professor',
      qualification: 'Ph.D. in Mechanical Engineering',
      experience: 10,
      specialization: ['Thermal Engineering', 'Manufacturing Processes'],
      status: 'Active'
    });

    const mechDept = await Department.create({
      name: 'Mechanical Engineering',
      code: 'MECH',
      description: 'Department of Mechanical Engineering focusing on design, manufacturing, and thermal systems.',
      hod: mechHOD._id,
      establishedYear: 2010,
      contactInfo: {
        email: 'mech@learnaid.edu',
        phone: '+919876543212',
        location: 'Academic Block C, Floor 1'
      },
      facilities: [
        { name: 'Manufacturing Lab', description: 'Manufacturing processes laboratory', capacity: 25 },
        { name: 'CAD Lab', description: 'Computer-aided design laboratory', capacity: 30 },
        { name: 'Workshop', description: 'Mechanical workshop', capacity: 20 }
      ],
      sections: ['A', 'B'],
      programs: [
        { name: 'B.Tech Mechanical Engineering', duration: 4, type: 'Undergraduate' }
      ],
      createdBy: adminUser._id
    });

    // Update MECH HOD with correct department
    await User.findByIdAndUpdate(mechHOD._id, { department: mechDept._id });

    // Update admin user with admin department
    await User.findByIdAndUpdate(adminUser._id, { department: adminDept._id });

    // Step 5: Create additional faculty
    console.log('🧑‍🏫 Creating additional faculty...');
    
    const cseFaculty2 = await User.create({
      name: 'Prof. Amit Singh',
      email: 'amit.singh@learnaid.edu',
      password: 'faculty123', // Let the pre-save middleware handle hashing
      role: 'Faculty',
      department: cseDept._id,
      employeeId: 'CSE002',
      phone: '+919876543223',
      address: 'Faculty Quarters, Block A',
      designation: 'Assistant Professor',
      qualification: 'M.Tech in Software Engineering',
      experience: 8,
      specialization: ['Software Engineering', 'Database Systems'],
      status: 'Active'
    });

    // Step 6: Create sample students
    console.log('🎓 Creating student users...');
    
    const students = [
      {
        name: 'Arjun Patel',
        email: 'arjun.patel@student.learnaid.edu',
        studentId: 'CSE2024001',
        department: cseDept._id,
        section: 'A',
        semester: 3,
        batch: '2024',
        guardianName: 'Rajesh Patel',
        guardianPhone: '+919876543230'
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@student.learnaid.edu',
        studentId: 'CSE2024002',
        department: cseDept._id,
        section: 'A',
        semester: 3,
        batch: '2024',
        guardianName: 'Lakshmi Reddy',
        guardianPhone: '+919876543231'
      },
      {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@student.learnaid.edu',
        studentId: 'ECE2024001',
        department: eceDept._id,
        section: 'A',
        semester: 5,
        batch: '2023',
        guardianName: 'Suresh Joshi',
        guardianPhone: '+919876543232'
      },
      {
        name: 'Meera Gupta',
        email: 'meera.gupta@student.learnaid.edu',
        studentId: 'MECH2024001',
        department: mechDept._id,
        section: 'A',
        semester: 1,
        batch: '2024',
        guardianName: 'Anil Gupta',
        guardianPhone: '+919876543233'
      }
    ];

    for (const studentData of students) {
      await User.create({
        ...studentData,
        password: 'student123', // Let the pre-save middleware handle hashing
        role: 'Student',
        phone: `+9198765432${Math.floor(Math.random() * 100)}`,
        address: `Student Hostel, LearnAID Institute`,
        status: 'Active'
      });
    }

    // Step 7: Create sample subjects
    console.log('📚 Creating subjects...');
    
    const subjects = [
      {
        name: 'Data Structures and Algorithms',
        code: 'CS301',
        credits: 4,
        department: cseDept._id,
        year: '2nd Year',
        section: 'A',
        semester: 3,
        academicYear: '2024-2025',
        type: 'Core',
        description: 'Fundamental data structures and algorithmic techniques',
        faculty: [{ user: cseHOD._id, isPrimary: true }],
        maxStudents: 60
      },
      {
        name: 'Database Management Systems',
        code: 'CS302',
        credits: 3,
        department: cseDept._id,
        year: '2nd Year',
        section: 'A',
        semester: 3,
        academicYear: '2024-2025',
        type: 'Core',
        description: 'Relational database design and SQL programming',
        faculty: [{ user: cseFaculty2._id, isPrimary: true }],
        maxStudents: 60
      },
      {
        name: 'Digital Signal Processing',
        code: 'EC501',
        credits: 4,
        department: eceDept._id,
        year: '3rd Year',
        section: 'A',
        semester: 5,
        academicYear: '2024-2025',
        type: 'Core',
        description: 'Processing of digital signals and systems',
        faculty: [{ user: eceHOD._id, isPrimary: true }],
        maxStudents: 40
      },
      {
        name: 'Engineering Mechanics',
        code: 'ME101',
        credits: 3,
        department: mechDept._id,
        year: '1st Year',
        section: 'A',
        semester: 1,
        academicYear: '2024-2025',
        type: 'Core',
        description: 'Fundamental principles of mechanics',
        faculty: [{ user: mechHOD._id, isPrimary: true }],
        maxStudents: 50
      }
    ];

    for (const subjectData of subjects) {
      await Subject.create({
        ...subjectData,
        createdBy: adminUser._id,
        status: 'Active'
      });
    }

    console.log('✅ Database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log(`- Created ${await User.countDocuments()} users`);
    console.log(`- Created ${await Department.countDocuments()} departments`);
    console.log(`- Created ${await Subject.countDocuments()} subjects`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@learnaid.edu / admin123');
    console.log('Faculty (CSE HOD): priya.sharma@learnaid.edu / faculty123');
    console.log('Faculty (ECE HOD): rajesh.kumar@learnaid.edu / faculty123');
    console.log('Faculty (MECH HOD): anjali.verma@learnaid.edu / faculty123');
    console.log('Faculty (CSE): amit.singh@learnaid.edu / faculty123');
    console.log('Students: [student-email] / student123');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    console.log('🔌 Database connection closed');
    await mongoose.connection.close();
  }
}

// Run the setup
setupDatabase();