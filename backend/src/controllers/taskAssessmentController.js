const Material = require('../models/Material');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const File = require('../models/File');
const TaskAssignment = require('../models/TaskAssignment');
const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Enhanced Vector Store for RAG
class EnhancedVectorStore {
  constructor() {
    this.documents = [];
  }

  addDocuments(chunks) {
    // Limit total documents to prevent memory overflow
    const maxDocs = 100;
    const limitedChunks = chunks.slice(0, maxDocs);
    
    this.documents = limitedChunks.map((chunk, index) => {
      try {
        return {
          id: index,
          content: chunk,
          keywords: this.extractKeywords(chunk),
          frequency: this.calculateFrequencyMap(chunk)
        };
      } catch (error) {
        console.error(`⚠️ Error processing chunk ${index}:`, error.message);
        return null;
      }
    }).filter(doc => doc !== null); // Remove failed chunks
    
    console.log(`📊 Vector store initialized with ${this.documents.length} documents`);
  }

  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 3 && !stopWords.has(word));
  }

  calculateFrequencyMap(text) {
    const keywords = this.extractKeywords(text);
    const freq = {};
    keywords.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
  }

  search(query, topK = 5) {
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    
    const scored = this.documents.map(doc => {
      let score = 0;
      queryKeywords.forEach(keyword => {
        if (doc.keywords.includes(keyword)) score += 2;
        if (doc.content.toLowerCase().includes(keyword)) score += 1;
        if (doc.frequency[keyword]) score += doc.frequency[keyword] * 0.5;
      });
      return { ...doc, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(doc => doc.score > 0)
      .map(doc => doc.content);
  }

  clear() {
    this.documents = [];
  }
}

// Helper: Extract text from PDF with memory optimization
async function extractTextFromPDF(filePath, maxSizeMB = 10) {
  try {
    // Check file size first
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      console.warn(`⚠️ PDF too large (${fileSizeMB.toFixed(2)}MB), limiting extraction`);
    }
    
    // Read file with size limit
    const dataBuffer = await fs.readFile(filePath, { 
      encoding: null,
      flag: 'r'
    });
    
    // Parse PDF with options to reduce memory usage
    const data = await pdf(dataBuffer, {
      max: 100, // Max pages to process
      version: 'v1.10.100'
    });
    
    if (data.text && data.text.trim().length > 0) {
      // Limit text size to prevent memory issues
      const maxChars = 50000; // 50K chars per PDF
      const text = data.text.length > maxChars 
        ? data.text.substring(0, maxChars)
        : data.text;
      
      console.log(`✅ Extracted ${text.length} characters from PDF (${fileSizeMB.toFixed(2)}MB)`);
      
      // Clear buffer to free memory
      data.text = null;
      
      return text;
    }
    
    throw new Error('No text content found in PDF');
  } catch (error) {
    console.error('❌ Error extracting PDF text:', error.message);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// Helper: Chunk text with memory optimization
function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;
  const maxChunks = 50; // Limit chunks per document
  
  // Clean text first
  const cleanedText = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII
    .trim();
  
  while (start < cleanedText.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, cleanedText.length);
    const chunk = cleanedText.slice(start, end).trim();
    
    if (chunk.length > 50) { // Only add meaningful chunks
      chunks.push(chunk);
    }
    
    start = end - overlap;
    
    // Safety break
    if (start >= cleanedText.length) break;
  }
  
  return chunks;
}

// Get materials for specific CO
exports.getMaterialsForCO = async (req, res) => {
  try {
    const { subjectId, coNumber } = req.params;
    
    console.log(`📚 Fetching materials for Subject: ${subjectId}, CO: ${coNumber}`);
    
    // Find chapters mapped to this CO
    const chapters = await Chapter.find({
      subject: subjectId,
      courseOutcome: `CO${coNumber}`
    });
    
    if (chapters.length === 0) {
      // Try to find materials directly mapped to the subject and CO
      const materials = await Material.find({
        subject: subjectId,
        type: { $in: ['PDF', 'Document', 'Lecture Notes'] }
      })
      .populate('chapter')
      .populate('file')
      .sort({ createdAt: -1 });
      
      // Filter materials that have actual files
      const materialsWithFiles = materials.filter(m => m.file || m.fileMetadata);
      
      return res.json({
        success: true,
        materials: materialsWithFiles,
        message: `Found ${materialsWithFiles.length} materials for CO${coNumber}`
      });
    }
    
    const chapterIds = chapters.map(c => c._id);
    
    // Find materials in these chapters
    const materials = await Material.find({
      chapter: { $in: chapterIds },
      type: { $in: ['PDF', 'Document', 'Lecture Notes'] }
    })
    .populate('chapter')
    .populate('file')
    .sort({ createdAt: -1 });
    
    // Filter materials that have actual files
    const materialsWithFiles = materials.filter(m => m.file || m.fileMetadata);
    
    console.log(`✅ Found ${materialsWithFiles.length} materials with files for CO${coNumber}`);
    
    res.json({
      success: true,
      materials: materialsWithFiles,
      chapters: chapters.map(c => ({ _id: c._id, title: c.title, chapterNumber: c.chapterNumber })),
      message: `Found ${materialsWithFiles.length} materials across ${chapters.length} chapters`
    });
    
  } catch (error) {
    console.error('❌ Error fetching CO materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
};

// Generate CO-specific questions from multiple materials
exports.generateCOSpecificQuestions = async (req, res) => {
  try {
    const {
      subjectId,
      courseOutcome,
      coNumber,
      materialIds,
      topics,
      numberOfQuestions,
      difficulty,
      marksPerQuestion
    } = req.body;
    
    console.log(`🎯 Generating ${numberOfQuestions} questions for ${courseOutcome}`);
    console.log(`📚 Materials:`, materialIds);
    console.log(`📝 Topics:`, topics);
    
    // Validate inputs
    if (!materialIds || materialIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one material must be selected'
      });
    }
    
    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one topic must be provided'
      });
    }
    
    // Fetch all materials
    const materials = await Material.find({
      _id: { $in: materialIds }
    }).populate('file');
    
    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No materials found'
      });
    }
    
    console.log(`📄 Processing ${materials.length} materials`);
    
    // Limit materials to process at once
    const maxMaterials = 3;
    const limitedMaterials = materials.slice(0, maxMaterials);
    
    if (materials.length > maxMaterials) {
      console.warn(`⚠️ Too many materials (${materials.length}), processing first ${maxMaterials}`);
    }
    
    // Extract text from PDFs with memory management
    const allTextChunks = [];
    const processedMaterials = [];
    
    for (const material of limitedMaterials) {
      try {
        // Check memory usage
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        
        if (heapUsedMB > 400) { // Stop if using > 400MB
          console.warn(`⚠️ Memory limit reached (${heapUsedMB.toFixed(2)}MB), stopping material processing`);
          break;
        }
        
        // Get file path
        let filePath = null;
        
        if (material.file) {
          const fileDoc = await File.findById(material.file);
          if (fileDoc && fileDoc.path && fsSync.existsSync(fileDoc.path)) {
            filePath = fileDoc.path;
          } else if (fileDoc) {
            const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
            const possiblePath = path.join(uploadsDir, fileDoc.filename);
            if (fsSync.existsSync(possiblePath)) {
              filePath = possiblePath;
            }
          }
        }
        
        if (!filePath && material.fileMetadata && material.fileMetadata.filename) {
          const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
          const possiblePath = path.join(uploadsDir, material.fileMetadata.filename);
          if (fsSync.existsSync(possiblePath)) {
            filePath = possiblePath;
          }
        }
        
        if (!filePath) {
          console.warn(`⚠️ Skipping material ${material.title} - no file found`);
          continue;
        }
        
        console.log(`📖 Extracting from: ${material.title}`);
        
        // Extract text with memory limit
        const textContent = await extractTextFromPDF(filePath, 10); // 10MB max per file
        
        if (textContent && textContent.trim().length > 100) {
          const chunks = chunkText(textContent);
          
          // Limit chunks per material
          const maxChunksPerMaterial = 30;
          const limitedChunks = chunks.slice(0, maxChunksPerMaterial);
          
          allTextChunks.push(...limitedChunks);
          processedMaterials.push({
            id: material._id,
            title: material.title,
            chunksAdded: limitedChunks.length
          });
          console.log(`  ✅ Added ${limitedChunks.length} chunks`);
          
          // Free memory
          textContent = null;
        }
      } catch (error) {
        console.error(`❌ Error processing material ${material.title}:`, error.message);
        // Continue with other materials instead of failing completely
      }
    }
    
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
      console.log('🧹 Memory cleanup triggered');
    }
    
    if (allTextChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from any of the provided materials'
      });
    }
    
    console.log(`📚 Total chunks collected: ${allTextChunks.length}`);
    
    if (allTextChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from any materials. Please check PDF files.'
      });
    }
    
    // Initialize vector store with memory-optimized chunks
    const vectorStore = new EnhancedVectorStore();
    vectorStore.addDocuments(allTextChunks);
    
    // Search for relevant chunks based on topics
    const topicsQuery = topics.join(' ');
    const searchLimit = Math.min(8, allTextChunks.length); // Reduced from 10
    const relevantChunks = vectorStore.search(topicsQuery, searchLimit);
    
    console.log(`🔍 Found ${relevantChunks.length} relevant chunks for topics`);
    
    if (relevantChunks.length === 0) {
      console.warn('⚠️ No relevant chunks found, using all available chunks');
      relevantChunks.push(...allTextChunks.slice(0, 5)); // Fallback to first 5 chunks
    }
    
    // Combine relevant content with size limit
    const maxContentLength = 4000; // Reduced from 6000
    let relevantContent = relevantChunks.join('\n\n');
    
    if (relevantContent.length > maxContentLength) {
      relevantContent = relevantContent.substring(0, maxContentLength);
      console.log(`✂️ Content trimmed to ${maxContentLength} characters`);
    }
    
    // Clear chunks to free memory
    allTextChunks.length = 0;
    vectorStore.clear();
    
    // Generate questions using Groq with optimized prompt
    const prompt = `You are an expert educator. Create ${numberOfQuestions} MCQ questions for ${courseOutcome}.

Topics: ${topics.join(', ')}
Difficulty: ${difficulty}

Content Reference:
${relevantContent}

Requirements:
- ${courseOutcome} alignment
- Each question: 4 options, ${marksPerQuestion} marks
- Clear, unambiguous questions
- Provide explanations

Return ONLY valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of the correct answer",
    "difficulty": "${difficulty}",
    "bloomsLevel": "remember/understand/apply/analyze/evaluate/create",
    "marks": ${marksPerQuestion},
    "topics": "${topics[0]}"
  }
]

CRITICAL: 
- correctAnswer must be the index (0-3) of the correct option
- Return ONLY the JSON array, no markdown, no additional text
- Ensure all ${numberOfQuestions} questions are included`;

    console.log('🤖 Calling Groq API with optimized parameters...');
    
    // Optimized Groq API call with smaller context
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Respond ONLY with valid JSON arrays.'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6, // Slightly lower for consistency
      max_tokens: 3000, // Reduced from 4000
      top_p: 0.9
    });
    
    const response = completion.choices[0]?.message?.content || '';
    console.log('📥 Received response from Groq');
    
    // Parse response
    let questions = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse question generation response',
        error: 'PARSE_ERROR'
      });
    }
    
    // Validate and normalize questions
    const validQuestions = questions.filter(q => {
      return q.question && 
             Array.isArray(q.options) && 
             q.options.length === 4 &&
             typeof q.correctAnswer === 'number' &&
             q.correctAnswer >= 0 &&
             q.correctAnswer <= 3;
    }).map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided',
      difficulty: q.difficulty || difficulty,
      bloomsLevel: q.bloomsLevel || 'understand',
      marks: marksPerQuestion,
      topics: q.topics || topics[0],
      courseOutcome,
      coNumber
    }));
    
    if (validQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No valid questions generated'
      });
    }
    
    console.log(`✅ Generated ${validQuestions.length} valid questions for ${courseOutcome}`);
    
    res.json({
      success: true,
      questions: validQuestions,
      metadata: {
        courseOutcome,
        coNumber,
        materialsProcessed: processedMaterials.length,
        totalChunks: allTextChunks.length,
        relevantChunks: relevantChunks.length,
        topics,
        difficulty,
        requestedQuestions: numberOfQuestions,
        generatedQuestions: validQuestions.length,
        generatedAt: new Date()
      },
      message: `Successfully generated ${validQuestions.length} questions for ${courseOutcome}`
    });
    
  } catch (error) {
    console.error('❌ Error generating CO-specific questions:', error);
    
    // Clear memory on error
    if (global.gc) {
      global.gc();
    }
    
    // Provide detailed error information
    const errorResponse = {
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    };
    
    // Specific error handling
    if (error.message.includes('heap')) {
      errorResponse.message = 'Memory limit reached. Try processing fewer materials or reduce PDF size.';
      errorResponse.suggestion = 'Use LLM-only mode or upload smaller PDF files';
    } else if (error.message.includes('PDF')) {
      errorResponse.message = 'Failed to process PDF files';
      errorResponse.suggestion = 'Ensure PDFs are not corrupted and contain readable text';
    } else if (error.message.includes('timeout')) {
      errorResponse.message = 'Request timeout. Try with fewer questions or materials.';
    }
    
    res.status(500).json(errorResponse);
  }
};

