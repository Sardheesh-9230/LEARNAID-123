# MCQ Generator & Task Manager Integration Guide

## Overview
This guide explains the complete integration between the MCQ Generator and the Improvement Task Manager system in LearnAID. This integration allows faculty to generate MCQs from study materials and automatically assign them to students as improvement tasks.

## System Architecture

### Components

#### 1. **FacultyMCQTaskIntegration Component**
- **Location**: `src/components/FacultyMCQTaskIntegration.tsx`
- **Purpose**: Unified interface for MCQ generation and task management
- **Features**:
  - Overview dashboard with statistics
  - MCQ generation interface
  - Task monitoring and management
  - Real-time status tracking

#### 2. **Backend Routes**
- **MCQ Generator Routes**: `backend/src/routes/mcqGeneratorV3.js`
  - `/api/mcq-generator/sessions/subject/:subjectId` - Fetch MCQ sessions
  - `/api/mcq-generator/generate` - Generate new MCQs
  
- **Improvement Task Routes**: `backend/src/routes/improvementTasks.js`
  - `/api/improvement-tasks/subject/:subjectId` - Fetch tasks by subject
  - `/api/improvement-tasks/assign-co-specific` - Assign CO-specific tasks

- **Materials Routes**: `backend/src/routes/materials.js`
  - `/api/materials/subjects/:subjectId/materials` - Fetch materials for subject

#### 3. **Data Models**

**MCQSession Model**:
```javascript
{
  title: String,
  subject: ObjectId (ref: 'Subject'),
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    difficulty: String,
    bloomsLevel: String,
    explanation: String
  }],
  status: String, // 'draft', 'completed'
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date
}
```

**ImprovementTask Model** (Enhanced):
```javascript
{
  student: ObjectId (ref: 'User'),
  subject: ObjectId (ref: 'Subject'),
  courseOutcome: String,
  coNumber: Number,
  weakAreas: [String],
  status: String, // 'assigned', 'in-progress', 'completed'
  metadata: {
    generatedMCQs: {
      sessionId: ObjectId (ref: 'MCQSession'),
      totalQuestions: Number,
      needsGeneration: Boolean,
      difficultyLevel: String,
      questions: [{
        id: String,
        question: String,
        options: [String],
        correctAnswer: Number,
        difficulty: String,
        courseOutcome: String
      }]
    }
  },
  teacherSettings: {
    difficultyLevel: String,
    numberOfQuestions: Number,
    focusAreas: [String],
    dueDate: Date
  }
}
```

## Features

### 1. Overview Dashboard
The overview tab provides a comprehensive view of:
- **Statistics Cards**:
  - Total materials available for MCQ generation
  - Number of MCQ sessions created
  - Tasks with MCQs assigned
  - Tasks needing MCQ generation
  
- **Recent MCQ Sessions**:
  - List of latest 5 MCQ sessions
  - Question count and status
  - Creation date and time
  
- **Tasks Needing MCQs**:
  - Alert section showing tasks awaiting MCQ generation
  - Student names and weak areas
  - Quick action prompts

### 2. MCQ Generation Interface
Faculty can generate MCQs with:
- **Material Selection**: Choose from available PDF materials
- **Topic Specification**: Optional comma-separated topics
- **Difficulty Levels**: Easy, Medium, Hard
- **Question Count**: Slider from 5 to 50 questions
- **AI-Powered Generation**: Uses OpenAI to create contextual questions

**Generation Process**:
1. Faculty selects material and configures settings
2. System extracts PDF content
3. AI generates questions based on topics
4. MCQs are stored in MCQSession
5. Available for assignment to improvement tasks

### 3. Task Management
Monitor and manage improvement tasks:
- **Task List View**:
  - Student information (name, registration number)
  - Course outcomes and weak areas
  - MCQ assignment status
  - Task completion status
  
- **Status Indicators**:
  - ✅ **With MCQs**: Green badge showing question count
  - ⚠️ **Needs MCQs**: Orange badge indicating generation required
  - ⚪ **No MCQs**: Gray badge for tasks without MCQs

## Workflow

### Complete MCQ-Task Integration Flow

```
1. CO-Based Student Identification
   ↓
2. Teacher Configures Task Settings
   - Difficulty level
   - Number of questions
   - Due date
   ↓
3. System Checks for Existing MCQs
   ├─ MCQs Found → Filter by difficulty → Assign to task
   └─ MCQs Not Found → Mark task as "Needs Generation"
   ↓
4. Faculty Opens MCQ-Task Integration
   ↓
5. Overview Shows Tasks Needing MCQs
   ↓
6. Faculty Generates MCQs
   - Select material
   - Configure settings
   - Generate using AI
   ↓
7. MCQs Automatically Available for Tasks
   ↓
8. Students Receive Tasks with MCQs
```

## API Endpoints

### Fetch Materials for Subject
```http
GET /api/materials/subjects/:subjectId/materials
Authorization: Bearer <token>

Response:
{
  "success": true,
  "materials": [{
    "_id": "...",
    "title": "Introduction to Programming",
    "subject": {...},
    "chapter": {...},
    "pdfPath": "...",
    "createdAt": "..."
  }]
}
```

### Fetch MCQ Sessions
```http
GET /api/mcq-generator/sessions/subject/:subjectId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "sessions": [{
    "_id": "...",
    "title": "Programming MCQs",
    "subject": {...},
    "questions": [...],
    "status": "completed",
    "createdAt": "..."
  }]
}
```

