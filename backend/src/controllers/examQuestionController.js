const ExamQuestion = require('../models/ExamQuestion');
const CIAExam = require('../models/CIAExam');
const Chapter = require('../models/Chapter');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new exam question
 * @route   POST /api/questions
 * @access  Private/Faculty
 */
exports.createQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      exam,
      chapter,
      questionNumber,
      questionText,
      questionType,
      marks,
      options,
      correctAnswer,
      difficulty,
      bloomLevel,
      keywords
    } = req.body;

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
        message: 'Not authorized to create question for this exam'
      });
    }

    // Verify chapter exists
    const chapterExists = await Chapter.findById(chapter);
    if (!chapterExists) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check if question number already exists for this exam
    const existingQuestion = await ExamQuestion.findOne({ exam, questionNumber });
    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Question number already exists for this exam'
      });
    }

    // Validate MCQ has options and correct answer
    if (questionType === 'MCQ') {
      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ must have at least 2 options'
        });
      }
      if (!correctAnswer) {
        return res.status(400).json({
          success: false,
          message: 'MCQ must have a correct answer'
        });
      }
    }

    // Create question
    const question = await ExamQuestion.create({
      exam,
      chapter,
      questionNumber,
      questionText,
      questionType,
      marks,
      options: options || [],
      correctAnswer,
      difficulty,
      bloomLevel,
      keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
      createdBy: req.user.id
    });

    // Populate references
    await question.populate([
      { path: 'exam', select: 'title examType' },
      { path: 'chapter', select: 'title chapterNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message
    });
  }
};

/**
 * @desc    Get all questions
 * @route   GET /api/questions
 * @access  Private
 */
exports.getQuestions = async (req, res, next) => {
  try {
    const { exam, chapter, questionType, difficulty } = req.query;

    const filter = {};
    if (exam) filter.exam = exam;
    if (chapter) filter.chapter = chapter;
    if (questionType) filter.questionType = questionType;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await ExamQuestion.find(filter)
      .populate('exam', 'title examType')
      .populate('chapter', 'title chapterNumber')
      .sort({ questionNumber: 1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
};

/**
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Private
 */
exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await ExamQuestion.findById(req.params.id)
      .populate({
        path: 'exam',
        select: 'title examType course',
        populate: {
          path: 'course',
          select: 'name code faculty'
        }
      })
      .populate('chapter', 'title chapterNumber')
      .populate('createdBy', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: error.message
    });
  }
};

/**
 * @desc    Get questions by exam
 * @route   GET /api/questions/exam/:examId
 * @access  Private
 */
exports.getQuestionsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await CIAExam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const questions = await ExamQuestion.find({ exam: examId })
      .populate('chapter', 'title chapterNumber')
      .sort({ questionNumber: 1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Get questions by exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
};

/**
 * @desc    Get questions by chapter
 * @route   GET /api/questions/chapter/:chapterId
 * @access  Private
 */
exports.getQuestionsByChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const questions = await ExamQuestion.find({ chapter: chapterId })
      .populate('exam', 'title examType scheduledDate')
      .sort({ questionNumber: 1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Get questions by chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
};

/**
 * @desc    Update question
 * @route   PUT /api/questions/:id
 * @access  Private/Faculty
 */
exports.updateQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let question = await ExamQuestion.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: {
          path: 'course'
        }
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && question.exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }

    // Cannot update question if exam is completed
    if (question.exam.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update question for completed exam'
      });
    }

    // If question number is being changed, check for duplicates
    if (req.body.questionNumber && req.body.questionNumber !== question.questionNumber) {
      const existingQuestion = await ExamQuestion.findOne({
        exam: question.exam._id,
        questionNumber: req.body.questionNumber,
        _id: { $ne: question._id }
      });

      if (existingQuestion) {
        return res.status(400).json({
          success: false,
          message: 'Question number already exists for this exam'
        });
      }
    }

    // Validate MCQ has options and correct answer
    if (req.body.questionType === 'MCQ' || question.questionType === 'MCQ') {
      const options = req.body.options || question.options;
      const correctAnswer = req.body.correctAnswer || question.correctAnswer;

      if (!options || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ must have at least 2 options'
        });
      }
      if (!correctAnswer) {
        return res.status(400).json({
          success: false,
          message: 'MCQ must have a correct answer'
        });
      }
    }

    // Update question
    req.body.updatedBy = req.user.id;
    question = await ExamQuestion.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'exam', select: 'title examType' },
      { path: 'chapter', select: 'title chapterNumber' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
};

