import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { clearAuthToken, logoutSession, verifySession } from '../services/auth';

const AuthContext = createContext();
const AUTH_TAB_MARKER = 'authTabActive';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from sessionStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  // const initializeAuth = () => {
  //   try {
  //     // const storedToken = sessionStorage.getItem('authToken');
  //     // const storedUser = sessionStorage.getItem('authUser');

  //     if (storedToken && storedUser) {
  //       const userData = JSON.parse(storedUser);
        
  //       // Check if token is still valid
  //       if (isTokenValid(storedToken)) {
  //         setToken(storedToken);
  //         setUser(userData);
  //         setIsAuthenticated(true);
  //         setAuthToken(storedToken); // Set axios default header
  //       } else {
  //         // Token expired, clear everything
  //         clearAuthData();
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error initializing auth:', error);
  //     clearAuthData();
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const initializeAuth = async () => {
    try {
      const hasTabSession = sessionStorage.getItem(AUTH_TAB_MARKER) === 'true';

      if (!hasTabSession) {
        try {
          await logoutSession();
        } catch {
          // Ignore logout failures during startup; the local tab state is still reset below.
        }
        clearAuthData();
        return;
      }

      const response = await verifySession();

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        clearAuthData();
      }
    } catch {
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const isTokenValid = (tokenToCheck) => {
    if (!tokenToCheck) return false;

    try {
      const decoded = jwtDecode(tokenToCheck);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired with 5 minute buffer
      return decoded.exp > (currentTime + 300);
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  const checkTokenExpiration = () => {
    // Cookie-backed auth is validated by /api/auth/verify during initialization.
    // The browser cannot inspect an HttpOnly cookie, so there is no frontend token to decode here.
    if (isAuthenticated && !token) {
      return true;
    }

    if (!token) {
      if (isAuthenticated) {
        logout(); // Auto logout if no token but marked as authenticated
      }
      return false;
    }

    const isValid = isTokenValid(token);
    if (!isValid && isAuthenticated) {
      logout(); // Auto logout on expired token
    }
    
    return isValid;
  };

  const login = (userData) => {
    try {
      // if (!isTokenValid(accessToken)) {
      //   throw new Error('Invalid or expired token');
      // }

      // const decoded = jwtDecode(accessToken);
      // const userData = {
      //   id: decoded.sub || decoded.user_id,
      //   email: decoded.email,
      //   name: decoded.name || decoded.preferred_username,
      //   roles: decoded.roles || [],
      //   exp: decoded.exp
      // };

      // // Store in sessionStorage
      // sessionStorage.setItem('authToken', accessToken);
      // sessionStorage.setItem('authUser', JSON.stringify(userData));

      // // Update state
      // setToken(accessToken);
      sessionStorage.setItem(AUTH_TAB_MARKER, 'true');
      setUser(userData);
      setIsAuthenticated(true);
      
      // Set axios default header for future requests
      //setAuthToken(accessToken);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      clearAuthData();
      window.location.href = '/auth';
    }
  };

  const clearAuthData = () => {
    // Clear sessionStorage
    // sessionStorage.removeItem('authToken');
    // sessionStorage.removeItem('authUser');
    sessionStorage.removeItem(AUTH_TAB_MARKER);
    
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear axios header
    clearAuthToken();
  };

  const refreshUserData = () => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userData = {
          id: decoded.sub || decoded.user_id,
          email: decoded.email,
          name: decoded.name || decoded.preferred_username,
          roles: decoded.roles || [],
          exp: decoded.exp
        };
        
        setUser(userData);
        // sessionStorage.setItem('authUser', JSON.stringify(userData));
      } catch (error) {
        console.error('Error refreshing user data:', error);
        logout();
      }
    }
  };

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    checkTokenExpiration,
    refreshUserData,
    isTokenValid: () => isTokenValid(token)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};