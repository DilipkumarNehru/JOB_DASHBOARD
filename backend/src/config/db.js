import mongoose from 'mongoose';
mongoose.set('bufferTimeoutMS', 8000);

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database.');
});

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://job_dashboard_app:lKcFNoHQBTwnK0wtkOCEM3Vd0e7aGK03@127.0.0.1:27018/job_dashboard?authSource=job_dashboard';
  const fallbackUri = 'mongodb://127.0.0.1:27017/job_dashboard';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}:${conn.connection.port || ''}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[MongoDB] Primary connection failed (${primaryUri}): ${primaryErr.message}`);

    // If primary was the SSH tunnel (27018), try local mongo (27017)
    if (primaryUri.includes('27018')) {
      try {
        console.log(`[MongoDB] Attempting fallback to local MongoDB (${fallbackUri})...`);
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 4000,
        });
        console.log(`[MongoDB] Connected via fallback to local MongoDB: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackErr) {
        console.error(`[MongoDB] Fallback connection also failed: ${fallbackErr.message}`);
      }
    }

    console.error(`[MongoDB] Fatal: Could not establish MongoDB connection. Please ensure MongoDB or the SSH tunnel (port 27018) is running.`);
    process.exit(1);
  }
};
