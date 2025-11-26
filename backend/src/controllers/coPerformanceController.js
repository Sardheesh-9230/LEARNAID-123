const QuestionWiseMarks = require('../models/QuestionWiseMarks');
const ImprovementTask = require('../models/ImprovementTask');
const User = require('../models/User');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');

/**
 * Analyze CO-wise performance and auto-assign improvement tasks
 */
const analyzeCOPerformanceAndAssignTasks = async (req, res) => {
  try {
    const { studentId, subjectId, academicYear = '2024-2025', threshold = 50 } = req.body;

    // Validate student and subject
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get CO-wise performance analysis
    const coPerformance = await QuestionWiseMarks.getCOPerformance(studentId, subjectId, academicYear);
    
    if (!coPerformance || coPerformance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No question-wise marks found for CO analysis'
      });
    }

    // Identify COs with poor performance (below threshold)
    const poorPerformanceCOs = coPerformance.filter(co => co.percentage < threshold);
    
    // Analysis summary
    const analysisResult = {
      studentId,
      studentName: student.name,
      subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      academicYear,
      analysisDate: new Date(),
      threshold,
      coPerformance,
      totalCOs: coPerformance.length,
      attainedCOs: coPerformance.filter(co => co.percentage >= threshold).length,
      notAttainedCOs: poorPerformanceCOs.length,
      overallPerformance: {
        averagePercentage: Math.round(
          coPerformance.reduce((sum, co) => sum + co.percentage, 0) / coPerformance.length * 100
        ) / 100,
        attainmentRate: Math.round(
          (coPerformance.filter(co => co.percentage >= threshold).length / coPerformance.length) * 100 * 100
        ) / 100
      },
      poorPerformanceCOs: poorPerformanceCOs.map(co => ({
        courseOutcome: co.courseOutcome,
        percentage: co.percentage,
        gap: threshold - co.percentage,
        totalMarks: co.totalMarks,
        obtainedMarks: co.obtainedMarks,
        questionCount: co.questionCount
      })),
      tasksAssigned: []
    };

    // Auto-assign improvement tasks for poor performance COs
    if (poorPerformanceCOs.length > 0) {
      console.log(`📊 Found ${poorPerformanceCOs.length} COs with performance below ${threshold}%`);
      
      for (const co of poorPerformanceCOs) {
        try {
          // Check if similar task already exists
          const existingTask = await ImprovementTask.findOne({
            student: studentId,
            subject: subjectId,
            taskType: 'CO_IMPROVEMENT',
            status: { $in: ['Assigned', 'In Progress'] },
            'metadata.targetCO': co.courseOutcome
          });

          if (existingTask) {
            console.log(`⚠️  Task already exists for ${co.courseOutcome}`);
            analysisResult.tasksAssigned.push({
              courseOutcome: co.courseOutcome,
              status: 'already_exists',
              taskId: existingTask._id,
              message: 'Similar improvement task already exists'
            });
            continue;
          }

          // Create improvement task
          const taskData = {
            student: studentId,
            subject: subjectId,
            assignedBy: req.user?.id || 'system',
            taskType: 'CO_IMPROVEMENT',
            title: `CO ${co.courseOutcome} Performance Improvement - ${subject.name}`,
            description: `Improve your performance in Course Outcome ${co.courseOutcome}. Current attainment: ${co.percentage.toFixed(1)}%, Target: ${threshold}%`,
            priority: co.percentage < 30 ? 'HIGH' : co.percentage < 40 ? 'MEDIUM' : 'LOW',
            status: 'Assigned',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            
            metadata: {
              currentPerformance: co.percentage,
              targetPerformance: threshold,
              targetCO: co.courseOutcome,
              performanceGap: threshold - co.percentage,
              studyTimeMinutes: calculateStudyTimeForCO(co.percentage, threshold),
              studyTimeCompleted: 0,
              weakAreas: [`Course Outcome ${co.courseOutcome}`],
              autoAssigned: true,
              assignmentReason: `CO ${co.courseOutcome} attainment below ${threshold}%`,
              coAnalysisData: {
                totalMarks: co.totalMarks,
                obtainedMarks: co.obtainedMarks,
                questionCount: co.questionCount,
                examTypes: co.examTypes
              }
            },
            
            requirements: [
              `Review all questions related to Course Outcome ${co.courseOutcome}`,
              `Complete practice exercises for ${co.courseOutcome}`,
              `Study for minimum ${calculateStudyTimeForCO(co.percentage, threshold)} minutes`,
              `Take practice quiz with >70% score`,
              `Achieve ${threshold}% or higher in next assessment`
            ],
            
            studyMaterials: [
              {
                type: 'STUDY_GUIDE',
                title: `${co.courseOutcome} Study Guide - ${subject.name}`,
                content: {
                  courseOutcome: co.courseOutcome,
                  currentPerformance: co.percentage,
                  targetPerformance: threshold,
                  suggestedTopics: [`Unit topics covering ${co.courseOutcome}`],
                  practiceQuestions: 'Generated based on weak areas'
                },
                estimatedTime: Math.floor(calculateStudyTimeForCO(co.percentage, threshold) * 0.6)
              },
              {
                type: 'MCQ_SET',
                title: `${co.courseOutcome} Practice Questions`,
                content: {
                  courseOutcome: co.courseOutcome,
                  questionCount: Math.max(10, Math.floor(co.questionCount * 1.5)),
                  difficulty: 'Medium',
                  focusAreas: [`Questions from previous ${co.courseOutcome} assessments`]
                },
                estimatedTime: Math.floor(calculateStudyTimeForCO(co.percentage, threshold) * 0.4)
              }
            ]
          };

          const improvementTask = new ImprovementTask(taskData);
          await improvementTask.save();

          // Populate the response
          const populatedTask = await ImprovementTask.findById(improvementTask._id)
            .populate('student', 'name email rollNumber')
            .populate('subject', 'name code credits')
            .populate('assignedBy', 'name email');

          analysisResult.tasksAssigned.push({
            courseOutcome: co.courseOutcome,
            status: 'assigned',
            taskId: populatedTask._id,
            priority: populatedTask.priority,
            dueDate: populatedTask.dueDate,
            studyTime: populatedTask.metadata.studyTimeMinutes,
            message: `Improvement task assigned for CO ${co.courseOutcome}`
          });

          console.log(`✅ Assigned improvement task for CO ${co.courseOutcome}`);

        } catch (taskError) {
          console.error(`❌ Error assigning task for CO ${co.courseOutcome}:`, taskError);
          analysisResult.tasksAssigned.push({
            courseOutcome: co.courseOutcome,
            status: 'error',
            message: `Failed to assign task: ${taskError.message}`
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `CO performance analysis completed. ${analysisResult.tasksAssigned.filter(t => t.status === 'assigned').length} improvement tasks assigned.`,
      data: analysisResult
    });

  } catch (error) {
    console.error('Error in CO performance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze CO performance',
      error: error.message
    });
  }
};

