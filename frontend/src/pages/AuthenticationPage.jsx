import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { redirectToLogin, getToken, getReturnUrl } from '../services/auth';

const AuthenticationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tokenExchangeAttempted, setTokenExchangeAttempted] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to appropriate page
    if (isAuthenticated && !authLoading) {
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      const targetUrl = returnUrl ? decodeURIComponent(returnUrl) : '/site/CJASite_1/home';
      navigate(targetUrl, { replace: true });
      return;
    }

    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    if (error) {
      // OAuth provider returned an error
      setError(`Authentication failed: ${errorDescription || error}`);
      setLoading(false);
      return;
    }

    if (authCode && !tokenExchangeAttempted) {
      // Handle OAuth callback only once
      setTokenExchangeAttempted(true);
      handleOAuthCallback(authCode, state);
    } else if (!authCode) {
      // Regular auth page load, check for cached token expiration
      validateCachedToken();
    }
  }, [isAuthenticated, authLoading, location.search, navigate, tokenExchangeAttempted]);

  const validateCachedToken = () => {
    const cachedToken = sessionStorage.getItem('authToken');
    if (cachedToken) {
      setMessage('Validating existing session...');
      // The useAuth hook will automatically validate the token
      // If invalid, the user will be logged out automatically
    }
    setLoading(false);
  };

  const handleOAuthCallback = async (authCode, state) => {
    setLoading(true);
    setError('');
    setMessage('Processing authentication...');

    try {
      // Clear URL parameters to prevent reuse
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.delete('code');
      currentUrl.searchParams.delete('state');
      window.history.replaceState({}, '', currentUrl.toString());
      
      // Track authorization return from remote OAuth provider
      console.log('🔄 Authorization Return Tracking - Frontend Callback');
      console.log('📍 Timestamp:', new Date().toISOString());
      console.log('🎯 Authorization Code received:', authCode ? 'Yes' : 'No');
      console.log('📝 Auth Code (first 10 chars):', authCode?.substring(0, 10) + '...');
      console.log('🔗 State parameter:', state || 'None');
      console.log('📊 URL Search params:', location.search);
      
      // Exchange authorization code for access token
      const tokenResponse = await getToken(authCode, state);

      if (tokenResponse.success) {
        // Login with the access token
        const loginResult = login(tokenResponse.access_token);

        if (loginResult.success) {
          setMessage('Authentication successful! Redirecting...');
          
          // Get the return URL and redirect
          const returnUrl = getReturnUrl(state);
          
          setTimeout(() => {
            navigate(returnUrl, { replace: true });
          }, 1000);
        } else {
          setError(`Login failed: ${loginResult.error}`);
        }
      } else {
        setError(`Token exchange failed: ${tokenResponse.error}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError(`Authentication error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const returnUrl = new URLSearchParams(location.search).get('returnUrl');
    const targetReturnUrl = returnUrl ? decodeURIComponent(returnUrl) : location.pathname;
    
    setMessage('Redirecting to company login...');
    redirectToLogin(targetReturnUrl);
  };

  const isCallback = new URLSearchParams(location.search).has('code');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Company Logo */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#333',
            fontSize: '24px',
            margin: '0 0 10px 0'
          }}>
            NextCap Web
          </h1>
          <p style={{ 
            color: '#666',
            margin: 0,
            fontSize: '14px'
          }}>
            Manufacturing CPM Config Platform
          </p>
        </div>

        {authLoading || loading ? (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ color: '#666' }}>
              {message || 'Checking authentication...'}
            </p>
          </div>
        ) : error ? (
          <div>
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
            {!isCallback && (
              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                Try Again
              </button>
            )}
          </div>
        ) : message ? (
          <div>
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {message}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ 
              color: '#666',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              Please sign in with your company OneUID credentials to access the application.
            </p>
            
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Sign In with OneUID
            </button>

            <div style={{ 
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <p style={{ 
                fontSize: '12px',
                color: '#999',
                margin: 0
              }}>
                Secured by company Single Sign-On
              </p>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthenticationPage;