const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const subjectRoutes = require('./routes/subjects');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Connect to database
connectDB();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LearnAIA API',
      version: '1.0.0',
      description: 'Educational Management Platform API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.learnaia.com' : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LearnAIA API is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ████████████████████████████████████████████████████████
  █                                                      █
  █         🎓 LearnAIA Backend Server Started           █
  █                                                      █
  █         Environment: ${process.env.NODE_ENV || 'development'.padEnd(20)}       █
  █         Port: ${PORT.toString().padEnd(30)}           █
  █         Database: ${process.env.MONGODB_URI ? 'Connected' : 'Local'.padEnd(20)}       █
  █                                                      █
  █         API Documentation: http://localhost:${PORT}/api-docs █
  █         Health Check: http://localhost:${PORT}/health      █
  █                                                      █
  ████████████████████████████████████████████████████████
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;