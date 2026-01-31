const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/learnaid', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  checkMaterials();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Define Material schema (minimal for querying)
const materialSchema = new mongoose.Schema({
  title: String,
  type: String,
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  filePath: String,
  fileUrl: String
}, { collection: 'materials' });

const Material = mongoose.model('Material', materialSchema);

// Define Chapter schema
const chapterSchema = new mongoose.Schema({
  title: String,
  chapterNumber: Number,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }
}, { collection: 'chapters' });

const Chapter = mongoose.model('Chapter', chapterSchema);

async function checkMaterials() {
  try {
    console.log('\n📊 MATERIAL DATABASE CHECK\n');
    console.log('='.repeat(60));
    
    // Count total materials
    const totalMaterials = await Material.countDocuments();
    console.log(`\n📚 Total Materials in Database: ${totalMaterials}`);
    
    if (totalMaterials === 0) {
      console.log('\n⚠️  NO MATERIALS FOUND IN DATABASE');
      console.log('   This explains the 404 errors.');
      console.log('\n💡 SOLUTION: Materials need to be uploaded by faculty');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Get sample materials
    console.log('\n📝 Sample Materials (first 5):');
    console.log('-'.repeat(60));
    const sampleMaterials = await Material.find()
      .populate('chapter', 'title chapterNumber')
      .populate('subject', 'name code')
      .limit(5)
      .lean();
    
    sampleMaterials.forEach((mat, idx) => {
      console.log(`\n${idx + 1}. ${mat.title}`);
      console.log(`   Type: ${mat.type}`);
      console.log(`   Chapter: ${mat.chapter?.title || 'N/A'}`);
      console.log(`   Subject: ${mat.subject?.name || 'N/A'}`);
      console.log(`   File: ${mat.filePath || mat.fileUrl || 'No file'}`);
    });
    
    // Check materials by chapter
    console.log('\n\n📖 Materials by Chapter:');
    console.log('-'.repeat(60));
    
    const chapters = await Chapter.find().populate('subject', 'name code').lean();
    console.log(`\nTotal Chapters: ${chapters.length}`);
    
    for (const chapter of chapters.slice(0, 10)) {
      const materialCount = await Material.countDocuments({ chapter: chapter._id });
      console.log(`\n• ${chapter.title} (Chapter ${chapter.chapterNumber})`);
      console.log(`  Subject: ${chapter.subject?.name || 'N/A'}`);
      console.log(`  Materials: ${materialCount}`);
      console.log(`  Chapter ID: ${chapter._id}`);
      
      if (materialCount > 0) {
        const materials = await Material.find({ chapter: chapter._id })
          .select('title type')
          .limit(3)
          .lean();
        materials.forEach(m => {
          console.log(`    - ${m.title} (${m.type})`);
        });
      }
    }
    
    // Check specific chapter IDs from error logs
    console.log('\n\n🔍 Checking Specific Chapter IDs from Error Logs:');
    console.log('-'.repeat(60));
    
    const errorChapterIds = [
      '6939ab07ee0571c2cdeeea7c', // Data cleaning using record ops
      '6939ab4bee0571c2cdeeea8a', // Visualization using spss modeller
      '6939ab71ee0571c2cdeeea98', // Inbuilt Function in Spss
      '6939aa9cee0571c2cdeeea60', // Introduction to predictive modelling
      '6939aac9ee0571c2cdeeea6e'  // Modelling in Spss
    ];
    
    for (const chapterId of errorChapterIds) {
      try {
        const chapter = await Chapter.findById(chapterId).populate('subject', 'name').lean();
        const materialCount = await Material.countDocuments({ chapter: chapterId });
        
        if (chapter) {
          console.log(`\n✅ Chapter Found: ${chapter.title}`);
          console.log(`   Subject: ${chapter.subject?.name || 'N/A'}`);
          console.log(`   Materials: ${materialCount}`);
          
          if (materialCount === 0) {
            console.log('   ⚠️  NO MATERIALS UPLOADED FOR THIS CHAPTER');
          }
        } else {
          console.log(`\n❌ Chapter ID ${chapterId} NOT FOUND in database`);
        }
      } catch (err) {
        console.log(`\n❌ Invalid Chapter ID: ${chapterId}`);
      }
    }
    
    // Summary
    console.log('\n\n📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Materials: ${totalMaterials}`);
    console.log(`Total Chapters: ${chapters.length}`);
    
    const chaptersWithMaterials = await Material.distinct('chapter');
    console.log(`Chapters with Materials: ${chaptersWithMaterials.length}`);
    console.log(`Chapters without Materials: ${chapters.length - chaptersWithMaterials.length}`);
    
    if (totalMaterials > 0 && chaptersWithMaterials.length === 0) {
      console.log('\n⚠️  WARNING: Materials exist but have no chapter association!');
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
