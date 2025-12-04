const { MongoClient } = require('mongodb');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
require('dotenv').config({ path: '../backend/.env' });

class LearnAIDAnalytics {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI;
        this.client = new MongoClient(this.mongoUri);
        this.db = null;
        
        // Ensure output directory exists
        fs.ensureDirSync('./pilot_study_data');
        
        console.log('🎓 LearnAID Analytics Initialized');
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db('learnaid');
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    async extractUserEngagementData() {
        console.log('\n📈 Extracting User Engagement Data...');
        
        try {
            // Get all active users
            const users = await this.db.collection('users').find({ 
                status: 'active' 
            }).toArray();

            // Get activity logs
            const activityLogs = await this.db.collection('activitylogs').find({}).sort({ createdAt: 1 }).toArray();

            const engagementData = [];

            for (const user of users) {
                const userActivities = activityLogs.filter(log => 
                    log.user && log.user.toString() === user._id.toString()
                );

                // Calculate metrics
                const totalActivities = userActivities.length;
                const loginCount = userActivities.filter(log => log.action === 'LOGIN').length;
                
                // Time-based metrics
                let activeDays = 0;
                let firstActivity = user.createdAt;
                let lastActivity = user.lastLogin;

                if (userActivities.length > 0) {
                    const activityDates = userActivities
                        .filter(log => log.createdAt)
                        .map(log => log.createdAt);
                    
                    if (activityDates.length > 0) {
                        firstActivity = new Date(Math.min(...activityDates.map(d => d.getTime())));
                        lastActivity = new Date(Math.max(...activityDates.map(d => d.getTime())));
                        activeDays = Math.max(1, Math.ceil((lastActivity - firstActivity) / (1000 * 60 * 60 * 24)));
                    }
                }

                engagementData.push({
                    user_id: user._id.toString(),
                    name: user.name || 'Unknown',
                    email: user.email || '',
                    role: user.role || 'student',
                    department: user.department || '',
                    semester: user.semester || '',
                    registration_date: user.createdAt,
                    last_login: user.lastLogin,
                    total_activities: totalActivities,
                    login_count: loginCount,
                    active_days: activeDays,
                    avg_activities_per_day: totalActivities / Math.max(activeDays, 1),
                    first_activity: firstActivity,
                    last_activity: lastActivity
                });
            }

            // Save to CSV
            const csvWriter = createCsvWriter({
                path: './pilot_study_data/user_engagement_metrics.csv',
                header: [
                    { id: 'user_id', title: 'User ID' },
                    { id: 'name', title: 'Name' },
                    { id: 'email', title: 'Email' },
                    { id: 'role', title: 'Role' },
                    { id: 'department', title: 'Department' },
                    { id: 'semester', title: 'Semester' },
                    { id: 'registration_date', title: 'Registration Date' },
                    { id: 'last_login', title: 'Last Login' },
                    { id: 'total_activities', title: 'Total Activities' },
                    { id: 'login_count', title: 'Login Count' },
                    { id: 'active_days', title: 'Active Days' },
                    { id: 'avg_activities_per_day', title: 'Avg Activities Per Day' },
                    { id: 'first_activity', title: 'First Activity' },
                    { id: 'last_activity', title: 'Last Activity' }
                ]
            });

            await csvWriter.writeRecords(engagementData);
            console.log(`✅ Extracted engagement data for ${users.length} users`);
            
            return engagementData;
        } catch (error) {
            console.error('❌ Error extracting engagement data:', error);
            throw error;
        }
    }

