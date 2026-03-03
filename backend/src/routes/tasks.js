const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect: auth } = require('../middleware/auth');

// CO-based MCQ Generator
const generateMCQQuestions = (courseOutcomes, difficulty = 'Medium', count = 10) => {
  const questionTemplates = {
    CO1: {
      Easy: [
        {
          questionText: "What is the primary purpose of data structures in programming?",
          options: [
            { text: "To organize and store data efficiently", isCorrect: true },
            { text: "To display information on screen", isCorrect: false },
            { text: "To manage user interfaces", isCorrect: false },
            { text: "To handle network communications", isCorrect: false }
          ]
        },
        {
          questionText: "Which of the following best defines an algorithm?",
          options: [
            { text: "A programming language", isCorrect: false },
            { text: "A step-by-step procedure to solve a problem", isCorrect: true },
            { text: "A software development tool", isCorrect: false },
            { text: "A computer hardware component", isCorrect: false }
          ]
        }
      ],
      Medium: [
        {
          questionText: "How does recursion work in programming?",
          options: [
            { text: "By calling the same function repeatedly", isCorrect: false },
            { text: "A function calling itself with modified parameters", isCorrect: true },
            { text: "Using loops for repetition", isCorrect: false },
            { text: "Through parallel processing", isCorrect: false }
          ]
        },
        {
          questionText: "What are the key characteristics of object-oriented programming?",
          options: [
            { text: "Encapsulation, Inheritance, Polymorphism", isCorrect: true },
            { text: "Variables, Functions, Arrays", isCorrect: false },
            { text: "Input, Processing, Output", isCorrect: false },
            { text: "Read, Write, Execute", isCorrect: false }
          ]
        }
      ],
      Hard: [
        {
          questionText: "Analyze the time complexity of merge sort algorithm?",
          options: [
            { text: "O(n²)", isCorrect: false },
            { text: "O(n log n)", isCorrect: true },
            { text: "O(n)", isCorrect: false },
            { text: "O(log n)", isCorrect: false }
          ]
        }
      ]
    },
    CO2: {
      Easy: [
        {
          questionText: "Which IDE is commonly used for Java development?",
          options: [
            { text: "Eclipse or IntelliJ IDEA", isCorrect: true },
            { text: "MS Paint", isCorrect: false },
            { text: "Web browser", isCorrect: false },
            { text: "Calculator", isCorrect: false }
          ]
        }
      ],
      Medium: [
        {
          questionText: "What is the correct approach to handle exceptions in Java?",
          options: [
            { text: "Using try-catch blocks", isCorrect: true },
            { text: "Ignoring all errors", isCorrect: false },
            { text: "Using goto statements", isCorrect: false },
            { text: "Random error handling", isCorrect: false }
          ]
        }
      ],
      Hard: [
        {
          questionText: "Evaluate the performance of HashMap vs TreeMap in Java?",
          options: [
            { text: "HashMap: O(1) average, TreeMap: O(log n)", isCorrect: true },
            { text: "Both have O(n) complexity", isCorrect: false },
            { text: "TreeMap is always faster", isCorrect: false },
            { text: "Performance is identical", isCorrect: false }
          ]
        }
      ]
    },
    CO3: {
      Easy: [
        {
          questionText: "What is the output of: System.out.println(5 + 3);?",
          options: [
            { text: "8", isCorrect: true },
            { text: "53", isCorrect: false },
            { text: "Error", isCorrect: false },
            { text: "5 + 3", isCorrect: false }
          ]
        }
      ],
      Medium: [
        {
          questionText: "How would you optimize a recursive function to avoid stack overflow?",
          options: [
            { text: "Use iterative approach or memoization", isCorrect: true },
            { text: "Add more parameters", isCorrect: false },
            { text: "Use global variables", isCorrect: false },
            { text: "Increase recursion depth", isCorrect: false }
          ]
        }
      ],
      Hard: [
        {
          questionText: "Design an efficient solution for the 0/1 Knapsack problem?",
          options: [
            { text: "Dynamic programming with 2D table", isCorrect: true },
            { text: "Greedy algorithm", isCorrect: false },
            { text: "Brute force approach", isCorrect: false },
            { text: "Linear search", isCorrect: false }
          ]
        }
      ]
    },
    CO4: {
      Easy: [
        {
          questionText: "Which testing method is most appropriate for individual functions?",
          options: [
            { text: "Unit testing", isCorrect: true },
            { text: "No testing needed", isCorrect: false },
            { text: "Manual checking only", isCorrect: false },
            { text: "User acceptance testing", isCorrect: false }
          ]
        }
      ],
      Medium: [
        {
          questionText: "What debugging technique would you use for logical errors?",
          options: [
            { text: "Step-through debugging with breakpoints", isCorrect: true },
            { text: "Random code changes", isCorrect: false },
            { text: "Deleting and rewriting code", isCorrect: false },
            { text: "Ignoring the error", isCorrect: false }
          ]
        }
      ],
      Hard: [
        {
          questionText: "How would you validate a complex sorting algorithm?",
          options: [
            { text: "Property-based testing and formal verification", isCorrect: true },
            { text: "Visual code inspection only", isCorrect: false },
            { text: "Single test case", isCorrect: false },
            { text: "User feedback only", isCorrect: false }
          ]
        }
      ]
    },
    CO5: {
      Easy: [
        {
          questionText: "What is a key principle of Agile methodology?",
          options: [
            { text: "Iterative development and continuous feedback", isCorrect: true },
            { text: "Fixed requirements throughout", isCorrect: false },
            { text: "Individual work only", isCorrect: false },
            { text: "Documentation over communication", isCorrect: false }
          ]
        }
      ],
      Medium: [
        {
          questionText: "How would you present a technical solution to non-technical stakeholders?",
          options: [
            { text: "Use clear documentation, diagrams, and live demos", isCorrect: true },
            { text: "Show only code snippets", isCorrect: false },
            { text: "Use technical jargon extensively", isCorrect: false },
            { text: "Provide verbal explanation only", isCorrect: false }
          ]
        }
      ],
      Hard: [
        {
          questionText: "Justify the selection of microservices architecture for a large-scale project?",
          options: [
            { text: "Better scalability, maintainability, and team autonomy", isCorrect: true },
            { text: "It's the latest trend", isCorrect: false },
            { text: "Personal preference of developers", isCorrect: false },
            { text: "Easier to implement than monolith", isCorrect: false }
          ]
        }
      ]
    }
  };

  const questions = [];
  const questionsPerCO = Math.ceil(count / courseOutcomes.length);
  
  courseOutcomes.forEach(co => {
    const coQuestions = questionTemplates[co]?.[difficulty] || questionTemplates[co]?.['Medium'] || [];
    
    for (let i = 0; i < questionsPerCO && questions.length < count; i++) {
      if (coQuestions[i % coQuestions.length]) {
        questions.push({
          ...coQuestions[i % coQuestions.length],
          courseOutcome: co,
          difficulty: difficulty,
          marks: difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1
        });
      }
    }
  });

  return questions.slice(0, count);
};

