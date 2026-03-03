'use client'

import { useState, useEffect } from 'react';
import apiService from '../services/api';
import ChapterForm from './ChapterForm';
import MaterialUpload from './MaterialUpload';
import MaterialsGrid from './MaterialsGrid';
import MCQDisplay from './MCQDisplay';
import StudentMarkEntry from './StudentMarkEntry';
import TotalMarksAnalytics from './TotalMarksAnalytics';

interface Subject {
  _id: string
  name: string
  code: string
  department: string | { _id: string; name: string; code: string }
  semester: number
  credits: number
  year: string
  section: string
  description?: string
  faculty?: {
    id?: string
    _id?: string
    name: string
    isPrimary: boolean
    isExternal: boolean
    user?: string | { _id: string; id?: string; name?: string }
  }[]
  maxStudents: number
  enrolledStudents?: string[]
  type?: 'Core' | 'Elective' | 'Open Elective' | 'TCPL' | 'TCPR' | 'Problem Elective'
}

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
}

interface User {
  id: string
  _id?: string
  name: string
  email: string
  role: string
  department?: string | { _id: string; name: string; code: string; id?: string }
  section?: string
  batch?: string
  year?: string
  studentId?: string
  status: string
  enrolledSubjects?: string[] | any[]
}

interface StudentForMarkEntry {
  _id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  year: string;
  section: string;
}

interface Chapter {
  _id: string
  subject: string
  chapterNumber: number
  title: string
  description?: string
  content?: string
  topics?: string[]
  learningOutcomes?: string[]
  estimatedDuration?: number
  displayOrder: number
  status: 'Draft' | 'Published' | 'Archived'
  createdAt: string
  updatedAt: string
}

