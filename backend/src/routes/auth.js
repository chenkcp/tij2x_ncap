const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Environment validation
const requiredEnvVars = ['OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// JWT helper functions
const createJWT = (userInfo) => {
  try {
    return jwt.sign({
      sub: userInfo.sub || userInfo.id || userInfo.email,
      email: userInfo.email,
      name: userInfo.name || userInfo.displayName,
      roles: userInfo.roles || ['user'],
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 hours
    }, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Failed to create JWT token');
  }
};

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const maskValue = (value, visible = 4) => {
  if (!value) return 'not provided';
  const text = String(value);
  if (text.length <= visible) return '*'.repeat(text.length);
  return `${text.slice(0, visible)}***`;
};

const logOAuthRequest = ({ label, url, method, headers, body }) => {
  console.log(`[OAuth][Outbound] ${label}`);
  console.log('[OAuth][Outbound] URL:', url);
  console.log('[OAuth][Outbound] Method:', method);
  console.log('[OAuth][Outbound] Headers:', headers);
  console.log('[OAuth][Outbound] Body:', body);
};

// POST /api/auth/token - Exchange authorization code for access token
router.post('/token', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Track all incoming token exchange requests
    console.log('🚀 TOKEN EXCHANGE REQUEST RECEIVED');
    console.log('📍 Request Timestamp:', new Date().toISOString());
    console.log('🔑 Authorization Code (first 10 chars):', code?.substring(0, 10) + '...');
    console.log('🔗 State Parameter:', state || 'None');
    console.log('📊 Request Headers:', req.headers);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!code) {
      console.error('❌ Missing authorization code in request');
      return res.status(400).json({ 
        success: false,
        error: 'Authorization code is required' 
      });
    }

    console.log('Exchanging authorization code with HP OAuth...');
    console.log('Using CLIENT_ID:', process.env.OAUTH_CLIENT_ID);
    console.log('CLIENT_SECRET length:', process.env.OAUTH_CLIENT_SECRET?.length);
    console.log('Redirect URI:', process.env.OAUTH_REDIRECT_URI);
    
    // Make request to HP OAuth server WITH client secret
    const tokenUrl = 'https://login-itg.external.hp.com/as/token.oauth2';
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.OAUTH_REDIRECT_URI // 'http://localhost:5000/nextcapweb/auth/callback'
    });

    logOAuthRequest({
      label: 'Token Exchange (authorization_code)',
      url: tokenUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: {
        grant_type: 'authorization_code',
        code: maskValue(code, 10),
        client_id: maskValue(process.env.OAUTH_CLIENT_ID, 8),
        client_secret: maskValue(process.env.OAUTH_CLIENT_SECRET, 0),
        redirect_uri: process.env.OAUTH_REDIRECT_URI
      }
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenRequestBody
    });

    // Track authorization return from HP OAuth provider
    console.log('🔄 Authorization Return Tracking - Backend Token Exchange');
    console.log('📍 Timestamp:', new Date().toISOString());
    console.log('🌐 Remote OAuth Response Status:', tokenResponse.status, tokenResponse.statusText);
    console.log('📊 Response Headers:', Object.fromEntries(tokenResponse.headers.entries()));
    console.log('⏱️  Response Time:', tokenResponse.headers.get('date') || 'Not provided');
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ HP OAuth token exchange failed:', errorText);
      console.log('🔍 Failed request details:', {
        url: tokenResponse.url,
        status: tokenResponse.status,
        redirected: tokenResponse.redirected
      });
      return res.status(400).json({ 
        success: false,
        error: 'Token exchange failed',
        details: errorText
      });
    }

    const tokens = await tokenResponse.json();
    
    // Track successful token response
    console.log('✅ Authorization Return Success');
    console.log('🔑 Token received:', tokens.access_token ? 'Yes' : 'No');
    console.log('♻️  Refresh token received:', tokens.refresh_token ? 'Yes' : 'No');
    console.log('⏰ Expires in:', tokens.expires_in || 'Not specified');
    console.log('🎭 Token type:', tokens.token_type || 'Not specified');
    console.log('📏 Access token length:', tokens.access_token?.length || 0);
    
    if (!tokens.access_token) {
      console.error('HP OAuth response missing access_token:', tokens);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid token response from provider' 
      });
    }

    // Get user info from HP OAuth provider
    let userInfo = null;
    try {
      console.log('👤 Fetching user info from HP OAuth...');
      console.log('📍 Userinfo request timestamp:', new Date().toISOString());
      
      // Try multiple possible userinfo endpoints
      const userinfoEndpoints = [
        'https://login-itg.external.hp.com/idp/userinfo.openid'
      ];
      
      let userResponse = null;
      let successfulEndpoint = null;
      
      for (const endpoint of userinfoEndpoints) {
        try {
          console.log(`🔍 Trying userinfo endpoint: ${endpoint}`);
          logOAuthRequest({
            label: 'Userinfo Lookup',
            url: endpoint,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${maskValue(tokens.access_token, 12)}`
            },
            body: 'none'
          });

          userResponse = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
          });
          
          console.log(`📊 Response from ${endpoint}:`, userResponse.status, userResponse.statusText);
          
          if (userResponse.ok) {
            successfulEndpoint = endpoint;
            break;
          }
        } catch (endpointError) {
          console.log(`❌ Failed to reach ${endpoint}:`, endpointError.message);
          continue;
        }
      }
      
      if (userResponse && userResponse.ok && successfulEndpoint) {
        userInfo = await userResponse.json();
        console.log('✅ User info retrieved successfully from:', successfulEndpoint);
        console.log('📏 User info keys:', Object.keys(userInfo));
        console.log('📧 User email:', userInfo.email || 'Not provided');
        console.log('👤 User name:', userInfo.name || 'Not provided');
        console.log('🆔 User ID/sub:', userInfo.sub || 'Not provided');
      } else {
        console.warn('⚠️  All userinfo endpoints failed, trying to decode from access token...');
        
        // Fallback: Try to decode user info from the access token itself
        try {
          const jwt = require('jsonwebtoken');
          const decodedToken = jwt.decode(tokens.access_token);
          console.log('🔓 Decoded access token keys:', Object.keys(decodedToken || {}));
          
          if (decodedToken) {
            userInfo = {
              sub: decodedToken.sub || decodedToken.user_id || decodedToken.id,
              email: decodedToken.email || decodedToken.preferred_username || decodedToken.username,
              name: decodedToken.name || decodedToken.displayName || decodedToken.given_name
            };
            console.log('✅ Using user info from token:', userInfo);
          } else {
            throw new Error('Could not decode access token');
          }
        } catch (tokenDecodeError) {
          console.warn('❌ Failed to decode token:', tokenDecodeError.message);
          // Create minimal user info as final fallback
          userInfo = {
            sub: 'unknown',
            email: 'unknown@hp.com',
            name: 'HP User'
          };
        }
      }
    } catch (userError) {
      console.warn('Error fetching user info:', userError.message);
      userInfo = {
        sub: 'unknown',
        email: 'unknown@hp.com', 
        name: 'HP User'
      };
    }

    // Create your own JWT and return to frontend
    const jwtToken = createJWT(userInfo);
    
    console.log('✅ Successfully created JWT for user:', userInfo.email);
    console.log('🔐 AUTHENTICATION SUCCESS - User Email:', userInfo.email);
    console.log('👤 Authenticated User Name:', userInfo.name || 'Not provided');
    console.log('🆔 User ID:', userInfo.sub || 'Not provided');
    console.log('📅 Login Timestamp:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json({
      success: true,
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 28800, // 8 hours
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name
      }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /api/auth/token/refresh - Refresh access token
router.post('/token/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    console.log('Refreshing access token with HP OAuth...');
    
    // Backend makes request to HP with client secret
    const refreshUrl = 'https://login-itg.external.hp.com/as/token.oauth2';
    const refreshRequestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET
    });

    logOAuthRequest({
      label: 'Token Refresh (refresh_token)',
      url: refreshUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: {
        grant_type: 'refresh_token',
        refresh_token: maskValue(refresh_token, 10),
        client_id: maskValue(process.env.OAUTH_CLIENT_ID, 8),
        client_secret: maskValue(process.env.OAUTH_CLIENT_SECRET, 0)
      }
    });

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: refreshRequestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HP OAuth refresh failed:', errorText);
      return res.status(400).json({ 
        error: 'Token refresh failed',
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.access_token) {
      return res.status(400).json({ error: 'Invalid refresh response from provider' });
    }

    // Get updated user info and create new JWT
    let userInfo = null;
    try {
      logOAuthRequest({
        label: 'Refresh Flow Userinfo Lookup',
        url: 'https://login-itg.external.hp.com/as/userinfo.oauth2',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${maskValue(data.access_token, 12)}`
        },
        body: 'none'
      });

      const userResponse = await fetch('https://login-itg.external.hp.com/as/userinfo.oauth2', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      userInfo = userResponse.ok ? await userResponse.json() : { sub: 'unknown', email: 'unknown@hp.com', name: 'HP User' };
    } catch {
      userInfo = { sub: 'unknown', email: 'unknown@hp.com', name: 'HP User' };
    }

    const newJwtToken = createJWT(userInfo);
    
    res.json({ 
      access_token: newJwtToken,
      token_type: 'Bearer',
      expires_in: 28800,
      refresh_token: data.refresh_token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/auth/verify - Verify JWT token validity
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyJWT(token);
    
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    res.json({
      success: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        roles: decoded.roles
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;