const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
require('dotenv').config();

async function testStudentMarks() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Get all student marks
    const marks = await StudentMarkEntry.find({})
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code')
      .limit(10);

    console.log(`Found ${marks.length} student mark entries:`);
    marks.forEach((mark, index) => {
      console.log(`${index + 1}. Student: ${mark.student?.name || 'Unknown'}`);
      console.log(`   Subject: ${mark.subject?.name || 'Unknown'}`);
      console.log(`   Exam: ${mark.examType}`);
      console.log(`   Marks: ${mark.marksObtained}/${mark.totalMarks} (${mark.percentage}%)`);
      console.log(`   Academic Year: ${mark.academicYear}, Semester: ${mark.semester}`);
      console.log('---');
    });

    // Test a specific student query
    if (marks.length > 0) {
      const firstStudentId = marks[0].student._id;
      console.log(`\nTesting query for student ID: ${firstStudentId}`);
      
      const studentMarks = await StudentMarkEntry.find({ 
        student: firstStudentId,
        academicYear: '2024-2025',
        semester: 'Odd'
      })
      .populate('subject', 'name code credits type')
      .populate('student', 'name email');

      console.log(`Found ${studentMarks.length} marks for this student:`);
      studentMarks.forEach(mark => {
        console.log(`- ${mark.subject.name}: ${mark.marksObtained}/${mark.totalMarks} (${mark.examType})`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

testStudentMarks();