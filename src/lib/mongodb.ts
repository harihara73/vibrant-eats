import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI === 'YOUR_CONNECTION_STRING') {
  throw new Error('Please configure MONGODB_URI in .env.local with your Atlas connection string.');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 5000, // Reduced to 5s for diagnostics
      serverSelectionTimeoutMS: 5000,
    };

    const maskedUri = MONGODB_URI!.replace(/:([^:@]{1,})@/, ':****@');
    console.log(`--- Connecting to MongoDB [${new Date().toLocaleTimeString()}] ---`);
    console.log(`URI: ${maskedUri}`);

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully!");
      return mongoose;
    }).catch((err) => {
      console.error("❌ MongoDB Connection Failed:", err.message);
      if (err.message.includes('ETIMEDOUT')) {
        console.error("🔎 Possible Cause: Your IP is not whitelisted in MongoDB Atlas.");
      }
      cached.promise = null; // Reset promise on failure
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
