require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./src/models/Subject');
const Department = require('./src/models/Department');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid')
  .then(async () => {
    console.log('✅ Connected\n');
    
    const subjects = await Subject.find({ code: 'AIDS401' }).lean();
    
    console.log('Artificial Intelligence subject:');
    subjects.forEach(s => {
      console.log(`  ID: ${s._id}`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Code: ${s.code}`);
      console.log(`  Department ID: ${s.department}`);
      console.log(`  Year: ${s.year}, Section: ${s.section}`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Error:', err));
