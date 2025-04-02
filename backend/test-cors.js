const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'CORS test successful!' });
});

// Start server
const port = 5001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log(`Try accessing: http://localhost:${port}/test`);
});