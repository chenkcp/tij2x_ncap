const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const toAbsoluteUrl = (path) => {
  // Support both absolute API bases and relative bases like /api.
  return new URL(path, window.location.origin);
};

// Generic error handler for API responses with special handling for confirmation needed
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      
      // Check for confirmation needed response
      if (response.status === 422 && errorData.code === 'PICA_CONFIRMATION_NEEDED') {
        const error = new Error(errorData.error);
        error.code = 'PICA_CONFIRMATION_NEEDED';
        error.details = errorData.details;
        error.confirmationRequired = errorData.confirmationRequired;
        throw error;
      }
      
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (parseError) {
      // If the error thrown above is our special confirmation error, re-throw it
      if (parseError.code === 'PICA_CONFIRMATION_NEEDED') {
        throw parseError;
      }
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

export async function fetchSiteInfo(siteCode) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/site-info`, { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch site info:', error);
    throw new Error(`Failed to load site information: ${error.message}`);
  }
}

export async function fetchProductFamilies(siteCode) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/families`, { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch product families:', error);
    throw new Error(`Failed to load product families: ${error.message}`);
  }
}

export async function fetchProductsByFamily(siteCode, familyCode) {
  try {
    const url = toAbsoluteUrl(`${API_BASE}/sites/${siteCode}/products/lookup`);
    if (familyCode) {
      url.searchParams.set('familyCode', familyCode);
    }
    const response = await fetch(url.toString(), { credentials: 'include' });
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
      credentials: 'include',
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to update inkweight:', error);
    throw new Error(`Failed to update inkweight: ${error.message}`);
  }
}

export async function updateProductWeights(siteCode, updates, confirmNewPica = false) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/weights`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, confirmNewPica })
    });
    return await handleApiResponse(response);
  } catch (error) {
    // Re-throw confirmation errors as-is so frontend can handle them
    if (error.code === 'PICA_CONFIRMATION_NEEDED') {
      throw error;
    }
    console.error('Failed to update product weights:', error);
    throw new Error(`Failed to update product weights: ${error.message}`);
  }
}

export async function checkProductExists(siteCode, productNumber) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/check/${encodeURIComponent(productNumber)}`, { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to check product existence:', error);
    throw new Error(`Failed to check product existence: ${error.message}`);
  }
}

export async function fetchProductByNumber(siteCode, productNumber) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/products/single/${encodeURIComponent(productNumber)}`, { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch product by number:', error);
    throw new Error(`Failed to fetch product: ${error.message}`);
  }
}

export async function fetchNextcapClients(siteCode) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/nextcap/clients`, { credentials: 'include'});
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch nextcap clients:', error);
    throw new Error(`Failed to fetch nextcap clients: ${error.message}`);
  }
}

export async function fetchNextcapProducts(siteCode, params) {
  try {
    const url = toAbsoluteUrl(`${API_BASE}/sites/${siteCode}/nextcap/products`);
    if (params.line_type) url.searchParams.set('line_type', params.line_type);
    if (params.line_number) url.searchParams.set('line_number', params.line_number);
    if (params.source) url.searchParams.set('source', params.source);
    
    const response = await fetch(url.toString(), { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch nextcap products:', error);
    throw new Error(`Failed to fetch nextcap products: ${error.message}`);
  }
}

export async function updateNextcapProducts(siteCode, updates) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/nextcap/products`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to update nextcap products:', error);
    throw new Error(`Failed to update nextcap products: ${error.message}`);
  }
}

export async function deleteNextcapProducts(siteCode, payload) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/nextcap/products`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to delete nextcap products:', error);
    throw new Error(`Failed to delete nextcap products: ${error.message}`);
  }
}

export async function insertNextcapProducts(siteCode, payload) {
  try {
    const response = await fetch(`${API_BASE}/sites/${siteCode}/nextcap/products`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to insert nextcap products:', error);
    throw new Error(`Failed to insert nextcap products: ${error.message}`);
  }
}

export async function fetchProductReference(siteCode, params = {}) {
  try {
    const url = toAbsoluteUrl(`${API_BASE}/sites/${siteCode}/nextcap/product-ref`);
    if (params.page) url.searchParams.set('page', params.page);
    if (params.limit) url.searchParams.set('limit', params.limit);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.client) url.searchParams.set('client', params.client);
    
    const response = await fetch(url.toString(), { credentials: 'include' });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Failed to fetch product reference:', error);
    throw new Error(`Failed to fetch product reference: ${error.message}`);
  }
}