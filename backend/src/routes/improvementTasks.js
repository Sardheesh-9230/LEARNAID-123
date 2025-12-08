const express = require('express')
const mongoose = require('mongoose')
const ImprovementTask = require('../models/ImprovementTask')
const User = require('../models/User')
const Subject = require('../models/Subject')
const { protect } = require('../middleware/auth')

const router = express.Router()

// Assign improvement task for poor CO performance
router.post('/assign-improvement', protect, async (req, res) => {
  try {
    const {
      studentId,
      subjectId,
      subjectName,
      currentPerformance,
      taskType = 'CO_IMPROVEMENT',
      priority = 'MEDIUM',
      studyTimeMinutes = 90,
      generatedMCQs = true,
      weakAreas = [],
      dueDate,
      description
    } = req.body

    // Validate required fields
    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Subject ID are required'
      })
    }

    // Check if student exists
    const student = await User.findById(studentId)
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId)
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      })
    }

    // Check if similar improvement task already exists (avoid duplicates)
    const existingImprovementTask = await ImprovementTask.findOne({
      student: studentId,
      subject: subjectId,
      taskType: 'CO_IMPROVEMENT',
      status: { $in: ['Assigned', 'In Progress'] }
    })

    if (existingImprovementTask) {
      return res.status(200).json({
        success: true,
        message: 'Similar improvement task already exists',
        data: existingImprovementTask
      })
    }

    // Check if there's already a CO-based learning task assigned for this subject
    const Task = require('../models/Task')
    const existingLearningTask = await Task.findOne({
      subject: subjectId,
      'assignedStudents.student': studentId,
      'assignedStudents.status': { $in: ['assigned', 'studying', 'in-progress'] }
    })

    if (existingLearningTask) {
      return res.status(200).json({
        success: true,
        message: 'Student already has an active learning task for this subject',
        data: { 
          taskType: 'learning_task', 
          taskId: existingLearningTask._id,
          title: existingLearningTask.title 
        }
      })
    }

    // Generate MCQs for the subject (mock implementation)
    let generatedMCQData = null
    if (generatedMCQs) {
      generatedMCQData = await generateMCQsForSubject(subjectId, weakAreas)
    }

    // Create improvement task
    const improvementTask = new ImprovementTask({
      student: studentId,
      subject: subjectId,
      assignedBy: req.user.id, // Current user (could be system or faculty)
      taskType: 'CO_IMPROVEMENT',
      title: `Performance Improvement - ${subjectName}`,
      description: description || `Improve your performance in ${subjectName}. Current performance: ${currentPerformance.toFixed(1)}%`,
      priority: priority,
      status: 'Assigned',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      
      // Custom fields for improvement tasks
      metadata: {
        currentPerformance,
        targetPerformance: Math.min(currentPerformance + 20, 85), // Target 20% improvement or 85%, whichever is lower
        studyTimeMinutes,
        weakAreas,
        generatedMCQs: generatedMCQData,
        autoAssigned: true,
        assignmentReason: 'Poor CO performance (<50%)'
      },
      
      // Requirements for completion
      requirements: [
        'Complete generated MCQ practice questions',
        `Study for minimum ${studyTimeMinutes} minutes`,
        'Review weak areas identified in performance analysis',
        'Take practice quiz with >70% score'
      ],
      
      studyMaterials: [
        {
          type: 'MCQ_SET',
          title: `Practice Questions - ${subjectName}`,
          content: generatedMCQData,
          estimatedTime: Math.floor(studyTimeMinutes * 0.4) // 40% of study time for MCQs
        },
        {
          type: 'STUDY_GUIDE',
          title: `Study Guide - Weak Areas`,
          content: `Focus on: ${weakAreas.join(', ')}`,
          estimatedTime: Math.floor(studyTimeMinutes * 0.6) // 60% of study time for reading
        }
      ]
    })

    await improvementTask.save()

    // Populate the response
    const populatedTask = await ImprovementTask.findById(improvementTask._id)
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code credits')
      .populate('assignedBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'Improvement task assigned successfully',
      data: populatedTask
    })

  } catch (error) {
    console.error('Error assigning improvement task:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign improvement task',
      error: error.message
    })
  }
})

