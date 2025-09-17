const { validationResult } = require('express-validator');
const Department = require('../models/Department');
const User = require('../models/User');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all departments with filtering
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter)
      .populate('head', 'name email')
      .populate('faculty', 'name email designation')
      .populate('subjects', 'name code credits')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching departments'
    });
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin)
const createDepartment = async (req, res) => {
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

    const { name, code, description, head } = req.body;

    // Check if department with this code already exists
    let department = await Department.findOne({ code: code.toUpperCase() });
    if (department) {
      return res.status(409).json({
        success: false,
        message: 'Department with this code already exists'
      });
    }

    // If head is provided, verify it's a faculty member
    if (head) {
      const headFaculty = await User.findOne({ _id: head, role: 'Faculty' });
      if (!headFaculty) {
        return res.status(400).json({
          success: false,
          message: 'Head must be a faculty member'
        });
      }
    }

    // Create department
    department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      head
    });

    // Populate the created department
    await department.populate('head', 'name email');

    // If head is assigned, update their department
    if (head) {
      await User.findByIdAndUpdate(head, { department: department._id });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'CREATE',
      resourceType: 'Department',
      resourceId: department._id,
      details: { name, code: code.toUpperCase() },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });

  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating department'
    });
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'name email designation')
      .populate('faculty', 'name email designation')
      .populate('subjects', 'name code credits semester');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });

  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department'
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
const updateDepartment = async (req, res) => {
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

    const allowedFields = ['name', 'code', 'description', 'head', 'isActive'];
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

    // Check if code is being updated and if it's unique
    if (updates.code) {
      const existingDepartment = await Department.findOne({ 
        code: updates.code, 
        _id: { $ne: req.params.id } 
      });
      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: 'Department code already exists'
        });
      }
    }

    // If head is being updated, verify it's a faculty member
    if (updates.head) {
      const headFaculty = await User.findOne({ _id: updates.head, role: 'Faculty' });
      if (!headFaculty) {
        return res.status(400).json({
          success: false,
          message: 'Head must be a faculty member'
        });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('head', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'Department',
      resourceId: department._id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });

  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating department'
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has any users
    const userCount = await User.countDocuments({ department: req.params.id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active users. Please reassign users first.'
      });
    }

    // Check if department has any subjects
    const subjectCount = await Subject.countDocuments({ department: req.params.id });
    if (subjectCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with subjects. Please delete subjects first.'
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'DELETE',
      resourceType: 'Department',
      resourceId: department._id,
      details: { name: department.name, code: department.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting department'
    });
  }
};

// @desc    Get department faculty
// @route   GET /api/departments/:id/faculty
// @access  Private
const getDepartmentFaculty = async (req, res) => {
  try {
    const faculty = await User.find({
      department: req.params.id,
      role: 'Faculty',
      status: 'Active'
    })
    .populate('assignedSubjects', 'name code credits')
    .select('-password')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: faculty
    });

  } catch (error) {
    console.error('Get department faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department faculty'
    });
  }
};

// @desc    Get department students
// @route   GET /api/departments/:id/students
// @access  Private
const getDepartmentStudents = async (req, res) => {
  try {
    const { section, batch, semester } = req.query;

    // Build filter
    const filter = {
      department: req.params.id,
      role: 'Student',
      status: 'Active'
    };

    if (section) filter.section = section;
    if (batch) filter.batch = batch;
    if (semester) filter.semester = parseInt(semester);

    const students = await User.find(filter)
      .populate('enrolledSubjects', 'name code credits')
      .select('-password')
      .sort({ batch: -1, section: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Get department students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department students'
    });
  }
};

// @desc    Get department subjects
// @route   GET /api/departments/:id/subjects
// @access  Private
const getDepartmentSubjects = async (req, res) => {
  try {
    const { semester, isActive } = req.query;

    // Build filter
    const filter = {
      department: req.params.id
    };

    if (semester) filter.semester = parseInt(semester);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const subjects = await Subject.find(filter)
      .populate('faculty', 'name email')
      .sort({ semester: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Get department subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department subjects'
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/:id/stats
// @access  Private
const getDepartmentStats = async (req, res) => {
  try {
    const departmentId = req.params.id;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get total counts
    const totalStudents = await User.countDocuments({ 
      department: departmentId, 
      role: 'Student',
      status: 'Active'
    });

    const totalFaculty = await User.countDocuments({ 
      department: departmentId, 
      role: 'Faculty',
      status: 'Active'
    });

    const totalSubjects = await Subject.countDocuments({ 
      department: departmentId,
      isActive: true
    });

    // Students by section
    const studentsBySection = await User.aggregate([
      {
        $match: {
          department: department._id,
          role: 'Student',
          status: 'Active'
        }
      },
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 }
        }
      }
    ]);

    // Students by semester
    const studentsBySemester = await User.aggregate([
      {
        $match: {
          department: department._id,
          role: 'Student',
          status: 'Active'
        }
      },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalSubjects,
        studentsBySection: studentsBySection.reduce((acc, curr) => {
          acc[curr._id || 'Unassigned'] = curr.count;
          return acc;
        }, {}),
        studentsBySemester: studentsBySemester.reduce((acc, curr) => {
          acc[curr._id || 'Unassigned'] = curr.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department statistics'
    });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentFaculty,
  getDepartmentStudents,
  getDepartmentSubjects,
  getDepartmentStats
};