const Groq = require('groq-sdk');
const Material = require('../models/Material');
const File = require('../models/File');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ─── Material text cache to avoid re-reading PDFs ────────────────────────────
const materialTextCache = new Map(); // materialId → full extracted text
let lastLoadedMaterialId = null;

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`✅ Extracted ${data.text.length} characters from PDF`);
      return data.text;
    }
    
    throw new Error('PDF appears to be empty or image-based');
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Get material file path from DB
 */
async function getMaterialPath(materialId) {
  const material = await Material.findById(materialId);
  if (!material) throw new Error('Material not found');

  let filePath = null;

  if (material.file) {
    const fileDoc = await File.findById(material.file);
    if (fileDoc) {
      if (fileDoc.path && fsSync.existsSync(fileDoc.path)) {
        filePath = fileDoc.path;
      } else {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'materials');
        const possiblePath = path.join(uploadsDir, fileDoc.filename);
        if (fsSync.existsSync(possiblePath)) filePath = possiblePath;
      }
    }
  }

  if (!filePath) throw new Error('Material file not found on disk');
  return filePath;
}

/**
 * Load material text (cached)
 */
async function getMaterialText(materialId) {
  const key = String(materialId);
  if (materialTextCache.has(key)) {
    console.log(`✅ Using cached text for material ${materialId}`);
    return materialTextCache.get(key);
  }
  const filePath = await getMaterialPath(materialId);
  const text = await extractTextFromPDF(filePath);
  // Trim to 12000 chars to stay within LLM token limits while keeping full coverage
  const trimmed = text.length > 12000 ? text.substring(0, 12000) : text;
  materialTextCache.set(key, trimmed);
  lastLoadedMaterialId = key;
  console.log(`✅ Material ${materialId} loaded & cached (${trimmed.length} chars)`);
  return trimmed;
}

/**
 * Legacy: loadMaterialContent (kept for backward compatibility with /load-material route)
 */
async function loadMaterialContent(materialId) {
  await getMaterialText(materialId);
  return 1; // signal success
}

// ─── STEP 1: LLM Concept Extractor ──────────────────────────────────────────
/**
 * Use Groq LLM to intelligently extract concepts from material text
 * based on the question type being generated.
 *
 * @param {string} materialText  - Full text extracted from PDF
 * @param {string} questionType  - 'MCQ' | 'Short Answer' | 'Coding'
 * @param {string} topics        - Faculty-entered topic hint
 * @param {string} programmingLanguage - Only used for Coding type
 * @returns {string} structured concept summary for use as LLM context
 */
async function extractConceptsFromMaterial(materialText, questionType, topics, programmingLanguage = 'Python') {
  let extractionInstruction = '';

  if (questionType === 'Coding') {
    extractionInstruction = `You are reading an educational material. Extract ALL programming-related concepts that can be turned into coding problems.

Focus on:
- Algorithms and computational procedures described in the text
- Mathematical formulas/calculations that can be implemented as programs
- Data manipulation steps (e.g., sorting, counting, computing averages)
- Any pseudocode or code examples present
- Problem-solving patterns (loops, conditions, functions)
- Input/output patterns described or implied

Student's topic hint: "${topics}"
Target programming language: ${programmingLanguage}

After reading the material, produce a structured summary:
1. MAIN CONCEPTS: List every concept that can become a coding problem
2. ALGORITHMS/PROCEDURES: Step-by-step processes described
3. FORMULAS: Any mathematical formulas or computations
4. SAMPLE DATA: Input/output examples if present
5. CODING TASKS: Suggest 3-5 specific coding problem titles based on the material

Keep it concise but complete. This summary will be used to generate ${programmingLanguage} coding problems.`;
  } else if (questionType === 'Short Answer') {
    extractionInstruction = `You are reading an educational material. Extract ALL concepts that can be turned into short answer questions.

Focus on:
- Definitions of key terms and concepts
- Theorems, laws, or principles stated
- Explanations of how/why things work
- Comparisons between concepts
- Applications and real-world examples
- Important properties or characteristics described

Student's topic hint: "${topics}"

After reading the material, produce a structured summary:
1. KEY TERMS & DEFINITIONS: Important vocabulary with meanings
2. CORE CONCEPTS: Main ideas explained in the material
3. RELATIONSHIPS: How concepts relate to each other
4. APPLICATIONS: Real-world uses or examples
5. QUESTION TARGETS: 5 specific short-answer question angles from this material

Keep it concise but complete. This summary will be used to generate short answer questions.`;
  } else {
    // MCQ
    extractionInstruction = `You are reading an educational material. Extract ALL factual and conceptual information that can become MCQ questions.

Focus on:
- Facts, definitions, properties
- "What is", "Which of", "How many" type knowledge
- Comparisons where one option is clearly correct
- Process steps where order/selection matters
- Classifications and categories

Student's topic hint: "${topics}"

After reading the material, produce a structured summary:
1. KEY FACTS: Specific facts with correct values
2. DEFINITIONS: Terms and their precise meanings
3. CLASSIFICATIONS: Groups/categories described
4. PROCESSES: Steps or sequences
5. MCQ TARGETS: 5 specific MCQ angles from this material

Keep it concise but complete. This summary will be used to generate multiple choice questions.`;
  }

  const prompt = `${extractionInstruction}

--- MATERIAL TEXT START ---
${materialText}
--- MATERIAL TEXT END ---`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content analyst. Extract key concepts accurately and concisely from academic materials.'
        },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // low temperature for accurate extraction
      max_tokens: 1500,
    });

    const extracted = completion.choices[0]?.message?.content || '';
    console.log(`✅ Concept extraction complete (${extracted.length} chars) for ${questionType}`);
    return extracted;
  } catch (err) {
    console.warn(`⚠️ Concept extraction failed: ${err.message}. Will use raw material text.`);
    // Fallback: return first 3000 chars of raw text
    return materialText.substring(0, 3000);
  }
}

