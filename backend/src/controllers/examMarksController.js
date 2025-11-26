const ExamMarks = require('../models/ExamMarks');
const CIAExam = require('../models/CIAExam');
const ExamQuestion = require('../models/ExamQuestion');
const User = require('../models/User');
const StudentPerformance = require('../models/StudentPerformance');
const TaskAssignment = require('../models/TaskAssignment');
const QuestionWiseMarks = require('../models/QuestionWiseMarks');
const { validationResult } = require('express-validator');

/**
 * @desc    Enter marks for a student in an exam
 * @route   POST /api/marks
 * @access  Private/Faculty
 */
exports.enterMarks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { exam, student, questionMarks, remarks } = req.body;

    // Verify exam exists
    const examExists = await CIAExam.findById(exam).populate('course');
    if (!examExists) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && examExists.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to enter marks for this exam'
      });
    }

    // Verify student exists
    const studentExists = await User.findById(student);
    if (!studentExists || studentExists.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if marks already entered
    const existingMarks = await ExamMarks.findOne({ exam, student });
    if (existingMarks) {
      return res.status(400).json({
        success: false,
        message: 'Marks already entered for this student. Use update endpoint to modify.'
      });
    }

    // Validate question marks
    const validatedQuestionMarks = [];
    let totalObtained = 0;

    for (const qm of questionMarks) {
      const question = await ExamQuestion.findById(qm.question).populate('chapter');
      if (!question) {
        return res.status(404).json({
          success: false,
          message: `Question ${qm.question} not found`
        });
      }

      if (qm.marksObtained > question.marks) {
        return res.status(400).json({
          success: false,
          message: `Marks obtained (${qm.marksObtained}) cannot exceed question marks (${question.marks}) for question ${question.questionNumber}`
        });
      }

      validatedQuestionMarks.push({
        question: qm.question,
        chapter: question.chapter._id,
        marksObtained: qm.marksObtained,
        maxMarks: question.marks
      });

      totalObtained += qm.marksObtained;
    }

    // Create marks entry
    const marksEntry = await ExamMarks.create({
      exam,
      student,
      questionMarks: validatedQuestionMarks,
      totalMarks: totalObtained,
      remarks: remarks || '',
      enteredBy: req.user.id
    });

    // Populate references
    await marksEntry.populate([
      { path: 'exam', select: 'title examType totalMarks passingMarks' },
      { path: 'student', select: 'name rollNumber email' },
      { path: 'questionMarks.question', select: 'questionNumber questionText' },
      { path: 'questionMarks.chapter', select: 'title chapterNumber' }
    ]);

    // ✨ NEW: Create QuestionWiseMarks entries for CO analysis
    await createQuestionWiseMarksEntries(marksEntry, examExists);

    // Auto-update student performance
    await updateStudentPerformance(student, examExists.course._id, examExists.subject);

    // Auto-generate tasks if performance is weak (includes immediate CO analysis)
    await checkAndGenerateTasks(marksEntry, examExists);

    res.status(201).json({
      success: true,
      message: 'Marks entered successfully',
      data: marksEntry
    });
  } catch (error) {
    console.error('Enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error entering marks',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk enter marks for multiple students
 * @route   POST /api/marks/bulk
 * @access  Private/Faculty
 */
exports.bulkEnterMarks = async (req, res, next) => {
  try {
    const { exam, marksData } = req.body;

    if (!exam || !marksData || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and marks data array are required'
      });
    }

    // Verify exam exists
    const examExists = await CIAExam.findById(exam).populate('course');
    if (!examExists) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && examExists.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to enter marks for this exam'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < marksData.length; i++) {
      const { student, questionMarks, remarks } = marksData[i];

      try {
        // Check if marks already entered
        const existingMarks = await ExamMarks.findOne({ exam, student });
        if (existingMarks) {
          errors.push(`Student ${i + 1}: Marks already entered`);
          continue;
        }

        // Validate and process question marks
        const validatedQuestionMarks = [];
        let totalObtained = 0;

        for (const qm of questionMarks) {
          const question = await ExamQuestion.findById(qm.question).populate('chapter');
          if (!question) {
            errors.push(`Student ${i + 1}: Question ${qm.question} not found`);
            continue;
          }

          validatedQuestionMarks.push({
            question: qm.question,
            chapter: question.chapter._id,
            marksObtained: qm.marksObtained,
            maxMarks: question.marks
          });

          totalObtained += qm.marksObtained;
        }

        // Create marks entry
        const marksEntry = await ExamMarks.create({
          exam,
          student,
          questionMarks: validatedQuestionMarks,
          totalMarks: totalObtained,
          remarks: remarks || '',
          enteredBy: req.user.id
        });

        results.push(marksEntry);

        // ✨ NEW: Create QuestionWiseMarks entries for CO analysis
        await createQuestionWiseMarksEntries(marksEntry, examExists);

        // Auto-update student performance
        await updateStudentPerformance(student, examExists.course._id, examExists.subject);

        // Auto-generate tasks if needed (includes immediate CO analysis)
        await checkAndGenerateTasks(marksEntry, examExists);

      } catch (error) {
        errors.push(`Student ${i + 1}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Marks entered for ${results.length} students`,
      successCount: results.length,
      errorCount: errors.length,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error entering marks',
      error: error.message
    });
  }
};

