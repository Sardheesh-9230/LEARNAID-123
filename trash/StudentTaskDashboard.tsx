'use client'

import React, { useState, useEffect } from 'react';
import { Clock, Book, Play, CheckCircle, AlertCircle, Timer, Bot, FileText } from 'lucide-react';
import { ChatBotService } from '../services/chatbot';

interface Task {
  _id: string;
  title: string;
  description: string;
  subject: {
    name: string;
    code: string;
  };
  courseOutcomes: string[];
  currentStatus: 'upcoming' | 'study-time' | 'active-task' | 'completed' | 'overdue';
  studentStatus: string;
  taskSchedule: {
    studyDuration: number;
    taskDuration: number;
    startTime: string;
    endTime: string;
    studyStartTime: string;
  };
  studyMaterials: Array<{
    title: string;
    type: string;
    url?: string;
    content?: string;
  }>;
  settings: {
    allowChatbot: boolean;
    passingScore: number;
  };
  timeUntilStudy: number;
  timeUntilTask: number;
}

interface StudySession {
  taskId: string;
  studyMaterials: any[];
  studyDuration: number;
  allowChatbot: boolean;
  startTime: Date;
}

interface TaskSession {
  taskId: string;
  questions: Array<{
    index: number;
    questionText: string;
    options: Array<{ text: string }>;
    courseOutcome: string;
    marks: number;
  }>;
  taskDuration: number;
  totalMarks: number;
  passingScore: number;
  startTime: Date;
}

const StudentTaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'task'>('dashboard');
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [taskSession, setTaskSession] = useState<TaskSession | null>(null);
  const [studyTimer, setStudyTimer] = useState(0);
  const [taskTimer, setTaskTimer] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; timestamp?: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/student/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Initialize chatbot when component mounts
  useEffect(() => {
    // Reset chatbot state when component loads
    setChatMessages([]);
    setChatInput('');
    setChatLoading(false);
  }, []);

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (studySession) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - studySession.startTime.getTime()) / 1000);
        const remaining = Math.max(0, studySession.studyDuration * 60 - elapsed);
        setStudyTimer(remaining);
        
        if (remaining === 0) {
          // Study time ended, check if task time started
          fetchTasks();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studySession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - taskSession.startTime.getTime()) / 1000);
        const remaining = Math.max(0, taskSession.taskDuration * 60 - elapsed);
        setTaskTimer(remaining);
        
        if (remaining === 0) {
          // Auto-submit task
          handleSubmitTask();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskSession]);

  // Start study session
  const handleStartStudy = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/study/start/${taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudySession({
          taskId,
          studyMaterials: data.studyMaterials,
          studyDuration: data.studyDuration,
          allowChatbot: data.allowChatbot,
          startTime: new Date()
        });
        setActiveTab('study');
        setStudyTimer(data.studyDuration * 60);
        
        // Initialize chatbot with welcome message if enabled
        if (data.allowChatbot) {
          // Reset chatbot state first
          setChatLoading(false);
          setChatInput('');
          
          // Set welcome message
          setChatMessages([{
            role: 'assistant',
            content: '👋 Hello! I\'m your AI study assistant. I\'m here to help you understand the course materials and answer any questions during your study session.\n\n💡 You can ask me about:\n• Course concepts and definitions\n• Study strategies and tips\n• Course Outcome (CO) explanations\n• Help with difficult topics\n\nWhat would you like to know?',
            timestamp: new Date()
          }]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error('Error starting study session:', error);
      setError('Failed to start study session');
    }
  };

  // Start task session
  const handleStartTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/task/start/${taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTaskSession({
          taskId,
          questions: data.questions,
          taskDuration: data.taskDuration,
          totalMarks: data.totalMarks,
          passingScore: data.passingScore,
          startTime: new Date()
        });
        setActiveTab('task');
        setTaskTimer(data.taskDuration * 60);
        setSelectedAnswers({});
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      setError('Failed to start task');
    }
  };

  // Submit task
  const handleSubmitTask = async () => {
    if (!taskSession) return;
    
    try {
      const answers = Object.entries(selectedAnswers).map(([questionIndex, selectedOption]) => ({
        questionIndex: parseInt(questionIndex),
        selectedOption
      }));
      
      const response = await fetch(`/api/tasks/task/submit/${taskSession.taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Task completed!\nScore: ${result.score.toFixed(1)}%\nCorrect Answers: ${result.correctAnswers}/${result.totalQuestions}\n${result.passed ? 'Passed' : 'Failed'}`);
        setTaskSession(null);
        setActiveTab('dashboard');
        fetchTasks();
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setError('Failed to submit task');
    }
  };

  // Send chat message with backend API integration
  const handleSendMessage = React.useCallback(async () => {
    if (!chatInput || typeof chatInput !== 'string' || !chatInput.trim() || chatLoading) {
      return;
    }
    
    const userMessage = chatInput.trim();
    const timestamp = new Date();
    
    try {
      // Add user message immediately
      setChatMessages(prev => {
        const newMessages = [...(prev || []), { role: 'user', content: userMessage, timestamp }];
        return newMessages;
      });
      
      setChatInput('');
      setChatLoading(true);
      
      // Add thinking indicator
      setChatMessages(prev => {
        const newMessages = [...(prev || []), { role: 'assistant', content: '🤖 Thinking...', timestamp: new Date() }];
        return newMessages;
      });
      
      // Use chatbot service API
      const chatbotService = new ChatBotService();
      
      // Get task information from tasks array for context
      const currentTask = studySession ? tasks.find(t => t._id === studySession.taskId) : null;
      const context = currentTask ? `Subject: ${currentTask.subject?.name || 'General'}, Task: ${currentTask.title}` : undefined;
      
      const response = await chatbotService.sendMessage(userMessage, context);
      
      // Update messages with API response
      setChatMessages(prev => {
        if (!prev || !Array.isArray(prev)) return [];
        const withoutThinking = prev.filter(msg => msg && msg.content !== '🤖 Thinking...');
        
        if (response.success) {
          return [...withoutThinking, { 
            role: 'assistant', 
            content: response.message, 
            timestamp: new Date()
          }];
        } else {
          // Fallback to local AI response if API fails
          const fallbackResponse = generateAIResponse(userMessage);
          return [...withoutThinking, { 
            role: 'assistant', 
            content: `🤖 ${fallbackResponse}\n\n💡 (Using offline mode)`, 
            timestamp: new Date()
          }];
        }
      });
      
    } catch (error) {
      console.error('Chat message error:', error);
      
      // Fallback to local response on error
      setChatMessages(prev => {
        if (!prev || !Array.isArray(prev)) return [];
        const withoutThinking = prev.filter(msg => msg && msg.content !== '🤖 Thinking...');
        const fallbackResponse = generateAIResponse(userMessage);
        return [...withoutThinking, { 
          role: 'assistant', 
          content: `🤖 ${fallbackResponse}\n\n💡 (Offline mode - API unavailable)`, 
          timestamp: new Date()
        }];
      });
    } finally {
      setChatLoading(false);
      setChatMessages(prev => {
        const safeMessages = Array.isArray(prev) ? prev : [];
        return [...safeMessages, { 
          role: 'assistant', 
          content: '😊 Hi! I\'m your study assistant. How can I help you today?', 
          timestamp: new Date()
        }];
      });
    }
  }, [chatInput, chatLoading]);

  // Generate AI response with enhanced safety
  const generateAIResponse = (message: string): string => {
    try {
      // Input validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return "👋 Hello! I'm your AI study assistant. How can I help you today?";
      }
      
      // Length check
      if (message.length > 1000) {
        return "💬 Your message is quite long! Please try asking a shorter, more specific question.";
      }
      
      const lowerMessage = message.toLowerCase().trim();
      
      // Greeting responses
      if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
        return "👋 Hello! I'm here to help you with your studies. You can ask me about course concepts, study tips, or any specific topics you're learning about!";
      }
      
      // Help and explanation requests
      if (lowerMessage.includes('help') || lowerMessage.includes('explain')) {
        return "🤝 I'd be happy to help! You can ask me about:\n\n📚 Course concepts and definitions\n💡 Study tips and strategies\n🎯 Course Outcomes (CO1-CO5)\n❓ Clarifications on difficult topics\n\nWhat would you like to know more about?";
      }
      
      // CO-specific responses
      if (lowerMessage.includes('co1') || lowerMessage.includes('course outcome 1')) {
        return "📖 CO1 focuses on Knowledge & Understanding - the foundational concepts:\n\n🔍 Key areas:\n• Basic definitions and terminology\n• Fundamental principles\n• Theoretical foundations\n\n💡 Tip: Start with understanding the 'why' before the 'how'!";
      }
      
      if (lowerMessage.includes('co2') || lowerMessage.includes('course outcome 2')) {
        return "⚡ CO2 focuses on Application & Implementation - putting theory into practice:\n\n🛠️ Key areas:\n• Code implementation\n• Problem-solving techniques\n• Practical applications\n\n💡 Tip: Practice with real examples to solidify your understanding!";
      }
      
      if (lowerMessage.includes('co3') || lowerMessage.includes('course outcome 3')) {
        return "🔬 CO3 focuses on Analysis & Design - critical thinking:\n\n🎯 Key areas:\n• System analysis\n• Design patterns\n• Performance evaluation\n\n💡 Tip: Ask 'What if?' questions to develop analytical skills!";
      }
      
      if (lowerMessage.includes('co4') || lowerMessage.includes('course outcome 4')) {
        return "🧪 CO4 focuses on Testing & Evaluation - ensuring quality:\n\n✅ Key areas:\n• Testing strategies\n• Debugging techniques\n• Quality assurance\n\n💡 Tip: Always test your understanding with practice problems!";
      }
      
      if (lowerMessage.includes('co5') || lowerMessage.includes('course outcome 5')) {
        return "👥 CO5 focuses on Communication & Teamwork - professional skills:\n\n🗣️ Key areas:\n• Technical documentation\n• Team collaboration\n• Presentation skills\n\n💡 Tip: Practice explaining concepts to others!";
      }
      
      // Study-related queries
      if (lowerMessage.includes('study') || lowerMessage.includes('prepare')) {
        return "📚 Here are my top study strategies:\n\n⏰ Time management:\n• Use 25-minute focused sessions\n• Take regular breaks\n• Review daily\n\n🎯 Active learning:\n• Summarize in your own words\n• Create mind maps\n• Practice with examples\n\n✅ Focus on understanding, not memorizing!";
      }
      
      if (lowerMessage.includes('difficult') || lowerMessage.includes('hard')) {
        return "😊 Don't worry! Here's how to tackle difficult topics:\n\n🔄 Step-by-step approach:\n1️⃣ Break into smaller parts\n2️⃣ Find simple examples\n3️⃣ Practice basics first\n4️⃣ Build up complexity\n\n💪 Remember: Confusion means you're learning!";
      }
      
      if (lowerMessage.includes('example') || lowerMessage.includes('practical')) {
        return "💡 Great question! Practical examples really help:\n\n🌍 Try these approaches:\n• Look for real-world applications\n• Find case studies\n• Connect to current projects\n\n📝 What specific concept would you like examples for?";
      }
      
      if (lowerMessage.includes('score') || lowerMessage.includes('improve')) {
        return "🎯 Want to improve your performance? Here's how:\n\n📈 Success tips:\n• Focus on weak areas first\n• Practice with timed exercises\n• Understand the reasoning\n• Learn from mistakes\n\n💯 Each mistake is a learning opportunity!";
      }
      
      // Default encouraging responses
      const defaultResponses = [
        "🌟 That's a great question! I'm here to help you understand better.",
        "💪 Excellent that you're asking questions - it shows active learning!",
        "🎯 This is important for your understanding. Let me help you with that.",
        "📚 I appreciate your curiosity! Let's explore this together.",
        "✨ Good question! This will definitely help your learning.",
        "🔍 Let me help you understand this concept better.",
        "💡 Smart thinking! I'm here to support your learning journey."
      ];
      
      const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      return randomResponse + "\n\n💬 Feel free to ask about specific concepts, study tips, or course outcomes (CO1-CO5)!";
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "🤖 I'm here to help! Please ask me about your course materials, study tips, or any concepts you'd like to understand better.";
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'study-time': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active-task': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'study-time': return <Book className="w-4 h-4" />;
      case 'active-task': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (activeTab === 'study' && studySession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">📚 Study Mode</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <span className="font-mono text-lg text-blue-800">{formatTime(studyTimer)}</span>
                </div>
                <button
                  onClick={() => { 
                    setStudySession(null); 
                    setActiveTab('dashboard');
                    setChatMessages([]); // Reset chat messages
                    setChatInput(''); // Reset input
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Exit Study
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Study Materials */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Study Materials
                </h2>
                <div className="space-y-4">
                  {studySession.studyMaterials.map((material, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <h3 className="font-medium text-gray-800">{material.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">Type: {material.type}</p>
                      {material.content && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">{material.content}</div>
                      )}
                      {material.url && (
                        <a 
                          href={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                        >
                          Open Resource →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Chatbot */}
            {studySession && studySession.allowChatbot && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-green-600" />
                    AI Study Assistant
                  </div>
                  {chatLoading && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                      Processing...
                    </div>
                  )}
                </h2>
                
                <div className="h-96 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-gray-500 mt-8">
                        <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">👋 Hi! I'm here to help you with your studies.</p>
                        <p className="text-xs text-gray-400 mt-1">Ask me about course concepts, COs, or study tips!</p>
                      </div>
                    )}
                    
                    {chatMessages.map((msg, index) => {
                      try {
                        return (
                          <div key={index} className={`p-3 rounded-lg max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-blue-500 text-white ml-auto' 
                              : 'bg-gray-100 text-gray-800 mr-auto'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {msg.role === 'assistant' && (
                                <Bot className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm whitespace-pre-line leading-relaxed">
                                  {msg.content || 'Message content unavailable'}
                                </p>
                                {msg.timestamp && (
                                  <p className={`text-xs mt-1 opacity-70 ${
                                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('Error rendering message:', error);
                        return (
                          <div key={index} className="p-3 rounded-lg max-w-[80%] bg-red-100 text-red-800 mr-auto">
                            <p className="text-sm">Error displaying message</p>
                          </div>
                        );
                      }
                    })}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask me about course concepts, COs, study tips..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={chatLoading}
                        maxLength={500}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {chatLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <span>Send</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button 
                        onClick={() => {
                          try {
                            setChatInput('Help me understand CO1 concepts');
                          } catch (e) {
                            console.error('Button click error:', e);
                          }
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                        disabled={chatLoading}
                      >
                        CO1 Help
                      </button>
                      <button 
                        onClick={() => {
                          try {
                            setChatInput('Give me study tips');
                          } catch (e) {
                            console.error('Button click error:', e);
                          }
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                        disabled={chatLoading}
                      >
                        Study Tips
                      </button>
                      <button 
                        onClick={() => {
                          try {
                            setChatInput('I find this topic difficult');
                          } catch (e) {
                            console.error('Button click error:', e);
                          }
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                        disabled={chatLoading}
                      >
                        Need Help
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'task' && taskSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">📝 Assessment Task</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-lg">
                  <Timer className="w-5 h-5 text-green-600" />
                  <span className="font-mono text-lg text-green-800">{formatTime(taskTimer)}</span>
                </div>
                <button
                  onClick={handleSubmitTask}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Submit Task
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total Marks: {taskSession.totalMarks} | Passing Score: {taskSession.passingScore}%
            </div>
          </div>

          <div className="space-y-6">
            {taskSession.questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">Question {qIndex + 1}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {question.courseOutcome} | {question.marks} marks
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{question.questionText}</p>
                
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label key={oIndex} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={oIndex}
                        onChange={() => setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 My Learning Tasks</h1>
          <p className="text-gray-600">CO-based assignments with scheduled study and assessment times</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Assigned</h3>
              <p className="text-gray-500">Your faculty will assign learning tasks that will appear here.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-gray-600 mt-1">{task.subject.name} ({task.subject.code})</p>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(task.currentStatus)}`}>
                    {getStatusIcon(task.currentStatus)}
                    <span className="text-sm font-medium capitalize">{task.currentStatus.replace('-', ' ')}</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{task.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Book className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Study: {task.taskSchedule.studyDuration} min
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      Task: {task.taskSchedule.taskDuration} min
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      COs: {task.courseOutcomes.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {task.currentStatus === 'study-time' && 'Study time is active!'}
                    {task.currentStatus === 'active-task' && 'Assessment is live!'}
                    {task.currentStatus === 'upcoming' && 
                      `Starts: ${new Date(task.taskSchedule.studyStartTime).toLocaleString()}`
                    }
                    {task.currentStatus === 'completed' && 'Task completed'}
                    {task.currentStatus === 'overdue' && 'Task overdue'}
                  </div>

                  <div className="flex space-x-3">
                    {task.currentStatus === 'study-time' && (
                      <button
                        onClick={() => handleStartStudy(task._id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <Book className="w-4 h-4" />
                        <span>Start Study</span>
                      </button>
                    )}
                    
                    {task.currentStatus === 'active-task' && (
                      <button
                        onClick={() => handleStartTask(task._id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Assessment</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTaskDashboard;