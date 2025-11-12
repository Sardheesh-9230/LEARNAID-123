const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
require('dotenv').config();

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const users = await User.find({}).select('+password').populate('department', 'name code');
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department?.name || 'N/A'} (${user.department?.code || 'N/A'})`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      console.log('');
    });
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAllUsers();