/**
 * @desc    Update marks for a student
 * @route   PUT /api/marks/:id
 * @access  Private/Faculty
 */
exports.updateMarks = async (req, res, next) => {
  try {
    let marksEntry = await ExamMarks.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: { path: 'course' }
      });

    if (!marksEntry) {
      return res.status(404).json({
        success: false,
        message: 'Marks entry not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && marksEntry.exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update marks for this exam'
      });
    }

    const { questionMarks, remarks } = req.body;

    // Validate and recalculate marks if questionMarks provided
    if (questionMarks) {
      const validatedQuestionMarks = [];
      let totalObtained = 0;

      for (const qm of questionMarks) {
        const question = await ExamQuestion.findById(qm.question).populate('chapter');
        if (!question) {
          return res.status(404).json({
            success: false,
            message: `Question ${qm.question} not found`
          });
        }

        if (qm.marksObtained > question.marks) {
          return res.status(400).json({
            success: false,
            message: `Marks obtained cannot exceed question marks for question ${question.questionNumber}`
          });
        }

        validatedQuestionMarks.push({
          question: qm.question,
          chapter: question.chapter._id,
          marksObtained: qm.marksObtained,
          maxMarks: question.marks
        });

        totalObtained += qm.marksObtained;
      }

      marksEntry.questionMarks = validatedQuestionMarks;
      marksEntry.totalMarks = totalObtained;
    }

    if (remarks !== undefined) {
      marksEntry.remarks = remarks;
    }

    marksEntry.updatedBy = req.user.id;
    await marksEntry.save();

    await marksEntry.populate([
      { path: 'exam', select: 'title examType totalMarks passingMarks' },
      { path: 'student', select: 'name rollNumber email' },
      { path: 'questionMarks.question', select: 'questionNumber questionText' },
      { path: 'questionMarks.chapter', select: 'title chapterNumber' }
    ]);

    // Update student performance
    await updateStudentPerformance(marksEntry.student, marksEntry.exam.course, marksEntry.exam.subject);

    res.status(200).json({
      success: true,
      message: 'Marks updated successfully',
      data: marksEntry
    });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating marks',
      error: error.message
    });
  }
};

/**
 * @desc    Get marks by student
 * @route   GET /api/marks/student/:studentId
 * @access  Private
 */
exports.getMarksByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { exam, course } = req.query;

    const filter = { student: studentId };
    if (exam) filter.exam = exam;

    let marks = await ExamMarks.find(filter)
      .populate({
        path: 'exam',
        select: 'title examType totalMarks passingMarks scheduledDate course',
        populate: { path: 'course', select: 'name code' }
      })
      .populate('questionMarks.question', 'questionNumber questionText marks')
      .populate('questionMarks.chapter', 'title chapterNumber')
      .sort({ createdAt: -1 });

    if (course) {
      marks = marks.filter(m => m.exam.course._id.toString() === course);
    }

    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks
    });
  } catch (error) {
    console.error('Get marks by student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
};

/**
 * @desc    Get marks by exam
 * @route   GET /api/marks/exam/:examId
 * @access  Private/Faculty
 */
exports.getMarksByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await CIAExam.findById(examId).populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view marks for this exam'
      });
    }

    const marks = await ExamMarks.find({ exam: examId })
      .populate('student', 'name rollNumber email department')
      .populate('questionMarks.question', 'questionNumber questionText marks')
      .populate('questionMarks.chapter', 'title chapterNumber')
      .sort({ 'student.rollNumber': 1 });

    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks
    });
  } catch (error) {
    console.error('Get marks by exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
};

/**
 * @desc    Get chapter-wise performance for an exam (CRITICAL AUTO-CALCULATION)
 * @route   GET /api/marks/exam/:examId/chapter-performance
 * @access  Private/Faculty
 */
exports.getChapterWisePerformance = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await CIAExam.findById(examId).populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this exam'
      });
    }

    const performance = await ExamMarks.getChapterWisePerformance(examId);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get chapter-wise performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter-wise performance',
      error: error.message
    });
  }
};

/**
 * @desc    Get weak students by chapter
 * @route   GET /api/marks/exam/:examId/weak-students
 * @access  Private/Faculty
 */
