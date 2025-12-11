'use client'

import dynamic from 'next/dynamic';

// Lazy load StudentDashboard
const StudentDashboard = dynamic(() => import('@/components/StudentDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function StudentPage() {
  return <StudentDashboard />
}