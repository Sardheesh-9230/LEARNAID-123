const StudentMarkEntry = require('../models/StudentMarkEntry');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Enter marks for a student
 * @route   POST /api/student-marks
 * @access  Private/Faculty/Admin
 */
exports.enterStudentMarks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      student,
      subject,
      examType,
      marksObtained,
      totalMarks,
      remarks,
      isAbsent = false,
      academicYear = '2024-2025',
      semester = 'Odd',
      questionWiseMarks,
      coWiseMarks
    } = req.body;

    // Verify subject exists and faculty has access
    const subjectDoc = await Subject.findById(subject).populate('faculty.user');
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if faculty is assigned to this subject
    if (req.user.role === 'Faculty') {
      const isAssigned = subjectDoc.faculty.some(f => 
        (f.user._id || f.user).toString() === req.user._id.toString()
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to enter marks for this subject'
        });
      }
    }

    // Verify student exists
    const studentDoc = await User.findById(student);
    if (!studentDoc || studentDoc.role !== 'Student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate marks based on exam type
    let expectedTotalMarks;
    switch(examType.toUpperCase()) {
      case 'CIA1':
      case 'CIA2':
        expectedTotalMarks = 60;
        break;
      case 'MODEL':
        expectedTotalMarks = 100;
        break;
      default:
        expectedTotalMarks = totalMarks;
    }

    if (totalMarks && totalMarks !== expectedTotalMarks) {
      return res.status(400).json({
        success: false,
        message: `Total marks for ${examType.toUpperCase()} should be ${expectedTotalMarks}`
      });
    }

    if (!isAbsent && (marksObtained < 0 || marksObtained > expectedTotalMarks)) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${expectedTotalMarks}`
      });
    }

    // Check if marks already exist (update case)
    const existingMark = await StudentMarkEntry.findOne({
      student,
      subject,
      examType: examType.toUpperCase(),
      academicYear,
      semester
    });

    let markEntry;

    if (existingMark) {
      // Update existing marks
      existingMark.marksObtained = isAbsent ? 0 : marksObtained;
      existingMark.totalMarks = expectedTotalMarks;
      existingMark.remarks = remarks || '';
      existingMark.isAbsent = isAbsent;
      existingMark.lastModifiedBy = req.user._id;
      existingMark.questionWiseMarks = questionWiseMarks || [];
      existingMark.coWiseMarks = coWiseMarks || [];
      
      markEntry = await existingMark.save();
    } else {
      // Create new mark entry
      markEntry = await StudentMarkEntry.create({
        student,
        subject,
        examType: examType.toUpperCase(),
        marksObtained: isAbsent ? 0 : marksObtained,
        totalMarks: expectedTotalMarks,
        remarks: remarks || '',
        isAbsent,
        enteredBy: req.user._id,
        academicYear,
        semester,
        questionWiseMarks: questionWiseMarks || [],
        coWiseMarks: coWiseMarks || []
      });
    }

    // Populate the response
    await markEntry.populate([
      { path: 'student', select: 'name rollNumber email' },
      { path: 'subject', select: 'name code' },
      { path: 'enteredBy', select: 'name email' }
    ]);

    res.status(existingMark ? 200 : 201).json({
      success: true,
      message: existingMark ? 'Marks updated successfully' : 'Marks entered successfully',
      data: markEntry
    });

  } catch (error) {
    // Handle duplicate entry error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Marks already exist for this student, subject, and exam combination'
      });
    }

    console.error('Enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error entering marks',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk enter marks for multiple students
 * @route   POST /api/student-marks/bulk
 * @access  Private/Faculty/Admin
 */
exports.bulkEnterMarks = async (req, res, next) => {
  try {
    const { 
      subject, 
      examType, 
      marksData, 
      academicYear = '2024-2025', 
      semester = 'Odd' 
    } = req.body;

    if (!subject || !examType || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject, exam type, and marks data are required'
      });
    }

    // Verify subject access
    const subjectDoc = await Subject.findById(subject).populate('faculty.user');
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (req.user.role === 'Faculty') {
      const isAssigned = subjectDoc.faculty.some(f => 
        (f.user._id || f.user).toString() === req.user._id.toString()
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to enter marks for this subject'
        });
      }
    }

    // Validate exam type and get total marks
    let totalMarks;
    switch(examType.toUpperCase()) {
      case 'CIA1':
      case 'CIA2':
        totalMarks = 60;
        break;
      case 'MODEL':
        totalMarks = 100;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid exam type. Must be CIA1, CIA2, or MODEL'
        });
    }

    const results = [];
    const errors = [];

    for (const markData of marksData) {
      try {
        const { student, marksObtained, remarks, isAbsent = false, questionWiseMarks, coWiseMarks } = markData;

        // Validate individual mark data
        if (!student) {
          errors.push({ student: 'Unknown', error: 'Student ID is required' });
          continue;
        }

        if (!isAbsent && (marksObtained < 0 || marksObtained > totalMarks)) {
          errors.push({ 
            student, 
            error: `Marks must be between 0 and ${totalMarks}` 
          });
          continue;
        }

        // Check if marks already exist
        const existingMark = await StudentMarkEntry.findOne({
          student,
          subject,
          examType: examType.toUpperCase(),
          academicYear,
          semester
        });

        let markEntry;

        if (existingMark) {
          // Update existing marks
          existingMark.marksObtained = isAbsent ? 0 : marksObtained;
          existingMark.totalMarks = totalMarks;
          existingMark.remarks = remarks || '';
          existingMark.isAbsent = isAbsent;
          existingMark.lastModifiedBy = req.user._id;
          existingMark.questionWiseMarks = questionWiseMarks || [];
          existingMark.coWiseMarks = coWiseMarks || [];
          
          markEntry = await existingMark.save();
        } else {
          // Create new mark entry
          markEntry = await StudentMarkEntry.create({
            student,
            subject,
            examType: examType.toUpperCase(),
            marksObtained: isAbsent ? 0 : marksObtained,
            totalMarks,
            remarks: remarks || '',
            isAbsent,
            enteredBy: req.user._id,
            academicYear,
            semester,
            questionWiseMarks: questionWiseMarks || [],
            coWiseMarks: coWiseMarks || []
          });
        }

        results.push({
          student,
          success: true,
          action: existingMark ? 'updated' : 'created',
          markEntry: markEntry._id
        });

      } catch (error) {
        errors.push({
          student: markData.student || 'Unknown',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation completed. ${results.length} successful, ${errors.length} errors`,
      data: {
        successful: results,
        errors: errors,
        summary: {
          total: marksData.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    console.error('Bulk enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk mark entry',
      error: error.message
    });
  }
};

