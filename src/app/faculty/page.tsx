'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FacultyLayout from '../../components/FacultyLayout';
import TeacherDashboard from '../../components/TeacherDashboard';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    // Check authentication
    console.log('Faculty page: Checking authentication...');
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    console.log('Faculty page: Token exists?', !!token);
    console.log('Faculty page: User data exists?', !!userData);
    
    if (!token || !userData) {
      console.log('Faculty page: No auth data, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Faculty page: Parsed user:', parsedUser);
      console.log('Faculty page: User role:', parsedUser.role);
      
      if (parsedUser.role !== 'Faculty') {
        console.log('Faculty page: User is not faculty, redirecting to login');
        router.push('/login');
        return;
      }
      console.log('Faculty page: Auth successful');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Faculty page: Error parsing user data:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <FacultyLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <TeacherDashboard activeTab={activeSection} onTabChange={setActiveSection} />
    </FacultyLayout>
  );
}
