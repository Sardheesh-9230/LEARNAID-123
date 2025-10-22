'use client'

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminDashboardOverview from '@/components/AdminDashboardOverview';
import DepartmentManagement from '@/components/DepartmentManagement';
import UserManagement from '@/components/UserManagement';

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'departments':
        return <DepartmentManagement />;
      case 'users':
        return <UserManagement />;
      case 'subjects':
        return <div className="text-center text-gray-600 py-20">Subject Management - Coming Soon</div>;
      case 'faculty-assignment':
        return <div className="text-center text-gray-600 py-20">Faculty Assignment - Coming Soon</div>;
      case 'reports':
        return <div className="text-center text-gray-600 py-20">Reports & Analytics - Coming Soon</div>;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
}
