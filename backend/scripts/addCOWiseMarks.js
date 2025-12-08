const mongoose = require('mongoose');
require('dotenv').config();

const StudentMarkEntry = require('../src/models/StudentMarkEntry');
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');

async function addCOWiseMarks() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all mark entries that don't have CO-wise marks
        const markEntries = await StudentMarkEntry.find({
            'coWiseMarks.0': { $exists: false }
        }).limit(100);

        console.log(`Found ${markEntries.length} entries to update with CO-wise marks`);

        // Define CO mappings for different exam types
        const coMappings = {
            'CIA1': [
                { courseOutcome: 'CO1', percentage: 40 },
                { courseOutcome: 'CO2', percentage: 35 },
                { courseOutcome: 'CO3', percentage: 25 }
            ],
            'CIA2': [
                { courseOutcome: 'CO2', percentage: 30 },
                { courseOutcome: 'CO3', percentage: 40 },
                { courseOutcome: 'CO4', percentage: 30 }
            ],
            'MODEL': [
                { courseOutcome: 'CO1', percentage: 20 },
                { courseOutcome: 'CO2', percentage: 25 },
                { courseOutcome: 'CO3', percentage: 25 },
                { courseOutcome: 'CO4', percentage: 20 },
                { courseOutcome: 'CO5', percentage: 10 }
            ]
        };

        let updatedCount = 0;

        for (const entry of markEntries) {
            const coMapping = coMappings[entry.examType];
            if (!coMapping) continue;

            const coWiseMarks = coMapping.map(co => {
                const maxMarks = Math.round(entry.totalMarks * (co.percentage / 100));
                // Create some variation in performance
                const performanceVariation = 0.7 + Math.random() * 0.6; // 70% to 130% of expected
                const basePercentage = (entry.marksObtained / entry.totalMarks);
                let obtainedMarks = Math.round(maxMarks * basePercentage * performanceVariation);
                
                // Ensure marks don't exceed maximum
                obtainedMarks = Math.min(obtainedMarks, maxMarks);
                obtainedMarks = Math.max(0, obtainedMarks); // Ensure non-negative

                return {
                    courseOutcome: co.courseOutcome,
                    maxMarks: maxMarks,
                    obtainedMarks: obtainedMarks
                };
            });

            await StudentMarkEntry.findByIdAndUpdate(entry._id, {
                coWiseMarks: coWiseMarks
            });

            updatedCount++;
            
            if (updatedCount % 10 === 0) {
                console.log(`Updated ${updatedCount} entries...`);
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} mark entries with CO-wise data`);

        // Show sample of updated data
        const sampleEntry = await StudentMarkEntry.findOne({
            'coWiseMarks.0': { $exists: true }
        }).populate('student', 'firstName lastName rollNumber')
          .populate('subject', 'name code');

        if (sampleEntry) {
            console.log('\n📊 Sample CO-wise marks entry:');
            console.log(`Student: ${sampleEntry.student.firstName} ${sampleEntry.student.lastName} (${sampleEntry.student.rollNumber})`);
            console.log(`Subject: ${sampleEntry.subject.name} (${sampleEntry.subject.code})`);
            console.log(`Exam: ${sampleEntry.examType}`);
            console.log(`Total Marks: ${sampleEntry.marksObtained}/${sampleEntry.totalMarks}`);
            console.log('CO-wise breakdown:');
            sampleEntry.coWiseMarks.forEach(co => {
                const percentage = (co.obtainedMarks / co.maxMarks * 100).toFixed(1);
                console.log(`  ${co.courseOutcome}: ${co.obtainedMarks}/${co.maxMarks} (${percentage}%)`);
            });
        }

        // Statistics
        const totalWithCO = await StudentMarkEntry.countDocuments({
            'coWiseMarks.0': { $exists: true }
        });
        
        console.log(`\n📈 Database Statistics:`);
        console.log(`Total entries with CO-wise marks: ${totalWithCO}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addCOWiseMarks();