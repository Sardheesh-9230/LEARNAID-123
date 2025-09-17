const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found.'
        });
      }

      // Check if user is active
      if (user.status !== 'Active') {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

// Middleware to check for specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check if user can access specific department
const authorizeResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const resourceId = req.params.id || req.params.departmentId || req.params.subjectId;

      // Admin can access everything
      if (user.role === 'Admin') {
        return next();
      }

      switch (resourceType) {
        case 'department':
          // Users can only access their own department
          if (user.department.toString() !== resourceId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only access your department\'s resources.'
            });
          }
          break;

        case 'user':
          // Users can access their own profile or department colleagues (with restrictions)
          const targetUser = await User.findById(resourceId);
          if (!targetUser) {
            return res.status(404).json({
              success: false,
              message: 'User not found.'
            });
          }

          // Can access own profile
          if (user._id.toString() === resourceId) {
            return next();
          }

          // Faculty and Staff can view department colleagues
          if (['Faculty', 'Staff'].includes(user.role) && 
              user.department.toString() === targetUser.department.toString()) {
            return next();
          }

          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
          });

        case 'subject':
          const Subject = require('../models/Subject');
          const subject = await Subject.findById(resourceId);
          if (!subject) {
            return res.status(404).json({
              success: false,
              message: 'Subject not found.'
            });
          }

          // Faculty can access subjects they teach or in their department
          if (user.role === 'Faculty') {
            const isAssignedFaculty = subject.faculty.some(f => f.user.toString() === user._id.toString());
            const isSameDepartment = subject.department.toString() === user.department.toString();
            
            if (isAssignedFaculty || isSameDepartment) {
              return next();
            }
          }

          // Students can access subjects they're enrolled in or in their department/section
          if (user.role === 'Student') {
            const isEnrolled = subject.enrolledStudents.includes(user._id);
            const isSameDepartmentAndSection = subject.department.toString() === user.department.toString() &&
                                               subject.section === user.section;
            
            if (isEnrolled || isSameDepartmentAndSection) {
              return next();
            }
          }

          return res.status(403).json({
            success: false,
            message: 'Access denied. You don\'t have permission to access this subject.'
          });

        default:
          return next();
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in resource authorization.'
      });
    }
  };
};

// Middleware to check if user owns the resource or has permission to modify it
const authorizeOwnership = () => {
  return (req, res, next) => {
    const { user } = req;
    const targetUserId = req.params.id || req.params.userId;

    // Admin can modify anyone
    if (user.role === 'Admin') {
      return next();
    }

    // Users can only modify their own profile
    if (user._id.toString() === targetUserId) {
      return next();
    }

    // Department HOD can modify department users (if implemented)
    // This would require checking if user is HOD of the target user's department

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only modify your own profile.'
    });
  };
};

module.exports = {
  protect: auth,
  authorize,
  authorizeResource,
  authorizeOwnership
};