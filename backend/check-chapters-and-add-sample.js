const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/learnaid').then(() => {
  console.log('✅ Connected to MongoDB');
  checkAndAddSampleMaterials();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

const chapterSchema = new mongoose.Schema({
  title: String,
  chapterNumber: Number,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }
}, { collection: 'chapters' });

const Chapter = mongoose.model('Chapter', chapterSchema);

const materialSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['PDF', 'Video', 'Link', 'PPT', 'Image', 'Document'] },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  filePath: String,
  fileUrl: String,
  fileSize: Number,
  uploadDate: { type: Date, default: Date.now },
  order: Number,
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'materials' });

const Material = mongoose.model('Material', materialSchema);

const subjectSchema = new mongoose.Schema({
  name: String,
  code: String
}, { collection: 'subjects' });

const Subject = mongoose.model('Subject', subjectSchema);

async function checkAndAddSampleMaterials() {
  try {
    console.log('\n📊 DATABASE CHECK\n');
    console.log('='.repeat(60));
    
    // Check chapters
    const chapters = await Chapter.find().populate('subject', 'name code').lean();
    console.log(`\n📖 Total Chapters: ${chapters.length}`);
    
    if (chapters.length === 0) {
      console.log('\n⚠️  NO CHAPTERS FOUND. Please run setup-database.js first');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log('\n📚 Sample Chapters:');
    console.log('-'.repeat(60));
    chapters.slice(0, 10).forEach((ch, idx) => {
      console.log(`${idx + 1}. ${ch.title} (Chapter ${ch.chapterNumber})`);
      console.log(`   Subject: ${ch.subject?.name || 'N/A'}`);
      console.log(`   ID: ${ch._id}`);
    });
    
    // Check materials
    const materialCount = await Material.countDocuments();
    console.log(`\n\n📄 Total Materials: ${materialCount}`);
    
    if (materialCount === 0) {
      console.log('\n⚠️  NO MATERIALS FOUND');
      console.log('\n💡 Adding sample materials for testing...\n');
      
      // Add sample materials for first 5 chapters
      const sampleChapters = chapters.slice(0, 5);
      let added = 0;
      
      for (const chapter of sampleChapters) {
        // Add 2-3 sample materials per chapter
        const materials = [
          {
            title: `${chapter.title} - Lecture Notes`,
            description: `Comprehensive lecture notes covering ${chapter.title}`,
            type: 'PDF',
            chapter: chapter._id,
            subject: chapter.subject?._id,
            fileUrl: `https://example.com/materials/${chapter._id}/lecture-notes.pdf`,
            fileSize: 2048576, // 2MB
            order: 1,
            isActive: true
          },
          {
            title: `${chapter.title} - Video Tutorial`,
            description: `Video tutorial explaining concepts from ${chapter.title}`,
            type: 'Video',
            chapter: chapter._id,
            subject: chapter.subject?._id,
            fileUrl: `https://youtube.com/watch?v=example_${chapter._id}`,
            order: 2,
            isActive: true
          },
          {
            title: `${chapter.title} - Practice Problems`,
            description: `Practice problems and solutions for ${chapter.title}`,
            type: 'PDF',
            chapter: chapter._id,
            subject: chapter.subject?._id,
            fileUrl: `https://example.com/materials/${chapter._id}/practice.pdf`,
            fileSize: 1024000, // 1MB
            order: 3,
            isActive: true
          }
        ];
        
        await Material.insertMany(materials);
        added += materials.length;
        console.log(`✅ Added ${materials.length} materials for: ${chapter.title}`);
      }
      
      console.log(`\n✨ Successfully added ${added} sample materials!`);
    } else {
      console.log('\n✅ Materials exist in database');
      
      // Show material distribution
      console.log('\n📊 Materials by Chapter:');
      console.log('-'.repeat(60));
      
      for (const chapter of chapters.slice(0, 10)) {
        const count = await Material.countDocuments({ chapter: chapter._id });
        console.log(`\n• ${chapter.title}`);
        console.log(`  Materials: ${count}`);
        
        if (count > 0) {
          const mats = await Material.find({ chapter: chapter._id })
            .select('title type')
            .limit(3)
            .lean();
          mats.forEach(m => console.log(`    - ${m.title} (${m.type})`));
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}