// Regenerate single question
exports.regenerateSingleQuestion = async (req, res) => {
  try {
    const {
      subjectId,
      courseOutcome,
      materialIds,
      topics,
      difficulty,
      marksPerQuestion,
      excludeQuestions
    } = req.body;
    
    console.log(`🔄 Regenerating single question for ${courseOutcome}`);
    
    // Similar logic as generateCOSpecificQuestions but for 1 question
    // and excluding previously generated questions
    
    const materials = await Material.find({
      _id: { $in: materialIds }
    }).populate('file');
    
    const allTextChunks = [];
    
    for (const material of materials) {
      try {
        let filePath = null;
        
        if (material.file) {
          const fileDoc = await File.findById(material.file);
          if (fileDoc && fileDoc.path && fsSync.existsSync(fileDoc.path)) {
            filePath = fileDoc.path;
          }
        }
        
        if (filePath) {
          const textContent = await extractTextFromPDF(filePath);
          if (textContent) {
            const chunks = chunkText(textContent);
            allTextChunks.push(...chunks);
          }
        }
      } catch (error) {
        console.error(`Error processing material:`, error.message);
      }
    }
    
    if (allTextChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from materials'
      });
    }
    
    const vectorStore = new EnhancedVectorStore();
    vectorStore.addDocuments(allTextChunks);
    
    const relevantChunks = vectorStore.search(topics.join(' '), 5);
    const relevantContent = relevantChunks.join('\n\n');
    
    const excludeText = excludeQuestions && excludeQuestions.length > 0
      ? `\n\nDo NOT generate these questions (they already exist):\n${excludeQuestions.join('\n')}`
      : '';
    
    const prompt = `You are an expert educator creating assessment questions for ${courseOutcome}.

Generate exactly 1 NEW multiple-choice question from this content:

Content:
${relevantContent.substring(0, 4000)}

Requirements:
- Course Outcome: ${courseOutcome}
- Topics: ${topics.join(', ')}
- Difficulty: ${difficulty}
- Marks: ${marksPerQuestion}
- 4 options (A, B, C, D)
- Clear explanation${excludeText}

Return ONLY a JSON object (not array):
{
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "Why this is correct",
  "difficulty": "${difficulty}",
  "bloomsLevel": "understand",
  "marks": ${marksPerQuestion},
  "topics": "${topics[0]}"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 1000,
    });
    
    const response = completion.choices[0]?.message?.content || '';
    
    let question;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        question = JSON.parse(jsonMatch[0]);
      } else {
        question = JSON.parse(response);
      }
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse question',
        error: 'PARSE_ERROR'
      });
    }
    
    res.json({
      success: true,
      question: {
        ...question,
        courseOutcome,
        marks: marksPerQuestion
      }
    });
    
  } catch (error) {
    console.error('❌ Error regenerating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate question',
      error: error.message
    });
  }
};

// Generate questions using LLM only (without materials)
exports.generateWithoutMaterials = async (req, res) => {
  try {
    const {
      subjectId,
      subjectName,
      courseOutcome,
      coNumber,
      topics,
      numberOfQuestions,
      difficulty,
      marksPerQuestion
    } = req.body;

    console.log(`🤖 Generating ${numberOfQuestions} LLM-only questions for ${courseOutcome}`);
    console.log(`📝 Topics: ${topics.join(', ')}`);
    console.log(`📊 Difficulty: ${difficulty}`);

    // Validate input
    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one topic must be provided'
      });
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 20) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 1 and 20'
      });
    }

    // Prepare comprehensive prompt for LLM
    const topicsList = topics.join(', ');
    const prompt = `You are an expert educator creating assessment questions for a college course.

