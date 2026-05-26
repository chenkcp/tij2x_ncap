//where Express is configured.
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const frontendPublicDir = path.join(__dirname, "..", "public");
const frontendIndexFile = path.join(frontendPublicDir, "index.html");
const hasBuiltFrontend = fs.existsSync(frontendIndexFile);

const defaultFrontendUrl = "http://localhost:5001";
const frontendUrl = hasBuiltFrontend
  ? ""
  : (process.env.FRONTEND_URL || defaultFrontendUrl).replace(/\/$/, "");

const defaultCorsOrigin = hasBuiltFrontend
  ? `http://localhost:${process.env.PORT || 5000}`
  : frontendUrl;

if (hasBuiltFrontend) {
  console.log(`[Startup] Frontend build detected at ${frontendPublicDir}`);
  console.log("[Startup] Serving frontend static files from container on / and /assets/*");
} else {
  console.log(`[Startup] Frontend build not found at ${frontendPublicDir}`);
  console.log(`[Startup] Expecting separate frontend dev server at ${frontendUrl}`);
}

const corsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || defaultCorsOrigin)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configure CORS to allow frontend access
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint for AWS ALB / ECS
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
    const authErrorUrl = `${frontendUrl}/auth?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`;
    return res.redirect(authErrorUrl);
  }
  
  if (code) {
    console.log('✅ Authorization code received, redirecting to frontend');
    // Redirect to frontend with authorization code
    const authCodeUrl = `${frontendUrl}/auth?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
    return res.redirect(authCodeUrl);
  }
  
  console.warn('⚠️  No authorization code or error in callback');
  res.redirect(`${frontendUrl}/auth?error=invalid_callback`);
});

if (hasBuiltFrontend) {
  app.use((req, res, next) => {
    if (req.method === "GET" && (req.path === "/" || req.path === "/index.html")) {
      console.log("[Frontend] Serving frontend entry from container");
    }
    next();
  });

  // Serve built frontend assets when running as a single container.
  app.use(express.static(frontendPublicDir));

  // SPA fallback: return index.html for non-API GET routes.
  // Express 5 / path-to-regexp requires a named wildcard parameter.
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(frontendIndexFile);
  });
}

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