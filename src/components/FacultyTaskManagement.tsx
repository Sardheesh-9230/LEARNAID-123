'use client'

import React, { useState, useEffect } from 'react';
import { Clock, Users, BookOpen, Target, Calendar, Settings, Plus, Eye, AlertCircle } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Task Management</h1>
            <p className="text-gray-600">View and manage all assigned student tasks</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('automatic')}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Users className="w-4 h-4" />
              <span>Automatic CO Assignment</span>
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Created</h3>
            <p className="text-gray-500 mb-6">Use the Automatic CO Assignment feature to create tasks for lagging students.</p>
            <button
              onClick={() => setActiveTab('automatic')}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 mx-auto"
            >
              <Target className="w-4 h-4" />
              <span>Automatic Assignment</span>
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