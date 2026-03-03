# Multi-Type Task Generation System - Implementation Guide

## Overview

The LearnAID platform now supports comprehensive task generation with **three question types**:
1. **Multiple Choice Questions (MCQ)** - Traditional MCQ with 4 options
2. **Short Answer Questions** - Descriptive questions requiring text answers
3. **Coding Problems** - Programming challenges with test cases

Additionally, you can create **Mixed** assessments combining all three types.

---

## Features Implemented

### 1. Enhanced Task Assignment Model

The `TaskAssignment` model now supports:

```javascript
{
  taskType: 'MCQ' | 'Short Answer' | 'Coding' | 'Assignment' | 'Practice' | ...,
  questionTypes: ['MCQ', 'Short Answer', 'Coding'],  // Array of question types in task
  
  questions: [{
    questionType: 'MCQ' | 'Short Answer' | 'Coding',
    questionText: String,
    
    // MCQ specific
    options: [{ optionText, isCorrect }],
    correctAnswer: Number,
    
    // Short Answer specific
    expectedAnswer: String,
    keyPoints: [String],
    maxWords: Number,
    
    // Coding specific
    programmingLanguage: 'Python' | 'Java' | 'JavaScript' | 'C++' | 'C',
    starterCode: String,
    sampleInput: String,
    sampleOutput: String,
    testCases: [{ input, expectedOutput, isHidden, marks }],
    constraints: [String],
    
    // Common fields
    marks: Number,
    explanation: String,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    courseOutcome: String,
    topics: [String]
  }]
}
```

### 2. AI Question Generation Service

**File:** `backend/src/services/questionGenerator.js`

#### Available Functions:

##### a) Generate MCQ Questions
```javascript
const questions = await generateMCQQuestions({
  topics: 'Data Structures and Algorithms',
  courseOutcome: 'CO1',
  difficulty: 'Medium',
  numberOfQuestions: 5,
  materialId: 'optional-material-id'  // null for LLM-only mode
})
```

##### b) Generate Short Answer Questions
```javascript
const questions = await generateShortAnswerQuestions({
  topics: 'Object-Oriented Programming Concepts',
  courseOutcome: 'CO2',
  difficulty: 'Medium',
  numberOfQuestions: 3,
  maxWords: 200,
  materialId: 'optional-material-id'
})
```

**Generated questions include:**
- Question text
- Expected comprehensive answer
- Key points for evaluation (3-5 points)
- Maximum word limit
- Marking criteria

##### c) Generate Coding Questions
```javascript
const questions = await generateCodingQuestions({
  topics: 'Sorting Algorithms Implementation',
  courseOutcome: 'CO3',
  difficulty: 'Hard',
  numberOfQuestions: 2,
  programmingLanguage: 'Python',
  materialId: 'optional-material-id'
})
```

**Generated questions include:**
- Problem statement
- Programming language
- Starter code template
- Sample input/output
- Multiple test cases (visible and hidden)
- Constraints
- Solution explanation

##### d) Generate Mixed Questions
```javascript
const questions = await generateMixedQuestions({
  topics: 'Full Stack Development',
  courseOutcome: 'CO4',
  difficulty: 'Medium',
  mcqCount: 3,
  shortAnswerCount: 2,
  codingCount: 1,
  programmingLanguage: 'JavaScript',
  materialId: 'optional-material-id'
})
```

### 3. API Endpoints

**File:** `backend/src/routes/taskAssessment.js`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/question-generator/load-material` | POST | Load material content into vector store |
| `/api/question-generator/generate-mcq` | POST | Generate MCQ questions |
| `/api/question-generator/generate-short-answer` | POST | Generate short answer questions |
| `/api/question-generator/generate-coding` | POST | Generate coding problems |
| `/api/question-generator/generate-mixed` | POST | Generate mixed type questions |
| `/api/question-generator/clear-cache` | POST | Clear vector store cache |

#### Example Request: Generate Short Answer Questions

```bash
POST /api/question-generator/generate-short-answer
Content-Type: application/json

