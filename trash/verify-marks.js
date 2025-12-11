require('dotenv').config();
const mongoose = require('mongoose');
const StudentMarkEntry = require('./src/models/StudentMarkEntry');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid')
  .then(async () => {
    console.log('✅ Connected\n');
    
    const subjectId = '69315c57e7b2303a3a11fae1';
    const count = await StudentMarkEntry.countDocuments({ subject: subjectId });
    console.log(`📊 Found ${count} mark entries for AI subject\n`);
    
    const sample = await StudentMarkEntry.findOne({ subject: subjectId }).lean();
    if (sample) {
      console.log('Sample entry:');
      console.log(`  Exam Type: ${sample.examType}`);
      console.log(`  Academic Year: ${sample.academicYear}`);
      console.log(`  CO-wise Marks: ${JSON.stringify(sample.coWiseMarks, null, 2)}`);
    } else {
      console.log('❌ No mark entries found!');
    }
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Error:', err));