// Create new task with MCQ generation
router.post('/create', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      subjectId,
      courseOutcomes,
      studyMaterials,
      taskSchedule,
      settings,
      assignedStudentIds,
      questionCount = 10,
      difficulty = 'Medium'
    } = req.body;

    // Verify faculty permission
    if (!['Faculty', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only faculty can create tasks' });
    }

    // Check for existing learning tasks for assigned students
    const conflictingStudents = [];
    
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      for (const studentId of assignedStudentIds) {
        const existingTask = await Task.findOne({
          subject: subjectId,
          'assignedStudents.student': studentId,
          'assignedStudents.status': { $in: ['assigned', 'studying', 'in-progress'] }
        });
        
        if (existingTask) {
          const student = await User.findById(studentId).select('name rollNumber');
          conflictingStudents.push({
            studentId,
            studentName: student?.name || 'Unknown',
            rollNumber: student?.rollNumber || 'N/A',
            existingTaskId: existingTask._id,
            existingTaskTitle: existingTask.title
          });
        }
      }
      
      if (conflictingStudents.length > 0) {
        return res.status(409).json({
          message: 'Some students already have active learning tasks for this subject',
          conflictingStudents,
          suggestion: 'Please remove these students from the assignment or wait for them to complete their current tasks'
        });
      }
    }

    // Generate MCQ questions based on COs
    const generatedQuestions = generateMCQQuestions(courseOutcomes, difficulty, questionCount);

    // Create task
    const task = new Task({
      title,
      description,
      subject: subjectId,
      courseOutcomes,
      questions: generatedQuestions,
      studyMaterials: studyMaterials || [],
      taskSchedule: {
        ...taskSchedule,
        studyStartTime: new Date(new Date(taskSchedule.startTime).getTime() - (taskSchedule.studyDuration * 60000))
      },
      settings: settings || {},
      createdBy: req.user._id
    });

    // Assign to students
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      task.assignedStudents = assignedStudentIds.map(studentId => ({
        student: studentId,
        status: 'assigned'
      }));
    }

    await task.save();
    await task.populate('subject assignedStudents.student createdBy');

    res.status(201).json({
      message: 'Task created successfully',
      task,
      generatedQuestions: generatedQuestions.length
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's assigned tasks
router.get('/student/tasks', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    const tasks = await Task.find({
      'assignedStudents.student': studentId
    })
    .populate('subject createdBy')
    .sort({ 'taskSchedule.startTime': 1 });

    const currentTime = new Date();
    
    const tasksWithStatus = tasks.map(task => {
      const studentTask = task.assignedStudents.find(
        as => as.student._id.toString() === studentId
      );
      
      let currentStatus = 'upcoming';
      
      if (task.isOverdue()) {
        currentStatus = studentTask.status === 'completed' ? 'completed' : 'overdue';
      } else if (task.isTaskTime()) {
        currentStatus = 'active-task';
      } else if (task.isStudyTime()) {
        currentStatus = 'study-time';
      }
      
      return {
        ...task.toObject(),
        studentStatus: studentTask.status,
        currentStatus,
        isStudyTime: task.isStudyTime(),
        isTaskTime: task.isTaskTime(),
        isOverdue: task.isOverdue(),
        timeUntilStudy: task.taskSchedule.studyStartTime > currentTime ? 
          Math.max(0, task.taskSchedule.studyStartTime - currentTime) : 0,
        timeUntilTask: task.taskSchedule.startTime > currentTime ? 
          Math.max(0, task.taskSchedule.startTime - currentTime) : 0
      };
    });

    res.json({
      tasks: tasksWithStatus,
      currentTime
    });
  } catch (error) {
    console.error('Error fetching student tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start study session
router.post('/study/start/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    const studentId = req.user.userId;
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (!task.isStudyTime()) {
      return res.status(400).json({ message: 'Study time has not started yet' });
    }
    
    // Update student status
    const studentTaskIndex = task.assignedStudents.findIndex(
      as => as.student.toString() === studentId
    );
    
    if (studentTaskIndex === -1) {
      return res.status(403).json({ message: 'Task not assigned to you' });
    }
    
    task.assignedStudents[studentTaskIndex].status = 'studying';
    task.assignedStudents[studentTaskIndex].studyStartTime = new Date();
    
    await task.save();
    
    res.json({
      message: 'Study session started',
      studyMaterials: task.studyMaterials,
      studyDuration: task.taskSchedule.studyDuration,
      allowChatbot: task.settings.allowChatbot
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start task (MCQ exam)
router.post('/task/start/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    const studentId = req.user.userId;
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (!task.isTaskTime()) {
      return res.status(400).json({ message: 'Task time has not started yet or has ended' });
    }
    
    // Update student status
    const studentTaskIndex = task.assignedStudents.findIndex(
      as => as.student.toString() === studentId
    );
    
    if (studentTaskIndex === -1) {
      return res.status(403).json({ message: 'Task not assigned to you' });
    }
    
    if (task.assignedStudents[studentTaskIndex].status === 'completed') {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    task.assignedStudents[studentTaskIndex].status = 'in-progress';
    task.assignedStudents[studentTaskIndex].taskStartTime = new Date();
    
    await task.save();
    
    // Prepare questions (remove correct answers)
    const questionsForStudent = task.questions.map((q, index) => ({
      index,
      questionText: q.questionText,
      options: q.options.map(opt => ({ text: opt.text })),
      courseOutcome: q.courseOutcome,
      marks: q.marks
    }));
    
    // Randomize if enabled
    if (task.settings.randomizeQuestions) {
      questionsForStudent.sort(() => Math.random() - 0.5);
    }
    
    res.json({
      message: 'Task started',
      questions: questionsForStudent,
      taskDuration: task.taskSchedule.taskDuration,
      totalMarks: task.questions.reduce((sum, q) => sum + q.marks, 0),
      passingScore: task.settings.passingScore,
      showResourcesDuringTask: task.settings.showResourcesDuringTask,
      studyMaterials: task.settings.showResourcesDuringTask ? task.studyMaterials : []
    });
  } catch (error) {
    console.error('Error starting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit task answers
router.post('/task/submit/:taskId', auth, async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionIndex, selectedOption }
    const task = await Task.findById(req.params.taskId);
    const studentId = req.user.userId;
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const studentTaskIndex = task.assignedStudents.findIndex(
      as => as.student.toString() === studentId
    );
    
    if (studentTaskIndex === -1) {
      return res.status(403).json({ message: 'Task not assigned to you' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    let totalMarks = 0;
    
    const processedAnswers = answers.map(answer => {
      const question = task.questions[answer.questionIndex];
      const isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
      
      if (isCorrect) {
        correctAnswers++;
        totalMarks += question.marks;
      }
      
      return {
        questionIndex: answer.questionIndex,
        selectedOption: answer.selectedOption,
        isCorrect
      };
    });
    
    const maxMarks = task.questions.reduce((sum, q) => sum + q.marks, 0);
    const scorePercentage = (totalMarks / maxMarks) * 100;
    
    // Update student record
    task.assignedStudents[studentTaskIndex].status = 'completed';
    task.assignedStudents[studentTaskIndex].completedTime = new Date();
    task.assignedStudents[studentTaskIndex].score = scorePercentage;
    task.assignedStudents[studentTaskIndex].answers = processedAnswers;
    
    await task.save();
    
    res.json({
      message: 'Task submitted successfully',
      score: scorePercentage,
      correctAnswers,
      totalQuestions: task.questions.length,
      totalMarks,
      maxMarks,
      passed: scorePercentage >= task.settings.passingScore,
      passingScore: task.settings.passingScore
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get task details for faculty
router.get('/faculty/tasks', auth, async (req, res) => {
  try {
    // Check if user is Faculty or Admin
    if (!['Faculty', 'Admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Faculty or Admin role required.' 
      });
    }
    
    console.log(`📋 Fetching tasks for faculty: ${req.user.id}`);
    
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate('subject', 'name code')
      .populate('assignedStudents.student', 'name email rollNumber')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    
    res.json({ 
      success: true,
      count: tasks.length,
      tasks 
    });
  } catch (error) {
    console.error('❌ Error fetching faculty tasks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get students with existing CO-based tasks for a subject (to avoid conflicts)
router.get('/check-co-tasks/:subjectId', auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const activeCOTasks = await Task.find({
      subject: subjectId,
      'metadata.assignmentType': { $in: ['co_performance_based', 'faculty_bulk_assignment'] },
      'assignedStudents.status': { $in: ['assigned', 'studying', 'in-progress'] }
    })
    .populate('assignedStudents.student', 'name rollNumber email')
    .populate('subject', 'name code')
    .select('assignedStudents subject courseOutcomes coPerformanceData metadata taskSchedule');

    const studentsWithTasks = [];
    activeCOTasks.forEach(task => {
      task.assignedStudents.forEach(assignment => {
        if (['assigned', 'studying', 'in-progress'].includes(assignment.status)) {
          studentsWithTasks.push({
            studentId: assignment.student._id,
            studentName: assignment.student.name,
            rollNumber: assignment.student.rollNumber,
            taskId: task._id,
            courseOutcomes: task.courseOutcomes,
            assignmentType: task.metadata?.assignmentType,
            dueDate: task.taskSchedule?.endTime,
            coPerformanceData: task.coPerformanceData,
            reason: task.metadata?.assignmentReason
          });
        }
      });
    });

    res.json({
      success: true,
      subjectId,
      studentsWithCOTasks: studentsWithTasks,
      message: `Found ${studentsWithTasks.length} students with active CO-based tasks`
    });
  } catch (error) {
    console.error('Error checking learning tasks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper function to generate CO-specific questions
function generateCOSpecificQuestions(courseOutcome, difficulty, count, subjectName) {
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
}

// Generate CO-based MCQs for class assignment by faculty
router.post('/generate-co-mcqs', auth, async (req, res) => {
  try {
    const { subjectId, courseOutcomes, difficulty, questionCount, classId } = req.body;

    if (!subjectId || !courseOutcomes || !Array.isArray(courseOutcomes)) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID and course outcomes are required'
      });
    }

    const Subject = require('../models/Subject');
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Generate MCQs for each selected CO
    const generatedMCQs = {};
    const totalQuestions = questionCount || 10;
    const questionsPerCO = Math.ceil(totalQuestions / courseOutcomes.length);

    for (const co of courseOutcomes) {
      const coQuestions = generateCOSpecificQuestions(co, difficulty || 'Medium', questionsPerCO, subject.name);
      generatedMCQs[co] = coQuestions;
    }

    // Get students in the class/subject if classId is provided
    let classStudents = [];
    if (classId) {
      const User = require('../models/User');
      classStudents = await User.find({ 
        role: 'student',
        department: classId // Assuming classId refers to department or section
      }).select('name email rollNumber');
    }

    res.json({
      success: true,
      message: 'MCQs generated successfully',
      data: {
        subjectId,
        subjectName: subject.name,
        courseOutcomes,
        difficulty: difficulty || 'Medium',
        generatedMCQs,
        classStudents,
        totalQuestions: Object.values(generatedMCQs).reduce((sum, questions) => sum + questions.length, 0)
      }
    });

  } catch (error) {
    console.error('Error generating CO-based MCQs:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating MCQs',
      error: error.message
    });
  }
});

// Bulk assign CO-based tasks to students
router.post('/bulk-assign-co-tasks', auth, async (req, res) => {
  if (!['Faculty', 'Admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Only faculty can assign tasks' });
  }
  try {
    const { 
      subjectId, 
      studentIds, 
      courseOutcomes, 
      generatedMCQs, 
      taskTitle, 
      taskDescription,
      studyDuration,
      taskDuration,
      passingScore
    } = req.body;

    if (!subjectId || !studentIds || !Array.isArray(studentIds) || !courseOutcomes || !generatedMCQs) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: subjectId, studentIds, courseOutcomes, generatedMCQs'
      });
    }

    const Subject = require('../models/Subject');
    const User = require('../models/User');
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Verify students exist
    const students = await User.find({ _id: { $in: studentIds }, role: 'Student' });
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found or not valid'
      });
    }

    // Combine all MCQs from different COs
    const allQuestions = [];
    courseOutcomes.forEach(co => {
      if (generatedMCQs[co] && Array.isArray(generatedMCQs[co])) {
        allQuestions.push(...generatedMCQs[co]);
      }
    });

    if (allQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in generated MCQs'
      });
    }

    // Create task for the selected students
    const task = new Task({
      title: taskTitle || `${courseOutcomes.join(', ')} Learning Task - ${subject.name}`,
      description: taskDescription || `Practice and improve your understanding of ${courseOutcomes.join(', ')} concepts in ${subject.name}. Complete all questions and achieve the target score.`,
      subject: subjectId,
      courseOutcomes: courseOutcomes,
      questions: allQuestions,
      assignedStudents: studentIds.map(studentId => ({
        student: studentId,
        status: 'assigned',
        assignedAt: new Date()
      })),
      studyMaterials: [{
        title: `${courseOutcomes.join(', ')} Study Guide`,
        type: 'text',
        content: `Study materials for ${courseOutcomes.join(', ')} in ${subject.name}\n\nThis task covers:\n${courseOutcomes.map(co => `- ${co}: Focus on practical application and understanding`).join('\n')}\n\nComplete all questions and aim for ${passingScore || 60}% or higher.`
      }],
      taskSchedule: {
        studyDuration: studyDuration || 60,
        taskDuration: taskDuration || 30,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      settings: {
        allowChatbot: true,
        passingScore: passingScore || 60,
        randomizeQuestions: true,
        showResourcesDuringTask: false
      },
      createdBy: req.user.id,
      taskType: 'CO_ASSESSMENT',
      metadata: {
        assignmentType: 'faculty_bulk_assignment',
        targetCourseOutcomes: courseOutcomes,
        classAssignment: true
      }
    });

    await task.save();

    // Populate the task with student and subject details
    await task.populate(['assignedStudents.student', 'subject']);

    res.json({
      success: true,
      message: `Task assigned successfully to ${studentIds.length} students`,
      data: {
        taskId: task._id,
        assignedStudents: students.length,
        courseOutcomes,
        totalQuestions: allQuestions.length,
        task: task
      }
    });

  } catch (error) {
    console.error('Error in bulk task assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning tasks',
      error: error.message
    });
  }
});

module.exports = router;