{
  "topics": "Machine Learning Fundamentals",
  "courseOutcome": "CO3",
  "difficulty": "Medium",
  "numberOfQuestions": 3,
  "maxWords": 150,
  "materialId": "673a5b4c9d8e7f1234567890"  // optional
}
```

#### Example Response:

```json
{
  "success": true,
  "message": "Generated 3 Short Answer questions",
  "questions": [
    {
      "questionType": "Short Answer",
      "questionText": "Explain the difference between supervised and unsupervised learning...",
      "expectedAnswer": "Supervised learning uses labeled data where...",
      "keyPoints": [
        "Labeled vs unlabeled data",
        "Training process differences",
        "Use cases and applications"
      ],
      "maxWords": 150,
      "marks": 5,
      "explanation": "Answer should cover data requirements, algorithms, and practical applications",
      "difficulty": "Medium",
      "courseOutcome": "CO3",
      "topics": ["Machine Learning Fundamentals"]
    }
  ]
}
```

### 4. Frontend Task Assessment Wizard

**File:** `src/components/TaskAssessmentWizard.tsx`

#### New Features in CO Configuration:

1. **Question Type Selection**
   - Dropdown to choose: MCQ, Short Answer, Coding, or Mixed
   - Dynamic form fields based on selection

2. **Mixed Type Configuration**
   - Individual count inputs for each question type
   - Automatic total calculation
   - Visual breakdown display

3. **Programming Language Selection**
   - Available for Coding and Mixed types
   - Supports: Python, Java, JavaScript, C++, C

4. **Enhanced Question Preview**
   - Type-specific rendering
   - MCQ: Shows options with correct answer highlighted
   - Short Answer: Shows expected answer and key points
   - Coding: Shows sample I/O, test cases, and constraints

#### UI Flow:

```
Step 1: Select COs
  ├─ Choose question type (MCQ/Short Answer/Coding/Mixed)
  ├─ If Mixed: Set counts for each type
  ├─ If Coding: Select programming language
  └─ Configure marks and difficulty

Step 2: Configure Assessment
  └─ Set title, description, time, deadlines

Step 3: Generate Questions
  ├─ Select materials or use LLM-only mode
  ├─ Add topics
  └─ Generate questions with preview

Step 4: Review
  └─ Review all generated questions with type-specific display

Step 5: Publish
  └─ Assign to students
```

---

## Usage Examples

### Example 1: Create MCQ-only Assessment

```typescript
// In TaskAssessmentWizard
const coConfig = {
  courseOutcome: 'CO1',
  questionType: 'MCQ',
  mcqCount: 10,
  shortAnswerCount: 0,
  codingCount: 0,
  difficulty: 'Medium',
  topics: ['Arrays', 'Linked Lists'],
  // ... other config
}

// Generates 10 MCQ questions about Arrays and Linked Lists
```

### Example 2: Create Short Answer Assessment

```typescript
const coConfig = {
  courseOutcome: 'CO2',
  questionType: 'Short Answer',
  mcqCount: 0,
  shortAnswerCount: 5,
  codingCount: 0,
  difficulty: 'Hard',
  topics: ['Design Patterns', 'SOLID Principles'],
  // ... other config
}

// Generates 5 short answer questions requiring 200-word answers
```

### Example 3: Create Coding Challenge

```typescript
const coConfig = {
  courseOutcome: 'CO3',
  questionType: 'Coding',
  mcqCount: 0,
  shortAnswerCount: 0,
  codingCount: 3,
  programmingLanguage: 'Python',
  difficulty: 'Medium',
  topics: ['Binary Search', 'Recursion'],
  // ... other config
}

// Generates 3 Python coding problems with test cases
```

### Example 4: Create Mixed Assessment

```typescript
const coConfig = {
  courseOutcome: 'CO4',
  questionType: 'Mixed',
  mcqCount: 5,           // 5 MCQs
  shortAnswerCount: 3,   // 3 Short Answer
  codingCount: 2,        // 2 Coding Problems
  programmingLanguage: 'Java',
  difficulty: 'Mixed',
  topics: ['Full Stack Development', 'RESTful APIs'],
  // ... other config
}

