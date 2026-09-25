const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("Using Google DNS:", dns.getServers());
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 [Server] SnapFeed backend listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 [Server] Health check available at http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`💥 [Server] Unhandled Rejection: ${err.message}`);
    // Keep server running in dev or gracefully close on fatal error
  });

  process.on('uncaughtException', (err) => {
    console.error(`💥 [Server] Uncaught Exception: ${err.message}`);
  });
});


