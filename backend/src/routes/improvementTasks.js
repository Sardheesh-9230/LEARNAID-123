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
    if (!student || student.role !== 'Student') {
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

// Get improvement tasks for a subject
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const { subjectId } = req.params
    
    const tasks = await ImprovementTask.find({ 
      subject: subjectId 
    })
    .populate('student', 'name registrationNumber email')
    .populate('subject', 'name code')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: tasks.length,
      tasks
    })
  } catch (error) {
    console.error('Error fetching improvement tasks by subject:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch improvement tasks',
      error: error.message
    })
  }
})

// Get improvement tasks for a student (simple endpoint)
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params
    
    // Verify access (student can only view their own tasks, faculty/admin can view any)
    if (req.user.id !== studentId && !['Faculty', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const tasks = await ImprovementTask.find({
      student: studentId,
      taskType: { $in: ['CO_IMPROVEMENT', 'CO_ASSESSMENT'] }
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
    if (req.user.id !== studentId && !['Faculty', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Find tasks where:
    // 1. Single-student tasks: student field matches
    // 2. Multi-student tasks: studentId is in studentAssignments array
    const tasks = await ImprovementTask.find({
      $or: [
        { student: studentId }, // Single-student tasks
        { 'studentAssignments.student': studentId } // Multi-student tasks
      ],
      taskType: { $in: ['CO_IMPROVEMENT', 'CO_ASSESSMENT'] }
    })
    .populate('subject', 'name code credits')
    .populate('assignedBy', 'name email')
    .populate('studentAssignments.student', 'name email rollNumber')
    .sort({ createdAt: -1 })

    // ── Helper: normalize a question so it always has a non-empty 'question' field ──
    // Questions may be stored under different field names depending on which
    // generator created them (question, questionText, text, title, content, etc.)
    const normalizeQuestionText = (q) => {
      if (!q) return q
      const text = q.question || q.questionText || q.text || q.title || q.content || ''
      return { ...q, question: text, questionText: text }
    }

    const normalizeQuestions = (qs) =>
      Array.isArray(qs) ? qs.map(normalizeQuestionText) : qs

    // Transform tasks to show only THIS student's personalized content
    const personalizedTasks = tasks.map(task => {
      const taskObj = task.toObject()
      
      // For multi-student tasks, extract only this student's assignment
      if (taskObj.studentAssignments && taskObj.studentAssignments.length > 0) {
        const studentAssignment = taskObj.studentAssignments.find(
          // Handle both populated (a.student is an object) and unpopulated (a.student is an ObjectId)
          a => (a.student?._id?.toString() || a.student?.toString()) === studentId
        )
        
        if (studentAssignment) {
          const normalizedPersonalizedQs = normalizeQuestions(studentAssignment.personalizedQuestions)
          // Return task with ONLY this student's questions and data
          return {
            ...taskObj,
            isMultiStudent: true,
            student: studentAssignment.student,
            personalizedData: {
              weakCOs: studentAssignment.weakCOs,
              questions: normalizedPersonalizedQs,
              totalMarks: studentAssignment.totalMarks,
              status: studentAssignment.status,
              attemptCount: studentAssignment.attemptCount,
              scores: studentAssignment.scores
            },
            // Override main metadata to show personalized info
            metadata: {
              ...taskObj.metadata,
              generatedMCQs: {
                ...taskObj.metadata?.generatedMCQs,
                totalQuestions: normalizedPersonalizedQs.length,
                questions: normalizedPersonalizedQs
              },
              teacherSettings: {
                ...taskObj.metadata?.teacherSettings,
                totalMarks: studentAssignment.totalMarks
              }
            }
          }
        }
      }

      // For single-student tasks, normalize the metadata.generatedMCQs.questions too
      const singleGenMCQs = taskObj.metadata?.generatedMCQs
      return {
        ...taskObj,
        isMultiStudent: false,
        metadata: {
          ...taskObj.metadata,
          ...(singleGenMCQs && {
            generatedMCQs: {
              ...singleGenMCQs,
              questions: normalizeQuestions(singleGenMCQs.questions)
            }
          })
        }
      }
    })

    res.json({
      success: true,
      data: personalizedTasks,
      message: `Retrieved ${personalizedTasks.length} improvement tasks`
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
    let hasAccess = false
    
    if (['Faculty', 'Admin'].includes(req.user.role)) {
      hasAccess = true
    } else {
      // For single-student tasks
      if (task.student && task.student.toString() === req.user.id) {
        hasAccess = true
      }
      // For multi-student tasks
      if (task.studentAssignments && task.studentAssignments.length > 0) {
        hasAccess = task.studentAssignments.some(
          assignment => assignment.student.toString() === req.user.id
        )
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // For multi-student tasks, update the specific student's assignment
    if (task.studentAssignments && task.studentAssignments.length > 0) {
      const studentAssignment = task.studentAssignments.find(
        a => a.student.toString() === req.user.id
      )
      
      if (studentAssignment) {
        if (status) studentAssignment.status = status
        // Note: progressPercentage is not stored per student in multi-student tasks
      }
    } else {
      // For single-student tasks, update the main task fields
      if (status) task.status = status
      if (progressPercentage !== undefined) task.progressPercentage = progressPercentage
    }
    
    // Update metadata (shared for all students)
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
      .populate('studentAssignments.student', 'name email rollNumber')
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

// Assign CO-specific improvement task with MCQ generator integration
router.post('/assign-co-specific', protect, async (req, res) => {
  try {
    console.log('📝 ============= TASK ASSIGNMENT REQUEST =============')
    console.log('📝 Full request body:', JSON.stringify(req.body, null, 2))
    console.log('📝 Student ID:', req.body.studentId)
    console.log('📝 Subject ID:', req.body.subjectId)
    console.log('📝 Course Outcome:', req.body.courseOutcome)
    console.log('📝 ==================================================')
    
    const {
      studentId,
      subjectId,
      subjectName,
      courseOutcome,
      coNumber,
      currentPerformance,
      taskType = 'CO_IMPROVEMENT',
      priority = 'MEDIUM',
      studyTimeMinutes = 90,
      weakAreas = [],
      coWeakAreas = [],
      dueDate,
      description,
      teacherSettings = {}
    } = req.body

    // Validate required fields
    if (!studentId || !subjectId || !courseOutcome) {
      console.log('❌ Missing required fields')
      return res.status(400).json({
        success: false,
        message: 'Student ID, Subject ID, and Course Outcome are required'
      })
    }

    // Check if student exists
    console.log('🔍 Looking for student with ID:', studentId, 'Type:', typeof studentId)
    const student = await User.findById(studentId)
    console.log('👤 Student check:', student ? `Found: ${student.name} (Role: ${student.role})` : 'Not found')
    
    if (!student) {
      console.log('❌ Student not found in database')
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }
    
    if (student.role !== 'Student') {
      console.log('❌ Invalid student role:', student.role)
      return res.status(400).json({
        success: false,
        message: `Invalid user role: ${student.role}. Expected: Student`
      })
    }

    // Check if subject exists
    console.log('🔍 Looking for subject with ID:', subjectId, 'Type:', typeof subjectId)
    const subject = await Subject.findById(subjectId)
    console.log('📚 Subject check:', subject ? `Found: ${subject.name}` : 'Not found')
    
    if (!subject) {
      console.log('❌ Subject not found in database')
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      })
    }

    // Check for existing active CO-specific task
    const existingTask = await ImprovementTask.findOne({
      student: studentId,
      subject: subjectId,
      courseOutcome: courseOutcome,
      status: { $in: ['Assigned', 'In Progress'] }
    })

    if (existingTask) {
      return res.status(200).json({
        success: true,
        message: `Active task already exists for ${courseOutcome}`,
        data: existingTask
      })
    }

    // Try to find existing MCQ session for this CO
    const MCQSession = require('../models/MCQSession')
    let mcqSession = await MCQSession.findOne({
      subject: subjectId,
      status: 'completed',
      'questions.0': { $exists: true } // Has at least one question
    }).sort({ createdAt: -1 }).limit(1)

    // Generate or use existing MCQs based on teacher settings
    let generatedMCQData = null
    const difficultyLevel = teacherSettings.difficultyLevel || 'Medium'
    const numberOfQuestions = teacherSettings.numberOfQuestions || 10

    if (mcqSession && mcqSession.questions.length >= numberOfQuestions) {
      // Use existing MCQ questions, filter by difficulty if needed
      let filteredQuestions = mcqSession.questions

      if (difficultyLevel !== 'Mixed') {
        filteredQuestions = filteredQuestions.filter(q => 
          q.difficulty?.toLowerCase() === difficultyLevel.toLowerCase()
        )
      }

      // If not enough filtered questions, fall back to all questions
      if (filteredQuestions.length < numberOfQuestions) {
        filteredQuestions = mcqSession.questions
      }

      // Select random questions
      const selectedQuestions = filteredQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, numberOfQuestions)

      generatedMCQData = {
        totalQuestions: selectedQuestions.length,
        sessionId: mcqSession._id,
        questions: selectedQuestions.map(q => ({
          id: q._id?.toString() || `mcq_${Date.now()}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          area: courseOutcome,
          courseOutcome: courseOutcome,
          difficulty: q.difficulty || difficultyLevel,
          bloomsLevel: q.bloomsLevel,
          estimatedTime: 2
        })),
        difficultyLevel: difficultyLevel,
        focusedCO: courseOutcome,
        estimatedTime: selectedQuestions.length * 2,
        areas: weakAreas,
        generatedAt: new Date(),
        generatedBy: req.user.id
      }
    } else {
      // No existing MCQs found - generate new ones from chapter materials
      console.log('🔄 No existing MCQs found, generating from chapter materials...')
      
      try {
        const Material = require('../models/Material')
        const Chapter = require('../models/Chapter')
        
        // Find chapters for this subject
        const chapters = await Chapter.find({ subject: subjectId })
        
        if (chapters.length > 0) {
          // Find materials from chapters, prioritizing those related to weak areas
          let materials = []
          
          if (weakAreas.length > 0) {
            // Try to find materials matching weak areas
            const weakAreaPattern = weakAreas.join('|')
            materials = await Material.find({
              subject: subjectId,
              $or: [
                { title: { $regex: weakAreaPattern, $options: 'i' } },
                { description: { $regex: weakAreaPattern, $options: 'i' } }
              ],
              pdfPath: { $exists: true, $ne: null }
            }).limit(3)
          }
          
          // If no materials found matching weak areas, get any materials from the subject
          if (materials.length === 0) {
            materials = await Material.find({
              subject: subjectId,
              pdfPath: { $exists: true, $ne: null }
            }).limit(3)
          }
          
          if (materials.length > 0) {
            // Use the first available material for MCQ generation
            const material = materials[0]
            
            console.log(`📚 Generating MCQs from material: ${material.title}`)
            
            // Generate MCQs using the MCQ generator controller logic
            const { generateMCQsFromMaterial } = require('../controllers/mcqGeneratorV3')
            
            const mcqResult = await generateMCQsFromMaterial({
              materialId: material._id,
              topics: weakAreas.join(', ') || courseOutcome,
              numberOfQuestions: numberOfQuestions,
              difficulty: difficultyLevel.toLowerCase(),
              userId: req.user.id
            })
            
            if (mcqResult.success && mcqResult.session) {
              // Successfully generated MCQs
              generatedMCQData = {
                totalQuestions: mcqResult.session.questions.length,
                sessionId: mcqResult.session._id,
                questions: mcqResult.session.questions.map(q => ({
                  id: q._id?.toString() || `mcq_${Date.now()}`,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  area: courseOutcome,
                  courseOutcome: courseOutcome,
                  difficulty: q.difficulty || difficultyLevel,
                  bloomsLevel: q.bloomsLevel,
                  estimatedTime: 2
                })),
                difficultyLevel: difficultyLevel,
                focusedCO: courseOutcome,
                estimatedTime: mcqResult.session.questions.length * 2,
                areas: weakAreas,
                generatedAt: new Date(),
                generatedBy: req.user.id,
                materialUsed: material.title
              }
              
              console.log(`✅ Successfully generated ${mcqResult.session.questions.length} MCQs`)
            } else {
              // MCQ generation failed, mark as needs generation
              generatedMCQData = {
                totalQuestions: 0,
                needsGeneration: true,
                difficultyLevel: difficultyLevel,
                focusedCO: courseOutcome,
                numberOfQuestions: numberOfQuestions,
                areas: weakAreas,
                message: mcqResult.message || 'MCQ generation failed, please try again',
                error: mcqResult.error
              }
              
              console.log('⚠️ MCQ generation failed:', mcqResult.message)
            }
          } else {
            // No materials found with PDFs
            generatedMCQData = {
              totalQuestions: 0,
              needsGeneration: true,
              difficultyLevel: difficultyLevel,
              focusedCO: courseOutcome,
              numberOfQuestions: numberOfQuestions,
              areas: weakAreas,
              message: 'No PDF materials available for MCQ generation. Please upload study materials first.'
            }
            
            console.log('⚠️ No PDF materials found for subject')
          }
        } else {
          // No chapters found
          generatedMCQData = {
            totalQuestions: 0,
            needsGeneration: true,
            difficultyLevel: difficultyLevel,
            focusedCO: courseOutcome,
            numberOfQuestions: numberOfQuestions,
            areas: weakAreas,
            message: 'No chapters found for this subject. Please set up chapters and materials first.'
          }
          
          console.log('⚠️ No chapters found for subject')
        }
      } catch (generationError) {
        console.error('❌ Error during MCQ generation:', generationError)
        
        generatedMCQData = {
          totalQuestions: 0,
          needsGeneration: true,
          difficultyLevel: difficultyLevel,
          focusedCO: courseOutcome,
          numberOfQuestions: numberOfQuestions,
          areas: weakAreas,
          message: 'MCQ generation encountered an error. Please try again later.',
          error: generationError.message
        }
      }
    }

    // Create CO-specific improvement task
    const improvementTask = new ImprovementTask({
      student: studentId,
      subject: subjectId,
      assignedBy: req.user.id,
      taskType: 'CO_IMPROVEMENT',
      courseOutcome: courseOutcome,
      coNumber: coNumber,
      title: `${courseOutcome} Performance Improvement - ${subjectName}`,
      description: description || `Improve your performance in ${courseOutcome}. Current: ${currentPerformance.toFixed(1)}%, Target: 70%`,
      priority: priority,
      status: 'Assigned',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      
      metadata: {
        currentPerformance,
        targetPerformance: Math.min(currentPerformance + 20, 85),
        studyTimeMinutes,
        weakAreas,
        coWeakAreas,
        generatedMCQs: generatedMCQData,
        teacherSettings: {
          difficultyLevel: teacherSettings.difficultyLevel || 'Medium',
          scheduledStartTime: teacherSettings.scheduledStartTime ? new Date(teacherSettings.scheduledStartTime) : undefined,
          scheduledEndTime: teacherSettings.scheduledEndTime ? new Date(teacherSettings.scheduledEndTime) : undefined,
          numberOfQuestions: numberOfQuestions,
          focusAreas: teacherSettings.focusAreas || weakAreas,
          allowRetake: teacherSettings.allowRetake !== undefined ? teacherSettings.allowRetake : true,
          maxAttempts: teacherSettings.maxAttempts || 3
        },
        autoAssigned: true,
        assignmentReason: `Poor ${courseOutcome} performance (<50%)`
      },
      
      requirements: [
        `Complete ${numberOfQuestions} ${difficultyLevel.toLowerCase()} MCQ questions for ${courseOutcome}`,
        `Study for minimum ${studyTimeMinutes} minutes`,
        `Focus on weak areas: ${weakAreas.join(', ') || 'General topics'}`,
        `Achieve minimum 70% score in practice quiz`,
        teacherSettings.allowRetake ? `Maximum ${teacherSettings.maxAttempts || 3} attempts allowed` : 'Single attempt only'
      ],
      
      studyMaterials: [
        {
          type: 'MCQ_SET',
          title: `${courseOutcome} Practice Questions - ${difficultyLevel} Level`,
          content: generatedMCQData,
          estimatedTime: generatedMCQData.estimatedTime
        },
        {
          type: 'STUDY_GUIDE',
          title: `${courseOutcome} Study Guide`,
          content: {
            courseOutcome: courseOutcome,
            weakAreas: weakAreas,
            targetImprovement: Math.min(currentPerformance + 20, 85) - currentPerformance,
            recommendations: [
              `Focus on ${courseOutcome} concepts`,
              `Review lecture notes for ${weakAreas.join(', ')}`,
              `Practice ${numberOfQuestions} questions`,
              `Analyze explanations for incorrect answers`
            ]
          },
          estimatedTime: Math.floor(studyTimeMinutes * 0.6)
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
      message: `CO-specific improvement task assigned successfully for ${courseOutcome}`,
      data: populatedTask
    })

  } catch (error) {
    console.error('❌ Error assigning CO-specific task:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Failed to assign CO-specific improvement task',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router

// Submit MCQ quiz answers and calculate score
router.post('/:taskId/submit-mcq', protect, async (req, res) => {
  try {
    const { taskId } = req.params
    const { answers, timeTaken } = req.body
    const studentId = req.user.id

    const task = await ImprovementTask.findById(taskId)
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    // Check if this is a multi-student task
    let questions = []
    let studentAssignment = null
    let isMultiStudent = false

    if (task.studentAssignments && task.studentAssignments.length > 0) {
      // Multi-student task - find this student's assignment
      isMultiStudent = true
      studentAssignment = task.studentAssignments.find(
        a => a.student.toString() === studentId
      )
      
      if (!studentAssignment) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not assigned to this task' 
        })
      }
      
      questions = studentAssignment.personalizedQuestions || []
    } else {
      // Single-student task
      if (req.user.id !== task.student.toString() && !['Faculty', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
      
      questions = task.metadata?.generatedMCQs?.questions || []
    }

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions found' })
    }

    // Filter to MCQ-only questions for scoring.
    // Coding and Short Answer questions are graded via their own dedicated routes
    // and must not be counted against the student's MCQ score.
    const mcqQuestions = questions.filter(q => !q.questionType || q.questionType === 'MCQ')
    if (mcqQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This task has no MCQ questions. Use the coding/short-answer submission instead.'
      })
    }

    // Calculate results
    let correctAnswers = 0
    let totalMarks = 0
    let obtainedMarks = 0
    const detailedResults = []
    const coWiseResults = {}

    mcqQuestions.forEach((q, index) => {
      const questionId = q.id || 'q_' + (index + 1)
      const studentAnswer = answers[questionId]
      const correctAnswer = q.correctAnswer
      const marks = q.marks || 1
      const courseOutcome = q.courseOutcome || 'General'
      
      totalMarks += marks
      
      const isCorrect = studentAnswer === correctAnswer || 
                       studentAnswer === q.options[correctAnswer]
      
      if (isCorrect) {
        correctAnswers++
        obtainedMarks += marks
      }

      // Track CO-wise performance
      if (!coWiseResults[courseOutcome]) {
        coWiseResults[courseOutcome] = {
          totalQuestions: 0,
          correctAnswers: 0,
          totalMarks: 0,
          obtainedMarks: 0
        }
      }
      coWiseResults[courseOutcome].totalQuestions++
      coWiseResults[courseOutcome].totalMarks += marks
      if (isCorrect) {
        coWiseResults[courseOutcome].correctAnswers++
        coWiseResults[courseOutcome].obtainedMarks += marks
      }

      detailedResults.push({
        questionId,
        question: q.question,
        studentAnswer,
        correctAnswer,
        isCorrect,
        marks,
        marksObtained: isCorrect ? marks : 0,
        explanation: q.explanation,
        courseOutcome
      })
    })

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
    const passed = percentage >= 70
    const maxAttempts = task.metadata?.teacherSettings?.maxAttempts || 3

    // Prepare score entry
    const scoreEntry = {
      attemptNumber: 0, // Will be set below
      score: percentage,
      percentage,
      timestamp: new Date(),
      totalQuestions: mcqQuestions.length,
      correctAnswers,
      totalMarks,
      obtainedMarks,
      timeTaken,
      passed,
      detailedResults,
      coWiseResults
    }

    if (isMultiStudent) {
      // Update the specific student's assignment
      if (!studentAssignment.scores) studentAssignment.scores = []
      scoreEntry.attemptNumber = studentAssignment.scores.length + 1
      studentAssignment.scores.push(scoreEntry)
      studentAssignment.attemptCount = (studentAssignment.attemptCount || 0) + 1
      
      if (passed) {
        studentAssignment.status = 'Completed'
      } else {
        studentAssignment.status = 'In Progress'
      }
      
      // Update overall task status if all students completed
      const allCompleted = task.studentAssignments.every(
        a => a.status === 'Completed'
      )
      if (allCompleted) {
        task.status = 'Completed'
        task.completedAt = new Date()
        task.progressPercentage = 100
      }
      
      await task.save()
      
      console.log(`✅ Student ${studentId} submitted MCQ: ${percentage.toFixed(1)}% (${correctAnswers}/${questions.length})`)
      console.log(`   Attempt: ${scoreEntry.attemptNumber}/${maxAttempts}`)
      console.log(`   Status: ${passed ? 'PASSED' : 'FAILED'}`)
      
    } else {
      // Single-student task - use old logic
      if (!task.metadata.mcqScores) task.metadata.mcqScores = []
      scoreEntry.attemptNumber = task.metadata.mcqScores.length + 1
      task.metadata.mcqScores.push(scoreEntry)

      if (passed) {
        task.status = 'Completed'
        task.completedAt = new Date()
        task.progressPercentage = 100
      } else {
        task.status = 'In Progress'
        task.progressPercentage = Math.min(90, task.progressPercentage + 20)
      }

      if (timeTaken) {
        task.metadata.studyTimeCompleted = (task.metadata.studyTimeCompleted || 0) + timeTaken
      }
      
      await task.save()
    }

    const updatedTask = await ImprovementTask.findById(taskId)
      .populate('student', 'name email rollNumber')
      .populate('studentAssignments.student', 'name email rollNumber')
      .populate('subject', 'name code credits')
      .populate('assignedBy', 'name email')

    res.json({
      success: true,
      data: updatedTask,
      results: {
        attemptNumber: scoreEntry.attemptNumber,
        totalQuestions: mcqQuestions.length,
        correctAnswers,
        totalMarks,
        obtainedMarks,
        percentage,
        passed,
        timeTaken,
        remainingAttempts: maxAttempts - scoreEntry.attemptNumber,
        detailedResults,
        coWiseResults
      },
      message: passed 
        ? `Congratulations! You passed with ${percentage.toFixed(1)}%` 
        : `Keep trying! You scored ${percentage.toFixed(1)}%. Minimum required: 70%`
    })
  } catch (error) {
    console.error('Error submitting MCQ quiz:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    })
  }
})

// Get all tasks created by faculty (for faculty dashboard)
router.get('/faculty/my-tasks', protect, async (req, res) => {
  try {
    // Verify faculty or admin role
    if (!['Faculty', 'Admin', 'faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Faculty or Admin role required.'
      })
    }

    const tasks = await ImprovementTask.find({
      assignedBy: req.user.id,
      taskType: { $in: ['CO_IMPROVEMENT', 'CO_ASSESSMENT'] }
    })
    .populate('student', 'name email rollNumber')
    .populate('studentAssignments.student', 'name email rollNumber') // NEW: Populate multi-student assignments
    .populate('subject', 'name code credits')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 })

    // Transform tasks to show multi-student info
    const transformedTasks = tasks.map(task => {
      const taskObj = task.toObject()
      
      // For multi-student tasks (has studentAssignments array)
      if (taskObj.studentAssignments && taskObj.studentAssignments.length > 0) {
        return {
          ...taskObj,
          isMultiStudent: true,
          assignedStudentCount: taskObj.studentAssignments.length,
          assignedStudents: taskObj.studentAssignments.map(a => ({
            student: a.student,
            weakCOs: a.weakCOs.map(co => co.courseOutcome),
            questionsCount: a.personalizedQuestions.length,
            totalMarks: a.totalMarks,
            status: a.status,
            attemptCount: a.attemptCount,
            latestScore: a.scores.length > 0 ? a.scores[a.scores.length - 1].percentage : null
          }))
        }
      }
      
      // For single-student tasks
      return {
        ...taskObj,
        isMultiStudent: false,
        assignedStudentCount: 1
      }
    })

    // Calculate statistics (count multi-student tasks properly)
    const totalStudents = new Set()
    transformedTasks.forEach(task => {
      if (task.isMultiStudent) {
        task.assignedStudents.forEach(a => totalStudents.add(a.student._id.toString()))
      } else if (task.student) {
        totalStudents.add(task.student._id.toString())
      }
    })

    const stats = {
      totalTasks: transformedTasks.length,
      assessmentTasks: transformedTasks.filter(t => t.taskType === 'CO_ASSESSMENT').length,
      improvementTasks: transformedTasks.filter(t => t.taskType === 'CO_IMPROVEMENT').length,
      completedTasks: transformedTasks.filter(t => t.status === 'Completed').length,
      activeTasks: transformedTasks.filter(t => ['Assigned', 'In Progress'].includes(t.status)).length,
      averageProgress: transformedTasks.length > 0 ? transformedTasks.reduce((sum, t) => sum + (t.progressPercentage || 0), 0) / transformedTasks.length : 0,
      totalStudents: totalStudents.size
    }

    res.json({
      success: true,
      count: transformedTasks.length,
      data: transformedTasks,
      stats
    })
  } catch (error) {
    console.error('Error fetching faculty tasks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty tasks',
      error: error.message
    })
  }
})

// ─── Coding Question: Submit code and run test cases ──────────────────────────
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

function executeCode(code, language, input) {
  const tmpDir = os.tmpdir()
  const ext = { Python: 'py', JavaScript: 'js', Java: 'java', 'C++': 'cpp', C: 'c' }[language] || 'py'
  const fileName = `learnaid_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const filePath = path.join(tmpDir, fileName)
  try {
    fs.writeFileSync(filePath, code, 'utf8')
    let result
    const opts = { input: input || '', timeout: 5000, encoding: 'utf8' }
    if (language === 'Python') {
      result = spawnSync('python', [filePath], opts)
      if (result.error?.code === 'ENOENT') result = spawnSync('python3', [filePath], opts)
    } else if (language === 'JavaScript') {
      result = spawnSync('node', [filePath], opts)
    } else if (language === 'Java') {
      const javaFile = path.join(tmpDir, 'Solution.java')
      fs.writeFileSync(javaFile, code, 'utf8')
      const comp = spawnSync('javac', [javaFile], { timeout: 10000, encoding: 'utf8', cwd: tmpDir })
      if (comp.status !== 0) return { stdout: '', stderr: comp.stderr || 'Compilation error', timedOut: false }
      result = spawnSync('java', ['-cp', tmpDir, 'Solution'], opts)
    } else {
      return { stdout: '', stderr: `Language '${language}' not supported yet`, timedOut: false }
    }
    return { stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim(), timedOut: result.status === null }
  } catch (err) {
    return { stdout: '', stderr: err.message, timedOut: false }
  } finally {
    try { fs.unlinkSync(filePath) } catch (_) {}
  }
}

router.post('/:taskId/submit-coding', protect, async (req, res) => {
  try {
    const { taskId } = req.params
    const { questionId, code, language = 'Python' } = req.body
    if (!code || !questionId) return res.status(400).json({ success: false, message: 'code and questionId are required' })

    const task = await ImprovementTask.findById(taskId)
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

    const isOwner = task.student?.toString() === req.user.id ||
      (task.studentAssignments || []).some(a => a.student?.toString() === req.user.id)
    if (!isOwner && !['Faculty', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const codingQ = (task.metadata?.codingQuestions || []).find(q => q.id === questionId)
    if (!codingQ) return res.status(404).json({ success: false, message: 'Coding question not found' })

    const testCases = codingQ.testCases || []
    const results = testCases.map((tc, idx) => {
      const { stdout, stderr, timedOut } = executeCode(code, language, tc.input || '')
      const expected = (tc.expectedOutput || '').trim()
      const actual = (stdout || '').trim()
      const passed = !timedOut && !stderr && actual === expected
      return {
        testCase: idx + 1,
        passed,
        input: tc.isHidden ? '(hidden)' : (tc.input || ''),
        expectedOutput: tc.isHidden ? '(hidden)' : expected,
        yourOutput: tc.isHidden ? (passed ? '✓ Correct' : '✗ Wrong') : actual,
        marks: passed ? (tc.marks || 2) : 0,
        error: timedOut ? 'Time limit exceeded (5s)' : (stderr || null),
        isHidden: !!tc.isHidden
      }
    })

    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    const marksAwarded = results.reduce((s, r) => s + r.marks, 0)
    const allPassed = passedCount === totalCount

    if (!task.metadata.codingSubmissions) task.metadata.codingSubmissions = []
    // Remove previous submission for same question (keep latest only)
    task.metadata.codingSubmissions = task.metadata.codingSubmissions.filter(s => s.questionId !== questionId)
    task.metadata.codingSubmissions.push({ questionId, code, language, timestamp: new Date(), testCasesPassed: passedCount, testCasesTotal: totalCount, marksAwarded, allPassed })

    if (allPassed) {
      task.progressPercentage = Math.min((task.progressPercentage || 0) + 50, 100)
      if (task.progressPercentage >= 100) { task.status = 'Completed'; task.completedAt = new Date() }
    }

    task.markModified('metadata')
    await task.save()

    return res.json({
      success: true, allPassed, passedCount, totalCount, marksAwarded,
      totalMarks: codingQ.marks,
      results,
      message: allPassed ? `🎉 All ${totalCount} test cases passed! ${marksAwarded} marks awarded.` : `${passedCount}/${totalCount} test cases passed. Keep trying!`
    })
  } catch (error) {
    console.error('Error in submit-coding:', error)
    res.status(500).json({ success: false, message: 'Code execution failed', error: error.message })
  }
})

module.exports = router
