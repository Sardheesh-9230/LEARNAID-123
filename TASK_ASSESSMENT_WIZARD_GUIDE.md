# Task Assessment Wizard - Complete Implementation Guide

## Overview
The Task Assessment Wizard is a comprehensive, step-by-step interface for creating CO-specific assessments with AI-generated questions from uploaded materials using RAG (Retrieval-Augmented Generation).

## ✨ Key Features

### 1. **Step-by-Step Wizard Flow**
- **Step 1: Select COs** - Configure questions for each Course Outcome
- **Step 2: Configure Assessment** - Set marks, time, deadline
- **Step 3: Generate Questions** - AI generates questions from uploaded materials
- **Step 4: Review** - Preview all questions before publishing
- **Step 5: Publish** - Assign to selected students

### 2. **CO-Specific Question Generation**
- **Separate Generation**: Questions generated independently for each CO
  - CIA-1: CO1 and CO2 (separate question sets)
  - CIA-2: CO3 and CO4 (separate question sets)
  - MODEL: CO1-CO5 (five separate question sets)

### 3. **Material-Based RAG Integration**
- **PDF Material Selection**: Faculty selects specific uploaded materials
- **RAG Pipeline**: Extracts text, chunks content, performs semantic search
- **Topic-Focused**: Generates questions based on specified topics
- **LLM Integration**: Uses Groq API with Llama 3.3 70B model

### 4. **Flexible Configuration**
- Number of questions per CO
- Marks per question
- Difficulty level (Easy/Medium/Hard/Mixed)
- Assessment time limit
- Start date/time and due date/time
- Allow retakes with max attempts
- Question shuffling
- Immediate results display

## 🏗️ Architecture

### Frontend Components

#### TaskAssessmentWizard.tsx
```typescript
Location: src/components/TaskAssessmentWizard.tsx

Key Features:
- Multi-step wizard with 5 steps
- CO-specific configuration
- Material selection per CO
- Question generation and preview
- Edit/delete/regenerate questions
- Final review and publish

State Management:
- coConfigs: Array of CO configurations
- assessmentConfig: Assessment settings
- currentStep: Wizard navigation
```

#### Integration with COBasedStudentIdentification.tsx
```typescript
Location: src/components/COBasedStudentIdentification.tsx

New Features:
- "Assessment Wizard" button (purple gradient)
- Opens wizard with selected students
- Passes exam type and student details
- Maintains "Quick Assign" for legacy flow
```

### Backend Implementation

#### Controller: taskAssessmentController.js
```javascript
Location: backend/src/controllers/taskAssessmentController.js

Functions:
1. getMaterialsForCO(req, res)
   - Fetches materials mapped to specific CO
   - Filters by chapter courseOutcome
   - Returns PDF materials with files

2. generateCOSpecificQuestions(req, res)
   - Processes multiple materials
   - Extracts text from PDFs
   - Performs RAG search on topics
   - Generates questions via Groq API
   - Returns validated questions

3. regenerateSingleQuestion(req, res)
   - Regenerates one question
   - Excludes existing questions
   - Higher temperature for variety

4. createAssessmentTask(req, res)
   - Creates TaskAssignment for each student
   - Stores questions, CO breakdown
   - Sets deadlines and configurations
```

#### Routes: taskAssessment.js
```javascript
Location: backend/src/routes/taskAssessment.js

Endpoints:
GET  /api/materials/subject/:subjectId/co/:coNumber
POST /api/mcq-generator/generate-co-specific
POST /api/mcq-generator/regenerate-single
POST /api/tasks/create-assessment-task
```

#### RAG Pipeline
```javascript
EnhancedVectorStore class:
- Document chunking (1000 chars, 200 overlap)
- Keyword extraction (removes stopwords)
- Frequency mapping
- Semantic search with scoring
- Returns top-K relevant chunks

PDF Processing:
- Uses pdf-parse library
- Error handling for corrupted PDFs
- Fallback mechanisms for file paths
- Text validation (minimum 100 chars)
```

## 🔄 Complete Flow

### User Journey
1. **Faculty identifies lagging students**
   - Selects exam type (CIA1, CIA2, MODEL)
   - Sets performance threshold
   - System shows students with weak COs

2. **Faculty selects students and clicks "Assessment Wizard"**
   - Wizard opens with exam type pre-selected
   - COs automatically determined (CIA1 = CO1+CO2)

3. **Step 1: Configure Questions per CO**
   - For each CO:
     - Set number of questions (default: 5)
     - Set marks per question (default: 2)
     - Total marks calculated automatically
     - Choose difficulty level

4. **Step 2: Set Assessment Details**
   - Enter title (e.g., "CIA-1 Data Structures")
   - Add description/instructions
   - Set total time (minutes)
   - Set start date/time (optional)
   - Set due date/time (required)
   - Configure retakes and max attempts
   - Enable/disable question shuffling
   - Choose immediate results display

