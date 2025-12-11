const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const StudentMarks = require('./src/models/StudentMarks');
const User = require('./src/models/User');

async function testData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test mark entries
        console.log('\n📊 Testing mark entries...');
        const marks = await StudentMarks.find({}).limit(5);
        console.log(`Found ${await StudentMarks.countDocuments()} total mark entries`);
        
        if (marks.length > 0) {
            console.log('Sample mark entry:', {
                student: marks[0].student,
                subject: marks[0].subject,
                examType: marks[0].examType,
                marks: marks[0].marks,
                totalMarks: marks[0].totalMarks
            });
        }

        // Test exam types distribution
        const examTypes = await StudentMarks.aggregate([
            { $group: { _id: '$examType', count: { $sum: 1 } } }
        ]);
        console.log('\n📈 Exam Types Distribution:');
        examTypes.forEach(type => {
            console.log(`  ${type._id}: ${type.count} entries`);
        });

        // Test users by role
        console.log('\n👥 Testing users...');
        const userRoles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('User Roles Distribution:');
        userRoles.forEach(role => {
            console.log(`  ${role._id}: ${role.count} users`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testData();