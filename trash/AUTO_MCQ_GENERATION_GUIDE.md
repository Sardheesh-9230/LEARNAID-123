# Automatic MCQ Generation from Chapter Materials

## 🎯 Overview

The system now **automatically generates MCQs from chapter materials** when teachers assign improvement tasks to students. This eliminates the manual step of creating MCQs separately and provides immediate, contextually relevant questions based on the student's weak areas.

## 🔄 How It Works

### Previous Flow (Manual)
1. Teacher assigns improvement task
2. System marks task as "needs MCQ generation"
3. Teacher manually generates MCQs later
4. Student receives task without immediate questions

### New Flow (Automatic)
1. Teacher assigns improvement task
2. **System automatically generates MCQs from chapter materials**
3. MCQs are stored in MCQSession and linked to task
4. Student receives task with ready-to-use MCQs immediately

## 📋 Generation Process

### Step 1: Material Selection
```javascript
// Find chapters for the subject
const chapters = await Chapter.find({ subject: subjectId })

// Find materials matching weak areas (prioritized)
materials = await Material.find({
  subject: subjectId,
  $or: [
    { title: { $regex: weakAreaPattern, $options: 'i' } },
    { description: { $regex: weakAreaPattern, $options: 'i' } }
  ],
  pdfPath: { $exists: true, $ne: null }
}).limit(3)

// Fallback: Get any materials if no weak area matches
if (materials.length === 0) {
  materials = await Material.find({
    subject: subjectId,
    pdfPath: { $exists: true, $ne: null }
  }).limit(3)
}
```

### Step 2: PDF Text Extraction
```javascript
// Extract text from PDF using multiple strategies
const textContent = await extractTextFromPDF(pdfPath)

// Strategies used:
// 1. pdf-parse with custom options (max pages, version support)
// 2. pdftotext command-line fallback
// 3. Error handling for corrupted PDFs
```

### Step 3: Text Chunking
```javascript
// Create overlapping chunks for better context
const chunks = chunkText(textContent, 1000, 200)

// Parameters:
// - chunkSize: 1000 characters per chunk
// - overlap: 200 characters between chunks
// - Sentence-based splitting (preserves context)
```

### Step 4: RAG (Retrieval-Augmented Generation)
```javascript
// Initialize vector store
const vectorStore = new EnhancedVectorStore()
vectorStore.addDocuments(chunks)

// Search for relevant chunks based on weak areas/CO
const relevantChunks = vectorStore.search(topics, 5)

// Scoring algorithm:
// - Keyword matching
// - Frequency analysis
// - Semantic relevance
```

### Step 5: MCQ Generation via Groq API
```javascript
// Prepare prompt with relevant content
const prompt = `Generate ${numberOfQuestions} MCQs
Focused on: ${topics}
Difficulty: ${difficulty}
Content: ${relevantContent}

Requirements:
- 4 options (A, B, C, D)
- Correct answer with explanation
- Bloom's taxonomy level
- Clear and unambiguous wording`

// Call Groq API
const completion = await groq.chat.completions.create({
  messages: [{ role: 'user', content: prompt }],
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  max_tokens: 4000
})
```

### Step 6: Validation & Storage
```javascript
// Validate MCQs
const validMCQs = mcqs.filter(mcq => {
  return mcq.question && 
         Array.isArray(mcq.options) && 
         mcq.options.length === 4 &&
         ['A', 'B', 'C', 'D'].includes(mcq.correctAnswer)
})

// Create MCQ session
const session = await MCQSession.create({
  subject: material.subject,
  chapter: material.chapter,
  material: materialId,
  title: `Auto-generated MCQs - ${topics}`,
  questions: validMCQs,
  difficulty: difficulty,
  timeLimit: validMCQs.length * 2,
  passingScore: 60,
  createdBy: userId,
  status: 'completed'
})

// Link to improvement task
const improvementTask = new ImprovementTask({
  ...taskData,
  mcqData: {
    totalQuestions: validMCQs.length,
    sessionId: session._id,
    questions: validMCQs,
    materialUsed: material.title,
    generatedAt: new Date()
  }
})
```

## 🎨 Frontend Integration

### Teacher Dashboard - MCQ Manager Tab

Teachers can still access the MCQ Manager through the existing tab:

```typescript
// Teacher Dashboard tabs
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'students', label: 'Students' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'mcq', label: 'MCQ Generator' },
  { id: 'mcq-manager', label: 'MCQ Task Manager' }, // ← Integration tab
  { id: 'tasks', label: 'Tasks' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'schedule', label: 'Schedule' }
]
```

### Student Dashboard - MCQ Status Display