/**
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await ExamQuestion.findById(req.params.id)
      .populate({
        path: 'exam',
        populate: {
          path: 'course'
        }
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && question.exam.course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }

    // Cannot delete question if marks have been entered
    const ExamMarks = require('../models/ExamMarks');
    const marksCount = await ExamMarks.countDocuments({
      exam: question.exam._id,
      'questionMarks.question': question._id
    });

    if (marksCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question with existing marks entries'
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk create questions
 * @route   POST /api/questions/bulk
 * @access  Private/Faculty
 */
exports.bulkCreateQuestions = async (req, res, next) => {
  try {
    const { exam, questions } = req.body;

    if (!exam || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and questions array are required'
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
        message: 'Not authorized to create questions for this exam'
      });
    }

    // Validate all questions
    const errors = [];
    const validQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Check chapter exists
      const chapterExists = await Chapter.findById(q.chapter);
      if (!chapterExists) {
        errors.push(`Question ${i + 1}: Chapter not found`);
        continue;
      }

      // Check question number uniqueness
      const existingQuestion = await ExamQuestion.findOne({
        exam,
        questionNumber: q.questionNumber
      });
      if (existingQuestion) {
        errors.push(`Question ${i + 1}: Question number ${q.questionNumber} already exists`);
        continue;
      }

      // Validate MCQ
      if (q.questionType === 'MCQ') {
        if (!q.options || q.options.length < 2) {
          errors.push(`Question ${i + 1}: MCQ must have at least 2 options`);
          continue;
        }
        if (!q.correctAnswer) {
          errors.push(`Question ${i + 1}: MCQ must have a correct answer`);
          continue;
        }
      }

      validQuestions.push({
        ...q,
        exam,
        createdBy: req.user.id
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors found',
        errors
      });
    }

    // Insert all questions
    const createdQuestions = await ExamQuestion.insertMany(validQuestions);

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questions created successfully`,
      count: createdQuestions.length,
      data: createdQuestions
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating questions',
      error: error.message
    });
  }
};

/**
 * @desc    Get chapter distribution for exam
 * @route   GET /api/questions/exam/:examId/chapter-distribution
 * @access  Private/Faculty
 */
exports.getChapterDistribution = async (req, res, next) => {
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
        message: 'Not authorized to view this exam'
      });
    }

    const distribution = await ExamQuestion.getChapterDistribution(examId);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get chapter distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter distribution',
      error: error.message
    });
  }
};

/**
 * @desc    Reorder questions
 * @route   PUT /api/questions/exam/:examId/reorder
 * @access  Private/Faculty
 */
exports.reorderQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { questionOrders } = req.body;

    if (!questionOrders || !Array.isArray(questionOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Question orders array is required'
      });
    }

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
        message: 'Not authorized to reorder questions for this exam'
      });
    }

    // Update question numbers
    const updatePromises = questionOrders.map(({ questionId, newQuestionNumber }) =>
      ExamQuestion.findByIdAndUpdate(
        questionId,
        { questionNumber: newQuestionNumber, updatedBy: req.user.id },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    const updatedQuestions = await ExamQuestion.find({ exam: examId })
      .populate('chapter', 'title chapterNumber')
      .sort({ questionNumber: 1 });

    res.status(200).json({
      success: true,
      message: 'Questions reordered successfully',
      data: updatedQuestions
    });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering questions',
      error: error.message
    });
  }
};
