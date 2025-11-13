const mongoose = require('mongoose');
require('dotenv').config();

async function testMaterialCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Material = require('./src/models/Material');
    const Chapter = require('./src/models/Chapter');
    
    // Get first chapter
    const chapter = await Chapter.findOne();
    if (!chapter) {
      console.log('❌ No chapters found');
      process.exit(1);
    }
    
    console.log('📚 Using chapter:', chapter.title);
    console.log('   Chapter ID:', chapter._id);
    console.log('   Subject ID:', chapter.subject);
    
    // Try creating a test material
    const testMaterialData = {
      chapter: chapter._id,
      subject: chapter.subject,
      title: 'Test Material',
      description: 'Test description',
      type: 'PDF',
      order: 1,
      duration: 0,
      status: 'Published',
      isPublic: true,
      allowDownload: true,
      createdBy: chapter.createdBy,
      fileMetadata: {
        filename: 'test-file.pdf',
        originalname: 'Test File.pdf',
        size: 12345,
        mimetype: 'application/pdf',
        path: 'uploads/materials/test-file.pdf'
      },
      tags: ['test']
    };
    
    console.log('\n📝 Testing material creation with data:');
    console.log(JSON.stringify(testMaterialData, null, 2));
    
    const material = new Material(testMaterialData);
    
    // Validate before saving
    const validationError = material.validateSync();
    if (validationError) {
      console.log('\n❌ Validation failed:', validationError.message);
      console.log('Errors:', Object.keys(validationError.errors));
      process.exit(1);
    }
    
    console.log('\n✅ Validation passed!');
    
    // Try to save
    await material.save();
    console.log('\n✅ Material created successfully!');
    console.log('   Material ID:', material._id);
    
    // Delete the test material
    await Material.findByIdAndDelete(material._id);
    console.log('\n🗑️  Test material cleaned up');
    
    // Check existing materials
    const existingMaterials = await Material.find().limit(5);
    console.log(`\n📊 Found ${existingMaterials.length} existing materials in database`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMaterialCreation();
