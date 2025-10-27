/**
 * Script to create a test faculty user or check existing faculty users
 * Run with: node create-faculty-user.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');

const MONGODB_URI = process.env.MONGODB_URI;

async function createTestFaculty() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check for existing faculty users
    console.log('\n📋 Checking existing faculty users...');
    const existingFaculty = await User.find({ role: 'Faculty' })
      .populate('department', 'name code')
      .select('+password');
    
    if (existingFaculty.length > 0) {
      console.log('\n✅ Found', existingFaculty.length, 'existing faculty users:');
      existingFaculty.forEach(faculty => {
        console.log(`
  📧 Email: ${faculty.email}
  👤 Name: ${faculty.name}
  🏢 Department: ${faculty.department?.name || 'N/A'}
  📊 Status: ${faculty.status}
  🆔 ID: ${faculty._id}
        `);
      });
    } else {
      console.log('\n⚠️ No faculty users found!');
    }

    // Get all departments
    console.log('\n📋 Available departments:');
    const departments = await Department.find();
    if (departments.length === 0) {
      console.log('⚠️ No departments found! Please create a department first.');
      process.exit(1);
    }

    departments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code}) - ID: ${dept._id}`);
    });

    // Create a test faculty user
    const firstDepartment = departments[0];
    
    const testFacultyEmail = 'faculty@learnaid.edu';
    const testFacultyPassword = 'Faculty@123';

    // Check if test faculty already exists
    const existingTestFaculty = await User.findOne({ email: testFacultyEmail });
    
    if (existingTestFaculty) {
      console.log(`\n✅ Test faculty user already exists!`);
      console.log(`
📧 Email: ${testFacultyEmail}
🔑 Password: ${testFacultyPassword}
📊 Status: ${existingTestFaculty.status}
      `);
      
      // If inactive, activate it
      if (existingTestFaculty.status !== 'Active') {
        console.log('\n⚠️ User is inactive. Activating...');
        existingTestFaculty.status = 'Active';
        await existingTestFaculty.save();
        console.log('✅ User activated!');
      }
    } else {
      console.log(`\n📝 Creating test faculty user...`);
      
      const newFaculty = await User.create({
        name: 'Test Faculty',
        email: testFacultyEmail,
        password: testFacultyPassword,
        role: 'Faculty',
        department: firstDepartment._id,
        phone: '1234567890',
        designation: 'Assistant Professor',
        qualification: 'Ph.D',
        experience: 5,
        specialization: ['Computer Science', 'Data Structures'],
        status: 'Active'
      });

      console.log('✅ Test faculty user created successfully!');
      console.log(`
📧 Email: ${testFacultyEmail}
🔑 Password: ${testFacultyPassword}
👤 Name: ${newFaculty.name}
🏢 Department: ${firstDepartment.name}
🆔 ID: ${newFaculty._id}
      `);
    }

    console.log('\n✅ You can now login with:');
    console.log(`   Email: ${testFacultyEmail}`);
    console.log(`   Password: ${testFacultyPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the function
createTestFaculty();
