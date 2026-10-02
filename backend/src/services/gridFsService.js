import mongoose from 'mongoose';
import fs from 'fs';

/**
 * Returns a GridFSBucket instance for the 'resumes' bucket.
 */
export const getBucket = () => {
  // mongoose.connection.db is available after DB connection
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
};

/**
 * Stores a file in GridFS.
 * @param {string} filePath - Path to the temporary file on disk.
 * @param {string} filename - Original filename to store.
 * @param {string} mimeType - MIME type of the file.
 * @param {string} userId - ID of the user uploading (for metadata).
 * @returns {Promise<ObjectId>} - The ObjectId of the stored file.
 */
export const storeFile = (filePath, filename, mimeType, userId) => {
  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    contentType: mimeType,
    metadata: { userId }
  });
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
};

/**
 * Deletes a GridFS file by its id.
 * @param {ObjectId} fileId
 */
export const deleteFile = (fileId) => {
  const bucket = getBucket();
  return bucket.delete(fileId);
};

/**
 * Streams a GridFS file to an Express response.
 * @param {ObjectId} fileId
 * @param {Response} res
 * @param {string} disposition - 'inline' or 'attachment'
 */
export const streamFile = (fileId, res, disposition = 'inline') => {
  const bucket = getBucket();
  // Caller can set appropriate headers before calling this
  bucket.openDownloadStream(fileId).pipe(res);
};