    async extractQuizPerformanceData() {
        console.log('\n🧪 Extracting Quiz Performance Data...');
        
        try {
            // Get MCQ sessions (quiz attempts)
            const mcqSessions = await this.db.collection('mcqsessions').find({}).toArray();
            
            // Get exam marks
            const examMarks = await this.db.collection('studentmarkentries').find({}).toArray();
            
            // Get question-wise marks
            const questionMarks = await this.db.collection('questionwisemarks').find({}).toArray();

            // Process quiz data
            const quizData = mcqSessions.map(session => ({
                session_id: session._id.toString(),
                created_by: session.createdBy?.toString() || '',
                subject_id: session.subject?.toString() || '',
                chapter_id: session.chapter?.toString() || '',
                material_id: session.material?.toString() || '',
                questions_count: session.questions ? session.questions.length : 0,
                session_type: session.sessionType || 'practice',
                created_at: session.createdAt,
                difficulty_level: session.difficultyLevel || 'medium'
            }));

            // Process performance data
            const performanceData = examMarks.map(mark => ({
                student_id: mark.student?.toString() || '',
                subject_id: mark.subject?.toString() || '',
                exam_type: mark.examType || '',
                marks_obtained: mark.marksObtained || 0,
                total_marks: mark.totalMarks || 0,
                percentage: mark.percentage || 0,
                academic_year: mark.academicYear || '',
                exam_date: mark.createdAt
            }));

            // Save to CSV
            const quizCsvWriter = createCsvWriter({
                path: './pilot_study_data/quiz_attempts_data.csv',
                header: [
                    { id: 'session_id', title: 'Session ID' },
                    { id: 'created_by', title: 'Created By' },
                    { id: 'subject_id', title: 'Subject ID' },
                    { id: 'chapter_id', title: 'Chapter ID' },
                    { id: 'material_id', title: 'Material ID' },
                    { id: 'questions_count', title: 'Questions Count' },
                    { id: 'session_type', title: 'Session Type' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'difficulty_level', title: 'Difficulty Level' }
                ]
            });

            const performanceCsvWriter = createCsvWriter({
                path: './pilot_study_data/exam_performance_data.csv',
                header: [
                    { id: 'student_id', title: 'Student ID' },
                    { id: 'subject_id', title: 'Subject ID' },
                    { id: 'exam_type', title: 'Exam Type' },
                    { id: 'marks_obtained', title: 'Marks Obtained' },
                    { id: 'total_marks', title: 'Total Marks' },
                    { id: 'percentage', title: 'Percentage' },
                    { id: 'academic_year', title: 'Academic Year' },
                    { id: 'exam_date', title: 'Exam Date' }
                ]
            });

            await quizCsvWriter.writeRecords(quizData);
            await performanceCsvWriter.writeRecords(performanceData);

            console.log(`✅ Extracted ${mcqSessions.length} quiz sessions and ${examMarks.length} exam records`);
            
            return { quizData, performanceData };
        } catch (error) {
            console.error('❌ Error extracting quiz performance data:', error);
            throw error;
        }
    }

    async extractResourceUsageData() {
        console.log('\n📚 Extracting Resource Usage Data...');
        
        try {
            // Get materials
            const materials = await this.db.collection('materials').find({}).toArray();
            
            // Get files
            const files = await this.db.collection('files').find({}).toArray();
            
            // Get chapters
            const chapters = await this.db.collection('chapters').find({}).toArray();

            // Process materials data
            const materialsData = materials.map(material => ({
                material_id: material._id.toString(),
                title: material.title || '',
                type: material.type || '',
                subject_id: material.subject?.toString() || '',
                chapter_id: material.chapter?.toString() || '',
                uploaded_by: material.uploadedBy?.toString() || '',
                created_at: material.createdAt,
                status: material.status || 'active',
                download_count: material.downloadCount || 0,
                view_count: material.viewCount || 0,
                file_size: material.fileSize || 0
            }));

            // Process files data
            const filesData = files.map(file => ({
                file_id: file._id.toString(),
                filename: file.filename || '',
                original_name: file.originalName || '',
                mime_type: file.mimeType || '',
                size: file.size || 0,
                uploaded_by: file.uploadedBy?.toString() || '',
                created_at: file.createdAt,
                download_count: file.downloadCount || 0
            }));

            // Save to CSV
            const materialsCsvWriter = createCsvWriter({
                path: './pilot_study_data/materials_usage_data.csv',
                header: [
                    { id: 'material_id', title: 'Material ID' },
                    { id: 'title', title: 'Title' },
                    { id: 'type', title: 'Type' },
                    { id: 'subject_id', title: 'Subject ID' },
                    { id: 'chapter_id', title: 'Chapter ID' },
                    { id: 'uploaded_by', title: 'Uploaded By' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'status', title: 'Status' },
                    { id: 'download_count', title: 'Download Count' },
                    { id: 'view_count', title: 'View Count' },
                    { id: 'file_size', title: 'File Size' }
                ]
            });

            const filesCsvWriter = createCsvWriter({
                path: './pilot_study_data/files_usage_data.csv',
                header: [
                    { id: 'file_id', title: 'File ID' },
                    { id: 'filename', title: 'Filename' },
                    { id: 'original_name', title: 'Original Name' },
                    { id: 'mime_type', title: 'MIME Type' },
                    { id: 'size', title: 'Size' },
                    { id: 'uploaded_by', title: 'Uploaded By' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'download_count', title: 'Download Count' }
                ]
            });

            await materialsCsvWriter.writeRecords(materialsData);
            await filesCsvWriter.writeRecords(filesData);

            console.log(`✅ Extracted ${materials.length} materials and ${files.length} files`);
            
            return { materialsData, filesData };
        } catch (error) {
            console.error('❌ Error extracting resource usage data:', error);
            throw error;
        }
    }

