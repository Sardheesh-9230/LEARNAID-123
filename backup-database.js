const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MODELS_DIR = path.join(__dirname, 'backend', 'src', 'models');
const BACKUP_DIR = path.join(__dirname, 'backups');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

const backup = async () => {
    await connectDB();

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(BACKUP_DIR, timestamp);

    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }

    console.log(`Starting backup to ${backupPath}...`);

    // Get all model files
    const files = fs.readdirSync(MODELS_DIR).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const modelName = file.replace('.js', '');
        try {
            const modelPath = path.join(MODELS_DIR, file);
            const Model = require(modelPath);

            // Check if it's a valid mongoose model
            if (Model.find) {
                const data = await Model.find({});
                const outputPath = path.join(backupPath, `${modelName}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
                console.log(`✅ Backed up ${modelName}: ${data.length} records`);
            } else {
                console.warn(`⚠️  Skipping ${modelName}: Not a valid Mongoose model`);
            }
        } catch (error) {
            console.error(`❌ Failed to backup ${modelName}:`, error.message);
        }
    }

    console.log('Backup completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
};

backup();