**Subject**: ${subjectName}
**Course Outcome**: ${courseOutcome} (CO${coNumber})
**Topics**: ${topicsList}
**Difficulty Level**: ${difficulty}
**Number of Questions**: ${numberOfQuestions}
**Marks per Question**: ${marksPerQuestion}

Generate exactly ${numberOfQuestions} high-quality multiple-choice questions that:
1. Cover the specified topics comprehensively
2. Match the ${difficulty} difficulty level
3. Align with ${courseOutcome}
4. Include 4 distinct options each
5. Have clear, unambiguous correct answers
6. Provide educational explanations

**Format Requirements**:
- Each question must have exactly 4 unique options
- Options should be plausible and cover common misconceptions
- Explanations must be detailed and educational
- Mark the Bloom's taxonomy level (remember, understand, apply, analyze, evaluate, create)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Detailed explanation of why this is correct and others are wrong",
    "difficulty": "${difficulty}",
    "bloomsLevel": "apply",
    "topics": "${topics[0]}"
  }
]

Generate exactly ${numberOfQuestions} questions now:`;

    console.log('🔮 Calling Groq API for LLM-only generation...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in creating high-quality assessment questions. Always respond with valid JSON arrays only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4096,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    console.log('📥 Raw LLM response received:', rawResponse.substring(0, 200));

    // Parse response
    let questions;
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(rawResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse generated questions',
        error: 'PARSE_ERROR',
        rawResponse: rawResponse.substring(0, 500)
      });
    }

    // Validate questions
    const validQuestions = questions.filter(q => {
      return q.question && 
             q.options && 
             Array.isArray(q.options) && 
             q.options.length === 4 &&
             q.correctAnswer &&
             q.options.includes(q.correctAnswer);
    }).map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided',
      difficulty: q.difficulty || difficulty,
      bloomsLevel: q.bloomsLevel || 'understand',
      marks: marksPerQuestion,
      topics: q.topics || topics[0],
      courseOutcome,
      coNumber
    }));

    if (validQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No valid questions generated',
        rawResponse: rawResponse.substring(0, 500)
      });
    }

    console.log(`✅ Generated ${validQuestions.length} valid LLM-only questions for ${courseOutcome}`);

    res.json({
      success: true,
      questions: validQuestions,
      metadata: {
        courseOutcome,
        coNumber,
        topics,
        difficulty,
        requestedQuestions: numberOfQuestions,
        generatedQuestions: validQuestions.length,
        generationMode: 'LLM Only (No Materials)',
        generatedAt: new Date()
      },
      message: `Successfully generated ${validQuestions.length} questions for ${courseOutcome} using LLM only`
    });

  } catch (error) {
    console.error('❌ Error generating LLM-only questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message
    });
  }
};

// Create assessment task with all questions
exports.createAssessmentTask = async (req, res) => {
  try {
    const {
      title,
      description,
      subjectId,
      subjectName,
      examType,
      courseOutcomes,
      studentIds,
      questions,
      totalMarks,
      totalTime,
      startDateTime,
      dueDateTime,
      allowRetake,
      maxAttempts,
      shuffleQuestions,
      showResultsImmediately,
      coBreakdown
    } = req.body;
    
    console.log(`📋 Creating assessment task: ${title}`);
    console.log(`   Students: ${studentIds.length}`);
    console.log(`   Questions: ${questions.length}`);
    console.log(`   Total Marks: ${totalMarks}`);
    
    // Create task for each student
    const taskPromises = studentIds.map(studentId => {
      return TaskAssignment.create({
        title,
        description,
        taskType: 'ASSESSMENT',
        subject: subjectId,
        assignedTo: studentId,
        assignedBy: req.user._id,
        dueDate: new Date(dueDateTime),
        startDate: startDateTime ? new Date(startDateTime) : new Date(),
        priority: 'HIGH',
        status: 'PENDING',
        assessmentData: {
          examType,
          courseOutcomes,
          questions,
          totalMarks,
          totalTime,
          allowRetake,
          maxAttempts,
          shuffleQuestions,
          showResultsImmediately,
          coBreakdown
        },
        metadata: {
          subjectName,
          totalQuestions: questions.length,
          coBreakdown
        }
      });
    });
    
    const createdTasks = await Promise.all(taskPromises);
    
    console.log(`✅ Created ${createdTasks.length} assessment tasks`);
    
    res.json({
      success: true,
      message: `Assessment assigned to ${createdTasks.length} student(s)`,
      tasks: createdTasks,
      summary: {
        totalTasks: createdTasks.length,
        totalQuestions: questions.length,
        totalMarks,
        courseOutcomes,
        coBreakdown
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating assessment task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment task',
      error: error.message
    });
  }
};
