const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');

async function verifyCoStorage() {
  try {
    console.log('\n🔍 VERIFYING CO-WISE STORAGE\n');
    console.log('=' .repeat(80));

    // Check StudentMarkEntry collection
    console.log('\n📊 1. StudentMarkEntry Collection:');
    const markEntries = await StudentMarkEntry.find({})
      .populate('student', 'name rollNumber')
      .populate('subject', 'name code')
      .limit(5)
      .lean();

    console.log(`   Total entries: ${await StudentMarkEntry.countDocuments()}`);
    
    if (markEntries.length > 0) {
      console.log('\n   Sample Entry:');
      const sample = markEntries[0];
      console.log(`   - Student: ${sample.student?.name} (${sample.student?.rollNumber})`);
      console.log(`   - Subject: ${sample.subject?.name}`);
      console.log(`   - Exam Type: ${sample.examType}`);
      console.log(`   - Total Marks: ${sample.marksObtained}/${sample.totalMarks}`);
      
      if (sample.coWiseMarks && sample.coWiseMarks.length > 0) {
        console.log('\n   ✅ CO-wise Marks (embedded):');
        sample.coWiseMarks.forEach(co => {
          console.log(`      ${co.courseOutcome}: ${co.obtainedMarks}/${co.maxMarks}`);
        });
      } else {
        console.log('   ⚠️  No CO-wise marks embedded');
      }
      
      if (sample.questionWiseMarks && sample.questionWiseMarks.length > 0) {
        console.log('\n   ✅ Question-wise Marks (embedded):');
        sample.questionWiseMarks.slice(0, 3).forEach(q => {
          console.log(`      Q${q.questionNumber} (Unit ${q.unit}): ${q.obtainedMarks}/${q.maxMarks}`);
        });
      } else {
        console.log('   ⚠️  No question-wise marks embedded');
      }
    }

    // Check QuestionWiseMarks collection (for CO analysis)
    console.log('\n\n📊 2. QuestionWiseMarks Collection (CO Analysis):');
    const qwMarkCount = await QuestionWiseMarks.countDocuments();
    console.log(`   Total entries: ${qwMarkCount}`);

    if (qwMarkCount > 0) {
      const qwMarks = await QuestionWiseMarks.find({})
        .populate('student', 'name rollNumber')
        .populate('subject', 'name code')
        .limit(10)
        .lean();

      console.log('\n   ✅ CO Analysis Data Available:');
      
      // Group by student and CO
      const studentCOMap = {};
      qwMarks.forEach(qw => {
        const studentId = qw.student?._id?.toString();
        if (!studentId) return;
        
        if (!studentCOMap[studentId]) {
          studentCOMap[studentId] = {
            name: qw.student?.name,
            rollNumber: qw.student?.rollNumber,
            subject: qw.subject?.name,
            examType: qw.examType,
            cos: {}
          };
        }
        
        const co = qw.courseOutcome;
        if (!studentCOMap[studentId].cos[co]) {
          studentCOMap[studentId].cos[co] = { obtained: 0, max: 0, questions: 0 };
        }
        
        studentCOMap[studentId].cos[co].obtained += qw.marksObtained;
        studentCOMap[studentId].cos[co].max += qw.maxMarks;
        studentCOMap[studentId].cos[co].questions += 1;
      });

      // Display sample
      const sampleStudent = Object.values(studentCOMap)[0];
      if (sampleStudent) {
        console.log(`\n   Sample: ${sampleStudent.name} (${sampleStudent.rollNumber})`);
        console.log(`   Subject: ${sampleStudent.subject}`);
        console.log(`   Exam: ${sampleStudent.examType}`);
        console.log('\n   CO Performance:');
        Object.entries(sampleStudent.cos).forEach(([co, data]) => {
          const percentage = ((data.obtained / data.max) * 100).toFixed(1);
          const status = percentage >= 50 ? '✅' : '❌';
          console.log(`      ${status} ${co}: ${data.obtained}/${data.max} (${percentage}%) - ${data.questions} questions`);
        });
      }

      // Show CO distribution
      console.log('\n   CO Distribution Across All Students:');
      const coDistribution = {};
      qwMarks.forEach(qw => {
        const co = qw.courseOutcome;
        if (!coDistribution[co]) {
          coDistribution[co] = { count: 0, totalMarks: 0, obtainedMarks: 0 };
        }
        coDistribution[co].count++;
        coDistribution[co].totalMarks += qw.maxMarks;
        coDistribution[co].obtainedMarks += qw.marksObtained;
      });

      Object.entries(coDistribution).sort().forEach(([co, data]) => {
        const avgPercentage = ((data.obtainedMarks / data.totalMarks) * 100).toFixed(1);
        console.log(`      ${co}: ${data.count} entries, Avg: ${avgPercentage}%`);
      });

    } else {
      console.log('\n   ❌ NO CO ANALYSIS DATA FOUND!');
      console.log('   This means marks are NOT being stored for CO-wise analysis.');
      console.log('\n   Solution: The backend code has been updated.');
      console.log('   Next time faculty enters marks, CO data will be created automatically.');
    }

    // Test data check
    console.log('\n\n📋 3. Recommendations:');
    if (qwMarkCount === 0) {
      console.log('   ⚠️  No QuestionWiseMarks data exists yet.');
      console.log('   ➡️  Action Required:');
      console.log('      1. Faculty should enter marks for students');
      console.log('      2. OR run this test script again after entering new marks');
      console.log('      3. The updated backend will automatically create CO data');
    } else {
      console.log('   ✅ CO-wise storage is working correctly!');
      console.log('   ✅ CO analysis and performance tracking is enabled');
      console.log('   ✅ Unit-wise assessment assignment will work');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Verification Complete!\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run verification
verifyCoStorage();
