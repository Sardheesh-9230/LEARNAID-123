const mongoose = require('mongoose');
require('dotenv').config();
const StudentMarkEntry = require('./src/models/StudentMarkEntry');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const sample = await StudentMarkEntry.findOne({});
    console.log('Sample mark entry structure:', JSON.stringify(sample, null, 2));
    
    const count = await StudentMarkEntry.countDocuments({ marks: { $ne: null } });
    console.log('Records with valid marks:', count);
    
    const examTypes = await StudentMarkEntry.distinct('examType');
    console.log('Available exam types:', examTypes);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();