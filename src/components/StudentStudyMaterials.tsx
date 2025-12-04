'use client'

import { useState, useEffect } from 'react'
import { 
  FiBook, 
  FiDownload, 
  FiEye, 
  FiFileText, 
  FiVideo, 
  FiImage, 
  FiLink,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiBookOpen,
  FiStar,
  FiClock,
  FiUser,
  FiTag
} from 'react-icons/fi'
import apiService from '@/services/api'

interface Material {
  _id: string
  title: string
  type: 'PDF' | 'Video' | 'Link' | 'Document' | 'PPT' | 'Image'
  chapter: {
    _id: string
    title: string
    chapterNumber: number
  }
  subject: {
    _id: string
    name: string
    code: string
  }
  fileMetadata?: {
    originalName: string
    mimeType: string
    size: number
    filePath: string
  }
  url?: string
  viewCount: number
  downloadCount: number
  tags?: string[]
  duration?: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    _id: string
    name: string
  }
}

interface Subject {
  _id: string
  name: string
  code: string
}

export default function StudentStudyMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'title'>('recent')

  useEffect(() => {
    loadStudyMaterials()
  }, [])

  const loadStudyMaterials = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user to find enrolled subjects
      const userResponse = await apiService.getCurrentUser()
      if (!userResponse.success || !userResponse.data) {
        throw new Error('Failed to get user information')
      }

      const student = userResponse.data
      
      // Get all subjects for the student
      const departmentId = typeof student.department === 'object' ? student.department._id : student.department;
      const subjectsResponse = await apiService.makeRequest(`/subjects?department=${departmentId}&year=${student.year}&section=${student.section}`)
      
      let studentSubjects: Subject[] = []
      if (subjectsResponse.success && subjectsResponse.data) {
        studentSubjects = subjectsResponse.data
        setSubjects(studentSubjects)
      }

      // Get all materials for student's subjects
      let allMaterials: Material[] = []
      
      for (const subject of studentSubjects) {
        try {
          // Get chapters for this subject
          const chaptersResponse = await apiService.makeRequest(`/chapters?subject=${subject._id}`)
          
          if (chaptersResponse.success && chaptersResponse.data) {
            // Get materials for each chapter
            for (const chapter of chaptersResponse.data) {
              try {
                const materialsResponse = await apiService.makeRequest(`/materials/chapters/${chapter._id}/materials`)
                
                if (materialsResponse.success && materialsResponse.data) {
                  const chapterMaterials = materialsResponse.data.map((material: any) => ({
                    ...material,
                    chapter: {
                      _id: chapter._id,
                      title: chapter.title,
                      chapterNumber: chapter.chapterNumber
                    },
                    subject: {
                      _id: subject._id,
                      name: subject.name,
                      code: subject.code
                    }
                  }))
                  allMaterials = [...allMaterials, ...chapterMaterials]
                }
              } catch (materialError) {
                console.log(`No materials found for chapter ${chapter.title}`)
              }
            }
          }
        } catch (chapterError) {
          console.log(`No chapters found for subject ${subject.name}`)
        }
      }

      setMaterials(allMaterials)
      console.log(`📚 Loaded ${allMaterials.length} study materials`)

    } catch (err: any) {
      console.error('Error loading study materials:', err)
      setError(err.message || 'Failed to load study materials')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMaterial = async (material: Material) => {
    try {
      // Record view and open material
      await apiService.recordMaterialDownload(material._id)
      
      if (material.type === 'Link' && material.url) {
        window.open(material.url, '_blank')
      } else {
        const viewUrl = await apiService.viewMaterialFile(material._id)
        if (viewUrl) {
          window.open(viewUrl, '_blank')
        }
      }
      
      // Update view count locally
      setMaterials(prev => prev.map(m => 
        m._id === material._id 
          ? { ...m, viewCount: m.viewCount + 1 }
          : m
      ))
    } catch (error) {
      console.error('Error viewing material:', error)
    }
  }

  const handleDownloadMaterial = async (material: Material) => {
    try {
      if (material.type === 'Link') {
        window.open(material.url, '_blank')
        return
      }

      await apiService.downloadMaterialFile(material._id, material.fileMetadata?.originalName || material.title)
      
      // Update download count locally
      setMaterials(prev => prev.map(m => 
        m._id === material._id 
          ? { ...m, downloadCount: m.downloadCount + 1 }
          : m
      ))
    } catch (error) {
      console.error('Error downloading material:', error)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FiFileText className="text-red-500" />
      case 'Video': return <FiVideo className="text-purple-500" />
      case 'Image': return <FiImage className="text-green-500" />
      case 'Link': return <FiLink className="text-blue-500" />
      case 'PPT': return <FiFileText className="text-orange-500" />
      default: return <FiFileText className="text-gray-500" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const filteredAndSortedMaterials = materials
    .filter(material => {
      const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSubject = !selectedSubject || material.subject._id === selectedSubject
      const matchesType = !selectedType || material.type === selectedType
      
      return matchesSearch && matchesSubject && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.viewCount + b.downloadCount) - (a.viewCount + a.downloadCount)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900">Loading Study Materials...</h3>
          <p className="text-gray-500 mt-2">Fetching your learning resources</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-red-500 flex-shrink-0 mt-0.5">
              <FiBook size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Study Materials</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={loadStudyMaterials}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiBookOpen className="text-blue-600" />
            📚 Study Materials
          </h2>
          <p className="text-gray-600 mt-2">
            Access learning resources uploaded by your faculty members
          </p>
        </div>
        <button
          onClick={loadStudyMaterials}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-3">
            <FiBook className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Total Materials</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{materials.length}</p>
          <p className="text-sm text-gray-500 mt-1">Available resources</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-3">
            <FiBookOpen className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{subjects.length}</p>
          <p className="text-sm text-gray-500 mt-1">Enrolled courses</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-3">
            <FiEye className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Total Views</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {materials.reduce((sum, m) => sum + m.viewCount, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Resources accessed</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-3">
            <FiDownload className="text-orange-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Downloads</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {materials.reduce((sum, m) => sum + m.downloadCount, 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Files downloaded</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search materials, chapters, or subjects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div className="min-w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="min-w-36">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="PPT">Presentation</option>
              <option value="Link">Link</option>
              <option value="Image">Image</option>
              <option value="Document">Document</option>
            </select>
          </div>

          {/* Sort */}
          <div className="min-w-36">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'title')}
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedMaterials.length} of {materials.length} materials
          </p>
          {(searchTerm || selectedSubject || selectedType) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSubject('')
                setSelectedType('')
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredAndSortedMaterials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiBookOpen className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {materials.length === 0 ? 'No Study Materials Available' : 'No Materials Found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {materials.length === 0 
              ? 'Your faculty members haven\'t uploaded any learning materials yet.'
              : 'Try adjusting your search criteria or filters.'
            }
          </p>
          {materials.length === 0 && (
            <button
              onClick={loadStudyMaterials}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Materials
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedMaterials.map((material) => (
            <div
              key={material._id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              {/* Material Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {material.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <FiBook size={14} />
                      <span className="font-medium">{material.subject.code}</span>
                      <span>•</span>
                      <span>{material.chapter.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiEye size={12} />
                        <span>{material.viewCount} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiDownload size={12} />
                        <span>{material.downloadCount} downloads</span>
                      </div>
                      {material.fileMetadata && (
                        <div className="flex items-center gap-1">
                          <FiFileText size={12} />
                          <span>{formatFileSize(material.fileMetadata.size)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Actions */}
              <div className="p-4 bg-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMaterial(material)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiEye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadMaterial(material)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <FiDownload size={16} />
                    Download
                  </button>
                </div>

                {/* Tags */}
                {material.tags && material.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        <FiTag size={10} />
                        {tag}
                      </span>
                    ))}
                    {material.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{material.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Upload Info */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiUser size={12} />
                    <span>By {material.createdBy?.name || 'Faculty'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock size={12} />
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}