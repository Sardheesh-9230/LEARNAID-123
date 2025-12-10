# MCQ Generation with Threshold-Based Task Assignment

## Updated Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  FACULTY: Set Performance Threshold                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Threshold Input: [50]% (Faculty configurable)         │    │
│  │  Filter CO: [CO1 ▼]                                     │    │
│  │  [Refresh] Button                                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  SYSTEM: Analyze Student Performance                            │
│  • Fetch all students in subject                                │
│  • Compare CO performance against threshold                     │
│  • Identify lagging students (performance < threshold)          │
│  • Calculate performance gap for each student                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY: Lagging Students Table                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ Raj Kumar    CO1  Current: 35%  Gap: 15%  [HIGH]     │   │
│  │ ☑ Priya Singh  CO1  Current: 42%  Gap: 8%   [MEDIUM]   │   │
│  │ ☐ Amit Patel   CO2  Current: 38%  Gap: 12%  [MEDIUM]   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  FACULTY: Configure Task Settings                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Difficulty: [Medium ▼]                                │    │
│  │  Questions: [10]                                        │    │
│  │  Due Date: [2025-12-15]                                │    │
│  │  Retakes: ☑ Allowed  Max: [3]                          │    │
│  └────────────────────────────────────────────────────────┘    │
│  [Select All] [Clear]  [Assign Improvement Tasks (2)] ←───────│
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  SYSTEM: Generate MCQs from Materials                           │
│  • Fetch uploaded PDF materials for subject                     │
│  • Extract text content (up to 50k chars)                       │
│  • Call Groq AI with context:                                   │
│    - Course Outcome: CO1                                        │
│    - Current Performance: 35%                                   │
│    - Target Threshold: 50%                                      │
│    - Performance Gap: 15%                                       │
│    - Weak Topics: [Arrays, Loops, Functions]                   │
│    - Difficulty: Medium                                         │
│  • Generate 10 contextual MCQs                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  MCQ PREVIEW MODAL                                              │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ 📚 Review Generated MCQs                                  ║ │
│  ║ Student: Raj Kumar • CO: CO1                              ║ │
│  ║ Focus Areas: Arrays, Loops, Functions                     ║ │
│  ║ Current: 35% → Target: 50% • Gap: 15%                    ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║ 📊 Total: 10 Questions • ~20 minutes                      ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║                                                             ║ │
│  ║ [1] What is the primary purpose of arrays? [Medium][CO1]  ║ │
│  ║     A. Store single values                                ║ │
│  ║     B. Store multiple values ✓                            ║ │
│  ║     C. Delete values                                      ║ │
│  ║     D. Sort values                                        ║ │
│  ║                                                             ║ │
│  ║ [2] Which loop executes at least once? [Medium][CO1]      ║ │
│  ║     ...                                                    ║ │
│  ╠═══════════════════════════════════════════════════════════╣ │
│  ║ [Cancel] [Regenerate MCQs] [✓ Approve & Assign]         ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  FACULTY DECISION                                               │
│  ┌────────────────┬─────────────────┬────────────────────────┐ │
│  │   Approve      │   Regenerate    │       Cancel           │ │
│  │      ↓         │       ↓         │         ↓              │ │
│  │  Assign Tasks  │  Generate New   │  Return to Config      │ │
│  └────────────────┴─────────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (Approve)
┌─────────────────────────────────────────────────────────────────┐
│  SYSTEM: Create Improvement Tasks                               │
│  • Assign tasks to selected students                            │
│  • Include faculty-approved MCQs                                │
│  • Store task data with:                                        │
│    - Student ID, Subject ID                                     │
│    - Course Outcome, Current Performance                        │
│    - Threshold (50%), Performance Gap                           │
│    - Approved MCQs array                                        │
│    - Due Date, Difficulty, Retake settings                      │
│    - Teacher settings (threshold, target performance)           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  SUCCESS: Tasks Assigned                                        │
│  ✅ Successfully assigned 2 improvement task(s)!                 │
│  🧠 Faculty-approved MCQs have been assigned to students.       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Faculty-Controlled Threshold
- **Input**: Faculty sets performance threshold (0-100%)
- **Default**: 50%
- **Usage**: Students below this threshold are identified as needing improvement
- **Flexibility**: Can be adjusted per subject/CO analysis session

### 2. Threshold in MCQ Generation
The threshold is sent to the AI generation system with context:

```json
{
  "subjectId": "674c5d8e123abc...",
  "courseOutcome": "CO1",
  "topics": ["Arrays", "Loops", "Functions"],
  "difficulty": "Medium",
  "numberOfQuestions": 10,
  "threshold": 50,
  "currentPerformance": 35,
  "performanceGap": 15
}
```

### 3. AI Prompt Enhancement
The Groq AI receives enhanced context:

```
STUDENT PERFORMANCE CONTEXT:
- Course Outcome: CO1
- Current Performance: 35%
- Target Threshold: 50%
- Performance Gap: 15%
- Weak Topics: Arrays, Loops, Functions

TASK REQUIREMENTS:
- Create questions to help student improve from 35% to 50%
- Focus on bridging the 15% performance gap
- Target weak topics specifically
```

### 4. Visual Threshold Display
The MCQ preview modal shows:
- **Current**: Student's current performance (red badge)
- **Target**: Faculty-set threshold (green badge)
- **Gap**: Performance difference (orange badge)

### 5. Task Assignment Data
Tasks include threshold information:

```javascript
teacherSettings: {
  difficultyLevel: "Medium",
  numberOfQuestions: 10,
  threshold: 50,
  targetPerformance: 50,
  focusAreas: ["Arrays", "Loops", "Functions"],
  // ... other settings
}
```

## Benefits

1. **Customizable Standards**: Faculty can set different thresholds for different subjects/COs
2. **Contextual MCQs**: AI generates questions specifically designed to bridge the performance gap
3. **Transparent Goals**: Students see their target performance level
4. **Quality Control**: Faculty reviews MCQs before assignment
5. **Data-Driven**: Threshold-based identification ensures objective student selection

## API Endpoints

### Generate MCQs from Materials
```
POST /api/mcq-generator/generate-from-materials

Request Body:
{
  "subjectId": "string",
  "courseOutcome": "string",
  "topics": ["string"],
  "difficulty": "easy|medium|hard",
  "numberOfQuestions": number,
  "threshold": number,
  "currentPerformance": number,
  "performanceGap": number
}

Response:
{
  "success": true,
  "questions": [...MCQs],
  "totalQuestions": 10,
  "estimatedTime": 20,
  "materialsUsed": "PDF names"
}
```

### Assign CO-Specific Tasks
```
POST /api/improvement-tasks/assign-co-specific

Request Body:
{
  "studentId": "string",
  "subjectId": "string",
  "courseOutcome": "string",
  "threshold": number,
  "currentPerformance": number,
  "performanceGap": number,
  "approvedMCQs": [...MCQs],
  "teacherSettings": {
    "threshold": number,
    "targetPerformance": number,
    ...
  }
}
```

## Files Modified

1. **Frontend**:
   - `COBasedStudentIdentification.tsx` - Added threshold to MCQ generation and task assignment
   - `MCQPreviewModal.tsx` - Display threshold, current performance, and gap

2. **Backend**:
   - `routes/mcqGeneratorV3.js` - Enhanced AI prompt with threshold context

## Testing Checklist

- [ ] Faculty can set custom threshold (0-100%)
- [ ] System identifies students below threshold
- [ ] Threshold is sent to MCQ generation API
- [ ] AI prompt includes threshold context
- [ ] Preview modal displays current/target/gap
- [ ] Tasks are created with threshold data
- [ ] MCQs are contextually appropriate for bridging gap
