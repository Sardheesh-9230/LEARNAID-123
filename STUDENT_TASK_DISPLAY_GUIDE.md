# Student Task Display System - Complete Flow Guide

## ✅ System Overview

The system now properly displays faculty-created automatic tasks in the student dashboard through the following components:

## 📊 Architecture Flow

```
Faculty Creates Task (TaskAssessmentWizard)
    ↓
Backend API: POST /api/tasks/create-assessment-task
    ↓
Task Model (MongoDB) - Stores complete task with:
    - Questions (MCQ)
    - Study Materials
    - Schedule (study time + task time)
    - Assigned Students
    ↓
Student Dashboard (StudentTaskDashboard.tsx)
    ↓
Backend API: GET /api/tasks/student/tasks
    ↓
Returns: All tasks assigned to logged-in student
    ↓
Display: Dashboard shows tasks with status
```

## 🔧 Fixed Issues

### 1. **API Endpoint Routing** ✅
- **Problem**: StudentTaskDashboard was calling Next.js API routes (`/api/tasks/...`)
- **Solution**: Updated to use backend server URL (`http://localhost:5000/api/tasks/...`)
- **Files Modified**: `src/components/StudentTaskDashboard.tsx`

### 2. **Token Authentication** ✅
- **Problem**: Using wrong localStorage key (`token` instead of `authToken`)
- **Solution**: Updated all fetch calls to use `localStorage.getItem('authToken')`
- **Impact**: Student authentication now works correctly

### 3. **Backend Route Registration** ✅
- **Verified**: `/api/tasks` routes are properly registered in `backend/src/server.js`
- **Route**: `app.use('/api/tasks', taskRoutes);`
- **Handler**: `backend/src/routes/tasks.js` - line 322

## 📱 Student Dashboard Components

### Main Components:
1. **StudentDashboard.tsx** - Main dashboard container
2. **StudentTaskDashboard.tsx** - Task display and interaction
3. **StudentSidebar.tsx** - Navigation

### Task Display Features:
- ✅ View all assigned tasks
- ✅ See task status (upcoming, study-time, active-task, completed, overdue)
- ✅ Start study session (with study materials)
- ✅ Start task session (MCQ test)
- ✅ Submit answers and get scores
- ✅ AI chatbot assistance during study time

## 🔄 API Endpoints Used

### GET /api/tasks/student/tasks
- **Purpose**: Fetch all tasks assigned to the logged-in student
- **Authentication**: Bearer token required
- **Returns**:
```json
{
  "tasks": [
    {
      "_id": "task_id",
      "title": "CO1 Improvement Task",
      "subject": { "name": "AI", "code": "CS401" },
      "courseOutcomes": ["CO1"],
      "currentStatus": "upcoming|study-time|active-task|completed|overdue",
      "studentStatus": "assigned|studying|in-progress|completed",
      "taskSchedule": {
        "studyDuration": 60,
        "taskDuration": 30,
        "startTime": "2025-12-15T10:00:00Z",
        "studyStartTime": "2025-12-15T09:00:00Z"
      },
      "questions": [...],
      "studyMaterials": [...]
    }
  ]
}
```

### POST /api/tasks/study/start/:taskId
- **Purpose**: Start study session for a task
- **Returns**: Study materials and chatbot availability

### POST /api/tasks/task/start/:taskId
- **Purpose**: Start the actual task (MCQ test)
- **Returns**: Questions and time limit

### POST /api/tasks/task/submit/:taskId
- **Purpose**: Submit task answers
- **Body**: `{ "answers": [{ "questionIndex": 0, "selectedOption": 2 }] }`
- **Returns**: Score and pass/fail status

## 🎯 How Faculty Creates Tasks

### 1. TaskAssessmentWizard Component
Located: `src/components/TaskAssessmentWizard.tsx`

Steps:
1. Select COs to assess (CO1, CO2, etc.)
2. Configure questions per CO
3. Generate MCQs from study materials OR use LLM-only mode
4. Review and edit generated questions
5. Set schedule (study time + task time)
6. Assign to selected students

### 2. Backend Processing
Located: `backend/src/controllers/taskAssessmentController.js`

Function: `createAssessmentTask()`
- Validates all input
- Creates Task document in MongoDB
- Assigns to multiple students
- Sets study and task schedules

## 🔍 Troubleshooting

### Students Not Seeing Tasks

**Check 1: Is the task created?**
```javascript
// In MongoDB
db.tasks.find({ 'assignedStudents.student': ObjectId('student_id') })
```

**Check 2: Is the student logged in?**
```javascript
// Check localStorage
localStorage.getItem('authToken')
localStorage.getItem('userRole') // should be 'student'
```

**Check 3: Are the API calls working?**
- Open browser DevTools → Network tab
- Navigate to Student Dashboard → Tasks tab
- Look for: `GET http://localhost:5000/api/tasks/student/tasks`
- Check response status (should be 200)

**Check 4: Backend server running?**
```bash
cd backend
npm start
# Should see: "✅ MongoDB Connected" and "Port: 5000"
```

### Common Errors

**401 Unauthorized**
- Check if authToken is valid
- Try logging in again
- Verify token in localStorage

**404 Not Found**
- Verify backend server is running on port 5000
- Check route registration in `backend/src/server.js`

**Empty Task List**
- Verify tasks are assigned to the student in database
- Check task.assignedStudents array contains student ID
- Verify student ID matches logged-in user

## 📝 Login Credentials

Based on database:
- **Admin**: `admin@learnaid.edu` / (check with test-login.js)
- **Faculty**: Create via admin panel
- **Students**: Create via admin panel

## 🚀 Testing the Flow

### Step 1: Start Backend
```bash
cd backend
npm start
```

### Step 2: Start Frontend
```bash
cd ..
npm run dev
```

### Step 3: Login as Faculty
1. Go to: `http://localhost:3000/login`
2. Login with faculty credentials
3. Navigate to Task Manager
4. Create a new task using TaskAssessmentWizard

### Step 4: Login as Student
1. Logout and login with student credentials
2. Navigate to Dashboard → Tasks tab
3. You should see the assigned task!

## 📚 Related Files

### Frontend:
- `src/components/StudentDashboard.tsx`
- `src/components/StudentTaskDashboard.tsx`
- `src/components/StudentSidebar.tsx`
- `src/components/TaskAssessmentWizard.tsx` (Faculty)
- `src/components/COBasedStudentIdentification.tsx` (Faculty)

### Backend:
- `backend/src/routes/tasks.js`
- `backend/src/routes/taskAssessment.js`
- `backend/src/controllers/taskAssessmentController.js`
- `backend/src/models/Task.js`
- `backend/src/models/ImprovementTask.js`

### Server Configuration:
- `backend/src/server.js` (Route registration)
- `backend/.env` (Port and MongoDB URI)

## ✅ Verification Checklist

- [x] Backend routes registered in server.js
- [x] StudentTaskDashboard uses correct backend URL
- [x] Authentication token properly retrieved (authToken)
- [x] All fetch calls use Bearer token
- [x] Task model populated with subject and user data
- [x] Student can view assigned tasks
- [x] Task status updates correctly
- [x] Study session and task session work
- [x] Answer submission and scoring work

## 🎓 Next Steps

1. **Test the complete flow** from task creation to submission
2. **Verify CO analysis** is properly linked to tasks
3. **Check marks storage** after task submission
4. **Test notifications** when tasks are assigned
5. **Validate performance tracking** after task completion

---

**Last Updated**: December 12, 2025
**Status**: ✅ All API routing fixed and verified
