'use client'

import { useState, useEffect } from 'react'
import { 
  FiChevronRight, FiChevronLeft, FiCheck, FiTarget, FiFileText, 
  FiSettings, FiEye, FiSend, FiAlertCircle, FiLoader, FiClock,
  FiCalendar, FiBookOpen, FiZap, FiEdit3, FiTrash2, FiRefreshCw, FiCheckCircle
} from 'react-icons/fi'
import apiService from '../services/api'

interface COConfig {
  courseOutcome: string
  coNumber: number
  numberOfQuestions: number
  marksPerQuestion: number
  totalMarks: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  topics: string[]
  materials: any[]
  selectedMaterialIds: string[]
  generatedQuestions: any[]
  generating: boolean
  materialsLoading: boolean
  generateWithoutMaterials: boolean // New option
}

interface TaskAssessmentWizardProps {
  subjectId: string
  subjectName: string
  facultyId: string
  examType: 'CIA1' | 'CIA2' | 'MODEL' | 'SEMESTER'
  selectedStudents: string[]
  studentDetails: any[]
  onClose: () => void
  onComplete: () => void
}

export default function TaskAssessmentWizard({
  subjectId,
  subjectName,
  facultyId,
  examType,
  selectedStudents,
  studentDetails,
  onClose,
  onComplete
}: TaskAssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: CO Selection & Configuration
  const [availableCOs, setAvailableCOs] = useState<string[]>([])
  const [coConfigs, setCOConfigs] = useState<COConfig[]>([])
  
  // Step 2: Assessment Configuration
  const [assessmentConfig, setAssessmentConfig] = useState({
    title: '',
    description: '',
    totalTime: 60, // minutes
    startDate: '',
    startTime: '',
    dueDate: '',
    dueTime: '',
    allowRetake: true,
    maxAttempts: 3,
    shuffleQuestions: true,
    showResultsImmediately: false
  })
  
  // Step 3: Review & Publish
  const [publishing, setPublishing] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }>({ show: false, type: 'info', message: '' })

  const steps = [
    { number: 1, title: 'Select COs', icon: FiTarget, description: 'Choose COs and configure questions' },
    { number: 2, title: 'Configure', icon: FiSettings, description: 'Set marks, time & deadline' },
    { number: 3, title: 'Generate Questions', icon: FiZap, description: 'Generate from materials' },
    { number: 4, title: 'Review', icon: FiEye, description: 'Review all questions' },
    { number: 5, title: 'Publish', icon: FiSend, description: 'Assign to students' }
  ]

  useEffect(() => {
    initializeWizard()
  }, [examType])

  const initializeWizard = () => {
    // Set available COs based on exam type
    let cos: string[] = []
    switch (examType) {
      case 'CIA1':
        cos = ['CO1', 'CO2']
        break
      case 'CIA2':
        cos = ['CO3', 'CO4']
        break
      case 'MODEL':
        cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']
        break
      case 'SEMESTER':
        cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']
        break
    }
    setAvailableCOs(cos)
    
    // Initialize CO configs
    const configs: COConfig[] = cos.map((co, index) => ({
      courseOutcome: co,
      coNumber: index + 1,
      numberOfQuestions: 5,
      marksPerQuestion: 2,
      totalMarks: 10,
      difficulty: 'Medium',
      topics: [],
      materials: [],
      selectedMaterialIds: [],
      generatedQuestions: [],
      generating: false,
      materialsLoading: false,
      generateWithoutMaterials: false
    }))
    setCOConfigs(configs)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: 'info', message: '' }), 5000)
  }

  const updateCOConfig = (index: number, updates: Partial<COConfig>) => {
    setCOConfigs(prev => {
      const newConfigs = [...prev]
      newConfigs[index] = {
        ...newConfigs[index],
        ...updates,
        totalMarks: updates.numberOfQuestions && updates.marksPerQuestion 
          ? updates.numberOfQuestions * updates.marksPerQuestion
          : newConfigs[index].totalMarks
      }
      return newConfigs
    })
  }

  const fetchCOMaterials = async (coNumber: number) => {
    try {
      console.log(`📚 Fetching materials for CO${coNumber}...`)
      const response = await apiService.makeRequest(
        `/materials/subject/${subjectId}/co/${coNumber}`,
        { method: 'GET' }
      )
      
      if (response.success) {
        const materials = response.materials || []
        // Filter PDF materials only
        const pdfMaterials = materials.filter((m: any) => 
          m.type === 'PDF' || m.type === 'Document' || m.type === 'Lecture Notes'
        )
        console.log(`✅ Found ${pdfMaterials.length} PDF materials for CO${coNumber}`)
        return pdfMaterials
      }
      console.warn(`⚠️ No materials found for CO${coNumber}`)
      return []
    } catch (error) {
      console.error(`❌ Error fetching materials for CO${coNumber}:`, error)
      return []
    }
  }

  const loadMaterialsForCO = async (index: number) => {
    const config = coConfigs[index]
    if (config.materials.length > 0) {
      console.log(`ℹ️ Materials already loaded for ${config.courseOutcome}`)
      return // Already loaded
    }
    
    updateCOConfig(index, { materialsLoading: true })
    const materials = await fetchCOMaterials(config.coNumber)
    updateCOConfig(index, { 
      materials,
      materialsLoading: false
    })
    
    if (materials.length === 0) {
      showNotification(
        `No PDF materials found for ${config.courseOutcome}. You can still generate questions using LLM only.`,
        'info'
      )
    }
  }

  const generateQuestionsForCO = async (index: number) => {
    const config = coConfigs[index]
    
    // Validate based on generation mode
    if (!config.generateWithoutMaterials && config.selectedMaterialIds.length === 0) {
      showNotification(`Please select at least one material for ${config.courseOutcome} or enable "Generate without materials"`, 'warning')
      return
    }

    if (config.topics.length === 0) {
      showNotification(`Please add topics for ${config.courseOutcome}`, 'warning')
      return
    }

    updateCOConfig(index, { generating: true })

    try {
      // Choose endpoint based on generation mode
      const endpoint = config.generateWithoutMaterials 
        ? '/mcq-generator/generate-without-materials'
        : '/mcq-generator/generate-co-specific'
      
      const requestBody: any = {
        subjectId,
        subjectName,
        courseOutcome: config.courseOutcome,
        coNumber: config.coNumber,
        topics: config.topics,
        numberOfQuestions: config.numberOfQuestions,
        difficulty: config.difficulty,
        marksPerQuestion: config.marksPerQuestion
      }
      
      // Add materialIds only if using materials
      if (!config.generateWithoutMaterials) {
        requestBody.materialIds = config.selectedMaterialIds
      }
      
      console.log(`🎯 Generating questions for ${config.courseOutcome}:`, {
        mode: config.generateWithoutMaterials ? 'LLM Only' : 'RAG + LLM',
        topics: config.topics,
        questions: config.numberOfQuestions
      })

      const response = await apiService.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      if (response.success && response.questions) {
        updateCOConfig(index, { 
          generatedQuestions: response.questions,
          generating: false
        })
        showNotification(
          `Generated ${response.questions.length} questions for ${config.courseOutcome} using ${config.generateWithoutMaterials ? 'LLM only' : 'materials + LLM'}`, 
          'success'
        )
      } else {
        throw new Error(response.message || 'Failed to generate questions')
      }
    } catch (error: any) {
      console.error('Error generating questions:', error)
      showNotification(error?.message || 'Failed to generate questions', 'error')
      updateCOConfig(index, { generating: false })
    }
  }

  const regenerateQuestion = async (coIndex: number, questionIndex: number) => {
    const config = coConfigs[coIndex]
    
    try {
      const response = await apiService.makeRequest(
        '/mcq-generator/regenerate-single',
        {
          method: 'POST',
          body: JSON.stringify({
            subjectId,
            courseOutcome: config.courseOutcome,
            materialIds: config.selectedMaterialIds,
            topics: config.topics,
            difficulty: config.difficulty,
            marksPerQuestion: config.marksPerQuestion,
            excludeQuestions: config.generatedQuestions.map(q => q.question)
          })
        }
      )

      if (response.success && response.question) {
        const newQuestions = [...config.generatedQuestions]
        newQuestions[questionIndex] = response.question
        updateCOConfig(coIndex, { generatedQuestions: newQuestions })
        showNotification('Question regenerated successfully', 'success')
      }
    } catch (error) {
      showNotification('Failed to regenerate question', 'error')
    }
  }

  const deleteQuestion = (coIndex: number, questionIndex: number) => {
    const config = coConfigs[coIndex]
    const newQuestions = config.generatedQuestions.filter((_, i) => i !== questionIndex)
    updateCOConfig(coIndex, { generatedQuestions: newQuestions })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return coConfigs.every(c => c.numberOfQuestions > 0 && c.marksPerQuestion > 0)
      case 2:
        return assessmentConfig.title.trim() !== '' && 
               assessmentConfig.dueDate !== '' &&
               assessmentConfig.totalTime > 0
      case 3:
        return coConfigs.every(c => c.generatedQuestions.length > 0)
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    } else {
      showNotification('Please complete all required fields', 'warning')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const publishAssessment = async () => {
    setPublishing(true)
    
    try {
      // Prepare task data
      const allQuestions = coConfigs.flatMap(c => 
        c.generatedQuestions.map(q => ({
          ...q,
          courseOutcome: c.courseOutcome,
          coNumber: c.coNumber,
          marks: c.marksPerQuestion
        }))
      )

      const taskData = {
        title: assessmentConfig.title,
        description: assessmentConfig.description,
        subjectId,
        subjectName,
        examType,
        courseOutcomes: coConfigs.map(c => c.courseOutcome),
        studentIds: selectedStudents,
        questions: allQuestions,
        totalMarks: coConfigs.reduce((sum, c) => sum + c.totalMarks, 0),
        totalTime: assessmentConfig.totalTime,
        startDateTime: assessmentConfig.startDate && assessmentConfig.startTime 
          ? `${assessmentConfig.startDate}T${assessmentConfig.startTime}`
          : null,
        dueDateTime: `${assessmentConfig.dueDate}T${assessmentConfig.dueTime || '23:59'}`,
        allowRetake: assessmentConfig.allowRetake,
        maxAttempts: assessmentConfig.maxAttempts,
        shuffleQuestions: assessmentConfig.shuffleQuestions,
        showResultsImmediately: assessmentConfig.showResultsImmediately,
        coBreakdown: coConfigs.map(c => ({
          courseOutcome: c.courseOutcome,
          coNumber: c.coNumber,
          numberOfQuestions: c.generatedQuestions.length,
          totalMarks: c.totalMarks,
          topics: c.topics
        }))
      }

      const response = await apiService.makeRequest(
        '/tasks/create-assessment-task',
        {
          method: 'POST',
          body: JSON.stringify(taskData)
        }
      )

      if (response.success) {
        showNotification(
          `Assessment assigned to ${selectedStudents.length} student(s) successfully!`,
          'success'
        )
        setTimeout(() => {
          onComplete()
          onClose()
        }, 2000)
      } else {
        throw new Error(response.message || 'Failed to create assessment')
      }
    } catch (error: any) {
      console.error('Error publishing assessment:', error)
      showNotification(error?.message || 'Failed to publish assessment', 'error')
    } finally {
      setPublishing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderCOSelection()
      case 2:
        return renderAssessmentConfig()
      case 3:
        return renderQuestionGeneration()
      case 4:
        return renderReview()
      case 5:
        return renderPublish()
      default:
        return null
    }
  }

  const renderCOSelection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiTarget className="text-blue-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Configure Questions for Each CO</h3>
            <p className="text-sm text-blue-700 mt-1">
              {examType === 'CIA1' && 'CIA-1 covers CO1 and CO2'}
              {examType === 'CIA2' && 'CIA-2 covers CO3 and CO4'}
              {examType === 'MODEL' && 'Model exam covers all COs (CO1-CO5)'}
              {examType === 'SEMESTER' && 'Semester exam covers all COs (CO1-CO5)'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {coConfigs.map((config, index) => (
          <div key={config.courseOutcome} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">{config.courseOutcome}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{config.courseOutcome}</h3>
                  <p className="text-sm text-gray-500">Configure question parameters</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.numberOfQuestions}
                  onChange={(e) => updateCOConfig(index, { 
                    numberOfQuestions: parseInt(e.target.value) || 1,
                    totalMarks: (parseInt(e.target.value) || 1) * config.marksPerQuestion
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks per Question
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.marksPerQuestion}
                  onChange={(e) => updateCOConfig(index, { 
                    marksPerQuestion: parseInt(e.target.value) || 1,
                    totalMarks: config.numberOfQuestions * (parseInt(e.target.value) || 1)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="text"
                  value={config.totalMarks}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={config.difficulty}
                onChange={(e) => updateCOConfig(index, { difficulty: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed (Easy + Medium + Hard)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Total Assessment</p>
            <p className="text-sm text-gray-600">
              {coConfigs.reduce((sum, c) => sum + c.numberOfQuestions, 0)} questions • 
              {' '}{coConfigs.reduce((sum, c) => sum + c.totalMarks, 0)} marks
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAssessmentConfig = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiFileText className="text-blue-600" />
          Assessment Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title *
            </label>
            <input
              type="text"
              value={assessmentConfig.title}
              onChange={(e) => setAssessmentConfig(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`${examType} - ${subjectName}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={assessmentConfig.description}
              onChange={(e) => setAssessmentConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter assessment description or instructions..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-1" />
                Total Time (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={assessmentConfig.totalTime}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, totalTime: parseInt(e.target.value) || 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={assessmentConfig.maxAttempts}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 3 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" />
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={assessmentConfig.startDate}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={assessmentConfig.startTime}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-1" />
                Due Date *
              </label>
              <input
                type="date"
                value={assessmentConfig.dueDate}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Time *
              </label>
              <input
                type="time"
                value={assessmentConfig.dueTime}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, dueTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assessmentConfig.allowRetake}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, allowRetake: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow retake (students can attempt multiple times)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assessmentConfig.shuffleQuestions}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Shuffle questions for each student</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assessmentConfig.showResultsImmediately}
                onChange={(e) => setAssessmentConfig(prev => ({ ...prev, showResultsImmediately: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show results immediately after completion</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderQuestionGeneration = () => (
    <div className="space-y-6">
      {coConfigs.map((config, index) => (
        <div key={config.courseOutcome} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">{config.courseOutcome}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{config.courseOutcome} Questions</h3>
                <p className="text-sm text-gray-500">
                  {config.numberOfQuestions} questions • {config.totalMarks} marks
                </p>
              </div>
            </div>

            {config.generatedQuestions.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <FiCheckCircle />
                <span className="text-sm font-medium">
                  {config.generatedQuestions.length} generated
                </span>
              </div>
            )}
          </div>

          {config.generatedQuestions.length === 0 ? (
            <>
              {/* Option to generate without materials */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.generateWithoutMaterials}
                    onChange={(e) => updateCOConfig(index, { 
                      generateWithoutMaterials: e.target.checked,
                      selectedMaterialIds: e.target.checked ? [] : config.selectedMaterialIds
                    })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Generate using LLM only (without materials)</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Use AI to generate questions based on topics without uploaded materials
                    </p>
                  </div>
                </label>
              </div>

              {!config.generateWithoutMaterials && (
                <>
                  {config.materials.length === 0 && !config.materialsLoading && (
                    <button
                      onClick={() => loadMaterialsForCO(index)}
                      className="w-full mb-4 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {config.materialsLoading ? 'Loading Materials...' : `Load Materials for ${config.courseOutcome}`}
                    </button>
                  )}

                  {config.materialsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <FiLoader className="animate-spin text-blue-600 text-2xl mr-2" />
                      <span className="text-gray-600">Loading materials...</span>
                    </div>
                  )}

                  {config.materials.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Materials (PDF files with uploaded content)
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {config.materials.map((material: any) => (
                            <label key={material._id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.selectedMaterialIds.includes(material._id)}
                                onChange={(e) => {
                                  const newSelected = e.target.checked
                                    ? [...config.selectedMaterialIds, material._id]
                                    : config.selectedMaterialIds.filter(id => id !== material._id)
                                  updateCOConfig(index, { selectedMaterialIds: newSelected })
                                }}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{material.title}</p>
                                <p className="text-xs text-gray-500">{material.type}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics (comma-separated) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Arrays, Linked Lists, Sorting"
                  onChange={(e) => {
                    const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    updateCOConfig(index, { topics })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => generateQuestionsForCO(index)}
                disabled={config.generating || (!config.generateWithoutMaterials && config.selectedMaterialIds.length === 0) || config.topics.length === 0}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {config.generating ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <FiZap />
                    Generate {config.numberOfQuestions} Questions {config.generateWithoutMaterials ? '(LLM Only)' : '(RAG + LLM)'}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {config.generatedQuestions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 flex-1">
                      Q{qIndex + 1}. {question.question}
                    </p>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => regenerateQuestion(index, qIndex)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Regenerate question"
                      >
                        <FiRefreshCw className="text-sm" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(index, qIndex)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete question"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {question.options.map((option: string, oIndex: number) => (
                      <div
                        key={oIndex}
                        className={`text-sm p-2 rounded ${
                          oIndex === question.correctAnswer
                            ? 'bg-green-50 text-green-900 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + oIndex)}. {option}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={() => updateCOConfig(index, { generatedQuestions: [] })}
                className="w-full px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiRefreshCw />
                Regenerate All Questions for {config.courseOutcome}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderReview = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Assessment Summary</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Title</p>
            <p className="font-medium text-gray-900">{assessmentConfig.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Exam Type</p>
            <p className="font-medium text-gray-900">{examType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="font-medium text-gray-900">
              {coConfigs.reduce((sum, c) => sum + c.generatedQuestions.length, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Marks</p>
            <p className="font-medium text-gray-900">
              {coConfigs.reduce((sum, c) => sum + c.totalMarks, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time Allowed</p>
            <p className="font-medium text-gray-900">{assessmentConfig.totalTime} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="font-medium text-gray-900">
              {new Date(assessmentConfig.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Students</p>
            <p className="font-medium text-gray-900">{selectedStudents.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Attempts</p>
            <p className="font-medium text-gray-900">{assessmentConfig.maxAttempts}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">CO-wise Breakdown</h4>
          <div className="space-y-2">
            {coConfigs.map(config => (
              <div key={config.courseOutcome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                    {config.courseOutcome}
                  </span>
                  <span className="text-sm text-gray-700">
                    {config.generatedQuestions.length} questions
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {config.totalMarks} marks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Selected Students</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {studentDetails.map(student => (
            <div key={student.studentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{student.studentName}</p>
                <p className="text-xs text-gray-500">{student.rollNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPublish = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <FiCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-900 mb-2">Ready to Publish!</h3>
        <p className="text-green-700 mb-6">
          Your assessment is configured and ready to be assigned to {selectedStudents.length} student(s)
        </p>
        
        <button
          onClick={publishAssessment}
          disabled={publishing}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto text-lg font-medium"
        >
          {publishing ? (
            <>
              <FiLoader className="animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <FiSend />
              Publish Assessment
            </>
          )}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-yellow-600 text-xl mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Before Publishing</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
              <li>Double-check all questions and answers</li>
              <li>Verify marks allocation for each CO</li>
              <li>Confirm due date and time settings</li>
              <li>Ensure students have access to study materials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Assessment Task</h2>
              <p className="text-sm text-gray-600 mt-1">
                {subjectName} • {examType} • {selectedStudents.length} Students
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <FiCheck /> : <Icon />}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiChevronLeft />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Next
              <FiChevronRight />
            </button>
          ) : null}
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } text-white flex items-center gap-3`}>
            <FiAlertCircle />
            <span>{notification.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