Students see MCQ availability in their improvement tasks:

```typescript
// MCQ Status Indicators
if (task.mcqData?.sessionId) {
  // ✅ MCQs ready
  <Badge variant="success">
    {task.mcqData.totalQuestions} MCQs Ready
  </Badge>
  <Button onClick={() => startMCQTest(task.mcqData.sessionId)}>
    Start Practice
  </Button>
} else if (task.mcqData?.needsGeneration) {
  // ⏳ MCQs generating
  <Badge variant="warning">
    MCQs Being Generated
  </Badge>
  <Text>{task.mcqData.message}</Text>
}
```

## 🔧 Error Handling

### Graceful Fallbacks

The system handles various error scenarios:

1. **No Materials Found**
   ```javascript
   generatedMCQData = {
     totalQuestions: 0,
     needsGeneration: true,
     message: 'No PDF materials available for MCQ generation. 
              Please upload study materials first.'
   }
   ```

2. **No Chapters Found**
   ```javascript
   generatedMCQData = {
     totalQuestions: 0,
     needsGeneration: true,
     message: 'No chapters found for this subject. 
              Please set up chapters and materials first.'
   }
   ```

3. **PDF Extraction Failed**
   ```javascript
   generatedMCQData = {
     totalQuestions: 0,
     needsGeneration: true,
     message: 'Could not extract text from PDF',
     error: extractionError.message
   }
   ```

4. **MCQ Generation Failed**
   ```javascript
   generatedMCQData = {
     totalQuestions: 0,
     needsGeneration: true,
     message: 'MCQ generation failed, please try again',
     error: mcqResult.error
   }
   ```

5. **General Errors**
   ```javascript
   generatedMCQData = {
     totalQuestions: 0,
     needsGeneration: true,
     message: 'MCQ generation encountered an error. 
              Please try again later.',
     error: generationError.message
   }
   ```

## 📊 Response Structures

### Success Response
```javascript
{
  success: true,
  data: {
    task: {
      _id: "task123",
      title: "CO1 Performance Improvement",
      mcqData: {
        totalQuestions: 10,
        sessionId: "session456",
        questions: [...],
        difficultyLevel: "medium",
        focusedCO: "CO1",
        estimatedTime: 20,
        areas: ["arrays", "sorting"],
        generatedAt: "2025-01-27T10:00:00Z",
        generatedBy: "teacher123",
        materialUsed: "Chapter 5: Data Structures"
      }
    }
  }
}
```

### Fallback Response (Needs Generation)
```javascript
{
  success: true,
  data: {
    task: {
      _id: "task123",
      title: "CO1 Performance Improvement",
      mcqData: {
        totalQuestions: 0,
        needsGeneration: true,
        difficultyLevel: "medium",
        focusedCO: "CO1",
        numberOfQuestions: 10,
        areas: ["arrays", "sorting"],
        message: "No PDF materials available for MCQ generation. 
                 Please upload study materials first."
      }
    }
  }
}
```

## 🎯 Generation Quality

### MCQ Validation Rules

Each generated MCQ must pass validation:

```javascript
const validationRules = {
  hasQuestion: mcq.question !== undefined,
  hasOptions: Array.isArray(mcq.options),
  correctOptionCount: mcq.options.length === 4,
  hasCorrectAnswer: mcq.correctAnswer !== undefined,
  validAnswer: ['A', 'B', 'C', 'D'].includes(mcq.correctAnswer),
  hasExplanation: mcq.explanation !== undefined
}
```

### Bloom's Taxonomy Levels

Generated MCQs are tagged with Bloom's levels:

- **Remember**: Recall facts and basic concepts
- **Understand**: Explain ideas or concepts
- **Apply**: Use information in new situations
- **Analyze**: Draw connections among ideas
- **Evaluate**: Justify a decision or course of action
- **Create**: Produce new or original work

## 📈 Benefits

### For Teachers
- ✅ **Instant MCQ Generation**: No manual creation needed
- ✅ **Context-Aware Questions**: Based on student's weak areas
- ✅ **Automatic CO Alignment**: Questions match course outcomes
- ✅ **Quality Assurance**: All MCQs validated before storage
- ✅ **Time Savings**: Focus on teaching, not question writing

### For Students
- ✅ **Immediate Practice**: MCQs ready when task assigned
- ✅ **Relevant Content**: Questions from their study materials
- ✅ **Targeted Learning**: Focused on their weak areas
- ✅ **Clear Feedback**: Explanations for each answer
- ✅ **Progress Tracking**: Performance metrics available

