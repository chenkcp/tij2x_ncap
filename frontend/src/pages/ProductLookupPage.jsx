import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSite } from '../contexts/SiteContext';
import { fetchProductFamilies, fetchProductsByFamily } from '../services/api';

export default function ProductLookupPage() {
  const { siteCode } = useParams();
  const { getCpmStations } = useSite();
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load families on component mount
  useEffect(() => {
    let ignore = false;
    async function loadFamilies() {
      try {
        console.log('Loading families for site:', siteCode);
        setError('');
        const response = await fetchProductFamilies(siteCode);
        console.log('Families response:', response);
        if (!ignore && response.success) {
          setFamilies(response.data);
          console.log('Families set:', response.data);
        }
      } catch (err) {
        console.error('Error loading families:', err);
        if (!ignore) setError(err.message);
      }
    }
    loadFamilies();
    return () => { ignore = true; };
  }, [siteCode]);

  // Load products when family selection changes
  useEffect(() => {
    let ignore = false;
    async function loadProducts() {
      if (!selectedFamily) {
        setProducts([]);
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        const response = await fetchProductsByFamily(siteCode, selectedFamily);
        if (!ignore && response.success) {
          setProducts(response.data);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProducts();
    return () => { ignore = true; };
  }, [siteCode, selectedFamily]);

  return (
    <div>
      <h2>Product Lookup</h2>
      
      <div className="form-row">
        <label>Product Type: </label>
        <select 
          value={selectedFamily} 
          onChange={(e) => setSelectedFamily(e.target.value)}
        >
          <option value="">--Select Product--</option>
          {families.map((family) => (
            <option key={family.family_code} value={family.family_code}>
              {family.family_name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {loading && <p>Loading products...</p>}
      
      {products.length > 0 && (
        <div>
          <h3>Products ({products.length} found):</h3>
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table className="data-table" style={{ minWidth: '1300px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Product Number</th>
                  <th>Product Name</th>
                  <th>PICA</th>
                  <th>Region</th>
                  <th>Product ID</th>
                  <th>Marketing ID</th>
                  <th>MID</th>
                  <th>LOT ID</th>
                  <th>Selectability</th>
                  <th>Gen Code</th>
                  <th>Update DM</th>
                  <th>Update User</th>
                  <th>Insert Date</th>
                  <th>Update Date</th>
                  <th>Weight USL</th>
                  <th>Weight LSL</th>
                  <th>CPM Stations</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.product_number || index}>
                    <td style={{ fontWeight: 'bold', color: '#0066cc' }}>{product.product_number}</td>
                    <td style={{ fontWeight: 'bold' }}>{product.product_name}</td>
                    <td>{product.PICA_CD}</td>
                    <td>{product.REGION_CD}</td>
                    <td>{product.ID_FET_PRODUCT}</td>
                    <td>{product.ID_FET_MARKETING}</td>
                    <td>{product.MID_CD}</td>
                    <td>{product.LOTID_CD}</td>
                    <td>{product.SELECTABILITY_NR}</td>
                    <td>{product.PROD_GEN_CD}</td>
                    <td>{product.UPDATE_DM ? new Date(product.UPDATE_DM).toLocaleDateString() : ''}</td>
                    <td>{product.UPDATE_USER_ID}</td>
                    <td>{product.INSERT_DTTM ? new Date(product.INSERT_DTTM).toLocaleDateString() : ''}</td>
                    <td>{product.UPDATE_DTTM ? new Date(product.UPDATE_DTTM).toLocaleDateString() : ''}</td>
                    <td style={{ textAlign: 'right' }}>{product.WEIGHT_USL}</td>
                    <td style={{ textAlign: 'right' }}>{product.WEIGHT_LSL}</td>
                    <td>
                      {(() => {
                        const cpmStations = getCpmStations(product.product_number);
                        return cpmStations.length > 0 ? (
                          <span style={{ fontSize: '11px', color: '#0066cc' }}>
                            {cpmStations.join(', ')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#999' }}>Not set</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Legend:</strong> PICA = Product Information Code, USL = Upper Spec Limit, LSL = Lower Spec Limit, 
            MID = Manufacturing ID, LOT = Lot Identification, Gen = Generation
          </div>
        </div>
      )}
    </div>
  );
}
