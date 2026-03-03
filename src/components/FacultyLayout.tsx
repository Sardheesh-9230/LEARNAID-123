'use client'

import React, { useState, useEffect } from 'react';
import { 
  FiHome, FiBook, FiUsers, FiCheckSquare, 
  FiBarChart2, FiCalendar, FiMenu, FiX, FiLogOut, FiSettings, FiUser, FiMessageCircle
} from 'react-icons/fi';
import Logo from './Logo';

interface FacultyLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const FacultyLayout: React.FC<FacultyLayoutProps> = ({ children, activeSection, onSectionChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userDepartment, setUserDepartment] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const dept = localStorage.getItem('userDepartment');
    if (name) setUserName(name);
    if (email) setUserEmail(email);
    if (dept) setUserDepartment(dept);
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'subjects', label: 'My Subjects', icon: FiBook },
    { id: 'students', label: 'My Students', icon: FiUsers },
    { id: 'mcq', label: 'MCQ Generator', icon: FiCheckSquare },
    { id: 'tasks', label: 'Task Manager', icon: FiCheckSquare },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'discussions', label: 'Discussions', icon: FiMessageCircle },
    { id: 'schedule', label: 'Schedule', icon: FiCalendar },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl`}
      >
        {/* Logo & Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && (
            <Logo size="md" showText={true} variant="light" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <FiUser size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName || 'Faculty'}</p>
                <p className="text-xs text-blue-200 truncate">{userDepartment || 'Department'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-700 border-r-4 border-blue-400 shadow-lg'
                    : 'text-white hover:bg-blue-700 hover:bg-opacity-50'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-blue-700 p-4 space-y-2">
          {sidebarOpen ? (
            <>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-blue-700 rounded-lg transition-colors">
                <FiSettings size={18} />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                <FiLogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button className="w-full flex justify-center p-2 text-white hover:bg-blue-700 rounded-lg transition-colors">
                <FiSettings size={18} />
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full flex justify-center p-2 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                <FiLogOut size={18} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 capitalize">
                {activeSection === 'overview' ? 'Faculty Dashboard' : activeSection.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default FacultyLayout;
