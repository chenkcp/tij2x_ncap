const API_BASE = 'http://localhost:5000/api';

// Generic error handler for API responses
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

export async function fetchProductFamilies(siteCode) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/families`);
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch product families:', error);
    throw new Error(`Failed to load product families: ${error.message}`);
  }
}

export async function fetchProductsByFamily(siteCode, familyCode) {
  try {
    const url = new URL(`${API_BASE}/sites/${siteCode}/products/lookup`);
    if (familyCode) {
      url.searchParams.set('familyCode', familyCode);
    }
    const response = await fetch(url.toString());
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch products by family:', error);
    throw new Error(`Failed to load products: ${error.message}`);
  }
}

export async function createProduct(siteCode, payload) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to create product:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }
}

export async function updateInkWeight(siteCode, payload) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/inkweight`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to update inkweight:', error);
    throw new Error(`Failed to update inkweight: ${error.message}`);
  }
}