### For System
- ✅ **Automated Workflow**: End-to-end automation
- ✅ **Scalable**: Handles multiple concurrent generations
- ✅ **Error Resilient**: Graceful fallbacks at each step
- ✅ **Audit Trail**: All generations logged and tracked
- ✅ **Resource Efficient**: Reuses existing materials

## 🔍 Monitoring & Logging

### Console Output

The system provides detailed logging:

```
🔄 No existing MCQs found, generating from chapter materials...
📚 Generating MCQs from material: Chapter 5: Data Structures
📄 Extracting text from PDF: /path/to/material.pdf
📝 Extracted 15234 characters from PDF
📚 Created 18 chunks
🔍 Found 5 relevant chunks
🤖 Calling Groq API...
📥 Received response from Groq
✅ Generated 10 valid MCQs
💾 Created MCQ session: 60a7f12e8b3c4d2e1f8a9b0c
```

### Error Logging

All errors are logged with context:

```
❌ Error during MCQ generation: PDF extraction failed
⚠️ No PDF materials found for subject
⚠️ No chapters found for subject
```

## 🚀 Testing

### Manual Testing Steps

1. **Setup Materials**
   - Upload PDF materials for a subject
   - Ensure materials are linked to chapters
   - Verify PDF files are accessible

2. **Assign Task**
   - Select students with low CO performance
   - Choose weak areas (e.g., "arrays", "sorting")
   - Set difficulty level (easy/medium/hard)
   - Specify number of questions (5-20)

3. **Verify Generation**
   - Check console logs for generation progress
   - Confirm MCQ session created
   - Verify task has `mcqData` populated
   - Check student dashboard shows "MCQs Ready"

4. **Test Fallbacks**
   - Assign task with no materials → Check error message
   - Use corrupted PDF → Verify fallback extraction
   - Generate with no relevant content → Check handling

### API Testing

```bash
# Assign CO-specific task (triggers MCQ generation)
POST http://localhost:5001/api/improvement-tasks/assign-co-specific
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
Body: {
  "studentId": "student123",
  "subjectId": "subject456",
  "courseOutcome": "CO1",
  "coNumber": 1,
  "weakAreas": ["arrays", "sorting"],
  "currentPerformance": 45,
  "numberOfQuestions": 10,
  "difficultyLevel": "medium",
  "description": "Improve CO1 performance"
}

# Expected Response
{
  "success": true,
  "data": {
    "task": {
      "mcqData": {
        "totalQuestions": 10,
        "sessionId": "...",
        "questions": [...],
        "materialUsed": "Chapter 5: Data Structures"
      }
    }
  }
}
```

## 🔐 Security Considerations

- ✅ User authentication required for task assignment
- ✅ Material access restricted to authorized users
- ✅ PDF file paths validated before reading
- ✅ Groq API key stored in environment variables
- ✅ Error messages sanitized (no sensitive info exposed)

## 🎓 Future Enhancements

### Planned Improvements

1. **Async Generation**
   - Queue-based MCQ generation for large batches
   - WebSocket notifications when MCQs ready
   - Progress indicators during generation

2. **Enhanced RAG**
   - Better semantic search algorithms
   - Multi-document MCQ generation
   - Cross-chapter question generation

3. **Quality Metrics**
   - Difficulty estimation from student performance
   - Automatic question quality scoring
   - Duplicate question detection

4. **Teacher Controls**
   - Review generated MCQs before assignment
   - Edit/regenerate individual questions
   - Custom generation prompts

5. **Analytics Dashboard**
   - MCQ generation success rates
   - Material coverage analysis
   - Question difficulty distribution
   - Student performance by MCQ source

## 📞 Troubleshooting

### Common Issues

**Issue**: MCQs not generating
- **Check**: Materials with PDFs exist
- **Check**: Groq API key configured
- **Check**: PDF files accessible

**Issue**: Poor quality MCQs
- **Check**: PDF text extraction quality
- **Check**: Relevant chunks found (min 3-5)
- **Check**: Topics/weak areas specific enough

**Issue**: Generation timeout
- **Check**: PDF file size (should be < 50MB)
- **Check**: Groq API rate limits
- **Check**: Network connectivity

## 📝 Summary

The automatic MCQ generation feature transforms the improvement task workflow by:

1. **Eliminating manual MCQ creation**
2. **Providing instant, relevant questions**
3. **Leveraging existing study materials**
4. **Ensuring quality through validation**
5. **Gracefully handling edge cases**

This creates a seamless experience where teachers can assign tasks with confidence that students will receive high-quality, contextually relevant practice questions immediately.

---

**Last Updated**: January 27, 2025  
**Version**: 3.0  
**Status**: ✅ Production Ready
