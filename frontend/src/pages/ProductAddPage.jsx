import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { createProduct } from '../services/api';

export default function ProductAddPage() {
  const { siteCode } = useParams();
  const [form, setForm] = useState({
    productNumber: '',
    productName: '',
    familyCode: '',
    lineType: '',
    source: ''
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
      const response = await createProduct(siteCode, form);
      if (response.success) {
        setMessage('Product created successfully!');
        // Reset form
        setForm({
          productNumber: '',
          productName: '',
          familyCode: '',
          lineType: '',
          source: ''
        });
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Add New Product</h2>
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
          <label style={{ display: 'block', marginBottom: '5px' }}>Product Name:</label>
          <input
            type="text"
            name="productName"
            value={form.productName}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Family Code:</label>
          <input
            type="text"
            name="familyCode"
            value={form.familyCode}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Line Type:</label>
          <input
            type="text"
            name="lineType"
            value={form.lineType}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Source:</label>
          <input
            type="text"
            name="source"
            value={form.source}
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
          {loading ? 'Adding...' : 'Add Product'}
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
