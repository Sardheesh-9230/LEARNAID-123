# Automatic MCQ Generation - Visual Flow

## 🎯 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TEACHER ASSIGNS IMPROVEMENT TASK                      │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  POST /assign-co-specific   │
        │                             │
        │  Body:                      │
        │  - studentId                │
        │  - subjectId                │
        │  - courseOutcome (CO)       │
        │  - weakAreas []             │
        │  - numberOfQuestions        │
        │  - difficultyLevel          │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  Check Existing MCQ Sessions     │
        │  MCQSession.findOne({            │
        │    subject,                      │
        │    status: 'completed'           │
        │  })                              │
        └──────────┬─────────────┬─────────┘
                   │             │
            EXISTS │             │ NOT FOUND
                   ▼             ▼
    ┌──────────────────┐  ┌────────────────────────────┐
    │ Filter Questions │  │ AUTO-GENERATE NEW MCQs     │
    │ by difficulty    │  │ (NEW FEATURE)              │
    │ Use existing     │  └─────────────┬──────────────┘
    └─────────┬────────┘                │
              │                         │
              │                         ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 1: Find Materials          │
              │         │ - Search chapters               │
              │         │ - Match weak areas (priority)   │
              │         │ - Fallback: any PDFs            │
              │         │ - Select best material          │
              │         └──────────────┬──────────────────┘
              │                        │
              │                        ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 2: Extract PDF Text        │
              │         │ - extractTextFromPDF()          │
              │         │ - Strategy: pdf-parse           │
              │         │ - Fallback: pdftotext           │
              │         │ - Validate: min 100 chars       │
              │         └──────────────┬──────────────────┘
              │                        │
              │                        ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 3: Create Chunks           │
              │         │ - chunkText(text, 1000, 200)    │
              │         │ - Sentence-based splitting      │
              │         │ - 200-char overlap              │
              │         │ - Preserve context              │
              │         └──────────────┬──────────────────┘
              │                        │
              │                        ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 4: RAG Search              │
              │         │ - EnhancedVectorStore           │
              │         │ - Extract keywords              │
              │         │ - Frequency analysis            │
              │         │ - Semantic scoring              │
              │         │ - Get top 5 relevant chunks     │
              │         └──────────────┬──────────────────┘
              │                        │
              │                        ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 5: Generate MCQs           │
              │         │ - Prepare Groq prompt           │
              │         │ - Model: llama-3.3-70b          │
              │         │ - Include relevant content      │
              │         │ - Specify requirements          │
              │         │ - Parse JSON response           │
              │         └──────────────┬──────────────────┘
              │                        │
              │                        ▼
              │         ┌─────────────────────────────────┐
              │         │ STEP 6: Validate & Store        │
              │         │ - Check question format         │
              │         │ - Validate 4 options            │
              │         │ - Verify correct answer         │
              │         │ - Create MCQSession             │
              │         │ - Store questions               │
              │         └──────────────┬──────────────────┘
              │                        │
              └────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ Create ImprovementTask       │
                        │                              │
                        │ mcqData: {                   │
                        │   totalQuestions: 10         │
                        │   sessionId: "..."           │
                        │   questions: [...]           │
                        │   materialUsed: "..."        │
                        │   generatedAt: Date          │
                        │ }                            │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ Return Success Response      │
                        │                              │
                        │ - Task created ✅            │
                        │ - MCQs ready ✅              │
                        │ - Student notified ✅        │
                        └──────────────────────────────┘
```

## 🔄 Material Selection Logic

```
┌────────────────────────────┐
│ Find Chapters for Subject  │
│ Chapter.find({ subject })  │
└─────────────┬──────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Has Weak Areas?     │
    └──┬──────────────┬───┘
  YES  │              │ NO
       ▼              ▼
