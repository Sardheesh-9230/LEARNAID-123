'use client'

import React, { useEffect, useState } from 'react';
import { 
  FiBook, FiFileText, FiClipboard, FiUsers, 
  FiTrendingUp, FiCalendar, FiActivity, FiAward 
} from 'react-icons/fi';
import facultyAPI from '../services/facultyAPI';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
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

const DashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalCourses: 0,
    totalChapters: 0,
    totalExams: 0,
    totalStudents: 0,
    upcomingExams: [],
    recentActivities: [],
    weakStudents: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const facultyId = localStorage.getItem('userId');
      
      // Fetch courses
      const coursesData = facultyId 
        ? await facultyAPI.course.getByFaculty(facultyId)
        : await facultyAPI.course.getAll();
      
      // Fetch upcoming exams
      const upcomingExams = await facultyAPI.exam.getUpcoming();
      
      // Fetch tasks
      const tasks = facultyId 
        ? await facultyAPI.task.getByFaculty(facultyId)
        : [];

      setStats({
        totalCourses: Array.isArray(coursesData) ? coursesData.length : 0,
        totalChapters: 0, // Will be updated
        totalExams: Array.isArray(upcomingExams) ? upcomingExams.length : 0,
        totalStudents: 125, // Mock data
        upcomingExams: Array.isArray(upcomingExams) ? upcomingExams.slice(0, 5) : [],
        recentActivities: [],
        weakStudents: 12, // Mock data
        pendingTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'pending').length : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Faculty!</h2>
        <p className="text-indigo-100">Here's what's happening with your courses today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={FiBook}
          color="border-blue-500"
          trend="+2 this month"
        />
        <StatCard
          title="Upcoming Exams"
          value={stats.totalExams}
          icon={FiClipboard}
          color="border-green-500"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={FiUsers}
          color="border-purple-500"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={FiActivity}
          color="border-orange-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Exams */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <FiCalendar className="mr-2 text-indigo-600" />
              Upcoming Exams
            </h3>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {stats.upcomingExams.length > 0 ? (
              stats.upcomingExams.map((exam: any, index: number) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{exam.name || `Exam ${index + 1}`}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {exam.course?.name || 'Course Name'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-600">
                        {exam.date ? new Date(exam.date).toLocaleDateString() : 'TBD'}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        exam.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                        exam.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {exam.status || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiCalendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No upcoming exams scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiTrendingUp className="mr-2 text-green-600" />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Average Performance</span>
                  <span className="text-sm font-semibold text-gray-800">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Exam Completion</span>
                  <span className="text-sm font-semibold text-gray-800">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Task Completion</span>
                  <span className="text-sm font-semibold text-gray-800">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Students Needing Attention */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiAward className="mr-2 text-orange-600" />
              Needs Attention
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Weak Students</p>
                  <p className="text-xs text-gray-600">Below 50% average</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">{stats.weakStudents}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Pending Reviews</p>
                  <p className="text-xs text-gray-600">Assignments to grade</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">8</span>
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
          {[
            { action: 'Created new exam', subject: 'Data Structures', time: '2 hours ago', type: 'exam' },
            { action: 'Graded assignments', subject: 'Algorithms', time: '5 hours ago', type: 'grade' },
            { action: 'Updated chapter', subject: 'Database Systems', time: '1 day ago', type: 'chapter' },
            { action: 'Posted new task', subject: 'Data Structures', time: '2 days ago', type: 'task' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'exam' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'grade' ? 'bg-green-100 text-green-600' :
                  activity.type === 'chapter' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type === 'exam' ? <FiClipboard /> :
                   activity.type === 'grade' ? <FiAward /> :
                   activity.type === 'chapter' ? <FiFileText /> :
                   <FiActivity />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.subject}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
