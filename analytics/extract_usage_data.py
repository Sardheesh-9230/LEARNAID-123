#!/usr/bin/env python3
"""
LearnAID Pilot Study Data Extraction Script
Extracts usage logs, quiz attempts, resource views, and performance metrics
for research analysis and pilot study evaluation.
"""

import pymongo
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../backend/.env')

class LearnAIDAnalytics:
    def __init__(self):
        # MongoDB connection
        self.mongo_uri = os.getenv('MONGODB_URI')
        if not self.mongo_uri:
            raise ValueError("MONGODB_URI not found in environment variables")
        
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client['learnaid']
        
        # Create output directory
        os.makedirs('pilot_study_data', exist_ok=True)
        
        print("🎓 LearnAID Pilot Study Analytics Initialized")
        print(f"📊 Connected to database: {self.db.name}")

    def extract_user_engagement_data(self):
        """Extract user engagement and activity data"""
        print("\n📈 Extracting User Engagement Data...")
        
        # Get all users with their roles
        users = list(self.db.users.find({
            'status': 'active'
        }, {
            'name': 1, 'email': 1, 'role': 1, 'createdAt': 1,
            'lastLogin': 1, 'department': 1, 'semester': 1
        }))
        
        # Get activity logs
        activity_logs = list(self.db.activitylogs.find({}, {
            'user': 1, 'action': 1, 'resourceType': 1, 'createdAt': 1, 'details': 1
        }).sort('createdAt', 1))
        
        # Process engagement metrics
        engagement_data = []
        for user in users:
            user_id = user['_id']
            user_activities = [log for log in activity_logs if log.get('user') == user_id]
            
            # Calculate engagement metrics
            total_activities = len(user_activities)
            login_count = len([log for log in user_activities if log.get('action') == 'LOGIN'])
            
            # Time-based metrics
            if user_activities:
                first_activity = min([log['createdAt'] for log in user_activities if 'createdAt' in log])
                last_activity = max([log['createdAt'] for log in user_activities if 'createdAt' in log])
                active_days = (last_activity - first_activity).days + 1 if first_activity != last_activity else 1
            else:
                active_days = 0
                first_activity = user.get('createdAt')
                last_activity = user.get('lastLogin')
            
            engagement_data.append({
                'user_id': str(user_id),
                'name': user.get('name', 'Unknown'),
                'email': user.get('email', ''),
                'role': user.get('role', 'student'),
                'department': user.get('department', ''),
                'semester': user.get('semester', ''),
                'registration_date': user.get('createdAt'),
                'last_login': user.get('lastLogin'),
                'total_activities': total_activities,
                'login_count': login_count,
                'active_days': active_days,
                'avg_activities_per_day': total_activities / max(active_days, 1),
                'first_activity': first_activity,
                'last_activity': last_activity
            })
        
        # Save to CSV
        df_engagement = pd.DataFrame(engagement_data)
        df_engagement.to_csv('pilot_study_data/user_engagement_metrics.csv', index=False)
        
        print(f"✅ Extracted engagement data for {len(users)} users")
        return df_engagement

    def extract_quiz_performance_data(self):
        """Extract MCQ/Quiz performance and attempt data"""
        print("\n🧪 Extracting Quiz Performance Data...")
        
        # Get MCQ sessions (quiz attempts)
        mcq_sessions = list(self.db.mcqsessions.find({}, {
            'createdBy': 1, 'subject': 1, 'chapter': 1, 'material': 1,
            'questions': 1, 'createdAt': 1, 'sessionType': 1
        }))
        
        # Get exam marks (CIA1, CIA2, MODEL)
        exam_marks = list(self.db.studentmarkentries.find({}, {
            'student': 1, 'subject': 1, 'examType': 1, 'marksObtained': 1,
            'totalMarks': 1, 'percentage': 1, 'createdAt': 1, 'academicYear': 1
        }))
        
        # Get question-wise marks for detailed analysis
        question_marks = list(self.db.questionwisemarks.find({}, {
            'student': 1, 'subject': 1, 'examType': 1, 'questionNumber': 1,
            'marksObtained': 1, 'totalMarks': 1, 'createdAt': 1
        }))
        
        # Process quiz data
        quiz_data = []
        for session in mcq_sessions:
            questions_count = len(session.get('questions', []))
            
            quiz_data.append({
                'session_id': str(session['_id']),
                'created_by': str(session.get('createdBy', '')),
                'subject_id': str(session.get('subject', '')),
                'chapter_id': str(session.get('chapter', '')),
                'material_id': str(session.get('material', '')),
                'questions_count': questions_count,
                'session_type': session.get('sessionType', 'practice'),
                'created_at': session.get('createdAt'),
                'difficulty_level': session.get('difficultyLevel', 'medium')
            })
        
        # Process exam performance data
        performance_data = []
        for mark in exam_marks:
            performance_data.append({
                'student_id': str(mark.get('student', '')),
                'subject_id': str(mark.get('subject', '')),
                'exam_type': mark.get('examType', ''),
                'marks_obtained': mark.get('marksObtained', 0),
                'total_marks': mark.get('totalMarks', 0),
                'percentage': mark.get('percentage', 0),
                'academic_year': mark.get('academicYear', ''),
                'exam_date': mark.get('createdAt')
            })
        
        # Save to CSV
        df_quiz = pd.DataFrame(quiz_data)
        df_performance = pd.DataFrame(performance_data)
        
        df_quiz.to_csv('pilot_study_data/quiz_attempts_data.csv', index=False)
        df_performance.to_csv('pilot_study_data/exam_performance_data.csv', index=False)
        
        print(f"✅ Extracted {len(mcq_sessions)} quiz sessions and {len(exam_marks)} exam records")
        return df_quiz, df_performance

    def extract_resource_usage_data(self):
        """Extract study materials and resource usage data"""
        print("\n📚 Extracting Resource Usage Data...")
        
        # Get materials (study resources)
        materials = list(self.db.materials.find({}, {
            'title': 1, 'type': 1, 'subject': 1, 'chapter': 1,
            'uploadedBy': 1, 'createdAt': 1, 'status': 1,
            'downloadCount': 1, 'viewCount': 1, 'fileSize': 1
        }))
        
        # Get files (PDF uploads, documents)
        files = list(self.db.files.find({}, {
            'filename': 1, 'originalName': 1, 'mimeType': 1, 'size': 1,
            'uploadedBy': 1, 'createdAt': 1, 'downloadCount': 1
        }))
        
        # Get chapters (course structure)
        chapters = list(self.db.chapters.find({}, {
            'name': 1, 'subject': 1, 'order': 1, 'createdBy': 1, 'createdAt': 1
        }))
        
        # Process materials data
        materials_data = []
        for material in materials:
            materials_data.append({
                'material_id': str(material['_id']),
                'title': material.get('title', ''),
                'type': material.get('type', ''),
                'subject_id': str(material.get('subject', '')),
                'chapter_id': str(material.get('chapter', '')),
                'uploaded_by': str(material.get('uploadedBy', '')),
                'created_at': material.get('createdAt'),
                'status': material.get('status', 'active'),
                'download_count': material.get('downloadCount', 0),
                'view_count': material.get('viewCount', 0),
                'file_size': material.get('fileSize', 0)
            })
        
        # Process files data
        files_data = []
        for file in files:
            files_data.append({
                'file_id': str(file['_id']),
                'filename': file.get('filename', ''),
                'original_name': file.get('originalName', ''),
                'mime_type': file.get('mimeType', ''),
                'size': file.get('size', 0),
                'uploaded_by': str(file.get('uploadedBy', '')),
                'created_at': file.get('createdAt'),
                'download_count': file.get('downloadCount', 0)
            })
        
        # Save to CSV
        df_materials = pd.DataFrame(materials_data)
        df_files = pd.DataFrame(files_data)
        
        df_materials.to_csv('pilot_study_data/materials_usage_data.csv', index=False)
        df_files.to_csv('pilot_study_data/files_usage_data.csv', index=False)
        
        print(f"✅ Extracted {len(materials)} materials and {len(files)} files")
        return df_materials, df_files

    def extract_improvement_tasks_data(self):
        """Extract improvement task assignment and completion data"""
        print("\n🎯 Extracting Improvement Tasks Data...")
        
        # Get improvement tasks
        tasks = list(self.db.improvementtasks.find({}, {
            'title': 1, 'description': 1, 'taskType': 1, 'student': 1,
            'subject': 1, 'assignedBy': 1, 'priority': 1, 'status': 1,
            'dueDate': 1, 'completedDate': 1, 'createdAt': 1, 'coTarget': 1
        }))
        
        # Get task assignments
        task_assignments = list(self.db.taskassignments.find({}, {
            'student': 1, 'task': 1, 'assignedBy': 1, 'assignedAt': 1,
            'status': 1, 'completedAt': 1, 'feedback': 1
        }))
        
        # Process tasks data
        tasks_data = []
        for task in tasks:
            # Calculate completion metrics
            created_date = task.get('createdAt')
            completed_date = task.get('completedDate')
            due_date = task.get('dueDate')
            
            completion_time = None
            is_overdue = False
            
            if completed_date and created_date:
                completion_time = (completed_date - created_date).days
            
            if due_date and not completed_date:
                is_overdue = datetime.now() > due_date
            
            tasks_data.append({
                'task_id': str(task['_id']),
                'title': task.get('title', ''),
                'task_type': task.get('taskType', ''),
                'student_id': str(task.get('student', '')),
                'subject_id': str(task.get('subject', '')),
                'assigned_by': str(task.get('assignedBy', '')),
                'priority': task.get('priority', 'MEDIUM'),
                'status': task.get('status', 'Assigned'),
                'co_target': task.get('coTarget', ''),
                'created_at': created_date,
                'due_date': due_date,
                'completed_date': completed_date,
                'completion_time_days': completion_time,
                'is_overdue': is_overdue
            })
        
        # Save to CSV
        df_tasks = pd.DataFrame(tasks_data)
        df_tasks.to_csv('pilot_study_data/improvement_tasks_data.csv', index=False)
        
        print(f"✅ Extracted {len(tasks)} improvement tasks")
        return df_tasks

    def generate_summary_statistics(self):
        """Generate summary statistics for pilot study"""
        print("\n📊 Generating Summary Statistics...")
        
        # Get basic counts
        stats = {
            'total_users': self.db.users.count_documents({'status': 'active'}),
            'total_students': self.db.users.count_documents({'role': 'student', 'status': 'active'}),
            'total_faculty': self.db.users.count_documents({'role': 'faculty', 'status': 'active'}),
            'total_admins': self.db.users.count_documents({'role': 'admin', 'status': 'active'}),
            'total_subjects': self.db.subjects.count_documents({'status': 'active'}),
            'total_chapters': self.db.chapters.count_documents({'status': 'active'}),
            'total_materials': self.db.materials.count_documents({'status': 'active'}),
            'total_mcq_sessions': self.db.mcqsessions.count_documents({}),
            'total_exam_records': self.db.studentmarkentries.count_documents({}),
            'total_improvement_tasks': self.db.improvementtasks.count_documents({}),
            'total_activity_logs': self.db.activitylogs.count_documents({})
        }
        
        # Calculate date ranges
        first_user = self.db.users.find_one({}, sort=[('createdAt', 1)])
        last_activity = self.db.activitylogs.find_one({}, sort=[('createdAt', -1)])
        
        if first_user:
            stats['pilot_start_date'] = first_user.get('createdAt')
        if last_activity:
            stats['last_activity_date'] = last_activity.get('createdAt')
        
        # Usage metrics
        stats['avg_materials_per_subject'] = stats['total_materials'] / max(stats['total_subjects'], 1)
        stats['avg_tasks_per_student'] = stats['total_improvement_tasks'] / max(stats['total_students'], 1)
        
        # Save summary
        with open('pilot_study_data/summary_statistics.json', 'w') as f:
            json.dump(stats, f, indent=2, default=str)
        
        print("✅ Summary statistics generated")
        return stats

    def run_full_extraction(self):
        """Run complete data extraction process"""
        print("🚀 Starting LearnAID Pilot Study Data Extraction...")
        
        try:
            # Extract all data types
            engagement_df = self.extract_user_engagement_data()
            quiz_df, performance_df = self.extract_quiz_performance_data()
            materials_df, files_df = self.extract_resource_usage_data()
            tasks_df = self.extract_improvement_tasks_data()
            summary_stats = self.generate_summary_statistics()
            
            # Create combined dataset
            print("\n🔄 Creating Combined Dataset...")
            
            # Save summary report
            with open('pilot_study_data/extraction_report.txt', 'w') as f:
                f.write("LearnAID Pilot Study Data Extraction Report\n")
                f.write("=" * 50 + "\n\n")
                f.write(f"Extraction Date: {datetime.now()}\n\n")
                f.write("Data Files Generated:\n")
                f.write("- user_engagement_metrics.csv\n")
                f.write("- quiz_attempts_data.csv\n")
                f.write("- exam_performance_data.csv\n")
                f.write("- materials_usage_data.csv\n")
                f.write("- files_usage_data.csv\n")
                f.write("- improvement_tasks_data.csv\n")
                f.write("- summary_statistics.json\n\n")
                
                f.write("Summary Statistics:\n")
                for key, value in summary_stats.items():
                    f.write(f"- {key.replace('_', ' ').title()}: {value}\n")
            
            print("\n🎉 Data extraction completed successfully!")
            print("📁 Files saved in: pilot_study_data/")
            
        except Exception as e:
            print(f"❌ Error during extraction: {str(e)}")
            raise

if __name__ == "__main__":
    analytics = LearnAIDAnalytics()
    analytics.run_full_extraction()