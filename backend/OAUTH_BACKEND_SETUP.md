# Backend OAuth Implementation Guide

This guide shows how to implement the required OAuth endpoints for the NextCap Web authentication system.

## Required Backend Endpoints

### 1. POST /api/auth/token

Exchange authorization code for JWT access token:

```javascript
// Example Express.js implementation
app.post('/api/auth/token', async (req, res) => {
  try {
    const { grant_type, code, client_id, redirect_uri, refresh_token } = req.body;
    
    if (grant_type === 'authorization_code') {
      // Exchange authorization code for token with OAuth provider
      const tokenResponse = await fetch('https://your-oauth-provider.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
          redirect_uri
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Get user info from OAuth provider
        const userResponse = await fetch('https://your-oauth-provider.com/userinfo', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();
        
        // Create your own JWT with user data
        const jwtToken = jwt.sign({
          sub: userData.sub || userData.id,
          email: userData.email,
          name: userData.name,
          roles: userData.roles || ['user'], // Add role handling
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 hours
        }, process.env.JWT_SECRET);
        
        res.json({
          access_token: jwtToken,
          token_type: 'Bearer',
          expires_in: 28800, // 8 hours
          refresh_token: tokenData.refresh_token
        });
      } else {
        res.status(400).json({ error: 'invalid_grant' });
      }
      
    } else if (grant_type === 'refresh_token') {
      // Handle refresh token flow
      const refreshResponse = await fetch('https://your-oauth-provider.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token,
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET
        })
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        // Create new JWT
        const userResponse = await fetch('https://your-oauth-provider.com/userinfo', {
          headers: { 'Authorization': `Bearer ${refreshData.access_token}` }
        });
        const userData = await userResponse.json();
        
        const newJwtToken = jwt.sign({
          sub: userData.sub || userData.id,
          email: userData.email,
          name: userData.name,
          roles: userData.roles || ['user'],
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8)
        }, process.env.JWT_SECRET);
        
        res.json({
          access_token: newJwtToken,
          token_type: 'Bearer',
          expires_in: 28800,
          refresh_token: refreshData.refresh_token
        });
      } else {
        res.status(400).json({ error: 'invalid_grant' });
      }
    } else {
      res.status(400).json({ error: 'unsupported_grant_type' });
    }
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});
```

### 2. GET /api/auth/verify

Verify JWT token validity:

```javascript
const jwt = require('jsonwebtoken');

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  // Token is already verified by middleware
  res.json({
    success: true,
    user: req.user
  });
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (token == null) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}
```

## Environment Variables

Add these to your backend `.env` file:

```env
# OAuth Provider Configuration
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_PROVIDER_TOKEN_URL=https://your-company-oneuid.com/token
OAUTH_PROVIDER_USERINFO_URL=https://your-company-oneuid.com/userinfo

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-signing-key
JWT_EXPIRES_IN=8h

# CORS Configuration (if needed)
FRONTEND_URL=http://localhost:5001
```

## Required Dependencies

Install these packages in your backend:

```bash
npm install jsonwebtoken express cors dotenv
```

## CORS Configuration

Enable CORS for OAuth callbacks:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true
}));
```

## Protected Route Middleware

Create reusable authentication middleware:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
```

Usage in routes:
```javascript
const { requireAuth, requireRole } = require('./middleware/auth');

// Protected route
app.get('/api/products', requireAuth, (req, res) => {
  // Access req.user for authenticated user data
});

// Admin-only route  
app.post('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  // Admin functionality
});
```

## Testing the Integration

1. **Test token exchange**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "code": "test_auth_code",
       "client_id": "your_client_id",
       "redirect_uri": "http://localhost:5001/nextcapweb/callback"
     }'
   ```

2. **Test token verification**:
   ```bash
   curl -X GET http://localhost:5000/api/auth/verify \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
   ```

## Security Considerations

1. **Use HTTPS** in production for all OAuth flows
2. **Validate redirect_uri** to prevent authorization code interception
3. **Implement state parameter** to prevent CSRF attacks
4. **Rotate refresh tokens** for better security
5. **Set appropriate CORS headers** for production
6. **Use secure JWT secrets** (complex, 256-bit minimum)
7. **Implement rate limiting** on authentication endpoints

## OAuth Provider Examples

### For Azure AD / Microsoft:
```env
OAUTH_PROVIDER_TOKEN_URL=https://login.microsoftonline.com/YOUR_TENANT/oauth2/v2.0/token
OAUTH_PROVIDER_USERINFO_URL=https://graph.microsoft.com/v1.0/me
```

### For Google:
```env
OAUTH_PROVIDER_TOKEN_URL=https://oauth2.googleapis.com/token  
OAUTH_PROVIDER_USERINFO_URL=https://www.googleapis.com/oauth2/v2/userinfo
```

### For custom OAuth provider:
```env
OAUTH_PROVIDER_TOKEN_URL=https://your-company-oneuid.com/oauth/token
OAUTH_PROVIDER_USERINFO_URL=https://your-company-oneuid.com/oauth/userinfo
```