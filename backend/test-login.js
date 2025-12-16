const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@learnaid.edu' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Test password matching with common passwords
    const testPasswords = ['admin123', 'Admin@123', 'password', '12345678'];
    
    for (const testPassword of testPasswords) {
      const isMatch = await user.matchPassword(testPassword);
      console.log(`Testing password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      if (isMatch) {
        console.log(`\n🎉 CORRECT PASSWORD: "${testPassword}"\n`);
        break;
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
