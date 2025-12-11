const QuestionWiseMarks = require('../models/QuestionWiseMarks');
const ImprovementTask = require('../models/ImprovementTask');
const Task = require('../models/Task');
const User = require('../models/User');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');

/**
 * Analyze CO performance by specific exam type for all students
 */
const analyzeCOPerformanceByExam = async (req, res) => {
  try {
    const { subjectId, examType, threshold = 50, academicYear = '2024-2025', semester = 'Odd' } = req.body;

    console.log(`📊 Analyzing ${examType} CO performance for subject: ${subjectId}`);

    // Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get all QuestionWiseMarks for this subject, exam type, and academic period
    const questionMarks = await QuestionWiseMarks.find({
      subject: subjectId,
      examType: examType,
      academicYear,
      semester
    }).populate('student', 'name rollNumber email');

    if (questionMarks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No marks data found for ${examType}. Please enter marks first.`
      });
    }

    console.log(`✅ Found ${questionMarks.length} question marks for ${examType}`);

    // Group by student and calculate CO performance
    const studentCOMap = {};

    questionMarks.forEach(qm => {
      const studentId = qm.student._id.toString();
      
      if (!studentCOMap[studentId]) {
        studentCOMap[studentId] = {
          student: qm.student,
          cos: {}
        };
      }

      const co = qm.courseOutcome;
      if (!studentCOMap[studentId].cos[co]) {
        studentCOMap[studentId].cos[co] = {
          totalMarks: 0,
          obtainedMarks: 0,
          questionCount: 0
        };
      }

      studentCOMap[studentId].cos[co].totalMarks += qm.maxMarks;
      studentCOMap[studentId].cos[co].obtainedMarks += qm.marksObtained;
      studentCOMap[studentId].cos[co].questionCount += 1;
    });

    // Calculate analysis for each student
    const studentsAnalysis = Object.values(studentCOMap).map((studentData) => {
      const coPerformance = Object.entries(studentData.cos).map(([co, data]) => ({
        courseOutcome: co,
        percentage: (data.obtainedMarks / data.totalMarks) * 100,
        totalMarks: data.totalMarks,
        obtainedMarks: data.obtainedMarks,
        questionCount: data.questionCount,
        isWeak: ((data.obtainedMarks / data.totalMarks) * 100) < threshold
      }));

      const totalObtained = Object.values(studentData.cos).reduce((sum, data) => sum + data.obtainedMarks, 0);
      const totalMax = Object.values(studentData.cos).reduce((sum, data) => sum + data.totalMarks, 0);
      const overallPercentage = (totalObtained / totalMax) * 100;

      const weakCOs = coPerformance
        .filter(co => co.isWeak)
        .map(co => co.courseOutcome);

      return {
        student: studentData.student,
        coPerformance,
        overallPercentage,
        weakCOs
      };
    });

    // Sort by overall percentage (weakest first)
    studentsAnalysis.sort((a, b) => a.overallPercentage - b.overallPercentage);

    const totalStudentsWithWeakCOs = studentsAnalysis.filter(s => s.weakCOs.length > 0).length;

    res.status(200).json({
      success: true,
      message: `Analysis complete for ${examType}`,
      data: {
        subjectId,
        subjectName: subject.name,
        examType,
        threshold,
        academicYear,
        semester,
        totalStudents: studentsAnalysis.length,
        totalStudentsWithWeakCOs,
        studentsAnalysis
      }
    });

  } catch (error) {
    console.error('❌ Error analyzing CO performance by exam:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing CO performance',
      error: error.message
    });
  }
};

/**
 * Bulk assign tasks to multiple students based on their weak COs
 */
const bulkAssignCOTasks = async (req, res) => {
  try {
    const { subjectId, examType, studentsData, threshold, academicYear = '2024-2025', semester = 'Odd' } = req.body;

    console.log(`📝 Bulk assigning tasks for ${studentsData.length} students`);

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const tasksCreated = [];
    const errors = [];

    for (const studentData of studentsData) {
      try {
        const { studentId, weakCOs, coPerformance } = studentData;

        const student = await User.findById(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Create task for each weak CO
        for (const weakCO of weakCOs) {
          // Check if task already exists
          const existingTask = await Task.findOne({
            subject: subjectId,
            courseOutcomes: weakCO,
            'assignedStudents.student': studentId,
            'assignedStudents.status': { $in: ['assigned', 'studying', 'in-progress'] }
          });

          if (existingTask) {
            console.log(`⚠️  Task already exists for ${student.name} - ${weakCO}`);
            continue;
          }

          // Get CO performance details
          const coDetail = coPerformance.find((co) => co.courseOutcome === weakCO);

          // Create improvement task
          const task = await Task.create({
            subject: subjectId,
            title: `${weakCO} Improvement - ${subject.name}`,
            description: `Based on ${examType} performance (${coDetail?.percentage.toFixed(1)}%), you need to improve your understanding of ${weakCO}. Complete this assessment to strengthen your knowledge.`,
            type: 'improvement',
            difficulty: coDetail?.percentage < 30 ? 'hard' : coDetail?.percentage < 40 ? 'medium' : 'easy',
            courseOutcomes: [weakCO],
            basedOnExam: examType,
            threshold,
            assignedStudents: [{
              student: studentId,
              assignedAt: new Date(),
              status: 'assigned'
            }],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            createdBy: req.user._id,
            academicYear,
            semester,
            metadata: {
              examType,
              coPerformance: coDetail,
              autoGenerated: true,
              generatedAt: new Date()
            }
          });

          tasksCreated.push({
            studentId,
            studentName: student.name,
            courseOutcome: weakCO,
            taskId: task._id
          });

          console.log(`✅ Created task for ${student.name} - ${weakCO}`);
        }

      } catch (error) {
        console.error(`❌ Error creating task for student ${studentData.studentId}:`, error);
        errors.push({ studentId: studentData.studentId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Tasks assigned successfully`,
      data: {
        tasksCreated: tasksCreated.length,
        tasks: tasksCreated,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk task assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning tasks',
      error: error.message
    });
  }
};

