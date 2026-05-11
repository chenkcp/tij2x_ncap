import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  fetchNextcapClients, 
  fetchNextcapProducts, 
  updateNextcapProducts,
  deleteNextcapProducts,
  insertNextcapProducts,
  fetchProductReference 
} from '../services/api';

const NextcapDropdownEditPage = () => {
  const { siteCode } = useParams();
  
  // Client selection state
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientConfigurations, setClientConfigurations] = useState([]); // All configs for selected client
  const [selectedConfiguration, setSelectedConfiguration] = useState(null); // Single selected config
  const [clientData, setClientData] = useState(null);
  
  // Products state
  const [nextcapProducts, setNextcapProducts] = useState([]);
  const [originalNextcapProducts, setOriginalNextcapProducts] = useState([]); // Track original DB state
  const [productReference, setProductReference] = useState([]);
  const [selectedLeftItems, setSelectedLeftItems] = useState(new Set());
  const [selectedRightItems, setSelectedRightItems] = useState(new Set());
  
  // Loading and UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Pagination for left list
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;
  
  // Search for left list
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, [siteCode]);

  useEffect(() => {
    loadProductReference();
  }, [siteCode, currentPage, searchTerm]);

  useEffect(() => {
    if (selectedConfiguration) {
      loadNextcapProducts();
    }
  }, [selectedConfiguration]);

  const loadClients = async () => {
    try {
      const response = await fetchNextcapClients(siteCode);
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      setMessage(`Error loading clients: ${error.message}`);
    }
  };

  const loadProductReference = async () => {
    setLoading(true);
    try {
      const response = await fetchProductReference(siteCode, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        client: selectedClient
      });
      if (response.success) {
        setProductReference(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(Math.ceil((response.total || 0) / itemsPerPage));
      }
    } catch (error) {
      setMessage(`Error loading product reference: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter out products that are already in the right list (nextcapProducts)
  const filteredProductReference = productReference.filter(item => {
    const rightListProductNumbers = new Set(nextcapProducts.map(p => p.product_number));
    return !rightListProductNumbers.has(item.INV_ITEM_LK_NR);
  });

  // Calculate filtered counts for pagination
  const filteredTotalCount = filteredProductReference.length;
  const filteredTotalPages = Math.ceil(filteredTotalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFilteredItems = filteredProductReference.slice(startIndex, endIndex);

  const loadNextcapProducts = async () => {
    if (!selectedConfiguration) return;
    
    setLoading(true);
    try {
      const response = await fetchNextcapProducts(siteCode, {
        line_type: selectedConfiguration.line_type,
        line_number: selectedConfiguration.line_number,
        source: selectedConfiguration.source
      });
      if (response.success) {
        const products = response.data || [];
        setNextcapProducts(products);
        setOriginalNextcapProducts([...products]); // Store original state
      }
    } catch (error) {
      setMessage(`Error loading nextcap products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    const value = e.target.value;
    setSelectedClient(value);
    setMessage('');
    
    // Always reset configuration-related state when changing clients
    setSelectedConfiguration(null);
    setClientData(null);
    setNextcapProducts([]);
    setOriginalNextcapProducts([]);
    
    if (value) {
      // Find all configurations for this client
      const clientConfigs = clients.filter(c => c.client_name === value);
      setClientConfigurations(clientConfigs);
      
      // If only one configuration, auto-select it
      if (clientConfigs.length === 1) {
        const autoConfig = clientConfigs[0];
        setSelectedConfiguration(autoConfig);
        setClientData({
          client_name: autoConfig.client_name,
          line_type: autoConfig.line_type,
          line_number: autoConfig.line_number,
          source: autoConfig.source
        });
      }
    } else {
      setClientConfigurations([]);
    }
  };

  const handleConfigurationChange = (config) => {
    setSelectedConfiguration(config);
    setClientData({
      client_name: config.client_name,
      line_type: config.line_type,
      line_number: config.line_number,
      source: config.source
    });
  };

  const handleLeftItemToggle = (item) => {
    const key = `${item.INV_ITEM_LK_NR}_${item.product_name}`;
    setSelectedLeftItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleRightItemToggle = (item) => {
    const key = `${item.product_number}_${item.product_name}`;
    setSelectedRightItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const moveToRight = () => {
    if (!selectedConfiguration) {
      setMessage('Please select a client and configuration first');
      return;
    }

    const itemsToMove = paginatedFilteredItems.filter(item => 
      selectedLeftItems.has(`${item.INV_ITEM_LK_NR}_${item.product_name}`)
    );

    if (itemsToMove.length === 0) {
      setMessage('Please select items to move');
      return;
    }

    // Convert to nextcap product format
    const newNextcapProducts = itemsToMove.map(item => ({
      line_type: clientData.line_type,
      line_number: clientData.line_number,
      source: clientData.source,
      product_name: item.product_name,
      product_number: item.INV_ITEM_LK_NR,
      product_type: 'DEFAULT' // Default type
    }));

    // Add to right list
    setNextcapProducts(prev => [...prev, ...newNextcapProducts]);
    
    // Clear selection
    setSelectedLeftItems(new Set());
    
    setMessage(`Moved ${itemsToMove.length} items to nextcap products`);
  };

  const moveToLeft = () => {
    if (selectedRightItems.size === 0) {
      setMessage('Please select items to remove');
      return;
    }

    // Remove selected items from right list
    const remainingProducts = nextcapProducts.filter(item => 
      !selectedRightItems.has(`${item.product_number}_${item.product_name}`)
    );

    setNextcapProducts(remainingProducts);
    setSelectedRightItems(new Set());
    
    setMessage(`Removed ${selectedRightItems.size} items from nextcap products`);
  };

  const handleSave = async () => {
    if (!selectedConfiguration) {
      setMessage('Please select a client and configuration');
      return;
    }

    setLoading(true);
    try {
      // Calculate what changed by comparing original vs current
      const originalIds = new Set(originalNextcapProducts.map(p => p.product_number));
      const currentIds = new Set(nextcapProducts.map(p => p.product_number));
      
      // Products to DELETE (in original but not in current)
      const toDelete = originalNextcapProducts.filter(p => !currentIds.has(p.product_number));
      
      // Products to INSERT (in current but not in original)
      const toInsert = nextcapProducts.filter(p => !originalIds.has(p.product_number));
      
      console.log('Save analysis:', {
        original: originalIds.size,
        current: currentIds.size,
        toDelete: toDelete.length,
        toInsert: toInsert.length
      });

      // Perform operations in sequence
      let deletedCount = 0;
      let insertedCount = 0;
      
      // Delete products that were removed
      if (toDelete.length > 0) {
        const deleteResponse = await deleteNextcapProducts(siteCode, {
          client: clientData,
          products: toDelete
        });
        if (deleteResponse.success) {
          deletedCount = toDelete.length;
        }
      }
      
      // Insert products that were added
      if (toInsert.length > 0) {
        const insertResponse = await insertNextcapProducts(siteCode, {
          client: clientData,
          products: toInsert
        });
        if (insertResponse.success) {
          insertedCount = toInsert.length;
        }
      }
      
      // Update original state to match current state after successful save
      setOriginalNextcapProducts([...nextcapProducts]);
      
      setMessage(`Save completed! Deleted: ${deletedCount}, Inserted: ${insertedCount}`);
      
    } catch (error) {
      setMessage(`Error saving: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= filteredTotalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
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

      {/* Client Selection */}
      <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Select PC (Client)</h3>
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

        {/* Configuration Selection (when client has multiple configs) */}
        {clientConfigurations.length > 1 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Select Configuration:</h4>
            {clientConfigurations.map((config, index) => {
              const configId = `${config.line_type}_${config.line_number}_${config.source}`;
              const isSelected = 
                selectedConfiguration && 
                selectedConfiguration.line_type === config.line_type &&
                selectedConfiguration.line_number === config.line_number &&
                selectedConfiguration.source === config.source;

              return (
                <div key={`${selectedClient}_${configId}_${index}`} style={{ marginBottom: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`clientConfiguration_${selectedClient}`}
                      value={configId}
                      checked={isSelected}
                      onChange={() => handleConfigurationChange(config)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '13px' }}>
                      Line Type: <strong>{config.line_type}</strong>, 
                      Line Number: <strong>{config.line_number}</strong>, 
                      Source: <strong>{config.source}</strong>
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {selectedConfiguration && (
          <div style={{ 
            marginTop: '10px',
            padding: '10px', 
            backgroundColor: '#e7f3ff', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>Active Configuration:</strong> {selectedConfiguration.client_name} - 
            Line Type: {selectedConfiguration.line_type}, 
            Line Number: {selectedConfiguration.line_number}, 
            Source: {selectedConfiguration.source}
          </div>
        )}
      </div>

      {/* Dual List Layout */}
      <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
        {/* Left List - Product Reference */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Available Products ({filteredTotalCount})</h3>
            <button 
              onClick={moveToRight}
              disabled={selectedLeftItems.size === 0 || !clientData}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedLeftItems.size > 0 && clientData ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedLeftItems.size > 0 && clientData ? 'pointer' : 'not-allowed'
              }}
            >
              Move to Right →
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />

          {/* Product List */}
          <div style={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #eee', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}
            {paginatedFilteredItems.map((item, index) => {
              const key = `${item.INV_ITEM_LK_NR}_${item.product_name}`;
              return (
                <div
                  key={key}
                  onClick={() => handleLeftItemToggle(item)}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedLeftItems.has(key) ? '#e3f2fd' : 'white',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{item.INV_ITEM_LK_NR}, {item.product_name}</div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>
              Page {currentPage} of {filteredTotalPages} ({selectedLeftItems.size} selected)
            </span>
            <div>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{ marginRight: '5px', padding: '4px 8px' }}
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= filteredTotalPages}
                style={{ padding: '4px 8px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right List - Nextcap Products */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Nextcap Products ({nextcapProducts.length})</h3>
            <button 
              onClick={moveToLeft}
              disabled={selectedRightItems.size === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedRightItems.size > 0 ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedRightItems.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              ← Remove Selected
            </button>
          </div>

          {/* Nextcap Product List */}
          <div style={{ 
            height: '480px', 
            overflowY: 'auto', 
            border: '1px solid #eee', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {nextcapProducts.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                {selectedConfiguration ? 'No products configured for this configuration' : 'Please select a client and configuration first'}
              </div>
            ) : (
              nextcapProducts.map((item, index) => {
                const key = `${item.product_number}_${item.product_name}`;
                return (
                  <div
                    key={key}
                    onClick={() => handleRightItemToggle(item)}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      backgroundColor: selectedRightItems.has(key) ? '#ffebee' : 'white',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{item.product_number}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.product_name}</div>
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      Type: {item.product_type} | {item.line_type}{item.line_number}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>
              {selectedRightItems.size} selected
            </span>
            <button
              onClick={handleSave}
              disabled={loading || !clientData}
              style={{
                padding: '10px 20px',
                backgroundColor: clientData ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: clientData ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextcapDropdownEditPage;