/**
 * Custom CORS middleware to ensure proper handling of preflight requests
 */
const corsMiddleware = (req, res, next) => {
  // Allow requests from the frontend origin or any origin in development
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

module.exports = corsMiddleware;