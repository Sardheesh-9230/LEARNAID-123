const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
require('dotenv').config();

async function createCustomUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // List all existing departments
    const allDepts = await Department.find({}).select('name code');
    console.log('\n📋 Existing departments:', allDepts.map(d => `${d.name} (${d.code})`).join(', '));

    // Try to find any department (preferably Mechanical)
    let mechDept = await Department.findOne({ code: 'MECH' });
    
    if (!mechDept) {
      // Try to use any existing department
      mechDept = await Department.findOne({});
      if (mechDept) {
        console.log(`Using existing department: ${mechDept.name} (${mechDept.code})`);
      } else {
        console.log('❌ No departments found! Please run setup-database-v2.js first');
        process.exit(1);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'saravanan.mech@learnaid.in' });
    if (existingUser) {
      console.log('❌ User saravanan.mech@learnaid.in already exists!');
      console.log('User details:', {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        department: existingUser.department
      });
    } else {
      // Generate employee ID manually
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
      const employeeId = `EMP_FAC_${randomNum}`;

      // Create the custom user using new + save to trigger pre-save hooks
      const newUser = new User({
        name: 'Saravanan',
        email: 'saravanan.mech@learnaid.in',
        password: 'faculty123', // This will be hashed automatically by the pre-save hook
        role: 'Faculty',
        department: mechDept._id,
        employeeId: employeeId,
        phone: '+91-9876543210',
        address: 'Chennai, Tamil Nadu',
        designation: 'Assistant Professor',
        qualification: 'M.E. Mechanical Engineering',
        experience: 5,
        specialization: 'Thermal Engineering',
        status: 'Active'
      });

      await newUser.save(); // This will trigger the pre-save hook

      console.log('✅ User created successfully!');
      console.log('Login credentials:');
      console.log('Email: saravanan.mech@learnaid.in');
      console.log('Password: faculty123');
      console.log('Role:', newUser.role);
      console.log('Employee ID:', newUser.employeeId);
      console.log('Department:', mechDept.name);
    }

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createCustomUser();
