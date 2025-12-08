'use client'

import React, { useState, useEffect } from 'react';
import { Clock, Users, BookOpen, Target, Calendar, Settings, Plus, Eye, AlertCircle } from 'lucide-react';

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  subject: Subject;
  courseOutcomes: string[];
  taskSchedule: {
    studyDuration: number;
    taskDuration: number;
    startTime: string;
    endTime: string;
  };
  assignedStudents: Array<{
    student: Student;
    status: string;
    score?: number;
  }>;
  questions: any[];
  createdAt: string;
}

const FacultyTaskManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'co-assignment'>('create');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentsWithCOTasks, setStudentsWithCOTasks] = useState<any[]>([]);
  const [showCOTaskWarning, setShowCOTaskWarning] = useState(false);
  
  // CO-based assignment states
  const [coAssignmentForm, setCoAssignmentForm] = useState({
    subjectId: '',
    courseOutcomes: [] as string[],
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    questionCount: 10,
    taskTitle: '',
    taskDescription: '',
    studyDuration: 60,
    taskDuration: 30,
    passingScore: 60,
    selectedStudents: [] as string[]
  });
  const [generatedMCQs, setGeneratedMCQs] = useState<any>({});
  const [showMCQPreview, setShowMCQPreview] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    courseOutcomes: [] as string[],
    studyMaterials: [] as Array<{title: string, type: string, content: string}>,
    taskSchedule: {
      studyDuration: 60,
      taskDuration: 30,
      startTime: '',
      endTime: ''
    },
    settings: {
      allowChatbot: true,
      passingScore: 60,
      randomizeQuestions: true,
      showResourcesDuringTask: false
    },
    assignedStudentIds: [] as string[],
    questionCount: 10,
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard'
  });

  // Fetch data
  useEffect(() => {
    fetchSubjects();
    fetchStudents();
    fetchTasks();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects/faculty/my-subjects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users/students', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/faculty/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Check for students with existing learning tasks
  const checkExistingTasks = async (subjectId: string) => {
    if (!subjectId) return;
    
    try {
      // Check for existing learning tasks for this subject
      const response = await fetch('/api/tasks/faculty/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeTasks = data.tasks.filter((task: any) => 
          task.subject._id === subjectId && 
          task.assignedStudents.some((as: any) => 
            ['assigned', 'studying', 'in-progress'].includes(as.status)
          )
        );
        
        const studentsWithActiveTasks = activeTasks.flatMap((task: any) => 
          task.assignedStudents
            .filter((as: any) => ['assigned', 'studying', 'in-progress'].includes(as.status))
            .map((as: any) => ({
              studentId: as.student._id,
              studentName: as.student.name,
              rollNumber: as.student.rollNumber || 'N/A',
              taskId: task._id,
              taskTitle: task.title,
              reason: `Active learning task: ${task.title}`
            }))
        );
        
        setStudentsWithCOTasks(studentsWithActiveTasks);
        setShowCOTaskWarning(studentsWithActiveTasks.length > 0);
      }
    } catch (error) {
      console.error('Error checking existing tasks:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate end time based on start time and durations
      const startTime = new Date(taskForm.taskSchedule.startTime);
      const endTime = new Date(startTime.getTime() + (taskForm.taskSchedule.taskDuration * 60000));
      
      const taskData = {
        ...taskForm,
        taskSchedule: {
          ...taskForm.taskSchedule,
          endTime: endTime.toISOString()
        }
      };

      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Task created successfully! Generated ${data.generatedQuestions} MCQ questions.`);
        
        // Reset form
        setTaskForm({
          title: '',
          description: '',
          subjectId: '',
          courseOutcomes: [],
          studyMaterials: [],
          taskSchedule: {
            studyDuration: 60,
            taskDuration: 30,
            startTime: '',
            endTime: ''
          },
          settings: {
            allowChatbot: true,
            passingScore: 60,
            randomizeQuestions: true,
            showResourcesDuringTask: false
          },
          assignedStudentIds: [],
          questionCount: 10,
          difficulty: 'Medium'
        });
        
        fetchTasks();
        setActiveTab('manage');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseOutcomeToggle = (co: string) => {
    setTaskForm(prev => ({
      ...prev,
      courseOutcomes: prev.courseOutcomes.includes(co)
        ? prev.courseOutcomes.filter(c => c !== co)
        : [...prev.courseOutcomes, co]
    }));
  };

  const handleStudentToggle = (studentId: string) => {
    setTaskForm(prev => ({
      ...prev,
      assignedStudentIds: prev.assignedStudentIds.includes(studentId)
        ? prev.assignedStudentIds.filter(id => id !== studentId)
        : [...prev.assignedStudentIds, studentId]
    }));
  };

  const addStudyMaterial = () => {
    setTaskForm(prev => ({
      ...prev,
      studyMaterials: [...prev.studyMaterials, { title: '', type: 'text', content: '' }]
    }));
  };

  const updateStudyMaterial = (index: number, field: string, value: string) => {
    setTaskForm(prev => ({
      ...prev,
      studyMaterials: prev.studyMaterials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeStudyMaterial = (index: number) => {
    setTaskForm(prev => ({
      ...prev,
      studyMaterials: prev.studyMaterials.filter((_, i) => i !== index)
    }));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'studying': return 'text-purple-600 bg-purple-100';
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // CO-based MCQ generation and assignment functions
  const generateCOMCQs = async () => {
    if (!coAssignmentForm.subjectId || coAssignmentForm.courseOutcomes.length === 0) {
      setError('Please select a subject and at least one course outcome');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/generate-co-mcqs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: coAssignmentForm.subjectId,
          courseOutcomes: coAssignmentForm.courseOutcomes,
          difficulty: coAssignmentForm.difficulty,
          questionCount: coAssignmentForm.questionCount
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedMCQs(data.data.generatedMCQs);
        setShowMCQPreview(true);
        setError('');
      } else {
        setError(data.message || 'Failed to generate MCQs');
      }
    } catch (error) {
      setError('Error generating MCQs');
    } finally {
      setLoading(false);
    }
  };

  const assignCOTasksToStudents = async () => {
    if (coAssignmentForm.selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (Object.keys(generatedMCQs).length === 0) {
      setError('Please generate MCQs first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/bulk-assign-co-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: coAssignmentForm.subjectId,
          studentIds: coAssignmentForm.selectedStudents,
          courseOutcomes: coAssignmentForm.courseOutcomes,
          generatedMCQs: generatedMCQs,
          taskTitle: coAssignmentForm.taskTitle,
          taskDescription: coAssignmentForm.taskDescription,
          studyDuration: coAssignmentForm.studyDuration,
          taskDuration: coAssignmentForm.taskDuration,
          passingScore: coAssignmentForm.passingScore
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Task assigned successfully to ${coAssignmentForm.selectedStudents.length} students!`);
        // Reset form
        setCoAssignmentForm({
          subjectId: '',
          courseOutcomes: [],
          difficulty: 'Medium',
          questionCount: 10,
          taskTitle: '',
          taskDescription: '',
          studyDuration: 60,
          taskDuration: 30,
          passingScore: 60,
          selectedStudents: []
        });
        setGeneratedMCQs({});
        setShowMCQPreview(false);
        fetchTasks(); // Refresh tasks
      } else {
        setError(data.message || 'Failed to assign tasks');
      }
    } catch (error) {
      setError('Error assigning tasks to students');
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'co-assignment') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📚 CO-Based Class Assignment</h1>
              <p className="text-gray-600">Generate CO-specific MCQs and assign to entire class or selected students</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <Plus className="w-4 h-4" />
                <span>Individual Task</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Eye className="w-4 h-4" />
                <span>View Tasks</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MCQ Generation Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">🎯 Generate CO-Based MCQs</h2>
              
              {/* Subject Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={coAssignmentForm.subjectId}
                  onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>
                  ))}
                </select>
              </div>

              {/* Course Outcomes Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Outcomes</label>
                <div className="grid grid-cols-5 gap-2">
                  {['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].map(co => (
                    <label key={co} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={coAssignmentForm.courseOutcomes.includes(co)}
                        onChange={(e) => {
                          const newCOs = e.target.checked
                            ? [...coAssignmentForm.courseOutcomes, co]
                            : coAssignmentForm.courseOutcomes.filter(c => c !== co);
                          setCoAssignmentForm(prev => ({ ...prev, courseOutcomes: newCOs }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{co}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty and Question Count */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={coAssignmentForm.difficulty}
                    onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={coAssignmentForm.questionCount}
                    onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateCOMCQs}
                disabled={loading || !coAssignmentForm.subjectId || coAssignmentForm.courseOutcomes.length === 0}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Generate MCQs</span>
                  </>
                )}
              </button>
            </div>

            {/* Student Selection and Assignment */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">👥 Assign to Students</h2>
              
              {/* Task Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  value={coAssignmentForm.taskTitle}
                  onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, taskTitle: e.target.value }))}
                  placeholder="Auto-generated based on COs"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={coAssignmentForm.taskDescription}
                  onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                  placeholder="Auto-generated based on COs and subject"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Study Time</label>
                  <input
                    type="number"
                    min="15"
                    value={coAssignmentForm.studyDuration}
                    onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, studyDuration: parseInt(e.target.value) }))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">minutes</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Time</label>
                  <input
                    type="number"
                    min="10"
                    value={coAssignmentForm.taskDuration}
                    onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, taskDuration: parseInt(e.target.value) }))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">minutes</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Score</label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={coAssignmentForm.passingScore}
                    onChange={(e) => setCoAssignmentForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>

              {/* Student Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={coAssignmentForm.selectedStudents.length === students.length}
                      onChange={(e) => {
                        const allStudentIds = students.map(s => s._id);
                        setCoAssignmentForm(prev => ({
                          ...prev,
                          selectedStudents: e.target.checked ? allStudentIds : []
                        }));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-blue-600">Select All ({students.length})</span>
                  </div>
                  {students.map(student => (
                    <div key={student._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={coAssignmentForm.selectedStudents.includes(student._id)}
                        onChange={(e) => {
                          const newSelected = e.target.checked
                            ? [...coAssignmentForm.selectedStudents, student._id]
                            : coAssignmentForm.selectedStudents.filter(id => id !== student._id);
                          setCoAssignmentForm(prev => ({ ...prev, selectedStudents: newSelected }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{student.name} ({student.rollNumber})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Button */}
              <button
                onClick={assignCOTasksToStudents}
                disabled={loading || Object.keys(generatedMCQs).length === 0 || coAssignmentForm.selectedStudents.length === 0}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Assign to {coAssignmentForm.selectedStudents.length} Students</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MCQ Preview */}
          {showMCQPreview && Object.keys(generatedMCQs).length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">📝 Generated MCQs Preview</h2>
              {Object.entries(generatedMCQs).map(([co, questions]: [string, any]) => (
                <div key={co} className="mb-6">
                  <h3 className="text-lg font-medium text-blue-600 mb-3">{co} Questions ({questions.length})</h3>
                  {questions.slice(0, 2).map((question: any, index: number) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">{question.questionText}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option: any, optIndex: number) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              option.isCorrect
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            {option.text} {option.isCorrect && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {questions.length > 2 && (
                    <p className="text-sm text-gray-500">...and {questions.length - 2} more questions</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Create CO-Based Task</h1>
              <p className="text-gray-600">Create CO-focused tasks for students with lagging performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('co-assignment')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Users className="w-4 h-4" />
                <span>CO Class Assignment</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Eye className="w-4 h-4" />
                <span>View Tasks</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Data Structures Assessment"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    required
                    value={taskForm.subjectId}
                    onChange={(e) => {
                      const subjectId = e.target.value;
                      setTaskForm(prev => ({ ...prev, subjectId }));
                      checkExistingTasks(subjectId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the learning objectives and task requirements..."
                />
              </div>
            </div>

            {/* Course Outcomes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Course Outcomes (Select COs to generate questions)
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].map(co => (
                  <label key={co} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskForm.courseOutcomes.includes(co)}
                      onChange={() => handleCourseOutcomeToggle(co)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">{co}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* MCQ Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                MCQ Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Count</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={taskForm.questionCount}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <select
                    value={taskForm.difficulty}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taskForm.settings.passingScore}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, passingScore: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Schedule Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Study Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={taskForm.taskSchedule.studyDuration}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      taskSchedule: { ...prev.taskSchedule, studyDuration: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time for focused study before assessment</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Duration (minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={taskForm.taskSchedule.taskDuration}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      taskSchedule: { ...prev.taskSchedule, taskDuration: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time to complete the MCQ assessment</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={taskForm.taskSchedule.startTime}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      taskSchedule: { ...prev.taskSchedule, startTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Study time starts {taskForm.taskSchedule.studyDuration} min earlier</p>
                </div>
              </div>
            </div>

            {/* Study Materials */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Study Materials
                </h2>
                <button
                  type="button"
                  onClick={addStudyMaterial}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Material</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {taskForm.studyMaterials.map((material, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      placeholder="Material title"
                      value={material.title}
                      onChange={(e) => updateStudyMaterial(index, 'title', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                      value={material.type}
                      onChange={(e) => updateStudyMaterial(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="link">Link</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Content or URL"
                      value={material.content}
                      onChange={(e) => updateStudyMaterial(index, 'content', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeStudyMaterial(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Assignment */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Assign to Students
              </h2>
              
              {/* CO Tasks Warning */}
              {showCOTaskWarning && studentsWithCOTasks.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800">
                        ⚠️ Students with Active Learning Tasks
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        The following students already have active learning tasks for this subject:
                      </p>
                      <div className="mt-2 space-y-1">
                        {studentsWithCOTasks.map((task, index) => (
                          <div key={index} className="text-xs bg-yellow-100 p-2 rounded border-l-2 border-yellow-400">
                            <span className="font-medium">{task.studentName} ({task.rollNumber})</span>
                            <span className="text-yellow-600 ml-2">
                              - {task.reason} 
                              {task.targetCO && ` (${task.targetCO}: ${task.currentPerformance?.toFixed(1)}%)`}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-yellow-600 mt-2">
                        💡 <strong>Recommendation:</strong> Let students complete their current learning tasks first, 
                        or create new tasks for other students without active assignments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {students.map(student => {
                  const hasCOTask = studentsWithCOTasks.some(task => task.studentId === student._id);
                  return (
                    <label 
                      key={student._id} 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${
                        hasCOTask 
                          ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={taskForm.assignedStudentIds.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">{student.name}</span>
                          {hasCOTask && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                              CO Task Active
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{student.rollNumber}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <div className="mt-3 text-sm text-gray-600">
                Selected: {taskForm.assignedStudentIds.length} students
              </div>
            </div>

            {/* Task Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Task Settings
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={taskForm.settings.allowChatbot}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowChatbot: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Allow AI chatbot during study time</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={taskForm.settings.randomizeQuestions}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, randomizeQuestions: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Randomize question order</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={taskForm.settings.showResourcesDuringTask}
                    onChange={(e) => setTaskForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showResourcesDuringTask: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Show study materials during assessment</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || taskForm.courseOutcomes.length === 0 || taskForm.assignedStudentIds.length === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                <span>{loading ? 'Creating Task...' : 'Create Learning Task'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Task Management View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 CO-Based Task Management</h1>
            <p className="text-gray-600">Monitor and manage CO-focused tasks for lagging students</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('co-assignment')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Users className="w-4 h-4" />
              <span>CO Class Assignment</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              <span>Individual Task</span>
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Created</h3>
            <p className="text-gray-500 mb-6">Create your first learning task to get started.</p>
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map(task => (
              <div key={task._id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-gray-600">{task.subject.name} ({task.subject.code})</p>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Created: {formatDateTime(task.createdAt)}</div>
                    <div className="text-sm text-gray-500">Questions: {task.questions.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Study: {task.taskSchedule.studyDuration}m | Task: {task.taskSchedule.taskDuration}m
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {formatDateTime(task.taskSchedule.startTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      COs: {task.courseOutcomes.join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">
                      {task.assignedStudents.length} students
                    </span>
                  </div>
                </div>

                {/* Student Progress */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Student Progress</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.assignedStudents.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">{assignment.student.name}</div>
                          <div className="text-sm text-gray-600">{assignment.student.rollNumber}</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                          {assignment.score !== undefined && (
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {assignment.score.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyTaskManagement;