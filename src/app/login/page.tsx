'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiService from '../../services/api'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Starting login process with:', formData.email) // Debug log
      
      // Authenticate with backend API
      const response = await apiService.login(formData.email, formData.password)
      
      console.log('Login response:', response) // Debug log
      
      if (response.success && response.token) {
        console.log('Login successful, storing user data...') // Debug log
        
        // Store user information
        if (typeof window !== 'undefined') {
          localStorage.setItem('userRole', response.user.role.toLowerCase())
          localStorage.setItem('userEmail', response.user.email)
          localStorage.setItem('userName', response.user.name)
          localStorage.setItem('userDepartment', response.user.department?.name || '')
          localStorage.setItem('userDepartmentId', response.user.department?.id || '')
        }
        
        // Redirect based on user role
        const role = response.user.role.toLowerCase()
        console.log('Redirecting user with role:', role) // Debug log
        
        // Use window.location instead of router.push for more reliable redirect
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
      } else {
        console.error('Login failed:', response) // Debug log
        setError(response.message || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Failed to connect to server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">LearnAID</h1>
          <p className="text-gray-600">Educational Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Credentials:</h3>
            
            {/* Admin */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-blue-700 text-sm">Admin Account</p>
                  <p className="text-xs text-blue-600">admin@learnaid.edu / admin123</p>
                </div>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Use
                </button>
              </div>
            </div>

            {/* Faculty */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-green-700 text-sm">Faculty Account</p>
                  <p className="text-xs text-green-600">priya.sharma@learnaid.edu / faculty123</p>
                </div>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('faculty')}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Use
                </button>
              </div>
            </div>

            {/* Student */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-purple-700 text-sm">Student Account</p>
                  <p className="text-xs text-purple-600">arjun.patel@student.learnaid.edu / student123</p>
                </div>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('student')}
                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  Use
                </button>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <a href="/" className="hover:text-red-600">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  )
}
