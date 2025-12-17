'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiService from '../../services/api'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty' | 'student'>('admin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Development Mode: Fallback authentication when backend is unavailable
      const devCredentials: Record<string, {password: string, role: string, name: string}> = {
        'admin@learnaid.edu': { password: 'admin123', role: 'admin', name: 'Admin User' },
        'priya.sharma@learnaid.edu': { password: 'faculty123', role: 'faculty', name: 'Priya Sharma' },
        'arjun.patel@student.learnaid.edu': { password: 'student123', role: 'student', name: 'Arjun Patel' }
      }

      let response;
      try {
        response = await apiService.login(formData.email, formData.password)
      } catch (apiError) {
        // Backend unavailable - use development fallback
        console.warn('Backend unavailable, using development authentication')
        const devUser = devCredentials[formData.email]
        
        if (devUser && devUser.password === formData.password) {
          response = {
            success: true,
            token: 'dev-token-' + Date.now(),
            user: {
              email: formData.email,
              role: devUser.role,
              name: devUser.name,
              department: { name: 'Computer Science', id: 'dev-dept-1' }
            }
          }
        } else {
          throw new Error('Invalid credentials')
        }
      }
      
      if (response.success && response.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.user))
          localStorage.setItem('authToken', response.token)
          // Backward compatibility: some components still read `token`
          localStorage.setItem('token', response.token)
          localStorage.setItem('userRole', response.user.role.toLowerCase())
          localStorage.setItem('userEmail', response.user.email)
          localStorage.setItem('userName', response.user.name)
          localStorage.setItem('userDepartment', response.user.department?.name || '')
          localStorage.setItem('userDepartmentId', response.user.department?.id || '')

          // Ensure userId exists for dashboards that need it
          const resolvedUserId = (response.user as any)?.id || (response.user as any)?._id || (response.user as any)?.userId
          if (resolvedUserId) {
            localStorage.setItem('userId', String(resolvedUserId))
          }
        }
        
        const role = response.user.role.toLowerCase()
        
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            switch (role) {
              case 'admin':
                window.location.href = '/admin'
                break
              case 'faculty':
                window.location.href = '/faculty'
                break
              case 'student':
                window.location.href = '/student'
                break
              default:
                window.location.href = '/admin'
            }
          }
        }, 100)
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: 'admin' | 'faculty' | 'student') => {
    setSelectedRole(role)
    switch (role) {
      case 'admin':
        setFormData({
          email: 'admin@learnaid.edu',
          password: 'admin123'
        })
        break
      case 'faculty':
        setFormData({
          email: 'priya.sharma@learnaid.edu',
          password: 'faculty123'
        })
        break
      case 'student':
        setFormData({
          email: 'arjun.patel@student.learnaid.edu',
          password: 'student123'
        })
        break
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Left Side - Platform Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center max-w-xl mx-auto w-full">
          {/* Logo & Title */}
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-blue-600 font-bold text-3xl">L</span>
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">LearnAID</h1>
                <p className="text-blue-100 text-sm">Intelligent Learning Platform</p>
              </div>
            </div>
            <p className="text-xl text-white/90 leading-relaxed">
              Admin-centric educational platform with AI-powered performance tracking and personalized learning support.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            {[
              { icon: '👑', title: 'Admin Control', desc: 'Hierarchical management system', delay: '0s' },
              { icon: '📝', title: 'CIA Exam System', desc: 'Chapter-wise performance tracking', delay: '0.2s' },
              { icon: '🤖', title: 'AI Task Generator', desc: 'Personalized MCQ generation', delay: '0.4s' },
              { icon: '💬', title: 'RAG Chatbot', desc: 'Smart learning assistant', delay: '0.6s' }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                style={{
                  animation: `slideIn 0.5s ease-out ${feature.delay} both`
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{feature.title}</div>
                    <div className="text-blue-100 text-sm">{feature.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-blue-100 text-sm mb-4">Powered by:</p>
            <div className="flex flex-wrap gap-3">
              {['React', 'Next.js', 'Node.js', 'MySQL', 'AI/LLM'].map((tech) => (
                <span key={tech} className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm font-medium border border-white/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LearnAID
            </h1>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { role: 'admin' as const, icon: '👑', label: 'Admin', color: 'blue' },
                  { role: 'faculty' as const, icon: '👨‍🏫', label: 'Faculty', color: 'purple' },
                  { role: 'student' as const, icon: '👨‍🎓', label: 'Student', color: 'green' }
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                      selectedRole === item.role
                        ? `bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white shadow-lg scale-105`
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-gray-900 placeholder-gray-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    Sign In
                    <span className="ml-2">→</span>
                  </span>
                )}
              </button>
            </form>

            {/* Development Credentials */}
            <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-center justify-center mb-3">
                <span className="text-xs font-bold text-amber-800 bg-amber-200 px-3 py-1 rounded-full">
                  🔧 Development Mode
                </span>
              </div>
              <p className="text-xs text-amber-700 text-center font-semibold mb-3">
                Quick Login Credentials (Remove in Production)
              </p>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">👑</span>
                      <span className="font-bold text-xs text-gray-700">Admin</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('admin')}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md font-semibold transition-colors"
                    >
                      Use
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-mono text-gray-600">📧 admin@learnaid.edu</p>
                    <p className="text-[10px] font-mono text-gray-600">🔒 admin123</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">👨‍🏫</span>
                      <span className="font-bold text-xs text-gray-700">Faculty</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('faculty')}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md font-semibold transition-colors"
                    >
                      Use
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-mono text-gray-600">📧 priya.sharma@learnaid.edu</p>
                    <p className="text-[10px] font-mono text-gray-600">🔒 faculty123</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">👨‍🎓</span>
                      <span className="font-bold text-xs text-gray-700">Student</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials('student')}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-semibold transition-colors"
                    >
                      Use
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-mono text-gray-600">📧 arjun.patel@student.learnaid.edu</p>
                    <p className="text-[10px] font-mono text-gray-600">🔒 student123</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <span className="mr-1">←</span> Back to Home
              </a>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>🔒</span>
            <span>Secure login with JWT authentication</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
