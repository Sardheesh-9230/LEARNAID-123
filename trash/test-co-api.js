const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
require('dotenv').config();

async function testCOAnalysisAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Get test data
    const students = await User.find({ role: 'Student' }).limit(2);
    const subjects = await Subject.find({}).limit(3);
    
    console.log(`Found ${students.length} students and ${subjects.length} subjects`);

    if (students.length === 0 || subjects.length === 0) {
      console.log('❌ No students or subjects found for testing');
      return;
    }

    // Check if we have any student marks
    const marks = await StudentMarkEntry.find({}).limit(10);
    console.log(`Found ${marks.length} student mark entries`);

    if (marks.length > 0) {
      console.log('\n📊 Existing marks data:');
      const sampleMarks = await StudentMarkEntry.find({})
        .populate('student', 'name email')
        .populate('subject', 'name code')
        .limit(5);

      sampleMarks.forEach((mark, i) => {
        console.log(`${i + 1}. ${mark.student?.name} - ${mark.subject?.name} (${mark.examType}): ${mark.marksObtained}/${mark.totalMarks} (${mark.percentage?.toFixed(1)}%)`);
      });
    }

    // Test the CO analysis endpoint by making a direct API call
    console.log('\n🧪 Testing CO Analysis API...');
    
    const testStudent = students[0];
    const testSubject = subjects[0];
    
    console.log(`Test Student: ${testStudent.name} (ID: ${testStudent._id})`);
    console.log(`Test Subject: ${testSubject.name} (ID: ${testSubject._id})`);

    // Import the controller for direct testing
    const { analyzeCOPerformanceAndAssignTasks } = require('./src/controllers/coPerformanceController');
    
    // Test data for CO analysis
    const requestBody = {
      studentId: testStudent._id.toString(),
      subjectId: testSubject._id.toString(),
      academicYear: '2024-2025',
      threshold: 50
    };

    console.log('\n🔄 Calling CO Analysis controller...');
    
    // Mock request and response objects
    const req = {
      body: requestBody
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`\n📤 API Response (Status: ${code}):`);
          console.log(JSON.stringify(data, null, 2));
          return data;
        }
      })
    };

    // Call the controller function
    await analyzeCOPerformanceAndAssignTasks(req, res);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testCOAnalysisAPI();