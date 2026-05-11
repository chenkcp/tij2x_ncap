import React from 'react';
import UserMenu from '../auth/UserMenu';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="header-wrap">
      <div>
        <h1>NextCapWeb</h1>
        <div className="alert-text">Alert: Make sure your selected Site is highlighted in RED</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <UserMenu />
      </div>
    </div>
  );
}