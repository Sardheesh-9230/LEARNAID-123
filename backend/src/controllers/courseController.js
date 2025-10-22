const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private/Faculty
 */
exports.createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      code,
      description,
      overview,
      department,
      subject,
      year,
      section,
      semester,
      academicYear,
      learningObjectives,
      status
    } = req.body;

    // Verify department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Verify subject exists
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // Create course
    const course = await Course.create({
      name,
      code,
      description,
      overview,
      department,
      subject,
      year,
      section,
      semester,
      academicYear,
      faculty: req.user.id, // Assign current user as faculty
      learningObjectives,
      status: status || 'Draft',
      createdBy: req.user.id
    });

    // Populate references
    await course.populate([
      { path: 'department', select: 'name code' },
      { path: 'subject', select: 'name code credits' },
      { path: 'faculty', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = async (req, res, next) => {
  try {
    const {
      department,
      subject,
      year,
      section,
      semester,
      status,
      academicYear,
      faculty
    } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (subject) filter.subject = subject;
    if (year) filter.year = year;
    if (section) filter.section = section;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    if (faculty) filter.faculty = faculty;

    // If user is faculty, only show their courses unless they're admin
    if (req.user.role === 'Faculty' && !faculty) {
      filter.faculty = req.user.id;
    }

    const courses = await Course.find(filter)
      .populate('department', 'name code')
      .populate('subject', 'name code credits')
      .populate('faculty', 'name email')
      .populate({
        path: 'chapters',
        select: 'title chapterNumber status displayOrder'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name code')
      .populate('subject', 'name code credits semester')
      .populate('faculty', 'name email phone designation')
      .populate({
        path: 'chapters',
        select: 'title chapterNumber description topics status displayOrder estimatedDuration',
        options: { sort: { displayOrder: 1, chapterNumber: 1 } }
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'Faculty' && course.faculty._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this course'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private/Faculty
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // If course code is being changed, check for duplicates
    if (req.body.code && req.body.code !== course.code) {
      const existingCourse = await Course.findOne({ code: req.body.code });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    // Update course
    req.body.updatedBy = req.user.id;
    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'department', select: 'name code' },
      { path: 'subject', select: 'name code' },
      { path: 'faculty', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Check if course has associated data (chapters, exams, etc.)
    const Chapter = require('../models/Chapter');
    const chapterCount = await Chapter.countDocuments({ course: course._id });

    if (chapterCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with existing chapters. Please delete all chapters first.'
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

/**
 * @desc    Get courses by faculty
 * @route   GET /api/courses/faculty/:facultyId
 * @access  Private
 */
exports.getCoursesByFaculty = async (req, res, next) => {
  try {
    const { facultyId } = req.params;

    // Verify faculty exists
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'Faculty') {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const courses = await Course.findByFaculty(facultyId);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get courses by faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty courses',
      error: error.message
    });
  }
};

/**
 * @desc    Get courses by department
 * @route   GET /api/courses/department/:departmentId
 * @access  Private
 */
exports.getCoursesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const courses = await Course.findByDepartment(departmentId);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get courses by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department courses',
      error: error.message
    });
  }
};

/**
 * @desc    Change course status
 * @route   PATCH /api/courses/:id/status
 * @access  Private/Faculty
 */
exports.updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Draft', 'Active', 'Completed', 'Archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course.status = status;
    course.updatedBy = req.user.id;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course
    });
  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course status',
      error: error.message
    });
  }
};

/**
 * @desc    Get course statistics
 * @route   GET /api/courses/:id/stats
 * @access  Private
 */
exports.getCourseStats = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const Chapter = require('../models/Chapter');
    const CIAExam = require('../models/CIAExam');

    const [chapterCount, examCount] = await Promise.all([
      Chapter.countDocuments({ course: course._id }),
      CIAExam.countDocuments({ course: course._id })
    ]);

    const stats = {
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        status: course.status
      },
      chapters: chapterCount,
      exams: examCount,
      learningObjectives: course.learningObjectives ? course.learningObjectives.length : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course statistics',
      error: error.message
    });
  }
};
