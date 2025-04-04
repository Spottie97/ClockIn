const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Fix for Mongoose deprecation warning
mongoose.set('strictQuery', false);

// Import routes
const authRoutes = require('./routes/auth');
const shiftRoutes = require('./routes/shifts');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const projectRoutes = require('./routes/projects');

// Create Express app
const app = express();

// Security middleware - disable for development to avoid CORS issues
// app.use(helmet());

// CORS configuration - simplified for development
app.use(cors());

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to authentication routes
app.use('/api/auth', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clockin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/projects', projectRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Invalid token', 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const { findAvailablePort } = require('./utils/portFinder');

const startServer = async () => {
  try {
    const preferredPort = parseInt(process.env.PORT || '5000');
    const port = await findAvailablePort(preferredPort);
    
    // Update the PORT in the environment for other parts of the app
    process.env.PORT = port.toString();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing