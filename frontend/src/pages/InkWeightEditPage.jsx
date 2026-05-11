import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductFamilies, fetchProductsByFamily, fetchProductByNumber, updateProductWeights } from '../services/api';

export default function InkWeightEditPage() {
  const { siteCode } = useParams();
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [productNumber, setProductNumber] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProducts, setEditingProducts] = useState({}); // Store edited weights
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchMode, setSearchMode] = useState(''); // 'family' or 'number'

  // Load product families on component mount
  useEffect(() => {
    async function loadFamilies() {
      try {
        setMessage('');
        const response = await fetchProductFamilies(siteCode);
        if (response.success) {
          setFamilies(response.data);
        }
      } catch (error) {
        setMessage(`Error loading families: ${error.message}`);
      }
    }
    loadFamilies();
  }, [siteCode]);

  // Load products when family is selected
  useEffect(() => {
    if (selectedFamily && searchMode === 'family') {
      loadProductsByFamily();
    } else if (!selectedFamily && searchMode === 'family') {
      setProducts([]);
      setEditingProducts({});
    }
  }, [selectedFamily, siteCode, searchMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(window.productSearchTimeout);
    };
  }, []);

  const loadProductsByFamily = async () => {
    setLoading(true);
    try {
      const response = await fetchProductsByFamily(siteCode, selectedFamily);
      if (response.success) {
        setProducts(response.data);
        // Initialize editing state for each product
        const editingState = {};
        response.data.forEach(product => {
          editingState[product.product_number] = {
            WEIGHT_USL: product.WEIGHT_USL || '',
            WEIGHT_LSL: product.WEIGHT_LSL || '',
            PICA_CD: product.PICA_CD || '',
            MID_CD: product.MID_CD || '',
            LOTID_CD: product.LOTID_CD || ''
          };
        });
        setEditingProducts(editingState);
      }
    } catch (error) {
      setMessage(`Error loading products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProductByNumber = async (productNum) => {
    if (!productNum.trim()) {
      setProducts([]);
      setEditingProducts({});
      return;
    }
    
    setLoading(true);
    setMessage(''); // Clear previous messages
    
    try {
      console.log(`Searching for product: ${productNum} in site: ${siteCode}`);
      const response = await fetchProductByNumber(siteCode, productNum);
      
      console.log('Product search response:', response);
      
      if (response.success && response.data) {
        const product = response.data;
        console.log('Found product:', product);
        
        setProducts([product]); // Wrap in array for consistency
        // Initialize editing state for the product
        const editingState = {};
        editingState[product.product_number] = {
          WEIGHT_USL: product.WEIGHT_USL || '',
          WEIGHT_LSL: product.WEIGHT_LSL || '',
          PICA_CD: product.PICA_CD || '',
          MID_CD: product.MID_CD || '',
          LOTID_CD: product.LOTID_CD || ''
        };
        setEditingProducts(editingState);
        setMessage(`Product "${productNum}" found and loaded successfully.`);
      } else {
        console.log('Product not found:', productNum);
        setProducts([]);
        setEditingProducts({});
        setMessage(`Product "${productNum}" not found in productDb.product_ref_llk table.`);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setMessage(`Error searching for product "${productNum}": ${error.message}`);
      setProducts([]);
      setEditingProducts({});
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyChange = (e) => {
    const value = e.target.value;
    setSelectedFamily(value);
    setMessage('');
    
    if (value) {
      // Clear product number search when using family search
      setProductNumber('');
      setSearchMode('family');
    } else {
      setSearchMode('');
    }
  };

  const handleProductNumberChange = (e) => {
    const value = e.target.value;
    setProductNumber(value);
    setMessage('');
    
    if (value.trim()) {
      // Clear family search when using product number search
      setSelectedFamily('');
      setSearchMode('number');
      
      // Automatically search when user types (with debounce)
      clearTimeout(window.productSearchTimeout);
      window.productSearchTimeout = setTimeout(() => {
        loadProductByNumber(value.trim());
      }, 500); // 500ms delay
    } else {
      setSearchMode('');
      setProducts([]);
      setEditingProducts({});
      clearTimeout(window.productSearchTimeout);
    }
  };

  const handleSearchByNumber = () => {
    if (productNumber.trim()) {
      clearTimeout(window.productSearchTimeout);
      loadProductByNumber(productNumber.trim());
    }
  };

  const clearAllSearches = () => {
    setSelectedFamily('');
    setProductNumber('');
    setSearchMode('');
    setProducts([]);
    setEditingProducts({});
    setMessage('');
    clearTimeout(window.productSearchTimeout);
  };

  const handleFieldChange = (productNumber, field, value) => {
    setEditingProducts(prev => ({
      ...prev,
      [productNumber]: {
        ...prev[productNumber],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e, confirmNewPica = false) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    
    try {
      // Prepare updates for products that have changes
      const updates = [];
      
      for (const product of products) {
        const edited = editingProducts[product.product_number];
        if (edited && (
          edited.WEIGHT_USL !== (product.WEIGHT_USL || '') || 
          edited.WEIGHT_LSL !== (product.WEIGHT_LSL || '') ||
          edited.PICA_CD !== (product.PICA_CD || '') ||
          edited.MID_CD !== (product.MID_CD || '') ||
          edited.LOTID_CD !== (product.LOTID_CD || '')
        )) {
          updates.push({
            productNumber: product.product_number,
            WEIGHT_USL: edited.WEIGHT_USL ? parseFloat(edited.WEIGHT_USL) : null,
            WEIGHT_LSL: edited.WEIGHT_LSL ? parseFloat(edited.WEIGHT_LSL) : null,
            PICA_CD: edited.PICA_CD || null,
            MID_CD: edited.MID_CD || null,
            LOTID_CD: edited.LOTID_CD || null
          });
        }
      }

      if (updates.length === 0) {
        setMessage('No changes to save.');
        return;
      }

      const response = await updateProductWeights(siteCode, updates, confirmNewPica);
      if (response.success) {
        setMessage(`Successfully updated ${updates.length} product(s)!`);
        // Refresh the products to show updated data
        if (searchMode === 'family') {
          loadProductsByFamily();
        } else if (searchMode === 'number') {
          loadProductByNumber(productNumber);
        }
      }
    } catch (error) {
      if (error.code === 'PICA_CONFIRMATION_NEEDED') {
        // Show confirmation dialog
        const details = error.details;
        const confirmMessage = `PICA Code Mismatch Detected:\n\n` +
          `Product: ${details.productNumber}\n` +
          `PICA_CD: ${details.picaCd}\n` +
          `Your LOTID_CD: ${details.inputLotidCd}\n` +
          `Existing LOTID_CD: ${details.existingLotidCd}\n\n` +
          `Do you want to add this as a new PICA/LOTID combination?`;
          
        if (window.confirm(confirmMessage)) {
          // User confirmed, retry with confirmation flag
          handleSubmit(e, true);
          return;
        } else {
          setMessage('Update cancelled by user.');
        }
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Edit Ink Weight</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Search Options</h3>
        
        {/* Product Number Search */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search by Product Number (INV_ITEM_LK_NR):
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={productNumber}
              onChange={handleProductNumberChange}
              placeholder="Enter product number... (searches automatically)"
              style={{ 
                padding: '8px', 
                minWidth: '350px',
                border: loading && searchMode === 'number' ? '2px solid #007bff' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              type="button"
              onClick={handleSearchByNumber}
              disabled={!productNumber.trim() || loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: productNumber.trim() && !loading ? 'pointer' : 'not-allowed',
                opacity: productNumber.trim() && !loading ? 1 : 0.6
              }}
            >
              Search Now
            </button>
          </div>
          {loading && searchMode === 'number' && (
            <small style={{ color: '#007bff', fontStyle: 'italic' }}>
              🔍 Searching productDb.product_ref_llk...
            </small>
          )}
        </div>

        <div style={{ 
          textAlign: 'center', 
          margin: '15px 0',
          fontSize: '14px',
          color: '#666',
          fontWeight: 'bold'
        }}>
          - OR -
        </div>

        {/* Product Type Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search by Product Type:
          </label>
          <select
            value={selectedFamily}
            onChange={handleFamilyChange}
            style={{ padding: '8px', minWidth: '300px' }}
          >
            <option value="">--Select Product Type--</option>
            {families.map((family) => (
              <option key={family.family_code} value={family.family_code}>
                {family.family_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clear/Reset Button */}
        {(selectedFamily || productNumber || products.length > 0) && (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              type="button"
              onClick={clearAllSearches}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear All Searches
            </button>
          </div>
        )}
      </div>

      {loading && <p>Loading products...</p>}
      
      {products.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div>
            <h3>Products ({products.length} found):</h3>
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <table className="data-table" style={{ minWidth: '1200px', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Product Number</th>
                    <th>Insert Date</th>
                    <th>Update User</th>
                    <th>Weight USL (Editable)</th>
                    <th>Weight LSL (Editable)</th>
                    <th>PICA Code (Editable)</th>
                    <th>MID Code (Editable)</th>
                    <th>LOT ID Code (Editable)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.product_number || index}>
                      <td style={{ fontWeight: 'bold' }}>{product.product_number}</td>
                      <td>{product.INSERT_DTTM ? new Date(product.INSERT_DTTM).toLocaleDateString() : 'N/A'}</td>
                      <td>{product.UPDATE_USER_ID || 'System User'}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProducts[product.product_number]?.WEIGHT_USL || ''}
                          onChange={(e) => handleFieldChange(product.product_number, 'WEIGHT_USL', e.target.value)}
                          style={{ 
                            width: '100px', 
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}
                          placeholder="USL"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProducts[product.product_number]?.WEIGHT_LSL || ''}
                          onChange={(e) => handleFieldChange(product.product_number, 'WEIGHT_LSL', e.target.value)}
                          style={{ 
                            width: '100px', 
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}
                          placeholder="LSL"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProducts[product.product_number]?.PICA_CD || ''}
                          onChange={(e) => handleFieldChange(product.product_number, 'PICA_CD', e.target.value)}
                          style={{ 
                            width: '120px', 
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}
                          placeholder="PICA Code"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProducts[product.product_number]?.MID_CD || ''}
                          onChange={(e) => handleFieldChange(product.product_number, 'MID_CD', e.target.value)}
                          style={{ 
                            width: '120px', 
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}
                          placeholder="MID Code"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingProducts[product.product_number]?.LOTID_CD || ''}
                          onChange={(e) => handleFieldChange(product.product_number, 'LOTID_CD', e.target.value)}
                          style={{ 
                            width: '120px', 
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}
                          placeholder="LOT ID Code"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: submitting ? '#6c757d' : '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {submitting ? 'Updating...' : 'Update Product Data'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* No search selected */}
      {!searchMode && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Please select a product type or enter a product number to start editing weights.
        </div>
      )}
      
      {/* No results messages */}
      {searchMode === 'family' && selectedFamily && !loading && products.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#dc3545',
          fontWeight: 'bold'
        }}>
          No products found for selected product type.
        </div>
      )}
      
      {searchMode === 'number' && productNumber && !loading && products.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#dc3545',
          fontWeight: 'bold'
        }}>
          Product "{productNumber}" not found in the database.
        </div>
      )}
    </div>
  );
}