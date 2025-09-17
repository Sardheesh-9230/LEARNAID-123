const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true, // These options are no longer needed in mongoose 6+
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Mongoose connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;