// Replace entire frontend/src/pages/HomePage.jsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSiteInfo } from '../services/api';

export default function HomePage() {
  const { siteCode } = useParams();
  const [siteInfo, setSiteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (siteCode) {
      loadSiteInfo();
    }
  }, [siteCode]);

  const loadSiteInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSiteInfo(siteCode);
      setSiteInfo(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading site info:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading site information...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Site Information</h2>
        <div style={{ color: 'red', padding: '10px', backgroundColor: '#fee' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome to {siteCode}</h2>
      <p>Select a site tab and use the left menu to list, add, or edit data.</p>
      
      {siteInfo && (
        <div style={{ marginTop: '20px' }}>
          <h3>Current Site Configuration</h3>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            fontFamily: 'monospace'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong>Site Code:</strong> {siteInfo.siteCode}
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <h4>Product Database:</h4>
              <div style={{ paddingLeft: '20px' }}>
                <div><strong>Name:</strong> {siteInfo.connectionInfo.productDb.name}</div>
                <div><strong>Client:</strong> {siteInfo.connectionInfo.productDb.client}</div>
                <div><strong>Configured:</strong> {siteInfo.connectionInfo.productDb.configured ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            <div>
              <h4>NextCap Database:</h4>
              <div style={{ paddingLeft: '20px' }}>
                <div><strong>Name:</strong> {siteInfo.connectionInfo.nextcapDb.name}</div>
                <div><strong>Client:</strong> {siteInfo.connectionInfo.nextcapDb.client}</div>
                <div><strong>Configured:</strong> {siteInfo.connectionInfo.nextcapDb.configured ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#666' 
          }}>
            * Connection strings are masked for security
          </div>
        </div>
      )}
    </div>
  );
}