5. **Step 3: Generate Questions for Each CO**
   - For each CO:
     - Click "Load Materials"
     - System fetches PDF materials for that CO
     - Faculty selects relevant materials
     - Faculty enters topics (comma-separated)
     - Click "Generate X Questions"
     - AI generates questions from materials using RAG
     - Questions displayed with options and explanations
     - Faculty can:
       - Regenerate individual questions
       - Delete questions
       - Regenerate entire CO set

6. **Step 4: Review Everything**
   - Summary of assessment details
   - CO-wise breakdown
   - List of selected students
   - Verification checklist

7. **Step 5: Publish**
   - Click "Publish Assessment"
   - System creates TaskAssignment for each student
   - Students receive assessment in their dashboard

### Backend Processing Flow
```
1. Request arrives at /api/mcq-generator/generate-co-specific

2. Validate inputs (materialIds, topics, numberOfQuestions)

3. Fetch materials from database
   - Query Material model by IDs
   - Populate file references

4. Extract text from each PDF
   - Read file from disk
   - Use pdf-parse to extract text
   - Validate text content

5. Chunk all text content
   - 1000 character chunks
   - 200 character overlap
   - Store in array

6. Initialize RAG vector store
   - Add all chunks as documents
   - Extract keywords per chunk
   - Calculate frequency maps

7. Perform semantic search
   - Search for topic-related chunks
   - Score chunks by keyword matching
   - Return top 10 relevant chunks

8. Generate questions via Groq
   - Construct prompt with requirements
   - Include relevant content (6000 chars)
   - Specify CO, difficulty, marks
   - Request JSON array format

9. Parse and validate response
   - Extract JSON from response
   - Validate question structure
   - Ensure 4 options, correctAnswer index
   - Add CO metadata

10. Return questions to frontend
    - Include metadata (materials processed, chunks analyzed)
    - Return validated question array
```

## 📝 Data Structures

### COConfig Interface
```typescript
interface COConfig {
  courseOutcome: string       // "CO1", "CO2", etc.
  coNumber: number            // 1, 2, 3, etc.
  numberOfQuestions: number   // e.g., 5
  marksPerQuestion: number    // e.g., 2
  totalMarks: number          // calculated: numberOfQuestions * marksPerQuestion
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  topics: string[]            // ["Arrays", "Sorting"]
  materials: any[]            // Available materials
  selectedMaterialIds: string[] // Selected material IDs
  generatedQuestions: any[]   // AI-generated questions
  generating: boolean         // Loading state
}
```

### Generated Question Structure
```typescript
interface GeneratedQuestion {
  question: string            // "What is a binary search tree?"
  options: string[]           // ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer: number       // Index 0-3
  explanation: string         // Detailed explanation
  difficulty: string          // "Medium"
  bloomsLevel: string         // "understand", "apply", etc.
  marks: number               // 2
  topics: string              // "Data Structures"
  courseOutcome: string       // "CO1"
  coNumber: number            // 1
}
```

### TaskAssignment Document
```typescript
{
  title: "CIA-1 Data Structures",
  description: "Assessment covering CO1 and CO2",
  taskType: "ASSESSMENT",
  subject: ObjectId("..."),
  assignedTo: ObjectId("student_id"),
  assignedBy: ObjectId("faculty_id"),
  dueDate: ISODate("2025-01-20T23:59:00Z"),
  startDate: ISODate("2025-01-15T10:00:00Z"),
  priority: "HIGH",
  status: "PENDING",
  assessmentData: {
    examType: "CIA1",
    courseOutcomes: ["CO1", "CO2"],
    questions: [...], // All questions with CO metadata
    totalMarks: 20,
    totalTime: 60,
    allowRetake: true,
    maxAttempts: 3,
    shuffleQuestions: true,
    showResultsImmediately: false,
    coBreakdown: [
      { courseOutcome: "CO1", coNumber: 1, numberOfQuestions: 5, totalMarks: 10, topics: ["Arrays"] },
      { courseOutcome: "CO2", coNumber: 2, numberOfQuestions: 5, totalMarks: 10, topics: ["Linked Lists"] }
    ]
  },
  metadata: {
    subjectName: "Data Structures",
    totalQuestions: 10,
    coBreakdown: [...]
  }
}
```

## 🎯 Example Scenario: CIA-1

### Setup
- Subject: Data Structures (CSE202)
- Exam Type: CIA-1
- COs Covered: CO1 (Arrays, Searching) and CO2 (Linked Lists, Stacks)
- Weak Students: Ramesh (CO1: 38%, CO2: 25%), Vijay (CO1: 28%)

### Faculty Actions

