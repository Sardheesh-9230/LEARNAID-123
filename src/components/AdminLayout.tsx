'use client'

import React, { useState, useEffect } from 'react';
import { 
  FiHome, FiUsers, FiBook, FiUserCheck, FiSettings,
  FiBarChart2, FiGrid, FiMenu, FiX, FiLogOut, FiShield
} from 'react-icons/fi';
import Logo from './Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection, onSectionChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) setUserEmail(email);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'departments', label: 'Departments', icon: FiGrid },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'analytics', label: 'Pilot Analytics', icon: FiBarChart2 },
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
          {sidebarOpen ? (
            <div>
              <Logo size="md" showText={true} variant="light" />
              <p className="text-xs text-blue-200 mt-1 ml-12">Admin Portal</p>
            </div>
          ) : (
            <Logo size="sm" showText={false} variant="light" />
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
                <FiShield size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userEmail || 'Administrator'}</p>
                <p className="text-xs text-blue-200">System Admin</p>
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
                {activeSection === 'dashboard' ? 'Admin Dashboard' : activeSection.replace(/-/g, ' ')}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

export default AdminLayout;
