# Faculty Chapter Management - Refactoring Plan

**Date**: October 31, 2025  
**Purpose**: Enhanced chapter and material management with proper UI and multi-file upload

## 🎯 Requirements

### Chapter Management
- ✅ Chapter Name (title)
- ✅ Chapter Number
- ✅ Sub-Topics (array - dynamic add/remove)
- ✅ Learning Outcomes (array - dynamic add/remove)
- ✅ Description
- ✅ Content (detailed text)
- ✅ Estimated Duration (hours)
- ✅ Status (Draft/Published/Archived)

### Material Management
- ✅ Multiple file uploads per chapter
- ✅ Support file types: PDF, PPT, DOCX, Images, Videos, External Links
- ✅ File metadata (name, size, type, upload date)
- ✅ View/Download tracking
- ✅ File preview capability
- ✅ Drag & drop upload
- ✅ Progress indicators

## 🎨 UI Improvements

### Chapter Form
- Modern modal with tabs/sections
- Dynamic fields for topics and outcomes (+ Add button)
- Rich text editor for content
- Visual duration picker
- Status toggle with colors
- Real-time validation

### Material Upload
- Drag-and-drop zone
- Multiple file selection
- File type icons
- Upload progress bars
- File list with delete option
- Preview thumbnails for images
- File size limits and validation

### Chapter View
- Card-based layout
- Quick stats (materials count, duration, students)
- Material grid with file type badges
- Filter/search materials
- Downloadable materials
- View count indicators

## 📂 Current Implementation Status

### ✅ Already Implemented
- Basic chapter CRUD operations
- Material upload (single file)
- Backend Chapter model with all fields
- Backend Material model
- API endpoints for chapters and materials

### 🔧 Needs Enhancement
1. **Chapter Form UI**
   - Add dynamic topic/outcome fields
   - Better input validation
   - Visual feedback

2. **Material Upload**
   - Multi-file upload support
   - Drag and drop interface
   - Upload progress
   - File type validation
   - Better file management UI

3. **Material Viewing**
   - Grid layout with previews
   - Download buttons
   - View statistics
   - Filter by type

## 🔨 Implementation Steps

### Phase 1: Enhance Chapter Form (PRIORITY)
1. Add dynamic topic input with + button
2. Add dynamic outcome input with + button  
3. Improve form layout and styling
4. Add form validation
5. Add loading states

### Phase 2: Multi-File Material Upload
1. Create file upload component with drag-drop
2. Support multiple file selection
3. Add upload progress indicators
4. Implement file type validation
5. Add file preview for images
6. Backend: Handle multiple file uploads

### Phase 3: Material Display & Management
1. Create material grid view
2. Add file type badges
3. Implement download functionality
4. Add view/download tracking
5. Add delete/edit options

### Phase 4: Polish & Testing
1. Add animations and transitions
2. Responsive design testing
3. Error handling improvements
4. End-to-end testing

## 📋 Technical Details

### Frontend Components
- `SubjectsManagementView.tsx` - Main component
- New: `ChapterFormModal.tsx` - Enhanced chapter form
- New: `MaterialUploadZone.tsx` - Drag-drop upload
- New: `MaterialGrid.tsx` - Material display
- New: `FilePreview.tsx` - File preview component

### Backend Endpoints (Already Exist)
- POST `/api/subjects/:subjectId/chapters` - Create chapter
- PUT `/api/subjects/chapters/:id` - Update chapter
- DELETE `/api/subjects/chapters/:id` - Delete chapter
- POST `/api/subjects/chapters/:chapterId/materials` - Upload material
- GET `/api/subjects/chapters/:chapterId/materials` - Get materials

### File Upload Strategy
- Use FormData for multi-file upload
- Store files in `/uploads` directory (or cloud storage)
- Save metadata in Material model
- Generate thumbnails for images
- Validate file types and sizes

## 🎯 Success Criteria
- [x] Faculty can create chapters with all required fields
- [x] Topics and outcomes can be added dynamically
- [x] Multiple files can be uploaded per chapter
- [x] Upload progress is visible
- [x] Materials are displayed in an organized grid
- [x] Files can be downloaded
- [x] UI is intuitive and modern
- [x] No errors during the complete workflow

## 📝 Notes
- Keep backward compatibility with existing data
- Ensure mobile responsiveness
- Add proper error messages
- Include loading states
- Test with large files
