const express = require('express')
const mongoose = require('mongoose')
const StudentMarkEntry = require('../models/StudentMarkEntry')
const User = require('../models/User')
const Subject = require('../models/Subject')
const { protect, authorize } = require('../middleware/auth')
const { body, validationResult } = require('express-validator')

const router = express.Router()

// Get student marks by student ID
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    const { semester, academicYear, subjectType } = req.query

    // Verify if the requesting user is the student themselves, faculty, or admin
    const isOwnMarks = req.user.id === studentId
    const isFacultyOrAdmin = ['faculty', 'admin'].includes(req.user.role)
    
    if (!isOwnMarks && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own marks.'
      })
    }

    // Build query filters
    let query = { student: studentId }
    
    if (semester && semester !== 'all') {
      if (semester === 'current') {
        query.semester = 'Odd' // Current semester
        query.academicYear = '2024-2025'
      } else if (semester === 'previous') {
        query.semester = 'Even' // Previous semester  
        query.academicYear = '2023-2024'
      } else {
        query.semester = semester
      }
    }
    
    if (academicYear && academicYear !== 'all') {
      query.academicYear = academicYear
    }

    // Get marks with populated subject details
    const marks = await StudentMarkEntry.find(query)
      .populate('subject', 'name code credits type description')
      .populate('student', 'name email rollNumber')
      .sort({ createdAt: -1 })

    // Filter by subject type if specified
    let filteredMarks = marks
    if (subjectType && subjectType !== 'all') {
      filteredMarks = marks.filter(mark => 
        mark.subject && mark.subject.type.toLowerCase() === subjectType.toLowerCase()
      )
    }

    res.json({
      success: true,
      data: filteredMarks,
      message: `Retrieved ${filteredMarks.length} mark entries for student`
    })

  } catch (error) {
    console.error('Error fetching student marks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student marks',
      error: error.message
    })
  }
})

// Get student analytics (GPA, performance metrics)
router.get('/student/:studentId/analytics', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    const { semester, academicYear } = req.query

    // Verify access permissions
    const isOwnMarks = req.user.id === studentId
    const isFacultyOrAdmin = ['faculty', 'admin'].includes(req.user.role)
    
    if (!isOwnMarks && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own analytics.'
      })
    }

    // Build query filters
    let query = { student: studentId }
    if (semester && semester !== 'all') {
      if (semester === 'current') {
        query.semester = 'Odd'
        query.academicYear = '2024-2025'
      } else if (semester === 'previous') {
        query.semester = 'Even'
        query.academicYear = '2023-2024'
      } else {
        query.semester = semester
      }
    }
    if (academicYear && academicYear !== 'all') {
      query.academicYear = academicYear
    }

    // Get all marks for analytics
    const marks = await StudentMarkEntry.find(query)
      .populate('subject', 'name code credits type')

    // Process analytics
    const analytics = await processStudentAnalytics(marks, studentId)

    res.json({
      success: true,
      data: analytics,
      message: 'Analytics calculated successfully'
    })

  } catch (error) {
    console.error('Error calculating student analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate analytics',
      error: error.message
    })
  }
})

// Get subject-wise performance summary
router.get('/student/:studentId/subjects', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    const { semester, academicYear } = req.query

    // Verify access permissions
    const isOwnMarks = req.user.id === studentId
    const isFacultyOrAdmin = ['faculty', 'admin'].includes(req.user.role)
    
    if (!isOwnMarks && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      })
    }

    // Build query
    let query = { student: studentId }
    if (semester && semester !== 'all') {
      if (semester === 'current') {
        query.semester = 'Odd'
        query.academicYear = '2024-2025'
      } else {
        query.semester = semester
      }
    }
    if (academicYear && academicYear !== 'all') {
      query.academicYear = academicYear
    }

    // Aggregate subject-wise performance
    const subjectPerformance = await StudentMarkEntry.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $group: {
          _id: '$subject',
          subject: { $first: '$subjectInfo' },
          marks: { $push: '$$ROOT' },
          totalMarks: { $sum: '$marksObtained' },
          totalPossible: { $sum: '$totalMarks' },
          examCount: { $sum: 1 },
          averagePercentage: { $avg: '$percentage' }
        }
      },
      {
        $addFields: {
          overallPercentage: {
            $cond: {
              if: { $gt: ['$totalPossible', 0] },
              then: { $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] },
              else: 0
            }
          },
          overallGrade: {
            $switch: {
              branches: [
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 90] }, then: 'O' },
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 80] }, then: 'A+' },
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 70] }, then: 'A' },
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 60] }, then: 'B+' },
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 50] }, then: 'B' },
                { case: { $gte: [{ $multiply: [{ $divide: ['$totalMarks', '$totalPossible'] }, 100] }, 40] }, then: 'C' }
              ],
              default: 'F'
            }
          }
        }
      },
      { $sort: { 'subject.name': 1 } }
    ])

    res.json({
      success: true,
      data: subjectPerformance,
      message: `Retrieved performance data for ${subjectPerformance.length} subjects`
    })

  } catch (error) {
    console.error('Error fetching subject performance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject performance',
      error: error.message
    })
  }
})

