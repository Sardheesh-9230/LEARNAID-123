require('dotenv').config();
const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

// Connect to MongoDB
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
  console.log('✅ Connected to MongoDB\n');
};

const addSampleCOMarks = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding AIDS department subjects and faculty3...\n');

    // Find AIDS department using Department model
    const Department = require('./src/models/Department');
    const aidsDept = await Department.findOne({ code: 'AIDS' });
    if (!aidsDept) {
      console.log('❌ AIDS department not found');
      return;
    }
    console.log(`✅ Found AIDS department: ${aidsDept.name} (${aidsDept._id})`);

    // Find faculty3 AIDS
    const faculty3 = await User.findOne({ email: 'facultyaids3@learnaid.edu' });
    if (!faculty3) {
      console.log('❌ Faculty AIDS 3 not found');
      return;
    }
    console.log(`✅ Found faculty: ${faculty3.name} (${faculty3._id})`);

    // Find subjects assigned to faculty3 in AIDS department
    const subjects = await Subject.find({
      department: aidsDept._id,
      'faculty.user': faculty3._id
    }).lean();

    if (subjects.length === 0) {
      console.log('❌ No subjects found for faculty3 in AIDS department');
      return;
    }

    console.log(`\n✅ Found ${subjects.length} subject(s):`);
    subjects.forEach(s => console.log(`   - ${s.name} (${s.code})`));

    // Get students from AIDS department
    const students = await User.find({
      role: 'Student',
      department: aidsDept._id
    }).limit(10).lean();

    if (students.length === 0) {
      console.log('❌ No students found in AIDS department');
      return;
    }

    console.log(`\n✅ Found ${students.length} students`);

    // Course Outcomes
    const courseOutcomes = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
    const examTypes = ['CIA1', 'CIA2', 'MODEL'];

    let totalAdded = 0;

    // For each subject
    for (const subject of subjects) {
      console.log(`\n📝 Adding marks for subject: ${subject.name}`);

      // For each exam type
      for (const examType of examTypes) {
        console.log(`   📋 ${examType}...`);

        // For each student
        for (const student of students) {
          // Check if marks already exist
          const existing = await StudentMarkEntry.findOne({
            student: student._id,
            subject: subject._id,
            examType: examType,
            academicYear: '2024-2025',
            semester: 'Odd'
          });

          if (existing) {
            console.log(`      ⏭️  Skipping ${student.name} (marks already exist)`);
            continue;
          }

          // Generate CO-wise marks (some below 50% threshold)
          const coWiseMarks = courseOutcomes.map((co, index) => {
            // Vary performance: make some COs weak for demonstration
            const isWeak = Math.random() < 0.4; // 40% chance of weak performance
            const maxMarks = 20;
            const obtainedMarks = isWeak 
              ? Math.floor(Math.random() * 10) + 2  // 2-11 marks (10-55%)
              : Math.floor(Math.random() * 8) + 12; // 12-19 marks (60-95%)

            return {
              courseOutcome: co,
              maxMarks: maxMarks,
              obtainedMarks: obtainedMarks
            };
          });

          // Calculate total marks
          const totalMax = coWiseMarks.reduce((sum, co) => sum + co.maxMarks, 0);
          const totalObtained = coWiseMarks.reduce((sum, co) => sum + co.obtainedMarks, 0);
          const percentage = (totalObtained / totalMax) * 100;

          // Determine grade
          let grade;
          if (percentage >= 90) grade = 'O';
          else if (percentage >= 80) grade = 'A+';
          else if (percentage >= 70) grade = 'A';
          else if (percentage >= 60) grade = 'B+';
          else if (percentage >= 50) grade = 'B';
          else if (percentage >= 40) grade = 'C';
          else grade = 'F';

          // Create mark entry
          const markEntry = new StudentMarkEntry({
            student: student._id,
            subject: subject._id,
            examType: examType,
            academicYear: '2024-2025',
            semester: 'Odd',
            marksObtained: totalObtained,
            totalMarks: totalMax,
            percentage: parseFloat(percentage.toFixed(2)),
            grade: grade,
            coWiseMarks: coWiseMarks,
            enteredBy: faculty3._id, // Added required field
            remarks: 'Sample data for CO analysis testing'
          });

          await markEntry.save();
          totalAdded++;
          
          // Show CO performance for first student
          if (student === students[0]) {
            console.log(`      ✅ ${student.name}: ${totalObtained}/${totalMax} (${percentage.toFixed(1)}%) - Grade ${grade}`);
            coWiseMarks.forEach(co => {
              const coPercent = (co.obtainedMarks / co.maxMarks) * 100;
              const indicator = coPercent < 50 ? '🔴' : coPercent < 70 ? '🟡' : '🟢';
              console.log(`         ${indicator} ${co.courseOutcome}: ${co.obtainedMarks}/${co.maxMarks} (${coPercent.toFixed(1)}%)`);
            });
          }
        }
      }
    }

    console.log(`\n✅ COMPLETED! Added ${totalAdded} mark entries`);
    console.log(`\n🎯 Now you can test CO-based student identification in the faculty dashboard!`);
    console.log(`   Subject: ${subjects[0].name}`);
    console.log(`   Try thresholds: 50%, 60%, 70%`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
console.log('🚀 Adding sample CO-wise marks for AIDS department...\n');
addSampleCOMarks();
