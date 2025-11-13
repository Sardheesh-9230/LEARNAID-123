const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupOrphanFiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Material = require('./src/models/Material');
    
    // Get all materials from DB
    const materials = await Material.find();
    const dbFilenames = materials
      .filter(m => m.fileMetadata && m.fileMetadata.filename)
      .map(m => m.fileMetadata.filename);
    
    console.log(`📊 Found ${materials.length} materials in database`);
    console.log(`📁 Files in database: ${dbFilenames.length}\n`);
    
    // Get all files from uploads/materials directory
    const uploadsDir = path.join(__dirname, 'uploads', 'materials');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('⚠️  uploads/materials directory does not exist');
      process.exit(0);
    }
    
    const uploadedFiles = fs.readdirSync(uploadsDir);
    console.log(`📂 Files in uploads/materials: ${uploadedFiles.length}`);
    
    // Find orphan files
    const orphanFiles = uploadedFiles.filter(file => !dbFilenames.includes(file));
    
    if (orphanFiles.length === 0) {
      console.log('\n✅ No orphan files found!');
    } else {
      console.log(`\n🗑️  Found ${orphanFiles.length} orphan files:`);
      orphanFiles.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file}`);
        // Uncomment to delete:
        // fs.unlinkSync(path.join(uploadsDir, file));
      });
      console.log('\n⚠️  To delete these files, uncomment the delete line in the script');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanFiles();
