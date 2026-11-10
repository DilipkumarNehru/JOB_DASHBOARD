export const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', err.stack || err.message);

  // If response streaming has already started (e.g. GridFS pipe mid-stream),
  // we cannot send another HTTP response — delegate to Express's default error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered for '${field}'. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
  }

  // GridFS / MongoDB file not found
  if (err.code === 'ENOENT' || (err.message && err.message.toLowerCase().includes('filenot found'))) {
    statusCode = 404;
    message = 'File not found in storage. It may have been deleted or not fully uploaded.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
