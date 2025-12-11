const mongoose = require('mongoose');
require('dotenv').config();
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');

async function fixVijayMarks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Load models
    require('./src/models/User');
    const StudentMarkEntry = require('./src/models/StudentMarkEntry');

    // Find Vijay's entry
    const vijayEntry = await StudentMarkEntry.findOne({
      examType: 'CIA1'
    }).populate('student', 'name');

    const entries = await StudentMarkEntry.find({
      examType: 'CIA1'
    }).populate('student', 'name');

    console.log('\n📊 Processing both students...\n');

    for (const markEntry of entries) {
      const studentName = markEntry.student?.name;
      console.log(`\n👤 Processing: ${studentName}`);

      const { student, subject, examType, _id: markEntryId } = markEntry;
      
      // Check existing QuestionWiseMarks
      const existing = await QuestionWiseMarks.countDocuments({
        studentMarkEntry: markEntryId
      });
      
      console.log(`   Existing QuestionWiseMarks: ${existing}`);

      if (existing > 0) {
        console.log('   ✅ Already has QuestionWiseMarks, skipping...');
        continue;
      }

      const questionWiseEntries = [];
      const dummyExamId = new mongoose.Types.ObjectId();

      // Process question-wise marks
      if (markEntry.questionWiseMarks && markEntry.questionWiseMarks.length > 0) {
        console.log(`   📝 Processing ${markEntry.questionWiseMarks.length} questions`);
        
        markEntry.questionWiseMarks.forEach((questionMark) => {
          const { 
            questionNumber, 
            unit, 
            maxMarks, 
            obtainedMarks, 
            questionType, 
            section,
            courseOutcome 
          } = questionMark;
          
          // Determine CO from unit
          const determinedCO = courseOutcome || `CO${unit || 1}`;
          
          questionWiseEntries.push({
            studentMarkEntry: markEntryId,
            student,
            subject,
            exam: dummyExamId,
            examType,
            questionNumber,
            questionText: `Question ${questionNumber} (${determinedCO})`,
            marksObtained: obtainedMarks || 0,
            maxMarks: maxMarks || 2,
            courseOutcome: determinedCO,
            unit: unit || 1,
            questionType: questionType || '2mark',
            section: section || 'A',
            bloomsLevel: questionType === '16mark' ? 'L4' : 'L2',
            academicYear: markEntry.academicYear,
            semester: markEntry.semester
          });
        });

        // Insert
        if (questionWiseEntries.length > 0) {
          await QuestionWiseMarks.insertMany(questionWiseEntries);
          console.log(`   ✅ Created ${questionWiseEntries.length} QuestionWiseMarks entries`);
          
          // Show CO distribution
          const coDistribution = {};
          questionWiseEntries.forEach(entry => {
            if (!coDistribution[entry.courseOutcome]) {
              coDistribution[entry.courseOutcome] = { 
                questions: 0, 
                totalMarks: 0, 
                obtainedMarks: 0 
              };
            }
            coDistribution[entry.courseOutcome].questions++;
            coDistribution[entry.courseOutcome].totalMarks += entry.maxMarks;
            coDistribution[entry.courseOutcome].obtainedMarks += entry.marksObtained;
          });
          
          console.log('   📊 CO Distribution:', JSON.stringify(coDistribution, null, 2));
        }
      }
    }

    console.log('\n✅ Done! Closing connection...');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVijayMarks();
