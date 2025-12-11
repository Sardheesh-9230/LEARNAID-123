const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Test 1: Find the user
    const user = await User.findOne({ email: 'saravanan.mech@learnaid.in' }).select('+password');
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Password hash:', user.password.substring(0, 30) + '...');
    console.log('');
    
    // Test 2: Test password match with bcrypt directly
    const testPassword = 'faculty123';
    const directMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`Direct bcrypt.compare('${testPassword}'):`, directMatch ? '✅ PASS' : '❌ FAIL');
    
    // Test 3: Test with user's matchPassword method
    const methodMatch = await user.matchPassword(testPassword);
    console.log(`user.matchPassword('${testPassword}'):`, methodMatch ? '✅ PASS' : '❌ FAIL');
    
    // Test 4: Test with wrong password
    const wrongMatch = await user.matchPassword('wrongpassword');
    console.log(`user.matchPassword('wrongpassword'):`, wrongMatch ? '❌ FAIL (should be false)' : '✅ PASS (correctly rejected)');
    
    console.log('');
    console.log('Summary:', directMatch && methodMatch ? '✅ All tests passed!' : '❌ Some tests failed');
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