**Step 1: Configure COs**
```
CO1:
- Number of Questions: 5
- Marks per Question: 2
- Total Marks: 10
- Difficulty: Medium

CO2:
- Number of Questions: 5
- Marks per Question: 2
- Total Marks: 10
- Difficulty: Medium
```

**Step 2: Assessment Settings**
```
Title: CIA-1 Remedial Assessment
Description: Improvement test for weak students in CO1 and CO2
Total Time: 45 minutes
Due Date: 2025-01-20
Allow Retake: Yes
Max Attempts: 2
Shuffle Questions: Yes
```

**Step 3: Generate CO1 Questions**
```
1. Load Materials for CO1
   - Material 1: "Chapter 1 - Arrays and Searching.pdf"
   - Material 2: "Lecture Notes - Binary Search.pdf"

2. Select Materials: Both checked

3. Enter Topics: "Arrays, Binary Search, Linear Search, Time Complexity"

4. Click "Generate 5 Questions"
   - Backend extracts 50 pages of text
   - Creates 250 chunks
   - Searches for "Arrays Binary Search" topics
   - Finds 10 relevant chunks
   - Generates 5 questions via Groq

5. Review Generated Questions:
   Q1: "What is the time complexity of binary search?"
   Q2: "Which data structure is used for binary search?"
   Q3: "In linear search, what is the worst-case scenario?"
   Q4: "How do you calculate the middle index in binary search?"
   Q5: "What is the prerequisite for binary search?"

6. Regenerate Q3 (too easy)
   - New question generated excluding Q1-Q5
```

**Step 4: Generate CO2 Questions**
```
1. Load Materials for CO2
   - Material 3: "Chapter 2 - Linked Lists.pdf"
   - Material 4: "Stack Implementation.pdf"

2. Select Materials: Both checked

3. Enter Topics: "Linked Lists, Stack, Push, Pop"

4. Generate 5 Questions
   Q1: "What is a singly linked list?"
   Q2: "How do you insert at the beginning of a linked list?"
   Q3: "What is the difference between stack and queue?"
   Q4: "Implement push operation in stack"
   Q5: "What is stack overflow?"
```

**Step 5: Review & Publish**
```
Summary:
- Total Questions: 10
- Total Marks: 20
- Time: 45 minutes
- Students: 2 (Ramesh, Vijay)
- COs: CO1 (5Q, 10M), CO2 (5Q, 10M)

Click "Publish Assessment"
- 2 TaskAssignments created
- Ramesh receives: 10 questions (5 CO1 + 5 CO2)
- Vijay receives: 10 questions (5 CO1 + 5 CO2)
```

## 🔧 Configuration & Environment

