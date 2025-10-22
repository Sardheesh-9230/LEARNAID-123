# 🚀 Quick Start Guide - LearnAID Faculty Module

**Last Updated**: October 20, 2025  
**Status**: Phase 1 Complete - Backend Ready for Testing

---

## 📋 Prerequisites Checklist

Before starting the server, ensure you have:

- ✅ Node.js v16+ installed
- ✅ MongoDB installed and running (or MongoDB Atlas URI)
- ✅ Git installed
- ✅ Postman/Thunder Client for API testing

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd /home/saravana/projects/AGILE/LEARNAID-REAL-ONE/LEARNAID-123/backend
npm install
```

### Step 2: Configure Environment
Create `.env` file in `backend/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/learnaid
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learnaid

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=52428800
```

### Step 3: Start MongoDB (if local)
```bash
# Linux/Mac
sudo systemctl start mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Start Backend Server
```bash
npm run dev
```

**Expected Output**:
```
████████████████████████████████████████████████████████
█                                                      █
█         🎓 LearnAIA Backend Server Started           █
█                                                      █
█         Environment: development                     █
█         Port: 5000                                   █
█         Database: Connected                          █
█                                                      █
█         API Documentation: http://localhost:5000/api-docs
█         Health Check: http://localhost:5000/health
█                                                      █
████████████████████████████████████████████████████████
```

### Step 5: Verify Installation
```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "LearnAIA API is running successfully",
  "timestamp": "2025-10-20T10:30:00.000Z",
  "environment": "development"
}
```

✅ **Backend is ready!**

---

## 🎯 First API Test (2 Minutes)

### 1. Login as Admin/Faculty
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@learnaid.com",
  "password": "admin123"
}
```

**Copy the JWT token from response**

### 2. Get All Courses
```bash
GET http://localhost:5000/api/courses
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. View API Documentation
Open browser: http://localhost:5000/api-docs

---

## 📚 Complete Feature Test (15 Minutes)

### Test Scenario: Create Complete CIA Exam Flow

Use the testing guide:
```bash
/home/saravana/projects/AGILE/LEARNAID-REAL-ONE/LEARNAID-123/project-plans/API_TESTING_GUIDE.md
```

Follow these steps:
1. ✅ Create Course
2. ✅ Add 3 Chapters
3. ✅ Upload PDFs
4. ✅ Create CIA Exam
5. ✅ Add 10 Questions
6. ✅ Enter Marks
7. ✅ Verify Auto-Calculation
8. ✅ Check Auto-Generated Tasks

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Or check MongoDB Atlas connection string
```

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

### Issue: File Upload Fails
```
Error: ENOENT: no such file or directory, open 'uploads/chapters/...'
```

**Solution**:
```bash
# Create upload directories
mkdir -p backend/uploads/chapters
```

### Issue: JWT Token Invalid
```
Error: 401 Unauthorized
```

**Solution**:
- Token might be expired (30 days default)
- Login again to get new token
- Check JWT_SECRET matches in .env

---

## 📊 Database Setup (Optional)

### Seed Initial Data (Admin User)

Create `backend/seed.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const Subject = require('./src/models/Subject');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});

    // Create Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@learnaid.com',
      password: hashedPassword,
      role: 'Admin'
    });

    // Create Faculty
    await User.create({
      name: 'John Faculty',
      email: 'faculty@learnaid.com',
      password: hashedPassword,
      role: 'Faculty'
    });

    // Create Student
    await User.create({
      name: 'Jane Student',
      email: 'student@learnaid.com',
      password: hashedPassword,
      role: 'Student',
      rollNumber: 'CS2001'
    });

    // Create Department
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science'
    });

    // Create Subject
    await Subject.create({
      name: 'Data Structures',
      code: 'CS201',
      department: dept._id,
      semester: 'Odd',
      credits: 4
    });

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
```

Run seed:
```bash
node backend/seed.js
```

---

## 📁 Project Structure

```
LEARNAID-123/
├── backend/
│   ├── src/
│   │   ├── controllers/      ← 7 Faculty Module Controllers ✅
│   │   │   ├── courseController.js
│   │   │   ├── chapterController.js
│   │   │   ├── ciaExamController.js
│   │   │   ├── examQuestionController.js
│   │   │   ├── examMarksController.js ⭐
│   │   │   ├── studentPerformanceController.js
│   │   │   └── taskAssignmentController.js ⭐
│   │   ├── routes/           ← 7 Route Files ✅
│   │   │   ├── courses.js
│   │   │   ├── chapters.js
│   │   │   ├── exams.js
│   │   │   ├── questions.js
│   │   │   ├── marks.js
│   │   │   ├── performance.js
│   │   │   └── tasks.js
│   │   ├── models/           ← 7 Faculty Module Models ✅
│   │   │   ├── Course.js
│   │   │   ├── Chapter.js
│   │   │   ├── CIAExam.js
│   │   │   ├── ExamQuestion.js
│   │   │   ├── ExamMarks.js
│   │   │   ├── StudentPerformance.js
│   │   │   └── TaskAssignment.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── server.js         ← Updated with new routes ✅
│   ├── uploads/
│   │   └── chapters/         ← PDF storage ✅
│   ├── package.json
│   └── .env
└── project-plans/
    ├── PHASE_1_COMPLETION_SUMMARY.md ✅
    ├── API_TESTING_GUIDE.md ✅
    └── PHASE_1_VISUAL_SUMMARY.md ✅