/**
 * Build rich context for question generation:
 * - If materialId provided: extract full text → LLM concept extraction
 * - Otherwise: return empty string (pure LLM knowledge)
 */
async function buildSmartContext(materialId, topics, questionType, programmingLanguage = 'Python') {
  if (!materialId) return '';

  try {
    const fullText = await getMaterialText(materialId);
    const concepts = await extractConceptsFromMaterial(fullText, questionType, topics, programmingLanguage);
    return concepts;
  } catch (err) {
    console.warn(`⚠️ Could not build smart context: ${err.message}. Generating with AI knowledge only.`);
    return '';
  }
}

// ─── Shared JSON response parser ─────────────────────────────────────────────
function parseAndTagQuestions(completion, questionType) {
  const responseText = completion.choices[0]?.message?.content || '';
  let questions;
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
  } catch (parseError) {
    console.error(`❌ Failed to parse AI response for ${questionType}:`, responseText.substring(0, 300));
    throw new Error(`AI returned invalid JSON for ${questionType} questions`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`AI did not generate valid ${questionType} questions`);
  }

  return questions.map(q => ({ ...q, questionType }));
}

/**
 * Generate MCQ questions using AI + smart material context
 */
async function generateMCQQuestions({
  topics,
  courseOutcome,
  difficulty = 'Medium',
  numberOfQuestions = 5,
  materialId = null
}) {
  console.log(`📝 Generating ${numberOfQuestions} MCQ questions | Topic: "${topics}" | Material: ${materialId || 'none'}`);

  // Step 1: Build smart context from material (LLM-extracted concepts)
  const context = await buildSmartContext(materialId, topics, 'MCQ');

  // Step 2: Generate questions using extracted concepts as context
  const prompt = `You are an expert educator creating high-quality multiple choice questions.

${context
  ? `MATERIAL CONCEPTS (extracted from the uploaded study material):\n${context}\n\n`
  : ''}Course Outcome: ${courseOutcome}
Topics: ${topics}
Difficulty Level: ${difficulty}
Number of Questions: ${numberOfQuestions}

Generate exactly ${numberOfQuestions} multiple choice questions about "${topics}"${context ? ' based strictly on the material concepts above' : ''}.

CRITICAL: Return ONLY a valid JSON array with NO additional text. Format:
[
  {
    "questionText": "Question text here?",
    "options": [
      {"optionText": "Option A", "isCorrect": false},
      {"optionText": "Option B", "isCorrect": true},
      {"optionText": "Option C", "isCorrect": false},
      {"optionText": "Option D", "isCorrect": false}
    ],
    "correctAnswer": 1,
    "explanation": "Why this answer is correct",
    "difficulty": "${difficulty}",
    "courseOutcome": "${courseOutcome}",
    "topics": ["${topics}"]
  }
]

Requirements:
- correctAnswer must be the index (0-3) of the correct option
- All options must be plausible but only ONE is correct
- Mark the correct option with "isCorrect": true
- Questions must be clear and unambiguous
- If material concepts are provided, questions MUST reflect content from the material`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert educator creating high-quality MCQ questions. ALWAYS return ONLY valid JSON arrays with no extra text.' },
      { role: 'user', content: prompt }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 3000,
  });

  return parseAndTagQuestions(completion, 'MCQ');
}

