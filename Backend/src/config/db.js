const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    console.warn(
      '⚠️  [MongoDB] MONGO_URI is not set in Backend/.env. Server running without an active database connection.'
    );
    console.warn(
      '👉  Please set your MongoDB Atlas connection string in Backend/.env to enable database features.'
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB] Connected successfully to database: ${conn.connection.name} (Host: ${conn.connection.host})`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
