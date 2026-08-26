require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/safedrivex',
  jwtSecret: process.env.JWT_SECRET || 'safedrivex-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};