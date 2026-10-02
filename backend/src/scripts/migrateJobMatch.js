/**
 * Migration: Update JobMatch collection index
 * 
 * Changes:
 * 1. Drop old unique index (userId, jobId) 
 * 2. Create new unique index (userId, jobId, resumeId)
 * 3. Remove duplicate records created by the old schema
 * 
 * Run: node src/scripts/migrateJobMatch.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const collection = db.collection('jobmatches');

  // 1. List existing indexes
  const indexes = await collection.indexes();
  console.log('Existing indexes:', indexes.map(i => ({ name: i.name, key: i.key })));

  // 2. Drop old unique index on (userId, jobId) if it exists
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    // Old index had userId + jobId but NOT resumeId
    if (
      keys.includes('userId') &&
      keys.includes('jobId') &&
      !keys.includes('resumeId') &&
      idx.unique
    ) {
      console.log(`Dropping old index: ${idx.name}`);
      try {
        await collection.dropIndex(idx.name);
        console.log(`Dropped: ${idx.name}`);
      } catch (err) {
        console.warn(`Could not drop ${idx.name}:`, err.message);
      }
    }
  }

  // 3. Also drop partial duplicates — keep only the first record for each (userId, jobId)
  // when resumeId is null/undefined (records from before the multi-resume update)
  const nullResumeDocs = await collection.find({ resumeId: { $exists: false } }).toArray();
  console.log(`Found ${nullResumeDocs.length} records with no resumeId`);

  for (const doc of nullResumeDocs) {
    // Try to find the associated primary resume for this user
    const Resume = mongoose.connection.db.collection('resumes');
    const primaryResume = await Resume.findOne({ userId: doc.userId, isPrimary: true });
    
    if (primaryResume) {
      // Update the record to have a resumeId
      await collection.updateOne(
        { _id: doc._id },
        { $set: { resumeId: primaryResume._id, resumeName: primaryResume.resumeName || primaryResume.originalFileName || primaryResume.originalName } }
      );
      console.log(`Updated JobMatch ${doc._id} with resumeId ${primaryResume._id}`);
    } else {
      // No primary resume — delete this orphan record
      await collection.deleteOne({ _id: doc._id });
      console.log(`Deleted orphan JobMatch ${doc._id}`);
    }
  }

  // 4. Create new compound unique index
  try {
    await collection.createIndex(
      { userId: 1, jobId: 1, resumeId: 1 },
      { unique: true, name: 'userId_1_jobId_1_resumeId_1' }
    );
    console.log('Created new unique index: (userId, jobId, resumeId)');
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log('Index already exists — skipping creation');
    } else {
      console.error('Failed to create index:', err.message);
    }
  }

  // 5. Create performance indexes
  try {
    await collection.createIndex({ userId: 1, resumeId: 1, overallMatch: -1 });
    console.log('Created performance index: (userId, resumeId, overallMatch)');
  } catch (err) {
    console.log('Performance index already exists or failed:', err.message);
  }

  console.log('\nMigration complete!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
