import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://job_dashboard_app:lKcFNoHQBTwnK0wtkOCEM3Vd0e7aGK03@127.0.0.1:27018/job_dashboard?authSource=job_dashboard', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Error: ${error.message}`);
    process.exit(1);
  }
};