/**
 * Get CO-wise performance analysis for a student
 */
const getStudentCOPerformance = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { academicYear = '2024-2025' } = req.query;

    // Verify access
    if (req.user.id !== studentId && !['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const coPerformance = await QuestionWiseMarks.getCOPerformance(studentId, subjectId, academicYear);
    
    const student = await User.findById(studentId, 'name rollNumber email');
    const subject = await Subject.findById(subjectId, 'name code credits');

    res.status(200).json({
      success: true,
      data: {
        student,
        subject,
        academicYear,
        coPerformance,
        summary: {
          totalCOs: coPerformance.length,
          attainedCOs: coPerformance.filter(co => co.attainment === 'Attained').length,
          averagePerformance: coPerformance.length > 0 
            ? Math.round(coPerformance.reduce((sum, co) => sum + co.percentage, 0) / coPerformance.length * 100) / 100
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting CO performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CO performance',
      error: error.message
    });
  }
};

/**
 * Get subject-wise CO analysis for faculty/admin
 */
const getSubjectCOAnalysis = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academicYear = '2024-2025' } = req.query;

    const coAnalysis = await QuestionWiseMarks.getSubjectCOAnalysis(subjectId, academicYear);
    const subject = await Subject.findById(subjectId, 'name code credits');

    res.status(200).json({
      success: true,
      data: {
        subject,
        academicYear,
        coAnalysis,
        summary: {
          totalCOs: coAnalysis.length,
          averageAttainment: coAnalysis.length > 0
            ? Math.round(coAnalysis.reduce((sum, co) => sum + co.averageAttainment, 0) / coAnalysis.length * 100) / 100
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting subject CO analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subject CO analysis',
      error: error.message
    });
  }
};

/**
 * Calculate study time based on performance gap
 */
function calculateStudyTimeForCO(currentPerformance, targetPerformance) {
  const gap = targetPerformance - currentPerformance;
  
  // Base study time: 60 minutes
  let studyTime = 60;
  
  // Additional time based on performance gap
  if (gap > 40) studyTime = 180; // 3 hours for very poor performance
  else if (gap > 30) studyTime = 150; // 2.5 hours
  else if (gap > 20) studyTime = 120; // 2 hours
  else if (gap > 10) studyTime = 90;  // 1.5 hours
  
  return studyTime;
}

module.exports = {
  analyzeCOPerformanceAndAssignTasks,
  getStudentCOPerformance,
  getSubjectCOAnalysis
};