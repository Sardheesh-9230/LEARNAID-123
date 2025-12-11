require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid')
  .then(async () => {
    console.log('✅ Connected\n');
    
    const faculty = await User.find({ role: 'Faculty' }).select('name email');
    console.log(`Found ${faculty.length} faculty members:\n`);
    faculty.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name} (${f.email})`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Error:', err));
