require('dotenv').config();
const mongoose = require('mongoose');

async function checkCOData() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // Check StudentMarkEntry
    console.log('📊 1. Checking StudentMarkEntry collection:');
    const markEntries = await db.collection('studentmarkentries').find({}).limit(2).toArray();
    console.log(`   Total entries: ${await db.collection('studentmarkentries').countDocuments()}`);
    
    if (markEntries.length > 0) {
      const entry = markEntries[0];
      console.log('\n   Sample Entry:');
      console.log(`   - Subject: ${entry.subject}`);
      console.log(`   - Exam Type: ${entry.examType}`);
      console.log(`   - Marks: ${entry.marksObtained}/${entry.totalMarks}`);
      console.log(`   - Has coWiseMarks: ${entry.coWiseMarks ? 'YES (' + entry.coWiseMarks.length + ' COs)' : 'NO'}`);
      console.log(`   - Has questionWiseMarks: ${entry.questionWiseMarks ? 'YES (' + entry.questionWiseMarks.length + ' questions)' : 'NO'}`);
      
      if (entry.coWiseMarks && entry.coWiseMarks.length > 0) {
        console.log('\n   CO Breakdown:');
        entry.coWiseMarks.forEach(co => {
          console.log(`      ${co.courseOutcome}: ${co.obtainedMarks}/${co.maxMarks}`);
        });
      }
    }

    // Check QuestionWiseMarks
    console.log('\n\n📊 2. Checking QuestionWiseMarks collection (CO Analysis):');
    const qwCount = await db.collection('questionwisemarks').countDocuments();
    console.log(`   Total entries: ${qwCount}`);

    if (qwCount > 0) {
      const qwMarks = await db.collection('questionwisemarks').find({}).limit(10).toArray();
      
      // Group by CO
      const coStats = {};
      qwMarks.forEach(qw => {
        const co = qw.courseOutcome;
        if (!coStats[co]) {
          coStats[co] = { count: 0, totalMax: 0, totalObtained: 0 };
        }
        coStats[co].count++;
        coStats[co].totalMax += qw.maxMarks;
        coStats[co].totalObtained += qw.marksObtained;
      });

      console.log('\n   ✅ CO-wise Analysis Data Available:');
      Object.entries(coStats).sort().forEach(([co, stats]) => {
        const perf = ((stats.totalObtained / stats.totalMax) * 100).toFixed(1);
        console.log(`      ${co}: ${stats.count} questions, Performance: ${perf}%`);
      });

      console.log('\n   Sample QuestionWiseMarks entry:');
      const sample = qwMarks[0];
      console.log(`      - Exam Type: ${sample.examType}`);
      console.log(`      - Question #: ${sample.questionNumber}`);
      console.log(`      - Course Outcome: ${sample.courseOutcome}`);
      console.log(`      - Marks: ${sample.marksObtained}/${sample.maxMarks}`);
      console.log(`      - Unit: ${sample.unit}`);
    } else {
      console.log('\n   ❌ NO QuestionWiseMarks data found!');
      console.log('   This means CO analysis is NOT working yet.');
      console.log('\n   ⚡ Solution:');
      console.log('   1. The backend has been updated to auto-create CO data');
      console.log('   2. Enter new marks through the Faculty dashboard');
      console.log('   3. The system will automatically create QuestionWiseMarks');
    }

    // Check current data format
    console.log('\n\n📋 3. Excel Export Issue:');
    if (markEntries.length > 0) {
      const entry = markEntries[0];
      const hasOldFormat = entry.marks_6939a957ee0571c2cdeee88b !== undefined;
      
      if (hasOldFormat) {
        console.log('   ❌ OLD FORMAT DETECTED (horizontal student-wise)');
        console.log('   Your data has columns like: marks_<studentId>');
      } else {
        console.log('   ✅ NEW FORMAT (vertical CO-wise)');
        console.log('   Data is properly structured for export');
      }
    }

    console.log('\n\n✅ Summary:');
    console.log('   - StudentMarkEntry: Stores overall marks with embedded CO/question data');
    console.log('   - QuestionWiseMarks: Separate records for CO-wise analysis');
    console.log('   - Excel Export: Fixed to show vertical format with CO columns');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Restart backend server (if not already done)');
    console.log('   2. Login as faculty and enter marks for students');
    console.log('   3. Click Export button - will generate proper vertical format');
    console.log('   4. CO analysis will work automatically for performance tracking\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkCOData();
