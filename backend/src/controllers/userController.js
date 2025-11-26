const { validationResult } = require('express-validator');
const User = require('../models/User');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const csv = require('csv-parser');
const fs = require('fs');

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private (Admin, Faculty)
const getUsers = async (req, res) => {
  try {
    const {
      role,
      department,
      status = 'Active',
      page = 1,
      limit = 100, // Increased default limit to show more users
      search
    } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get users with population
    const users = await User.find(filter)
      .populate('department', 'name code')
      .populate('enrolledSubjects', 'name code credits')
      .populate('assignedSubjects', 'name code credits')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    // Get total count
    const total = await User.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        pages,
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
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

    const {
      name, email, password, role, department, phone, address,
      section, batch, designation, qualification, experience,
      specialization, guardianName, guardianPhone, studentId, employeeId
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if trying to create Admin when one already exists
    if (role === 'Admin') {
      const existingAdmin = await User.findOne({ role: 'Admin' });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin already exists. Only one admin is allowed in the system.'
        });
      }
    }

    // Verify department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // Create user object
    const userData = {
      name,
      email,
      password,
      role,
      department,
      phone,
      address
    };

    // Add role-specific fields
    if (role === 'Student') {
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Batch is required for students'
        });
      }
      // Section is optional during creation - will be assigned during subject allocation
      if (section) {
        userData.section = section;
      }
      userData.batch = batch;
      userData.semester = 1; // Default to first semester
      
      // Calculate year based on batch
      const currentYear = new Date().getFullYear();
      const batchYear = parseInt(batch);
      const yearOfStudy = currentYear - batchYear + 1;
      
      switch (yearOfStudy) {
        case 1: userData.year = '1st Year'; break;
        case 2: userData.year = '2nd Year'; break;
        case 3: userData.year = '3rd Year'; break;
        case 4: userData.year = '4th Year'; break;
        default: userData.year = '1st Year'; // Default to 1st year if calculation is off
      }
      
      if (guardianName && guardianPhone) {
        userData.guardianName = guardianName;
        userData.guardianPhone = guardianPhone;
      }
      
      // Add studentId if provided
      if (studentId) {
        userData.studentId = studentId;
      }
    }

    // Add employeeId for Faculty, Staff, and Admin
    if (['Faculty', 'Staff', 'Admin'].includes(role) && employeeId) {
      userData.employeeId = employeeId;
    }

    if (role === 'Faculty') {
      if (!designation || !qualification || !experience) {
        return res.status(400).json({
          success: false,
          message: 'Designation, qualification, and experience are required for faculty'
        });
      }
      userData.designation = designation;
      userData.qualification = qualification;
      userData.experience = experience;
      userData.specialization = specialization || [];
    }

    if (role === 'Staff') {
      if (!designation || !qualification) {
        return res.status(400).json({
          success: false,
          message: 'Designation and qualification are required for staff'
        });
      }
      userData.designation = designation;
      userData.qualification = qualification;
      // Experience is optional for Staff
      if (experience !== undefined) {
        userData.experience = experience;
      }
    }

    // Debug log to see what data is being sent
    console.log('Creating user with data:', JSON.stringify(userData, null, 2));
    
    // Create user
    user = await User.create(userData);

    // Populate the created user
    await user.populate('department', 'name code');

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'CREATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { role, department: departmentDoc.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code')
      .populate('enrolledSubjects', 'name code credits')
      .populate('assignedSubjects', 'name code credits')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check authorization - users can only view their own profile unless admin/faculty
    if (req.user.id !== user._id.toString() && 
        !['Admin', 'Faculty'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('User update validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'address', 'status',
      // Faculty-specific fields
      'designation', 'qualification', 'experience', 'specialization', 'employeeId',
      // Student-specific fields  
      'section', 'semester', 'batch', 'year', 'guardianName', 'guardianPhone', 'studentId', 'gpa'
    ];
    const updates = {};

    // Only allow updating specific fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Get current user to check role-based field restrictions
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Role-based field validation
    const facultyFields = ['designation', 'qualification', 'experience', 'specialization', 'employeeId'];
    const studentFields = ['section', 'semester', 'batch', 'year', 'guardianName', 'guardianPhone', 'studentId', 'gpa'];
    const staffFields = ['designation', 'qualification', 'experience', 'employeeId'];
    
    // Check if trying to update faculty/staff fields for non-faculty/staff user
    if (!['Faculty', 'Staff', 'Admin'].includes(currentUser.role)) {
      const invalidEmployeeFields = facultyFields.filter(field => updates[field] !== undefined);
      if (invalidEmployeeFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot update employee fields (${invalidEmployeeFields.join(', ')}) for non-employee user`
        });
      }
    }

    // Check if trying to update student fields for non-student user
    if (currentUser.role !== 'Student') {
      const invalidStudentFields = studentFields.filter(field => updates[field] !== undefined);
      if (invalidStudentFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot update student fields (${invalidStudentFields.join(', ')}) for non-student user`
        });
      }
    }
    
    // Additional validation: ensure employeeId is not set for students
    if (currentUser.role === 'Student' && updates.employeeId !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set employee ID for student users'
      });
    }
    
    // Additional validation: ensure studentId is not set for employees
    if (['Faculty', 'Staff', 'Admin'].includes(currentUser.role) && updates.studentId !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set student ID for employee users'
      });
    }

    // Check if email is being updated and if it's unique
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // If batch is being updated for a student, recalculate year
    if (currentUser.role === 'Student' && updates.batch) {
      const currentYear = new Date().getFullYear();
      const batchYear = parseInt(updates.batch);
      const yearOfStudy = currentYear - batchYear + 1;
      
      switch (yearOfStudy) {
        case 1: updates.year = '1st Year'; break;
        case 2: updates.year = '2nd Year'; break;
        case 3: updates.year = '3rd Year'; break;
        case 4: updates.year = '4th Year'; break;
        default: updates.year = '1st Year'; // Default to 1st year if calculation is off
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

// @desc    Change user password (Admin only)
// @route   PUT /api/users/:id/password
// @access  Private (Admin)
const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { action: 'Password changed by admin' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'DELETE',
      resourceType: 'User',
      resourceId: user._id,
      details: { deletedUser: user.name, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

// @desc    Allocate subjects to student
// @route   POST /api/users/:id/allocate-subjects
// @access  Private (Admin, Faculty)
const allocateSubjects = async (req, res) => {
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

    const { subjectIds } = req.body;

    // Find student
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'Student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Verify all subjects exist and belong to student's department
    const subjects = await Subject.find({
      _id: { $in: subjectIds },
      department: student.department
    });

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some subjects are invalid or do not belong to student\'s department'
      });
    }

    // Update student's enrolled subjects
    student.enrolledSubjects = [...new Set([...student.enrolledSubjects, ...subjectIds])];
    await student.save();

    // Populate the updated student
    await student.populate('enrolledSubjects', 'name code credits');

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: student._id,
      details: { 
        action: 'subject_allocation',
        allocatedSubjects: subjects.map(s => s.name)
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Subjects allocated successfully',
      data: student
    });

  } catch (error) {
    console.error('Allocate subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while allocating subjects'
    });
  }
};