/**
 * Generate Short Answer questions using AI + smart material context
 */
async function generateShortAnswerQuestions({
  topics,
  courseOutcome,
  difficulty = 'Medium',
  numberOfQuestions = 5,
  maxWords = 200,
  materialId = null
}) {
  console.log(`📝 Generating ${numberOfQuestions} Short Answer questions | Topic: "${topics}" | Material: ${materialId || 'none'}`);

  // Step 1: Build smart context — LLM extracts definitions, explanations, key points
  const context = await buildSmartContext(materialId, topics, 'Short Answer');

  // Step 2: Generate questions
  const prompt = `You are an expert educator creating high-quality short answer questions.

${context
  ? `MATERIAL CONCEPTS (extracted from the uploaded study material):\n${context}\n\n`
  : ''}Course Outcome: ${courseOutcome}
Topics: ${topics}
Difficulty Level: ${difficulty}
Number of Questions: ${numberOfQuestions}
Maximum Words per Answer: ${maxWords}

Generate exactly ${numberOfQuestions} short answer questions about "${topics}"${context ? ' based strictly on the material concepts above' : ''}.

CRITICAL: Return ONLY a valid JSON array with NO additional text. Format:
[
  {
    "questionText": "Question text here?",
    "expectedAnswer": "A comprehensive model answer covering key concepts from the material",
    "keyPoints": [
      "First key point that must be mentioned",
      "Second key point that must be mentioned",
      "Third key point that must be mentioned"
    ],
    "maxWords": ${maxWords},
    "marks": 5,
    "explanation": "Grading rubric: what to look for in student answers",
    "difficulty": "${difficulty}",
    "courseOutcome": "${courseOutcome}",
    "topics": ["${topics}"]
  }
]

Requirements:
- Questions should test conceptual understanding, analysis, and application — not just memorization
- Expected answers must be detailed, accurate, and reflect the material content
- Key points are the minimum criteria for awarding marks
- If material concepts are provided, questions and answers MUST be grounded in the material`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are an expert educator creating high-quality short answer questions. ALWAYS return ONLY valid JSON arrays with no extra text.' },
      { role: 'user', content: prompt }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 3500,
  });

  return parseAndTagQuestions(completion, 'Short Answer');
}

/**
 * Generate Coding questions using AI + smart material context
 * The LLM first understands what programs/algorithms are in the material,
 * then generates coding problems directly derived from those concepts.
 */
