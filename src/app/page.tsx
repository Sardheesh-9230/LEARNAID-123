'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ParticleText from '@/components/ParticleText'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: '👑',
      title: 'Admin-Centric Control',
      description: 'Complete institutional control with hierarchical management of departments, faculty, and students',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: '📝',
      title: 'CIA Exam Management',
      description: 'Create and manage CIA1, CIA2, CIA3, and Semester exams with chapter-wise performance tracking',
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: '🤖',
      title: 'AI Task Generation',
      description: 'Automatically generate personalized MCQ tasks for students based on chapter performance gaps',
      color: 'from-orange-600 to-red-600'
    },
    {
      icon: '💬',
      title: 'Smart Chatbot',
      description: 'RAG-powered chatbot for students to ask questions about uploaded course PDFs',
      color: 'from-green-600 to-teal-600'
    },
    {
      icon: '📊',
      title: 'Performance Analytics',
      description: 'Chapter-wise performance breakdown with automated weak area identification',
      color: 'from-indigo-600 to-purple-600'
    },
    {
      icon: '🎯',
      title: 'Targeted Learning',
      description: 'Daily/periodic task assignments based on individual student performance data',
      color: 'from-rose-600 to-pink-600'
    }
  ]

  const departments = [
    { name: 'Computer Science Engineering', code: 'CSE', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { name: 'Mechanical Engineering', code: 'MECH', icon: '⚙️', color: 'from-gray-500 to-slate-500' },
    { name: 'Electrical & Electronics', code: 'EEE', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
    { name: 'Electronics & Communication', code: 'ECE', icon: '📡', color: 'from-purple-500 to-pink-500' },
    { name: 'Civil Engineering', code: 'CIVIL', icon: '🏗️', color: 'from-green-500 to-emerald-500' },
    { name: 'Information Technology', code: 'IT', icon: '🖥️', color: 'from-indigo-500 to-blue-500' }
  ]

  const stats = [
    { label: 'Active Departments', value: '6', icon: '🏛️', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Faculty Members', value: '120+', icon: '👨‍🏫', gradient: 'from-purple-500 to-pink-500' },
    { label: 'Total Students', value: '2,500+', icon: '👨‍🎓', gradient: 'from-green-500 to-teal-500' },
    { label: 'Active Courses', value: '150+', icon: '📚', gradient: 'from-orange-500 to-red-500' }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 bg-fixed">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-slate-950/95 backdrop-blur-md shadow-lg shadow-blue-900/20' : 'bg-slate-950/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                LearnAID
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-blue-100 hover:text-cyan-400 transition-colors font-medium">Features</a>
              <a href="#departments" className="text-blue-100 hover:text-cyan-400 transition-colors font-medium">Departments</a>
              <a href="#about" className="text-blue-100 hover:text-cyan-400 transition-colors font-medium">About</a>
              <a href="#contact" className="text-blue-100 hover:text-cyan-400 transition-colors font-medium">Contact</a>
            </div>

            <Link href="/login">
              <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-0.5">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Particle Text Background */}
        <ParticleText 
          text="LEARNAID\nINTELLIGENT LEARNING"
          particleCount={1500}
          particleSize={1.2}
          textSize={12}
          interactionArea={180}
        />
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 backdrop-blur-md bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl">
              <div className="inline-block px-4 py-2 bg-blue-500/30 backdrop-blur-sm text-blue-100 rounded-full text-sm font-semibold border border-blue-300/30">
                🎓 Admin-Centric Educational Platform
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
                Intelligent Learning &
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                  Performance Support
                </span>
              </h1>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                Complete admin-centric platform for department management, CIA exam tracking, 
                AI-powered task generation, and personalized student learning support.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 backdrop-blur-sm border border-white/20">
                    Access Dashboard →
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-cyan-400">CIA</div>
                  <div className="text-sm text-blue-200 mt-1">Exam System</div>
                </div>
                <div className="text-center backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-blue-400">AI</div>
                  <div className="text-sm text-blue-200 mt-1">Task Generator</div>
                </div>
                <div className="text-center backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-indigo-400">RAG</div>
                  <div className="text-sm text-blue-200 mt-1">Chatbot</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">Dashboard Preview</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-48 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="text-white text-center">
                      <div className="text-5xl mb-3">📊</div>
                      <div className="text-lg font-semibold">Analytics Dashboard</div>
                      <div className="text-sm opacity-90 mt-1">Real-time Insights</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-20 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow">
                      <div className="text-center">
                        <div className="text-2xl mb-1">👥</div>
                        <div className="text-xs text-gray-700 font-medium">Students</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 h-20 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow">
                      <div className="text-center">
                        <div className="text-2xl mb-1">👨‍🏫</div>
                        <div className="text-xs text-gray-700 font-medium">Faculty</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 h-20 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📚</div>
                        <div className="text-xs text-gray-700 font-medium">Courses</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all transform hover:-translate-y-1">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-blue-200 mb-2">{stat.label}</div>
                  <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${stat.gradient} text-white text-xs font-semibold mt-2 shadow-lg`}>
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-cyan-400 rounded-full text-sm font-semibold mb-4 border border-cyan-500/30">
              ✨ Core Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Platform Features</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Admin-centric platform with AI-powered performance tracking and personalized learning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`backdrop-blur-md bg-white/5 border-2 rounded-2xl p-8 transition-all cursor-pointer group ${
                  activeFeature === index 
                    ? 'border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-105 bg-white/10' 
                    : 'border-white/10 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 hover:bg-white/10'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-blue-200 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-indigo-500/20 backdrop-blur-sm text-indigo-300 rounded-full text-sm font-semibold mb-4 border border-indigo-400/30">
              🏛️ Engineering Departments
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              Multi-Department <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Architecture</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Hierarchical department management with cross-department faculty assignments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dept.color} opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">{dept.icon}</div>
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${dept.color} text-white text-xs font-bold shadow-lg`}>
                      {dept.code}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{dept.name}</h3>
                  <p className="text-sm text-blue-300">Department Code: {dept.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6 backdrop-blur-md bg-white/5 p-8 rounded-3xl border border-white/10">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Why Choose LearnAID?
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Admin-centric platform combining hierarchical management with AI-powered 
                performance tracking for engineering colleges.
              </p>
              <ul className="space-y-4">
                {[
                  'Admin → Department → Faculty → Student hierarchy',
                  'CIA exam system with chapter-wise performance',
                  'AI-powered MCQ task generation from PDFs',
                  'RAG chatbot for personalized learning',
                  'Automated weak area identification & remediation'
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                    <span className="text-lg text-blue-50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center backdrop-blur-md bg-white/5 p-12 rounded-3xl border border-white/10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
            Ready to Enhance Learning Performance?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Empower your institution with AI-driven performance tracking and personalized learning
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login">
              <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1">
                Access Admin Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black/50 backdrop-blur-md border-t border-white/10 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">L</span>
                </div>
                <span className="text-2xl font-bold">LearnAID</span>
              </div>
              <p className="text-gray-400">Transforming education management with innovative solutions.</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; 2025 LearnAID. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