// @desc    Assign subjects to faculty
// @route   POST /api/users/:id/assign-subjects
// @access  Private (Admin)
const assignSubjects = async (req, res) => {
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

    const { subjectIds } = req.body;

    // Find faculty or staff member
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!['Faculty', 'Staff'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a faculty or staff member'
      });
    }

    // Verify all subjects exist and belong to user's department
    const subjects = await Subject.find({
      _id: { $in: subjectIds },
      department: user.department
    });

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some subjects are invalid or do not belong to user\'s department'
      });
    }

    // Get additional assignment options from request body
    const { isPrimary = false, isExternal = false } = req.body;

    // Add faculty to each subject's faculty array
    const assignmentResults = [];
    for (const subjectId of subjectIds) {
      try {
        // Check if faculty is already assigned to this subject
        const subject = await Subject.findById(subjectId);
        const existingAssignment = subject.faculty.find(f => f.user.toString() === user._id.toString());
        
        if (existingAssignment) {
          assignmentResults.push({
            subjectId,
            success: false,
            error: 'Faculty is already assigned to this subject'
          });
          continue;
        }

        const updatedSubject = await Subject.findByIdAndUpdate(
          subjectId,
          { 
            $push: { 
              faculty: {
                user: user._id,
                isExternal: isExternal,
                isPrimary: isPrimary,
                assignedDate: new Date()
              }
            } 
          },
          { new: true, runValidators: true }
        ).populate('faculty.user', 'name email designation');
        
        assignmentResults.push({
          subjectId,
          success: true,
          subject: updatedSubject
        });
      } catch (error) {
        assignmentResults.push({
          subjectId,
          success: false,
          error: error.message
        });
      }
    }

    // Also update user's assignedSubjects for reference
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { assignedSubjects: { $each: subjectIds } } },
      { new: true, runValidators: true }
    ).populate('assignedSubjects', 'name code credits');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found during update'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { 
        action: 'subject_assignment',
        assignedSubjects: subjects.map(s => s.name),
        userRole: user.role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Subjects assigned successfully',
      data: {
        user: updatedUser,
        assignments: assignmentResults,
        successCount: assignmentResults.filter(r => r.success).length,
        totalCount: assignmentResults.length
      }
    });

  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning subjects'
    });
  }
};

