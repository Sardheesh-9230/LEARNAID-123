const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔄 Testing MongoDB Atlas connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
})
.then(() => {
  console.log('✅ MongoDB Atlas connection successful!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Atlas connection failed:');
  console.error(error.message);
  process.exit(1);
});