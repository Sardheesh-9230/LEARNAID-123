const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Subject = require('../src/models/Subject');

async function testFacultySubjectQuery() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const facultyId = '69315e26b0d9dfa3983e0993'; // The faculty ID from the error

        console.log('Testing faculty subject query for ID:', facultyId);

        // Test the corrected query
        const facultySubjects = await Subject.find({ 'faculty.user': facultyId });
        console.log(`Found ${facultySubjects.length} subjects for faculty`);

        if (facultySubjects.length > 0) {
            console.log('Sample subject:', {
                name: facultySubjects[0].name,
                code: facultySubjects[0].code,
                faculty: facultySubjects[0].faculty
            });
        }

        // Also test if there are any subjects with this faculty ID in any format
        const allSubjects = await Subject.find({}).populate('faculty.user', 'name email');
        console.log(`Total subjects in database: ${allSubjects.length}`);

        const subjectsWithThisFaculty = allSubjects.filter(subject => 
            subject.faculty.some(f => f.user && f.user._id.toString() === facultyId)
        );
        console.log(`Subjects where this faculty is assigned: ${subjectsWithThisFaculty.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testFacultySubjectQuery();