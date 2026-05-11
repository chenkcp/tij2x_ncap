import axios from 'axios';

// OAuth Configuration
const OAUTH_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_OAUTH_CLIENT_ID || 'ca8b6338-49cb-44b8-a97f-8bec188976a2',
  REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5001/nextcapweb/auth/callback',
  LOGIN_URL: import.meta.env.VITE_LOGIN_URL || 'https://login-itg.external.hp.com/as/authorization.oauth2',
  TOKEN_URL: import.meta.env.VITE_TOKEN_URL || 'http://localhost:5000/api/auth/token',
  SCOPE: 'openid profile email',
  RESPONSE_TYPE: 'code'
};

// Set default axios authorization header
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Clear axios authorization header
export const clearAuthToken = () => {
  delete axios.defaults.headers.common['Authorization'];
};

// Generate OAuth login URL
export const getLoginUrl = (state = null) => {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.CLIENT_ID,
    redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
    response_type: OAUTH_CONFIG.RESPONSE_TYPE,
    scope: OAUTH_CONFIG.SCOPE,
    ...(state && { state })
  });

  return `${OAUTH_CONFIG.LOGIN_URL}?${params.toString()}`;
};

// Redirect to OAuth provider
export const redirectToLogin = (returnUrl = null) => {
  // Store return URL for after login
  if (returnUrl) {
    sessionStorage.setItem('authReturnUrl', returnUrl);
  }

  const state = returnUrl ? btoa(JSON.stringify({ returnUrl })) : null;
  window.location.href = getLoginUrl(state);
};

// Prevent duplicate token exchange requests
let inProgressTokenRequest = null;
let processedAuthCodes = new Map(); // Store auth code and its result

// Exchange authorization code for access token
export const getToken = async (authorizationCode, state = null) => {
  try {
    // Check if this authorization code was already successfully processed
    if (processedAuthCodes.has(authorizationCode)) {
      console.log('✅ Authorization code already processed successfully, returning cached result');
      return processedAuthCodes.get(authorizationCode);
    }

    // Check if a token exchange is already in progress
    if (inProgressTokenRequest) {
      console.log('⏳ Token exchange already in progress, waiting for completion...');
      return inProgressTokenRequest;
    }

    // Mark this code as being processed
    console.log('🔄 Frontend Token Exchange Tracking');
    console.log('📍 Timestamp:', new Date().toISOString());
    console.log('💫 Sending request to backend...');
    console.log('🎯 Target URL:', OAUTH_CONFIG.TOKEN_URL);
    console.log('🔑 Authorization code (first 10 chars):', authorizationCode?.substring(0, 10) + '...');
    console.log('🔗 State parameter:', state || 'None');
    
    // Create and store the request promise
    inProgressTokenRequest = axios.post(OAUTH_CONFIG.TOKEN_URL, {
      code: authorizationCode,
      ...(state && { state })
    }).then(response => {
      console.log('✅ Backend response received');
      console.log('📊 Response status:', response.status);
      console.log('🎆 Response data keys:', Object.keys(response.data));
      console.log('🔑 Access token received from backend:', response.data.access_token ? 'Yes' : 'No');

      const result = response.data.success ? {
        success: true,
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token
      } : {
        success: false,
        error: response.data.error || 'Token exchange failed'
      };

      // Cache successful result for duplicate prevention
      if (result.success) {
        processedAuthCodes.set(authorizationCode, result);
        console.log('💾 Cached successful token exchange result');
      }
      
      return result;
    }).catch(error => {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to exchange authorization code'
      };
    }).finally(() => {
      // Clear the in-progress flag
      inProgressTokenRequest = null;
    });

    return inProgressTokenRequest;

  } catch (error) {
    // Clear flags on error
    inProgressTokenRequest = null;
    console.error('Unexpected error in getToken:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during token exchange'
    };
  }
};

// Refresh access token via backend
export const refreshToken = async (refreshToken) => {
  try {
    console.log('Sending refresh token to backend...');
    
    const response = await axios.post(`${OAUTH_CONFIG.TOKEN_URL}/refresh`, {
      refresh_token: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check if backend returned success 
    if (response.data && response.data.access_token) {
      return {
        success: true,
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token
      };
    } else {
      throw new Error(response.data?.error || 'Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to refresh token'
    };
  }
};

// Logout from OAuth provider (if supported)
export const logoutFromProvider = () => {
  const logoutUrl = import.meta.env.VITE_LOGOUT_URL;
  if (logoutUrl) {
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.CLIENT_ID,
      post_logout_redirect_uri: window.location.origin
    });
    window.location.href = `${logoutUrl}?${params.toString()}`;
  }
};

// Validate current session with backend
export const validateSession = async () => {
  try {
    const response = await axios.get('/api/auth/validate');
    return response.data.success;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

// Parse state parameter from OAuth callback
export const parseOAuthState = (stateParam) => {
  if (!stateParam) return null;
  
  try {
    return JSON.parse(atob(stateParam));
  } catch (error) {
    console.error('Error parsing OAuth state:', error);
    return null;
  }
};

// Get return URL after successful login
export const getReturnUrl = (stateParam = null) => {
  // First check URL state parameter
  if (stateParam) {
    const state = parseOAuthState(stateParam);
    if (state?.returnUrl) {
      return state.returnUrl;
    }
  }
  
  // Fall back to localStorage
  const returnUrl = sessionStorage.getItem('authReturnUrl');
  sessionStorage.removeItem('authReturnUrl');
  
  return returnUrl || '/site/CJASite_1/home';
};

export default {
  getLoginUrl,
  redirectToLogin,
  getToken,
  refreshToken,
  validateSession,
  logoutFromProvider,
  parseOAuthState,
  getReturnUrl,
  setAuthToken,
  clearAuthToken
};