    async extractImprovementTasksData() {
        console.log('\n🎯 Extracting Improvement Tasks Data...');
        
        try {
            // Get improvement tasks
            const tasks = await this.db.collection('improvementtasks').find({}).toArray();
            
            // Get task assignments
            const taskAssignments = await this.db.collection('taskassignments').find({}).toArray();

            // Process tasks data
            const tasksData = tasks.map(task => {
                const createdDate = task.createdAt;
                const completedDate = task.completedDate;
                const dueDate = task.dueDate;
                
                let completionTime = null;
                let isOverdue = false;
                
                if (completedDate && createdDate) {
                    completionTime = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24));
                }
                
                if (dueDate && !completedDate) {
                    isOverdue = new Date() > dueDate;
                }

                return {
                    task_id: task._id.toString(),
                    title: task.title || '',
                    task_type: task.taskType || '',
                    student_id: task.student?.toString() || '',
                    subject_id: task.subject?.toString() || '',
                    assigned_by: task.assignedBy?.toString() || '',
                    priority: task.priority || 'MEDIUM',
                    status: task.status || 'Assigned',
                    co_target: task.coTarget || '',
                    created_at: createdDate,
                    due_date: dueDate,
                    completed_date: completedDate,
                    completion_time_days: completionTime,
                    is_overdue: isOverdue
                };
            });

            // Save to CSV
            const tasksCsvWriter = createCsvWriter({
                path: './pilot_study_data/improvement_tasks_data.csv',
                header: [
                    { id: 'task_id', title: 'Task ID' },
                    { id: 'title', title: 'Title' },
                    { id: 'task_type', title: 'Task Type' },
                    { id: 'student_id', title: 'Student ID' },
                    { id: 'subject_id', title: 'Subject ID' },
                    { id: 'assigned_by', title: 'Assigned By' },
                    { id: 'priority', title: 'Priority' },
                    { id: 'status', title: 'Status' },
                    { id: 'co_target', title: 'CO Target' },
                    { id: 'created_at', title: 'Created At' },
                    { id: 'due_date', title: 'Due Date' },
                    { id: 'completed_date', title: 'Completed Date' },
                    { id: 'completion_time_days', title: 'Completion Time (Days)' },
                    { id: 'is_overdue', title: 'Is Overdue' }
                ]
            });

            await tasksCsvWriter.writeRecords(tasksData);
            
            console.log(`✅ Extracted ${tasks.length} improvement tasks`);
            
