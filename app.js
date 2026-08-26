const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const env = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const drivingRoutes = require('./routes/drivingRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const alertRoutes = require('./routes/alertRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const app = express();
console.log('generalLimiter:', typeof generalLimiter);
app.use(generalLimiter);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(hpp());

console.log('generalLimiter:', generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SafeDriveX API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/driving', drivingRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulation', simulationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;