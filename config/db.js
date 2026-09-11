const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    console.log('MongoDB URI exists:', !!env.mongoUri);

    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;