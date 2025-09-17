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
      limit = 10,
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
      specialization, guardianName, guardianPhone
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
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
      if (!section || !batch) {
        return res.status(400).json({
          success: false,
          message: 'Section and batch are required for students'
        });
      }
      userData.section = section;
      userData.batch = batch;
      userData.semester = 1; // Default to first semester
      
      if (guardianName && guardianPhone) {
        userData.guardianName = guardianName;
        userData.guardianPhone = guardianPhone;
      }
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedFields = ['name', 'email', 'phone', 'address', 'status'];
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

    // Find faculty
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    if (faculty.role !== 'Faculty') {
      return res.status(400).json({
        success: false,
        message: 'User is not a faculty member'
      });
    }

    // Verify all subjects exist and belong to faculty's department
    const subjects = await Subject.find({
      _id: { $in: subjectIds },
      department: faculty.department
    });

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some subjects are invalid or do not belong to faculty\'s department'
      });
    }

    // Update faculty's assigned subjects
    faculty.assignedSubjects = [...new Set([...faculty.assignedSubjects, ...subjectIds])];
    await faculty.save();

    // Populate the updated faculty
    await faculty.populate('assignedSubjects', 'name code credits');

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: faculty._id,
      details: { 
        action: 'subject_assignment',
        assignedSubjects: subjects.map(s => s.name)
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Subjects assigned successfully',
      data: faculty
    });

  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning subjects'
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
  deleteUser,
  allocateSubjects,
  assignSubjects,
  bulkCreateUsers,
  getUserStats
};