# MCQ Testing System - Quick Testing Guide

## Prerequisites
- Backend server running on port 5000
- Frontend server running on port 3000
- MongoDB connected
- At least 2 students enrolled in a course
- CIA exam data with CO performance available

## Test Scenario: Multi-Student Personalized Assessment

### Step 1: Create Assessment Task (Faculty)

1. **Login as Faculty**
   - Navigate to `/faculty`
   - Go to "Task Management" tab

2. **Create New Task**
   - Click "Create Assessment Task"
   - Select exam type (e.g., CIA-1)
   - Select subject
   - Click "Next"

3. **Select Students**
   - Choose 2 students with different weak COs
   - Example:
     - **Student A**: Weak in CO1 (70%) and CO2 (65%)
     - **Student B**: Weak in CO1 (68%) only
   - Click "Next"

4. **Configure CO-based Questions**
   - For CO1: 
     - Questions per student: 5
     - Marks per question: 1
     - Total: 5 marks
   - For CO2:
     - Questions per student: 5
     - Marks per question: 1
     - Total: 5 marks
   - Click "Generate Questions"

5. **Review Generated Questions**
   - CO1: Should show 10 questions (5 for Student A + 5 for Student B)
   - CO2: Should show 5 questions (only for Student A)
   - Review quality
   - Click "Next"

6. **Publish Assessment**
   - Review summary:
     - **Student A**: 10 questions (5 CO1 + 5 CO2), Total: 10 marks
     - **Student B**: 5 questions (5 CO1), Total: 5 marks
   - Set title: "Improve CO1 and CO2 Performance"
   - Set description
   - Set due date
   - Click "Publish Assessment"

7. **Verify Task Created**
   - Should see task in "Faculty Task Management"
   - Status: "Assigned to 2 students"
   - Shows both students in list

### Step 2: Take Test (Student A)

1. **Login as Student A**
   - Navigate to `/student`
   - Go to "Improvement Tasks" tab

2. **View Task**
   - Should see "Improve CO1 and CO2 Performance"
   - Shows "10 Questions" for this student
   - Status: "Assigned"

3. **Start Task**
   - Click "Start Task"
   - Status changes to "In Progress"

4. **Take MCQ Quiz**
   - Click "Take MCQ Quiz (10 Questions)"
   - Timer starts counting down (e.g., 10 minutes)
   - Progress bar shows 0/10

5. **Answer Questions**
   - Navigate through questions (Q1-Q10)
   - Select answers (mix of correct and incorrect for testing)
   - Example:
     - Q1-Q3 (CO1): Answer correctly
     - Q4-Q5 (CO1): Answer incorrectly
     - Q6-Q8 (CO2): Answer correctly
     - Q9-Q10 (CO2): Answer incorrectly
   - Progress updates to 10/10

6. **Submit Test**
   - Click "Submit Test"
   - Confirm submission

7. **View Results**
   - **Overall Score**: 60% (6/10 correct, 6/10 marks)
   - **Status**: ❌ Not Passed (Target: 70%)
   - **CO-wise Performance**:
     - **CO1**: 60% (3/5 correct, 3/5 marks) ❌
     - **CO2**: 60% (3/5 correct, 3/5 marks) ❌
   - Can see detailed results with correct/incorrect answers
   - Click "Close"

8. **Verify Results Saved**
   - Back in dashboard, task card shows:
     - "Best MCQ Score: 60%"
     - "Previous Attempts (1/3)" section visible
     - Attempt 1: 60%, 6/10 correct

9. **Retake Test**
   - Click "Retake Quiz (1/3)" button
   - Take test again
   - This time answer more correctly:
     - Q1-Q4 (CO1): Correct
     - Q5 (CO1): Incorrect
     - Q6-Q10 (CO2): All correct
   - Submit

10. **View Improved Results**
    - **Overall Score**: 90% (9/10 correct, 9/10 marks)
    - **Status**: ✓ Passed (Target: 70%)
    - **CO-wise Performance**:
      - **CO1**: 80% (4/5 correct, 4/5 marks) ✓
      - **CO2**: 100% (5/5 correct, 5/5 marks) ✓
    - Best score updated to 90%
    - Previous Attempts shows both:
      - Attempt 2: 90%, 9/10 correct ✓ Passed
      - Attempt 1: 60%, 6/10 correct

### Step 3: Take Test (Student B)

1. **Login as Student B**
   - Navigate to `/student`
   - Go to "Improvement Tasks"

2. **View Task**
   - Should see same task: "Improve CO1 and CO2 Performance"
   - Shows "5 Questions" for this student (only CO1)
   - Status: "Assigned"

3. **Start and Take Test**
   - Start task
   - Click "Take MCQ Quiz (5 Questions)"
   - Answer questions (all CO1)
   - Example: Answer 4 correctly, 1 incorrectly

4. **View Results**
   - **Overall Score**: 80% (4/5 correct, 4/5 marks)
   - **Status**: ✓ Passed
   - **CO-wise Performance**:
     - **CO1**: 80% (4/5 correct, 4/5 marks) ✓

### Step 4: Faculty Views Results

1. **Back to Faculty Dashboard**
   - Go to "Task Management"
   - Find the task

2. **View Task Details**
   - Click "View Details" or task card
   - Should show:
     - **Assigned to**: 2 students
     - **Status**: In Progress (or Completed if both passed)
   
3. **View Individual Results**
   - **Student A**: 
     - Status: Passed
     - Best Score: 90%
     - Attempts: 2/3
     - CO1: 80%, CO2: 100%
   - **Student B**:
     - Status: Passed
     - Best Score: 80%
     - Attempts: 1/3
     - CO1: 80%

### Step 5: Test Edge Cases

#### Max Attempts
1. As Student A, try to take test 1 more time (3rd attempt)
2. Button should show "Retake Quiz (2/3)"
3. After 3rd attempt, button should be disabled: "Max Attempts Reached (3/3)"

#### Timer Expiration
1. Start new test
2. Wait for timer to reach 0
3. Test should auto-submit
4. Results should be calculated based on answered questions

#### Incomplete Test
1. Start test
2. Answer only some questions (e.g., 5/10)
3. Try to submit
4. Should show error: "Please answer all questions before submitting"

#### Task Status
1. When Student A passes, their status updates to "passed"
2. When Student B passes, their status updates to "passed"
3. Overall task status updates to "Completed"
4. Faculty sees both students completed

## Expected Database State

### After Student A's 2nd Attempt:
```javascript
{
  _id: "...",
  title: "Improve CO1 and CO2 Performance",
  studentAssignments: [
    {
      student: <Student A ObjectId>,
      weakCOs: [
        { courseOutcome: "CO1", coNumber: 1, performanceGap: 30, topics: [...] },
        { courseOutcome: "CO2", coNumber: 2, performanceGap: 35, topics: [...] }
      ],
      personalizedQuestions: [ ...10 questions... ],
      totalMarks: 10,
      status: "passed",
      attemptCount: 2,
      scores: [
        {
          percentage: 60,
          obtainedMarks: 6,
          totalMarks: 10,
          correctAnswers: 6,
          totalQuestions: 10,
          passed: false,
          coWiseResults: {
            CO1: { totalQuestions: 5, correctAnswers: 3, totalMarks: 5, obtainedMarks: 3 },
            CO2: { totalQuestions: 5, correctAnswers: 3, totalMarks: 5, obtainedMarks: 3 }
          },
          timestamp: 1705320000000
        },
        {
          percentage: 90,
          obtainedMarks: 9,
          totalMarks: 10,
          correctAnswers: 9,
          totalQuestions: 10,
          passed: true,
          coWiseResults: {
            CO1: { totalQuestions: 5, correctAnswers: 4, totalMarks: 5, obtainedMarks: 4 },
            CO2: { totalQuestions: 5, correctAnswers: 5, totalMarks: 5, obtainedMarks: 5 }
          },
          timestamp: 1705330000000
        }
      ]
    },
    {
      student: <Student B ObjectId>,
      weakCOs: [
        { courseOutcome: "CO1", coNumber: 1, performanceGap: 32, topics: [...] }
      ],
      personalizedQuestions: [ ...5 questions... ],
      totalMarks: 5,
      status: "passed",
      attemptCount: 1,
      scores: [
        {
          percentage: 80,
          obtainedMarks: 4,
          totalMarks: 5,
          correctAnswers: 4,
          totalQuestions: 5,
          passed: true,
          coWiseResults: {
            CO1: { totalQuestions: 5, correctAnswers: 4, totalMarks: 5, obtainedMarks: 4 }
          },
          timestamp: 1705325000000
        }
      ]
    }
  ],
  status: "Completed"
}
```

## Verification Checklist

### Task Creation ✓
- [ ] One task created (not N separate tasks)
- [ ] studentAssignments array has 2 entries
- [ ] Student A has 10 questions (CO1+CO2)
- [ ] Student B has 5 questions (CO1 only)
- [ ] Questions are different for each student

### Test Taking ✓
- [ ] Student A sees 10 questions
- [ ] Student B sees 5 questions
- [ ] Timer works correctly
- [ ] Progress bar updates
- [ ] Navigation works (Previous/Next, grid)
- [ ] Submit validates all answered

### Results Display ✓
- [ ] Overall score calculated correctly
- [ ] CO-wise breakdown shown
- [ ] Pass/Fail status correct (≥70%)
- [ ] Color coding works (green/red)
- [ ] Detailed results show correct/incorrect

### Attempt Tracking ✓
- [ ] Attempt count increments
- [ ] Previous attempts shown in card
- [ ] Full history in detail modal
- [ ] Best score highlighted
- [ ] Max attempts enforced

### Status Updates ✓
- [ ] Individual student status updates
- [ ] Overall task status updates
- [ ] Faculty sees correct status
- [ ] Completed when all students done

### Faculty View ✓
- [ ] Shows "Assigned to 2 students"
- [ ] Can view all students' results
- [ ] Shows each student's CO performance
- [ ] Task statistics correct

## Common Issues and Solutions

### Issue: Questions not showing
- Check `metadata.generatedMCQs.questions` exists
- Verify task status is "In Progress"
- Check student is in studentAssignments array

### Issue: Results not saving
- Check API endpoint response
- Verify studentAssignment.scores array updated
- Check console for errors

### Issue: Wrong question count
- Verify CO filtering logic
- Check studentWeakCONumbers array
- Ensure coConfigs match student's COs

### Issue: Timer not working
- Check browser permissions
- Verify useEffect dependencies
- Check interval cleanup

## Success Criteria

✅ **Complete** when:
1. Faculty can create one task for multiple students
2. Each student sees only their personalized questions
3. Students can take test and see CO-wise results
4. Results are stored with full history
5. Retake functionality works with attempt limits
6. Faculty can view all students' results
7. Status tracking works correctly
8. UI is responsive and user-friendly

## Next Steps

After successful testing:
1. Document any bugs found
2. Gather user feedback
3. Consider enhancements (export, analytics, etc.)
4. Prepare for production deployment
