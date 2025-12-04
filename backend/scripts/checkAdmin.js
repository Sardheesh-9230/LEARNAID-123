const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');
    
    const adminUsers = await User.find({ role: 'Admin' });
    console.log(`\n📊 Admin users found: ${adminUsers.length}\n`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`👤 Admin ${index + 1}:`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Employee ID: ${admin.employeeId || 'Not set'}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Department ID: ${admin.department}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log('');
    });
    
    // Also check total user counts
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'Student' });
    const faculty = await User.countDocuments({ role: 'Faculty' });
    const admins = await User.countDocuments({ role: 'Admin' });
    
    console.log('📈 Total User Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Students: ${students}`);
    console.log(`   Faculty: ${faculty}`);
    console.log(`   Admins: ${admins}`);
    
    console.log('\n🔑 Admin Login Details:');
    console.log('   Email: admin@college.edu');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkAdmin();