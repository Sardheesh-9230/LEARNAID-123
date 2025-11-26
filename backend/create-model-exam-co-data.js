const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const CIAExam = require('./src/models/CIAExam');
require('dotenv').config();

async function createModelExamCOData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Find Sardheesh M
    const student = await User.findById('691ec0a90f8e5b823f4a43fc');
    if (!student) {
      console.log('❌ Student not found');
      return;
    }
    console.log(`Found student: ${student.name}`);

    // Find Engineering Graphics subject (note the typo in the database)
    const subject = await Subject.findById('691da401e905bbe84e7e2167');
    if (!subject) {
      console.log('❌ Engineering Graphics subject not found');
      return;
    }
    console.log(`Found subject: ${subject.name} (${subject.code})`);

    // Ensure subject has COs
    if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
      subject.courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
      await subject.save();
      console.log('Added course outcomes to subject');
    }

    // Check if MODEL exam mark entry exists
    let modelMarkEntry = await StudentMarkEntry.findOne({
      student: student._id,
      subject: subject._id,
      examType: 'MODEL'
    });

    if (!modelMarkEntry) {
      // Get faculty for enteredBy
      let faculty = await User.findOne({ role: 'Faculty' });
      if (!faculty) {
        // Create a faculty if doesn't exist
        const departments = await mongoose.connection.db.collection('departments').find({}).limit(1).toArray();
        const departmentId = departments.length > 0 ? departments[0]._id : new mongoose.Types.ObjectId();

        faculty = new User({
          name: 'Faculty User',
          email: 'faculty@example.com',
          password: 'password123',
          role: 'Faculty',
          department: departmentId,
          designation: 'Assistant Professor',
          qualification: 'M.Tech',
          experience: 3,
          specialization: ['Engineering'],
          employeeId: 'EMP_FAC_001'
        });
        await faculty.save();
        console.log('Created faculty user');
      }

      // Create MODEL exam marks entry (generate marks between 40-80 to test CO analysis)
      const totalMarks = 100;
      const marksObtained = Math.floor(Math.random() * 40) + 40; // 40-80 marks
      const percentage = (marksObtained / totalMarks) * 100;

      modelMarkEntry = new StudentMarkEntry({
        student: student._id,
        subject: subject._id,
        examType: 'MODEL',
        marksObtained: marksObtained,
        totalMarks: totalMarks,
        percentage: percentage,
        grade: percentage >= 90 ? 'O' :
               percentage >= 80 ? 'A+' :
               percentage >= 70 ? 'A' :
               percentage >= 60 ? 'B+' :
               percentage >= 50 ? 'B' :
               percentage >= 40 ? 'C' : 'F',
        academicYear: '2024-2025',
        semester: 'Odd',
        enteredBy: faculty._id,
        enteredAt: new Date()
      });

      await modelMarkEntry.save();
      console.log(`Created MODEL exam entry: ${marksObtained}/100 (${percentage.toFixed(1)}%)`);
    }

    // Create or find CIA exam for reference
    let ciaExam = await CIAExam.findOne({ 
      subject: subject._id, 
      examType: 'MODEL',
      academicYear: '2024-2025' 
    });

    if (!ciaExam) {
      ciaExam = new CIAExam({
        subject: subject._id,
        examType: 'MODEL',
        title: 'Model Examination - Engineering Graphics',
        description: 'Model examination for Engineering Graphics with CO-wise questions',
        date: new Date(),
        duration: 180, // 3 hours
        totalMarks: 100,
        academicYear: '2024-2025',
        semester: 'Odd',
        createdBy: await User.findOne({ role: 'Faculty' }),
        questions: [] // We'll add questions below
      });
      await ciaExam.save();
      console.log('Created CIA exam reference');
    }

    // Delete existing question-wise marks to recreate
    await QuestionWiseMarks.deleteMany({
      student: student._id,
      subject: subject._id,
      examType: 'MODEL'
    });
    console.log('Cleared existing question-wise marks');

    // Create question-wise marks structure
    const courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
    const questionWiseMarks = [];
    let questionNumber = 1;

    console.log('\n📝 Creating question-wise marks structure:');
    console.log('Structure: 10 questions × 2 marks (2 per CO) + 5 questions × 16 marks (1 per CO)');

    // Create 2-mark questions (2 per CO)
    for (let coIndex = 0; coIndex < courseOutcomes.length; coIndex++) {
      const co = courseOutcomes[coIndex];
      
      // Create 2 questions of 2 marks each for this CO
      for (let qNum = 0; qNum < 2; qNum++) {
        // Generate marks for 2-mark questions
        // Some COs will have lower performance for testing
        let obtainedMarks;
        if (co === 'CO1' || co === 'CO3') {
          // Make CO1 and CO3 perform poorly (below 50%)
          obtainedMarks = Math.random() < 0.7 ? 0 : 1; // 0-1 marks (0-50%)
        } else {
          // Other COs perform better
          obtainedMarks = Math.floor(Math.random() * 2) + 1; // 1-2 marks (50-100%)
        }

        const qwMark = new QuestionWiseMarks({
          studentMarkEntry: modelMarkEntry._id,
          student: student._id,
          subject: subject._id,
          exam: ciaExam._id,
          examType: 'MODEL',
          questionNumber: questionNumber,
          questionText: `Question ${questionNumber}: 2-mark question for ${co}`,
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
        questionNumber++;
      }
    }

    // Create 16-mark questions (1 per CO)
    for (let coIndex = 0; coIndex < courseOutcomes.length; coIndex++) {
      const co = courseOutcomes[coIndex];
      
      // Generate marks for 16-mark questions
      let obtainedMarks;
      if (co === 'CO2' || co === 'CO4') {
        // Make CO2 and CO4 perform poorly (below 50%)
        obtainedMarks = Math.floor(Math.random() * 6) + 2; // 2-8 marks (12.5-50%)
      } else if (co === 'CO1') {
        // CO1 moderate performance
        obtainedMarks = Math.floor(Math.random() * 5) + 6; // 6-10 marks (37.5-62.5%)
      } else {
        // CO3 and CO5 good performance
        obtainedMarks = Math.floor(Math.random() * 6) + 10; // 10-16 marks (62.5-100%)
      }

      const qwMark = new QuestionWiseMarks({
        studentMarkEntry: modelMarkEntry._id,
        student: student._id,
        subject: subject._id,
        exam: ciaExam._id,
        examType: 'MODEL',
        questionNumber: questionNumber,
        questionText: `Question ${questionNumber}: 16-mark question for ${co}`,
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
      questionNumber++;
    }

    console.log(`\n✅ Created ${questionWiseMarks.length} question-wise mark entries`);

    // Calculate and display CO performance
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
      
      console.log(`${co}: ${perf.obtainedMarks}/${perf.totalMarks} (${percentage.toFixed(1)}%) ${status} [${perf.questionCount} questions]`);
    });

    console.log(`\n🎯 COs below 50% threshold: ${belowThresholdCOs.length > 0 ? belowThresholdCOs.join(', ') : 'None'}`);

    // Test the CO analysis API
    console.log('\n🧪 Testing CO Analysis API with new data...');
    
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
          console.log(`\n📤 CO Analysis API Response (Status: ${code}):`);
          if (data.success) {
            console.log(`✅ Analysis successful!`);
            console.log(`📊 Total COs: ${data.data.totalCOs}`);
            console.log(`🎯 Attained COs: ${data.data.attainedCOs}`);
            console.log(`❌ Not Attained COs: ${data.data.notAttainedCOs}`);
            console.log(`📈 Average Performance: ${data.data.overallPerformance.averagePercentage}%`);
            console.log(`📋 Tasks Assigned: ${data.data.tasksAssigned.length}`);
            
            if (data.data.tasksAssigned.length > 0) {
              console.log('\n📝 Assigned Tasks:');
              data.data.tasksAssigned.forEach((task, i) => {
                console.log(`${i + 1}. ${task.courseOutcome}: ${task.message} (${task.status})`);
              });
            }
          } else {
            console.log(`❌ Analysis failed: ${data.message}`);
          }
          return data;
        }
      })
    };

    await analyzeCOPerformanceAndAssignTasks(req, res);

  } catch (error) {
    console.error('❌ Error creating model exam CO data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

createModelExamCOData();