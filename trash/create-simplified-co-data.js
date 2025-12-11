const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const CIAExam = require('./src/models/CIAExam');
require('dotenv').config();

async function createSimplifiedCOData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Find Sardheesh M and Engineering Graphics subject
    const student = await User.findById('691ec0a90f8e5b823f4a43fc');
    const subject = await Subject.findById('691da401e905bbe84e7e2167');
    
    if (!student || !subject) {
      console.log('❌ Student or subject not found');
      return;
    }
    
    console.log(`Student: ${student.name}`);
    console.log(`Subject: ${subject.name} (${subject.code})`);

    // Ensure subject has COs
    if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
      subject.courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
      await subject.save();
      console.log('Added course outcomes to subject');
    }

    // Check if we have any existing CIAExam we can use, or create a simple one
    let exam = await CIAExam.findOne({ subject: subject._id });
    if (!exam) {
      console.log('No existing exam found. Creating question-wise marks without exam reference.');
      
      // Instead of creating CIAExam, let's modify QuestionWiseMarks to not require it
      // Let's create a simple approach by making the exam field optional for now
      
      // Clear existing question-wise marks
      await QuestionWiseMarks.deleteMany({
        student: student._id,
        subject: subject._id,
        examType: 'MODEL'
      });
      console.log('Cleared existing question-wise marks');

      // Get the student mark entry for MODEL exam
      const modelMarkEntry = await StudentMarkEntry.findOne({
        student: student._id,
        subject: subject._id,
        examType: 'MODEL'
      });

      if (!modelMarkEntry) {
        console.log('❌ No MODEL exam mark entry found. Please create it first.');
        return;
      }

      // Create simplified question-wise marks without exam reference
      const courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
      let questionNumber = 1;
      const questionWiseMarks = [];

      console.log('\n📝 Creating question-wise marks structure:');
      console.log('Structure: 10 questions × 2 marks + 5 questions × 16 marks = 100 marks');

      // Create a dummy exam ObjectId for the required field
      const dummyExamId = new mongoose.Types.ObjectId();

      // Create 2-mark questions (2 per CO)
      for (let coIndex = 0; coIndex < courseOutcomes.length; coIndex++) {
        const co = courseOutcomes[coIndex];
        
        for (let qNum = 0; qNum < 2; qNum++) {
          let obtainedMarks;
          // Make some COs perform poorly for testing
          if (co === 'CO1' || co === 'CO3') {
            obtainedMarks = Math.random() < 0.6 ? 0 : 1; // Poor performance
          } else {
            obtainedMarks = Math.floor(Math.random() * 2) + 1; // Good performance
          }

          try {
            const qwMark = new QuestionWiseMarks({
              studentMarkEntry: modelMarkEntry._id,
              student: student._id,
              subject: subject._id,
              exam: dummyExamId, // Using dummy exam ID
              examType: 'MODEL',
              questionNumber: questionNumber,
              questionText: `2-mark question for ${co}`,
              marksObtained: obtainedMarks,
              maxMarks: 2,
              courseOutcome: co,
              unit: coIndex + 1,
              questionType: '2mark',
              section: 'A',
              bloomsLevel: 'L2',
              academicYear: '2024-2025',
              semester: 'Odd'
            });

            await qwMark.save();
            questionWiseMarks.push(qwMark);
            console.log(`Q${questionNumber}: ${co} (2 marks) → ${obtainedMarks}/2`);
          } catch (error) {
            console.log(`Error creating Q${questionNumber}:`, error.message);
          }
          
          questionNumber++;
        }
      }

      // Create 16-mark questions (1 per CO)
      for (let coIndex = 0; coIndex < courseOutcomes.length; coIndex++) {
        const co = courseOutcomes[coIndex];
        
        let obtainedMarks;
        // Make some COs perform poorly
        if (co === 'CO2' || co === 'CO4') {
          obtainedMarks = Math.floor(Math.random() * 6) + 2; // 2-8 marks (poor)
        } else if (co === 'CO1') {
          obtainedMarks = Math.floor(Math.random() * 4) + 6; // 6-10 marks (moderate)
        } else {
          obtainedMarks = Math.floor(Math.random() * 6) + 10; // 10-16 marks (good)
        }

        try {
          const qwMark = new QuestionWiseMarks({
            studentMarkEntry: modelMarkEntry._id,
            student: student._id,
            subject: subject._id,
            exam: dummyExamId, // Using dummy exam ID
            examType: 'MODEL',
            questionNumber: questionNumber,
            questionText: `16-mark question for ${co}`,
            marksObtained: obtainedMarks,
            maxMarks: 16,
            courseOutcome: co,
            unit: coIndex + 1,
            questionType: '16mark',
            section: 'B',
            bloomsLevel: 'L4',
            academicYear: '2024-2025',
            semester: 'Odd'
          });

          await qwMark.save();
          questionWiseMarks.push(qwMark);
          console.log(`Q${questionNumber}: ${co} (16 marks) → ${obtainedMarks}/16`);
        } catch (error) {
          console.log(`Error creating Q${questionNumber}:`, error.message);
        }
        
        questionNumber++;
      }

      console.log(`\n✅ Created ${questionWiseMarks.length} question-wise mark entries`);

      // Calculate CO performance
      console.log('\n📊 CO Performance Analysis:');
      const coPerformance = {};
      
      questionWiseMarks.forEach(qw => {
        if (!coPerformance[qw.courseOutcome]) {
          coPerformance[qw.courseOutcome] = {
            totalMarks: 0,
            obtainedMarks: 0,
            questionCount: 0
          };
        }
        coPerformance[qw.courseOutcome].totalMarks += qw.maxMarks;
        coPerformance[qw.courseOutcome].obtainedMarks += qw.marksObtained;
        coPerformance[qw.courseOutcome].questionCount += 1;
      });

      let belowThresholdCOs = [];
      
      Object.keys(coPerformance).sort().forEach(co => {
        const perf = coPerformance[co];
        const percentage = (perf.obtainedMarks / perf.totalMarks) * 100;
        const status = percentage >= 50 ? '✅ Attained' : '❌ Not Attained';
        
        if (percentage < 50) {
          belowThresholdCOs.push(co);
        }
        
        console.log(`${co}: ${perf.obtainedMarks}/${perf.totalMarks} (${percentage.toFixed(1)}%) ${status}`);
      });

      console.log(`\n🎯 COs below 50% threshold: ${belowThresholdCOs.length > 0 ? belowThresholdCOs.join(', ') : 'None'}`);

      // Test CO analysis
      console.log('\n🧪 Testing CO Analysis API...');
      
      const { analyzeCOPerformanceAndAssignTasks } = require('./src/controllers/coPerformanceController');
      
      const req = {
        body: {
          studentId: student._id.toString(),
          subjectId: subject._id.toString(),
          academicYear: '2024-2025',
          threshold: 50
        }
      };
      
      const res = {
        status: (code) => ({
          json: (data) => {
            console.log(`\n📤 API Response (Status: ${code}):`);
            if (data.success) {
              console.log(`✅ Analysis successful!`);
              console.log(`Total COs: ${data.data.totalCOs} | Attained: ${data.data.attainedCOs} | Not Attained: ${data.data.notAttainedCOs}`);
              console.log(`Average Performance: ${data.data.overallPerformance.averagePercentage}%`);
              console.log(`Tasks Assigned: ${data.data.tasksAssigned.length}`);
              
              if (data.data.tasksAssigned.length > 0) {
                console.log('\n📝 Tasks:');
                data.data.tasksAssigned.forEach(task => {
                  console.log(`- ${task.courseOutcome}: ${task.message} (${task.status})`);
                });
              }
            } else {
              console.log(`❌ Failed: ${data.message}`);
            }
            return data;
          }
        })
      };

      await analyzeCOPerformanceAndAssignTasks(req, res);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

createSimplifiedCOData();