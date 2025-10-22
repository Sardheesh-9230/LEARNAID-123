'use client'

import { useState } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import DashboardOverview from '../../components/DashboardOverview';
import CourseManagement from '../../components/CourseManagement';
import ChapterManagement from '../../components/ChapterManagement';
import CIAExamManagement from '../../components/CIAExamManagement';
import ExamQuestionManagement from '../../components/ExamQuestionManagement';
import MarksPerformanceAnalytics from '../../components/MarksPerformanceAnalytics';
import TaskAssignmentManagement from '../../components/TaskAssignmentManagement';

export default function FacultyDashboardPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'courses':
        return <CourseManagement />;
      case 'chapters':
        return <ChapterManagement />;
      case 'exams':
        return <CIAExamManagement />;
      case 'questions':
        return <ExamQuestionManagement />;
      case 'marks':
        return <MarksPerformanceAnalytics />;
      case 'tasks':
        return <TaskAssignmentManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <FacultyLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </FacultyLayout>
  );
}