// Get semester-wise GPA trend
router.get('/student/:studentId/gpa-trend', protect, async (req, res) => {
  try {
    const { studentId } = req.params

    // Verify access permissions
    const isOwnMarks = req.user.id === studentId
    const isFacultyOrAdmin = ['faculty', 'admin'].includes(req.user.role)
    
    if (!isOwnMarks && !isFacultyOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      })
    }

    // Get semester-wise GPA data
    const gpaData = await StudentMarkEntry.aggregate([
      { $match: { student: studentId } },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $addFields: {
          gradePoints: {
            $switch: {
              branches: [
                { case: { $gte: ['$percentage', 90] }, then: 10 },
                { case: { $gte: ['$percentage', 80] }, then: 9 },
                { case: { $gte: ['$percentage', 70] }, then: 8 },
                { case: { $gte: ['$percentage', 60] }, then: 7 },
                { case: { $gte: ['$percentage', 50] }, then: 6 },
                { case: { $gte: ['$percentage', 40] }, then: 5 }
              ],
              default: 0
            }
          }
        }
      },
      {
        $group: {
          _id: {
            semester: '$semester',
            academicYear: '$academicYear'
          },
          totalCredits: { $sum: '$subjectInfo.credits' },
          totalCreditPoints: { $sum: { $multiply: ['$gradePoints', '$subjectInfo.credits'] } },
          subjectCount: { $sum: 1 },
          averagePercentage: { $avg: '$percentage' }
        }
      },
      {
        $addFields: {
          gpa: {
            $cond: {
              if: { $gt: ['$totalCredits', 0] },
              then: { $divide: ['$totalCreditPoints', '$totalCredits'] },
              else: 0
            }
          }
        }
      },
      { $sort: { '_id.academicYear': 1, '_id.semester': 1 } }
    ])

    res.json({
      success: true,
      data: gpaData,
      message: `Retrieved GPA trend for ${gpaData.length} semesters`
    })

  } catch (error) {
    console.error('Error fetching GPA trend:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPA trend',
      error: error.message
    })
  }
})

// Helper function to process student analytics
async function processStudentAnalytics(marks, studentId) {
  try {
    // Group marks by subject
    const subjectMap = new Map()
    let totalCredits = 0
    let totalCreditPoints = 0
    let passedSubjects = 0
    let failedSubjects = 0
    let completedSubjects = 0

    marks.forEach(mark => {
      const subjectId = mark.subject._id.toString()
      
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: mark.subject,
          marks: [],
          totalMarks: 0,
          totalPossible: 0
        })
      }
      
      const subjectData = subjectMap.get(subjectId)
      subjectData.marks.push(mark)
      subjectData.totalMarks += mark.marksObtained
      subjectData.totalPossible += mark.totalMarks
    })

    // Calculate analytics for each subject
    const gradeDistribution = {}
    let totalPercentage = 0
    let subjectCount = 0

    subjectMap.forEach((subjectData) => {
      const overallPercentage = subjectData.totalPossible > 0 
        ? (subjectData.totalMarks / subjectData.totalPossible) * 100 
        : 0

      const grade = overallPercentage >= 90 ? 'O' :
                   overallPercentage >= 80 ? 'A+' :
                   overallPercentage >= 70 ? 'A' :
                   overallPercentage >= 60 ? 'B+' :
                   overallPercentage >= 50 ? 'B' :
                   overallPercentage >= 40 ? 'C' : 'F'

      const gradePoints = grade === 'O' ? 10 :
                         grade === 'A+' ? 9 :
                         grade === 'A' ? 8 :
                         grade === 'B+' ? 7 :
                         grade === 'B' ? 6 :
                         grade === 'C' ? 5 : 0

      totalCredits += subjectData.subject.credits
      totalCreditPoints += gradePoints * subjectData.subject.credits

      if (overallPercentage >= 40) {
        passedSubjects++
      } else if (subjectData.marks.length > 0) {
        failedSubjects++
      }

      if (subjectData.marks.length >= 3) { // Assuming CIA1, CIA2, Model
        completedSubjects++
      }

      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1
      totalPercentage += overallPercentage
      subjectCount++
    })

    const currentGPA = totalCredits > 0 ? totalCreditPoints / totalCredits : 0
    const averagePercentage = subjectCount > 0 ? totalPercentage / subjectCount : 0

    return {
      currentGPA: Math.round(currentGPA * 100) / 100,
      totalCredits,
      completedSubjects,
      totalSubjects: subjectMap.size,
      passedSubjects,
      failedSubjects,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      gradeDistribution,
      semesterTrend: [
        { semester: 'Sem 1', gpa: 3.2 }, // These would come from historical data
        { semester: 'Sem 2', gpa: 3.6 },
        { semester: 'Current', gpa: currentGPA }
      ]
    }
  } catch (error) {
    console.error('Error processing analytics:', error)
    throw error
  }
}

