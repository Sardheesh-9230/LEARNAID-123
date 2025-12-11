const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function fixChapterIndexes() {
  try {
    console.log('🔍 Environment check:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const chaptersCollection = db.collection('chapters');

    // Get existing indexes
    const indexes = await chaptersCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.name);
    });

    // Drop the old course indexes if they exist
    const oldIndexesToDrop = ['course_1_chapterNumber_1', 'course_1_displayOrder_1'];
    
    for (const indexName of oldIndexesToDrop) {
      try {
        await chaptersCollection.dropIndex(indexName);
        console.log(`🗑️  Dropped old index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`ℹ️  Old index ${indexName} does not exist (already dropped)`);
        } else {
          console.log(`⚠️  Could not drop old index ${indexName}:`, error.message);
        }
      }
    }

    // Ensure the correct subject_1_chapterNumber_1 index exists
    try {
      await chaptersCollection.createIndex(
        { subject: 1, chapterNumber: 1 }, 
        { unique: true, name: 'subject_1_chapterNumber_1' }
      );
      console.log('✅ Created/ensured correct index: subject_1_chapterNumber_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️  Index subject_1_chapterNumber_1 already exists');
      } else {
        console.log('⚠️  Could not create index:', error.message);
      }
    }

    // Also fix any documents that might have the old 'course' field
    const updateResult = await chaptersCollection.updateMany(
      { course: { $exists: true } },
      { $rename: { course: 'subject' } }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`🔄 Fixed ${updateResult.modifiedCount} documents by renaming 'course' to 'subject'`);
    } else {
      console.log('ℹ️  No documents needed field renaming');
    }

    // Get updated indexes
    const newIndexes = await chaptersCollection.indexes();
    console.log('📋 Updated indexes:');
    newIndexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.name);
    });

    console.log('✅ Chapter indexes fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing chapter indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixChapterIndexes();