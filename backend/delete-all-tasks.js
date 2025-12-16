/**
 * Delete All Tasks Script
 * Removes all ImprovementTask and Task documents from the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ImprovementTask = require('./src/models/ImprovementTask');
const Task = require('./src/models/Task');

async function deleteAllTasks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaid');
    console.log('✅ Connected to MongoDB');

    // Count existing tasks
    const improvementTaskCount = await ImprovementTask.countDocuments();
    const regularTaskCount = await Task.countDocuments();
    
    console.log(`\n📊 Current Task Counts:`);
    console.log(`   Improvement/Assessment Tasks: ${improvementTaskCount}`);
    console.log(`   Regular Tasks: ${regularTaskCount}`);
    console.log(`   Total: ${improvementTaskCount + regularTaskCount}`);

    if (improvementTaskCount === 0 && regularTaskCount === 0) {
      console.log('\n✨ No tasks to delete!');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete ALL tasks!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all ImprovementTasks
    if (improvementTaskCount > 0) {
      const improvementResult = await ImprovementTask.deleteMany({});
      console.log(`🗑️  Deleted ${improvementResult.deletedCount} Improvement/Assessment Tasks`);
    }

    // Delete all regular Tasks
    if (regularTaskCount > 0) {
      const regularResult = await Task.deleteMany({});
      console.log(`🗑️  Deleted ${regularResult.deletedCount} Regular Tasks`);
    }

    console.log('\n✅ All tasks deleted successfully!');

    // Verify deletion
    const remainingImprovement = await ImprovementTask.countDocuments();
    const remainingRegular = await Task.countDocuments();
    
    if (remainingImprovement === 0 && remainingRegular === 0) {
      console.log('✅ Verification: Database is clean');
    } else {
      console.log(`⚠️  Warning: ${remainingImprovement + remainingRegular} tasks still remain`);
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

deleteAllTasks();
