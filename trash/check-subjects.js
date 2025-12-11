const mongoose = require('mongoose');
const Subject = require('./src/models/Subject');
require('dotenv').config();

async function checkSubjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    const subjects = await Subject.find({});
    console.log(`Found ${subjects.length} subjects:`);
    
    subjects.forEach((subject, i) => {
      console.log(`${i + 1}. Name: "${subject.name}" | Code: "${subject.code}" | ID: ${subject._id}`);
    });

    // Also find the specific subject pattern
    const engineeringSubjects = await Subject.find({
      $or: [
        { name: /engineering/i },
        { name: /graphics/i },
        { code: /GEA/i }
      ]
    });

    console.log(`\nEngineering/Graphics subjects found: ${engineeringSubjects.length}`);
    engineeringSubjects.forEach((subject, i) => {
      console.log(`${i + 1}. Name: "${subject.name}" | Code: "${subject.code}" | ID: ${subject._id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkSubjects();