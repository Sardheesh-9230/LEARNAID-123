const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  generateMCQs,
  getSubjectsForFaculty,
  getChaptersBySubject,
  getMaterialsByChapter
} = require('../controllers/mcqGeneratorV3');

/**
 * @route   GET /api/mcq-generator/subjects
 * @desc    Get all subjects for logged-in faculty
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/subjects',
  protect,
  authorize('Faculty', 'Admin'),
  getSubjectsForFaculty
);

/**
 * @route   GET /api/mcq-generator/subjects/:subjectId/chapters
 * @desc    Get all chapters for a subject
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/subjects/:subjectId/chapters',
  protect,
  authorize('Faculty', 'Admin'),
  [
    param('subjectId')
      .isMongoId()
      .withMessage('Invalid subject ID')
  ],
  getChaptersBySubject
);

/**
 * @route   GET /api/mcq-generator/chapters/:chapterId/materials
 * @desc    Get all PDF materials for a chapter
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/chapters/:chapterId/materials',
  protect,
  authorize('Faculty', 'Admin'),
  [
    param('chapterId')
      .isMongoId()
      .withMessage('Invalid chapter ID')
  ],
  getMaterialsByChapter
);

/**
 * @route   GET /api/mcq-generator/sessions/subject/:subjectId
 * @desc    Get all MCQ sessions for a subject
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/sessions/subject/:subjectId',
  protect,
  authorize('Faculty', 'Admin'),
  async (req, res) => {
    try {
      const { subjectId } = req.params;
      const MCQSession = require('../models/MCQSession');
      
      const sessions = await MCQSession.find({ 
        subject: subjectId 
      })
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error('Error fetching MCQ sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MCQ sessions'
      });
    }
  }
);

/**
 * @route   POST /api/mcq-generator/generate
 * @desc    Generate MCQs from PDF material using AI
 * @access  Private (Faculty, Admin)
 */
router.post(
  '/generate',
  protect,
  authorize('Faculty', 'Admin'),
  [
    body('materialId')
      .isMongoId()
      .withMessage('Valid material ID is required'),
    
    body('topics')
      .trim()
      .notEmpty()
      .withMessage('Topics are required')
      .isLength({ min: 3, max: 500 })
      .withMessage('Topics must be between 3 and 500 characters'),
    
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Number of questions must be between 1 and 50')
      .toInt(),
    
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard')
  ],
  generateMCQs
);

/**
 * @route   POST /api/mcq-generator/generate-from-materials
 * @desc    Generate MCQs from uploaded materials for CO improvement tasks
 * @access  Private (Faculty, Admin)
 */
