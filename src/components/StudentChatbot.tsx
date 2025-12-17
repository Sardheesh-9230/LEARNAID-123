'use client'

import { useState, useRef, useEffect } from 'react'
import apiService from '@/services/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  materials?: Material[]
  suggestions?: string[]
  sources?: Array<{ title: string; url?: string }>
}

interface Material {
  title: string
  type: string
  description?: string
  subject?: string
  chapter?: string
  url?: string
}

interface Subject {
  _id: string
  name: string
  code: string
}

interface Chapter {
  _id: string
  title: string
  chapterNumber: number
}

interface ChapterMaterial {
  _id: string
  title: string
  type: string
}

type ChatMode = 'material' | 'web'

export default function StudentChatbot({ mode = 'floating' }: { mode?: 'floating' | 'page' }) {
  const isPage = mode === 'page'
  const [isOpen, setIsOpen] = useState(isPage)

  const [chatMode, setChatMode] = useState<ChatMode>('material')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Hello! I\'m your LearnAID RAG Assistant. I can help you find and learn from course materials uploaded by your teachers. Ask me anything about your subjects!',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [materials, setMaterials] = useState<ChapterMaterial[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [showFilters, setShowFilters] = useState(isPage)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isPage) setIsOpen(true)
  }, [isPage])

  useEffect(() => {
    if (isOpen && subjects.length === 0) {
      fetchSubjects()
    }
  }, [isOpen, subjects.length])

  useEffect(() => {
    if (!isOpen) return
    if (!selectedSubject) {
      setChapters([])
      setSelectedChapter('')
      setMaterials([])
      setSelectedMaterial('')
      return
    }
    fetchChapters(selectedSubject)
  }, [isOpen, selectedSubject])

  useEffect(() => {
    if (!isOpen) return
    if (!selectedChapter) {
      setMaterials([])
      setSelectedMaterial('')
      return
    }
    fetchMaterials(selectedChapter)
  }, [isOpen, selectedChapter])

  useEffect(() => {
    if (chatMode === 'web') {
      setSelectedMaterial('')
    }
  }, [chatMode])

  const fetchSubjects = async () => {
    try {
      const response = await apiService.makeRequest('/subjects/student/my-subjects')
      if (response?.success) setSubjects(response.data || [])
    } catch (error) {
      console.warn('Backend not available - please ensure server is running on port 5000')
    }
  }

  const fetchChapters = async (subjectId: string) => {
    try {
      const response = await apiService.makeRequest(`/chatbot/chapters/${subjectId}`)
      if (response?.success) {
        setChapters(response.data || [])
      } else {
        setChapters([])
      }
    } catch {
      setChapters([])
    }
  }

  const fetchMaterials = async (chapterId: string) => {
    try {
      const response = await apiService.makeRequest(`/materials/chapters/${chapterId}/materials`)
      if (response?.success) {
        setMaterials(response.data || [])
        setSelectedMaterial('')
      } else {
        setMaterials([])
        setSelectedMaterial('')
      }
    } catch {
      setMaterials([])
      setSelectedMaterial('')
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const question = inputMessage
    setInputMessage('')
    setIsTyping(true)

    try {
      // apiService handles auth headers internally
      if (!apiService.token && typeof window !== 'undefined') {
        apiService.init()
      }

      if (!apiService.token) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '🔐 Please log in to access course materials and get personalized answers from your uploaded study materials.\n\nTo test the chatbot:\n1. Go back to login page\n2. Use the student credentials:\n   • Email: arjun.patel@student.learnaid.edu\n   • Password: student123\n3. Return to the student dashboard',
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
        return
      }

      let data

      if (chatMode === 'web') {
        data = await apiService.makeRequest('/chatbot/web-search', {
          method: 'POST',
          body: JSON.stringify({ question })
        })
      } else {
        if (!selectedMaterial) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: 'Please select a Unit and a Material file before asking from materials.',
            sender: 'bot',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, botMessage])
          setIsTyping(false)
          return
        }

        data = await apiService.makeRequest('/chatbot/material-chat', {
          method: 'POST',
          body: JSON.stringify({
            question,
            subjectId: selectedSubject || undefined,
            chapterId: selectedChapter || undefined,
            materialId: selectedMaterial
          })
        })
      }

      if (data?.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.data.answer,
          sender: 'bot',
          timestamp: new Date(),
          materials: data.data.materials || [],
          suggestions: data.data.suggestions || [],
          sources: data.data.sources || []
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data?.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMsg = error instanceof Error && error.message.includes('fetch') 
        ? '⚠️ Cannot connect to backend server. Please ensure:\n\n1. Backend server is running (npm start in backend folder)\n2. Server is accessible at http://localhost:5000\n3. No firewall is blocking the connection'
        : 'Sorry, I encountered an error. Please try again.'
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMsg,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "What materials are available for this subject?",
    "Explain the key concepts from this chapter",
    "Can you summarize this topic?",
    "Show me practice problems",
  ]

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isPage && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 z-50 ${
            isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
          }`}
          title="AI Learning Assistant"
        >
          {isOpen ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></span>
            </div>
          )}
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className={
            `${
              isPage
                ? 'w-full h-[calc(100vh-0px)]'
                : 'fixed bottom-24 right-6 w-[450px] h-[650px]'
            } ` +
            `bg-white flex flex-col overflow-hidden ` +
            `${isPage ? '' : 'border border-gray-200 rounded-2xl shadow-2xl z-50'}`
          }
        >
          {/* Header */}
          <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white ${isPage ? 'p-6' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold">RAG Learning Assistant</h3>
                  <p className="text-xs text-blue-100">Powered by Course Materials</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-blue-100 mb-1 block">Answer Source</label>
                    <select
                      value={chatMode}
                      onChange={(e) => setChatMode(e.target.value as ChatMode)}
                      className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="material" className="text-gray-800">Material (RAG)</option>
                      <option value="web" className="text-gray-800">Web (Tavily)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-blue-100 mb-1 block">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="text-gray-800">Select subject</option>
                      {subjects.map(subject => (
                        <option key={subject._id} value={subject._id} className="text-gray-800">
                          {subject.code} - {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-blue-100 mb-1 block">Unit (Chapter)</label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      disabled={!selectedSubject}
                      className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60"
                    >
                      <option value="" className="text-gray-800">Select unit</option>
                      {chapters.map(ch => (
                        <option key={ch._id} value={ch._id} className="text-gray-800">
                          Unit {ch.chapterNumber} - {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-blue-100 mb-1 block">Material File</label>
                    <select
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      disabled={!selectedChapter || chatMode === 'web'}
                      className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60"
                    >
                      <option value="" className="text-gray-800">Select material</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id} className="text-gray-800">
                          {m.title}{m.type ? ` (${m.type})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow-md border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  
                  {/* Display Materials */}
                  {message.materials && message.materials.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.materials.map((material, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-start space-x-2">
                            <span className="text-lg">
                              {material.type === 'PDF' && '📄'}
                              {material.type === 'Video' && '🎥'}
                              {material.type === 'Link' && '🔗'}
                              {material.type === 'Document' && '📝'}
                              {material.type === 'PPT' && '📊'}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{material.title}</h4>
                              {material.description && (
                                <p className="text-xs text-gray-600 mt-1">{material.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {material.subject && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {material.subject}
                                  </span>
                                )}
                                {material.chapter && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                    {material.chapter}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-600 font-medium">Try asking:</p>
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-2 py-1.5 rounded transition-colors"
                        >
                          • {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-xs text-gray-500 ml-2">
                      {chatMode === 'web' ? 'Searching web...' : 'Searching materials...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-2">Quick Questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputMessage(question)}
                    className="text-xs bg-white hover:bg-blue-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors text-left"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatMode === 'web' ? 'Ask anything (web search)...' : 'Ask about the selected material...'}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              🤖 AI-powered • 📚 Materials from your teachers
            </p>
          </div>
        </div>
      )}
    </>
  )
}
