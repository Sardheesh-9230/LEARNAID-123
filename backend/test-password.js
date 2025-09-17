const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function testPasswordComparison() {
  try {
    await mongoose.connect('mongodb://localhost:27017/learnaid');
    
    // Get the admin user with password
    const user = await User.findOne({ email: 'admin@learnaid.edu' }).select('+password');
    console.log('Found user:', user?.name);
    
    if (user) {
      // Test the password directly with bcrypt
      const directCompare = await bcrypt.compare('admin123', user.password);
      console.log('Direct bcrypt.compare result:', directCompare);
      
      // Test with the user's matchPassword method
      const methodCompare = await user.matchPassword('admin123');
      console.log('User.matchPassword result:', methodCompare);
      
      // Test with wrong password
      const wrongCompare = await user.matchPassword('wrongpassword');
      console.log('Wrong password result:', wrongCompare);
      
      // Test what happens if we hash 'admin123' and compare
      const hashedPassword = await bcrypt.hash('admin123', 10);
      console.log('New hash of admin123:', hashedPassword);
      const newHashCompare = await bcrypt.compare('admin123', hashedPassword);
      console.log('New hash comparison:', newHashCompare);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testPasswordComparison();