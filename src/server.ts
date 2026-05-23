import http from 'http';
import app from './app';
import { config } from './config';
import { prisma } from './lib/prisma';
import { initializeSocket } from './sockets/socket';
import { startQuotaResetJob } from './jobs/quota-reset.job';
import { seedDatabase } from './utils/seeder';

const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

const startServer = async () => {
  try {
    // Verify database connection
    console.log('Connecting to MongoDB database...');
    await prisma.$connect();
    console.log('Successfully connected to MongoDB database.');

    // Seed database with initial providers and admin
    await seedDatabase();

    // Start background jobs
    startQuotaResetJob();

    // Listen on PORT
    server.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`  Server is running in ${config.nodeEnv} mode`);
      console.log(`  Listening on http://localhost:${config.port}`);
      console.log(`  Realtime Sockets enabled on port ${config.port}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  // Close socket connections
  io.close(() => {
    console.log('Socket.IO connections closed.');
  });

  // Close HTTP Server
  server.close(async () => {
    console.log('HTTP Server closed.');
    
    // Disconnect Prisma Client
    await prisma.$disconnect();
    console.log('Database connection disconnected.');
    
    process.exit(0);
  });

  // If server does not close in 10s, force exit
  setTimeout(() => {
    console.error('Force shutting down...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
