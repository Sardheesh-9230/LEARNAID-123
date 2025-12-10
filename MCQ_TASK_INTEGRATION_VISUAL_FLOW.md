# MCQ Generator & Task Manager Integration - Visual Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LearnAID Platform                             │
│                   MCQ Generator & Task Manager                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  CO Identification│  →  │  MCQ Generation  │  →  │  Task Assignment │
│    (Teachers)    │      │   (AI-Powered)   │      │   (Students)     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## Detailed Workflow

### Step 1: Faculty Identifies Lagging Students (CO-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Teacher Dashboard → Subject Card → "🎯 Identify Lagging Students"   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│             CO-Based Student Identification Component                │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  1. Select Course Outcome (CO1-CO5)                        │     │
│  │  2. Set Threshold (e.g., < 50%)                           │     │
│  │  3. View Lagging Students                                  │     │
│  │  4. Configure Task Settings:                               │     │
│  │     - Difficulty: Easy/Medium/Hard                        │     │
│  │     - Number of Questions: 5-50                           │     │
│  │     - Due Date                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                  ┌──────────────────────┐
                  │  Assign Tasks Button │
                  └──────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              Backend: /api/improvement-tasks/assign-co-specific      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  1. Receive: studentIds, CO, difficulty, questionCount     │     │
│  │  2. Check for Existing MCQ Sessions                        │     │
│  │     ├─ Found: Filter by difficulty → Select questions     │     │
│  │     └─ Not Found: Mark as "needsGeneration"              │     │
│  │  3. Create ImprovementTask documents                       │     │
│  │  4. Return: Tasks with MCQ metadata                        │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: Faculty Opens MCQ-Task Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│ Teacher Dashboard → Subject Card → "🧠 MCQ Generator & Tasks"       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│            FacultyMCQTaskIntegration Component                       │
│  ┌───────────────┬──────────────────┬────────────────────┐          │
│  │   Overview    │  Generate MCQs   │   Task Management  │          │
│  └───────────────┴──────────────────┴────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2a: Overview Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Overview Dashboard                           │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐      │
│  │   Materials  │ MCQ Sessions │ Tasks w/MCQs │ Needs MCQs   │      │
│  │      📄      │      🧠      │      ✅      │      ⚠️      │      │
│  │      15      │       8      │      12      │       5      │      │
│  └──────────────┴──────────────┴──────────────┴──────────────┘      │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │           Recent MCQ Sessions                                │    │
│  │  • Programming Fundamentals (20 questions) - Completed       │    │
│  │  • Data Structures Quiz (15 questions) - Completed           │    │
│  │  • Algorithm Analysis (10 questions) - Completed             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ⚠️  Tasks Requiring MCQ Generation (5)                     │    │
│  │  • Rajesh Kumar - CO1 (loops, conditionals)                 │    │
│  │  • Priya Sharma - CO2 (functions, arrays)                   │    │
│  │  • Amit Patel - CO1 (syntax, operators)                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2b: Generate MCQs Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MCQ Generation Settings                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Select Material:  [▼ Introduction to Programming - Ch1]    │    │
│  │                                                              │    │
│  │  Topics (Optional): [loops, functions, arrays___________]   │    │
│  │                                                              │    │
│  │  Difficulty Level:                                           │    │
│  │    ┌─────┐  ┌──────┐  ┌─────┐                              │    │
│  │    │Easy │  │Medium│  │Hard │                              │    │
│  │    └─────┘  └──────┘  └─────┘                              │    │
│  │              ■ Selected                                      │    │
│  │                                                              │    │
│  │  Number of Questions: 10                                    │    │
│  │  [====|==========================================]          │    │
│  │  5                     25                      50           │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────────┐       │    │
│  │  │  ▶  Generate MCQs                               │       │    │
│  │  └──────────────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│          Backend: /api/mcq-generator/generate                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. Extract PDF Content                                      │    │
│  │  2. Call OpenAI API with:                                    │    │
│  │     - Material content                                       │    │
│  │     - Topics                                                 │    │
│  │     - Difficulty level                                       │    │
│  │     - Number of questions                                    │    │
│  │  3. Parse AI Response                                        │    │
│  │  4. Create MCQSession document                               │    │
│  │  5. Store questions with metadata                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                      ✅ MCQs Generated!
                              ↓
              (Automatically Available for Tasks)