exports.getWeakStudentsByChapter = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { threshold } = req.query;

    const exam = await CIAExam.findById(examId).populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this exam'
      });
    }

    const weakStudents = await ExamMarks.getWeakStudentsByChapter(examId, threshold ? parseFloat(threshold) : 50);

    res.status(200).json({
      success: true,
      data: weakStudents
    });
  } catch (error) {
    console.error('Get weak students by chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weak students',
      error: error.message
    });
  }
};

/**
 * @desc    Get overall exam performance
 * @route   GET /api/marks/exam/:examId/performance
 * @access  Private/Faculty
 */
exports.getExamPerformance = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await CIAExam.findById(examId).populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view performance for this exam'
      });
    }

    const performance = await ExamMarks.getExamPerformance(examId);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get exam performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam performance',
      error: error.message
    });
  }
};

/**
 * @desc    Delete marks entry
 * @route   DELETE /api/marks/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteMarks = async (req, res, next) => {
  try {
    const marksEntry = await ExamMarks.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: { path: 'course' }
      });

    if (!marksEntry) {
      return res.status(404).json({
        success: false,
        message: 'Marks entry not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && marksEntry.exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete marks for this exam'
      });
    }

    await marksEntry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Marks deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting marks',
      error: error.message
    });
  }
};

// Helper function to update student performance
async function updateStudentPerformance(studentId, courseId, subjectId) {
  try {
    // Find or create student performance record
    let performance = await StudentPerformance.findOne({
      student: studentId,
      course: courseId,
      subject: subjectId
    });

    if (!performance) {
      performance = await StudentPerformance.create({
        student: studentId,
        course: courseId,
        subject: subjectId,
        overallPerformance: 0,
        chapterPerformance: []
      });
    }

    // Recalculate overall metrics
    await performance.recalculateOverallMetrics();
  } catch (error) {
    console.error('Update student performance error:', error);
  }
}

// Helper function to check and generate tasks for weak performance + trigger CO analysis
async function checkAndGenerateTasks(marksEntry, exam) {
  try {
    const weakPercentage = (marksEntry.totalMarks / exam.totalMarks) * 100;

    // ✨ NEW: Trigger immediate CO analysis after CIA marks entry
    console.log(`🎯 Triggering CO analysis for student ${marksEntry.student} after ${exam.title} marks entry`);
    
    try {
      const { analyzeCOPerformanceAndAssignTasks } = require('./coPerformanceController');
      
      // Create a mock request object for CO analysis
      const mockReq = {
        body: {
          studentId: marksEntry.student.toString(),
          subjectId: exam.subject.toString(),
          academicYear: exam.academicYear || '2024-2025',
          examType: exam.examType, // Include exam type for filtering
          threshold: 50
        },
        user: { id: exam.createdBy } // Use exam creator as the assigner
      };

      // Mock response object to capture results
      let coAnalysisResult = null;
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            coAnalysisResult = data;
            console.log(`📊 CO Analysis completed for ${exam.title}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
            if (data.success && data.data) {
              console.log(`   - Total COs: ${data.data.totalCOs}`);
              console.log(`   - COs below threshold: ${data.data.notAttainedCOs}`);
              console.log(`   - Tasks assigned: ${data.data.tasksAssigned.filter(t => t.status === 'assigned').length}`);
            }
            return data;
          }
        })
      };

      // Execute CO analysis
      await analyzeCOPerformanceAndAssignTasks(mockReq, mockRes);
      
    } catch (coError) {
      console.error('❌ CO Analysis failed during CIA marks entry:', coError.message);
      // Continue with regular task generation as fallback
    }

    // 🔄 EXISTING: Legacy task generation for chapter-wise weak performance (as backup)
    if (weakPercentage < 50) {
      console.log(`📝 Creating legacy improvement tasks for overall weak performance (${weakPercentage.toFixed(1)}%)`);
      
      // Get weak chapters
      const weakChapters = marksEntry.questionMarks
        .filter(qm => (qm.marksObtained / qm.maxMarks) * 100 < 50)
        .map(qm => qm.chapter);

      // Remove duplicates
      const uniqueWeakChapters = [...new Set(weakChapters.map(c => c.toString()))];

      // Generate task for each weak chapter (only if CO analysis didn't already create tasks)
      for (const chapterId of uniqueWeakChapters) {
        // Check if CO analysis already created a task for this area
        const existingCOTask = await TaskAssignment.findOne({
          student: marksEntry.student,
          subject: exam.subject,
          taskType: 'CO_IMPROVEMENT',
          status: { $in: ['Assigned', 'In Progress'] },
          createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Created in last 5 minutes
        });

        if (!existingCOTask) {
          await TaskAssignment.create({
            student: marksEntry.student,
            assignedBy: exam.createdBy,
            course: exam.course._id,
            subject: exam.subject,
            chapters: [chapterId],
            title: `Chapter Practice Task - ${exam.title}`,
            description: `Based on your performance in ${exam.title}, practice questions from this chapter to improve understanding`,
            taskType: 'MCQ Practice',
            generationReason: 'Poor CIA Performance',
            triggerExam: exam._id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            priority: weakPercentage < 40 ? 'High' : 'Medium',
            autoGenerated: true
          });
          console.log(`✅ Created legacy chapter task for weak chapter performance`);
        } else {
          console.log(`⚠️  Skipping legacy task - CO analysis already created improvement tasks`);
        }
      }
    } else {
      console.log(`✅ Good performance (${weakPercentage.toFixed(1)}%) - no legacy tasks needed`);
    }

  } catch (error) {
    console.error('❌ Error in checkAndGenerateTasks:', error);
  }
}

// Helper function to create QuestionWiseMarks entries for CO analysis
async function createQuestionWiseMarksEntries(marksEntry, exam) {
  try {
    console.log(`📝 Creating QuestionWiseMarks entries for CO analysis...`);
    
    // Get all questions for this exam with their CO mappings
    const examQuestions = await ExamQuestion.find({ exam: exam._id })
      .populate('chapter', 'title chapterNumber')
      .sort({ questionNumber: 1 });
    
    if (!examQuestions || examQuestions.length === 0) {
      console.log('⚠️  No exam questions found - cannot create QuestionWiseMarks');
      return;
    }

    const questionWiseMarksEntries = [];

    // Create QuestionWiseMarks entry for each question that has marks
    for (const questionMark of marksEntry.questionMarks) {
      const examQuestion = examQuestions.find(q => q._id.toString() === questionMark.question.toString());
      
      if (!examQuestion) {
        console.log(`⚠️  Question ${questionMark.question} not found in exam questions`);
        continue;
      }

      // Determine CO based on question number and distribution
      // Using the model exam structure: 10×2mark + 5×16mark = 15 questions across 5 COs
      const courseOutcome = determineCourseOutcome(examQuestion.questionNumber);
      
      const questionWiseMarkData = {
        student: marksEntry.student,
        subject: exam.subject,
        exam: exam._id,
        examType: exam.examType,
        questionNumber: examQuestion.questionNumber,
        questionText: examQuestion.questionText || `Question ${examQuestion.questionNumber}`,
        marksObtained: questionMark.marksObtained,
        maxMarks: questionMark.maxMarks,
        courseOutcome,
        chapter: questionMark.chapter,
        difficulty: examQuestion.difficulty || 'medium',
        bloomsLevel: examQuestion.bloomsLevel || 'understand',
        academicYear: exam.academicYear || '2024-2025',
        semester: exam.semester || 'odd'
      };

      questionWiseMarksEntries.push(questionWiseMarkData);
    }

    // Bulk create QuestionWiseMarks entries
    if (questionWiseMarksEntries.length > 0) {
      await QuestionWiseMarks.insertMany(questionWiseMarksEntries);
      console.log(`✅ Created ${questionWiseMarksEntries.length} QuestionWiseMarks entries for CO analysis`);
      
      // Log CO distribution for verification
      const coDistribution = {};
      questionWiseMarksEntries.forEach(entry => {
        if (!coDistribution[entry.courseOutcome]) {
          coDistribution[entry.courseOutcome] = { questions: 0, totalMarks: 0, obtainedMarks: 0 };
        }
        coDistribution[entry.courseOutcome].questions++;
        coDistribution[entry.courseOutcome].totalMarks += entry.maxMarks;
        coDistribution[entry.courseOutcome].obtainedMarks += entry.marksObtained;
      });
      
      console.log('📊 CO Distribution created:', coDistribution);
    } else {
      console.log('❌ No QuestionWiseMarks entries created');
    }

  } catch (error) {
    console.error('❌ Error creating QuestionWiseMarks entries:', error);
  }
}

// Helper function to determine Course Outcome based on question number
function determineCourseOutcome(questionNumber) {
  // Model exam structure: 10×2mark + 5×16mark = 15 questions
  // Distribution: 2×2mark + 1×16mark per CO = 3 questions per CO
  // CO1: Questions 1-3, CO2: Questions 4-6, CO3: Questions 7-9, CO4: Questions 10-12, CO5: Questions 13-15
  
  if (questionNumber >= 1 && questionNumber <= 3) return 'CO1';
  if (questionNumber >= 4 && questionNumber <= 6) return 'CO2';
  if (questionNumber >= 7 && questionNumber <= 9) return 'CO3';
  if (questionNumber >= 10 && questionNumber <= 12) return 'CO4';
  if (questionNumber >= 13 && questionNumber <= 15) return 'CO5';
  
  // For exams with different structures, cycle through COs
  const coIndex = ((questionNumber - 1) % 5) + 1;
  return `CO${coIndex}`;
}

module.exports = exports;
