const { validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all subjects with filtering
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const { department, semester, faculty, isActive, search } = req.query;

    // Build filter
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (faculty) filter.faculty = faculty;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('department', 'name code')
      .populate('faculty.user', '_id name email designation')
      .populate('prerequisite', 'name code')
      .sort({ semester: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects'
    });
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin)
const createSubject = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code, type, department, faculty, credits, semester, description, prerequisite, academicYear, section, year } = req.body;

    // Check if subject with this code already exists in the department
    let subject = await Subject.findOne({ 
      code: code.toUpperCase(), 
      department 
    });
    if (subject) {
      return res.status(409).json({
        success: false,
        message: 'Subject with this code already exists in the department'
      });
    }

    // Verify department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // If faculty is provided, verify it's a faculty member in the same department
    if (faculty) {
      const facultyDoc = await User.findOne({ 
        _id: faculty, 
        role: 'Faculty',
        department: department
      });
      if (!facultyDoc) {
        return res.status(400).json({
          success: false,
          message: 'Faculty must be a faculty member in the same department'
        });
      }
    }

    // Verify prerequisite exists in the same department
    if (prerequisite) {
      const prereqSubject = await Subject.findOne({
        _id: prerequisite,
        department: department
      });
      if (!prereqSubject) {
        return res.status(400).json({
          success: false,
          message: 'Prerequisite must be a valid subject in the same department'
        });
      }
    }

    // Create subject
    subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      type: type || 'Theory',
      department,
      faculty,
      credits,
      semester,
      description,
      prerequisite: prerequisite || null,
      academicYear: academicYear || '2024-2025', // Default academic year
      section: section || 'A', // Default section
      year: year || '1st Year', // Default year
      createdBy: req.user?.id || req.user?._id || null // Add createdBy from authenticated user with fallback
    });

    // Populate the created subject
    await subject.populate([
      { path: 'department', select: 'name code' },
      { path: 'faculty', select: 'name email designation' },
      { path: 'prerequisite', select: 'name code' }
    ]);

    // Update department's subjects array
    await Department.findByIdAndUpdate(
      department,
      { $addToSet: { subjects: subject._id } }
    );

    // If faculty is assigned, update their assignedSubjects
    if (faculty) {
      await User.findByIdAndUpdate(
        faculty,
        { $addToSet: { assignedSubjects: subject._id } }
      );
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'CREATE',
      resourceType: 'Subject',
      resourceId: subject._id,
      details: { 
        name, 
        code: code.toUpperCase(), 
        department: departmentDoc.name 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating subject'
    });
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('department', 'name code')
      .populate('faculty.user', '_id name email designation')
      .populate('prerequisite', 'name code credits semester');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });

  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subject'
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin)
const updateSubject = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedFields = ['name', 'code', 'type', 'credits', 'semester', 'description', 'faculty', 'isActive', 'prerequisite'];
    const updates = {};

    // Only allow updating specific fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'code' ? req.body[field].toUpperCase() : req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Get current subject
    const currentSubject = await Subject.findById(req.params.id);
    if (!currentSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if code is being updated and if it's unique within department
    if (updates.code) {
      const existingSubject = await Subject.findOne({ 
        code: updates.code, 
        department: currentSubject.department,
        _id: { $ne: req.params.id } 
      });
      if (existingSubject) {
        return res.status(409).json({
          success: false,
          message: 'Subject code already exists in this department'
        });
      }
    }

    // If faculty is being updated, verify it's a faculty member in the same department
    if (updates.faculty) {
      const facultyDoc = await User.findOne({ 
        _id: updates.faculty, 
        role: 'Faculty',
        department: currentSubject.department
      });
      if (!facultyDoc) {
        return res.status(400).json({
          success: false,
          message: 'Faculty must be a faculty member in the same department'
        });
      }

      // Remove from old faculty's assignedSubjects
      if (currentSubject.faculty) {
        await User.findByIdAndUpdate(
          currentSubject.faculty,
          { $pull: { assignedSubjects: currentSubject._id } }
        );
      }

      // Add to new faculty's assignedSubjects
      await User.findByIdAndUpdate(
        updates.faculty,
        { $addToSet: { assignedSubjects: currentSubject._id } }
      );
    }

    // Verify prerequisite exists in the same department
    if (updates.prerequisite) {
      const prereqSubject = await Subject.findOne({
        _id: updates.prerequisite,
        department: currentSubject.department
      });
      if (!prereqSubject) {
        return res.status(400).json({
          success: false,
          message: 'Prerequisite must be a valid subject in the same department'
        });
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'department', select: 'name code' },
      { path: 'faculty', select: 'name email designation' },
      { path: 'prerequisite', select: 'name code' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'Subject',
      resourceId: subject._id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating subject'
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin)
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if subject is assigned to any students
    const studentsCount = await User.countDocuments({
      enrolledSubjects: req.params.id
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject that is enrolled by students. Please remove enrollments first.'
      });
    }

    // Check if subject is a prerequisite for other subjects
    const dependentSubjects = await Subject.find({
      prerequisite: req.params.id
    });

    if (dependentSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject that is a prerequisite for other subjects. Please update dependent subjects first.'
      });
    }

    // Remove from department's subjects array
    await Department.findByIdAndUpdate(
      subject.department,
      { $pull: { subjects: subject._id } }
    );

    // Remove from faculty's assignedSubjects
    if (subject.faculty) {
      await User.findByIdAndUpdate(
        subject.faculty,
        { $pull: { assignedSubjects: subject._id } }
      );
    }

    await Subject.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'DELETE',
      resourceType: 'Subject',
      resourceId: subject._id,
      details: { 
        name: subject.name, 
        code: subject.code 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subject'
    });
  }
};

