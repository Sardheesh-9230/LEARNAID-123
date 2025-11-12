# API Testing Guide - Faculty Module

**Date**: October 20, 2025  
**Base URL**: `http://localhost:5000`

---

## 🔐 Prerequisites

### 1. Authentication
First, login to get JWT token:

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "faculty@example.com",
  "password": "your_password"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "faculty_id",
    "name": "Faculty Name",
    "email": "faculty@example.com",
    "role": "Faculty"
  }
}
```

### 2. Set Authorization Header
For all subsequent requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📚 Testing Workflow (Complete Faculty Module)

### Step 1: Create a Course

```bash
POST http://localhost:5000/api/courses
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Data Structures and Algorithms",
  "code": "CS201",
  "department": "DEPARTMENT_ID",
  "subject": "SUBJECT_ID",
  "description": "Comprehensive course on data structures",
  "academicYear": "2024-2025",
  "semester": "Odd",
  "year": "2nd Year",
  "section": "A",
  "credits": 4
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "COURSE_ID",
    "name": "Data Structures and Algorithms",
    "code": "CS201",
    "faculty": "FACULTY_ID",
    "status": "Draft",
    ...
  }
}
```

### Step 2: Add Chapters

```bash
POST http://localhost:5000/api/chapters
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Introduction to Arrays",
  "chapterNumber": 1,
  "course": "COURSE_ID",
  "description": "Basic concepts of arrays and operations",
  "topics": ["Array Declaration", "Array Operations", "Time Complexity"],
  "learningOutcomes": ["Understand array structure", "Implement basic operations"],
  "estimatedDuration": 5
}
```

### Step 3: Upload Chapter PDF

```bash
POST http://localhost:5000/api/chapters/CHAPTER_ID/upload-pdf
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
  pdf: [Select PDF file]
```

### Step 4: Create CIA Exam

```bash
POST http://localhost:5000/api/exams
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "CIA 1 - Data Structures",
  "examType": "CIA1",
  "course": "COURSE_ID",
  "subject": "SUBJECT_ID",
  "department": "DEPARTMENT_ID",
  "scheduledDate": "2025-11-15T10:00:00Z",
  "duration": 90,
  "totalMarks": 50,
  "passingMarks": 20,
  "instructions": [
    "Answer all questions",
    "Use blue/black pen only"
  ],
  "chaptersIncluded": ["CHAPTER_ID_1", "CHAPTER_ID_2"],
  "academicYear": "2024-2025",
  "semester": "Odd"
}
```

### Step 5: Add Questions (CRITICAL - With Chapter Mapping)

```bash
POST http://localhost:5000/api/questions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "exam": "EXAM_ID",
  "chapter": "CHAPTER_ID",
  "questionNumber": 1,
  "questionText": "What is an array?",
  "questionType": "Short Answer",
  "marks": 5,
  "difficulty": "Easy",
  "bloomLevel": "Remember",
  "keywords": ["array", "data structure", "definition"]
}
```

**MCQ Example**:
```json
{
  "exam": "EXAM_ID",
  "chapter": "CHAPTER_ID",
  "questionNumber": 2,
  "questionText": "What is the time complexity of accessing an element in an array?",
  "questionType": "MCQ",
  "marks": 2,
  "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
  "correctAnswer": "O(1)",
  "difficulty": "Easy",
  "bloomLevel": "Understand"
}
```

### Step 6: Enter Marks (CRITICAL - Triggers Auto-Calculation)

```bash
POST http://localhost:5000/api/marks
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "exam": "EXAM_ID",
  "student": "STUDENT_ID",
  "questionMarks": [
    {
      "question": "QUESTION_ID_1",
      "marksObtained": 3
    },
    {
      "question": "QUESTION_ID_2",
      "marksObtained": 1.5
    }
  ],
  "remarks": "Good understanding, needs practice"
}
```

**What Happens Automatically**:
1. ✅ Total marks calculated
2. ✅ StudentPerformance record updated
3. ✅ Chapter-wise performance calculated
4. ✅ If score <50%, tasks auto-generated for weak chapters

### Step 7: View Chapter-Wise Performance

```bash
GET http://localhost:5000/api/marks/exam/EXAM_ID/chapter-performance
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "chapter": {
        "_id": "CHAPTER_ID",
        "title": "Introduction to Arrays",
        "chapterNumber": 1
      },
      "totalQuestions": 5,
      "totalMarks": 15,
      "averagePercentage": 65.5,
      "studentsAppeared": 45,
      "strongStudents": 20,
      "averageStudents": 18,
      "weakStudents": 7
    }
  ]
}
```

### Step 8: Identify Weak Students

```bash
GET http://localhost:5000/api/marks/exam/EXAM_ID/weak-students?threshold=50
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "chapter": {
        "_id": "CHAPTER_ID",
        "title": "Introduction to Arrays",
        "chapterNumber": 1
      },
      "weakStudents": [
        {
          "studentId": "STUDENT_ID",
          "studentName": "John Doe",
          "rollNumber": "CS2001",
          "marksObtained": 5,
          "totalMarks": 15,
          "percentage": 33.33
        }
      ]
    }
  ]
}
```

### Step 9: Auto-Generate Tasks (CRITICAL)

```bash
POST http://localhost:5000/api/tasks/auto-generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "course": "COURSE_ID",
  "exam": "EXAM_ID",
  "threshold": 50
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "5 tasks generated successfully",
  "count": 5,
  "data": [
    {
      "_id": "TASK_ID",
      "student": {
        "_id": "STUDENT_ID",
        "name": "John Doe",
        "rollNumber": "CS2001"
      },
      "title": "Practice Task - Introduction to Arrays",
      "description": "Based on your performance in CIA 1, practice questions from this chapter. Current score: 33.33%",
      "taskType": "MCQ Practice",
      "generationReason": "Poor CIA Performance",
      "priority": "High",
      "dueDate": "2025-10-27T00:00:00Z",
      "status": "Assigned",
      "autoGenerated": true
    }
  ]
}
```

### Step 10: View Task Statistics

```bash
GET http://localhost:5000/api/tasks/course/COURSE_ID/statistics
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "COURSE_ID",
      "name": "Data Structures and Algorithms",
      "code": "CS201"
    },
    "statistics": {
      "total": 25,
      "byStatus": {
        "assigned": 10,
        "inProgress": 8,
        "completed": 5,
        "overdue": 2
      },
      "byType": {
        "autoGenerated": 18,
        "manual": 7
      },
      "averageScore": 72.5
    }
  }
}
```

---

## 📊 Analytics & Reports

### Get Course Statistics

```bash
GET http://localhost:5000/api/courses/COURSE_ID/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Exam Performance

