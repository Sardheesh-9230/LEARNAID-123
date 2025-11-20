const Material = require('../models/Material');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const File = require('../models/File');
const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

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
    this.documents = chunks.map((chunk, index) => ({
      id: index,
      content: chunk,
      keywords: this.extractKeywords(chunk),
      frequency: this.calculateFrequencyMap(chunk)
    }));
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

const vectorStore = new EnhancedVectorStore();

// Helper Functions
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    
    // Try with different PDF parsing options to handle corrupted PDFs
    const options = [
      { max: 0 }, // No page limit
      { max: 0, version: 'v1.10.100' },
      { max: 0, pagerender: (pageData) => pageData.getTextContent() }
    ];
    
    for (const option of options) {
      try {
        const data = await pdf(dataBuffer, option);
        if (data.text && data.text.trim().length > 0) {
          console.log(`✅ Successfully extracted ${data.text.length} characters using pdf-parse`);
          return data.text;
        }
      } catch (parseError) {
        console.log(`⚠️ pdf-parse attempt failed:`, parseError.message);
        continue;
      }
    }
    
    // Fallback to pdftotext command-line utility
    console.log('⚠️ All pdf-parse strategies failed, trying pdftotext utility...');
    try {
      const { stdout, stderr } = await execPromise(`pdftotext "${filePath}" -`);
      if (stdout && stdout.trim().length > 0) {
        console.log(`✅ Successfully extracted ${stdout.length} characters using pdftotext`);
        return stdout;
      }
      if (stderr) {
        console.error('pdftotext stderr:', stderr);
      }
    } catch (cmdError) {
      console.error('❌ pdftotext command failed:', cmdError.message);
    }
    
    throw new Error('All PDF text extraction strategies failed');
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}. The PDF may be corrupted, empty, or image-based.`);
  }
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

async function validateAndGetMaterialPath(material) {
  try {
    let filePath = null;

    // First, try the new File model approach
    if (material.file) {
      console.log('🔍 Checking File model reference:', material.file);
      
      // Query the File model to get the actual filename
      const fileDoc = await File.findById(material.file);
      
      if (fileDoc) {
        console.log('📄 File document found:');
        console.log('  - Original Name:', fileDoc.originalName);
        console.log('  - Filename:', fileDoc.filename);
        console.log('  - Path:', fileDoc.path);
        console.log('  - Size:', fileDoc.size);

        // Construct the full path using the filename from File model
        const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
        filePath = path.join(uploadsDir, fileDoc.filename);
      } else {
        console.warn('⚠️ File record not found for ID:', material.file);
      }
    }

    // Fallback to legacy fileMetadata approach
    if (!filePath && material.fileMetadata) {
      console.log('🔄 Using legacy fileMetadata approach');
      console.log('  - Original Name:', material.fileMetadata.originalName);
      console.log('  - Filename:', material.fileMetadata.filename);
      console.log('  - Size:', material.fileMetadata.size);
      
      // Try using the filename from fileMetadata
      if (material.fileMetadata.filename) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
        filePath = path.join(uploadsDir, material.fileMetadata.filename);
      } else if (material.fileMetadata.filePath) {
        filePath = material.fileMetadata.filePath;
      }
    }

    // Additional fallback: check if material has a direct path field
    if (!filePath && material.path && typeof material.path === 'string') {
      console.log('🔄 Using direct path field:', material.path);
      filePath = path.isAbsolute(material.path) ? 
        material.path : 
        path.join(process.cwd(), material.path);
    }

    // If we still don't have a file path, this material has no file
    if (!filePath) {
      console.error('❌ Material structure debug:', {
        hasFile: !!material.file,
        hasFileMetadata: !!material.fileMetadata,
        hasPath: !!material.path,
        fileMetadataKeys: material.fileMetadata ? Object.keys(material.fileMetadata) : [],
        materialKeys: Object.keys(material.toObject ? material.toObject() : material)
      });
      throw new Error('Material has no file reference - please upload a file for this material');
    }

    // Verify the file exists on disk
    try {
      await fs.access(filePath);
      console.log('✅ Found PDF file at:', filePath);
      return filePath;
    } catch (error) {
      console.error('❌ File exists in database but not on disk:', filePath);
      throw new Error(`File exists in database but not found on server: ${path.basename(filePath)}`);
    }

  } catch (error) {
    console.error('❌ Error in validateAndGetMaterialPath:', error.message);
    throw error;
  }
}

// Controller Functions
exports.getSubjectsForFaculty = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const subjects = await Subject.find({ faculty: facultyId })
      .select('subjectName subjectCode semester')
      .sort({ semester: 1, subjectName: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

exports.getChaptersBySubject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { subjectId } = req.params;
    const chapters = await Chapter.find({ subject: subjectId })
      .select('chapterNumber chapterName description')
      .sort({ chapterNumber: 1 });

    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapters',
      error: error.message
    });
  }
};

exports.getMaterialsByChapter = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { chapterId } = req.params;
    const materials = await Material.find({ 
      chapter: chapterId,
      'fileMetadata.mimetype': 'application/pdf'
    })
      .select('title description fileMetadata uploadedAt')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
};

exports.generateMCQs = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { materialId, topics, numberOfQuestions = 5, difficulty = 'medium' } = req.body;
    console.log('📝 Generating MCQs:', { materialId, topics, numberOfQuestions, difficulty });

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    console.log('📦 Material found:', {
      _id: material._id,
      title: material.title,
      fileObjectId: material.file,
      hasFileMetadata: !!material.fileMetadata
    });

    let filePath;
    try {
      filePath = await validateAndGetMaterialPath(material);
    } catch (error) {
      console.error('❌ File validation failed:', error.message);
      return res.status(404).json({
        success: false,
        message: 'File not found',
        details: error.message,
        materialId: material._id,
        fileReference: material.file
      });
    }

    console.log('📄 Extracting text from PDF...');
    const fullText = await extractTextFromPDF(filePath);
    
    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from PDF. The PDF may be empty or image-based.'
      });
    }

    console.log(`✅ Extracted ${fullText.length} characters from PDF`);
    console.log('🔪 Chunking text...');
    const chunks = chunkText(fullText, 1000, 200);
    console.log(`✅ Created ${chunks.length} chunks`);

    vectorStore.clear();
    vectorStore.addDocuments(chunks);
    console.log('✅ Added chunks to vector store');

    console.log(`🔍 Searching for relevant content on topics: "${topics}"`);
    const relevantChunks = vectorStore.search(topics, 5);
    
    if (relevantChunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No relevant content found for topics: "${topics}". Please try different topics.`
      });
    }

    console.log(`✅ Found ${relevantChunks.length} relevant chunks`);
    const context = relevantChunks.join('\n\n');

    const prompt = `You are an expert educator creating high-quality multiple choice questions.

Context from the PDF document:
${context}

Topics: ${topics}
Difficulty Level: ${difficulty}
Number of Questions: ${numberOfQuestions}

Generate exactly ${numberOfQuestions} multiple choice questions about "${topics}" based ONLY on the context provided above.

CRITICAL: Return ONLY a valid JSON array with NO additional text. Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct",
    "difficulty": "${difficulty}",
    "topic": "${topics}"
  }
]

Requirements:
- correctAnswer must be the index (0-3) of the correct option
- All options must be plausible but only ONE is correct
- Questions must be directly derived from the provided context`;

    console.log('🤖 Calling Groq API to generate MCQs...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who creates high-quality multiple choice questions. ALWAYS return ONLY valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log('📥 Received response from Groq');

    let mcqs;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      mcqs = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', responseText);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse AI response. Please try again.'
      });
    }

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'AI did not generate valid questions. Please try again.'
      });
    }

    const validMCQs = mcqs.filter(mcq => 
      mcq.question && 
      Array.isArray(mcq.options) && 
      mcq.options.length === 4 &&
      typeof mcq.correctAnswer === 'number' &&
      mcq.correctAnswer >= 0 &&
      mcq.correctAnswer <= 3
    );

    if (validMCQs.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Generated questions do not meet quality standards. Please try again.'
      });
    }

    console.log(`✅ Generated ${validMCQs.length} valid MCQs successfully`);

    res.status(200).json({
      success: true,
      message: `Successfully generated ${validMCQs.length} MCQs`,
      data: {
        mcqs: validMCQs,
        metadata: {
          materialId,
          materialTitle: material.title,
          topics,
          difficulty,
          numberOfQuestions: validMCQs.length,
          generatedAt: new Date(),
          chunksAnalyzed: relevantChunks.length,
          totalChunks: chunks.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating MCQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MCQs',
      error: error.message
    });
  }
};
