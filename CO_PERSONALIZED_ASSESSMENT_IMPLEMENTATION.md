# CO-Based Personalized Assessment Implementation

## Overview
Implemented personalized CO-based assessment system where **ONE task** is created for multiple students, but each student receives **personalized questions** based on their **weak COs**.

---

## Problem Statement

### BEFORE (INCORRECT):
- Created separate tasks for each student
- All students got same questions
- Faculty dashboard showed duplicate tasks
- Example: Task for Student A + Task for Student B = 2 tasks

### AFTER (CORRECT):
- Create **ONE task** assigned to multiple students
- **Student A** weak in CO1+CO2 → gets 20 questions (20 marks)
- **Student B** weak in CO1 only → gets 10 questions (10 marks)
- Faculty dashboard shows **1 task** with "Assigned to 2 students"

---

## Technical Changes

### 1. **Database Model** (`ImprovementTask.js`)

Added `studentAssignments` array to support multi-student personalization:

```javascript
studentAssignments: [{
  student: ObjectId,              // Student reference
  weakCOs: [{
    courseOutcome: String,        // e.g., "CO1"
    coNumber: Number,             // e.g., 1
    performanceGap: Number,       // e.g., 25.5
    topics: [String]              // e.g., ["Arrays", "Loops"]
  }],
  personalizedQuestions: [{       // ONLY questions for THIS student's weak COs
    id: String,
    question: String,
    options: [String],
    correctAnswer: Mixed,
    explanation: String,
    courseOutcome: String,
    coNumber: Number,
    topics: [String],
    marks: Number,
    difficulty: String,
    bloomsLevel: String
  }],
  totalMarks: Number,             // Total marks for THIS student
  status: String,                 // Status for THIS student
  scores: [{                      // Attempt history for THIS student
    score: Number,
    percentage: Number,
    timestamp: Date,
    attemptNumber: Number
  }],
  attemptCount: Number
}]
```

Made `student` field conditional:
- Required if `studentAssignments` is empty (single-student tasks)
- Optional if `studentAssignments` has data (multi-student tasks)

---

### 2. **Backend Controller** (`taskAssessmentController.js`)

#### OLD API Contract:
```javascript
POST /api/tasks/create-assessment-task
{
  studentIds: ["id1", "id2"],
  questions: [...],  // Same questions for all
  totalMarks: 20
}
```

#### NEW API Contract:
```javascript
POST /api/tasks/create-assessment-task
{
  studentAssignments: [
    {
      studentId: "id1",
      weakCOs: [
        { courseOutcome: "CO1", coNumber: 1, performanceGap: 30, topics: ["Arrays"] },
        { courseOutcome: "CO2", coNumber: 2, performanceGap: 25, topics: ["Loops"] }
      ],
      questions: [...],  // 20 questions for CO1+CO2
      totalMarks: 20
    },
    {
      studentId: "id2",
      weakCOs: [
        { courseOutcome: "CO1", coNumber: 1, performanceGap: 28, topics: ["Arrays"] }
      ],
      questions: [...],  // 10 questions for CO1 only
      totalMarks: 10
    }
  ]
}
```

#### Controller Logic:
```javascript
// Create ONE task with multiple student assignments
const task = await ImprovementTask.create({
  title: "CIA-1 Assessment",
  taskType: 'CO_ASSESSMENT',
  subject: subjectId,
  assignedBy: facultyId,
  dueDate: dueDateTime,
  
  // Multi-student assignments array
  studentAssignments: [
    {
      student: studentId1,
      weakCOs: [...],
      personalizedQuestions: [...]  // 20 questions
    },
    {
      student: studentId2,
      weakCOs: [...],
      personalizedQuestions: [...]  // 10 questions
    }
  ]
})
```

**Result**: Creates 1 document instead of N documents

---

### 3. **Frontend Wizard** (`TaskAssessmentWizard.tsx`)

Updated `publishAssessment()` function to build personalized assignments:

```javascript
const studentAssignments = studentDetails.map(student => {
  // Get this student's weak CO numbers
  const studentWeakCONumbers = student.weakCOs.map(co => co.coNumber)
  
  // Filter questions for ONLY this student's weak COs
  const studentQuestions = coConfigs
    .filter(config => studentWeakCONumbers.includes(config.coNumber))
    .flatMap(config => config.generatedQuestions)
  
  // Calculate marks for this student
  const studentTotalMarks = coConfigs
    .filter(config => studentWeakCONumbers.includes(config.coNumber))
    .reduce((sum, config) => sum + config.totalMarks, 0)
  
  return {
    studentId: student.studentId,
    weakCOs: student.weakCOs,
    questions: studentQuestions,    // Personalized questions
    totalMarks: studentTotalMarks   // Personalized total
  }
})
```

