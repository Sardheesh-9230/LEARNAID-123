const mongoose = require('mongoose');
const ImprovementTask = require('./src/models/ImprovementTask');
require('dotenv').config();

async function checkImprovementTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('Connected to MongoDB');

    // Find tasks for Sardheesh M in Engineering Graphics
    const tasks = await ImprovementTask.find({
      student: new mongoose.Types.ObjectId('691ec0a90f8e5b823f4a43fc'),
      subject: new mongoose.Types.ObjectId('691da401e905bbe84e7e2167')
    })
    .populate('student', 'name email')
    .populate('subject', 'name code')
    .sort({ createdAt: -1 })
    .limit(5);

    console.log(`\n🎯 Found ${tasks.length} Improvement Tasks:`);
    
    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.title}`);
      console.log(`   📋 Description: ${task.description}`);
      console.log(`   🎯 CO: ${task.courseOutcome}`);
      console.log(`   👤 Student: ${task.student?.name || 'N/A'}`);
      console.log(`   📚 Subject: ${task.subject?.name || 'N/A'} (${task.subject?.code || 'N/A'})`);
      console.log(`   ⭐ Priority: ${task.priority}`);
      console.log(`   📅 Due: ${task.dueDate?.toDateString() || 'N/A'}`);
      console.log(`   ⏱️ Study Time: ${task.estimatedStudyTime} minutes`);
      console.log(`   📊 Status: ${task.status}`);
      console.log(`   📅 Created: ${task.createdAt?.toDateString() || 'N/A'}`);
    });

    if (tasks.length === 0) {
      console.log('❌ No improvement tasks found for this student and subject');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkImprovementTasks();