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

const generateUsersForExistingDepartments = async () => {
  try {
    console.log('🏫 Adding students and faculty to existing departments...');
    
    const departments = await Department.find({ code: { $ne: 'ADMIN' } }); // Exclude admin department
    const users = [];
    const years = ["2nd Year", "3rd Year", "4th Year"];
    const sections = ["A", "B", "C"];
    
    console.log(`Found ${departments.length} academic departments`);
    
    // Generate students for each department
    departments.forEach((dept, deptIndex) => {
      console.log(`📝 Generating users for ${dept.name}...`);
      
      years.forEach((year, yearIndex) => {
        dept.sections.forEach((section) => {
          const studentsInSection = Math.floor(Math.random() * 15) + 20; // 20-35 students per section
          
          for (let i = 1; i <= studentsInSection; i++) {
            const studentId = `${dept.code}${yearIndex + 2}${section}${String(i).padStart(2, '0')}`;
            const semesterByYear = {
              "2nd Year": Math.floor(Math.random() * 2) + 3, // Semester 3 or 4
              "3rd Year": Math.floor(Math.random() * 2) + 5, // Semester 5 or 6  
              "4th Year": Math.floor(Math.random() * 2) + 7  // Semester 7 or 8
            };
            
            users.push({
              name: `Student ${studentId}`,
              email: `${studentId.toLowerCase()}@student.college.edu`,
              studentId: studentId,
              role: 'Student',
              department: dept._id,
              year: year,
              section: section,
              batch: "2024", // Just the year as required by regex
              semester: semesterByYear[year],
              password: 'student123',
              status: 'Active'
            });
          }
        });
      });
      
      // Generate faculty for each department
      const facultyCount = Math.floor(Math.random() * 3) + 2; // 2-4 faculty per department
      for (let i = 1; i <= facultyCount; i++) {
        const empId = `FAC${dept.code}${String(i).padStart(2, '0')}`;
        const designations = ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer'];
        const qualifications = ['M.Tech', 'Ph.D', 'M.E', 'M.Sc', 'Ph.D in Computer Science', 'Ph.D in Engineering'];
        const specializations = [
          ['Machine Learning', 'Data Science'],
          ['Software Engineering', 'Web Development'], 
          ['Database Systems', 'Computer Networks'],
          ['Digital Electronics', 'VLSI Design'],
          ['Algorithms', 'Programming']
        ];
        
        users.push({
          name: `Dr. Faculty ${dept.code} ${i}`,
          email: `faculty${dept.code.toLowerCase()}${i}@college.edu`,
          employeeId: empId,
          role: 'Faculty',
          department: dept._id,
          designation: designations[Math.floor(Math.random() * designations.length)],
          qualification: qualifications[Math.floor(Math.random() * qualifications.length)],
          experience: Math.floor(Math.random() * 20) + 1, // 1-20 years
          specialization: specializations[Math.floor(Math.random() * specializations.length)],
          password: 'faculty123',
          status: 'Active'
        });
      }
    });
    
    // Filter out users that already exist
    const existingEmails = (await User.find({}).select('email')).map(u => u.email);
    const newUsers = users.filter(user => !existingEmails.includes(user.email));
    
    if (newUsers.length > 0) {
      const createdUsers = await User.insertMany(newUsers);
      console.log(`✅ Created ${createdUsers.length} new users`);
      
      const students = createdUsers.filter(u => u.role === 'Student');
      const faculty = createdUsers.filter(u => u.role === 'Faculty');
      
      console.log(`   - ${students.length} students`);
      console.log(`   - ${faculty.length} faculty`);
      
      return { students, faculty };
    } else {
      console.log('✅ All users already exist');
      const allUsers = await User.find({ role: { $in: ['Student', 'Faculty'] } });
      return {
        students: allUsers.filter(u => u.role === 'Student'),
        faculty: allUsers.filter(u => u.role === 'Faculty')
      };
    }
  } catch (error) {
    console.error('❌ Error generating users:', error.message);
    throw error;
  }
};

