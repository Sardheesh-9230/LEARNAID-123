const mongoose = require('mongoose');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const Chapter = require('./src/models/Chapter');
const CIAExam = require('./src/models/CIAExam');

mongoose.connect('mongodb://localhost:27017/learnaid')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function populateSampleMarks() {
  try {
    // Get a subject
    const subject = await Subject.findOne();
    if (!subject) {
      console.log('❌ No subjects found. Please create subjects first.');
      process.exit(1);
    }
    console.log(`📚 Using subject: ${subject.name} (${subject._id})`);

    // Get chapters for this subject
    const chapters = await Chapter.find({ subject: subject._id }).limit(3);
    if (chapters.length === 0) {
      console.log('❌ No chapters found. Please create chapters first.');
      process.exit(1);
    }
    console.log(`📖 Found ${chapters.length} chapters`);

    // Get students
    const students = await User.find({ role: 'Student' }).limit(10);
    if (students.length === 0) {
      console.log('❌ No students found. Please create students first.');
      process.exit(1);
    }
    console.log(`👥 Found ${students.length} students`);

    // Create or get a CIA exam
    let exam = await CIAExam.findOne({ course: subject._id, type: 'CIA1' });
    if (!exam) {
      exam = await CIAExam.create({
        course: subject._id,
        name: 'CIA 1',
        type: 'CIA1',
        examDate: new Date(),
        totalMarks: 50,
        duration: 90
      });
      console.log('✅ Created CIA1 exam');
    }
    console.log(`📝 Using exam: ${exam.name}`);

    // Clear existing marks for this subject
    await QuestionWiseMarks.deleteMany({ subject: subject._id });
    console.log('🗑️  Cleared existing marks');

    // Create sample marks for each student
    const courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
    let marksCreated = 0;

    for (const student of students) {
      for (let coIndex = 0; coIndex < courseOutcomes.length; coIndex++) {
        const co = courseOutcomes[coIndex];
        const chapter = chapters[coIndex % chapters.length];
        
        // Create 3-5 questions per CO for each student
        const questionCount = 3 + Math.floor(Math.random() * 3);
        
        for (let q = 1; q <= questionCount; q++) {
          // Generate performance: some students do well, some poorly
          const studentPerformance = Math.random();
          let percentage;
          
          // 40% of students struggle (below 60%)
          if (studentPerformance < 0.4) {
            percentage = 30 + Math.random() * 30; // 30-60%
          }
          // 60% of students do okay (60-100%)
          else {
            percentage = 60 + Math.random() * 40; // 60-100%
          }
          
          const maxMarks = 5 + Math.floor(Math.random() * 6); // 5-10 marks
          const marksObtained = Math.round((maxMarks * percentage) / 100);
          
          await QuestionWiseMarks.create({
            student: student._id,
            subject: subject._id,
            exam: exam._id,
            examType: 'CIA1',
            questionNumber: q,
            marksObtained: marksObtained,
            maxMarks: maxMarks,
            courseOutcome: co,
            unit: `Unit ${coIndex + 1}`,
            chapter: chapter._id,
            questionType: 'MCQ',
            bloomsLevel: 'Understanding',
            academicYear: subject.academicYear || '2024-2025',
            semester: subject.semester || 1
          });
          
          marksCreated++;
        }
      }
    }

    console.log(`\n✅ Successfully created ${marksCreated} mark entries!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Subject: ${subject.name}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Course Outcomes: ${courseOutcomes.length}`);
    console.log(`   - Total Marks: ${marksCreated}`);
    console.log(`\n🎯 You can now test CO analysis with subject ID: ${subject._id}`);
    console.log(`\n💡 Try these thresholds:`);
    console.log(`   - 50% - Will show students below 50% in any CO`);
    console.log(`   - 60% - Will show more students`);
    console.log(`   - 70% - Will show most students`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

populateSampleMarks();