/**
 * Analyze CO-wise performance and auto-assign tasks for lagging COs only
 */
const analyzeLaggingCOsAndAssignTasks = async (req, res) => {
  try {
    const { studentId, subjectId, academicYear = '2024-2025', threshold = 50 } = req.body;

    // Validate student and subject
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get CO-wise performance analysis
    const coPerformance = await QuestionWiseMarks.getCOPerformance(studentId, subjectId, academicYear);
    
    if (!coPerformance || coPerformance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No question-wise marks found for CO analysis'
      });
    }

    // Identify COs with poor performance (below threshold)
    const poorPerformanceCOs = coPerformance.filter(co => co.percentage < threshold);
    
    // Analysis summary
    const analysisResult = {
      studentId,
      studentName: student.name,
      subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      academicYear,
      analysisDate: new Date(),
      threshold,
      coPerformance,
      totalCOs: coPerformance.length,
      attainedCOs: coPerformance.filter(co => co.percentage >= threshold).length,
      notAttainedCOs: poorPerformanceCOs.length,
      overallPerformance: {
        averagePercentage: Math.round(
          coPerformance.reduce((sum, co) => sum + co.percentage, 0) / coPerformance.length * 100
        ) / 100,
        attainmentRate: Math.round(
          (coPerformance.filter(co => co.percentage >= threshold).length / coPerformance.length) * 100 * 100
        ) / 100
      },
      poorPerformanceCOs: poorPerformanceCOs.map(co => ({
        courseOutcome: co.courseOutcome,
        percentage: co.percentage,
        gap: threshold - co.percentage,
        totalMarks: co.totalMarks,
        obtainedMarks: co.obtainedMarks,
        questionCount: co.questionCount
      })),
      tasksAssigned: []
    };

    // Auto-assign improvement tasks for poor performance COs
    if (poorPerformanceCOs.length > 0) {
      console.log(`📊 Found ${poorPerformanceCOs.length} COs with performance below ${threshold}%`);
      
      for (const co of poorPerformanceCOs) {
        try {
          // Check if similar learning task already exists for this student and CO
          const existingTask = await Task.findOne({
            subject: subjectId,
            courseOutcomes: co.courseOutcome,
            'assignedStudents.student': studentId,
            'assignedStudents.status': { $in: ['assigned', 'studying', 'in-progress'] }
          });

          if (existingTask) {
            console.log(`⚠️  Learning task already exists for ${co.courseOutcome}`);
            analysisResult.tasksAssigned.push({
              courseOutcome: co.courseOutcome,
              status: 'already_exists',
              taskId: existingTask._id,
              message: 'Similar learning task already exists'
            });
            continue;
          }

          // Enhanced MCQ generation for CO-focused tasks with realistic content
          const generateCOQuestions = (courseOutcome, difficulty, count, subjectName) => {
            const coTemplates = {
              CO1: {
                name: "Knowledge & Understanding",
                topics: ["Basic concepts", "Definitions", "Terminology", "Fundamental principles", "Theory"]
              },
              CO2: {
                name: "Application & Implementation", 
                topics: ["Code implementation", "Practical applications", "Problem solving", "Algorithm design", "Programming constructs"]
              },
              CO3: {
                name: "Analysis & Design",
                topics: ["System analysis", "Design patterns", "Complexity analysis", "Performance evaluation", "Critical thinking"]
              },
              CO4: {
                name: "Testing & Evaluation",
                topics: ["Testing strategies", "Debugging techniques", "Quality assurance", "Validation methods", "Error handling"]
              },
              CO5: {
                name: "Communication & Teamwork",
                topics: ["Documentation", "Team collaboration", "Presentation skills", "Project management", "Professional ethics"]
              }
            };
            
            const questionBank = {
              CO1: {
                Easy: [
                  {
                    questionText: "What is the basic definition of object-oriented programming?",
                    options: [
                      { text: "A programming paradigm based on objects containing data and code", isCorrect: true },
                      { text: "A type of database management system", isCorrect: false },
                      { text: "A web development framework", isCorrect: false },
                      { text: "A testing methodology", isCorrect: false }
                    ]
                  },
                  {
                    questionText: "Which of the following is a fundamental concept in programming?",
                    options: [
                      { text: "Variables and data types", isCorrect: true },
                      { text: "Only loops", isCorrect: false },
                      { text: "Only functions", isCorrect: false },
                      { text: "Only comments", isCorrect: false }
                    ]
                  }
                ],
                Medium: [
                  {
                    questionText: "What is the difference between compilation and interpretation?",
                    options: [
                      { text: "Compilation translates entire code before execution, interpretation translates during execution", isCorrect: true },
                      { text: "They are exactly the same process", isCorrect: false },
                      { text: "Compilation is slower than interpretation", isCorrect: false },
                      { text: "Interpretation produces machine code files", isCorrect: false }
                    ]
                  }
                ],
                Hard: [
                  {
                    questionText: "Explain the theoretical foundation of computational complexity theory.",
                    options: [
                      { text: "Mathematical analysis of algorithm efficiency and resource usage bounds", isCorrect: true },
                      { text: "Simple code counting methodology", isCorrect: false },
                      { text: "Hardware performance measurement", isCorrect: false },
                      { text: "User interface design principles", isCorrect: false }
                    ]
                  }
                ]
              },
              CO2: {
                Easy: [
                  {
                    questionText: "How do you declare a variable in most programming languages?",
                    options: [
                      { text: "Specify data type and variable name", isCorrect: true },
                      { text: "Only write the variable name", isCorrect: false },
                      { text: "Use only numbers", isCorrect: false },
                      { text: "Variables are automatically created", isCorrect: false }
                    ]
                  }
                ],
                Medium: [
                  {
                    questionText: "What is the best approach to implement error handling in a program?",
                    options: [
                      { text: "Use try-catch blocks and proper exception handling", isCorrect: true },
                      { text: "Ignore all errors", isCorrect: false },
                      { text: "Use only print statements", isCorrect: false },
                      { text: "Handle errors after program completion", isCorrect: false }
                    ]
                  }
                ],
                Hard: [
                  {
                    questionText: "How would you optimize a complex algorithm for large datasets?",
                    options: [
                      { text: "Analyze complexity, use efficient data structures, implement parallel processing", isCorrect: true },
                      { text: "Add more loops to the code", isCorrect: false },
                      { text: "Use only simple variables", isCorrect: false },
                      { text: "Avoid using any built-in functions", isCorrect: false }
                    ]
                  }
                ]
              }
            };
            
            const questions = [];
            const template = coTemplates[courseOutcome];
            const questionPool = questionBank[courseOutcome]?.[difficulty] || [];
            
            // Generate questions with proper CO context
            for (let i = 0; i < count; i++) {
              let question;
              
              if (questionPool.length > 0 && i < questionPool.length) {
                // Use predefined questions from the bank
                question = { ...questionPool[i % questionPool.length] };
              } else {
                // Generate dynamic questions
                const topic = template.topics[i % template.topics.length];
                question = {
                  questionText: `${courseOutcome} - ${template.name}: Apply your knowledge of ${topic} in ${subjectName}. What is the most appropriate approach?`,
                  options: [
                    { text: `Implement best practices for ${topic} with proper documentation`, isCorrect: true },
                    { text: `Use random implementation without planning`, isCorrect: false },
                    { text: `Skip ${topic} implementation entirely`, isCorrect: false },
                    { text: `Copy implementation without understanding`, isCorrect: false }
                  ]
                };
              }
              
              questions.push({
                ...question,
                courseOutcome: courseOutcome,
                difficulty: difficulty,
                marks: 1,
                coName: template.name,
                generatedAt: new Date()
              });
            }
            return questions;
          };
          
          // Generate MCQ questions for this specific CO
          const studyDuration = calculateStudyTimeForCO(co.percentage, threshold);
          const taskDuration = Math.min(45, Math.max(20, Math.floor(studyDuration * 0.3))); // 30% of study time, max 45 min
          const questionCount = Math.max(10, Math.floor(co.questionCount * 1.5));
          const difficulty = co.percentage < 30 ? 'Hard' : co.percentage < 40 ? 'Medium' : 'Easy';
          
          const generatedQuestions = generateCOQuestions(co.courseOutcome, difficulty, questionCount, subject.name);
          
          // Create CO-based task for lagging CO
          const laggingCOTask = new Task({
            title: `Lagging ${co.courseOutcome} Improvement - ${subject.name}`,
            description: `📈 Your ${co.courseOutcome} performance is below the target threshold. Current: ${co.percentage.toFixed(1)}%, Target: ${threshold}%. Complete this focused task to improve your understanding and achieve the target performance in ${co.courseOutcome}.`,
            subject: subjectId,
            courseOutcomes: [co.courseOutcome],
            questions: generatedQuestions,
            assignedStudents: [{
              student: studentId,
              status: 'assigned'
            }],
            studyMaterials: [
              {
                title: `${co.courseOutcome} Study Guide`,
                type: 'text',
                content: `Study Guide for ${co.courseOutcome}

Current Performance: ${co.percentage.toFixed(1)}%
Target Performance: ${threshold}%
Performance Gap: ${(threshold - co.percentage).toFixed(1)}%

Key Topics to Focus:
- Review all concepts related to ${co.courseOutcome}
- Practice problem-solving techniques
- Understand theoretical foundations
- Apply concepts to practical scenarios

Study Recommendations:
1. Spend ${studyDuration} minutes reviewing materials
2. Complete all practice questions
3. Focus on areas where you scored below ${threshold}%
4. Seek help if needed for difficult concepts`
              },
              {
                title: `${co.courseOutcome} Practice Resources`,
                type: 'link',
                url: '#practice-materials',
                content: `Additional practice materials and resources for ${co.courseOutcome}`
              }
            ],
            taskSchedule: {
              studyDuration: studyDuration,
              taskDuration: taskDuration,
              startTime: new Date(),
              endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              studyStartTime: new Date()
            },
            settings: {
              allowChatbot: true,
              passingScore: threshold,
              randomizeQuestions: true,
              showResourcesDuringTask: false
            },
            createdBy: req.user?.id || null,
            coPerformanceData: [{
              courseOutcome: co.courseOutcome,
              currentPerformance: co.percentage,
              targetPerformance: threshold,
              performanceGap: threshold - co.percentage
            }],
            metadata: {
              assignmentType: 'co_performance_based',
              assignmentReason: `${co.courseOutcome} performance is lagging - ${co.percentage.toFixed(1)}% (Target: ${threshold}%)`,
              targetCourseOutcomes: [co.courseOutcome],
              classAssignment: false,
              coAnalysisData: {
                totalMarks: co.totalMarks,
                obtainedMarks: co.obtainedMarks,
                questionCount: co.questionCount,
                examTypes: co.examTypes,
                isLaggingCO: true
              }
            }
          });

          await laggingCOTask.save();

          // Populate the response
          const populatedTask = await Task.findById(laggingCOTask._id)
            .populate('subject', 'name code credits')
            .populate('assignedStudents.student', 'name email rollNumber')
            .populate('createdBy', 'name email');

          analysisResult.tasksAssigned.push({
            courseOutcome: co.courseOutcome,
            status: 'assigned',
            taskId: populatedTask._id,
            taskType: 'lagging_co_improvement',
            currentPerformance: co.percentage,
            targetPerformance: threshold,
            performanceGap: threshold - co.percentage,
            dueDate: populatedTask.taskSchedule.endTime,
            studyTime: populatedTask.taskSchedule.studyDuration,
            taskTime: populatedTask.taskSchedule.taskDuration,
            questionCount: populatedTask.questions.length,
            message: `Lagging CO task assigned for ${co.courseOutcome} improvement (Gap: ${(threshold - co.percentage).toFixed(1)}%)`
          });

          console.log(`✅ Assigned lagging CO task for ${co.courseOutcome} (Performance gap: ${(threshold - co.percentage).toFixed(1)}%)`);

        } catch (taskError) {
          console.error(`❌ Error assigning task for CO ${co.courseOutcome}:`, taskError);
          analysisResult.tasksAssigned.push({
            courseOutcome: co.courseOutcome,
            status: 'error',
            message: `Failed to assign task: ${taskError.message}`
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `CO performance analysis completed. ${analysisResult.tasksAssigned.filter(t => t.status === 'assigned').length} improvement tasks assigned.`,
      data: analysisResult
    });

  } catch (error) {
    console.error('Error in CO performance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze CO performance',
      error: error.message
    });
  }
};

