import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ScatterChart, Scatter
} from 'recharts';

interface COPerformanceData {
  courseOutcome: string;
  averagePercentage: number;
  totalStudents: number;
  studentsAboveThreshold: number;
  studentsBelowThreshold: number;
  passRate: number;
}

interface LowPerformer {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
  };
  subject: {
    name: string;
    code: string;
  };
  courseOutcome: string;
  percentage: number;
  obtainedMarks: number;
  maxMarks: number;
  examType: string;
}

interface SubjectStats {
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  totalStudents: number;
  coBreakdown: Array<{
    courseOutcome: string;
    averagePercentage: number;
    studentCount: number;
    passRate: number;
  }>;
}

interface COAnalyticsProps {
  facultyId: string;
  selectedSubject?: string;
  selectedExamType?: string;
}

const COPerformanceAnalytics: React.FC<COAnalyticsProps> = ({ 
  facultyId, 
  selectedSubject, 
  selectedExamType 
}) => {
  const [coData, setCOData] = useState<COPerformanceData[]>([]);
  const [lowPerformers, setLowPerformers] = useState<LowPerformer[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(60);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    fetchCOAnalytics();
  }, [facultyId, selectedSubject, selectedExamType, threshold]);

  const fetchCOAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      let url = `http://localhost:5000/api/co-analytics/co-performance/${facultyId}?threshold=${threshold}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedExamType) url += `&examType=${selectedExamType}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setCOData(result.data.coPerformance);
        setLowPerformers(result.data.lowPerformers);
        setSubjectStats(result.data.subjectStats);
      } else {
        setError(result.message || 'Failed to fetch CO analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching CO analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 70) return '#F59E0B'; // Yellow
    if (percentage >= 60) return '#EF4444'; // Red
    return '#DC2626'; // Dark Red
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading CO Performance Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">Error: {error}</div>
        <button 
          onClick={fetchCOAnalytics}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">CO Performance Analytics</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Threshold:</label>
              <select 
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1"
              >
                <option value={50}>50%</option>
                <option value={60}>60%</option>
                <option value={70}>70%</option>
              </select>
            </div>
            
            <div className="flex bg-gray-100 rounded-lg">
              {['overview', 'subjects', 'students'].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`px-4 py-2 capitalize rounded ${
                    activeView === view 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CO Performance Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">CO Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coData as any}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courseOutcome" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}%`, 
                    name === 'averagePercentage' ? 'Average %' : name
                  ]}
                />
                <Bar 
                  dataKey="averagePercentage" 
                  fill="#3B82F6"
                  name="Average Performance"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pass Rate Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Pass Rate Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={coData as any}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="passRate"
                  label={({ courseOutcome, passRate }: any) => `${courseOutcome}: ${passRate}%`}
                >
                  {coData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value}%`, 'Pass Rate']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* CO Performance Stats Table */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Detailed CO Statistics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Course Outcome</th>
                    <th className="px-4 py-2 text-center">Avg Performance</th>
                    <th className="px-4 py-2 text-center">Total Students</th>
                    <th className="px-4 py-2 text-center">Above Threshold</th>
                    <th className="px-4 py-2 text-center">Below Threshold</th>
                    <th className="px-4 py-2 text-center">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {coData.map((co, index) => (
                    <tr key={co.courseOutcome} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 font-medium">{co.courseOutcome}</td>
                      <td className="px-4 py-2 text-center">
                        <span 
                          className={`inline-block w-16 px-2 py-1 rounded text-white text-sm ${
                            co.averagePercentage >= 70 ? 'bg-green-500' :
                            co.averagePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        >
                          {co.averagePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">{co.totalStudents}</td>
                      <td className="px-4 py-2 text-center text-green-600">{co.studentsAboveThreshold}</td>
                      <td className="px-4 py-2 text-center text-red-600">{co.studentsBelowThreshold}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={co.passRate >= 70 ? 'text-green-600' : 'text-red-600'}>
                          {co.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab - Low Performers */}
      {activeView === 'students' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Students Below {threshold}% Threshold ({lowPerformers.length} students)
          </h3>
          
          {lowPerformers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              🎉 Great! No students are performing below the {threshold}% threshold.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Roll Number</th>
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">Course Outcome</th>
                    <th className="px-4 py-2 text-center">Exam Type</th>
                    <th className="px-4 py-2 text-center">Performance</th>
                    <th className="px-4 py-2 text-center">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPerformers.map((performer, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2">
                        {performer.student.firstName} {performer.student.lastName}
                      </td>
                      <td className="px-4 py-2">{performer.student.rollNumber}</td>
                      <td className="px-4 py-2">
                        {performer.subject.name} ({performer.subject.code})
                      </td>
                      <td className="px-4 py-2 font-medium">{performer.courseOutcome}</td>
                      <td className="px-4 py-2 text-center">{performer.examType}</td>
                      <td className="px-4 py-2 text-center">
                        <span 
                          className="inline-block px-2 py-1 rounded text-white text-sm"
                          style={{ backgroundColor: getPerformanceColor(performer.percentage) }}
                        >
                          {performer.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {performer.obtainedMarks}/{performer.maxMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subjects Tab */}
      {activeView === 'subjects' && (
        <div className="space-y-6">
          {subjectStats.map((subjectStat) => (
            <div key={subjectStat.subject._id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                {subjectStat.subject.name} ({subjectStat.subject.code})
                <span className="ml-2 text-sm text-gray-500">
                  {subjectStat.totalStudents} students
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject CO Performance Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={subjectStat.coBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="courseOutcome" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Performance']} />
                      <Bar dataKey="averagePercentage" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Subject CO Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">CO</th>
                        <th className="px-3 py-2 text-center">Performance</th>
                        <th className="px-3 py-2 text-center">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStat.coBreakdown.map((co, index) => (
                        <tr key={co.courseOutcome} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-2 font-medium">{co.courseOutcome}</td>
                          <td className="px-3 py-2 text-center">
                            <span 
                              className={`inline-block px-2 py-1 rounded text-white text-xs ${
                                co.averagePercentage >= 70 ? 'bg-green-500' :
                                co.averagePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            >
                              {co.averagePercentage}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={co.passRate >= 70 ? 'text-green-600' : 'text-red-600'}>
                              {co.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default COPerformanceAnalytics;