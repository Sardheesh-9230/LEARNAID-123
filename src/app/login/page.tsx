'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Admin credentials check
    if (formData.email === 'admin@learnaia.edu' && formData.password === 'admin123') {
      // Store admin session
      localStorage.setItem('userRole', 'admin')
      localStorage.setItem('userEmail', formData.email)
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin')
        setIsLoading(false)
      }, 1500)
    } else {
      alert('Invalid credentials. Use admin@learnaia.edu / admin123')
      setIsLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setFormData({
      email: 'admin@learnaia.edu',
      password: 'admin123'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">LEARNAIA</h1>
          <p className="text-gray-600">Admin Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter admin email"
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
                'Login as Admin'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-sm font-semibold text-red-700 mb-3">Demo Admin Credentials:</h3>
            <button
              onClick={fillAdminCredentials}
              className="w-full text-left p-2 bg-white hover:bg-red-50 rounded border border-red-300 text-sm"
            >
              <span className="font-medium text-red-700">Email:</span> admin@learnaia.edu<br/>
              <span className="font-medium text-red-700">Password:</span> admin123
            </button>
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