/**
 * Get CO-wise performance analysis for a student
 */
const getStudentCOPerformance = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { academicYear = '2024-2025' } = req.query;

    // Verify access
    if (req.user.id !== studentId && !['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const coPerformance = await QuestionWiseMarks.getCOPerformance(studentId, subjectId, academicYear);
    
    const student = await User.findById(studentId, 'name rollNumber email');
    const subject = await Subject.findById(subjectId, 'name code credits');

    res.status(200).json({
      success: true,
      data: {
        student,
        subject,
        academicYear,
        coPerformance,
        summary: {
          totalCOs: coPerformance.length,
          attainedCOs: coPerformance.filter(co => co.attainment === 'Attained').length,
          averagePerformance: coPerformance.length > 0 
            ? Math.round(coPerformance.reduce((sum, co) => sum + co.percentage, 0) / coPerformance.length * 100) / 100
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting CO performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get CO performance',
      error: error.message
    });
  }
};

/**
 * Get subject-wise CO analysis for faculty/admin
 */
const getSubjectCOAnalysis = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academicYear = '2024-2025' } = req.query;

    const coAnalysis = await QuestionWiseMarks.getSubjectCOAnalysis(subjectId, academicYear);
    const subject = await Subject.findById(subjectId, 'name code credits');

    res.status(200).json({
      success: true,
      data: {
        subject,
        academicYear,
        coAnalysis,
        summary: {
          totalCOs: coAnalysis.length,
          averageAttainment: coAnalysis.length > 0
            ? Math.round(coAnalysis.reduce((sum, co) => sum + co.averageAttainment, 0) / coAnalysis.length * 100) / 100
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting subject CO analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subject CO analysis',
      error: error.message
    });
  }
};

/**
 * Calculate study time based on performance gap
 */
function calculateStudyTimeForCO(currentPerformance, targetPerformance) {
  const gap = targetPerformance - currentPerformance;
  
  // Base study time: 60 minutes
  let studyTime = 60;
  
  // Additional time based on performance gap
  if (gap > 40) studyTime = 180; // 3 hours for very poor performance
  else if (gap > 30) studyTime = 150; // 2.5 hours
  else if (gap > 20) studyTime = 120; // 2 hours
  else if (gap > 10) studyTime = 90;  // 1.5 hours
  
  return studyTime;
}

module.exports = {
  analyzeLaggingCOsAndAssignTasks,
  getStudentCOPerformance,
  getSubjectCOAnalysis,
  analyzeCOPerformanceByExam,
  bulkAssignCOTasks
};