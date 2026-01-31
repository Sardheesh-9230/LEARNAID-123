const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnaia';

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupDir = path.join(__dirname, '..', 'backups', timestamp);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📦 Found ${collections.length} collections to backup\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📄 Backing up: ${collectionName}`);

      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`   ✅ Saved ${documents.length} documents to ${collectionName}.json`);
    }

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupDir}\n`);

    // Create a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      backupPath: backupDir,
      collections: collections.map(c => ({
        name: c.name,
        count: 0 // Will be updated
      }))
    };

    // Count documents in each collection
    for (let i = 0; i < summary.collections.length; i++) {
      const collectionName = summary.collections[i].name;
      const collection = db.collection(collectionName);
      summary.collections[i].count = await collection.countDocuments();
    }

    fs.writeFileSync(
      path.join(backupDir, '_backup_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('📊 Backup Summary:');
    summary.collections.forEach(c => {
      console.log(`   ${c.name}: ${c.count} documents`);
    });

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

backupDatabase();
