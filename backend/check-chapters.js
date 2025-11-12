const mongoose = require('mongoose');
require('dotenv').config();

const Chapter = require('./src/models/Chapter');
const Course = require('./src/models/Course');

async function checkChapters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all chapters
    const chapters = await Chapter.find().limit(10);
    console.log(`📚 Total chapters in database: ${chapters.length}\n`);

    if (chapters.length > 0) {
      console.log('📋 Chapter details:');
      chapters.forEach((chapter, index) => {
        console.log(`\n${index + 1}. Chapter ${chapter.chapterNumber}: ${chapter.title}`);
        console.log(`   ID: ${chapter._id}`);
        console.log(`   Subject field: ${chapter.subject}`);
        console.log(`   Course field: ${chapter.course}`);
        console.log(`   Status: ${chapter.status}`);
        console.log(`   Display Order: ${chapter.displayOrder}`);
      });

      // Check the first chapter's structure
      console.log('\n\n🔍 Full structure of first chapter:');
      console.log(JSON.stringify(chapters[0], null, 2));
    } else {
      console.log('⚠️  No chapters found in database');
    }

    // Get all subjects/courses
    console.log('\n\n📖 Subjects in database:');
    const subjects = await Course.find().limit(10);
    subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} (${subject.code}) - ID: ${subject._id}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkChapters();
