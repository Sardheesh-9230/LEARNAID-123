'use client'

import React, { useEffect, useState } from 'react';
import { 
  FiUsers, FiGrid, FiBook, FiUserCheck, 
  FiTrendingUp, FiActivity, FiAward, FiAlertCircle
} from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, subtitle }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        {trend && (
          <p className="text-sm text-green-600 mt-1 flex items-center">
            <FiTrendingUp className="mr-1" size={14} />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-full ${color.replace('border', 'bg')} bg-opacity-10`}>
        <Icon size={28} className={color.replace('border', 'text')} />
      </div>
    </div>
  </div>
);

const AdminDashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    activeSubjects: 0,
    recentActivities: [] as any[],
    departmentStats: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalStudents: 1250,
        totalFaculty: 85,
        totalDepartments: 12,
        activeSubjects: 156,
        recentActivities: [
          { action: 'New student enrolled', details: 'Computer Science Department', time: '5 minutes ago', type: 'user' },
          { action: 'Faculty assigned', details: 'Data Structures - Prof. Smith', time: '1 hour ago', type: 'assignment' },
          { action: 'Department created', details: 'Artificial Intelligence', time: '2 hours ago', type: 'department' },
          { action: 'Subject updated', details: 'Advanced Algorithms', time: '3 hours ago', type: 'subject' },
        ],
        departmentStats: [
          { name: 'Computer Science', students: 450, faculty: 25, subjects: 45 },
          { name: 'Electrical Engineering', students: 380, faculty: 20, subjects: 38 },
          { name: 'Mechanical Engineering', students: 320, faculty: 18, subjects: 32 },
          { name: 'Civil Engineering', students: 100, faculty: 12, subjects: 25 },
        ]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard!</h2>
        <p className="text-red-100">Manage your institution with complete control and insights.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={FiUsers}
          color="border-blue-500"
          trend="+12% this month"
        />
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={FiUserCheck}
          color="border-purple-500"
          subtitle="Active members"
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={FiGrid}
          color="border-green-500"
        />
        <StatCard
          title="Active Subjects"
          value={stats.activeSubjects}
          icon={FiBook}
          color="border-orange-500"
          trend="+8 new subjects"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FiGrid className="mr-2 text-red-600" />
              Department Overview
            </h3>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Students</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Faculty</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Subjects</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.departmentStats.map((dept, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">{dept.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {dept.students}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {dept.faculty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {dept.subjects}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiActivity className="mr-2 text-green-600" />
              System Health
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Server Status</span>
                  <span className="text-sm font-semibold text-green-600">Excellent</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Database Health</span>
                  <span className="text-sm font-semibold text-green-600">Good</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm font-semibold text-yellow-600">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiAlertCircle className="mr-2 text-orange-600" />
              Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div>
                  <p className="font-medium text-gray-800">Pending Approvals</p>
                  <p className="text-xs text-gray-600">15 faculty applications</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">15</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <p className="font-medium text-gray-800">New Registrations</p>
                  <p className="text-xs text-gray-600">Student enrollments</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">28</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FiActivity className="mr-2 text-purple-600" />
          Recent Activities
        </h3>
        <div className="space-y-4">
          {stats.recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'assignment' ? 'bg-purple-100 text-purple-600' :
                  activity.type === 'department' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type === 'user' ? <FiUsers /> :
                   activity.type === 'assignment' ? <FiUserCheck /> :
                   activity.type === 'department' ? <FiGrid /> :
                   <FiBook />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <FiUsers className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-lg mb-2 text-gray-800">Add New Student</h4>
          <p className="text-gray-600 text-sm">Register a new student to the system</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
            <FiUserCheck className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-lg mb-2 text-gray-800">Add Faculty</h4>
          <p className="text-gray-600 text-sm">Onboard new faculty members</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
            <FiGrid className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-lg mb-2 text-gray-800">Create Department</h4>
          <p className="text-gray-600 text-sm">Set up a new department</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
