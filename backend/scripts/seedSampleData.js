const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Subject = require('../src/models/Subject');
const StudentMarkEntry = require('../src/models/StudentMarkEntry');
const Material = require('../src/models/Material');
const Chapter = require('../src/models/Chapter');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const sampleData = {
  departments: [
    {
      name: "Artificial Intelligence and Data Science",
      code: "AIDS",
      description: "Department focusing on AI, ML, and Data Science technologies",
      establishedYear: 2020,
      sections: ["A", "B", "C"],
      maxStudentsPerSection: 60
    },
    {
      name: "Computer Science and Engineering", 
      code: "CSE",
      description: "Core computer science and software engineering department",
      establishedYear: 1995,
      sections: ["A", "B", "C"],
      maxStudentsPerSection: 65
    },
    {
      name: "Electronics and Communication Engineering",
      code: "ECE", 
      description: "Electronics, communication systems, and embedded technologies",
      establishedYear: 1990,
      sections: ["A", "B"],
      maxStudentsPerSection: 60
    },
    {
      name: "Information Technology",
      code: "IT",
      description: "Information systems, networking, and software development",
      establishedYear: 2000,
      sections: ["A", "B"],
      maxStudentsPerSection: 60
    },
    {
      name: "Mechanical Engineering",
      code: "MECH",
      description: "Mechanical systems, manufacturing, and thermal engineering", 
      establishedYear: 1985,
      sections: ["A", "B", "C"],
      maxStudentsPerSection: 65
    },
    {
      name: "Civil Engineering",
      code: "CIVIL",
      description: "Infrastructure, construction, and environmental engineering",
      establishedYear: 1980,
      sections: ["A", "B"],
      maxStudentsPerSection: 60
    }
  ],

  subjects: {
    "AIDS": [
      { name: "Machine Learning Fundamentals", code: "AIDS301", semester: 5, credits: 4 },
      { name: "Data Structures and Algorithms", code: "AIDS201", semester: 3, credits: 4 },
      { name: "Artificial Intelligence", code: "AIDS401", semester: 7, credits: 3 },
      { name: "Deep Learning", code: "AIDS402", semester: 7, credits: 4 },
      { name: "Big Data Analytics", code: "AIDS501", semester: 8, credits: 3 },
      { name: "Natural Language Processing", code: "AIDS403", semester: 7, credits: 3 }
    ],
    "CSE": [
      { name: "Object Oriented Programming", code: "CSE201", semester: 3, credits: 4 },
      { name: "Database Management Systems", code: "CSE301", semester: 5, credits: 4 },
      { name: "Software Engineering", code: "CSE401", semester: 7, credits: 3 },
      { name: "Computer Networks", code: "CSE302", semester: 5, credits: 3 },
      { name: "Operating Systems", code: "CSE303", semester: 5, credits: 4 },
      { name: "Web Technologies", code: "CSE402", semester: 7, credits: 3 }
    ],
    "ECE": [
      { name: "Digital Signal Processing", code: "ECE301", semester: 5, credits: 4 },
      { name: "Microprocessors and Microcontrollers", code: "ECE302", semester: 5, credits: 4 },
      { name: "Communication Systems", code: "ECE401", semester: 7, credits: 3 },
      { name: "VLSI Design", code: "ECE402", semester: 7, credits: 3 },
      { name: "Embedded Systems", code: "ECE403", semester: 7, credits: 4 }
    ],
    "IT": [
      { name: "System Analysis and Design", code: "IT301", semester: 5, credits: 3 },
      { name: "Network Security", code: "IT401", semester: 7, credits: 3 },
      { name: "Cloud Computing", code: "IT402", semester: 7, credits: 4 },
      { name: "Mobile Application Development", code: "IT403", semester: 7, credits: 3 },
      { name: "Information Systems", code: "IT302", semester: 5, credits: 3 }
    ],
    "MECH": [
      { name: "Thermodynamics", code: "MECH301", semester: 5, credits: 4 },
      { name: "Machine Design", code: "MECH401", semester: 7, credits: 4 },
      { name: "Manufacturing Processes", code: "MECH302", semester: 5, credits: 3 },
      { name: "Heat Transfer", code: "MECH402", semester: 7, credits: 3 },
      { name: "Automobile Engineering", code: "MECH403", semester: 7, credits: 3 }
    ],
    "CIVIL": [
      { name: "Structural Analysis", code: "CIVIL301", semester: 5, credits: 4 },
      { name: "Concrete Technology", code: "CIVIL302", semester: 5, credits: 3 },
      { name: "Transportation Engineering", code: "CIVIL401", semester: 7, credits: 3 },
      { name: "Environmental Engineering", code: "CIVIL402", semester: 7, credits: 3 },
      { name: "Geotechnical Engineering", code: "CIVIL403", semester: 7, credits: 4 }
    ]
  }
};