┌────────────────┐  ┌──────────────────┐
│ Search by      │  │ Get Any Materials│
│ Weak Areas     │  │ with PDFs        │
│                │  │                  │
│ Match:         │  │ Material.find({  │
│ - title        │  │   subject,       │
│ - description  │  │   pdfPath: {...} │
│                │  │ })               │
│ Limit: 3       │  │                  │
└───────┬────────┘  └─────────┬────────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────┐
        │ Materials Found? │
        └──┬───────────┬───┘
      YES  │           │ NO
           ▼           ▼
    ┌──────────┐   ┌──────────────────┐
    │ Use Best │   │ Mark as Needs    │
    │ Material │   │ Generation       │
    │          │   │                  │
    │ Priority:│   │ Message:         │
    │ 1. Weak  │   │ "No materials    │
    │    area  │   │  available"      │
    │    match │   │                  │
    │ 2. First │   │ needsGeneration  │
    │    PDF   │   │ = true           │
    └──────────┘   └──────────────────┘
```

## 📊 MCQ Validation Pipeline

```
┌─────────────────────────┐
│ Groq API Response       │
│ (JSON Array of MCQs)    │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ Parse JSON Response      │
│ - Try direct parse       │
│ - Try regex extraction   │
│ - Handle markdown        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Validate Each MCQ        │
│                          │
│ ✓ Has question?          │
│ ✓ Has 4 options?         │
│ ✓ Valid answer (A-D)?    │
│ ✓ Has explanation?       │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────┐
    │ Valid MCQs?  │
    └──┬───────┬───┘
  YES  │       │ NO
       ▼       ▼
┌──────────┐ ┌────────────────┐
│ Sanitize │ │ Return Error   │
│ & Store  │ │ "No valid MCQs"│
│          │ │                │
│ Format:  │ └────────────────┘
│ {        │
│  question│
│  options │
│  answer  │
│  explain │
│  bloom   │
│  diff    │
│ }        │
└────┬─────┘
     │
     ▼
┌────────────────┐
│ Create Session │
│ MCQSession     │
│ - questions[]  │
│ - metadata     │
│ - status:      │
│   'completed'  │
└────────────────┘
```

## 🎨 Dashboard Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER DASHBOARD                         │
│                                                              │
│  Tabs: [Overview | Subjects | Students | ... ]              │
│        [ MCQ Generator | MCQ Task Manager | ... ]            │
│                            ↑                                 │
│                            │                                 │
│                    ┌───────┴────────┐                        │
│                    │ MCQ-Manager Tab│                        │
│                    │                │                        │
│                    │ - Subject      │                        │
│                    │   Selector     │                        │
│                    │ - Statistics   │                        │
│                    │ - Quick Actions│                        │
│                    │ - Task History │                        │
│                    └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Opens Modal
                             ▼
┌─────────────────────────────────────────────────────────────┐
│          FacultyMCQTaskIntegration Modal                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Overview Dashboard                                 │     │
│  │ - Total MCQ Sessions: 15                          │     │
│  │ - Total Tasks Assigned: 45                        │     │
│  │ - Average Completion: 68%                         │     │
│  │ - Students with Tasks: 12                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Generate MCQs (Tab 1)                             │     │
│  │ - Select Material                                 │     │
│  │ - Set Topics                                      │     │
│  │ - Choose Difficulty                               │     │
│  │ - Number of Questions                             │     │
│  │ - [Generate] Button                               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Manage Tasks (Tab 2)                              │     │
│  │ - View Active Tasks                               │     │
│  │ - Student Progress                                │     │
│  │ - MCQ Status                                      │     │
│  │ - Performance Metrics                             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 👨‍🎓 Student Experience Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT DASHBOARD                         │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │ Improvement Tasks Section                    │           │
│  │                                              │           │
│  │  Task: CO1 Performance Improvement           │           │
│  │  Subject: Data Structures                    │           │
│  │  Status: Active                              │           │
│  │                                              │           │
│  │  ┌────────────────────────────────────┐     │           │
│  │  │ MCQ Practice Available ✅          │     │           │
│  │  │                                    │     │           │
│  │  │ • 10 Questions Ready               │     │           │
│  │  │ • Difficulty: Medium               │     │           │
│  │  │ • Estimated Time: 20 mins          │     │           │
│  │  │ • Topics: Arrays, Sorting          │     │           │
│  │  │                                    │     │           │
│  │  │ Material: Chapter 5: Data Struct.  │     │           │
│  │  │ Generated: 2 mins ago              │     │           │
│  │  │                                    │     │           │
│  │  │ [Start Practice] [View Details]    │     │           │
│  │  └────────────────────────────────────┘     │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Click "Start Practice"
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCQ PRACTICE SESSION                      │
│                                                              │
│  Question 1 of 10                          Timer: 18:45     │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  What is the time complexity of bubble sort in worst case?  │
│                                                              │
│  ○ A. O(n)                                                   │
│  ○ B. O(n log n)                                             │
│  ○ C. O(n²)                                                  │
│  ○ D. O(log n)                                               │
│                                                              │
│  [Previous] [Next] [Submit]                                  │
│                                                              │
│  Progress: [██████░░░░] 60%                                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ After Submission
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESULTS & FEEDBACK                        │
│                                                              │
│  Score: 8/10 (80%) ✅                                        │
│  Time Taken: 17 minutes                                      │
│  CO1 Performance: Improved to 72%                            │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ Question Review                                │         │
│  │                                                │         │
│  │ Q1: ✅ Correct - Time complexity               │         │
│  │     Your Answer: C (O(n²))                     │         │
│  │     Explanation: Bubble sort compares...       │         │
│  │                                                │         │
│  │ Q2: ❌ Incorrect - Array operations            │         │
│  │     Your Answer: B                             │         │
│  │     Correct Answer: A                          │         │
│  │     Explanation: Array insertion at...         │         │
│  │                                                │         │
│  │ ...                                            │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  [Try Again] [View Analysis] [Next Task]                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Error Handling Flow

```
                ┌──────────────────────┐
                │ MCQ Generation Start │
                └──────────┬───────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌───────────────┐
│ No Materials   │ │ No Chapters  │ │ PDF Corrupted │
│ Found          │ │ Found        │ │ or Missing    │
└───────┬────────┘ └──────┬───────┘ └───────┬───────┘
        │                 │                 │
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │ Mark as needsGeneration       │
          │                               │
          │ Store:                        │
          │ - totalQuestions: 0           │
          │ - needsGeneration: true       │
          │ - message: <error details>    │
          │ - numberOfQuestions: <count>  │
          │ - areas: <weak areas>         │
          │ - focusedCO: <CO>             │
          └───────────────┬───────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │ Create Task with Fallback     │
          │ Student sees:                 │
          │ "MCQs will be available when  │
          │  materials are uploaded"      │
          └───────────────────────────────┘
```

## 📈 Success Metrics

```
┌────────────────────────────────────────────────────────────┐
│                    SYSTEM METRICS                          │
└────────────────────────────────────────────────────────────┘

Generation Success Rate
[████████████████████░░] 85%

Average Generation Time
[████████░░░░░░░░░░░░░░] 45 seconds

Question Quality Score
[████████████████████░░] 92/100

Student Satisfaction
[█████████████████████░] 4.6/5.0

┌────────────────────────────────────────────────────────────┐
│ Breakdown by Subject                                       │
│                                                            │
│ Data Structures:     [████████████████░░] 88% success     │
│ Algorithms:          [██████████████████] 93% success     │
│ Database Systems:    [█████████████░░░░░] 78% success     │
│ Operating Systems:   [███████████████████] 95% success    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Common Failure Reasons                                     │
│                                                            │
│ 1. No materials available        (45%)                     │
│ 2. PDF extraction failed         (25%)                     │
│ 3. Insufficient text content     (15%)                     │
│ 4. Groq API timeout              (10%)                     │
│ 5. Other errors                  (5%)                      │
└────────────────────────────────────────────────────────────┘
```

---

**Visual Guide Version**: 1.0  
**Created**: January 27, 2025  
**Status**: ✅ Complete