// @desc    Assign faculty to subject
// @route   POST /api/subjects/:id/faculty
// @access  Private (Admin)
const assignFacultyToSubject = async (req, res) => {
  try {
    // Debugging: log minimal request info to help trace 404/authorization issues
    console.log('[assignFacultyToSubject] hit:', req.method, req.originalUrl, 'authHeader=', !!req.headers.authorization);
    const { facultyId, isPrimary = false, isExternal = false } = req.body;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID is required'
      });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Verify faculty exists and check department based on assignment type
    let facultyQuery = {
      _id: facultyId,
      role: 'Faculty'
    };

    // For internal faculty, they must be in the same department
    // For external faculty, they must be in a different department
    if (isExternal) {
      facultyQuery.department = { $ne: subject.department };
    } else {
      facultyQuery.department = subject.department;
    }

    const facultyUser = await User.findOne(facultyQuery);

    if (!facultyUser) {
      const message = isExternal 
        ? 'External faculty must be from a different department' 
        : 'Internal faculty must be from the same department';
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // Use the model method to assign faculty
    await subject.assignFaculty(facultyId, isExternal, isPrimary);

    // Add to faculty's assignedSubjects
    await User.findByIdAndUpdate(
      facultyId,
      { $addToSet: { assignedSubjects: subject._id } }
    );

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'Subject',
      resourceId: subject._id,
      details: {
        action: 'assign_faculty',
        facultyId: facultyId,
        facultyName: facultyUser.name,
        isPrimary: isPrimary,
        isExternal: isExternal
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Return updated subject with populated faculty
    const updatedSubject = await Subject.findById(req.params.id)
      .populate('department', 'name code')
      .populate('faculty.user', '_id name fullName email employeeId');

    res.status(200).json({
      success: true,
      message: 'Faculty assigned successfully',
      data: updatedSubject
    });

  } catch (error) {
    console.error('Assign faculty error:', error);
    
    if (error.message === 'Faculty is already assigned to this subject') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while assigning faculty'
    });
  }
};

// @desc    Remove faculty from subject
// @route   DELETE /api/subjects/:id/faculty/:facultyId
// @access  Private (Admin)
const removeFacultyFromSubject = async (req, res) => {
  try {
    // Debugging: log minimal request info to help trace 404/authorization issues
    console.log('[removeFacultyFromSubject] hit:', req.method, req.originalUrl, 'authHeader=', !!req.headers.authorization);
    const { id, facultyId } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Use the model method to remove faculty
    await subject.removeFaculty(facultyId);

    // Remove from faculty's assignedSubjects
    await User.findByIdAndUpdate(
      facultyId,
      { $pull: { assignedSubjects: subject._id } }
    );

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'Subject',
      resourceId: subject._id,
      details: {
        action: 'remove_faculty',
        facultyId: facultyId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Return updated subject with populated faculty
    const updatedSubject = await Subject.findById(id)
      .populate('department', 'name code')
      .populate('faculty.user', '_id name fullName email employeeId');

    res.status(200).json({
      success: true,
      message: 'Faculty removed successfully',
      data: updatedSubject
    });

  } catch (error) {
    console.error('Remove faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing faculty'
    });
  }
};

