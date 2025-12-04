const mongoose = require('mongoose');
const StudentMarkEntry = require('../src/models/StudentMarkEntry');
require('dotenv').config();

const testMarksData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const allMarks = await StudentMarkEntry.find({}).populate('student').populate('subject');
    console.log(`📊 Total marks entries: ${allMarks.length}`);
    
    if (allMarks.length > 0) {
      console.log('\n📈 Sample mark entries:');
      allMarks.slice(0, 5).forEach((mark, index) => {
        console.log(`${index + 1}. Student: ${mark.student?.name || 'Unknown'}`);
        console.log(`   Subject: ${mark.subject?.name || 'Unknown'}`);
        console.log(`   Exam: ${mark.examType}`);
        console.log(`   Marks: ${mark.marksObtained}/${mark.totalMarks} (${mark.percentage}%)`);
        console.log('');
      });
      
      // Group by exam type
      const examStats = {};
      allMarks.forEach(mark => {
        if (!examStats[mark.examType]) {
          examStats[mark.examType] = { count: 0, totalScore: 0 };
        }
        examStats[mark.examType].count++;
        examStats[mark.examType].totalScore += mark.percentage || 0;
      });
      
      console.log('📊 Performance by Exam Type:');
      Object.keys(examStats).forEach(examType => {
        const stats = examStats[examType];
        const avgScore = stats.totalScore / stats.count;
        console.log(`   ${examType}: ${stats.count} entries, avg: ${avgScore.toFixed(1)}%`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testMarksData();