```

---

## 🎯 Quick Reference

### All New API Endpoints (66 total)

```
Courses:     /api/courses      (9 endpoints)
Chapters:    /api/chapters     (10 endpoints)
Exams:       /api/exams        (9 endpoints)
Questions:   /api/questions    (10 endpoints)
Marks:       /api/marks        (9 endpoints) ⭐
Performance: /api/performance  (8 endpoints)
Tasks:       /api/tasks        (11 endpoints) ⭐
```

### Key Features
- ✅ Auto-Calculation (after marks entry)
- ✅ Auto-Generation (tasks for weak students)
- ✅ Auto-Grading (MCQ tasks)
- ✅ Chapter-Wise Analytics
- ✅ PDF Upload Support
- ✅ Bulk Operations

---

## 📖 Documentation Links

1. **Complete Summary**: `project-plans/PHASE_1_COMPLETION_SUMMARY.md`
2. **API Testing Guide**: `project-plans/API_TESTING_GUIDE.md`
3. **Visual Summary**: `project-plans/PHASE_1_VISUAL_SUMMARY.md`
4. **API Docs** (Swagger): http://localhost:5000/api-docs

---

## 🎓 Default Credentials (After Seeding)

```
Admin:
  Email: admin@learnaid.com
  Password: admin123

Faculty:
  Email: faculty@learnaid.com
  Password: admin123

Student:
  Email: student@learnaid.com
  Password: admin123
```

---

## 🚀 Next: Start Testing!

### Recommended Testing Order:

1. **Day 1**: Basic CRUD operations
   - Create course, chapters, exams
   - Test authentication & authorization

2. **Day 2**: Complex workflows
   - Add questions with chapter mapping
   - Enter marks (test auto-calculation)
   - Verify auto-generated tasks

3. **Day 3**: Analytics & Reports
   - Test all analytics endpoints
   - Verify performance calculations
   - Test bulk operations

4. **Day 4**: Error handling
   - Test edge cases
   - Verify validation
   - Test cascade restrictions

5. **Day 5**: Performance testing
   - Test with large datasets
   - Measure response times
   - Optimize if needed

---

## 📞 Need Help?

### Documentation Available:
- ✅ Complete API documentation (Swagger)
- ✅ Testing guide with examples
- ✅ Visual workflow diagrams
- ✅ Troubleshooting guide

### Check:
1. Server logs for errors
2. MongoDB connection status
3. Environment variables
4. File permissions (uploads folder)

---

## ✅ Phase 1 Checklist

- [x] 7 Models created
- [x] 7 Controllers implemented
- [x] 7 Routes registered
- [x] Server configuration updated
- [x] Upload directories created
- [x] Documentation complete
- [ ] Backend tested (YOUR TASK)
- [ ] Ready for frontend integration

---

**🎉 You're all set! Start the server and begin testing! 🎉**

```bash
cd backend
npm run dev
```

Then open Postman and start with the login endpoint!