### Required Environment Variables
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://...
PORT=5000
```

### Dependencies
```json
{
  "groq-sdk": "^0.5.0",
  "pdf-parse": "^1.1.1",
  "express": "^4.18.2",
  "mongoose": "^8.0.0"
}
```

## 🐛 Troubleshooting

### Common Issues

**1. "No materials found for CO"**
- Ensure materials are uploaded with correct CO mapping
- Check if chapters have courseOutcome field set
- Verify material type is "PDF", "Document", or "Lecture Notes"

**2. "Could not extract text from PDF"**
- Verify PDF is not corrupted
- Check file exists on server
- Ensure PDF is text-based (not scanned images)

**3. "No relevant content found"**
- Topics may be too specific
- Try broader topic keywords
- Check if PDF contains relevant content

**4. "Failed to generate questions"**
- Verify GROQ_API_KEY is set
- Check API rate limits
- Ensure sufficient relevant content

**5. "Question validation failed"**
- LLM returned invalid JSON
- Retry generation
- Check prompt format

## 📊 Performance Metrics

### Question Generation Time
- Single CO (5 questions): 15-30 seconds
- Multiple materials: +5 seconds per material
- PDF text extraction: 2-5 seconds per PDF
- RAG search: < 1 second
- Groq API call: 10-20 seconds

### Optimization Tips
1. Pre-load materials in Step 1
2. Generate questions in parallel (future enhancement)
3. Cache extracted PDF text
4. Reuse vector store across COs

## 🚀 Future Enhancements

### Planned Features
1. **Bloom's Taxonomy Distribution**
   - Configure percentage per level
   - Ensure balanced cognitive levels

2. **Question Bank**
   - Save generated questions
   - Reuse across assessments
   - Build CO-specific question library

3. **Advanced RAG**
   - Use actual embeddings (OpenAI/HuggingFace)
   - Better semantic search
   - Cross-document context

4. **Collaborative Review**
   - Multiple faculty approval
   - Question rating system
   - Community question sharing

5. **Student Analytics**
   - Track question difficulty effectiveness
   - Identify problematic questions
   - Auto-adjust based on performance

6. **Bulk Operations**
   - Import questions from Word/Excel
   - Export to PDF/CSV
   - Mass regeneration

## 📚 API Documentation

### GET /api/materials/subject/:subjectId/co/:coNumber
**Description**: Get PDF materials for specific CO

**Parameters**:
- `subjectId` (path): Subject MongoDB ObjectId
- `coNumber` (path): CO number (1-5)

**Response**:
```json
{
  "success": true,
  "materials": [
    {
      "_id": "...",
      "title": "Chapter 1 - Arrays",
      "type": "PDF",
      "file": {...},
      "chapter": {...}
    }
  ],
  "chapters": [...],
  "message": "Found 5 materials for CO1"
}
```

### POST /api/mcq-generator/generate-co-specific
**Description**: Generate CO-specific questions from materials

**Body**:
```json
{
  "subjectId": "...",
  "courseOutcome": "CO1",
  "coNumber": 1,
  "materialIds": ["...", "..."],
  "topics": ["Arrays", "Binary Search"],
  "numberOfQuestions": 5,
  "difficulty": "Medium",
  "marksPerQuestion": 2
}
```

**Response**:
```json
{
  "success": true,
  "questions": [...],
  "metadata": {
    "courseOutcome": "CO1",
    "materialsProcessed": 2,
    "totalChunks": 250,
    "relevantChunks": 10,
    "topics": ["Arrays", "Binary Search"],
    "difficulty": "Medium",
    "requestedQuestions": 5,
    "generatedQuestions": 5
  }
}
```

### POST /api/mcq-generator/regenerate-single
**Description**: Regenerate one question

**Body**:
```json
{
  "subjectId": "...",
  "courseOutcome": "CO1",
  "materialIds": ["..."],
  "topics": ["Arrays"],
  "difficulty": "Medium",
  "marksPerQuestion": 2,
  "excludeQuestions": ["What is an array?", "..."]
}
```

**Response**:
```json
{
  "success": true,
  "question": {
    "question": "...",
    "options": [...],
    "correctAnswer": 1,
    "explanation": "...",
    "courseOutcome": "CO1"
  }
}
```

### POST /api/tasks/create-assessment-task
**Description**: Create assessment task for students

**Body**:
```json
{
  "title": "CIA-1 Remedial",
  "description": "...",
  "subjectId": "...",
  "subjectName": "Data Structures",
  "examType": "CIA1",
  "courseOutcomes": ["CO1", "CO2"],
  "studentIds": ["...", "..."],
  "questions": [...],
  "totalMarks": 20,
  "totalTime": 45,
  "startDateTime": "2025-01-15T10:00:00Z",
  "dueDateTime": "2025-01-20T23:59:00Z",
  "allowRetake": true,
  "maxAttempts": 2,
  "shuffleQuestions": true,
  "showResultsImmediately": false,
  "coBreakdown": [...]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Assessment assigned to 2 student(s)",
  "tasks": [...],
  "summary": {
    "totalTasks": 2,
    "totalQuestions": 10,
    "totalMarks": 20,
    "courseOutcomes": ["CO1", "CO2"],
    "coBreakdown": [...]
  }
}
```

## ✅ Testing Checklist

### Manual Testing
- [ ] Open COBasedStudentIdentification
- [ ] Select exam type (CIA1)
- [ ] Set threshold to 50%
- [ ] Select students with weak COs
- [ ] Click "Assessment Wizard"
- [ ] Verify wizard opens with correct exam type
- [ ] Configure CO1: 5 questions, 2 marks each
- [ ] Configure CO2: 5 questions, 2 marks each
- [ ] Set assessment title and deadline
- [ ] Load materials for CO1
- [ ] Select 2 materials
- [ ] Enter topics: "Arrays, Searching"
- [ ] Generate 5 questions for CO1
- [ ] Verify questions displayed correctly
- [ ] Regenerate one question
- [ ] Load materials for CO2
- [ ] Generate 5 questions for CO2
- [ ] Review step: verify summary
- [ ] Publish assessment
- [ ] Verify success notification
- [ ] Check database for TaskAssignment documents

## 🎓 Summary

The Task Assessment Wizard provides a modern, step-by-step approach to creating CO-specific assessments with AI-generated questions from uploaded materials. Key improvements over the old system:

1. **Separate CO handling** - Questions generated independently for each CO
2. **Material-based RAG** - Questions derived from actual course materials
3. **Better UX** - Clear wizard flow instead of single-page overload
4. **More control** - Faculty can configure everything per CO
5. **AI-powered** - Uses Groq Llama 3.3 70B for intelligent question generation
6. **Flexible** - Edit, regenerate, or delete questions before publishing

This system ensures high-quality, relevant assessments tailored to each student's weak areas.
