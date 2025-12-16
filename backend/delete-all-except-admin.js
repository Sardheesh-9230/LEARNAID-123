const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log('⚠️  WARNING: This will delete ALL data except Admin users!');
    console.log('Starting deletion in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Import all models
      const User = require('./src/models/User');
      const Subject = require('./src/models/Subject');
      const Department = require('./src/models/Department');
      const StudentMarkEntry = require('./src/models/StudentMarkEntry');
      const QuestionWiseMarks = require('./src/models/QuestionWiseMarks');
      const ImprovementTask = require('./src/models/ImprovementTask');
      const Material = require('./src/models/Material');
      const Chapter = require('./src/models/Chapter');
      const Course = require('./src/models/Course');
      const MCQSession = require('./src/models/MCQSession');
      
      // Delete non-admin users (Students, Faculty)
      const deletedUsers = await User.deleteMany({ role: { $ne: 'Admin' } });
      console.log(`✅ Deleted ${deletedUsers.deletedCount} non-admin users`);
      
      // Delete all subjects
      const deletedSubjects = await Subject.deleteMany({});
      console.log(`✅ Deleted ${deletedSubjects.deletedCount} subjects`);
      
      // Delete all departments (except keep the structure if needed)
      const deletedDepts = await Department.deleteMany({});
      console.log(`✅ Deleted ${deletedDepts.deletedCount} departments`);
      
      // Delete all marks
      const deletedMarkEntries = await StudentMarkEntry.deleteMany({});
      console.log(`✅ Deleted ${deletedMarkEntries.deletedCount} student mark entries`);
      
      const deletedQuestionMarks = await QuestionWiseMarks.deleteMany({});
      console.log(`✅ Deleted ${deletedQuestionMarks.deletedCount} question-wise marks`);
      
      // Delete all tasks
      const deletedTasks = await ImprovementTask.deleteMany({});
      console.log(`✅ Deleted ${deletedTasks.deletedCount} improvement tasks`);
      
      // Delete all materials
      const deletedMaterials = await Material.deleteMany({});
      console.log(`✅ Deleted ${deletedMaterials.deletedCount} materials`);
      
      // Delete all chapters
      const deletedChapters = await Chapter.deleteMany({});
      console.log(`✅ Deleted ${deletedChapters.deletedCount} chapters`);
      
      // Delete all courses
      const deletedCourses = await Course.deleteMany({});
      console.log(`✅ Deleted ${deletedCourses.deletedCount} courses`);
      
      // Delete all MCQ sessions
      const deletedMCQSessions = await MCQSession.deleteMany({});
      console.log(`✅ Deleted ${deletedMCQSessions.deletedCount} MCQ sessions`);
      
      // Show remaining admin users
      const remainingAdmins = await User.find({ role: 'Admin' }).select('name email role');
      console.log(`\n✅ Remaining Admin users (${remainingAdmins.length}):`);
      remainingAdmins.forEach((admin, i) => {
        console.log(`  ${i + 1}. ${admin.name} (${admin.email})`);
      });
      
      console.log('\n✅ Deletion complete! Only Admin users remain.');
      
    } catch (error) {
      console.error('❌ Error during deletion:', error);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
