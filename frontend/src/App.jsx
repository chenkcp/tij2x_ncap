import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductLookupPage from './pages/ProductLookupPage';
import ProductAddPage from './pages/ProductAddPage';
import InkWeightEditPage from './pages/InkWeightEditPage';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/site/CJASite_1/home" replace />} />
      <Route path="/site/:siteCode" element={<AppLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="list/product-lookup" element={<ProductLookupPage />} />
        <Route path="add/product-ref" element={<ProductAddPage />} />
        <Route path="edit/inkweight" element={<InkWeightEditPage />} />
      </Route>
    </Routes>
  );
}