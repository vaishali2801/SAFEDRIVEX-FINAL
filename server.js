const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');
const { startMonitoring } = require('./sockets/monitoringSocket');
const app = require('./app');

const server = http.createServer(app);

const PORT = env.port;

const startServer = async () => {
  try {
    await connectDB();

    initializeSocket(server);
    startMonitoring();

    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    SafeDriveX Backend API                    ║
║              AI-Powered Road Safety & Reward System          ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                                 ║
║  Environment: ${env.nodeEnv}                                    ║
║  MongoDB: Connected                                          ║
║  Socket.IO: Enabled                                          ║
║                                                              ║
║  Demo Credentials:                                           ║
║  Driver: demo@safedrivex.com / Demo@123                     ║
║  Admin:  admin@safedrivex.com / Admin@123                   ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  gracefulShutdown();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown();
});

startServer();