const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ImprovementTask = require('./src/models/ImprovementTask');
require('dotenv').config();

async function addMarksAndCOData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Get all students and subjects
    const students = await User.find({ role: 'Student' });
    const subjects = await Subject.find({});
    
    console.log(`Found ${students.length} students and ${subjects.length} subjects`);

    if (students.length === 0 || subjects.length === 0) {
      console.log('❌ No students or subjects found. Please create them first.');
      return;
    }

    // For each student, create marks for each subject
    for (const student of students) {
      console.log(`\nProcessing student: ${student.name}`);
      
      for (const subject of subjects.slice(0, 3)) { // Use first 3 subjects
        // Add courseOutcomes if not present
        if (!subject.courseOutcomes || subject.courseOutcomes.length === 0) {
          subject.courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
          await subject.save();
          console.log(`Added COs to subject: ${subject.name}`);
        }

        // Create marks for each exam type
        const examTypes = ['CIA1', 'CIA2', 'MODEL'];
        
        for (const examType of examTypes) {
          // Check if marks already exist
          const existingMark = await StudentMarkEntry.findOne({
            student: student._id,
            subject: subject._id,
            examType: examType
          });

          if (!existingMark) {
            // Get or create a faculty user to be the enteredBy
            let faculty = await User.findOne({ role: 'Faculty' });
            if (!faculty) {
              // Get any department for the faculty
              const departments = await mongoose.connection.db.collection('departments').find({}).limit(1).toArray();
              const departmentId = departments.length > 0 ? departments[0]._id : new mongoose.Types.ObjectId();

              faculty = new User({
                name: 'Test Faculty',
                email: 'testfaculty@example.com',
                password: 'password123',
                role: 'Faculty',
                department: departmentId,
                designation: 'Assistant Professor',
                qualification: 'M.Tech',
                experience: 3,
                specialization: ['Computer Science'],
                employeeId: 'EMP_FAC_001234'
              });
              await faculty.save();
              console.log('Created test faculty:', faculty.name);
            }

            // Generate marks (some below 50% for testing CO analysis)
            const totalMarks = examType === 'MODEL' ? 100 : 60;
            let marksObtained;
            
            // Create variety: some subjects will have low marks for CO testing
            if (subject.code === 'CS301' && examType === 'CIA1') {
              marksObtained = Math.floor(Math.random() * 25) + 15; // 15-40 (below 50%)
            } else if (subject.code === 'CS302' && examType === 'CIA2') {
              marksObtained = Math.floor(Math.random() * 20) + 20; // 20-40 (below 50%)
            } else {
              marksObtained = Math.floor(Math.random() * 40) + 35; // 35-75 (mix of above/below 50%)
            }
            
            const percentage = (marksObtained / totalMarks) * 100;

            const markEntry = new StudentMarkEntry({
              student: student._id,
              subject: subject._id,
              examType: examType,
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
              semester: 'Odd', // Use enum value
              enteredBy: faculty._id,
              enteredAt: new Date()
            });

            await markEntry.save();
            console.log(`Created marks: ${subject.code} ${examType} - ${marksObtained}/${totalMarks} (${percentage.toFixed(1)}%)`);
          }
        }

        // Create question-wise marks for CO analysis
        const courseOutcomes = subject.courseOutcomes || ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
        
        for (const examType of examTypes) {
          for (let i = 0; i < courseOutcomes.length; i++) {
            const co = courseOutcomes[i];
            
            // Check if question-wise marks already exist
            const existingQWM = await QuestionWiseMarks.findOne({
              studentId: student._id,
              subject: subject._id,
              examType: examType,
              courseOutcome: co
            });

            if (!existingQWM) {
              const maxMarks = examType === 'MODEL' ? 20 : 12; // Distribute marks across COs
              let obtainedMarks;
              
              // Create some COs with low performance for testing
              if (subject.code === 'CS301' && (co === 'CO1' || co === 'CO2')) {
                // Make CO1 and CO2 perform poorly for CS301
                obtainedMarks = Math.floor(Math.random() * (maxMarks * 0.4)) + 1; // 1-40% of max marks
              } else if (subject.code === 'CS302' && co === 'CO3') {
                // Make CO3 perform poorly for CS302
                obtainedMarks = Math.floor(Math.random() * (maxMarks * 0.35)) + 1; // 1-35% of max marks
              } else {
                // Normal performance for other COs
                obtainedMarks = Math.floor(Math.random() * (maxMarks * 0.7)) + (maxMarks * 0.3); // 30-100% of max marks
              }

              const qwMark = new QuestionWiseMarks({
                studentId: student._id,
                subject: subject._id,
                examType: examType,
                questionNumber: i + 1,
                courseOutcome: co,
                maxMarks: maxMarks,
                obtainedMarks: obtainedMarks,
                academicYear: '2024-2025',
                enteredAt: new Date()
              });

              await qwMark.save();
              const percentage = (obtainedMarks / maxMarks) * 100;
              console.log(`Created QW marks: ${subject.code} ${examType} ${co} - ${obtainedMarks}/${maxMarks} (${percentage.toFixed(1)}%)`);
            }
          }
        }
      }
    }

    console.log('\n✅ Sample data creation completed successfully!');
    
    // Verify data
    const totalMarks = await StudentMarkEntry.countDocuments({});
    const totalQWMarks = await QuestionWiseMarks.countDocuments({});
    const totalTasks = await ImprovementTask.countDocuments({});
    
    console.log(`\n📊 Data Summary:`);
    console.log(`- Student Mark Entries: ${totalMarks}`);
    console.log(`- Question-wise Marks: ${totalQWMarks}`);
    console.log(`- Improvement Tasks: ${totalTasks}`);

    // Test CO analysis for first student
    if (students.length > 0 && subjects.length > 0) {
      console.log('\n🧪 Testing CO Analysis Data:');
      const testStudent = students[0];
      const testSubject = subjects[0];
      
      console.log(`Student: ${testStudent.name} (${testStudent._id})`);
      console.log(`Subject: ${testSubject.name} (${testSubject._id})`);
      
      const coData = await QuestionWiseMarks.find({
        studentId: testStudent._id,
        subject: testSubject._id
      });
      
      console.log(`Found ${coData.length} question-wise mark entries for CO analysis`);
      
      if (coData.length > 0) {
        const coPerformance = {};
        coData.forEach(entry => {
          if (!coPerformance[entry.courseOutcome]) {
            coPerformance[entry.courseOutcome] = { obtained: 0, total: 0, count: 0 };
          }
          coPerformance[entry.courseOutcome].obtained += entry.obtainedMarks;
          coPerformance[entry.courseOutcome].total += entry.maxMarks;
          coPerformance[entry.courseOutcome].count += 1;
        });
        
        console.log('\nCO Performance Preview:');
        Object.keys(coPerformance).forEach(co => {
          const perf = coPerformance[co];
          const percentage = (perf.obtained / perf.total) * 100;
          const status = percentage >= 50 ? '✅ Attained' : '❌ Not Attained';
          console.log(`${co}: ${perf.obtained}/${perf.total} (${percentage.toFixed(1)}%) ${status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

addMarksAndCOData();