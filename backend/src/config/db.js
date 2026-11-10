import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

import mongoose from 'mongoose';

mongoose.set('bufferTimeoutMS', 30000);

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database. Will retry automatically…');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database.');
});

export const connectDB = async () => {
  const directCosmosUri = 'mongodb://dbuser008u4l:Dilipdon559%40@fc-e5cc78b10823-000.global.mongocluster.cosmos.azure.com:10260/jobdashboard?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000';
  const primaryUri = process.env.MONGODB_URI || directCosmosUri;
  const fallbackUri = 'mongodb://127.0.0.1:27017/jobdashboard';

  // Shared connection options tuned for Azure Cosmos DB / Atlas
  const connectionOptions = {
    serverSelectionTimeoutMS: 15000,   // 15s to find a server
    socketTimeoutMS: 60000,            // 60s socket idle timeout
    connectTimeoutMS: 15000,           // 15s TCP connect timeout
    maxPoolSize: 10,                   // max concurrent connections
    minPoolSize: 2,                    // keep at least 2 open
    heartbeatFrequencyMS: 10000,       // ping every 10s to keep alive
    retryWrites: false,                // required by Cosmos DB
    retryReads: true,
  };

  try {
    const conn = await mongoose.connect(primaryUri, connectionOptions);
    console.log(`[MongoDB] Connected: ${conn.connection.host}:${conn.connection.port || ''}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[MongoDB] Primary connection failed: ${primaryErr.message}`);

    // If SRV lookup failed on Windows, try direct cluster node hostname
    if (primaryUri.startsWith('mongodb+srv://')) {
      try {
        console.log(`[MongoDB] Trying direct Cosmos DB node connection...`);
        const directConn = await mongoose.connect(directCosmosUri, connectionOptions);
        console.log(`[MongoDB] Connected directly to Cosmos DB: ${directConn.connection.host}/${directConn.connection.name}`);
        return directConn;
      } catch (directErr) {
        console.warn(`[MongoDB] Direct Cosmos DB connection failed: ${directErr.message}`);
      }
    }

    // Attempt fallback to local MongoDB
    try {
      console.log(`[MongoDB] Attempting fallback to local MongoDB (${fallbackUri})...`);
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`[MongoDB] Connected via fallback to local MongoDB: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
      return fallbackConn;
    } catch (fallbackErr) {
      console.warn(`[MongoDB] Local MongoDB fallback not available: ${fallbackErr.message}`);
    }

    console.error(`[MongoDB] Warning: Could not establish initial database connection. Server will stay online and retry.`);
  }
};