// Get improvement tasks for a student (simple endpoint)
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    
    // Verify access (student can only view their own tasks, faculty/admin can view any)
    if (req.user.id !== studentId && !['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const tasks = await ImprovementTask.find({
      student: studentId,
      taskType: 'CO_IMPROVEMENT'
    })
    .populate('subject', 'name code credits')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: tasks,
      message: `Retrieved ${tasks.length} improvement tasks`
    })

  } catch (error) {
    console.error('Error fetching improvement tasks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement tasks',
      error: error.message
    })
  }
})

// Get improvement tasks for a student (detailed endpoint)
router.get('/student/:studentId/improvement', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    
    // Verify access (student can only view their own tasks, faculty/admin can view any)
    if (req.user.id !== studentId && !['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const tasks = await ImprovementTask.find({
      student: studentId,
      taskType: 'CO_IMPROVEMENT'
    })
    .populate('subject', 'name code credits')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: tasks,
      message: `Retrieved ${tasks.length} improvement tasks`
    })

  } catch (error) {
    console.error('Error fetching improvement tasks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement tasks',
      error: error.message
    })
  }
})

// Update task progress
router.put('/:taskId/progress', protect, async (req, res) => {
  try {
    const { taskId } = req.params
    const { status, progressPercentage, studyTimeCompleted, mcqScore, notes } = req.body

    const task = await ImprovementTask.findById(taskId)
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    // Verify access (student can update their own task, faculty can update any)
    if (req.user.id !== task.student.toString() && !['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Update task progress
    if (status) task.status = status
    if (progressPercentage !== undefined) task.progressPercentage = progressPercentage
    if (studyTimeCompleted) {
      task.metadata.studyTimeCompleted = (task.metadata.studyTimeCompleted || 0) + studyTimeCompleted
    }
    if (mcqScore !== undefined) {
      if (!task.metadata.mcqScores) task.metadata.mcqScores = []
      task.metadata.mcqScores.push({
        score: mcqScore,
        timestamp: new Date(),
        totalQuestions: req.body.totalQuestions || 10
      })
    }
    if (notes) {
      if (!task.progressNotes) task.progressNotes = []
      task.progressNotes.push({
        note: notes,
        timestamp: new Date(),
        addedBy: req.user.id
      })
    }

    // Auto-complete task if criteria met
    if (task.metadata.studyTimeCompleted >= task.metadata.studyTimeMinutes && 
        task.metadata.mcqScores && 
        task.metadata.mcqScores.some(score => score.score >= 70)) {
      task.status = 'Completed'
      task.completedAt = new Date()
      task.progressPercentage = 100
    }

    await task.save()

    const updatedTask = await ImprovementTask.findById(taskId)
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code credits')
      .populate('assignedBy', 'name email')

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task progress updated successfully'
    })

  } catch (error) {
    console.error('Error updating task progress:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update task progress',
      error: error.message
    })
  }
})

// Helper function to generate MCQs for a subject (mock implementation)
async function generateMCQsForSubject(subjectId, weakAreas = []) {
  try {
    // This is a mock implementation - in real scenario, this would integrate with MCQ generator
    const mcqTemplates = [
      {
        question: "What is the primary concept related to {area}?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        explanation: "This tests understanding of {area} fundamentals"
      },
      {
        question: "Which of the following best describes {area}?",
        options: ["Definition A", "Definition B", "Definition C", "Definition D"],
        correctAnswer: 1,
        explanation: "This question evaluates knowledge of {area} definitions"
      },
      {
        question: "In the context of {area}, what is the most important factor?",
        options: ["Factor 1", "Factor 2", "Factor 3", "Factor 4"],
        correctAnswer: 2,
        explanation: "This assesses critical thinking about {area}"
      }
    ]

    const generatedMCQs = []
    const areas = weakAreas.length > 0 ? weakAreas : ['General Topics']

    areas.forEach(area => {
      mcqTemplates.forEach((template, index) => {
        generatedMCQs.push({
          id: `mcq_${area.replace(/\s+/g, '_')}_${index}`,
          question: template.question.replace(/{area}/g, area),
          options: template.options,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation.replace(/{area}/g, area),
          area: area,
          difficulty: 'Medium',
          estimatedTime: 2 // minutes
        })
      })
    })

    return {
      totalQuestions: generatedMCQs.length,
      questions: generatedMCQs,
      estimatedTime: generatedMCQs.length * 2, // 2 minutes per question
      areas: areas,
      generatedAt: new Date()
    }

  } catch (error) {
    console.error('Error generating MCQs:', error)
    return {
      totalQuestions: 0,
      questions: [],
      error: 'Failed to generate MCQs'
    }
  }
}

module.exports = router