/**
 * @desc    Get marks by subject and exam type
 * @route   GET /api/student-marks/subject/:subjectId/exam/:examType
 * @access  Private/Faculty/Admin
 */
exports.getMarksBySubjectAndExam = async (req, res, next) => {
  try {
    const { subjectId, examType } = req.params;
    const { academicYear = '2024-2025', semester = 'Odd' } = req.query;

    // Verify subject exists and access
    const subject = await Subject.findById(subjectId).populate('faculty.user');
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (req.user.role === 'Faculty') {
      const isAssigned = subject.faculty.some(f => 
        (f.user._id || f.user).toString() === req.user._id.toString()
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view marks for this subject'
        });
      }
    }

    const marks = await StudentMarkEntry.findBySubjectAndExam(
      subjectId, 
      examType, 
      academicYear, 
      semester
    );

    // Get statistics
    const statistics = await StudentMarkEntry.getSubjectExamStatistics(
      subjectId, 
      examType, 
      academicYear, 
      semester
    );

    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks,
      statistics,
      meta: {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code
        },
        examType: examType.toUpperCase(),
        academicYear,
        semester
      }
    });

  } catch (error) {
    console.error('Get marks by subject and exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
};

/**
 * @desc    Get student's marks for all exams in a subject
 * @route   GET /api/student-marks/student/:studentId/subject/:subjectId
 * @access  Private/Faculty/Admin/Student (own marks)
 */
exports.getStudentSubjectMarks = async (req, res, next) => {
  try {
    const { studentId, subjectId } = req.params;
    const { academicYear = '2024-2025' } = req.query;

    // Permission check - students can only view their own marks
    if (req.user.role === 'Student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Students can only view their own marks'
      });
    }

    // Students can only see Published marks, Faculty/Admin can see all
    const includeUnpublished = req.user.role === 'Faculty' || req.user.role === 'Admin';
    
    const marks = await StudentMarkEntry.findStudentSubjectMarks(
      studentId,
      subjectId,
      academicYear,
      includeUnpublished
    );

    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks
    });

  } catch (error) {
    console.error('Get student subject marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student marks',
      error: error.message
    });
  }
};

