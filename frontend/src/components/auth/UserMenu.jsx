import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserMenu = () => {
  const { user, logout, isTokenValid } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const isTokenExpiringSoon = () => {
    if (!user.exp) return false;
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = user.exp - currentTime;
    // Show warning if less than 30 minutes remaining
    return timeUntilExpiry < 1800 && timeUntilExpiry > 0;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#333'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <span>{user.name || user.email}</span>
        <span style={{ 
          marginLeft: '4px',
          transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </button>

      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '200px'
          }}
        >
          <div style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {user.name || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {user.email}
            </div>
            {user.roles && user.roles.length > 0 && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Roles: {user.roles.join(', ')}
              </div>
            )}
          </div>

          {/* Token status */}
          <div style={{ padding: '8px 12px' }}>
            <div style={{ 
              fontSize: '11px',
              color: isTokenValid() 
                ? isTokenExpiringSoon() 
                  ? '#ff6b35' 
                  : '#28a745'
                : '#dc3545',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isTokenValid() 
                  ? isTokenExpiringSoon() 
                    ? '#ff6b35' 
                    : '#28a745'
                  : '#dc3545'
              }} />
              {isTokenValid() 
                ? isTokenExpiringSoon() 
                  ? 'Session expires soon'
                  : 'Session active'
                : 'Session expired'
              }
            </div>
            {user.exp && (
              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                Expires: {new Date(user.exp * 1000).toLocaleDateString()} {new Date(user.exp * 1000).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #eee' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc3545'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default UserMenu;