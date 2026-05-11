import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSite } from '../contexts/SiteContext';
import { createProduct, fetchProductFamilies, checkProductExists } from '../services/api';

export default function ProductAddPage() {
  const { siteCode } = useParams();
  const { saveCpmStations } = useSite();
  const [form, setForm] = useState({
    productNumber: '',
    productName: '',
    productType: '',
    cpmStations: [], // Array for multiple selections
    PICA_CD: '',
    REGION_CD: '',
    ID_FET_PRODUCT: '',
    ID_FET_MARKETING: '',
    MID_CD: '',
    LOTID_CD: '',
    SELECTABILITY_NR: '',
    PROD_GEN_CD: '',
    WEIGHT_USL: '',
    WEIGHT_LSL: ''
  });
  const [families, setFamilies] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProduct, setCheckingProduct] = useState(false);
  const [productExists, setProductExists] = useState(null);

  // Load product families for dropdown
  useEffect(() => {
    async function loadFamilies() {
      try {
        const response = await fetchProductFamilies(siteCode);
        if (response.success) {
          setFamilies(response.data);
        }
      } catch (error) {
        console.error('Error loading families:', error);
      }
    }
    loadFamilies();
  }, [siteCode]);

  // Check if product exists when product number changes
  const checkProduct = async (productNumber) => {
    if (!productNumber.trim()) {
      setProductExists(null);
      return;
    }
    
    setCheckingProduct(true);
    try {
      const response = await checkProductExists(siteCode, productNumber);
      setProductExists(response.exists);
    } catch (error) {
      console.error('Error checking product:', error);
      setProductExists(null);
    } finally {
      setCheckingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Check product existence when product number changes
    if (name === 'productNumber') {
      checkProduct(value);
    }
  };

  // Handle multiple selection for CPM Stations
  const handleCpmStationChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm({ ...form, cpmStations: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (productExists) {
      setMessage('Error: Product number already exists! Please use a different product number.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await createProduct(siteCode, form);
      if (response.success) {
        setMessage('Product created successfully!');
        
        // Save CPM stations for use in other pages
        if (form.cpmStations && form.cpmStations.length > 0) {
          saveCpmStations(form.productNumber, form.cpmStations);
          console.log(`CPM stations saved for product ${form.productNumber}:`, form.cpmStations);
        }
        
        // Reset form
        setForm({
          productNumber: '',
          productName: '',
          productType: '',
          cpmStations: [], // Reset CPM stations
          PICA_CD: '',
          REGION_CD: '',
          ID_FET_PRODUCT: '',
          ID_FET_MARKETING: '',
          MID_CD: '',
          LOTID_CD: '',
          SELECTABILITY_NR: '',
          PROD_GEN_CD: '',
          WEIGHT_USL: '',
          WEIGHT_LSL: ''
        });
        setProductExists(null);
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
      
      {/* Duplicate Product Warning */}
      {productExists && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '12px', 
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          ⚠️ Warning: Product number "{form.productNumber}" already exists in the database. 
          Please choose a different product number to continue.
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          {/* Product Number */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product Number: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="productNumber"
              value={form.productNumber}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px',
                border: productExists === true ? '2px solid red' : 
                       productExists === false ? '2px solid green' : '1px solid #ccc'
              }}
            />
            {checkingProduct && <small style={{ color: '#666' }}>Checking...</small>}
            {productExists === true && <small style={{ color: 'red' }}>⚠️ Product already exists!</small>}
            {productExists === false && <small style={{ color: 'green' }}>✅ Available</small>}
          </div>

          {/* Product Name */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product Name: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Product Type */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product Type: <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="productType"
              value={form.productType}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="">--Select Product Type--</option>
              {families.map((family) => (
                <option key={family.family_code} value={family.family_code}>
                  {family.family_name}
                </option>
              ))}
            </select>
          </div>

          {/* CPM Station */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              CPM Station:
            </label>
            <select
              multiple
              value={form.cpmStations}
              onChange={handleCpmStationChange}
              style={{ 
                width: '100%', 
                padding: '8px',
                minHeight: '100px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="Z1-CPM">Z1-CPM</option>
              <option value="Z2-CPM">Z2-CPM</option>
              <option value="Z3-CPM">Z3-CPM</option>
              <option value="Z4-CPM">Z4-CPM</option>
              <option value="Z3-LPQ">Z3-LPQ</option>
            </select>
            <small style={{ color: '#666', fontSize: '12px' }}>
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple stations
            </small>
            {form.cpmStations.length > 0 && (
              <div style={{ marginTop: '5px' }}>
                <strong>Selected:</strong> {form.cpmStations.join(', ')}
              </div>
            )}
          </div>

          {/* PICA Code */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>PICA Code:</label>
            <input
              type="text"
              name="PICA_CD"
              value={form.PICA_CD}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Region */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Region:</label>
            <input
              type="text"
              name="REGION_CD"
              value={form.REGION_CD}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Product ID */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Product ID:</label>
            <input
              type="text"
              name="ID_FET_PRODUCT"
              value={form.ID_FET_PRODUCT}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Marketing ID */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Marketing ID:</label>
            <input
              type="text"
              name="ID_FET_MARKETING"
              value={form.ID_FET_MARKETING}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* MID Code */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>MID Code:</label>
            <input
              type="text"
              name="MID_CD"
              value={form.MID_CD}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* LOT ID */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>LOT ID:</label>
            <input
              type="text"
              name="LOTID_CD"
              value={form.LOTID_CD}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Selectability */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Selectability:</label>
            <input
              type="text"
              name="SELECTABILITY_NR"
              value={form.SELECTABILITY_NR}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Gen Code */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Gen Code:</label>
            <input
              type="text"
              name="PROD_GEN_CD"
              value={form.PROD_GEN_CD}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Weight USL */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Weight USL:</label>
            <input
              type="number"
              step="0.01"
              name="WEIGHT_USL"
              value={form.WEIGHT_USL}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {/* Weight LSL */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Weight LSL:</label>
            <input
              type="number"
              step="0.01"
              name="WEIGHT_LSL"
              value={form.WEIGHT_LSL}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

        </div>

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <small style={{ color: '#666' }}>
            <strong>Auto-filled fields:</strong><br />
            • Insert Date: {new Date().toLocaleDateString()}<br />
            • Update User: [Login user - to be implemented]<br />
            • Update Date: {new Date().toLocaleDateString()}
          </small>
        </div>

        <button 
          type="submit" 
          disabled={loading || productExists || checkingProduct}
          style={{ 
            padding: '12px 30px',
            marginTop: '20px',
            backgroundColor: (productExists || loading) ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: (loading || productExists) ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
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
