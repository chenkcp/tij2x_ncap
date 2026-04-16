import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { updateInkWeight } from '../services/api';

export default function InkWeightEditPage() {
  const { siteCode } = useParams();
  const [form, setForm] = useState({
    productNumber: '',
    newLsl: '',
    newUsl: '',
    updatedUser: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await updateInkWeight(siteCode, form);
      if (response.success) {
        setMessage('Ink weight updated successfully!');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Edit Ink Weight</h2>
      <p>Site: {siteCode}</p>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Product Number:</label>
          <input
            type="text"
            name="productNumber"
            value={form.productNumber}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>New LSL:</label>
          <input
            type="number"
            step="0.01"
            name="newLsl"
            value={form.newLsl}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>New USL:</label>
          <input
            type="number"
            step="0.01"
            name="newUsl"
            value={form.newUsl}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Updated By:</label>
          <input
            type="text"
            name="updatedUser"
            value={form.updatedUser}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Updating...' : 'Update Ink Weight'}
        </button>
      </form>
      
      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') ? '#c62828' : '#2e7d32',
          border: `1px solid ${message.includes('Error') ? '#ffcdd2' : '#c8e6c8'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
