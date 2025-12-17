'use client'

import { useState, useEffect } from 'react'
import { FiBook, FiFileText, FiZap, FiChevronRight, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import MCQDisplay from './MCQDisplay'

interface Subject {
  _id: string
  name: string
  code: string
  type: string
  year: string
  section: string
  department: {
    name: string
    code: string
  }
  faculty?: Array<{
    user: string | { _id: string; id: string }
  }>
}

interface Chapter {
  _id: string
  title: string
  chapterNumber: number
  description?: string
  topics?: string[]
}

interface Material {
  _id: string
  title: string
  description?: string
  type: string
  fileMetadata?: {
    filename: string
    originalName: string
    size: number
  }
  createdAt: string
}

interface GeneratedMCQ {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: string
  topics: string
  topic?: string // For compatibility with MCQDisplay
}

interface MCQMetadata {
  materialId: string
  materialTitle: string
  chapterTitle: string
  chapterNumber: number
  subjectName: string
  subjectCode: string
  topics: string
  difficulty: string
  totalGenerated: number
  requestedCount: number
  generatedAt: string
}

export default function MCQGeneratorV3() {
  // Selection states
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  
  // Generation parameters
  const [topics, setTopics] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  
  // Loading and error states
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Generated MCQs
  const [generatedMCQs, setGeneratedMCQs] = useState<GeneratedMCQ[]>([])
  const [metadata, setMetadata] = useState<MCQMetadata | null>(null)
  const [showMCQDisplay, setShowMCQDisplay] = useState(false)

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects()
  }, [])

  // Fetch chapters when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject._id)
      // Reset downstream selections
      setSelectedChapter(null)
      setSelectedMaterial(null)
      setChapters([])
      setMaterials([])
    }
  }, [selectedSubject])

  // Fetch materials when chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      fetchMaterials(selectedChapter._id)
      // Reset material selection
      setSelectedMaterial(null)
      setMaterials([])
    }
  }, [selectedChapter])

  // Auto-suggest topics from chapter
  useEffect(() => {
    if (selectedChapter && selectedChapter.topics && selectedChapter.topics.length > 0) {
      setTopics(selectedChapter.topics.join(', '))
    } else if (selectedChapter) {
      setTopics(selectedChapter.title)
    }
  }, [selectedChapter])

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || ''
  }

  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching subjects from MCQ Generator V3...')
      
      // Get current user ID from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setError('User not found. Please login again.')
        setLoadingSubjects(false)
        return
      }
      
      const user = JSON.parse(userStr)
      const teacherId = user._id
      
      console.log('👤 Teacher ID:', teacherId)
      
      // Fetch all subjects (same as TeacherDashboard)
      const response = await fetch('http://localhost:5000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📥 Subjects response:', data)
      
      if (data.success) {
        const allSubjects = data?.data || data || []
        
        if (!Array.isArray(allSubjects) || allSubjects.length === 0) {
          console.log('❌ No subjects found in system')
          setSubjects([])
          setError('No subjects found')
          return
        }
        
        // Filter subjects where current user is assigned as faculty (same logic as TeacherDashboard)
        const mySubjects = allSubjects.filter((subject: Subject) => {
          if (!subject.faculty || !Array.isArray(subject.faculty)) {
            return false
          }
          
          return subject.faculty.some((f: any) => {
            // Handle different faculty structure formats
            let facultyId = null
            
            // Get the user ID from the faculty object
            if (f.user) {
              if (typeof f.user === 'string') {
                facultyId = f.user
              } else if (f.user._id) {
                facultyId = f.user._id
              } else if (f.user.id) {
                facultyId = f.user.id
              }
            }
            
            return facultyId === teacherId
          })
        })
        
        console.log(`✅ Loaded ${mySubjects.length} subjects assigned to you`)
        setSubjects(mySubjects)
        
        if (mySubjects.length === 0) {
          setError('No subjects assigned to you. Please contact admin.')
        }
      } else {
        console.error('❌ Failed to load subjects:', data.message)
        setError(data.message || 'Failed to load subjects')
      }
    } catch (err: any) {
      console.error('❌ Error fetching subjects:', err)
      setError('Failed to connect to server')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const fetchChapters = async (subjectId: string) => {
    setLoadingChapters(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching chapters for subject:', subjectId)
      
      // Use the same API as TeacherDashboard (subjects management)
      const response = await fetch(
        `http://localhost:5000/api/subjects/${subjectId}/chapters`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      )
      
      console.log('📡 Chapters response status:', response.status)
      const data = await response.json()
      console.log('📥 Chapters response:', data)
      
      if (data.success) {
        const chaptersData = data?.data || data || []
        console.log(`✅ Loaded ${chaptersData.length} chapters`)
        setChapters(chaptersData)
        if (chaptersData.length === 0) {
          setError('No chapters found for this subject. Please add chapters first.')
        }
      } else {
        console.error('❌ Failed to load chapters:', data.message)
        setError(data.message || 'Failed to load chapters')
      }
    } catch (err: any) {
      console.error('❌ Error fetching chapters:', err)
      setError('Failed to load chapters')
    } finally {
      setLoadingChapters(false)
    }
  }

  const fetchMaterials = async (chapterId: string) => {
    setLoadingMaterials(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching materials for chapter:', chapterId)
      
      // Use the materials API endpoint
      const response = await fetch(
        `http://localhost:5000/api/materials/chapters/${chapterId}/materials`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      )
      
      console.log('📡 Materials response status:', response.status)
      const data = await response.json()
      console.log('📥 Materials response:', data)
      
      if (data.success) {
        const materialsData = data?.data || data || []
        // Filter only PDF materials for MCQ generation
        const pdfMaterials = materialsData.filter((m: Material) => m.type === 'PDF')
        console.log(`✅ Loaded ${pdfMaterials.length} PDF materials`)
        setMaterials(pdfMaterials)
        if (pdfMaterials.length === 0) {
          setError('No PDF materials found for this chapter. Please upload a PDF first.')
        }
      } else {
        console.error('❌ Failed to load materials:', data.message)
        setError(data.message || 'Failed to load materials')
      }
    } catch (err: any) {
      console.error('❌ Error fetching materials:', err)
      setError('Failed to load materials')
    } finally {
      setLoadingMaterials(false)
    }
  }

  const handleGenerateMCQs = async () => {
    // Validation
    if (!selectedMaterial) {
      setError('Please select a material first')
      return
    }
    
    if (!topics.trim()) {
      setError('Please enter topics for MCQ generation')
      return
    }
    
    if (topics.trim().length < 3) {
      setError('Topics must be at least 3 characters')
      return
    }
    
    setGenerating(true)
    setError(null)
    setSuccess(null)
    
    try {
      console.log('🚀 Generating MCQs:', {
        materialId: selectedMaterial._id,
        topics,
        numberOfQuestions,
        difficulty
      })
      
      const response = await fetch('http://localhost:5000/api/mcq-generator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          materialId: selectedMaterial._id,
          topics: topics.trim(),
          numberOfQuestions,
          difficulty
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.data.mcqs) {
        // Normalize MCQs to include 'topic' field for compatibility
        const normalizedMCQs = data.data.mcqs.map((mcq: any) => ({
          ...mcq,
          topic: mcq.topics || mcq.topic || topics
        }))
        
        setGeneratedMCQs(normalizedMCQs)
        setMetadata(data.data.metadata)
        setShowMCQDisplay(true)
        setSuccess(`Successfully generated ${data.data.mcqs.length} MCQs!`)
        console.log('✅ MCQs generated successfully:', data.data.mcqs.length)
      } else {
        setError(data.message || 'Failed to generate MCQs')
        console.error('❌ Generation failed:', data)
      }
    } catch (err: any) {
      setError('Failed to generate MCQs. Please try again.')
      console.error('Error generating MCQs:', err)
    } finally {
      setGenerating(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <FiZap size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI-Powered MCQ Generator</h1>
              <p className="text-purple-100 mt-2">
                Generate contextual multiple-choice questions from your PDF materials using advanced AI
              </p>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-purple-100 mt-4">
            <span className={selectedSubject ? 'text-white font-semibold' : ''}>
              {selectedSubject ? `📚 ${selectedSubject.name}` : '📚 Select Subject'}
            </span>
            {selectedChapter && (
              <>
                <FiChevronRight />
                <span className="text-white font-semibold">
                  📖 Chapter {selectedChapter.chapterNumber}: {selectedChapter.title}
                </span>
              </>
            )}
            {selectedMaterial && (
              <>
                <FiChevronRight />
                <span className="text-white font-semibold">
                  📄 {selectedMaterial.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-green-900">Success</h3>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1: Select Subject */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiBook className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Step 1</h2>
                <p className="text-sm text-gray-600">Select Subject</p>
              </div>
            </div>

            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <FiLoader className="animate-spin text-purple-600" size={32} />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No subjects available</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {subjects.map((subject) => (
                  <button
                    key={subject._id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedSubject?._id === subject._id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{subject.name}</div>
                    <div className="text-sm text-gray-600">{subject.code}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {subject.type}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {subject.year} - Sec {subject.section}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select Chapter */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <FiFileText className="text-pink-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Step 2</h2>
                <p className="text-sm text-gray-600">Select Chapter</p>
              </div>
            </div>

            {!selectedSubject ? (
              <p className="text-gray-400 text-center py-8">
                Please select a subject first
              </p>
            ) : loadingChapters ? (
              <div className="flex items-center justify-center py-8">
                <FiLoader className="animate-spin text-pink-600" size={32} />
              </div>
            ) : chapters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No chapters available</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {chapters.map((chapter) => (
                  <button
                    key={chapter._id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedChapter?._id === chapter._id
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {chapter.chapterNumber}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{chapter.title}</div>
                        {chapter.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {chapter.description}
                          </div>
                        )}
                        {chapter.topics && chapter.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {chapter.topics.slice(0, 3).map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Select Material */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FiFileText className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Step 3</h2>
                <p className="text-sm text-gray-600">Select PDF Material</p>
              </div>
            </div>

            {!selectedChapter ? (
              <p className="text-gray-400 text-center py-8">
                Please select a chapter first
              </p>
            ) : loadingMaterials ? (
              <div className="flex items-center justify-center py-8">
                <FiLoader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : materials.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No PDF materials available for this chapter
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {materials.map((material) => (
                  <button
                    key={material._id}
                    onClick={() => setSelectedMaterial(material)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedMaterial?._id === material._id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 p-2 rounded">
                        <FiFileText className="text-red-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{material.title}</div>
                        {material.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {material.description}
                          </div>
                        )}
                        {material.fileMetadata && (
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {formatFileSize(material.fileMetadata.size)}
                            </span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              PDF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generation Parameters */}
        {selectedMaterial && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6 border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FiZap className="text-purple-600" />
              MCQ Generation Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topics for MCQ Generation *
                </label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g., Data Structures, Arrays, Linked Lists"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={generating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the specific topics you want questions about. The AI will focus on these topics from the PDF.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={generating}
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={generating}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateMCQs}
              disabled={generating || !topics.trim()}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                generating || !topics.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {generating ? (
                <>
                  <FiLoader className="animate-spin" size={24} />
                  Generating MCQs with AI...
                </>
              ) : (
                <>
                  <FiZap size={24} />
                  Generate MCQs with AI
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* MCQ Display Modal */}
      {showMCQDisplay && generatedMCQs.length > 0 && metadata && (
        <MCQDisplay
          mcqs={generatedMCQs as any}
          onClose={() => {
            setShowMCQDisplay(false)
            setSuccess(null)
          }}
          metadata={{
            materialTitle: metadata.materialTitle,
            topic: metadata.topics,
            difficulty: metadata.difficulty,
            chapterTitle: metadata.chapterTitle,
            subjectName: metadata.subjectName
          }}
        />
      )}
    </div>
  )
}