```bash
GET http://localhost:5000/api/marks/exam/EXAM_ID/performance
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Student Performance

```bash
GET http://localhost:5000/api/performance/student/STUDENT_ID?course=COURSE_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Weak Students in Course

```bash
GET http://localhost:5000/api/performance/course/COURSE_ID/weak-students?threshold=50
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Top Performers

```bash
GET http://localhost:5000/api/performance/course/COURSE_ID/top-performers?limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Faculty Workflow
1. ✅ Create course
2. ✅ Add 3 chapters with PDFs
3. ✅ Create CIA1 exam
4. ✅ Add 10 questions (2-3 per chapter)
5. ✅ Enter marks for 5 students
6. ✅ Verify auto-calculation
7. ✅ Check if tasks generated for weak students
8. ✅ View all analytics

### Scenario 2: Bulk Operations
1. ✅ Bulk create questions (10 at once)
2. ✅ Bulk enter marks (all students)
3. ✅ Auto-generate tasks for all weak students
4. ✅ Verify performance calculations

### Scenario 3: Chapter Reordering
1. ✅ Create 5 chapters
2. ✅ Reorder them using PUT /api/chapters/reorder
3. ✅ Verify display order

### Scenario 4: Task Submission (Student)
1. ✅ Student views assigned tasks
2. ✅ Student submits MCQ task
3. ✅ Verify auto-grading
4. ✅ Check best score update

### Scenario 5: Error Handling
1. ✅ Try to create duplicate course code
2. ✅ Try to enter marks > max marks
3. ✅ Try to delete chapter with questions
4. ✅ Try to delete exam with marks
5. ✅ Verify proper error messages

---

## 🐛 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Solution**: Check if JWT token is valid and not expired

### Issue 2: 403 Forbidden
**Solution**: Check if user role has permission (Faculty/Admin required)

### Issue 3: 404 Not Found
**Solution**: Verify IDs are correct (course, chapter, exam, etc.)

### Issue 4: File Upload Fails
**Solution**: 
- Check file is PDF
- Check file size < 50MB
- Check uploads/chapters directory exists

### Issue 5: Auto-Generation Doesn't Work
**Solution**:
- Verify marks entered are <50%
- Check chapter mapping in questions
- Verify course has faculty assigned

---

## 📈 Expected Metrics After Testing

### Database Records:
- ✅ Courses: 5-10
- ✅ Chapters: 20-30
- ✅ Exams: 10-15
- ✅ Questions: 100-150
- ✅ Marks Entries: 50-100
- ✅ Student Performance Records: 50-100
- ✅ Tasks: 20-50 (mostly auto-generated)

### API Response Times:
- ✅ Simple GET: <100ms
- ✅ Complex queries: <500ms
- ✅ Bulk operations: <2s
- ✅ File uploads: <5s (depending on size)

---

## 🔍 Verification Checklist

### Phase 1 Backend:
- [ ] All 66 endpoints respond correctly
- [ ] Authentication works
- [ ] Authorization enforced
- [ ] Chapter mapping working
- [ ] Auto-calculation working
- [ ] Auto-generation working
- [ ] Auto-grading working
- [ ] File upload working
- [ ] Bulk operations working
- [ ] Analytics accurate

### Ready for Phase 2:
- [ ] Backend tested thoroughly
- [ ] All critical features verified
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Ready for frontend integration

---

## 🚀 Next: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

**Server should start on**: `http://localhost:5000`  
**API Docs available at**: `http://localhost:5000/api-docs`  
**Health check**: `http://localhost:5000/health`

---

**Happy Testing!** 🎉  
Use Postman, Thunder Client, or curl to test all endpoints.
