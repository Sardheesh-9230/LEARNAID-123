const mongoose = require('mongoose');
const Subject = require('./src/models/Subject');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
require('dotenv').config();

async function debugStudentSubjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB\n');

    // Find a student
    const students = await User.find({ role: 'Student' }).limit(5);
    console.log(`Found ${students.length} students:`);
    
    students.forEach((student, i) => {
      console.log(`${i + 1}. ${student.name} (${student.email})`);
      console.log(`   - Department: ${student.department}`);
      console.log(`   - Year: ${student.year || 'NOT SET'}`);
      console.log(`   - Section: ${student.section || 'NOT SET'}`);
      console.log(`   - Batch: ${student.batch || 'NOT SET'}`);
    });

    if (students.length > 0) {
      const student = students[0];
      console.log(`\n--- Checking subjects for: ${student.name} ---`);
      console.log(`Department ID: ${student.department}`);
      console.log(`Year: ${student.year}`);
      console.log(`Section: ${student.section}`);

      // Check all subjects
      const allSubjects = await Subject.find({})
        .populate('department', 'name code')
        .limit(10);
      console.log(`\nTotal subjects in database: ${await Subject.countDocuments()}`);
      console.log(`\nFirst 10 subjects:`);
      allSubjects.forEach((subject, i) => {
        console.log(`${i + 1}. ${subject.name} (${subject.code})`);
        console.log(`   - Department: ${subject.department?.name} (${subject.department?._id})`);
        console.log(`   - Year: ${subject.year}`);
        console.log(`   - Section: ${subject.section}`);
        console.log(`   - Active: ${subject.isActive}`);
      });

      // Try to find subjects for this student
      console.log(`\n--- Matching subjects for student ---`);
      
      // Try with just department
      const byDept = await Subject.find({
        department: student.department,
        isActive: true
      }).populate('department', 'name code');
      console.log(`Subjects by department only: ${byDept.length}`);

      // Try with department and year
      if (student.year) {
        const byDeptYear = await Subject.find({
          department: student.department,
          year: student.year,
          isActive: true
        }).populate('department', 'name code');
        console.log(`Subjects by department + year: ${byDeptYear.length}`);
      }

      // Try with department, year and section
      if (student.year && student.section) {
        const byAll = await Subject.find({
          department: student.department,
          year: student.year,
          section: student.section,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } },
            { isActive: null }
          ]
        }).populate('department', 'name code');
        console.log(`Subjects by department + year + section (with isActive handling): ${byAll.length}`);
        
        if (byAll.length > 0) {
          console.log('\nMatching subjects:');
          byAll.forEach((s, i) => {
            console.log(`${i + 1}. ${s.name} (${s.code})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugStudentSubjects();