interface Material {
  _id: string
  chapter: string
  subject: string
  title: string
  type: 'PDF' | 'Video' | 'Link' | 'Document' | 'PPT' | 'Image'
  url?: string
  fileMetadata?: {
    originalName: string
    mimeType: string
    size: number
    filePath: string
  }
  order: number
  duration?: number
  viewCount: number
  downloadCount: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface SubjectsManagementViewProps {
  mySubjects: Subject[]
  myStudents: User[]
  getDepartmentName: (department: any) => string
  showNotification: (message: string, type: 'success' | 'error') => void
}

export default function SubjectsManagementView({
  mySubjects,
  myStudents,
  getDepartmentName,
  showNotification
}: SubjectsManagementViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'subjects' | 'chapters' | 'materials' | 'marks'>('subjects')
  
  // Modal states
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // MCQ Generation states
  const [showMCQModal, setShowMCQModal] = useState(false)
  const [showMCQDisplay, setShowMCQDisplay] = useState(false)
  const [selectedMaterialForMCQ, setSelectedMaterialForMCQ] = useState<string | null>(null)
  const [mcqTopic, setMcqTopic] = useState('')
  const [mcqDifficulty, setMcqDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [mcqCount, setMcqCount] = useState(5)
  const [generatedMCQs, setGeneratedMCQs] = useState<any[]>([])
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const [generatingMCQs, setGeneratingMCQs] = useState(false)
  const [extractingTopics, setExtractingTopics] = useState(false)
  
  // Marks tab state
  const [activeTab, setActiveTab] = useState<'entry' | 'analytics'>('entry')
  
  // Form states
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    content: '',
    chapterNumber: 1,
    topics: '',
    learningOutcomes: '',
    estimatedDuration: 1,
    status: 'Draft' as 'Draft' | 'Published' | 'Archived'
  })
  
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'PDF' as 'PDF',
    file: null as File | null,
    tags: ''
  })

  const getStudentsForSubject = (subject: Subject) => {
    return myStudents.filter((student: User) => {
      // First check enrolledSubjects array (this is what the backend sync updates)
      if (student.enrolledSubjects && Array.isArray(student.enrolledSubjects)) {
        const enrolledMatch = student.enrolledSubjects.some((enrolledSubjectId: any) => {
          // Handle both ObjectId objects and string IDs
          const enrolledId = enrolledSubjectId._id || enrolledSubjectId
          return enrolledId === subject._id || String(enrolledId) === String(subject._id)
        })
        
        if (enrolledMatch) {
          return true
        }
      }
      
      // Fallback to department/year/section matching
      const userDeptName = getDepartmentName(student.department)
      const subjectDeptName = getDepartmentName(subject.department)
      
      return userDeptName === subjectDeptName && 
             student.year === subject.year &&
             student.section === subject.section
    })
  }

  const getStudentsForSubjectAsStudentType = (subject: Subject): StudentForMarkEntry[] => {
    const users = getStudentsForSubject(subject);
    return users.map(user => {
      const department = typeof user.department === 'object' 
        ? user.department 
        : { _id: 'unknown', name: 'Unknown', code: 'UNK' };

      return {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        rollNumber: user.studentId || 'N/A',
        department: {
          _id: department._id || 'unknown',
          name: department.name || 'Unknown',
          code: department.code || 'UNK'
        },
        year: user.year || subject.year,
        section: user.section || subject.section,
      };
    });
  }

  const loadChapters = async (subjectId: string) => {
    try {
      setLoading(true)
      const response = await apiService.getChaptersBySubject(subjectId)
      console.log('📥 Chapters response:', response)
      if (response.success) {
        // Backend returns chapters in 'data' field, not 'chapters'
        setChapters(response.data || [])
      }
    } catch (error) {
      console.error('Error loading chapters:', error)
      showNotification('Failed to load chapters', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async (chapterId: string) => {
    try {
      setLoading(true)
      console.log('📥 Loading materials for chapter:', chapterId)
      const response = await apiService.getMaterialsByChapter(chapterId)
      console.log('📦 Materials response:', response)
      if (response.success) {
        // Backend returns materials in 'data' field, not 'materials'
        setMaterials(response.data || [])
        console.log('✅ Materials loaded successfully:', response.data?.length || 0)
      }
    } catch (error) {
      console.error('Error loading materials:', error)
      showNotification('Failed to load materials', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject)
    setView('chapters')
    await loadChapters(subject._id)
  }

  const handleChapterClick = async (chapter: Chapter) => {
    setSelectedChapter(chapter)
    setView('materials')
    await loadMaterials(chapter._id)
  }

  const handleBackToSubjects = () => {
    setSelectedSubject(null)
    setSelectedChapter(null)
    setView('subjects')
    setChapters([])
    setMaterials([])
  }

  const handleBackToChapters = () => {
    setSelectedChapter(null)
    setView('chapters')
    setMaterials([])
  }

  const handleCreateChapter = () => {
    setIsEditMode(false)
    setChapterForm({
      title: '',
      description: '',
      content: '',
      chapterNumber: chapters.length + 1,
      topics: '',
      learningOutcomes: '',
      estimatedDuration: 1,
      status: 'Draft'
    })
    setShowChapterModal(true)
  }

  const handleEditChapter = (chapter: Chapter) => {
    setIsEditMode(true)
    setChapterForm({
      title: chapter.title,
      description: chapter.description || '',
      content: chapter.content || '',
      chapterNumber: chapter.chapterNumber,
      topics: chapter.topics?.join(', ') || '',
      learningOutcomes: chapter.learningOutcomes?.join(', ') || '',
      estimatedDuration: chapter.estimatedDuration || 1,
      status: chapter.status
    })
    setSelectedChapter(chapter)
    setShowChapterModal(true)
  }

  const handleSaveChapter = async (chapterData: any) => {
    if (!selectedSubject) return
    
    try {
      setLoading(true)
      // Don't send 'subject' field - it's in the URL already
      const dataToSave = {
        ...chapterData,
        displayOrder: chapterData.chapterNumber
      }

      console.log('📤 Sending chapter data:', dataToSave)
      console.log('📊 Data types:', {
        title: typeof dataToSave.title,
        chapterNumber: typeof dataToSave.chapterNumber,
        estimatedDuration: typeof dataToSave.estimatedDuration,
        topics: Array.isArray(dataToSave.topics),
        learningOutcomes: Array.isArray(dataToSave.learningOutcomes),
        status: typeof dataToSave.status
      })

      let response
      if (isEditMode && selectedChapter) {
        response = await apiService.updateChapter(selectedChapter._id, dataToSave)
      } else {
        response = await apiService.createChapter(selectedSubject._id, dataToSave)
      }

      console.log('✅ Response:', response)

      if (response.success) {
        showNotification(`Chapter ${isEditMode ? 'updated' : 'created'} successfully`, 'success')
        setShowChapterModal(false)
        await loadChapters(selectedSubject._id)
      } else {
        console.error('❌ Backend returned error:', response)
        showNotification(response.message || 'Failed to create chapter', 'error')
      }
    } catch (error: any) {
      console.error('❌ Error saving chapter:', error)
      console.error('Error details:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create chapter'
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return
    
    try {
      setLoading(true)
      const response = await apiService.deleteChapter(chapterId)
      if (response.success) {
        showNotification('Chapter deleted successfully', 'success')
        if (selectedSubject) {
          await loadChapters(selectedSubject._id)
        }
      }
    } catch (error) {
      console.error('Error deleting chapter:', error)
      showNotification('Failed to delete chapter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = () => {
    setIsEditMode(false)
    setMaterialForm({
      title: '',
      type: 'PDF',
      file: null,
      tags: ''
    })
    setShowMaterialModal(true)
  }

  const handleSaveMaterial = async () => {
    if (!selectedChapter || !selectedSubject) return
    
    try {
      setLoading(true)
      const formData = new FormData()
      
      // Add required fields for both material and PDF endpoints
      formData.append('subject', selectedSubject._id)
      formData.append('chapter', selectedChapter._id)
      formData.append('title', materialForm.title)
      formData.append('type', materialForm.type)
      formData.append('description', `${materialForm.type} material for ${selectedChapter.title}`)
      formData.append('order', String(materials.length + 1))
      
      if (materialForm.file) {
        formData.append('file', materialForm.file)
      }
      
      if (materialForm.tags) {
        const tagsArray = materialForm.tags.split(',').map(t => t.trim()).filter(t => t)
        formData.append('tags', JSON.stringify(tagsArray))
      }

      console.log('📤 Uploading material:', {
        title: materialForm.title,
        type: materialForm.type,
        file: materialForm.file?.name,
        chapter: selectedChapter.title,
        subject: selectedSubject.name
      })

      const response = await apiService.createMaterial(selectedChapter._id, formData)
      
      if (response.success) {
        showNotification('Material uploaded successfully', 'success')
        setShowMaterialModal(false)
        setMaterialForm({
          title: '',
          type: 'PDF',
          file: null,
          tags: ''
        })
        await loadMaterials(selectedChapter._id)
      }
    } catch (error: any) {
      console.error('Error saving material:', error)
      showNotification(`Failed to upload material: ${error.message || 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This will permanently delete the file from the server.')) return
    
    try {
      setLoading(true)
      const response = await apiService.deleteMaterial(materialId)
      if (response.success) {
        showNotification('Material and file deleted successfully', 'success')
        if (selectedChapter) {
          await loadMaterials(selectedChapter._id)
        }
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      showNotification('Failed to delete material', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadMaterial = async (materialId: string) => {
    try {
      const material = materials.find(m => m._id === materialId)
      if (!material) {
        showNotification('Material not found', 'error')
        return
      }
      
      // Download the file
      await apiService.downloadMaterialFile(materialId, material.fileMetadata?.originalName || material.title)
      
      // Record download for analytics
      await apiService.recordMaterialDownload(materialId)
      
      showNotification('Download started successfully', 'success')
      
      // Reload to update download count
      if (selectedChapter) {
        await loadMaterials(selectedChapter._id)
      }
    } catch (error) {
      console.error('Error downloading material:', error)
      showNotification('Failed to download material', 'error')
    }
  }

  const handleViewMaterial = async (material: Material) => {
    try {
      // Get blob URL and open in new tab
      const blobUrl = await apiService.viewMaterialFile(material._id)
      window.open(blobUrl, '_blank')
      
      // Record view for analytics (don't wait for this)
      apiService.recordMaterialDownload(material._id).catch(err => 
        console.error('Failed to record view:', err)
      )
      
      // Reload to update view count
      if (selectedChapter) {
        setTimeout(() => loadMaterials(selectedChapter._id), 1000)
      }
    } catch (error) {
      console.error('Error viewing material:', error)
      showNotification('Failed to open material', 'error')
    }
  }

  // MCQ Generation Handlers
  const handleGenerateMCQClick = async (materialId: string) => {
    setSelectedMaterialForMCQ(materialId)
    setShowMCQModal(true)
    setMcqTopic('')
    setSuggestedTopics([])
    
    // Extract topics from the material
    setExtractingTopics(true)
    try {
      const response = await apiService.extractTopicsFromMaterial(materialId)
      if (response.success && response.data.topics) {
        setSuggestedTopics(response.data.topics)
      }
    } catch (error) {
      console.error('Error extracting topics:', error)
      // Don't show error notification, user can still enter topic manually
    } finally {
      setExtractingTopics(false)
    }
  }

  const handleGenerateMCQs = async () => {
    if (!selectedMaterialForMCQ || !mcqTopic.trim()) {
      showNotification('Please enter a topic for MCQ generation', 'error')
      return
    }

    setGeneratingMCQs(true)
    try {
      const response = await apiService.generateMCQs(
        selectedMaterialForMCQ,
        mcqTopic,
        mcqCount,
        mcqDifficulty
      )

      if (response.success && response.data.mcqs) {
        setGeneratedMCQs(response.data.mcqs)
        setShowMCQModal(false)
        setShowMCQDisplay(true)
        showNotification(`Successfully generated ${response.data.mcqs.length} MCQs!`, 'success')
      } else {
        showNotification('Failed to generate MCQs. Please try again.', 'error')
      }
    } catch (error: any) {
      console.error('Error generating MCQs:', error)
      showNotification(error.message || 'Failed to generate MCQs', 'error')
    } finally {
      setGeneratingMCQs(false)
    }
  }

  const handleCloseMCQDisplay = () => {
    setShowMCQDisplay(false)
    setGeneratedMCQs([])
    setSelectedMaterialForMCQ(null)
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄'
      case 'Video': return '🎥'
      case 'Link': return '🔗'
      case 'Document': return '📝'
      case 'PPT': return '📊'
      case 'Image': return '🖼️'
      default: return '📎'
    }
  }

  // Subjects List View
  if (view === 'subjects') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 bg-clip-text text-transparent">
              My Subjects
            </h2>
            <p className="text-gray-600 mt-2">Manage your courses, chapters, and learning materials</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-600">{mySubjects.length} Subjects</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySubjects.map((subject) => {
            const students = getStudentsForSubject(subject)
            return (
              <div
                key={subject._id}
                onClick={() => handleSubjectClick(subject)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-l-4 border-blue-600 hover:scale-105 transform duration-300"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{subject.name}</h3>
                  <p className="text-sm text-gray-600 font-mono">{subject.code}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {getDepartmentName(subject.department)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Class:</span>
                    <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {subject.year} - Section {subject.section}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Students:</span>
                    <span className="text-sm font-bold text-blue-700">{students.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credits:</span>
                    <span className="text-sm font-medium">{subject.credits}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Semester:</span>
                    <span className="text-sm font-medium">{subject.semester}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubjectClick(subject);
                      }}
                      className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-all font-medium text-sm"
                    >
                      📚 Chapters
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubject(subject);
                        setView('marks');
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-2 px-3 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all font-medium text-sm"
                    >
                      📊 Marks
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {mySubjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 text-lg">No subjects assigned yet</p>
          </div>
        )}
      </div>
    )
  }

  // Chapters View
  if (view === 'chapters' && selectedSubject) {
    const students = getStudentsForSubject(selectedSubject)
    
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={handleBackToSubjects} className="text-blue-700 hover:text-blue-900 font-medium">
            ← Back to Subjects
          </button>
        </div>

        {/* Subject Info Card */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{selectedSubject.name}</h2>
              <p className="text-blue-200 mb-4">{selectedSubject.code}</p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {getDepartmentName(selectedSubject.department)}
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {selectedSubject.year} - Section {selectedSubject.section}
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  👥 {students.length} Students
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  📖 {chapters.length} Chapters
                </span>
              </div>
            </div>
            <button
              onClick={handleCreateChapter}
              className="bg-white text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all font-medium shadow-lg"
            >
              + Add Chapter
            </button>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Enrolled Students</h3>
          {students.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.slice(0, 6).map((student) => (
                <div key={student.id || student._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.studentId || student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No students enrolled</p>
          )}
          {students.length > 6 && (
            <p className="text-sm text-blue-700 mt-4">+{students.length - 6} more students</p>
          )}
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Chapters</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div
                  key={chapter._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-l-4 border-blue-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => handleChapterClick(chapter)}>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                          Chapter {chapter.chapterNumber}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          chapter.status === 'Published' ? 'bg-green-100 text-green-800' :
                          chapter.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {chapter.status}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">{chapter.title}</h4>
                      {chapter.description && (
                        <p className="text-gray-600 text-sm mb-3">{chapter.description}</p>
                      )}
                      {chapter.topics && chapter.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {chapter.topics.map((topic, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {chapter.estimatedDuration && (
                          <span>⏱️ {chapter.estimatedDuration} {chapter.estimatedDuration === 1 ? 'hour' : 'hours'}</span>
                        )}
                        <span>📝 Click to view materials</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditChapter(chapter)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg mb-4">No chapters created yet</p>
              <button
                onClick={handleCreateChapter}
                className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-all font-medium"
              >
                Create Your First Chapter
              </button>
            </div>
          )}
        </div>

        {/* Chapter Form */}
        <ChapterForm
          isOpen={showChapterModal}
          isEditMode={isEditMode}
          chapterData={isEditMode && selectedChapter ? {
            _id: selectedChapter._id,
            title: selectedChapter.title,
            chapterNumber: selectedChapter.chapterNumber,
            description: selectedChapter.description || '',
            content: selectedChapter.content || '',
            topics: selectedChapter.topics || [],
            learningOutcomes: selectedChapter.learningOutcomes || [],
            status: selectedChapter.status
          } : undefined}
          onClose={() => setShowChapterModal(false)}
          onSave={handleSaveChapter}
          loading={loading}
        />
      </div>
    )
  }

  // Materials View
  if (view === 'materials' && selectedChapter && selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={handleBackToSubjects} className="text-blue-700 hover:text-blue-900">
            Subjects
          </button>
          <span className="text-gray-400">/</span>
          <button onClick={handleBackToChapters} className="text-blue-700 hover:text-blue-900 font-medium">
            ← {selectedSubject.name}
          </button>
        </div>

        {/* Chapter Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-3 inline-block">
                Chapter {selectedChapter.chapterNumber}
              </span>
              <h2 className="text-3xl font-bold mb-2">{selectedChapter.title}</h2>
              {selectedChapter.description && (
                <p className="text-blue-200 mb-4">{selectedChapter.description}</p>
              )}
              <div className="flex items-center space-x-3">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  📚 {materials.length} Materials
                </span>
                {selectedChapter.estimatedDuration && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                    ⏱️ {selectedChapter.estimatedDuration} {selectedChapter.estimatedDuration === 1 ? 'hour' : 'hours'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateMaterial}
              className="bg-white text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all font-medium shadow-lg"
            >
              + Upload Material
            </button>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Learning Materials</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            </div>
          ) : (
            <MaterialsGrid
              materials={materials}
              onDownload={handleDownloadMaterial}
              onDelete={handleDeleteMaterial}
              onView={handleViewMaterial}
              onGenerateMCQ={handleGenerateMCQClick}
              canEdit={true}
            />
          )}
        </div>

        {/* Material Upload Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold">Upload Learning Material</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Title *</label>
                  <input
                    type="text"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter material title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({...materialForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PDF">PDF Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF File *</label>
                  <input
                    type="file"
                    onChange={(e) => setMaterialForm({...materialForm, file: e.target.files?.[0] || null})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    accept=".pdf"
                    required
                  />
                  {materialForm.file && (
                    <p className="mt-2 text-sm text-gray-600">
                      📄 Selected: {materialForm.file.name} ({(materialForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={materialForm.tags}
                    onChange={(e) => setMaterialForm({...materialForm, tags: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="important, exam, reference"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                <button
                  onClick={() => setShowMaterialModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMaterial}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-all disabled:opacity-50"
                  disabled={loading || !materialForm.title || !materialForm.file}
                >
                  {loading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MCQ Generation Modal */}
        {showMCQModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold">⚡ Generate MCQs with AI</h3>
                <p className="text-blue-200 mt-2">Using Groq AI with RAG (Retrieval Augmented Generation)</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Topic Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic for MCQ Generation *
                  </label>
                  <input
                    type="text"
                    value={mcqTopic}
                    onChange={(e) => setMcqTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Data Structures, Algorithms, SCRUM Framework"
                    disabled={generatingMCQs}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the specific topic you want to generate questions about
                  </p>
                </div>

                {/* Suggested Topics */}
                {extractingTopics ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    Extracting topics from PDF...
                  </div>
                ) : suggestedTopics.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💡 Suggested Topics (click to select)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTopics.map((topic, index) => (
                        <button
                          key={index}
                          onClick={() => setMcqTopic(topic)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-all"
                          disabled={generatingMCQs}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={mcqCount}
                    onChange={(e) => setMcqCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generatingMCQs}
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-3">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setMcqDifficulty(level as 'easy' | 'medium' | 'hard')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          mcqDifficulty === level
                            ? level === 'easy'
                              ? 'bg-green-500 text-white'
                              : level === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={generatingMCQs}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">ℹ️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>How it works:</strong> The AI will analyze the PDF content, find relevant information about your topic using RAG, and generate multiple choice questions with explanations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                <button
                  onClick={() => setShowMCQModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={generatingMCQs}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateMCQs}
                  className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  disabled={generatingMCQs || !mcqTopic.trim()}
                >
                  {generatingMCQs ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      ⚡ Generate MCQs
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MCQ Display Modal */}
        {showMCQDisplay && generatedMCQs.length > 0 && (
          <MCQDisplay
            mcqs={generatedMCQs}
            onClose={handleCloseMCQDisplay}
            metadata={{
              materialTitle: materials.find(m => m._id === selectedMaterialForMCQ)?.title || 'Material',
              topic: mcqTopic,
              difficulty: mcqDifficulty
            }}
          />
        )}
      </div>
    )
  }

  // Marks View
  if (view === 'marks' && selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={handleBackToSubjects} className="text-blue-700 hover:text-blue-900 font-medium">
            ← Back to Subjects
          </button>
        </div>

        {/* Subject Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">📊 Mark Entry</h2>
              <p className="text-indigo-100 mb-2">{selectedSubject.name} - {selectedSubject.code}</p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-sm">
                  {getDepartmentName(selectedSubject.department)}
                </span>
                <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-sm">
                  {selectedSubject.year} - Section {selectedSubject.section}
                </span>
                <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-sm">
                  Semester {selectedSubject.semester}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">{getStudentsForSubject(selectedSubject).length}</div>
              <div className="text-indigo-200 text-sm">Students</div>
            </div>
          </div>
        </div>

        {/* Mark Entry and Analytics Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entry'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Mark Entry
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Performance Analytics
              </button>
            </nav>
          </div>
          
          <div className="p-1">
            {activeTab === 'entry' ? (
              <StudentMarkEntry 
                preSelectedSubject={{
                  ...selectedSubject,
                  department: typeof selectedSubject.department === 'string' 
                    ? { _id: selectedSubject.department, name: getDepartmentName(selectedSubject.department), code: '' } 
                    : selectedSubject.department,
                  type: selectedSubject.type || 'Core',
                  semester: selectedSubject.semester
                }}
                preSelectedStudents={getStudentsForSubjectAsStudentType(selectedSubject)}
              />
            ) : (
              <TotalMarksAnalytics 
                subjectId={selectedSubject._id}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