const generateUsers = (departments) => {
  const users = [];
  const years = ["2nd Year", "3rd Year", "4th Year"];
  const sections = ["A", "B", "C"];
  
  // Generate students
  departments.forEach((dept, deptIndex) => {
    years.forEach((year, yearIndex) => {
      dept.sections.forEach((section) => {
        const studentsInSection = Math.floor(Math.random() * 15) + 20; // 20-35 students per section
        
        for (let i = 1; i <= studentsInSection; i++) {
          const studentId = `${dept.code}${yearIndex + 2}${section}${String(i).padStart(2, '0')}`;
          users.push({
            name: `Student ${studentId}`,
            email: `${studentId.toLowerCase()}@student.college.edu`,
            studentId: studentId,
            role: 'Student',
            password: 'student123',
            year: year,
            section: section,
            batch: `2024-${2024 + (4 - yearIndex)}`,
            status: 'Active'
          });
        }
      });
    });
    
    // Generate faculty for each department
    const facultyCount = Math.floor(Math.random() * 3) + 2; // 2-4 faculty per department
    for (let i = 1; i <= facultyCount; i++) {
      const empId = `FAC${dept.code}${String(i).padStart(2, '0')}`;
      users.push({
        name: `Dr. Faculty ${dept.code} ${i}`,
        email: `faculty${dept.code.toLowerCase()}${i}@college.edu`,
        employeeId: empId,
        role: 'Faculty',
        password: 'faculty123',
        status: 'Active'
      });
    }
  });
  
  // Generate additional admins (will assign admin department later)
  users.push({
    name: "Academic Administrator",
    email: "academic@college.edu",
    employeeId: "ADM002", 
    role: 'Admin',
    password: 'admin123',
    status: 'Active'
  });

  return users;
};

const generateMarks = (students, subjects) => {
  const marks = [];
  const examTypes = ['CIA1', 'CIA2', 'MODEL', 'SEMESTER'];
  
  students.forEach(student => {
    // Each student has marks for 3-5 subjects
    const studentSubjects = subjects.slice(0, Math.floor(Math.random() * 3) + 3);
    
    studentSubjects.forEach(subject => {
      examTypes.forEach(examType => {
        if (Math.random() > 0.2) { // 80% chance student has marks for this exam
          const totalMarks = examType === 'SEMESTER' ? 100 : 50;
          const percentage = Math.floor(Math.random() * 40) + 60; // 60-100%
          const obtainedMarks = Math.floor((percentage / 100) * totalMarks);
          
          marks.push({
            student: student._id,
            subject: subject._id,
            examType: examType,
            totalMarks: totalMarks,
            obtainedMarks: obtainedMarks,
            percentage: percentage,
            grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : 'C',
            academicYear: '2024-25',
            semester: subject.semester,
            enteredDate: new Date(),
            status: 'finalized'
          });
        }
      });
    });
  });
  
  return marks;
};

const generateChapters = (subjects, adminUser) => {
  const chapters = [];
  
  subjects.forEach(subject => {
    const chapterCount = Math.floor(Math.random() * 3) + 3; // 3-5 chapters per subject
    
    for (let i = 1; i <= chapterCount; i++) {
      chapters.push({
        title: `Chapter ${i}: ${subject.name} Fundamentals`,
        chapterNumber: i,
        subject: subject._id,
        description: `Chapter ${i} covering fundamental concepts of ${subject.name}`,
        content: `Detailed content for chapter ${i} of ${subject.name}`,
        status: 'Published', // Correct enum value
        createdBy: adminUser._id, // Required field
        displayOrder: i
      });
    }
  });
  
  return chapters;
};

const generateMaterials = (chapters, faculty) => {
  const materials = [];
  const materialTypes = ['PDF', 'Video', 'Link', 'Document', 'PPT'];
  
  chapters.forEach(chapter => {
    const materialCount = Math.floor(Math.random() * 2) + 1; // 1-2 materials per chapter
    const randomFaculty = faculty[Math.floor(Math.random() * faculty.length)];
    
    for (let i = 1; i <= materialCount; i++) {
      materials.push({
        chapter: chapter._id,
        subject: chapter.subject,
        title: `${chapter.title} - Material ${i}`,
        description: `Study material for ${chapter.title}`,
        type: materialTypes[Math.floor(Math.random() * materialTypes.length)],
        url: `https://example.com/materials/${chapter._id}_${i}`,
        uploadedBy: randomFaculty._id,
        fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
        downloadCount: Math.floor(Math.random() * 100),
        tags: ['study-material', 'academic'],
        visibility: 'public',
        status: 'active'
      });
    }
  });
  
  return materials;
};

const seedDatabase = async () => {
  try {
    console.log('📊 Adding sample data to existing database...');
    console.log('⏭️  Skipping data clearing - keeping existing records');
    
    // Check if admin department and user already exist
    let adminDept = await Department.findOne({ code: 'ADMIN' });
    let adminUser = await User.findOne({ role: 'Admin', email: 'admin@college.edu' });
    
    if (!adminDept) {
      console.log('🏢 Creating administrative department...');
      adminDept = await Department.create({
        name: "Administration",
        code: "ADMIN",
        description: "Administrative department for system management",
        establishedYear: 2020,
        sections: ["A"],
        maxStudentsPerSection: 1,
        contactInfo: {
          email: "admin@college.edu",
          phone: "+919876543210",
          location: "Administrative Block"
        },
        programs: [{
          name: "Administrative Services",
          duration: 1,
          type: 'Certificate'
        }],
        facilities: [{
          name: "Administrative Office",
          description: "Main administrative office",
          capacity: 10
        }],
        createdBy: new mongoose.Types.ObjectId() // Temporary ObjectId
      });
      console.log('✅ Created admin department');
    } else {
      console.log('✅ Found existing admin department');
    }
    
    if (!adminUser) {
      console.log('👤 Creating admin user...');
      adminUser = await User.create({
        name: "System Administrator",
        email: "admin@college.edu", 
        employeeId: "ADM001",
        role: 'Admin',
        department: adminDept._id,
        password: 'admin123',
        status: 'Active'
      });
      
      // Update the department to have proper createdBy
      await Department.findByIdAndUpdate(adminDept._id, { createdBy: adminUser._id });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Found existing admin user');
    }
    
    console.log('🏢 Creating departments (if not exists)...');
    const existingDepartments = await Department.find({});
    const existingCodes = existingDepartments.map(d => d.code);
    
    const newDepartments = sampleData.departments
      .filter(dept => !existingCodes.includes(dept.code))
      .map(dept => ({
        ...dept,
        createdBy: adminUser._id,
        contactInfo: {
          email: `${dept.code.toLowerCase()}@college.edu`,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          location: `${dept.name} Department, Engineering Block`
        },
        programs: [{
          name: `Bachelor of Engineering in ${dept.name}`,
          duration: 4,
          type: 'Undergraduate'
        }],
        facilities: [
          {
            name: "Computer Lab",
            description: `${dept.name} Computer Laboratory`,
            capacity: 60
          },
          {
            name: "Lecture Hall",
            description: `${dept.name} Lecture Hall`,
            capacity: 100
          }
        ]
      }));
    
    let createdDepartments = [];
    if (newDepartments.length > 0) {
      createdDepartments = await Department.insertMany(newDepartments);
      console.log(`✅ Created ${createdDepartments.length} new departments`);
    } else {
      console.log('✅ All departments already exist');
    }
    
    // Get all departments (existing + new)
    const allDepartments = await Department.find({});
    
    console.log('👥 Creating users (if not exists)...');
    const usersData = generateUsers(allDepartments);
    
    // Set department references for users
    const usersWithDepartments = usersData.map(user => {
      if (user.role === 'Student' || user.role === 'Faculty') {
        // Find department by matching code from student ID or assign randomly for faculty
        let deptCode;
        if (user.role === 'Student') {
          deptCode = user.studentId.match(/^([A-Z]+)/)[1];
        } else {
          // For faculty, extract from employee ID
          deptCode = user.employeeId.match(/^FAC([A-Z]+)/)[1];
        }
        
        const department = createdDepartments.find(dept => dept.code === deptCode);
        if (department) {
          user.department = department._id;
        }
      } else if (user.role === 'Admin') {
        // Assign admin department to admin users
        user.department = adminDept._id;
      }
      return user;
    });
    
    // Get all users for further processing
    const allUsers = await User.find({});
    const students = allUsers.filter(u => u.role === 'Student');
    const faculty = allUsers.filter(u => u.role === 'Faculty');
    const admins = allUsers.filter(u => u.role === 'Admin');
    console.log(`   - Total: ${allUsers.length} users (${students.length} students, ${faculty.length} faculty, ${admins.length} admins)`);
    
    console.log('📚 Creating subjects (if not exists)...');
    const existingSubjects = await Subject.find({}).populate('department');
    const existingSubjectCodes = existingSubjects.map(s => s.code);
    
    for (const department of allDepartments) {
      const deptSubjects = sampleData.subjects[department.code] || [];
      const newSubjects = deptSubjects
        .filter(subject => !existingSubjectCodes.includes(subject.code))
        .map(subject => ({
          ...subject,
          department: department._id,
          year: subject.semester <= 2 ? "1st Year" : subject.semester <= 4 ? "2nd Year" : subject.semester <= 6 ? "3rd Year" : "4th Year",
          section: "A", // Default section, can be expanded
          status: 'Active', // Correct enum value
          academicYear: '2024-2025', // Required field
          type: 'Theory', // Default type
          maxStudents: 60,
          createdBy: adminUser._id
        }));
      
      if (newSubjects.length > 0) {
        const createdSubjects = await Subject.insertMany(newSubjects);
        console.log(`   - ${createdSubjects.length} new subjects for ${department.name}`);
      }
    }
    
    // Get all subjects for further processing
    const allSubjects = await Subject.find({});
    console.log(`✅ Total subjects in database: ${allSubjects.length}`);
    
    console.log('📝 Creating student marks (if not exists)...');
    const existingMarks = await StudentMarkEntry.find({});
    
    if (existingMarks.length === 0 && students.length > 0) {
      const marks = generateMarks(students, allSubjects);
      const createdMarks = await StudentMarkEntry.insertMany(marks);
      console.log(`✅ Created ${createdMarks.length} mark entries`);
    } else {
      console.log(`✅ Found ${existingMarks.length} existing mark entries, skipping marks creation`);
    }
    
    console.log('📖 Creating chapters (if not exists)...');
    const existingChapters = await Chapter.find({});
    const existingChapterTitles = existingChapters.map(c => c.title);
    
    const allChapters = generateChapters(allSubjects, adminUser);
    const newChapters = allChapters.filter(chapter => !existingChapterTitles.includes(chapter.title));
    
    let createdChapters = [];
    if (newChapters.length > 0) {
      createdChapters = await Chapter.insertMany(newChapters);
      console.log(`✅ Created ${createdChapters.length} new chapters`);
    } else {
      console.log('✅ Chapters already exist');
    }
    
    // Get all chapters for materials
    const allChaptersInDB = await Chapter.find({});
    
    console.log('📋 Creating study materials (if not exists)...');
    const existingMaterials = await Material.find({});
    
    if (existingMaterials.length === 0 && allChaptersInDB.length > 0 && faculty.length > 0) {
      const materials = generateMaterials(allChaptersInDB, faculty);
      const createdMaterials = await Material.insertMany(materials);
      console.log(`✅ Created ${createdMaterials.length} study materials`);
    } else {
      console.log(`✅ Found ${existingMaterials.length} existing materials, skipping materials creation`);
    }
    
    // Final counts
    const finalUserCount = await User.countDocuments();
    const finalDeptCount = await Department.countDocuments();
    const finalSubjectCount = await Subject.countDocuments();
    const finalChapterCount = await Chapter.countDocuments();
    const finalMarkCount = await StudentMarkEntry.countDocuments();
    const finalMaterialCount = await Material.countDocuments();
    
    console.log('\n🎉 Sample data addition completed successfully!');
    console.log('\n📊 Current Database Summary:');
    console.log(`   - Departments: ${finalDeptCount}`);
    console.log(`   - Users: ${finalUserCount} (${students.length} students, ${faculty.length} faculty, ${admins.length} admins)`);
    console.log(`   - Subjects: ${finalSubjectCount}`);
    console.log(`   - Chapters: ${finalChapterCount}`);
    console.log(`   - Mark Entries: ${finalMarkCount}`);
    console.log(`   - Study Materials: ${finalMaterialCount}`);
    
    console.log('\n🚀 Your analytics dashboard should now display meaningful data!');
    console.log('🔄 Existing data has been preserved and new sample data has been added where needed.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

runSeeder();