// Auto-assign improvement tasks for poor CO performance
const autoAssignImprovementTasks = async (studentId, marks) => {
  try {
    const ImprovementTask = require('../models/ImprovementTask');
    
    // Calculate CO-wise performance
    const coPerformance = {};
    
    marks.forEach(mark => {
      ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].forEach(co => {
        if (mark[`${co.toLowerCase()}Marks`] !== undefined && mark[`${co.toLowerCase()}MaxMarks`] !== undefined) {
          const percentage = (mark[`${co.toLowerCase()}Marks`] / mark[`${co.toLowerCase()}MaxMarks`]) * 100;
          
          if (!coPerformance[co]) {
            coPerformance[co] = { total: 0, count: 0, subjects: new Set() };
          }
          
          coPerformance[co].total += percentage;
          coPerformance[co].count += 1;
          coPerformance[co].subjects.add(mark.subject._id.toString());
        }
      });
    });
    
    // Check for COs with poor performance (< 50%)
    for (const [co, data] of Object.entries(coPerformance)) {
      const averagePerformance = data.total / data.count;
      
      if (averagePerformance < 50 && data.count >= 2) { // Poor performance with at least 2 assessments
        // Find the subject with lowest CO performance
        let worstSubject = null;
        let lowestPerformance = 100;
        
        for (const subjectId of data.subjects) {
          const subjectMarks = marks.filter(m => m.subject._id.toString() === subjectId);
          const subjectCoPerf = subjectMarks.reduce((sum, mark) => {
            const coMarks = mark[`${co.toLowerCase()}Marks`];
            const coMaxMarks = mark[`${co.toLowerCase()}MaxMarks`];
            return sum + ((coMarks / coMaxMarks) * 100);
          }, 0) / subjectMarks.length;
          
          if (subjectCoPerf < lowestPerformance) {
            lowestPerformance = subjectCoPerf;
            worstSubject = subjectId;
          }
        }
        
        if (worstSubject && lowestPerformance < 50) {
          // Check if improvement task already exists
          const existingTask = await ImprovementTask.findOne({
            student: studentId,
            subject: worstSubject,
            status: { $in: ['Assigned', 'In Progress'] }
          });
          
          if (!existingTask) {
            // Auto-assign improvement task
            const subject = await Subject.findById(worstSubject);
            
            const improvementTask = new ImprovementTask({
              student: studentId,
              subject: worstSubject,
              assignedBy: null, // System assigned
              taskType: 'CO_IMPROVEMENT',
              title: `${co} Performance Improvement - ${subject?.name || 'Subject'}`,
              description: `Your ${co} performance (${lowestPerformance.toFixed(1)}%) needs improvement. Complete this task to strengthen your understanding.`,
              priority: lowestPerformance < 30 ? 'HIGH' : 'MEDIUM',
              status: 'Assigned',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              
              metadata: {
                currentPerformance: lowestPerformance,
                targetPerformance: 60,
                studyTimeMinutes: 90,
                weakAreas: [co],
                autoAssigned: true,
                assignmentReason: `Poor ${co} performance (${lowestPerformance.toFixed(1)}%)`
              },
              
              requirements: [
                `Complete ${co}-focused practice questions`,
                'Review course materials related to this outcome',
                'Achieve at least 60% in the practice assessment'
              ]
            });
            
            await improvementTask.save();
            console.log(`Auto-assigned improvement task for student ${studentId}, subject ${worstSubject}, CO: ${co}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error in auto-assigning improvement tasks:', error);
  }
};

module.exports = router