// @desc    Sync student enrollments - Auto-enroll students based on department/year/section matching
// @route   POST /api/subjects/sync-enrollments
// @access  Private
const syncStudentEnrollments = async (req, res) => {
  try {
    console.log('[syncStudentEnrollments] Starting enrollment sync...');
    
    // Get all active subjects
    const subjects = await Subject.find({ status: 'Active' });
    
    // Get all active students
    const students = await User.find({ role: 'Student', status: 'Active' });
    
    console.log(`Found ${subjects.length} subjects and ${students.length} students`);
    
    let enrollmentsCreated = 0;
    let enrollmentsSkipped = 0;
    const updates = [];
    
    // For each subject, find matching students and enroll them
    for (const subject of subjects) {
      const matchingStudents = students.filter(student => {
        // Match by department, year, and section
        const deptMatch = String(student.department) === String(subject.department);
        const yearMatch = student.year === subject.year;
        const sectionMatch = student.section === subject.section;
        
        return deptMatch && yearMatch && sectionMatch;
      });
      
      console.log(`Subject ${subject.name} (${subject.year} - ${subject.section}): ${matchingStudents.length} matching students`);
      
      for (const student of matchingStudents) {
        // Check if student is already enrolled
        const alreadyEnrolled = subject.enrolledStudents.some(
          enrolledId => String(enrolledId) === String(student._id)
        );
        
        if (!alreadyEnrolled) {
          subject.enrolledStudents.push(student._id);
          enrollmentsCreated++;
          
          // Also update the student's enrolledSubjects array
          if (!student.enrolledSubjects) {
            student.enrolledSubjects = [];
          }
          if (!student.enrolledSubjects.some(subId => String(subId) === String(subject._id))) {
            student.enrolledSubjects.push(subject._id);
            await student.save();
          }
        } else {
          enrollmentsSkipped++;
        }
      }
      
      if (matchingStudents.length > 0) {
        await subject.save();
        updates.push({
          subject: subject.name,
          code: subject.code,
          enrolled: matchingStudents.length
        });
      }
    }
    
    console.log(`Enrollment sync complete: ${enrollmentsCreated} created, ${enrollmentsSkipped} skipped`);
    
    res.status(200).json({
      success: true,
      message: 'Student enrollments synchronized successfully',
      data: {
        totalSubjects: subjects.length,
        totalStudents: students.length,
        enrollmentsCreated,
        enrollmentsSkipped,
        updates
      }
    });
    
  } catch (error) {
    console.error('Sync enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing enrollments'
    });
  }
};

// @desc    Get student's enrolled subjects
// @route   GET /api/subjects/student/my-subjects
// @access  Private (Student)
const getMySubjects = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get student details
    const student = await User.findById(studentId).select('department year section batch');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('Student details:', {
      id: studentId,
      department: student.department,
      year: student.year,
      section: student.section,
      batch: student.batch
    });

    // Build query - match by department, year, and optionally section
    const query = {
      department: student.department
    };

    // Add year filter if student has year
    if (student.year) {
      query.year = student.year;
    }

    // Add section filter if student has section
    if (student.section) {
      query.section = student.section;
    }

    // Only filter by isActive if it's explicitly false, otherwise include all
    query.$or = [
      { isActive: true },
      { isActive: { $exists: false } },
      { isActive: null }
    ];

    console.log('Query for subjects:', query);

    // Get subjects for the student's department, year, and section
    const subjects = await Subject.find(query)
      .populate('department', 'name code')
      .populate('faculty.user', 'name email designation')
      .sort({ name: 1 });

    console.log(`Found ${subjects.length} subjects`);

    // Calculate progress for each subject (you can enhance this based on your needs)
    const subjectsWithProgress = subjects.map(subject => {
      return {
        ...subject.toObject(),
        progress: Math.floor(Math.random() * 30) + 60 // Placeholder: 60-90%
      };
    });

    res.status(200).json({
      success: true,
      count: subjectsWithProgress.length,
      data: subjectsWithProgress
    });

  } catch (error) {
    console.error('Get my subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your subjects'
    });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignFacultyToSubject,
  removeFacultyFromSubject,
  syncStudentEnrollments,
  getMySubjects
};