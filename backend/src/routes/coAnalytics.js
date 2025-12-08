const express = require('express');
const mongoose = require('mongoose');
const StudentMarkEntry = require('../models/StudentMarkEntry');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get CO-wise performance analytics for faculty's subjects
router.get('/co-performance/:facultyId', protect, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { subjectId, examType, threshold = 60 } = req.query;

    console.log('📊 Fetching CO-wise performance for faculty:', facultyId);

    // Get faculty's subjects (faculty is an array of objects with user field)
    let subjectQuery = { 'faculty.user': facultyId };
    if (subjectId) {
      subjectQuery._id = subjectId;
    }

    const facultySubjects = await Subject.find(subjectQuery);
    const subjectIds = facultySubjects.map(s => s._id);

    if (subjectIds.length === 0) {
      return res.json({
        success: true,
        data: {
          coPerformance: [],
          lowPerformers: [],
          subjectStats: []
        }
      });
    }

    // Build marks query
    let marksQuery = {
      subject: { $in: subjectIds },
      'coWiseMarks.0': { $exists: true } // Only entries with CO-wise marks
    };

    if (examType) {
      marksQuery.examType = examType;
    }

    // Get all mark entries with CO-wise breakdown
    const markEntries = await StudentMarkEntry.find(marksQuery)
      .populate('student', 'firstName lastName rollNumber email department')
      .populate('subject', 'name code')
      .lean();

    console.log(`Found ${markEntries.length} mark entries with CO data`);

    // Process CO-wise performance
    const coStats = {};
    const studentCOPerformance = {};
    const lowPerformers = [];

    markEntries.forEach(entry => {
      const studentId = entry.student._id.toString();
      const subjectName = entry.subject.name;
      const studentName = `${entry.student.firstName} ${entry.student.lastName}`;

      if (!studentCOPerformance[studentId]) {
        studentCOPerformance[studentId] = {
          student: entry.student,
          subjects: {},
          overallCOs: {}
        };
      }

      if (!studentCOPerformance[studentId].subjects[subjectName]) {
        studentCOPerformance[studentId].subjects[subjectName] = {};
      }

      entry.coWiseMarks.forEach(co => {
        const coName = co.courseOutcome;
        const percentage = (co.obtainedMarks / co.maxMarks) * 100;

        // Track overall CO stats
        if (!coStats[coName]) {
          coStats[coName] = {
            courseOutcome: coName,
            totalStudents: 0,
            totalMarks: 0,
            totalMaxMarks: 0,
            belowThreshold: 0,
            entries: []
          };
        }

        coStats[coName].totalStudents += 1;
        coStats[coName].totalMarks += co.obtainedMarks;
        coStats[coName].totalMaxMarks += co.maxMarks;
        coStats[coName].entries.push({
          student: studentName,
          subject: subjectName,
          percentage,
          marks: co.obtainedMarks,
          maxMarks: co.maxMarks
        });

        if (percentage < threshold) {
          coStats[coName].belowThreshold += 1;
          
          // Add to low performers
          lowPerformers.push({
            student: entry.student,
            subject: entry.subject,
            courseOutcome: coName,
            percentage: Math.round(percentage * 10) / 10,
            obtainedMarks: co.obtainedMarks,
            maxMarks: co.maxMarks,
            examType: entry.examType
          });
        }

        // Store student-specific CO performance
        studentCOPerformance[studentId].subjects[subjectName][coName] = percentage;
        
        if (!studentCOPerformance[studentId].overallCOs[coName]) {
          studentCOPerformance[studentId].overallCOs[coName] = [];
        }
        studentCOPerformance[studentId].overallCOs[coName].push(percentage);
      });
    });

    // Calculate CO performance summary
    const coPerformance = Object.values(coStats).map(co => {
      const averagePercentage = co.totalMaxMarks > 0 
        ? (co.totalMarks / co.totalMaxMarks) * 100 
        : 0;
      
      return {
        courseOutcome: co.courseOutcome,
        averagePercentage: Math.round(averagePercentage * 10) / 10,
        totalStudents: co.totalStudents,
        studentsAboveThreshold: co.totalStudents - co.belowThreshold,
        studentsBelowThreshold: co.belowThreshold,
        passRate: co.totalStudents > 0 ? Math.round(((co.totalStudents - co.belowThreshold) / co.totalStudents) * 100) : 0
      };
    });

    // Subject-wise CO summary
    const subjectStats = facultySubjects.map(subject => {
      const subjectEntries = markEntries.filter(entry => 
        entry.subject._id.toString() === subject._id.toString()
      );
      
      const subjectCOs = {};
      subjectEntries.forEach(entry => {
        entry.coWiseMarks.forEach(co => {
          if (!subjectCOs[co.courseOutcome]) {
            subjectCOs[co.courseOutcome] = {
              total: 0,
              obtained: 0,
              count: 0,
              belowThreshold: 0
            };
          }
          
          const percentage = (co.obtainedMarks / co.maxMarks) * 100;
          subjectCOs[co.courseOutcome].total += co.maxMarks;
          subjectCOs[co.courseOutcome].obtained += co.obtainedMarks;
          subjectCOs[co.courseOutcome].count += 1;
          
          if (percentage < threshold) {
            subjectCOs[co.courseOutcome].belowThreshold += 1;
          }
        });
      });

      const coSummary = Object.keys(subjectCOs).map(coName => ({
        courseOutcome: coName,
        averagePercentage: subjectCOs[coName].total > 0 
          ? Math.round((subjectCOs[coName].obtained / subjectCOs[coName].total) * 100 * 10) / 10
          : 0,
        studentCount: subjectCOs[coName].count,
        passRate: subjectCOs[coName].count > 0 
          ? Math.round(((subjectCOs[coName].count - subjectCOs[coName].belowThreshold) / subjectCOs[coName].count) * 100)
          : 0
      }));

      return {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code
        },
        totalStudents: subjectEntries.length,
        coBreakdown: coSummary
      };
    });

    res.json({
      success: true,
      data: {
        coPerformance: coPerformance.sort((a, b) => a.courseOutcome.localeCompare(b.courseOutcome)),
        lowPerformers: lowPerformers.sort((a, b) => a.percentage - b.percentage),
        subjectStats,
        threshold: parseInt(threshold),
        summary: {
          totalSubjects: facultySubjects.length,
          totalMarkEntries: markEntries.length,
          totalLowPerformers: lowPerformers.length,
          averageCoPerformance: coPerformance.length > 0 
            ? Math.round((coPerformance.reduce((sum, co) => sum + co.averagePercentage, 0) / coPerformance.length) * 10) / 10
            : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ CO Performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CO performance data',
      error: error.message
    });
  }
});

