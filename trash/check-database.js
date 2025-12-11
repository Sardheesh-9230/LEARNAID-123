const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check what users exist
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      status: String
    }));

    const users = await User.find({ role: 'Faculty', status: 'Active' }).limit(5);
    console.log('👥 Faculty Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Check subjects
    const Subject = mongoose.model('Subject', new mongoose.Schema({
      name: String,
      code: String,
      year: String,
      section: String
    }));

    const subjects = await Subject.find({}).limit(3);
    console.log('\n📚 Subjects:');
    subjects.forEach(subject => {
      console.log(`  - ${subject.name} (${subject.code}) - ${subject.year}/${subject.section}`);
    });

    // Check chapters
    const Chapter = mongoose.model('Chapter', new mongoose.Schema({
      title: String,
      chapterNumber: Number,
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }
    }));

    const chapters = await Chapter.find({}).populate('subject', 'name').limit(3);
    console.log('\n📑 Chapters:');
    chapters.forEach(chapter => {
      console.log(`  - ${chapter.title} (Chapter ${chapter.chapterNumber}) in ${chapter.subject?.name || 'Unknown Subject'}`);
    });

    console.log('\n✅ Database check complete');

    if (users.length > 0) {
      console.log(`\n🔑 Test credentials you can use:`);
      console.log(`Email: ${users[0].email}`);
      console.log(`Password: (you'll need to know the password or reset it)`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkDatabase();