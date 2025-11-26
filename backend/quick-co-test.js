const mongoose = require('mongoose');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const { analyzeCOPerformanceAndAssignTasks } = require('./src/controllers/coPerformanceController');
require('dotenv').config();

async function quickCOTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Test with the existing data
    const studentId = '691ec0a90f8e5b823f4a43fc';
    const subjectId = '691da401e905bbe84e7e2167';

    // Check question-wise marks
    const qwMarks = await QuestionWiseMarks.find({
      student: new mongoose.Types.ObjectId(studentId),
      subject: new mongoose.Types.ObjectId(subjectId)
    });

    console.log(`Found ${qwMarks.length} question-wise marks for CO analysis`);

    if (qwMarks.length > 0) {
      // Mock request with user - using valid ObjectId
      const systemUserId = new mongoose.Types.ObjectId();
      const req = {
        body: {
          studentId,
          subjectId,
          academicYear: '2024-2025',
          threshold: 50
        },
        user: { id: systemUserId.toString() } // Valid ObjectId as string
      };

      let responseData = null;
      const res = {
        status: (code) => ({
          json: (data) => {
            responseData = data;
            console.log(`\n📤 Response (${code}):`, JSON.stringify(data, null, 2));
            return data;
          }
        })
      };

      await analyzeCOPerformanceAndAssignTasks(req, res);

      if (responseData?.success) {
        console.log('\n🎉 CO Analysis System is working perfectly!');
        console.log(`✅ COs analyzed: ${responseData.data.totalCOs}`);
        console.log(`✅ Below threshold: ${responseData.data.notAttainedCOs}`);
        console.log(`✅ Tasks assigned: ${responseData.data.tasksAssigned.length}`);
        
        const successfulTasks = responseData.data.tasksAssigned.filter(t => t.status === 'assigned');
        console.log(`✅ Successfully assigned: ${successfulTasks.length} improvement tasks`);
      }
    } else {
      console.log('❌ No question-wise marks found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

quickCOTest();