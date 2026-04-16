import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductFamilies, fetchProductsByFamily } from '../services/api';

export default function ProductLookupPage() {
  const { siteCode } = useParams();
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
        setError('');
        const response = await fetchProductFamilies(siteCode);
        if (!ignore && response.success) {
          setFamilies(response.data);
        }
      } catch (err) {
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
      <p>Site: {siteCode}</p>
      
      <div className="form-row">
        <label>Family: </label>
        <select 
          value={selectedFamily} 
          onChange={(e) => setSelectedFamily(e.target.value)}
        >
          <option value="">--Select Family--</option>
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
          <h3>Products:</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Number</th>
                <th>Product Name</th>
                <th>Family</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.productNumber}</td>
                  <td>{product.productName}</td>
                  <td>{product.familyCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
