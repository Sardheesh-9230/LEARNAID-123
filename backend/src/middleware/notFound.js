const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      subjects: '/api/subjects',
      analytics: '/api/analytics',
      upload: '/api/upload',
      docs: '/api-docs'
    }
  });
};

module.exports = notFound;