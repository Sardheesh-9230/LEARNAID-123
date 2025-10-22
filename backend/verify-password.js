const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verifyPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const user = await User.findOne({ email: 'saravanan.mech@learnaid.in' }).select('+password');
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.name);
    console.log('   Email:', user.email);
    console.log('   Password hash:', user.password.substring(0, 30) + '...');
    console.log('');
    
    // Test the new password
    const testPassword = 'qwertyuiop';
    const match = await bcrypt.compare(testPassword, user.password);
    console.log(`Testing password '${testPassword}':`, match ? '✅ PASS' : '❌ FAIL');
    
    // Test the old password
    const oldPassword = 'faculty123';
    const oldMatch = await bcrypt.compare(oldPassword, user.password);
    console.log(`Testing password '${oldPassword}':`, oldMatch ? '✅ PASS (password not changed!)' : '❌ FAIL (password was changed)');
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPassword();
