const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/learnaid');
    const user = await User.findOne({ email: 'admin@learnaid.edu' }).select('+password');
    console.log('User:', user?.name);
    console.log('Email:', user?.email);
    console.log('Password hash length:', user?.password?.length);
    console.log('Password starts with $2:', user?.password?.startsWith('$2'));
    console.log('Full password hash:', user?.password);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();