**Example Output**:
```javascript
[
  {
    studentId: "67a123",
    weakCOs: [{ courseOutcome: "CO1", coNumber: 1 }, { courseOutcome: "CO2", coNumber: 2 }],
    questions: [Q1, Q2, ..., Q20],  // 20 questions
    totalMarks: 20
  },
  {
    studentId: "67a456",
    weakCOs: [{ courseOutcome: "CO1", coNumber: 1 }],
    questions: [Q1, Q2, ..., Q10],  // 10 questions
    totalMarks: 10
  }
]
```

---

### 4. **Faculty Dashboard** (`/api/improvement-tasks/faculty/my-tasks`)

Updated endpoint to properly display multi-student tasks:

```javascript
const transformedTasks = tasks.map(task => {
  if (task.studentAssignments && task.studentAssignments.length > 0) {
    return {
      ...task,
      isMultiStudent: true,
      assignedStudentCount: task.studentAssignments.length,
      assignedStudents: task.studentAssignments.map(a => ({
        student: a.student,
        weakCOs: a.weakCOs.map(co => co.courseOutcome),
        questionsCount: a.personalizedQuestions.length,
        totalMarks: a.totalMarks,
        status: a.status
      }))
    }
  }
  return task
})
```

**Display**:
- Old: "Task 1 (Student A)", "Task 2 (Student B)"
- New: "Task 1 (Assigned to 2 students)"

---

### 5. **Student Dashboard** (`/api/improvement-tasks/student/:studentId/improvement`)

Updated to show ONLY student's personalized questions:

```javascript
const personalizedTasks = tasks.map(task => {
  if (task.studentAssignments && task.studentAssignments.length > 0) {
    // Find THIS student's assignment
    const studentAssignment = task.studentAssignments.find(
      a => a.student._id.toString() === studentId
    )
    
    return {
      ...task,
      personalizedData: {
        weakCOs: studentAssignment.weakCOs,
        questions: studentAssignment.personalizedQuestions,
        totalMarks: studentAssignment.totalMarks
      },
      // Override metadata to show only THIS student's questions
      metadata: {
        ...task.metadata,
        generatedMCQs: {
          totalQuestions: studentAssignment.personalizedQuestions.length,
          questions: studentAssignment.personalizedQuestions
        }
      }
    }
  }
  return task
})
```

**Result**:
- Student A sees: 20 questions (CO1 + CO2)
- Student B sees: 10 questions (CO1 only)

---

## How It Works - Complete Flow

### 1. **Faculty Analyzes Students**
```
Faculty → CO-Based Student Identification
         → Select Students (Ramesh, Vijay)
         → Ramesh: weak in CO1, CO2 (gap: 30%, 25%)
         → Vijay: weak in CO1 only (gap: 28%)
```

### 2. **Faculty Creates Assessment**
```
Faculty → Configure CO1 (10 questions, 10 marks)
         → Configure CO2 (10 questions, 10 marks)
         → Generate questions
         → Publish Assessment
```

### 3. **Backend Processes**
```
TaskAssessmentWizard sends:
{
  studentAssignments: [
    {
      studentId: "ramesh",
      weakCOs: [CO1, CO2],
      questions: [Q1-Q20],
      totalMarks: 20
    },
    {
      studentId: "vijay",
      weakCOs: [CO1],
      questions: [Q1-Q10],
      totalMarks: 10
    }
  ]
}

Backend creates 1 ImprovementTask:
{
  _id: "task123",
  title: "CIA-1 Assessment",
  studentAssignments: [
    { student: ramesh, questions: 20, marks: 20 },
    { student: vijay, questions: 10, marks: 10 }
  ]
}
```

### 4. **Faculty Views Task**
```
Faculty Dashboard:
┌─────────────────────────────────────┐
│ CIA-1 Assessment                    │
│ Subject: Predictive Modelling       │
│ Assigned to: 2 students             │
│ Due: Dec 18, 2025                   │
│                                     │
│ Students:                           │
│  • Ramesh (CO1, CO2) - 20 marks    │
│  • Vijay (CO1) - 10 marks          │
└─────────────────────────────────────┘
```

### 5. **Students View Task**

**Ramesh sees:**
```
┌─────────────────────────────────────┐
│ CIA-1 Assessment                    │
│ Total Questions: 20                 │
│ Total Marks: 20                     │
│ Weak COs: CO1, CO2                  │
│                                     │
│ [Start Test]                        │
└─────────────────────────────────────┘
```

**Vijay sees:**
```
┌─────────────────────────────────────┐
│ CIA-1 Assessment                    │
│ Total Questions: 10                 │
│ Total Marks: 10                     │
│ Weak COs: CO1                       │
│                                     │
│ [Start Test]                        │
└─────────────────────────────────────┘
```

---

## Database Structure Example

```javascript
{
  "_id": "693d906d7f0d3ea9884c378c",
  "title": "CIA-1 Assessment",
  "taskType": "CO_ASSESSMENT",
  "subject": "ADI1304",
  "assignedBy": "faculty123",
  "dueDate": "2025-12-18",
  
  // NO single 'student' field for multi-student tasks
  "student": null,
  
  // Multi-student assignments
  "studentAssignments": [
    {
      "student": "67a123ramesh",
      "weakCOs": [
        { "courseOutcome": "CO1", "coNumber": 1, "performanceGap": 30, "topics": ["Arrays"] },
        { "courseOutcome": "CO2", "coNumber": 2, "performanceGap": 25, "topics": ["Loops"] }
      ],
      "personalizedQuestions": [
        { "id": "q_ramesh_1", "question": "What is an array?", "coNumber": 1, "marks": 1 },
        { "id": "q_ramesh_2", "question": "Array indexing?", "coNumber": 1, "marks": 1 },
        // ... 18 more questions
      ],
      "totalMarks": 20,
      "status": "Assigned",
      "attemptCount": 0,
      "scores": []
    },
    {
      "student": "67a456vijay",
      "weakCOs": [
        { "courseOutcome": "CO1", "coNumber": 1, "performanceGap": 28, "topics": ["Arrays"] }
      ],
      "personalizedQuestions": [
        { "id": "q_vijay_1", "question": "What is an array?", "coNumber": 1, "marks": 1 },
        { "id": "q_vijay_2", "question": "Array indexing?", "coNumber": 1, "marks": 1 },
        // ... 8 more questions
      ],
      "totalMarks": 10,
      "status": "Assigned",
      "attemptCount": 0,
      "scores": []
    }
  ]
}
```

---

## Benefits

### 1. **Cleaner Database**
- Before: 100 students = 100 documents
- After: 100 students = 1 document

### 2. **Better Faculty Experience**
- See all students for a task in one view
- Compare performance across students easily
- No duplicate task entries

### 3. **Personalized for Students**
- Each student gets questions ONLY for THEIR weak COs
- Fair assessment based on individual needs
- Student A: 20 marks (CO1 + CO2)
- Student B: 10 marks (CO1 only)

### 4. **Accurate Reporting**
- Faculty dashboard shows "1 task, 100 students"
- Not "100 tasks, 100 students"

---

## Testing Instructions

### 1. **Delete Old Tasks**
```bash
cd backend
node delete-all-tasks.js
```

### 2. **Restart Backend**
```bash
cd backend
npm run dev
```

### 3. **Create New Assessment**
1. Login as Faculty
2. Go to Task Management → Create Task
3. Analyze CO Performance
4. Select 2 students:
   - Student A weak in CO1 + CO2
   - Student B weak in CO1 only
5. Configure:
   - CO1: 10 questions, 1 mark each
   - CO2: 10 questions, 1 mark each
6. Generate questions
7. Publish

### 4. **Verify Faculty View**
- Should show **1 task**
- "Assigned to 2 students"
- Expandable to see each student's details

### 5. **Verify Student View**
- Login as Student A → sees 20 questions (20 marks)
- Login as Student B → sees 10 questions (10 marks)

---

## API Endpoints Summary

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `POST /api/tasks/create-assessment-task` | Create multi-student task | 1 task with studentAssignments |
| `GET /api/improvement-tasks/faculty/my-tasks` | Faculty dashboard | Tasks with student count |
| `GET /api/improvement-tasks/student/:id/improvement` | Student dashboard | Only student's personalized questions |

---

## Files Modified

1. **backend/src/models/ImprovementTask.js**
   - Added `studentAssignments` array
   - Made `student` field conditional

2. **backend/src/controllers/taskAssessmentController.js**
   - Changed from `studentIds.map()` to single task creation
   - Accepts `studentAssignments` instead of `studentIds + questions`

3. **src/components/TaskAssessmentWizard.tsx**
   - Builds personalized `studentAssignments` array
   - Filters questions per student based on weak COs

4. **backend/src/routes/improvementTasks.js**
   - `/faculty/my-tasks`: Transforms tasks to show multi-student info
   - `/student/:id/improvement`: Filters to show only student's questions

---

## Date: December 13, 2025

**Status**: ✅ Complete and ready for testing