router.post(
  '/generate-from-materials',
  protect,
  authorize('Faculty', 'Admin'),
  [
    body('subjectId')
      .isMongoId()
      .withMessage('Valid subject ID is required'),
    
    body('courseOutcome')
      .trim()
      .notEmpty()
      .withMessage('Course outcome is required'),
    
    body('topics')
      .optional()
      .isArray()
      .withMessage('Topics must be an array'),
    
    body('difficulty')
      .optional()
      .customSanitizer(value => value ? value.toLowerCase() : 'medium')
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),
    
    body('numberOfQuestions')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Number of questions must be between 1 and 50')
      .toInt()
  ],
  async (req, res) => {
    console.log('🚀 /generate-from-materials endpoint HIT');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User:', req.user ? req.user.id : 'No user');
    
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors in MCQ generation:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { 
        subjectId, 
        courseOutcome, 
        topics, 
        difficulty = 'medium', 
        numberOfQuestions = 10,
        threshold,
        currentPerformance,
        performanceGap
      } = req.body;
      
      console.log('🎯 MCQ Generation Request:', {
        subjectId,
        courseOutcome,
        topics,
        difficulty,
        numberOfQuestions
      });
      
      const Material = require('../models/Material');
      const Groq = require('groq-sdk');
      const pdf = require('pdf-parse');
      const fs = require('fs').promises;
      const path = require('path');
      
      // Find materials for this subject
      const materials = await Material.find({ 
        subject: subjectId,
        type: 'pdf'
      }).limit(5); // Get up to 5 materials
      
      if (!materials || materials.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No materials found for this subject. Please upload study materials first.'
        });
      }
      
      // Extract text from PDFs
      let combinedText = '';
      for (const material of materials) {
        try {
          const pdfPath = path.join(__dirname, '../../../uploads', material.filePath);
          const dataBuffer = await fs.readFile(pdfPath);
          const pdfData = await pdf(dataBuffer);
          combinedText += pdfData.text + '\\n\\n';
        } catch (error) {
          console.error(`Error reading PDF ${material.title}:`, error.message);
        }
      }
      
      // Limit text to avoid token limits (approximately 50k characters = ~12k tokens)
      if (combinedText.length > 50000) {
        combinedText = combinedText.substring(0, 50000);
      }
      
      if (!combinedText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract text from uploaded materials'
        });
      }
      
      // Generate MCQs using Groq AI
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      
      const topicsText = (topics && topics.length > 0) ? topics.join(', ') : 'all topics covered in the material';
      
      const prompt = `You are an expert educator creating assessment questions from study materials.

STUDENT PERFORMANCE CONTEXT:
- Course Outcome: ${courseOutcome}
- Current Performance: ${currentPerformance ? currentPerformance.toFixed(1) + '%' : 'Not specified'}
- Target Threshold: ${threshold ? threshold + '%' : 'Not specified'}
- Performance Gap: ${performanceGap ? performanceGap.toFixed(1) + '%' : 'identified gaps'}
- Focus Areas: ${topicsText}

TASK REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Number of Questions: ${numberOfQuestions}
- Generate questions from the ENTIRE study material provided below
- Questions should help improve from ${currentPerformance ? currentPerformance.toFixed(1) + '%' : 'current performance'} to ${threshold ? threshold + '%' : 'target performance'}

COMPLETE STUDY MATERIAL:
${combinedText}

Based on the complete study material above, generate exactly ${numberOfQuestions} multiple-choice questions (MCQs) that:
1. Cover important concepts from the ENTIRE material (not just specific topics)
2. Align with the course outcome: ${courseOutcome}
3. Are at ${difficulty} difficulty level
4. Test deep understanding of concepts from the material
5. Help bridge the performance gap of ${performanceGap ? performanceGap.toFixed(1) + '%' : 'identified gaps'}
6. Have 4 options (A, B, C, D) with exactly ONE correct answer
7. Include a brief explanation for the correct answer
8. Focus on ${topicsText} but include questions from other important concepts too

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "explanation text",
    "difficulty": "${difficulty}",
    "topic": "specific topic from weak topics",
    "bloomsLevel": "Remember/Understand/Apply/Analyze",
    "estimatedTime": 2
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 4096
      });
      
      const responseText = chatCompletion.choices[0]?.message?.content || '';
      
      // Parse JSON response
      let questions = [];
      try {
        // Try to extract JSON array from response
        const jsonMatch = responseText.match(/\\[\\s*{[\\s\\S]*}\\s*\\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          questions = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Error parsing Groq response:', parseError);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI-generated questions',
          rawResponse: responseText
        });
      }
      
      // Validate and format questions
      const formattedQuestions = questions.map((q, index) => ({
        id: index + 1,
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || difficulty,
        courseOutcome: courseOutcome,
        topic: q.topic || topics[0],
        bloomsLevel: q.bloomsLevel || 'Understand',
        estimatedTime: q.estimatedTime || 2
      }));
      
      const totalEstimatedTime = formattedQuestions.reduce((sum, q) => sum + q.estimatedTime, 0);
      
      res.json({
        success: true,
        questions: formattedQuestions,
        totalQuestions: formattedQuestions.length,
        estimatedTime: totalEstimatedTime,
        materialsUsed: materials.map(m => m.title).join(', ')
      });
      
    } catch (error) {
      console.error('Error generating MCQs from materials:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate MCQs'
      });
    }
  }
);

module.exports = router;
