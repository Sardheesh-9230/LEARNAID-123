'use client'

import React, { useState, useEffect } from 'react';
import { Clock, Users, BookOpen, Target, Calendar, Settings, Plus, Eye, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  year?: string;
  section?: string;
  semester?: number;
  department?: any;
  credits?: number;
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
  taskType?: 'regular' | 'CO_ASSESSMENT' | 'CO_IMPROVEMENT';
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

interface FacultyTaskManagementProps {
  mySubjects?: Subject[];
  onOpenCOIdentification?: (subject: Subject) => void;
}

const FacultyTaskManagement: React.FC<FacultyTaskManagementProps> = ({ 
  mySubjects: propSubjects = [],
  onOpenCOIdentification 
}) => {
  const [activeTab, setActiveTab] = useState<'automatic' | 'manage'>('automatic');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentsWithCOTasks, setStudentsWithCOTasks] = useState<any[]>([]);
  const [showCOTaskWarning, setShowCOTaskWarning] = useState(false);
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterTaskType, setFilterTaskType] = useState<'all' | 'CO_ASSESSMENT' | 'CO_IMPROVEMENT' | 'regular'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'completion' | 'score'>('date');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  
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

  // Subject-scoped student list (changes when a subject is selected in the CO form)
  const [subjectStudents, setSubjectStudents] = useState<Student[]>([]);
  const [loadingSubjectStudents, setLoadingSubjectStudents] = useState(false);

  // Fetch students enrolled in a specific subject
  const fetchStudentsForSubject = async (subjectId: string) => {
    if (!subjectId) { setSubjectStudents([]); return; }
    try {
      setLoadingSubjectStudents(true);
      const res = await apiService.makeRequest(`/subjects/${subjectId}/students`);
      if (res.success) {
        setSubjectStudents(res.data || []);
        // Auto-select all students in this subject
        setCoAssignmentForm(prev => ({
          ...prev,
          selectedStudents: (res.data || []).map((s: Student) => s._id)
        }));
      } else {
        setSubjectStudents([]);
      }
    } catch (e) {
      console.error('Error loading subject students:', e);
      setSubjectStudents([]);
    } finally {
      setLoadingSubjectStudents(false);
    }
  };

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
      const response = await apiService.makeRequest('/subjects/faculty/my-subjects');
      if (response.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Fetch only students in this faculty's subjects (not all students)
      const response = await apiService.makeRequest('/users/my-students');
      if (response.success) {
        setStudents(response.users || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch regular tasks
      const regularResponse = await apiService.makeRequest('/tasks/faculty/tasks');
      
      // Fetch improvement/assessment tasks
      const improvementResponse = await apiService.makeRequest('/improvement-tasks/faculty/my-tasks');
      
      let allTasks: Task[] = [];
      
      if (regularResponse.success) {
        allTasks = [...allTasks, ...(regularResponse.tasks || [])];
      }
      
      if (improvementResponse.success) {
        // Transform improvement tasks to match Task interface
        const transformedTasks = (improvementResponse.data || []).map((task: any) => {
          // Handle multi-student tasks (new format)
          if (task.isMultiStudent && task.assignedStudents) {
            return {
              ...task,
              assignedStudents: task.assignedStudents.map((a: any) => ({
                student: a.student, // Already populated
                status: (a.status || 'assigned').toLowerCase().replace(' ', '-'),
                score: a.latestScore || undefined,
                weakCOs: a.weakCOs || [],
                questionsCount: a.questionsCount || 0,
                totalMarks: a.totalMarks || 0
              })),
              questions: task.metadata?.generatedMCQs?.questions || [],
              taskSchedule: {
                studyDuration: task.metadata?.studyTimeMinutes || 0,
                taskDuration: task.metadata?.generatedMCQs?.estimatedTime || 30,
                startTime: task.createdAt,
                endTime: task.dueDate
              }
            };
          }
          
          // Handle single-student tasks (old format)
          return {
            ...task,
            assignedStudents: [{
              student: task.student,
              status: task.status.toLowerCase().replace(' ', '-'),
              score: task.metadata?.mcqScores && task.metadata.mcqScores.length > 0 
                ? Math.max(...task.metadata.mcqScores.map((s: any) => s.score))
                : undefined
            }],
            questions: task.metadata?.generatedMCQs?.questions || [],
            taskSchedule: {
              studyDuration: task.metadata?.studyTimeMinutes || 0,
              taskDuration: task.metadata?.generatedMCQs?.estimatedTime || 30,
              startTime: task.createdAt,
              endTime: task.dueDate
            }
          };
        });
        allTasks = [...allTasks, ...transformedTasks];
      }
      
      setTasks(allTasks);
      console.log(`✅ Loaded ${allTasks.length} tasks`);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Check for students with existing learning tasks
  const checkExistingTasks = async (subjectId: string) => {
    if (!subjectId) return;
    
    try {
      const data = await apiService.makeRequest('/tasks/faculty/tasks');
      if (data.success) {
        const activeTasks = (data.tasks || []).filter((task: any) => 
          task.subject?._id === subjectId && 
          task.assignedStudents?.some((as: any) => 
            ['assigned', 'studying', 'in-progress'].includes(as.status)
          )
        );
        
        const studentsWithActiveTasks = activeTasks.flatMap((task: any) => 
          (task.assignedStudents || [])
            .filter((as: any) => 
              ['assigned', 'studying', 'in-progress'].includes(as.status) &&
              as.student?._id
            )
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
      // Calculate end time based on start time and task duration
      const startTime = new Date(taskForm.taskSchedule.startTime);
      const endTime = new Date(startTime.getTime() + (taskForm.taskSchedule.taskDuration * 60000));
      
      const taskData = {
        ...taskForm,
        subjectId: taskForm.subjectId,
        taskSchedule: {
          ...taskForm.taskSchedule,
          endTime: endTime.toISOString()
        }
      };

      const data = await apiService.makeRequest('/tasks/create', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      if (data.task || data.generatedQuestions !== undefined) {
        alert(`Task created successfully! Generated ${data.generatedQuestions} MCQ questions.`);
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
        setError(data.message || 'Failed to create task');
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.message || 'Network error occurred');
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

  // Statistics calculations
  const getTaskStatistics = () => {
    const totalTasks = tasks.length;
    const assessmentTasks = tasks.filter(t => t.taskType === 'CO_ASSESSMENT').length;
    const improvementTasks = tasks.filter(t => t.taskType === 'CO_IMPROVEMENT').length;
    const regularTasks = tasks.filter(t => !t.taskType || t.taskType === 'regular').length;
    
    const allAssignments = tasks.flatMap(t => t.assignedStudents || []);
    const completedAssignments = allAssignments.filter(a => a.status === 'completed' || a.status === 'Completed');
    const totalStudents = new Set(
      allAssignments
        .filter(a => a.student && a.student._id)
        .map(a => a.student._id)
    ).size;
    
    const scoresWithData = allAssignments.filter(a => a.score !== undefined && a.score !== null);
    const averageScore = scoresWithData.length > 0
      ? scoresWithData.reduce((sum, a) => sum + (a.score || 0), 0) / scoresWithData.length
      : 0;
    
    const completionRate = allAssignments.length > 0
      ? (completedAssignments.length / allAssignments.length) * 100
      : 0;

    return {
      totalTasks,
      assessmentTasks,
      improvementTasks,
      regularTasks,
      totalStudents,
      totalAssignments: allAssignments.length,
      completedAssignments: completedAssignments.length,
      completionRate,
      averageScore
    };
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    // Filter by type
    if (filterTaskType !== 'all') {
      if (filterTaskType === 'regular') {
        filtered = filtered.filter(t => !t.taskType || t.taskType === 'regular');
      } else {
        filtered = filtered.filter(t => t.taskType === filterTaskType);
      }
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => {
        const assignments = t.assignedStudents || [];
        if (filterStatus === 'completed') {
          return assignments.every(a => a.status === 'completed' || a.status === 'Completed');
        } else {
          return assignments.some(a => !['completed', 'Completed'].includes(a.status));
        }
      });
    }

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter(t => t.subject._id === filterSubject);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'completion':
          const aCompleted = (a.assignedStudents || []).filter(s => s.status === 'completed' || s.status === 'Completed').length;
          const bCompleted = (b.assignedStudents || []).filter(s => s.status === 'completed' || s.status === 'Completed').length;
          return bCompleted - aCompleted;
        case 'score':
          const aAvg = getTaskAverageScore(a);
          const bAvg = getTaskAverageScore(b);
          return bAvg - aAvg;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTaskAverageScore = (task: Task) => {
    const scores = (task.assignedStudents || [])
      .filter(a => a.score !== undefined && a.score !== null)
      .map(a => a.score || 0);
    return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
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
      const data = await apiService.makeRequest('/tasks/generate-co-mcqs', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: coAssignmentForm.subjectId,
          courseOutcomes: coAssignmentForm.courseOutcomes,
          difficulty: coAssignmentForm.difficulty,
          questionCount: coAssignmentForm.questionCount
        })
      });

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
      const data = await apiService.makeRequest('/tasks/bulk-assign-co-tasks', {
        method: 'POST',
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

      if (data.success) {
        alert(`Task assigned successfully to ${coAssignmentForm.selectedStudents.length} students!`);
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
        fetchTasks();
      } else {
        setError(data.message || 'Failed to assign tasks');
      }
    } catch (error) {
      setError('Error assigning tasks to students');
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'automatic') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Automatic CO-Based Task Assignment</h1>
              <p className="text-gray-600">Identify lagging students by Course Outcomes and automatically assign improvement tasks</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('manage')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Eye className="w-4 h-4" />
                <span>View All Tasks</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Subject Selection Cards */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Subject</h2>
              <p className="text-gray-600">Click on a subject to identify lagging students and assign CO-specific improvement tasks</p>
            </div>

            {propSubjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">No subjects assigned</p>
                <p className="text-gray-500 text-sm mt-2">Please contact admin to assign subjects to your account</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propSubjects.map((subject) => (
                  <button
                    key={subject._id}
                    onClick={() => onOpenCOIdentification?.(subject)}
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:scale-105 transform"
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">
                        {subject.name}
                      </h3>
                      
                      <div className="flex items-center text-white text-opacity-90 text-sm mb-3">
                        <span className="font-mono bg-white bg-opacity-20 px-2 py-1 rounded">
                          {subject.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-white text-opacity-90 text-sm">
                        <span>Year {subject.year}</span>
                        <span>•</span>
                        <span>Section {subject.section}</span>
                        <span>•</span>
                        <span>Sem {subject.semester}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                        <div className="flex items-center text-white text-sm font-medium">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span>Click to identify lagging students</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </button>
                ))}
              </div>
            )}
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



  // Task Management View
  const stats = getTaskStatistics();
  const filteredTasks = getFilteredAndSortedTasks();
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Task Management</h1>
            <p className="text-gray-600">View and manage all assigned student tasks with detailed analytics</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('automatic')}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Target className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.totalTasks}</span>
            </div>
            <h3 className="text-gray-700 font-medium">Total Tasks</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.assessmentTasks} Assessment, {stats.improvementTasks} Improvement
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.totalStudents}</span>
            </div>
            <h3 className="text-gray-700 font-medium">Students Engaged</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalAssignments} total assignments
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</span>
            </div>
            <h3 className="text-gray-700 font-medium">Completion Rate</h3>
            <p className="text-sm text-gray-500 mt-1">
              {stats.completedAssignments} of {stats.totalAssignments} completed
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats.averageScore.toFixed(1)}%</span>
            </div>
            <h3 className="text-gray-700 font-medium">Average Score</h3>
            <p className="text-sm text-gray-500 mt-1">
              Across all completed tasks
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Task Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
              <select
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types ({stats.totalTasks})</option>
                <option value="CO_ASSESSMENT">Assessment ({stats.assessmentTasks})</option>
                <option value="CO_IMPROVEMENT">Improvement ({stats.improvementTasks})</option>
                <option value="regular">Regular ({stats.regularTasks})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                {Array.from(new Set(tasks.map(t => t.subject._id))).map(subjectId => {
                  const subject = tasks.find(t => t.subject._id === subjectId)?.subject;
                  return subject ? (
                    <option key={subjectId} value={subjectId}>
                      {subject.name} ({subject.code})
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date Created</option>
                <option value="completion">Completion Rate</option>
                <option value="score">Average Score</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 px-3 py-2 rounded-lg ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 px-3 py-2 rounded-lg ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {tasks.length === 0 ? 'No Tasks Created' : 'No Tasks Match Filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {tasks.length === 0
                ? 'Use the Automatic CO Assignment feature to create tasks for lagging students.'
                : 'Try adjusting your filters to see more tasks.'}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={() => setActiveTab('automatic')}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 mx-auto"
              >
                <Target className="w-4 h-4" />
                <span>Create First Task</span>
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid gap-6">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task._id} 
                task={task} 
                onViewDetails={(t) => {
                  setSelectedTask(t);
                  setShowTaskDetails(true);
                }}
              />
            ))}
          </div>
        ) : (
          <TaskTable 
            tasks={filteredTasks}
            onViewDetails={(t) => {
              setSelectedTask(t);
              setShowTaskDetails(true);
            }}
          />
        )}

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => {
              setShowTaskDetails(false);
              setSelectedTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onViewDetails }: { task: Task; onViewDetails: (task: Task) => void }) {
  const completedCount = (task.assignedStudents || []).filter(
    a => a.status === 'completed' || a.status === 'Completed'
  ).length;
  const totalCount = (task.assignedStudents || []).length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const scores = (task.assignedStudents || [])
    .filter(a => a.score !== undefined && a.score !== null)
    .map(a => a.score || 0);
  const averageScore = scores.length > 0 
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
    : null;

  const getTaskTypeBadge = () => {
    if (task.taskType === 'CO_ASSESSMENT') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Assessment
        </span>
      );
    } else if (task.taskType === 'CO_IMPROVEMENT') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          Improvement
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Regular
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
            {getTaskTypeBadge()}
          </div>
          <p className="text-gray-600">{task.subject.name} ({task.subject.code})</p>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">
            Questions: {task.questions?.length || 0}
          </div>
        </div>
      </div>

      {/* Task Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-xs text-gray-500">Study Time</div>
            <div className="text-sm font-medium">{task.taskSchedule.studyDuration}m</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-xs text-gray-500">Students</div>
            <div className="text-sm font-medium">{totalCount}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-purple-500" />
          <div>
            <div className="text-xs text-gray-500">Completion</div>
            <div className="text-sm font-medium">{completionRate.toFixed(0)}%</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-xs text-gray-500">Avg Score</div>
            <div className="text-sm font-medium">
              {averageScore !== null ? `${averageScore.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Course Outcomes */}
      {task.courseOutcomes && task.courseOutcomes.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Course Outcomes:</div>
          <div className="flex flex-wrap gap-2">
            {task.courseOutcomes.map((co, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium"
              >
                {co}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{completedCount} / {totalCount} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* View Details Button */}
      <button
        onClick={() => onViewDetails(task)}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span>View Details & Results</span>
      </button>
    </div>
  );
}

// Task Table Component
function TaskTable({ tasks, onViewDetails }: { tasks: Task[]; onViewDetails: (task: Task) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Completion
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Avg Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map(task => {
              const totalCount = (task.assignedStudents || []).length;
              const completedCount = (task.assignedStudents || []).filter(
                a => a.status === 'completed' || a.status === 'Completed'
              ).length;
              const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
              
              const scores = (task.assignedStudents || [])
                .filter(a => a.score !== undefined && a.score !== null)
                .map(a => a.score || 0);
              const averageScore = scores.length > 0 
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
                : null;

              return (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.taskType === 'CO_ASSESSMENT' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Assessment
                      </span>
                    ) : task.taskType === 'CO_IMPROVEMENT' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Improvement
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{task.subject.name}</div>
                    <div className="text-xs text-gray-500">{task.subject.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{totalCount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {completionRate.toFixed(0)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {averageScore !== null ? `${averageScore.toFixed(1)}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewDetails(task)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Task Details Modal Component
function TaskDetailsModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
              <p className="text-gray-600 mt-1">{task.subject.name} ({task.subject.code})</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Task Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Task Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Study Time</div>
                <div className="text-xl font-bold text-blue-600">{task.taskSchedule.studyDuration}m</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Task Duration</div>
                <div className="text-xl font-bold text-green-600">{task.taskSchedule.taskDuration}m</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Questions</div>
                <div className="text-xl font-bold text-purple-600">{task.questions?.length || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">COs Covered</div>
                <div className="text-xl font-bold text-orange-600">{task.courseOutcomes?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Student Results */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Student Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Roll Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(task.assignedStudents || [])
                    .filter(assignment => assignment.student && assignment.student._id)
                    .map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{assignment.student.name}</div>
                        <div className="text-sm text-gray-500">{assignment.student.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {assignment.student.rollNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'completed' || assignment.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'in-progress' || assignment.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignment.score !== undefined && assignment.score !== null ? (
                          <span className="text-sm font-medium text-gray-900">
                            {assignment.score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignment.score !== undefined && assignment.score !== null ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.score >= 70
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assignment.score >= 70 ? 'Pass' : 'Fail'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusColor = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === 'completed') return 'bg-green-100 text-green-800';
  if (lowerStatus === 'in-progress' || lowerStatus === 'studying') return 'bg-yellow-100 text-yellow-800';
  if (lowerStatus === 'assigned') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

export default FacultyTaskManagement;