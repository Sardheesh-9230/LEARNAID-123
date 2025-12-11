const mongoose = require('mongoose');
const Material = require('./src/models/Material');
const File = require('./src/models/File');
require('dotenv').config();

async function checkMaterials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get all materials
    const materials = await Material.find().populate('file');
    console.log(`\n📚 Found ${materials.length} materials in database:`);

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      console.log(`\n--- Material ${i + 1} ---`);
      console.log('ID:', material._id);
      console.log('Title:', material.title);
      console.log('Type:', material.type);
      console.log('Has file reference:', !!material.file);
      console.log('Has fileMetadata:', !!material.fileMetadata);
      
      if (material.fileMetadata) {
        console.log('FileMetadata keys:', Object.keys(material.fileMetadata));
        console.log('FileMetadata:', material.fileMetadata);
      }
      
      if (material.file) {
        console.log('File reference ID:', material.file);
        if (typeof material.file === 'object') {
          console.log('File object:', material.file);
        }
      }
      
      if (material.path) {
        console.log('Direct path:', material.path);
      }
    }

    // Check File collection
    const files = await File.find();
    console.log(`\n📄 Found ${files.length} files in File collection:`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n--- File ${i + 1} ---`);
      console.log('ID:', file._id);
      console.log('Filename:', file.filename);
      console.log('Original name:', file.originalName);
      console.log('Path:', file.path);
      console.log('Size:', file.size);
      console.log('Material ref:', file.materialId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkMaterials();