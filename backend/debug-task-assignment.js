const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  debugTaskAssignment();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function debugTaskAssignment() {
  try {
    const User = require('./src/models/User');
    const Subject = require('./src/models/Subject');
    const StudentMarkEntry = require('./src/models/StudentMarkEntry');

    // Find AI subject
    const subject = await Subject.findOne({ code: 'AIDS401' });
    console.log('\n📚 Subject:', {
      id: subject._id,
      name: subject.name,
      code: subject.code
    });

    // Get CO analysis data
    const markEntries = await StudentMarkEntry.find({ subject: subject._id })
      .populate('student', 'name email studentId role')
      .lean();

    console.log(`\n📊 Found ${markEntries.length} StudentMarkEntry entries`);

    // Check first few students
    const uniqueStudents = new Map();
    markEntries.forEach(mark => {
      if (mark.student && mark.coWiseMarks && mark.coWiseMarks.length > 0) {
        const studentId = mark.student._id.toString();
        if (!uniqueStudents.has(studentId)) {
          uniqueStudents.set(studentId, mark.student);
        }
      }
    });

    console.log(`\n👥 Unique students with CO data: ${uniqueStudents.size}`);
    
    let count = 0;
    for (const [studentId, student] of uniqueStudents) {
      if (count < 5) {
        console.log(`\n  Student ${count + 1}:`);
        console.log(`    ID: ${studentId}`);
        console.log(`    Name: ${student.name}`);
        console.log(`    Roll: ${student.studentId}`);
        console.log(`    Role: ${student.role}`);
        
        // Verify this ID can be found
        const foundStudent = await User.findById(studentId);
        console.log(`    ✓ Can be found by ID: ${foundStudent ? 'YES' : 'NO'}`);
        if (foundStudent) {
          console.log(`    ✓ Role matches: ${foundStudent.role === 'Student' ? 'YES' : 'NO (is ' + foundStudent.role + ')'}`);
        }
      }
      count++;
    }

    // Verify subject can be found
    const foundSubject = await Subject.findById(subject._id);
    console.log(`\n✓ Subject can be found by ID: ${foundSubject ? 'YES' : 'NO'}`);

    console.log('\n✅ Debug complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}