### Generate MCQs
```http
POST /api/mcq-generator/generate
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "materialId": "64abc123...",
  "topics": "loops, functions, arrays",
  "numberOfQuestions": 10,
  "difficulty": "medium"
}

Response:
{
  "success": true,
  "session": {
    "_id": "...",
    "title": "Generated MCQs",
    "questions": [...],
    "status": "completed"
  }
}
```

### Fetch Improvement Tasks by Subject
```http
GET /api/improvement-tasks/subject/:subjectId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5,
  "tasks": [{
    "_id": "...",
    "student": {...},
    "subject": {...},
    "courseOutcome": "CO1",
    "weakAreas": ["loops", "conditionals"],
    "status": "assigned",
    "metadata": {
      "generatedMCQs": {
        "sessionId": "...",
        "totalQuestions": 10,
        "needsGeneration": false
      }
    }
  }]
}
```

### Assign CO-Specific Tasks (with MCQ Integration)
```http
POST /api/improvement-tasks/assign-co-specific
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "subjectId": "64abc...",
  "courseOutcome": "CO1",
  "coNumber": 1,
  "weakAreas": ["loops", "arrays"],
  "studentsData": [{
    "studentId": "64def...",
    "performance": 45
  }],
  "teacherSettings": {
    "difficultyLevel": "Medium",
    "numberOfQuestions": 10,
    "focusAreas": ["loops"],
    "dueDate": "2024-02-01"
  }
}

Response:
{
  "success": true,
  "assignedTasks": 5,
  "message": "Tasks assigned successfully with MCQs",
  "tasks": [...]
}
```

## User Interface

### Accessing MCQ-Task Integration

1. **From Teacher Dashboard**:
   - Click on any subject card
   - Subject details modal appears
   - Click **"🧠 MCQ Generator & Tasks"** button
   - Integration interface opens

2. **Navigation Tabs**:
   - **Overview**: Dashboard with statistics and alerts
   - **Generate MCQs**: Create new MCQ sessions
   - **Tasks**: View and manage all tasks

### UI Color Coding

- **Blue**: Materials and general information
- **Purple**: MCQ sessions and generation
- **Green**: Tasks with MCQs successfully assigned
- **Orange**: Tasks needing MCQ generation
- **Gray**: Inactive or pending items

## Best Practices

### For Faculty

1. **Generate MCQs Proactively**:
   - Create MCQ banks before identifying lagging students
   - Generate multiple difficulty levels
   - Cover all course topics

2. **Regular Monitoring**:
   - Check "Tasks Needing MCQs" section regularly
   - Generate missing MCQs promptly
   - Monitor student progress on assigned tasks

3. **Quality Control**:
   - Review generated MCQs before large-scale assignment
   - Adjust difficulty based on student performance
   - Update MCQs based on feedback

### For System Integration

1. **MCQ Reusability**:
   - MCQs are stored in sessions and reused
   - Same MCQ session can serve multiple tasks
   - Reduces generation costs and time

2. **Smart Filtering**:
   - System filters MCQs by difficulty automatically
   - Randomizes question selection for fairness
   - Falls back to all questions if specific difficulty unavailable

3. **Status Tracking**:
   - Clear indicators for MCQ generation status
   - Real-time updates on task assignments
   - Audit trail for accountability

## Troubleshooting

### Common Issues

**Issue: "No materials found for subject"**
- **Solution**: Upload PDF materials to the subject first
- Use Materials Management interface to add content

**Issue: "MCQs not appearing in tasks"**
- **Solution**: Check MCQ session status is "completed"
- Verify subject ID matches between MCQs and tasks

**Issue: "Generation taking too long"**
- **Solution**: Reduce number of questions
- Check PDF file size (large PDFs take longer)
- Verify OpenAI API key is configured

**Issue: "Tasks show 'Needs MCQs' after generation"**
- **Solution**: Reload the integration interface
- Check MCQ session was created successfully
- Manually reassign tasks if needed

## Future Enhancements

### Planned Features
1. **Bulk MCQ Generation**: Generate for multiple materials at once
2. **Question Bank**: Pre-built MCQs for common topics
3. **Adaptive Difficulty**: Automatically adjust based on student performance
4. **Analytics**: Track MCQ effectiveness and student improvement
5. **Collaboration**: Share MCQ sessions between faculty
6. **Export/Import**: Bulk operations for MCQ management

### Integration Roadmap
1. **Phase 1** (Current): Basic MCQ-Task integration
2. **Phase 2**: Automated task assignment with MCQ generation
3. **Phase 3**: Intelligent MCQ selection based on learning patterns
4. **Phase 4**: Collaborative MCQ banks across departments

## Technical Notes

### Performance Considerations
- MCQ sessions are cached to reduce database queries
- Pagination implemented for large task lists
- Lazy loading for material selection dropdown

### Security
- All endpoints protected with JWT authentication
- Role-based access control (Faculty/Admin only)
- Input validation on all MCQ generation parameters

### Database Optimization
- Indexed fields: subject, student, status, createdAt
- Populated references for efficient queries
- Aggregation pipelines for statistics

## Support

### Getting Help
- **Documentation**: Refer to this guide and API docs
- **Technical Issues**: Contact system administrator
- **Feature Requests**: Submit via feedback form

### Contact
- **Development Team**: GitHub Issues
- **Faculty Support**: help@learnaid.edu
- **Training**: Schedule via Faculty Development Center

---

## Version History
- **v3.0** (Current): Full MCQ-Task integration with AI generation
- **v2.0**: CO-based student identification
- **v1.0**: Basic task management

**Last Updated**: January 2024
**Maintained By**: LearnAID Development Team
