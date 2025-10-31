import React from 'react';
import CIAExamManagement from './CIAExamManagement';
import ExamQuestionManagement from './ExamQuestionManagement';
import MarksPerformanceAnalytics from './MarksPerformanceAnalytics';
import TaskAssignmentManagement from './TaskAssignmentManagement';

const FacultyDashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Faculty Dashboard</h1>
      <p className="text-gray-600 mb-6">Note: Subject and Chapter management is available in the main Faculty interface (TeacherDashboard)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CIAExamManagement />
        <ExamQuestionManagement />
        <MarksPerformanceAnalytics />
        <TaskAssignmentManagement />
      </div>
    </div>
  );
};

export default FacultyDashboard;
