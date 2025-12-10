'use client'

import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import { 
  BookOpen, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  PlayCircle,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react'

interface Material {
  _id: string
  title: string
  subject: {
    _id: string
    name: string
  }
  chapter?: {
    _id: string
    title: string
  }
  pdfPath?: string
  uploadedBy?: {
    name: string
  }
  createdAt: string
}

interface MCQSession {
  _id: string
  title: string
  subject: {
    _id: string
    name: string
  }
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    difficulty?: string
    bloomsLevel?: string
  }>
  status: string
  createdAt: string
}

interface ImprovementTask {
  _id: string
  student: {
    _id: string
    name: string
    registrationNumber: string
  }
  subject: {
    _id: string
    name: string
  }
  courseOutcome: string
  coNumber: number
  weakAreas: string[]
  status: string
  metadata?: {
    generatedMCQs?: {
      sessionId?: string
      needsGeneration?: boolean
      totalQuestions: number
    }
  }
}

interface Props {
  subjectId: string
  onClose: () => void
}

export default function FacultyMCQTaskIntegration({ subjectId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'tasks'>('overview')
  const [materials, setMaterials] = useState<Material[]>([])
  const [mcqSessions, setMCQSessions] = useState<MCQSession[]>([])
  const [improvementTasks, setImprovementTasks] = useState<ImprovementTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generation settings
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [topics, setTopics] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [subjectId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load materials for MCQ generation
      const materialsResponse = await apiService.makeRequest(
        `/materials/subjects/${subjectId}/materials`,
        { method: 'GET' }
      )
      setMaterials(materialsResponse.materials || [])

      // Load existing MCQ sessions
      const mcqResponse = await apiService.makeRequest(
        `/mcq-generator/sessions/subject/${subjectId}`,
        { method: 'GET' }
      )
      setMCQSessions(mcqResponse.sessions || [])

      // Load improvement tasks with MCQ data
      const tasksResponse = await apiService.makeRequest(
        `/improvement-tasks/subject/${subjectId}`,
        { method: 'GET' }
      )
      setImprovementTasks(tasksResponse.tasks || [])

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const generateMCQs = async () => {
    if (!selectedMaterial) {
      setError('Please select a material')
      return
    }

    try {
      setGenerating(true)
      setError(null)

      const response = await apiService.makeRequest(
        '/mcq-generator/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            materialId: selectedMaterial,
            topics: topics || undefined,
            numberOfQuestions,
            difficulty
          })
        }
      )

      if (response.session) {
        alert('MCQs generated successfully!')
        await loadData() // Reload data
        setActiveTab('overview')
      }
    } catch (err) {
      console.error('Error generating MCQs:', err)
      setError('Failed to generate MCQs')
    } finally {
      setGenerating(false)
    }
  }

  const getTasksNeedingMCQs = () => {
    return improvementTasks.filter(task => 
      task.metadata?.generatedMCQs?.needsGeneration === true
    )
  }

  const getTasksWithMCQs = () => {
    return improvementTasks.filter(task => 
      task.metadata?.generatedMCQs?.sessionId && 
      task.metadata?.generatedMCQs?.totalQuestions > 0
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const tasksNeedingMCQs = getTasksNeedingMCQs()
  const tasksWithMCQs = getTasksWithMCQs()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-7 h-7" />
                MCQ Generator & Task Manager Integration
              </h2>
              <p className="text-blue-100 mt-2">
                Generate MCQs and manage improvement tasks for students
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
            >
              <PlayCircle className="w-4 h-4 inline mr-2" />
              Generate MCQs
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-800'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Tasks ({improvementTasks.length})
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Materials</p>
                      <p className="text-2xl font-bold text-blue-900">{materials.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">MCQ Sessions</p>
                      <p className="text-2xl font-bold text-purple-900">{mcqSessions.length}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Tasks with MCQs</p>
                      <p className="text-2xl font-bold text-green-900">{tasksWithMCQs.length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Needs MCQs</p>
                      <p className="text-2xl font-bold text-orange-900">{tasksNeedingMCQs.length}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Recent MCQ Sessions */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Recent MCQ Sessions
                  </h3>
                </div>
                <div className="p-6">
                  {mcqSessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No MCQ sessions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {mcqSessions.slice(0, 5).map((session) => (
                        <div
                          key={session._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{session.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {session.questions.length} questions • {session.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              session.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Needing MCQs */}
              {tasksNeedingMCQs.length > 0 && (
                <div className="bg-orange-50 rounded-lg border border-orange-200">
                  <div className="bg-orange-100 px-6 py-4 border-b border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Tasks Requiring MCQ Generation ({tasksNeedingMCQs.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-orange-800 mb-4">
                      The following improvement tasks need MCQs to be generated. 
                      Use the "Generate MCQs" tab to create questions for these students.
                    </p>
                    <div className="space-y-2">
                      {tasksNeedingMCQs.slice(0, 5).map((task) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-3 bg-white rounded border border-orange-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{task.student.name}</p>
                            <p className="text-sm text-gray-600">
                              {task.courseOutcome} • {task.weakAreas.join(', ')}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                            Pending MCQs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    MCQ Generation Settings
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure and generate new MCQs for improvement tasks
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Material Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Material *
                    </label>
                    <select
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Choose a material...</option>
                      {materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.title} {material.chapter ? `(${material.chapter.title})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topics */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topics (Optional)
                    </label>
                    <input
                      type="text"
                      value={topics}
                      onChange={(e) => setTopics(e.target.value)}
                      placeholder="e.g., loops, functions, arrays (comma-separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to generate from entire material
                    </p>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                            difficulty === level
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions: {numberOfQuestions}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateMCQs}
                    disabled={!selectedMaterial || generating}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating MCQs...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        Generate MCQs
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Improvement Tasks
                  </h3>
                </div>
                <div className="p-6">
                  {improvementTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No improvement tasks found</p>
                  ) : (
                    <div className="space-y-3">
                      {improvementTasks.map((task) => (
                        <div
                          key={task._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-gray-900">{task.student.name}</h4>
                              <span className="text-sm text-gray-500">
                                {task.student.registrationNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {task.courseOutcome}
                              </span>
                              <span>•</span>
                              <span>{task.weakAreas.join(', ')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {task.metadata?.generatedMCQs?.sessionId ? (
                              <div className="text-right">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {task.metadata.generatedMCQs.totalQuestions} MCQs
                                </span>
                              </div>
                            ) : task.metadata?.generatedMCQs?.needsGeneration ? (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Needs MCQs
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                No MCQs
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : task.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
