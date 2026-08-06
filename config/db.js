const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[NaijaSafe] MONGO_URI is not set — alerts will not persist.');
    return null;
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[NaijaSafe] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('[NaijaSafe] MongoDB connection error (server kept alive):', err.message);
    return null;
  }
}

module.exports = connectDB;
