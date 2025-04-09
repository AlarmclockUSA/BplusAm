require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3003;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3003', 'https://go.brilliantplus.app', '*'],
  credentials: true
}));

app.use(bodyParser.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Check for public directory and index.html
const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

// Validate paths exist before starting server
console.log(`Public directory path: ${publicDir}`);
console.log(`Index file path: ${indexPath}`);

if (!fs.existsSync(publicDir)) {
  console.error(`ERROR: Public directory not found at ${publicDir}`);
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

if (!fs.existsSync(indexPath)) {
  console.error(`ERROR: Index.html not found at ${indexPath}`);
}

// Serve static files from public directory with absolute path
app.use('/', express.static(path.join(__dirname, 'public')));

// Serve index.html for root route with explicit check
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log(`Attempting to serve index.html from: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log(`File exists, serving index.html`);
    res.sendFile(indexPath);
  } else {
    console.error(`ERROR: Could not find ${indexPath}`);
    // Create a simple HTML response
    res.send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Server Configuration Error</h1>
          <p>The application is having trouble finding the required files.</p>
          <p>Please contact support or try again later.</p>
          <p>Missing file: ${indexPath}</p>
        </body>
      </html>
    `);
  }
});

// Simple form submission endpoint
app.post('/submit-form', async (req, res) => {
  try {
    console.log('Form submission received:', req.body);
    
    // Generate ambassador ID
    const ambassadorId = 'amb_' + Math.random().toString(36).substr(2, 9);
    
    // Simulate a successful response
    res.json({
      success: true,
      ambassadorId: ambassadorId,
      redirectUrl: `/success.html?id=${ambassadorId}`
    });
  } catch (error) {
    console.error('Error processing form submission:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 