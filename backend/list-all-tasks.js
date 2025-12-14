/**
 * List All Tasks Script
 * Shows all ImprovementTask and Task documents in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ImprovementTask = require('./src/models/ImprovementTask');
const Task = require('./src/models/Task');

async function listAllTasks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('✅ Connected to MongoDB');

    // Get ImprovementTasks
    const improvementTasks = await ImprovementTask.find()
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get Regular Tasks
    const regularTasks = await Task.find()
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Total Tasks: ${improvementTasks.length + regularTasks.length}`);
    console.log(`   Improvement/Assessment Tasks: ${improvementTasks.length}`);
    console.log(`   Regular Tasks: ${regularTasks.length}`);

    if (improvementTasks.length > 0) {
      console.log('\n\n📋 IMPROVEMENT/ASSESSMENT TASKS:');
      console.log('━'.repeat(80));
      
      improvementTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.title}`);
        console.log(`   ID: ${task._id}`);
        console.log(`   Type: ${task.taskType}`);
        console.log(`   Student: ${task.student?.name || 'Unknown'} (${task.student?.rollNumber || 'N/A'})`);
        console.log(`   Subject: ${task.subject?.name || 'Unknown'} (${task.subject?.code || 'N/A'})`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Due: ${new Date(task.dueDate).toLocaleDateString()}`);
        console.log(`   Questions: ${task.metadata?.generatedMCQs?.totalQuestions || 0}`);
        console.log(`   Assigned By: ${task.assignedBy?.name || 'Unknown'}`);
        console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
        
        if (task.metadata?.teacherSettings?.courseOutcomes) {
          console.log(`   COs: ${task.metadata.teacherSettings.courseOutcomes.join(', ')}`);
        }
        if (task.metadata?.teacherSettings?.totalMarks) {
          console.log(`   Total Marks: ${task.metadata.teacherSettings.totalMarks}`);
        }
        if (task.metadata?.mcqScores && task.metadata.mcqScores.length > 0) {
          const scores = task.metadata.mcqScores.map(s => `${s.score.toFixed(1)}%`).join(', ');
          console.log(`   Scores: ${scores}`);
        }
      });
    }

    if (regularTasks.length > 0) {
      console.log('\n\n📚 REGULAR TASKS:');
      console.log('━'.repeat(80));
      
      regularTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.title}`);
        console.log(`   ID: ${task._id}`);
        console.log(`   Subject: ${task.subject?.name || 'Unknown'} (${task.subject?.code || 'N/A'})`);
        console.log(`   Students: ${task.assignedStudents?.length || 0}`);
        console.log(`   Questions: ${task.questions?.length || 0}`);
        console.log(`   Created By: ${task.createdBy?.name || 'Unknown'}`);
        console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
        
        if (task.courseOutcomes) {
          console.log(`   COs: ${task.courseOutcomes.join(', ')}`);
        }
      });
    }

    if (improvementTasks.length === 0 && regularTasks.length === 0) {
      console.log('\n✨ No tasks found in the database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

listAllTasks();
