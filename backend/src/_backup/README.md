# Backup - Broken MCQ Routes

## Files Moved Here (November 13, 2025)

- `mcq.js` - Referenced non-existent `../controllers/mcqController`
- `mcqV2.js` - Referenced non-existent `../controllers/mcqControllerV2`

## Issue

These route files were causing the backend to crash on startup with:
```
Error: Cannot find module '../controllers/mcqController'
```

The controller files they reference were never created in the project.

## Current Working Solution

**Active MCQ System**: `mcqGeneratorV3.js`
- **Route File**: `backend/src/routes/mcqGeneratorV3.js`
- **API Endpoint**: `/api/mcq-generator`
- **Frontend**: `src/components/MCQGeneratorV3.tsx`
- **Features**:
  - Hierarchical selection (Subject → Chapter → Material)
  - RAG-based AI MCQ generation with Groq
  - Enhanced PDF parsing
  - Topic extraction

## Note

These files are kept for reference. The mcqGeneratorV3 route file has embedded controller logic, which is why it works without a separate controller file.
