'use client'

import { useState, useEffect } from 'react';
import apiService from '../services/api';

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
    filename: string
    originalName: string
    size: number
    mimetype: string
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
  const [view, setView] = useState<'subjects' | 'chapters' | 'materials'>('subjects')
  
  // Modal states
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Form states
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    content: '',
    chapterNumber: 1,
    topics: '',
    learningOutcomes: '',
    estimatedDuration: 60,
    status: 'Draft' as 'Draft' | 'Published' | 'Archived'
  })
  
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'PDF' as 'PDF' | 'Video' | 'Link' | 'Document' | 'PPT' | 'Image',
    url: '',
    file: null as File | null,
    duration: 0,
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

  const loadChapters = async (subjectId: string) => {
    try {
      setLoading(true)
      const response = await apiService.getChaptersBySubject(subjectId)
      if (response.success) {
        setChapters(response.chapters || [])
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
      const response = await apiService.getMaterialsByChapter(chapterId)
      if (response.success) {
        setMaterials(response.materials || [])
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
      estimatedDuration: 60,
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
      estimatedDuration: chapter.estimatedDuration || 60,
      status: chapter.status
    })
    setSelectedChapter(chapter)
    setShowChapterModal(true)
  }

  const handleSaveChapter = async () => {
    if (!selectedSubject) return
    
    try {
      setLoading(true)
      const chapterData = {
        subject: selectedSubject._id,
        title: chapterForm.title,
        description: chapterForm.description,
        content: chapterForm.content,
        chapterNumber: chapterForm.chapterNumber,
        topics: chapterForm.topics.split(',').map(t => t.trim()).filter(t => t),
        learningOutcomes: chapterForm.learningOutcomes.split(',').map(l => l.trim()).filter(l => l),
        estimatedDuration: chapterForm.estimatedDuration,
        displayOrder: chapterForm.chapterNumber,
        status: chapterForm.status
      }

      let response
      if (isEditMode && selectedChapter) {
        response = await apiService.updateChapter(selectedChapter._id, chapterData)
      } else {
        response = await apiService.createChapter(selectedSubject._id, chapterData)
      }

      if (response.success) {
        showNotification(`Chapter ${isEditMode ? 'updated' : 'created'} successfully`, 'success')
        setShowChapterModal(false)
        await loadChapters(selectedSubject._id)
      }
    } catch (error) {
      console.error('Error saving chapter:', error)
      showNotification(`Failed to ${isEditMode ? 'update' : 'create'} chapter`, 'error')
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
      url: '',
      file: null,
      duration: 0,
      tags: ''
    })
    setShowMaterialModal(true)
  }

  const handleSaveMaterial = async () => {
    if (!selectedChapter || !selectedSubject) return
    
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('chapter', selectedChapter._id)
      formData.append('subject', selectedSubject._id)
      formData.append('title', materialForm.title)
      formData.append('type', materialForm.type)
      formData.append('order', String(materials.length + 1))
      
      if (materialForm.file) {
        formData.append('file', materialForm.file)
      } else if (materialForm.url) {
        formData.append('url', materialForm.url)
      }
      
      if (materialForm.duration) {
        formData.append('duration', String(materialForm.duration))
      }
      
      if (materialForm.tags) {
        const tagsArray = materialForm.tags.split(',').map(t => t.trim()).filter(t => t)
        formData.append('tags', JSON.stringify(tagsArray))
      }

      const response = await apiService.createMaterial(selectedChapter._id, formData)
      
      if (response.success) {
        showNotification('Material uploaded successfully', 'success')
        setShowMaterialModal(false)
        await loadMaterials(selectedChapter._id)
      }
    } catch (error) {
      console.error('Error saving material:', error)
      showNotification('Failed to upload material', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    
    try {
      setLoading(true)
      const response = await apiService.deleteMaterial(materialId)
      if (response.success) {
        showNotification('Material deleted successfully', 'success')
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
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-l-4 border-purple-500 hover:scale-105 transform duration-300"
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
                    <span className="text-sm font-bold text-purple-600">{students.length}</span>
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
                  <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium">
                    View Details →
                  </button>
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
          <button onClick={handleBackToSubjects} className="text-purple-600 hover:text-purple-800 font-medium">
            ← Back to Subjects
          </button>
        </div>

        {/* Subject Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{selectedSubject.name}</h2>
              <p className="text-purple-100 mb-4">{selectedSubject.code}</p>
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
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-all font-medium shadow-lg"
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
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
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
            <p className="text-sm text-purple-600 mt-4">+{students.length - 6} more students</p>
          )}
        </div>

        {/* Chapters List */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Chapters</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div
                  key={chapter._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-l-4 border-purple-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => handleChapterClick(chapter)}>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
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
                          <span>⏱️ {chapter.estimatedDuration} mins</span>
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
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
              >
                Create Your First Chapter
              </button>
            </div>
          )}
        </div>

        {/* Chapter Modal */}
        {showChapterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold">{isEditMode ? 'Edit Chapter' : 'Create New Chapter'}</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Number</label>
                  <input
                    type="number"
                    value={chapterForm.chapterNumber}
                    onChange={(e) => setChapterForm({...chapterForm, chapterNumber: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Title *</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({...chapterForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter chapter title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm({...chapterForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the chapter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({...chapterForm, content: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={5}
                    placeholder="Detailed chapter content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topics (comma-separated)</label>
                  <input
                    type="text"
                    value={chapterForm.topics}
                    onChange={(e) => setChapterForm({...chapterForm, topics: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Topic 1, Topic 2, Topic 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Outcomes (comma-separated)</label>
                  <input
                    type="text"
                    value={chapterForm.learningOutcomes}
                    onChange={(e) => setChapterForm({...chapterForm, learningOutcomes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Outcome 1, Outcome 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    value={chapterForm.estimatedDuration}
                    onChange={(e) => setChapterForm({...chapterForm, estimatedDuration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={chapterForm.status}
                    onChange={(e) => setChapterForm({...chapterForm, status: e.target.value as 'Draft' | 'Published' | 'Archived'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChapter}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  disabled={loading || !chapterForm.title}
                >
                  {loading ? 'Saving...' : isEditMode ? 'Update Chapter' : 'Create Chapter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Materials View
  if (view === 'materials' && selectedChapter && selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={handleBackToSubjects} className="text-purple-600 hover:text-purple-800">
            Subjects
          </button>
          <span className="text-gray-400">/</span>
          <button onClick={handleBackToChapters} className="text-purple-600 hover:text-purple-800 font-medium">
            ← {selectedSubject.name}
          </button>
        </div>

        {/* Chapter Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-3 inline-block">
                Chapter {selectedChapter.chapterNumber}
              </span>
              <h2 className="text-3xl font-bold mb-2">{selectedChapter.title}</h2>
              {selectedChapter.description && (
                <p className="text-purple-100 mb-4">{selectedChapter.description}</p>
              )}
              <div className="flex items-center space-x-3">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  📚 {materials.length} Materials
                </span>
                {selectedChapter.estimatedDuration && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                    ⏱️ {selectedChapter.estimatedDuration} mins
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateMaterial}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-all font-medium shadow-lg"
            >
              + Upload Material
            </button>
          </div>
        </div>

        {/* Materials List */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Learning Materials</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : materials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {materials.map((material) => (
                <div
                  key={material._id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-l-4 border-pink-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{getMaterialIcon(material.type)}</span>
                      <div>
                        <h4 className="font-bold text-gray-800">{material.title}</h4>
                        <span className="text-xs text-gray-500">{material.type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(material._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>

                  {material.fileMetadata && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 truncate">{material.fileMetadata.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {(material.fileMetadata.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {material.tags.map((tag, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>👁️ {material.viewCount} views</span>
                    <span>⬇️ {material.downloadCount} downloads</span>
                  </div>

                  {material.url && (
                    <div className="mt-4">
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
                      >
                        View Material →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-gray-500 text-lg mb-4">No materials uploaded yet</p>
              <button
                onClick={handleCreateMaterial}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
              >
                Upload First Material
              </button>
            </div>
          )}
        </div>

        {/* Material Upload Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold">Upload Learning Material</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Title *</label>
                  <input
                    type="text"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter material title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({...materialForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Video">Video</option>
                    <option value="Link">External Link</option>
                    <option value="Document">Document</option>
                    <option value="PPT">PowerPoint</option>
                    <option value="Image">Image</option>
                  </select>
                </div>

                {materialForm.type === 'Link' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                    <input
                      type="url"
                      value={materialForm.url}
                      onChange={(e) => setMaterialForm({...materialForm, url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/resource"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                    <input
                      type="file"
                      onChange={(e) => setMaterialForm({...materialForm, file: e.target.files?.[0] || null})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      accept={
                        materialForm.type === 'PDF' ? '.pdf' :
                        materialForm.type === 'Video' ? 'video/*' :
                        materialForm.type === 'PPT' ? '.ppt,.pptx' :
                        materialForm.type === 'Image' ? 'image/*' :
                        '*'
                      }
                      required
                    />
                  </div>
                )}

                {materialForm.type === 'Video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={materialForm.duration}
                      onChange={(e) => setMaterialForm({...materialForm, duration: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={materialForm.tags}
                    onChange={(e) => setMaterialForm({...materialForm, tags: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  disabled={loading || !materialForm.title || (!materialForm.file && !materialForm.url)}
                >
                  {loading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
