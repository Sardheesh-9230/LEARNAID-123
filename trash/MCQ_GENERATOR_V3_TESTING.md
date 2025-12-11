# MCQ Generator V3 - Testing Guide

## 🎯 Quick Test Steps

### Prerequisites
✅ Both servers running:
- Frontend: http://localhost:3000 (port 3000)
- Backend: http://localhost:5000 (port 5000)

### Test Flow

#### 1. Login as Faculty
```
http://localhost:3000/login
Role: Faculty
```

#### 2. Go to Faculty Dashboard
```
http://localhost:3000/faculty
```

#### 3. Click "MCQ Generator" Tab
You should see a beautiful redirect page with:
- New features listed
- "Launch New MCQ Generator" button

#### 4. Click "Launch New MCQ Generator"
OR directly navigate to:
```
http://localhost:3000/faculty/mcq-generator
```

#### 5. Follow the 3-Step Flow

**Step 1: Select Subject**
- View all your assigned subjects
- See subject code, type, year, section
- Click to select one

**Step 2: Select Chapter**
- After selecting subject, chapters load automatically
- View chapter number, title, description
- Click to select one

**Step 3: Select PDF Material**
- After selecting chapter, PDF materials load
- See only PDF type materials
- View file size
- Click to select one

#### 6. Configure Generation
- **Topics**: Auto-filled from chapter (editable)
- **Number of Questions**: 3-20
- **Difficulty**: Easy/Medium/Hard

#### 7. Generate MCQs
- Click "Generate MCQs with AI"
- Wait 10-30 seconds (loading indicator shown)
- MCQs display in modal

#### 8. View Results
- Review all generated questions
- See options with correct answer highlighted
- Read explanations
- Download as JSON or text
- Take interactive quiz

## 🧪 Test Cases

### Test Case 1: No Materials
**Expected**: Error message "No PDF materials found for this chapter"

### Test Case 2: Empty Topic
**Expected**: Error message "Please enter topics for MCQ generation"

### Test Case 3: Short Topic (< 3 chars)
**Expected**: Error message "Topics must be at least 3 characters"

### Test Case 4: Valid Generation
**Input**:
- Material: Any PDF
- Topics: "Data Structures, Arrays"
- Questions: 5
- Difficulty: Medium

**Expected**:
- Success message
- 5 MCQs displayed
- Each MCQ has:
  - Question text
  - 4 options
  - Correct answer marked
  - Explanation
  - Difficulty badge

### Test Case 5: Invalid PDF
**Expected**: Error message about PDF extraction failure

### Test Case 6: No Relevant Content
**Topics**: "Quantum Physics" (on a CS PDF)
**Expected**: Error message "No relevant content found for topics"

## 🔍 Backend Testing

### Test API Endpoints

#### 1. Get Subjects
```bash
curl -X GET http://localhost:5000/api/mcq-generator/subjects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Get Chapters
```bash
curl -X GET http://localhost:5000/api/mcq-generator/subjects/SUBJECT_ID/chapters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Get Materials
```bash
curl -X GET http://localhost:5000/api/mcq-generator/chapters/CHAPTER_ID/materials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Generate MCQs
```bash
curl -X POST http://localhost:5000/api/mcq-generator/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "materialId": "MATERIAL_ID",
    "topics": "Data Structures, Arrays",
    "numberOfQuestions": 5,
    "difficulty": "medium"
  }'
```

## 📝 Console Logs to Check

### Frontend Console
```
🚀 Generating MCQs: { materialId, topics, numberOfQuestions, difficulty }
✅ MCQs generated successfully: 5
```

### Backend Console
```
🚀 ====== MCQ GENERATION STARTED ======
📝 Request parameters: { ... }
📄 Extracting text from PDF...
✅ Extracted X characters from Y pages
✂️ Chunking text...
✅ Created X chunks
✅ Added X document chunks to vector store
🔍 Searching for relevant content on topics: "..."
✅ Found X relevant chunks
🤖 Calling Groq AI API...
📥 Received response from Groq
✅ Successfully validated X/Y MCQs
🎉 ====== MCQ GENERATION COMPLETED ======
```

## 🐛 Common Issues & Solutions

### Issue 1: "No subjects available"
**Solution**: Make sure you're logged in as Faculty and have assigned subjects

### Issue 2: "No chapters found"
**Solution**: Add chapters to the subject in Subject Management

### Issue 3: "No PDF materials found"
**Solution**: Upload PDF materials in Subject Management → Chapters

### Issue 4: "Failed to extract text from PDF"
**Possible Causes**:
- PDF is image-based (scanned document)
- PDF is encrypted/password-protected
- PDF is corrupted
- File not found on server

### Issue 5: "AI service temporarily unavailable"
**Solution**: Check GROQ_API_KEY in backend .env file

### Issue 6: "No relevant content found"
**Solution**: 
- Use more general topic keywords
- Ensure topics match PDF content
- Try different topic combinations

## ✅ Success Indicators

- [x] Frontend loads without errors
- [x] Backend shows route registration
- [x] Can navigate to /faculty/mcq-generator
- [x] Subjects load in Step 1
- [x] Chapters load after subject selection
- [x] Materials load after chapter selection
- [x] Topics auto-populate from chapter
- [x] Generate button enables when material selected
- [x] Loading indicator shows during generation
- [x] MCQs display in modal
- [x] Can download/export MCQs
- [x] Error messages are clear and helpful

## 🎨 UI/UX Checklist

- [x] Beautiful gradient header
- [x] Breadcrumb navigation works
- [x] Cards highlight on selection
- [x] Disabled states clear
- [x] Loading spinners show
- [x] Error messages styled properly
- [x] Success messages styled properly
- [x] Modal displays correctly
- [x] Responsive on mobile
- [x] Smooth transitions

## 📊 Performance Metrics

- **PDF Extraction**: < 5 seconds
- **Vector Store Build**: < 2 seconds
- **Context Retrieval**: < 1 second
- **AI Generation**: 10-30 seconds
- **Total Time**: 15-40 seconds

## 🔒 Security Checklist

- [x] JWT authentication required
- [x] Faculty/Admin role check
- [x] Material ownership validation
- [x] File path traversal prevention
- [x] Input sanitization
- [x] File size limits enforced
- [x] SQL injection prevention
- [x] XSS protection

---

**Status**: Ready for Testing ✅
**Version**: 3.0.0
**Date**: November 13, 2025
