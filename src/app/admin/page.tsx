'use client'

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';

// Lazy load heavy dashboard components
const AdminDashboardOverview = dynamic(() => import('@/components/AdminDashboardOverview'), {
  loading: () => <div className="p-8 text-center">Loading dashboard...</div>,
});
const HierarchicalDepartmentManagement = dynamic(() => import('@/components/HierarchicalDepartmentManagement'), {
  loading: () => <div className="p-8 text-center">Loading departments...</div>,
});
const UserManagement = dynamic(() => import('@/components/UserManagement'), {
  loading: () => <div className="p-8 text-center">Loading users...</div>,
});
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard'), {
  loading: () => <div className="p-8 text-center">Loading analytics...</div>,
});

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'departments':
        return <HierarchicalDepartmentManagement />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <AnalyticsDashboard userRole="admin" />;
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