// Generates mixed assessment: 5 MCQs + 3 Short Answers + 2 Coding problems
// Total: 10 questions
```

---

## Evaluation System

### 1. MCQ Questions
- **Auto-evaluated** ✓
- Instant feedback
- Correct/incorrect marking
- Marks awarded automatically

### 2. Short Answer Questions
- **Manual/AI-assisted evaluation**
- Key points provided for grading
- Expected answer as reference
- Faculty can review and assign marks

### 3. Coding Questions
- **Auto-evaluated with test cases** ✓
- Hidden and visible test cases
- Partial marks for passing some test cases
- Code execution and validation

---

## Benefits

### For Faculty:
1. **Versatility** - Create diverse assessments matching learning objectives
2. **Time-saving** - AI generates high-quality questions automatically
3. **Flexibility** - Mix question types as needed
4. **Quality** - Questions based on course materials using RAG
5. **Customization** - Full control over difficulty, topics, and distribution

### For Students:
1. **Varied Assessment** - Different question types test different skills
2. **Comprehensive Learning** - MCQs test recall, short answers test understanding, coding tests application
3. **Clear Expectations** - Sample answers and rubrics provided
4. **Immediate Feedback** - Auto-graded questions show results instantly

---

## Technical Details

### RAG (Retrieval-Augmented Generation) System

The question generator uses RAG to create contextually relevant questions:

1. **Material Loading**
   ```javascript
   await loadMaterialContent(materialId)
   // Extracts text from PDF, chunks it, and stores in vector store
   ```

2. **Context Retrieval**
   ```javascript
   const relevantChunks = vectorStore.search(topics, 5)
   // Retrieves most relevant content chunks for the topic
   ```

3. **Question Generation**
   ```javascript
   // AI generates questions using:
   // - Retrieved context from materials
   // - Course outcome information
   // - Topic specifications
   // - Difficulty requirements
   ```

### Vector Store

- **Implementation**: Enhanced in-memory vector store
- **Features**:
  - Keyword extraction
  - Frequency mapping
  - Semantic search
  - Context ranking

---

## Future Enhancements

### Planned Features:

1. **Question Bank**
   - Save generated questions for reuse
   - Build subject-wise question libraries
   - Tag and categorize questions

2. **Advanced Evaluation**
   - AI-powered short answer evaluation
   - Plagiarism detection for coding
   - Code quality metrics

3. **Analytics**
   - Question difficulty analysis
   - Student performance by question type
   - Success rate tracking

4. **More Question Types**
   - True/False
   - Fill in the blanks
   - Match the following
   - Diagram-based questions

---

## Testing the Feature

### 1. Generate MCQ Questions
```bash
# Test endpoint
curl -X POST http://localhost:5000/api/question-generator/generate-mcq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topics": "Data Structures",
    "courseOutcome": "CO1",
    "difficulty": "Medium",
    "numberOfQuestions": 5
  }'
```

### 2. Generate Short Answer Questions
```bash
curl -X POST http://localhost:5000/api/question-generator/generate-short-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topics": "Software Engineering",
    "courseOutcome": "CO2",
    "difficulty": "Medium",
    "numberOfQuestions": 3,
    "maxWords": 200
  }'
```

### 3. Generate Coding Questions
```bash
curl -X POST http://localhost:5000/api/question-generator/generate-coding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topics": "Algorithms",
    "courseOutcome": "CO3",
    "difficulty": "Hard",
    "numberOfQuestions": 2,
    "programmingLanguage": "Python"
  }'
```

---

## Troubleshooting

### Common Issues:

1. **No questions generated**
   - Check GROQ_API_KEY in .env
   - Verify material ID is valid
   - Ensure topics are relevant to material

2. **Questions not matching material**
   - Load material first using load-material endpoint
   - Check vector store has content
   - Verify material is PDF and readable

3. **Coding questions missing test cases**
   - AI may generate incomplete questions
   - Use regenerate feature to try again
   - Check programming language is supported

---

## Conclusion

The multi-type task generation system provides a comprehensive solution for creating diverse assessments. Faculty can now:
- Generate MCQs for quick knowledge checks
- Create short answer questions for concept understanding
- Design coding problems for practical skills
- Mix all types for comprehensive evaluation

All powered by AI while maintaining full control over quality and relevance.

For support or feature requests, contact the development team.

**Happy Teaching! 🎓**
