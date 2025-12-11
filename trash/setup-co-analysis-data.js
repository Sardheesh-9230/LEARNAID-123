const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ImprovementTask = require('./src/models/ImprovementTask');
require('dotenv').config();

async function createSampleData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Find or create a student user
    let student = await User.findOne({ role: 'Student' });
    if (!student) {
      // Get any department for the student
      const departments = await mongoose.connection.db.collection('departments').find({}).limit(1).toArray();
      const departmentId = departments.length > 0 ? departments[0]._id : new mongoose.Types.ObjectId();

      student = new User({
        name: 'Test Student',
        email: 'teststudent@example.com',
        password: 'password123',
        role: 'Student',
        department: departmentId,
        semester: 3, // 3rd semester (number type)
        batch: '2023', // Batch year as string
        studentId: 'CS_2023_A_001',
        section: 'A'
      });
      await student.save();
      console.log('Created test student:', student.name);
    } else {
      console.log('Using existing student:', student.name);
    }

    // Find or create subjects
    const subjects = [];
    const subjectData = [
      { name: 'Data Structures', code: 'CS101', credits: 4, type: 'Core' },
      { name: 'Database Management', code: 'CS102', credits: 4, type: 'Core' },
      { name: 'Web Development', code: 'CS103', credits: 3, type: 'Elective' }
    ];

    for (const subData of subjectData) {
      let subject = await Subject.findOne({ code: subData.code });
      if (!subject) {
        // Get any department for the subject
        const departments = await mongoose.connection.db.collection('departments').find({}).limit(1).toArray();
        const departmentId = departments.length > 0 ? departments[0]._id : new mongoose.Types.ObjectId();

        subject = new Subject({
          ...subData,
          department: departmentId,
          semester: 3,
          academicYear: '2024-2025',
          courseOutcomes: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'] // Add CO mapping
        });
        await subject.save();
        console.log(`Created subject: ${subject.name}`);
      }
      subjects.push(subject);
    }

    // Create sample marks for each subject and exam type
    const examTypes = ['CIA1', 'CIA2', 'MODEL'];
    
    for (const subject of subjects) {
      for (const examType of examTypes) {
        // Check if marks already exist
        const existingMark = await StudentMarkEntry.findOne({
          student: student._id,
          subject: subject._id,
          examType: examType
        });

        if (!existingMark) {
          // Generate random marks (some below 50% for testing)
          const totalMarks = examType === 'MODEL' ? 100 : 60;
          const marksObtained = Math.floor(Math.random() * totalMarks * 0.8) + 10; // Random but not too low
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
            semester: 'Odd',
            enteredAt: new Date()
          });

          await markEntry.save();
          console.log(`Created marks: ${subject.name} ${examType} - ${marksObtained}/${totalMarks} (${percentage.toFixed(1)}%)`);
        }
      }
    }

    // Create sample QuestionWiseMarks for CO analysis
    for (const subject of subjects) {
      for (const examType of examTypes) {
        // Create question-wise marks for each CO
        const courseOutcomes = subject.courseOutcomes || ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
        
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
            const obtainedMarks = Math.floor(Math.random() * maxMarks * 0.9) + 1;

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
            console.log(`Created QW marks: ${subject.code} ${examType} ${co} - ${obtainedMarks}/${maxMarks}`);
          }
        }
      }
    }

    // Create some improvement tasks for subjects with low performance
    const lowPerformanceSubjects = subjects.slice(0, 2); // First 2 subjects
    
    for (const subject of lowPerformanceSubjects) {
      const existingTask = await ImprovementTask.findOne({
        student: student._id,
        subject: subject._id,
        status: { $in: ['assigned', 'in_progress'] }
      });

      if (!existingTask) {
        const task = new ImprovementTask({
          student: student._id,
          subject: subject._id,
          title: `Improve Performance in ${subject.name}`,
          description: `Focus on key concepts and practice problems to improve your understanding of ${subject.name}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          priority: 'MEDIUM',
          estimatedTime: 120, // 2 hours
          assignedBy: 'system',
          assignedAt: new Date(),
          status: 'assigned',
          tags: ['performance', 'practice'],
          academicYear: '2024-2025',
          semester: 'Odd'
        });

        await task.save();
        console.log(`Created improvement task for: ${subject.name}`);
      }
    }

    console.log('\n✅ Sample data creation completed successfully!');
    console.log(`Student ID: ${student._id}`);
    console.log(`Total subjects: ${subjects.length}`);
    
    // Verify data
    const totalMarks = await StudentMarkEntry.countDocuments({ student: student._id });
    const totalQWMarks = await QuestionWiseMarks.countDocuments({ studentId: student._id });
    const totalTasks = await ImprovementTask.countDocuments({ student: student._id });
    
    console.log(`\n📊 Data Summary:`);
    console.log(`- Student Mark Entries: ${totalMarks}`);
    console.log(`- Question-wise Marks: ${totalQWMarks}`);
    console.log(`- Improvement Tasks: ${totalTasks}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

    // Check current data
async function checkCurrentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('🔍 Checking current data...\n');

    const students = await User.find({ role: 'Student' }).limit(5);
    console.log(`Students found: ${students.length}`);
    students.forEach((s, i) => console.log(`${i + 1}. ${s.name} (${s.email})`));

    const subjects = await Subject.find({}).limit(5);
    console.log(`\nSubjects found: ${subjects.length}`);
    subjects.forEach((s, i) => console.log(`${i + 1}. ${s.name} (${s.code})`));

    const marks = await StudentMarkEntry.find({}).limit(10);
    console.log(`\nStudent marks found: ${marks.length}`);

    const qwMarks = await QuestionWiseMarks.find({}).limit(5);
    console.log(`Question-wise marks found: ${qwMarks.length}`);

    const tasks = await ImprovementTask.find({}).limit(5);
    console.log(`Improvement tasks found: ${tasks.length}`);

    if (students.length === 0 || subjects.length === 0 || marks.length === 0) {
      console.log('\n⚠️  Insufficient data found. Creating sample data...');
      await mongoose.connection.close();
      await createSampleData();
    } else {
      console.log('\n✅ Data looks good!');
      await mongoose.connection.close();
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
    await mongoose.connection.close();
  }
}

checkCurrentData();