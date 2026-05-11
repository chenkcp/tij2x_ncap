//where Express is configured.
const express = require("express");
const cors = require("cors");

const app = express();

// Configure CORS to allow frontend access
app.use(cors({
  origin: [
    'http://localhost:5001'
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api", require("./routes"));

// OAuth callback route - redirect to frontend with authorization code
app.get('/nextcapweb/auth/callback', (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  console.log('🔄 OAuth Callback Route Hit');
  console.log('📍 Full URL:', req.originalUrl);
  console.log('🎯 Query parameters:', req.query);
  
  if (error) {
    console.error('❌ OAuth error in callback:', error, error_description);
    // Redirect to frontend with error
    const frontendUrl = `http://localhost:5001/auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`;
    return res.redirect(frontendUrl);
  }
  
  if (code) {
    console.log('✅ Authorization code received, redirecting to frontend');
    // Redirect to frontend with authorization code
    const frontendUrl = `http://localhost:5001/auth?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
    return res.redirect(frontendUrl);
  }
  
  console.warn('⚠️  No authorization code or error in callback');
  res.redirect('http://localhost:5001/auth?error=invalid_callback');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = app;