import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthenticatedRoute from './components/auth/AuthenticatedRoute';
import AuthenticationPage from './pages/AuthenticationPage';
import HomePage from './pages/HomePage';
import ProductLookupPage from './pages/ProductLookupPage';
import ProductAddPage from './pages/ProductAddPage';
import InkWeightEditPage from './pages/InkWeightEditPage';
import NextcapDropdownEditPage from './pages/NextcapDropdownEditPage';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public authentication route */}
        <Route path="/auth" element={<AuthenticationPage />} />
        <Route path="/nextcapweb/auth/callback" element={<AuthenticationPage />} />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/site/CJASite_1/home" replace />} />
        
        {/* Protected routes */}
        <Route path="/site/:siteCode" element={
          <AuthenticatedRoute>
            <AppLayout />
          </AuthenticatedRoute>
        }>
          <Route path="home" element={<HomePage />} />
          <Route path="list/product-lookup" element={<ProductLookupPage />} />
          <Route path="add/product-ref" element={<ProductAddPage />} />
          <Route path="edit/inkweight" element={<InkWeightEditPage />} />
          <Route path="edit/nextcap-dropdown" element={<NextcapDropdownEditPage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </AuthProvider>
  );
}