// Get individual student CO performance for faculty
router.get('/student-co-performance/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId } = req.query;
    const facultyId = req.user.id;

    // Get faculty's subjects (faculty is an array of objects with user field)
    let subjectQuery = { 'faculty.user': facultyId };
    if (subjectId) {
      subjectQuery._id = subjectId;
    }

    const facultySubjects = await Subject.find(subjectQuery);
    const subjectIds = facultySubjects.map(s => s._id);

    const studentEntries = await StudentMarkEntry.find({
      student: studentId,
      subject: { $in: subjectIds },
      'coWiseMarks.0': { $exists: true }
    })
    .populate('subject', 'name code')
    .populate('student', 'firstName lastName rollNumber')
    .lean();

    const studentCoData = {};
    
    studentEntries.forEach(entry => {
      const subjectName = entry.subject.name;
      
      if (!studentCoData[subjectName]) {
        studentCoData[subjectName] = {
          subject: entry.subject,
          examTypes: {},
          overallCOs: {}
        };
      }

      if (!studentCoData[subjectName].examTypes[entry.examType]) {
        studentCoData[subjectName].examTypes[entry.examType] = {};
      }

      entry.coWiseMarks.forEach(co => {
        const percentage = (co.obtainedMarks / co.maxMarks) * 100;
        
        studentCoData[subjectName].examTypes[entry.examType][co.courseOutcome] = {
          percentage: Math.round(percentage * 10) / 10,
          obtainedMarks: co.obtainedMarks,
          maxMarks: co.maxMarks
        };

        // Track overall CO performance across all exams
        if (!studentCoData[subjectName].overallCOs[co.courseOutcome]) {
          studentCoData[subjectName].overallCOs[co.courseOutcome] = {
            totalObtained: 0,
            totalMax: 0,
            count: 0
          };
        }

        studentCoData[subjectName].overallCOs[co.courseOutcome].totalObtained += co.obtainedMarks;
        studentCoData[subjectName].overallCOs[co.courseOutcome].totalMax += co.maxMarks;
        studentCoData[subjectName].overallCOs[co.courseOutcome].count += 1;
      });
    });

    // Calculate overall percentages
    Object.keys(studentCoData).forEach(subjectName => {
      Object.keys(studentCoData[subjectName].overallCOs).forEach(coName => {
        const coData = studentCoData[subjectName].overallCOs[coName];
        coData.percentage = coData.totalMax > 0 
          ? Math.round((coData.totalObtained / coData.totalMax) * 100 * 10) / 10
          : 0;
      });
    });

    res.json({
      success: true,
      data: {
        student: studentEntries[0]?.student,
        subjectCoData: studentCoData,
        totalEntries: studentEntries.length
      }
    });

  } catch (error) {
    console.error('❌ Student CO Performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student CO performance',
      error: error.message
    });
  }
});

module.exports = router;