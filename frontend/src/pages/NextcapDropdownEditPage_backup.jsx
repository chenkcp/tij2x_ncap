import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  fetchNextcapClients, 
  fetchNextcapProducts, 
  updateNextcapProducts,
  fetchProductReference 
} from '../services/api';

export default function NextcapDropdownEditPage() {
  const { siteCode } = useParams();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientData, setClientData] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingProducts, setEditingProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    async function loadClients() {
      try {
        setMessage('');
        const response = await fetchNextcapClients(siteCode);
        if (response.success) {
          setClients(response.data);
        }
      } catch (error) {
        setMessage(`Error loading clients: ${error.message}`);
      }
    }
    loadClients();
  }, [siteCode]);

  // Load products when client is selected
  useEffect(() => {
    if (selectedClient && clientData) {
      loadProducts();
    } else {
      setProducts([]);
      setEditingProducts({});
    }
  }, [selectedClient, clientData, siteCode]);

  // No longer needed - using direct fields from backend
  // const parseLineTypeNumber = (lineTypeLineNumber) => { ... }

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetchNextcapProducts(siteCode, {
        line_type: clientData.line_type,
        line_number: clientData.line_number,
        source: clientData.source
      });
      
      if (response.success) {
        setProducts(response.data);
        // Initialize editing state for each product
        const editingState = {};
        response.data.forEach(product => {
          editingState[`${product.product_number}_${product.product_name}`] = {
            product_name: product.product_name || '',
            product_number: product.product_number || '',
            product_type: product.product_type || ''
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

  const handleClientChange = (e) => {
    const value = e.target.value;
    setSelectedClient(value);
    setMessage('');
    
    if (value) {
      const selectedClientData = clients.find(c => c.client_name === value);
      if (selectedClientData) {
        // Use the fields directly from backend - no parsing needed
        setClientData({
          client_name: selectedClientData.client_name,
          line_type: selectedClientData.line_type,
          line_number: selectedClientData.line_number,
          source: selectedClientData.source
        });
      }
    } else {
      setClientData(null);
    }
  };

  const handleProductChange = (key, field, value) => {
    setEditingProducts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    
    try {
      // Prepare updates for products that have changes
      const updates = [];
      
      for (const product of products) {
        const key = `${product.product_number}_${product.product_name}`;
        const edited = editingProducts[key];
        
        if (edited && (
          edited.product_name !== (product.product_name || '') || 
          edited.product_number !== (product.product_number || '') ||
          edited.product_type !== (product.product_type || '')
        )) {
          updates.push({
            originalProductNumber: product.product_number,
            originalProductName: product.product_name,
            line_type: clientData.line_type,
            line_number: clientData.line_number,
            source: clientData.source,
            product_name: edited.product_name,
            product_number: edited.product_number,
            product_type: edited.product_type
          });
        }
      }

      if (updates.length === 0) {
        setMessage('No changes to save.');
        return;
      }

      const response = await updateNextcapProducts(siteCode, updates);
      if (response.success) {
        setMessage(`Successfully updated ${updates.length} product(s)!`);
        // Refresh the products to show updated data
        loadProducts();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Edit Nextcap Product Dropdown</h2>
      <p>Site: {siteCode}</p>
      
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

      {/* PC Name Selection */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '20px' }}>Select PC (Client)</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            PC Name (Client):
          </label>
          <select
            value={selectedClient}
            onChange={handleClientChange}
            style={{ padding: '8px', minWidth: '300px' }}
          >
            <option value="">--Select PC/Client--</option>
            {clients.map((client, index) => (
              <option key={`${client.client_name}_${index}`} value={client.client_name}>
                {client.client_name}
              </option>
            ))}
          </select>
        </div>

        {clientData && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>Selected:</strong> {clientData.client_name} - 
            Line Type: {clientData.line_type}, 
            Line Number: {clientData.line_number}, 
            Source: {clientData.source}
          </div>
        )}
      </div>

      {loading && <p>Loading products...</p>}
      
      {products.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div>
            <h3>Products ({products.length} found):</h3>
            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
              <table className="data-table" style={{ minWidth: '800px', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Line Type</th>
                    <th>Line Number</th>
                    <th>Source</th>
                    <th>Product Name (Editable)</th>
                    <th>Product Number (Editable)</th>
                    <th>Product Type (Editable)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const key = `${product.product_number}_${product.product_name}`;
                    return (
                      <tr key={key || index}>
                        <td>{product.line_type}</td>
                        <td>{product.line_number}</td>
                        <td>{product.source}</td>
                        <td>
                          <input
                            type="text"
                            value={editingProducts[key]?.product_name || ''}
                            onChange={(e) => handleProductChange(key, 'product_name', e.target.value)}
                            style={{ 
                              width: '150px', 
                              padding: '4px',
                              border: '1px solid #ccc',
                              borderRadius: '3px'
                            }}
                            placeholder="Product Name"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingProducts[key]?.product_number || ''}
                            onChange={(e) => handleProductChange(key, 'product_number', e.target.value)}
                            style={{ 
                              width: '120px', 
                              padding: '4px',
                              border: '1px solid #ccc',
                              borderRadius: '3px'
                            }}
                            placeholder="Product Number"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingProducts[key]?.product_type || ''}
                            onChange={(e) => handleProductChange(key, 'product_type', e.target.value)}
                            style={{ 
                              width: '100px', 
                              padding: '4px',
                              border: '1px solid #ccc',
                              borderRadius: '3px'
                            }}
                            placeholder="Type"
                          />
                        </td>
                      </tr>
                    );
                  })}
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
                {submitting ? 'Updating...' : 'Update Products'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {selectedClient && !loading && products.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#dc3545',
          fontWeight: 'bold'
        }}>
          No products found for selected client configuration.
        </div>
      )}

      {!selectedClient && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Please select a PC/Client to start editing product dropdown items.
        </div>
      )}
    </div>
  );
}