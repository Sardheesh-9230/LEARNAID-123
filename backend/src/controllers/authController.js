const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (but might be restricted to admins in production)
const register = async (req, res) => {
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

    // Log activity
    await ActivityLog.logActivity({
      user: user._id,
      action: 'CREATE',
      resourceType: 'User',
      resourceId: user._id,
      details: { role, department: departmentDoc.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password').populate('department', 'name code');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      user: user._id,
      action: 'LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      details: { loginTime: new Date() },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department', 'name code')
      .populate('enrolledSubjects', 'name code credits')
      .populate('assignedSubjects', 'name code credits');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
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

    const allowedFields = ['name', 'phone', 'address'];
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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: req.user.id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: req.user.id,
      details: { action: 'password_changed' },
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

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      action: 'LOGOUT',
      resourceType: 'User',
      resourceId: req.user.id,
      details: { logoutTime: new Date() },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};