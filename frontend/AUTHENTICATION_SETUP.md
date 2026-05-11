# Authentication System Setup Guide

This document explains how to set up and configure the OAuth-based authentication system for NextCap Web.

## 🔧 Installation

### 1. Install Required Dependencies

```bash
npm install jwt-decode axios
```

### 2. Environment Configuration

Copy the environment template and configure your OAuth settings:

```bash
cp .env.example .env
```

Edit `.env` with your OAuth provider details:

```env
# OAuth Configuration
REACT_APP_OAUTH_CLIENT_ID=your-nextcap-client-id
REACT_APP_LOGIN_URL=https://company-oneuid.com/oauth/authorize  
REACT_APP_TOKEN_URL=http://localhost:5000/api/auth/token
REACT_APP_LOGOUT_URL=https://company-oneuid.com/oauth/logout
REACT_APP_REDIRECT_URI=http://localhost:5001/nextcapweb/callback
```

## 🏗️ Architecture Overview

### Components Structure

```
src/
├── components/
│   └── auth/
│       ├── AuthenticatedRoute.jsx    # Route protection wrapper
│       └── UserMenu.jsx              # User dropdown menu
├── contexts/
│   └── AuthContext.jsx               # Authentication state management
├── pages/
│   └── AuthenticationPage.jsx        # Login & OAuth callback handler
├── services/
│   ├── auth.js                       # OAuth service functions
│   └── apiClient.js                  # Axios interceptors & API client
└── utils/
    └── jwtUtils.js                   # JWT token utilities
```

## 🔐 Authentication Flow

### 1. Login Process
1. User visits protected route → redirected to `/auth`
2. User clicks "Sign In with OneUID"
3. Redirected to company OAuth provider
4. After successful login, redirected to `/nextcapweb/callback`
5. Authorization code exchanged for JWT access token
6. Token stored in localStorage and axios defaults
7. User redirected to original destination

### 2. Token Management
- **JWT Access Token**: Stored in localStorage as 'authToken'
- **Refresh Token**: Stored in localStorage as 'refreshToken' (if provided)
- **Auto-refresh**: Axios interceptor handles token refresh on 401 responses
- **Expiration Check**: Multiple layers check token validity

## 🛡️ Protection Layers

### Route Level Protection
```jsx
// All routes wrapped with AuthenticatedRoute
<Route path="/site/:siteCode" element={
  <AuthenticatedRoute>
    <AppLayout />
  </AuthenticatedRoute>
}>
```

### API Request Protection
```jsx
// Automatic token injection via axios interceptors
import { get, post } from '../services/apiClient';
const response = await get('/api/data'); // Token automatically included
```

### Component Level Checks
```jsx
import { useIsAuthenticated, useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const isAuthenticated = useIsAuthenticated(); // Real-time auth check
  const { user, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {user.name}</div>;
};
```

## 🔄 Token Refresh Strategy

The system automatically handles token refresh:

1. **Automatic Detection**: 401 responses trigger refresh attempt
2. **Queue Management**: Multiple failed requests queued during refresh
3. **Fallback**: If refresh fails, user is redirected to login

## 🎯 Usage Examples

### Check Authentication in Components
```jsx
import { useIsAuthenticated, useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const isAuthenticated = useIsAuthenticated();
  const { user, checkTokenExpiration } = useAuth();
  
  useEffect(() => {
    // Manual expiration check
    const isValid = checkTokenExpiration();
    if (!isValid) {
      // Token expired, user will be auto-logged out
    }
  }, []);
  
  return (
    <div>
      {isAuthenticated ? (
        <h1>Welcome back, {user.name}!</h1>
      ) : (
        <div>Please authenticate</div>
      )}
    </div>
  );
};
```

### Make Protected API Calls
```jsx
import { get, post } from '../services/apiClient';

const DataService = {
  async fetchProducts() {
    try {
      const data = await get('/api/products');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async createProduct(productData) {
    return await post('/api/products', productData);
  }
};
```

### JWT Token Utilities
```jsx
import { isTokenValid, getUserFromToken, hasRole } from '../utils/jwtUtils';

// Check if user has admin role
const token = localStorage.getItem('authToken');
const isAdmin = hasRole(token, 'admin');

// Get user details from token
const user = getUserFromToken(token);
console.log(`User: ${user.name} (${user.email})`);

// Check token validity with custom buffer
const isValid = isTokenValid(token, 10); // 10 minute buffer
```

## ⚙️ Configuration Options

### OAuth Settings
- **CLIENT_ID**: Your OAuth application client ID
- **LOGIN_URL**: OAuth provider authorization endpoint
- **TOKEN_URL**: Your backend token exchange endpoint
- **REDIRECT_URI**: OAuth callback URL
- **LOGOUT_URL**: OAuth provider logout endpoint (optional)

### Token Behavior
- **Default Buffer**: 5 minutes before expiration
- **Warning Time**: Show warning 30 minutes before expiration
- **Auto-refresh**: Enabled with axios interceptors

### Session Management
- **Storage**: localStorage for persistence
- **Auto-logout**: On token expiration or validation failure
- **Return URL**: Preserved through authentication flow

## 🔍 Debugging

### Common Issues

1. **"Authentication required" loops**
   - Check token validity in browser DevTools
   - Verify OAuth configuration in `.env`
   - Check backend token endpoint

2. **Token refresh failures**
   - Verify refresh token is provided by OAuth server
   - Check backend refresh endpoint implementation
   - Monitor network tab for 401 responses

3. **Redirect loops**
   - Ensure `/auth` route is public (not wrapped in AuthenticatedRoute)
   - Check OAuth callback URL configuration

### Debug Tools

Enable authentication debugging:
```jsx
// Add to AuthContext.jsx for debugging
useEffect(() => {
  console.log('Auth State:', { isAuthenticated, user, token: !!token });
}, [isAuthenticated, user, token]);
```

Check token details in console:
```javascript
import { decodeToken } from '../utils/jwtUtils';
const token = localStorage.getItem('authToken');
console.log('Token payload:', decodeToken(token));
```

## 🚀 Backend Integration

Your backend should implement these endpoints:

### POST /api/auth/token
Exchange authorization code for access token
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code_here",
  "redirect_uri": "callback_url",
  "client_id": "your_client_id"
}
```

### POST /api/auth/token (refresh)
Refresh access token
```json
{
  "grant_type": "refresh_token", 
  "refresh_token": "refresh_token_here",
  "client_id": "your_client_id"
}
```

### GET /api/auth/verify
Verify current token validity
```json
{
  "success": true,
  "user": { "id": "...", "email": "..." }
}
```

## 📝 Security Considerations

1. **HTTPS Only**: Use HTTPS in production for all OAuth flows
2. **Secure Storage**: Consider httpOnly cookies for production
3. **Token Rotation**: Implement refresh token rotation
4. **Logout Cleanup**: Clear all auth data on logout
5. **CSRF Protection**: Implement state parameter in OAuth flow

## 🎛️ Customization

### Styling
- Modify `AuthenticationPage.jsx` for custom login UI
- Update `UserMenu.jsx` for different user menu layout
- Customize loading states in `AuthenticatedRoute.jsx`

### Token Structure
- Adjust JWT parsing in `jwtUtils.js` for your token format
- Modify user data extraction in `AuthContext.jsx`

### API Integration
- Update `apiClient.js` for your API response format
- Customize error handling strategies