async function generateCodingQuestions({
  topics,
  courseOutcome,
  difficulty = 'Medium',
  numberOfQuestions = 3,
  programmingLanguage = 'Python',
  materialId = null
}) {
  console.log(`💻 Generating ${numberOfQuestions} Coding questions | Topic: "${topics}" | Lang: ${programmingLanguage} | Material: ${materialId || 'none'}`);

  // Step 1: Build smart context — LLM extracts algorithms, formulas, procedures
  const context = await buildSmartContext(materialId, topics, 'Coding', programmingLanguage);

  // Step 2: Generate coding problems based on what's actually in the material
  const starterTemplate = {
    Python: `def solution():\n    # Write your code here\n    pass`,
    Java: `public static void main(String[] args) {\n    // Write your code here\n}`,
    JavaScript: `function solution() {\n    // Write your code here\n}`,
    'C++': `#include <iostream>\nusing namespace std;\nint main() {\n    // Write your code here\n    return 0;\n}`,
    C: `#include <stdio.h>\nint main() {\n    // Write your code here\n    return 0;\n}`
  }[programmingLanguage] || `# Write your code here`;

  const prompt = `You are an expert programming educator creating practical coding problems.

${context
  ? `MATERIAL CONCEPTS (algorithms, formulas, and procedures extracted from the study material):\n${context}\n\n`
  : ''}Course Outcome: ${courseOutcome}
Topics: ${topics}
Difficulty Level: ${difficulty}
Number of Problems: ${numberOfQuestions}
Programming Language: ${programmingLanguage}

${context
  ? `IMPORTANT: Generate coding problems that DIRECTLY implement the algorithms, formulas, or data processing steps found in the material concepts above. The problems must require students to write ${programmingLanguage} code for what is taught in the material.`
  : `Generate coding problems about "${topics}" that test programming skills.`}

CRITICAL: Return ONLY a valid JSON array with NO additional text. Format:
[
  {
    "questionText": "Write a ${programmingLanguage} program to [specific task directly from the material]...",
    "programmingLanguage": "${programmingLanguage}",
    "starterCode": "${starterTemplate.replace(/\n/g, '\\n')}",
    "sampleInput": "Concrete example input (numbers, list, etc.)",
    "sampleOutput": "Expected output for that input",
    "testCases": [
      {"input": "test input 1", "expectedOutput": "output 1", "isHidden": false, "marks": 2},
      {"input": "test input 2", "expectedOutput": "output 2", "isHidden": false, "marks": 2},
      {"input": "test input 3", "expectedOutput": "output 3", "isHidden": true, "marks": 3},
      {"input": "edge case input", "expectedOutput": "edge case output", "isHidden": true, "marks": 3}
    ],
    "constraints": [
      "Specific constraint 1 (e.g., input size range)",
      "Specific constraint 2"
    ],
    "marks": 10,
    "explanation": "What the program must do and how to approach it — include the algorithm/formula from the material",
    "difficulty": "${difficulty}",
    "courseOutcome": "${courseOutcome}",
    "topics": ["${topics}"]
  }
]

Requirements:
- Problems must be directly implementable from material content
- Starter code must be valid ${programmingLanguage} syntax
- Include at least 2 visible and 2 hidden test cases with real numeric/string values
- sampleInput and sampleOutput must be concrete, matching values
- The explanation must mention the specific formula or algorithm being implemented`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: `You are an expert ${programmingLanguage} programming educator. ALWAYS return ONLY valid JSON arrays. Generate problems GROUNDED in provided material concepts.` },
      { role: 'user', content: prompt }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    max_tokens: 4500,
  });

  return parseAndTagQuestions(completion, 'Coding');
}

/**
 * Generate mixed type questions
 */
async function generateMixedQuestions({
  topics,
  courseOutcome,
  difficulty = 'Medium',
  mcqCount = 3,
  shortAnswerCount = 2,
  codingCount = 1,
  programmingLanguage = 'Python',
  materialId = null
}) {
  console.log(`🔀 Generating mixed questions | MCQ:${mcqCount} SA:${shortAnswerCount} Coding:${codingCount} | Material: ${materialId || 'none'}`);
  const questions = [];

  // Note: Each sub-generator calls buildSmartContext independently with its own
  // question-type-specific concept extraction. Material text is cached to avoid
  // redundant PDF reads.

  // Generate MCQ questions
  if (mcqCount > 0) {
    const mcqs = await generateMCQQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions: mcqCount,
      materialId
    });
    questions.push(...mcqs);
  }

  // Generate Short Answer questions
  if (shortAnswerCount > 0) {
    const shortAnswers = await generateShortAnswerQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions: shortAnswerCount,
      materialId
    });
    questions.push(...shortAnswers);
  }

  // Generate Coding questions
  if (codingCount > 0) {
    const coding = await generateCodingQuestions({
      topics,
      courseOutcome,
      difficulty,
      numberOfQuestions: codingCount,
      programmingLanguage,
      materialId
    });
    questions.push(...coding);
  }

  return questions;
}

/**
 * Clear material cache (call when materials are updated)
 */
function clearVectorStore() {
  materialTextCache.clear();
  lastLoadedMaterialId = null;
  console.log('✅ Material text cache cleared');
}

module.exports = {
  loadMaterialContent,
  generateMCQQuestions,
  generateShortAnswerQuestions,
  generateCodingQuestions,
  generateMixedQuestions,
  clearVectorStore
};