// @desc    Remove faculty from subjects
// @route   DELETE /api/users/:id/unassign-subjects
// @access  Private (Admin)
const unassignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;

    // Find faculty or staff member
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!['Faculty', 'Staff'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a faculty or staff member'
      });
    }

    // Remove faculty from each subject's faculty array
    const unassignmentResults = [];
    for (const subjectId of subjectIds) {
      try {
        const updatedSubject = await Subject.findByIdAndUpdate(
          subjectId,
          { 
            $pull: { 
              faculty: { user: user._id }
            } 
          },
          { new: true, runValidators: true }
        ).populate('faculty.user', 'name email designation');
        
        unassignmentResults.push({
          subjectId,
          success: true,
          subject: updatedSubject
        });
      } catch (error) {
        unassignmentResults.push({
          subjectId,
          success: false,
          error: error.message
        });
      }
    }

    // Also update user's assignedSubjects for reference
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pullAll: { assignedSubjects: subjectIds } },
      { new: true, runValidators: true }
    ).populate('assignedSubjects', 'name code credits');

    res.status(200).json({
      success: true,
      message: 'Subjects unassigned successfully',
      data: {
        user: updatedUser,
        unassignments: unassignmentResults,
        successCount: unassignmentResults.filter(r => r.success).length,
        totalCount: unassignmentResults.length
      }
    });

  } catch (error) {
    console.error('Unassign subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unassigning subjects'
    });
  }
};

// @desc    Bulk create users from CSV
// @route   POST /api/users/bulk/create
// @access  Private (Admin)
const bulkCreateUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const users = [];
    const errors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        users.push(row);
      })
      .on('end', async () => {
        const createdUsers = [];

        for (let i = 0; i < users.length; i++) {
          const userData = users[i];
          try {
            // Validate required fields
            if (!userData.name || !userData.email || !userData.password || !userData.role || !userData.department) {
              errors.push({ row: i + 1, error: 'Missing required fields' });
              continue;
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
              errors.push({ row: i + 1, error: 'User with this email already exists' });
              continue;
            }

            // Verify department exists
            const department = await Department.findOne({ 
              $or: [{ name: userData.department }, { code: userData.department }] 
            });
            if (!department) {
              errors.push({ row: i + 1, error: 'Invalid department' });
              continue;
            }

            // Create user
            const newUser = await User.create({
              ...userData,
              department: department._id
            });

            createdUsers.push(newUser);

          } catch (error) {
            errors.push({ row: i + 1, error: error.message });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Log activity
        await ActivityLog.logActivity({
          user: req.user.id,
          action: 'CREATE',
          resourceType: 'User',
          details: { 
            action: 'bulk_create',
            created: createdUsers.length,
            errors: errors.length
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: `Bulk user creation completed. Created: ${createdUsers.length}, Errors: ${errors.length}`,
          data: {
            created: createdUsers.length,
            errors: errors
          }
        });
      });

  } catch (error) {
    console.error('Bulk create users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk user creation'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin)
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });

    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Users by department
    const usersByDepartment = await User.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept'
        }
      },
      {
        $unwind: '$dept'
      },
      {
        $group: {
          _id: '$dept.name',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        usersByDepartment: usersByDepartment.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  changeUserPassword,
  deleteUser,
  allocateSubjects,
  assignSubjects,
  unassignSubjects,
  bulkCreateUsers,
  getUserStats
};