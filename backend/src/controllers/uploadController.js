const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const File = require('../models/File');

// @desc    Upload users from CSV
// @route   POST /api/upload/users
// @access  Private (Admin)
const uploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Save file information
    const fileDoc = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      uploadType: 'bulk_users'
    });

    const users = [];
    const errors = [];
    let lineNumber = 0;

    // Parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;
        users.push({ ...row, lineNumber });
      })
      .on('end', async () => {
        const createdUsers = [];

        for (const userData of users) {
          try {
            // Validate required fields
            if (!userData.name || !userData.email || !userData.password || !userData.role || !userData.department) {
              errors.push({ 
                line: userData.lineNumber, 
                error: 'Missing required fields (name, email, password, role, department)' 
              });
              continue;
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
              errors.push({ 
                line: userData.lineNumber, 
                error: `User with email ${userData.email} already exists` 
              });
              continue;
            }

            // Find department by name or code
            const department = await Department.findOne({ 
              $or: [
                { name: { $regex: new RegExp(userData.department, 'i') } },
                { code: { $regex: new RegExp(userData.department, 'i') } }
              ]
            });

            if (!department) {
              errors.push({ 
                line: userData.lineNumber, 
                error: `Department '${userData.department}' not found` 
              });
              continue;
            }

            // Validate role
            if (!['Student', 'Faculty', 'Staff', 'Admin'].includes(userData.role)) {
              errors.push({ 
                line: userData.lineNumber, 
                error: `Invalid role '${userData.role}'. Must be Student, Faculty, Staff, or Admin` 
              });
              continue;
            }

            // Prepare user data
            const newUserData = {
              name: userData.name,
              email: userData.email,
              password: userData.password,
              role: userData.role,
              department: department._id,
              phone: userData.phone || '',
              address: userData.address || ''
            };

            // Add role-specific fields
            if (userData.role === 'Student') {
              if (userData.section) newUserData.section = userData.section;
              if (userData.batch) newUserData.batch = userData.batch;
              if (userData.semester) newUserData.semester = parseInt(userData.semester) || 1;
              if (userData.guardianName) newUserData.guardianName = userData.guardianName;
              if (userData.guardianPhone) newUserData.guardianPhone = userData.guardianPhone;
            }

            if (userData.role === 'Faculty') {
              if (userData.designation) newUserData.designation = userData.designation;
              if (userData.qualification) newUserData.qualification = userData.qualification;
              if (userData.experience) newUserData.experience = parseInt(userData.experience) || 0;
              if (userData.specialization) {
                newUserData.specialization = userData.specialization.split(',').map(s => s.trim());
              }
            }

            // Create user
            const newUser = await User.create(newUserData);
            createdUsers.push({
              line: userData.lineNumber,
              user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
              }
            });

          } catch (error) {
            errors.push({ 
              line: userData.lineNumber, 
              error: error.message 
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Update file document with results
        await File.findByIdAndUpdate(fileDoc._id, {
          processedAt: new Date(),
          processResults: {
            total: users.length,
            created: createdUsers.length,
            errors: errors.length
          }
        });

        // Log activity
        await ActivityLog.logActivity({
          user: req.user.id,
          action: 'CREATE',
          resourceType: 'User',
          details: { 
            action: 'bulk_upload',
            filename: req.file.originalname,
            total: users.length,
            created: createdUsers.length,
            errors: errors.length
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: `Bulk user upload completed. Created: ${createdUsers.length}, Errors: ${errors.length}`,
          data: {
            total: users.length,
            created: createdUsers.length,
            errors: errors.length,
            createdUsers: createdUsers.slice(0, 10), // Return first 10 for preview
            errorSummary: errors.slice(0, 10) // Return first 10 errors for preview
          }
        });
      })
      .on('error', (error) => {
        // Clean up file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
};

// @desc    Upload subjects from CSV
// @route   POST /api/upload/subjects
// @access  Private (Admin)
const uploadSubjects = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Save file information
    const fileDoc = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      uploadType: 'bulk_subjects'
    });

    const subjects = [];
    const errors = [];
    let lineNumber = 0;

    // Parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;
        subjects.push({ ...row, lineNumber });
      })
      .on('end', async () => {
        const createdSubjects = [];

        for (const subjectData of subjects) {
          try {
            // Validate required fields
            if (!subjectData.name || !subjectData.code || !subjectData.department || 
                !subjectData.credits || !subjectData.semester) {
              errors.push({ 
                line: subjectData.lineNumber, 
                error: 'Missing required fields (name, code, department, credits, semester)' 
              });
              continue;
            }

            // Find department by name or code
            const department = await Department.findOne({ 
              $or: [
                { name: { $regex: new RegExp(subjectData.department, 'i') } },
                { code: { $regex: new RegExp(subjectData.department, 'i') } }
              ]
            });

            if (!department) {
              errors.push({ 
                line: subjectData.lineNumber, 
                error: `Department '${subjectData.department}' not found` 
              });
              continue;
            }

            // Check if subject already exists in department
            const existingSubject = await Subject.findOne({
              code: subjectData.code.toUpperCase(),
              department: department._id
            });

            if (existingSubject) {
              errors.push({ 
                line: subjectData.lineNumber, 
                error: `Subject with code '${subjectData.code}' already exists in department` 
              });
              continue;
            }

            // Validate credits and semester
            const credits = parseInt(subjectData.credits);
            const semester = parseInt(subjectData.semester);

            if (isNaN(credits) || credits < 1 || credits > 10) {
              errors.push({ 
                line: subjectData.lineNumber, 
                error: 'Credits must be a number between 1 and 10' 
              });
              continue;
            }

            if (isNaN(semester) || semester < 1 || semester > 8) {
              errors.push({ 
                line: subjectData.lineNumber, 
                error: 'Semester must be a number between 1 and 8' 
              });
              continue;
            }

            // Find faculty if provided
            let faculty = null;
            if (subjectData.faculty) {
              faculty = await User.findOne({
                $or: [
                  { email: subjectData.faculty },
                  { name: { $regex: new RegExp(subjectData.faculty, 'i') } }
                ],
                role: 'Faculty',
                department: department._id
              });

              if (!faculty) {
                errors.push({ 
                  line: subjectData.lineNumber, 
                  error: `Faculty '${subjectData.faculty}' not found in department` 
                });
                continue;
              }
            }

            // Prepare subject data
            const newSubjectData = {
              name: subjectData.name,
              code: subjectData.code.toUpperCase(),
              department: department._id,
              credits,
              semester,
              description: subjectData.description || '',
              faculty: faculty ? faculty._id : null
            };

            // Create subject
            const newSubject = await Subject.create(newSubjectData);

            // Update department's subjects array
            await Department.findByIdAndUpdate(
              department._id,
              { $addToSet: { subjects: newSubject._id } }
            );

            // Update faculty's assignedSubjects if faculty is assigned
            if (faculty) {
              await User.findByIdAndUpdate(
                faculty._id,
                { $addToSet: { assignedSubjects: newSubject._id } }
              );
            }

            createdSubjects.push({
              line: subjectData.lineNumber,
              subject: {
                name: newSubject.name,
                code: newSubject.code,
                department: department.name
              }
            });

          } catch (error) {
            errors.push({ 
              line: subjectData.lineNumber, 
              error: error.message 
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        // Update file document with results
        await File.findByIdAndUpdate(fileDoc._id, {
          processedAt: new Date(),
          processResults: {
            total: subjects.length,
            created: createdSubjects.length,
            errors: errors.length
          }
        });

        // Log activity
        await ActivityLog.logActivity({
          user: req.user.id,
          action: 'CREATE',
          resourceType: 'Subject',
          details: { 
            action: 'bulk_upload',
            filename: req.file.originalname,
            total: subjects.length,
            created: createdSubjects.length,
            errors: errors.length
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: `Bulk subject upload completed. Created: ${createdSubjects.length}, Errors: ${errors.length}`,
          data: {
            total: subjects.length,
            created: createdSubjects.length,
            errors: errors.length,
            createdSubjects: createdSubjects.slice(0, 10), // Return first 10 for preview
            errorSummary: errors.slice(0, 10) // Return first 10 errors for preview
          }
        });
      })
      .on('error', (error) => {
        // Clean up file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
};

module.exports = {
  uploadUsers,
  uploadSubjects
};