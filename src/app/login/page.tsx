'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiService from '../../services/api'
import Logo from '@/components/Logo'

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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-blue-50 to-slate-100">
      {/* Left Side - Platform Info */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-r-[2.5rem] shadow-[8px_0_40px_0_rgba(0,0,0,0.35)]" style={{zIndex: 1}}>
        {/* Full-bleed background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Learn_AID_Video.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay: dark at bottom for text, subtle at top */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-transparent to-transparent" />

        {/* Content pinned to bottom */}
        <div className="relative z-10 flex flex-col justify-start w-full p-10 pt-10">
          <Logo size="xl" showText={true} variant="light" className="justify-start" />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center">
              <Logo size="lg" showText={true} variant="default" />
            </div>
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
                  { role: 'faculty' as const, icon: '👨‍🏫', label: 'Faculty', color: 'indigo' },
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
                className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-900 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