const generateMarksForUsers = async (students, subjects, faculty) => {
  try {
    if (students.length === 0 || subjects.length === 0) {
      console.log('⏭️  No students or subjects found, skipping marks generation');
      return;
    }
    
    console.log('📊 Generating student marks...');
    const marks = [];
    const examTypes = ['CIA1', 'CIA2', 'MODEL']; // Only supported exam types
    
    students.forEach(student => {
      // Each student has marks for 3-5 subjects
      const studentSubjects = subjects.slice(0, Math.floor(Math.random() * 3) + 3);
      
      studentSubjects.forEach(subject => {
        examTypes.forEach(examType => {
          if (Math.random() > 0.2) { // 80% chance student has marks for this exam
            const totalMarks = examType === 'MODEL' ? 100 : 50; // MODEL exam is usually 100 marks
            const percentage = Math.floor(Math.random() * 40) + 60; // 60-100%
            const obtainedMarks = Math.floor((percentage / 100) * totalMarks);
            
            // Get a random faculty member to be the one who entered the marks
            const randomFaculty = faculty[Math.floor(Math.random() * faculty.length)];
            
            marks.push({
              student: student._id,
              subject: subject._id,
              examType: examType,
              totalMarks: totalMarks,
              marksObtained: obtainedMarks, // Correct field name
              percentage: percentage,
              grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : 'C',
              academicYear: '2024-2025', // Correct format YYYY-YYYY
              semester: 'Odd', // Use enum value (Odd/Even)
              enteredBy: randomFaculty._id, // Required field
              status: 'Final' // Correct enum value
            });
          }
        });
      });
    });
    
    if (marks.length > 0) {
      const createdMarks = await StudentMarkEntry.insertMany(marks);
      console.log(`✅ Created ${createdMarks.length} mark entries`);
    }
  } catch (error) {
    console.error('❌ Error generating marks:', error.message);
    throw error;
  }
};

const generateMaterialsForChapters = async (chapters, faculty) => {
  try {
    if (chapters.length === 0 || faculty.length === 0) {
      console.log('⏭️  No chapters or faculty found, skipping materials generation');
      return;
    }
    
    console.log('📚 Generating study materials...');
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
          fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
          downloadCount: Math.floor(Math.random() * 100),
          tags: ['study-material', 'academic'],
          status: 'Published', // Correct enum value
          createdBy: randomFaculty._id // Required field
        });
      }
    });
    
    if (materials.length > 0) {
      const createdMaterials = await Material.insertMany(materials);
      console.log(`✅ Created ${createdMaterials.length} study materials`);
    }
  } catch (error) {
    console.error('❌ Error generating materials:', error.message);
    throw error;
  }
};

const addUsersAndData = async () => {
  try {
    console.log('🔄 Adding users and performance data to existing database...');
    
    // Generate users for existing departments
    const { students, faculty } = await generateUsersForExistingDepartments();
    
    // Get existing subjects and chapters
    const subjects = await Subject.find({});
    const chapters = await Chapter.find({});
    
    console.log(`📚 Found ${subjects.length} subjects and ${chapters.length} chapters`);
    
    // Generate marks if we have students and subjects
    const existingMarks = await StudentMarkEntry.countDocuments();
    if (existingMarks === 0) {
      // Get all faculty (existing + new) for marks generation
      const allFaculty = await User.find({ role: 'Faculty' });
      await generateMarksForUsers(students, subjects, allFaculty);
    } else {
      console.log(`✅ Found ${existingMarks} existing marks, skipping marks generation`);
    }
    
    // Generate materials if we have chapters and faculty
    const existingMaterials = await Material.countDocuments();
    if (existingMaterials === 0) {
      // Get all faculty (existing + new) for materials generation
      const allFaculty = await User.find({ role: 'Faculty' });
      await generateMaterialsForChapters(chapters, allFaculty);
    } else {
      console.log(`✅ Found ${existingMaterials} existing materials, skipping materials generation`);
    }
    
    // Final summary
    const finalCounts = {
      departments: await Department.countDocuments(),
      users: await User.countDocuments(),
      students: await User.countDocuments({ role: 'Student' }),
      faculty: await User.countDocuments({ role: 'Faculty' }),
      admins: await User.countDocuments({ role: 'Admin' }),
      subjects: await Subject.countDocuments(),
      chapters: await Chapter.countDocuments(),
      marks: await StudentMarkEntry.countDocuments(),
      materials: await Material.countDocuments()
    };
    
    console.log('\n🎉 User and data generation completed!');
    console.log('\n📊 Final Database Summary:');
    console.log(`   - Departments: ${finalCounts.departments}`);
    console.log(`   - Users: ${finalCounts.users} (${finalCounts.students} students, ${finalCounts.faculty} faculty, ${finalCounts.admins} admins)`);
    console.log(`   - Subjects: ${finalCounts.subjects}`);
    console.log(`   - Chapters: ${finalCounts.chapters}`);
    console.log(`   - Mark Entries: ${finalCounts.marks}`);
    console.log(`   - Study Materials: ${finalCounts.materials}`);
    
    console.log('\n🚀 Your analytics dashboard should now display comprehensive data!');
    
  } catch (error) {
    console.error('❌ Error adding users and data:', error);
  }
};

const runUserDataGenerator = async () => {
  await connectDB();
  await addUsersAndData();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

runUserDataGenerator();