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
      .populate('faculty', 'name email designation')
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
      .populate('faculty', 'name email designation')
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

module.exports = {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject
};