```

### Step 2c: Task Management Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Improvement Tasks                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  👤 Rajesh Kumar (CSE2021001)                               │    │
│  │     🎯 CO1 • loops, conditionals                             │    │
│  │     ✅ 10 MCQs  |  📊 assigned                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  👤 Priya Sharma (CSE2021002)                               │    │
│  │     🎯 CO2 • functions, arrays                               │    │
│  │     ⚠️ Needs MCQs  |  📊 assigned                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  👤 Amit Patel (CSE2021003)                                 │    │
│  │     🎯 CO1 • syntax, operators                               │    │
│  │     ✅ 10 MCQs  |  📊 in-progress                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                               │
│  ┌──────────────────────┐    ┌──────────────────────┐               │
│  │ TeacherDashboard     │    │ COBasedStudentID     │               │
│  │ Component            │ →  │ Component            │               │
│  └──────────────────────┘    └──────────────────────┘               │
│              ↓                           ↓                           │
│  ┌────────────────────────────────────────────────────┐              │
│  │     FacultyMCQTaskIntegration Component           │              │
│  │  ┌────────┐  ┌──────────┐  ┌─────────────┐       │              │
│  │  │Overview│  │ Generate │  │ Task Mgmt   │       │              │
│  │  └────────┘  └──────────┘  └─────────────┘       │              │
│  └────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         API Service Layer                            │
│  apiService.makeRequest(url, options)                                │
│    - Authentication (JWT Token)                                      │
│    - Error Handling                                                  │
│    - Retry Logic                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Routes                               │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │  Materials        │  │  MCQ Generator    │  │  Improvement    │ │
│  │  Routes           │  │  Routes           │  │  Task Routes    │ │
│  │                   │  │                   │  │                 │ │
│  │ /subjects/:id/    │  │ /sessions/        │  │ /subject/:id    │ │
│  │  materials        │  │  subject/:id      │  │                 │ │
│  │                   │  │ /generate         │  │ /assign-co-     │ │
│  │                   │  │                   │  │  specific       │ │
│  └───────────────────┘  └───────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Database Layer (MongoDB)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐          │
│  │  Material   │  │  MCQSession  │  │ ImprovementTask    │          │
│  │  Model      │  │  Model       │  │ Model              │          │
│  │             │  │              │  │                    │          │
│  │ • title     │  │ • subject    │  │ • student          │          │
│  │ • subject   │  │ • questions  │  │ • subject          │          │
│  │ • chapter   │  │ • status     │  │ • courseOutcome    │          │
│  │ • pdfPath   │  │ • createdBy  │  │ • weakAreas        │          │
│  │             │  │              │  │ • metadata         │          │
│  │             │  │              │  │   .generatedMCQs   │          │
│  └─────────────┘  └──────────────┘  └────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

## Student Experience

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Student Dashboard                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📋 New Improvement Task Assigned!                          │    │
│  │                                                              │    │
│  │  Subject: Programming Fundamentals                          │    │
│  │  Course Outcome: CO1 - Understand basic programming         │    │
│  │  Focus Areas: loops, conditionals                           │    │
│  │  Questions: 10 MCQs (Medium difficulty)                     │    │
│  │  Due Date: Feb 1, 2024                                      │    │
│  │                                                              │    │
│  │  ┌────────────────────┐                                     │    │
│  │  │  Start Task  ▶    │                                     │    │
│  │  └────────────────────┘                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (Click Start)
┌─────────────────────────────────────────────────────────────────────┐
│                       MCQ Test Interface                             │
│  Question 1 of 10                                    Time: 15:00     │
│                                                                       │
│  Q: What is the output of the following loop?                       │
│     for (int i = 0; i < 5; i++) { System.out.print(i + " "); }     │
│                                                                       │
│  ○ A) 0 1 2 3 4                                                     │
│  ○ B) 1 2 3 4 5                                                     │
│  ○ C) 0 1 2 3 4 5                                                   │
│  ○ D) 1 2 3 4                                                       │
│                                                                       │
│  ┌──────────┐  ┌──────────┐                                         │
│  │ Previous │  │   Next ▶│                                         │
│  └──────────┘  └──────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (Complete Test)
┌─────────────────────────────────────────────────────────────────────┐
│                         Results Summary                              │
│  Score: 7/10 (70%)                                                  │
│                                                                       │
│  ✅ Correct: 7 questions                                            │
│  ❌ Incorrect: 3 questions                                          │
│                                                                       │
│  📊 Performance by Topic:                                           │
│  • Loops: 3/4 (75%)                                                 │
│  • Conditionals: 4/6 (67%)                                          │
│                                                                       │
│  💡 Areas for Improvement:                                          │
│  • Focus on nested loops                                            │
│  • Practice if-else statements                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## System Integration Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LearnAID Ecosystem                                │
│                                                                       │
│  ┌────────────────┐         ┌────────────────┐                      │
│  │  Marks Entry   │    →    │  CO Analysis   │                      │
│  │  System        │         │  Engine        │                      │
│  └────────────────┘         └────────────────┘                      │
│         ↓                           ↓                                │
│  ┌────────────────────────────────────────┐                         │
│  │  CO-Based Student Identification       │                         │
│  │  (Identifies Lagging Students)         │                         │
│  └────────────────────────────────────────┘                         │
│         ↓                           ↓                                │
│  ┌────────────────┐         ┌────────────────┐                      │
│  │  Material      │    ←→   │  MCQ Generator │                      │
│  │  Management    │         │  (AI-Powered)  │                      │
│  └────────────────┘         └────────────────┘                      │
│         ↓                           ↓                                │
│  ┌────────────────────────────────────────┐                         │
│  │  MCQ-Task Integration Manager          │                         │
│  │  (This System)                         │                         │
│  └────────────────────────────────────────┘                         │
│         ↓                           ↓                                │
│  ┌────────────────┐         ┌────────────────┐                      │
│  │  Improvement   │    ←→   │  Student Task  │                      │
│  │  Task System   │         │  Dashboard     │                      │
│  └────────────────┘         └────────────────┘                      │
│         ↓                                                            │
│  ┌────────────────────────────────────────┐                         │
│  │  Analytics & Progress Tracking         │                         │
│  └────────────────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
```

## Legend

### Icons & Symbols
- 📄 Materials/Documents
- 🧠 MCQ Sessions/Questions
- ✅ Completed/Success
- ⚠️ Warning/Needs Attention
- 🎯 Target/Goal (Course Outcomes)
- 👤 User/Student
- 📊 Status/Progress
- 💡 Suggestion/Tip
- ▶ Action/Start
- ↓ Flow Direction
- → Relationship/Connection

### Color Codes (in actual UI)
- **Blue**: Information, Materials
- **Purple**: MCQ Generation, Analytics
- **Green**: Success, Completed
- **Orange**: Warning, Pending
- **Red**: Error, Urgent
- **Gray**: Inactive, Neutral

---

**Created**: January 2024  
**Version**: 1.0  
**Purpose**: Visual reference for MCQ-Task integration workflow