            return tasksData;
        } catch (error) {
            console.error('❌ Error extracting improvement tasks data:', error);
            throw error;
        }
    }

    async generateSummaryStatistics() {
        console.log('\n📊 Generating Summary Statistics...');
        
        try {
            // Get collection counts
            const [
                totalUsers,
                totalStudents,
                totalFaculty,
                totalAdmins,
                totalSubjects,
                totalChapters,
                totalMaterials,
                totalMcqSessions,
                totalExamRecords,
                totalImprovementTasks,
                totalActivityLogs
            ] = await Promise.all([
                this.db.collection('users').countDocuments({ status: 'active' }),
                this.db.collection('users').countDocuments({ role: 'student', status: 'active' }),
                this.db.collection('users').countDocuments({ role: 'faculty', status: 'active' }),
                this.db.collection('users').countDocuments({ role: 'admin', status: 'active' }),
                this.db.collection('subjects').countDocuments({ status: 'active' }),
                this.db.collection('chapters').countDocuments({ status: 'active' }),
                this.db.collection('materials').countDocuments({ status: 'active' }),
                this.db.collection('mcqsessions').countDocuments({}),
                this.db.collection('studentmarkentries').countDocuments({}),
                this.db.collection('improvementtasks').countDocuments({}),
                this.db.collection('activitylogs').countDocuments({})
            ]);

            // Get date ranges
            const firstUser = await this.db.collection('users').findOne({}, { sort: { createdAt: 1 } });
            const lastActivity = await this.db.collection('activitylogs').findOne({}, { sort: { createdAt: -1 } });

            const stats = {
                total_users: totalUsers,
                total_students: totalStudents,
                total_faculty: totalFaculty,
                total_admins: totalAdmins,
                total_subjects: totalSubjects,
                total_chapters: totalChapters,
                total_materials: totalMaterials,
                total_mcq_sessions: totalMcqSessions,
                total_exam_records: totalExamRecords,
                total_improvement_tasks: totalImprovementTasks,
                total_activity_logs: totalActivityLogs,
                pilot_start_date: firstUser?.createdAt,
                last_activity_date: lastActivity?.createdAt,
                avg_materials_per_subject: totalMaterials / Math.max(totalSubjects, 1),
                avg_tasks_per_student: totalImprovementTasks / Math.max(totalStudents, 1),
                extraction_date: new Date()
            };

            // Save summary
            await fs.writeJSON('./pilot_study_data/summary_statistics.json', stats, { spaces: 2 });
            
            console.log('✅ Summary statistics generated');
            return stats;
        } catch (error) {
            console.error('❌ Error generating summary statistics:', error);
            throw error;
        }
    }

    async runFullExtraction() {
        console.log('🚀 Starting LearnAID Pilot Study Data Extraction...');
        
        try {
            await this.connect();
            
            // Extract all data types
            const engagementData = await this.extractUserEngagementData();
            const { quizData, performanceData } = await this.extractQuizPerformanceData();
            const { materialsData, filesData } = await this.extractResourceUsageData();
            const tasksData = await this.extractImprovementTasksData();
            const summaryStats = await this.generateSummaryStatistics();
            
            // Create extraction report
            const report = `LearnAID Pilot Study Data Extraction Report
${'='.repeat(50)}

Extraction Date: ${new Date().toISOString()}

Data Files Generated:
- user_engagement_metrics.csv
- quiz_attempts_data.csv
- exam_performance_data.csv
- materials_usage_data.csv
- files_usage_data.csv
- improvement_tasks_data.csv
- summary_statistics.json

Summary Statistics:
${Object.entries(summaryStats)
    .filter(([key]) => !key.includes('date'))
    .map(([key, value]) => `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`)
    .join('\n')}

Usage Metrics:
- Average materials per subject: ${summaryStats.avg_materials_per_subject.toFixed(2)}
- Average tasks per student: ${summaryStats.avg_tasks_per_student.toFixed(2)}
`;

            await fs.writeFile('./pilot_study_data/extraction_report.txt', report);
            
            console.log('\n🎉 Data extraction completed successfully!');
            console.log('📁 Files saved in: pilot_study_data/');
            
            return {
                engagementData,
                quizData,
                performanceData,
                materialsData,
                filesData,
                tasksData,
                summaryStats
            };
            
        } catch (error) {
            console.error('❌ Error during extraction:', error);
            throw error;
        } finally {
            await this.client.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run extraction if called directly
if (require.main === module) {
    const analytics = new LearnAIDAnalytics();
    analytics.runFullExtraction()
        .then(() => {
            console.log('✅ Extraction process completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Extraction failed:', error);
            process.exit(1);
        });
}

module.exports = LearnAIDAnalytics;