/**
 * @desc    Get faculty's mark entry summary
 * @route   GET /api/student-marks/faculty/summary
 * @access  Private/Faculty/Admin
 */
exports.getFacultyMarksSummary = async (req, res, next) => {
  try {
    const { academicYear = '2024-2025' } = req.query;
    const facultyId = req.user.role === 'Faculty' ? req.user._id : req.query.facultyId;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID is required'
      });
    }

    const summary = await StudentMarkEntry.getFacultyMarksSummary(facultyId, academicYear);

    res.status(200).json({
      success: true,
      data: summary,
      meta: {
        facultyId,
        academicYear
      }
    });

  } catch (error) {
    console.error('Get faculty marks summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty marks summary',
      error: error.message
    });
  }
};

/**
 * @desc    Update marks status (Draft/Final/Published)
 * @route   PUT /api/student-marks/:id/status
 * @access  Private/Faculty/Admin
 */
exports.updateMarkStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Final', 'Published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Draft, Final, or Published'
      });
    }

    const markEntry = await StudentMarkEntry.findById(id).populate('subject');
    if (!markEntry) {
      return res.status(404).json({
        success: false,
        message: 'Mark entry not found'
      });
    }

    // Permission check
    if (req.user.role === 'Faculty' && markEntry.enteredBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this mark entry'
      });
    }

    markEntry.status = status;
    markEntry.lastModifiedBy = req.user._id;
    await markEntry.save();

    res.status(200).json({
      success: true,
      message: 'Mark status updated successfully',
      data: markEntry
    });

  } catch (error) {
    console.error('Update mark status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mark status',
      error: error.message
    });
  }
};

/**
 * @desc    Delete mark entry
 * @route   DELETE /api/student-marks/:id
 * @access  Private/Faculty/Admin
 */
exports.deleteMarkEntry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const markEntry = await StudentMarkEntry.findById(id);
    if (!markEntry) {
      return res.status(404).json({
        success: false,
        message: 'Mark entry not found'
      });
    }

    // Permission check
    if (req.user.role === 'Faculty' && markEntry.enteredBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this mark entry'
      });
    }

    // Cannot delete published marks
    if (markEntry.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete published marks'
      });
    }

    await markEntry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Mark entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete mark entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting mark entry',
      error: error.message
    });
  }
};

/**
 * @desc    Get mark entry statistics for dashboard
 * @route   GET /api/student-marks/statistics
 * @access  Private/Faculty/Admin
 */
exports.getMarkEntryStatistics = async (req, res, next) => {
  try {
    const { academicYear = '2024-2025', semester = 'Odd' } = req.query;
    let facultyFilter = {};

    if (req.user.role === 'Faculty') {
      facultyFilter.enteredBy = req.user._id;
    }

    // Get overall statistics
    const totalEntries = await StudentMarkEntry.countDocuments({
      ...facultyFilter,
      academicYear,
      semester
    });

    const byExamType = await StudentMarkEntry.aggregate([
      {
        $match: {
          ...facultyFilter,
          academicYear,
          semester
        }
      },
      {
        $group: {
          _id: '$examType',
          count: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' },
          passed: {
            $sum: {
              $cond: ['$isPassed', 1, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const byStatus = await StudentMarkEntry.aggregate([
      {
        $match: {
          ...facultyFilter,
          academicYear,
          semester
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        byExamType,
        byStatus,
        meta: {
          academicYear,
          semester,
          faculty: req.user.role === 'Faculty' ? req.user._id : 'All'
        }
      }
    });

  } catch (error) {
    console.error('Get mark entry statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};