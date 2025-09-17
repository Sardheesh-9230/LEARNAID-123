const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    // Provide user-friendly duplicate error messages
    switch (field) {
      case 'email':
        message = `Email '${value}' is already registered`;
        break;
      case 'studentId':
        message = `Student ID '${value}' already exists`;
        break;
      case 'code':
        message = `Code '${value}' is already in use`;
        break;
      case 'name':
        message = `Name '${value}' already exists`;
        break;
      default:
        message = `Duplicate field value: ${field}`;
    }

    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    error = {
      message: messages.join('. '),
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      statusCode: 400
    };
  }

  // Rate limiting error
  if (err.type === 'entity.too.large') {
    error = {
      message: 'Request entity too large',
      statusCode: 413
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

module.exports = errorHandler;