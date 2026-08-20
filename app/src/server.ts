import { initializeApp } from './app';
import { config } from './config';

async function start() {
  try {
    const app = await initializeApp();
    
    const server = app.listen(config.APP_PORT, () => {
      console.log(`🚀 Server running on port ${config.APP_PORT} (${config.APP_ENV})`);
      console.log(`📝 Setup: http://localhost:${config.APP_PORT}/setup`);
      console.log(`🔐 Admin: http://localhost:${config.APP_PORT}/admin/login`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed');
        process.exit(0);
      });
      
      // Force close after 10s
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
