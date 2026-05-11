const nextcapService = require('../services/nextcapService');

async function getClients(req, res, next) {
  try {
    const site = req.siteContext;
    console.log(`Getting nextcap clients for site:`, req.siteCode);
    
    const data = await nextcapService.getClients(site);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const site = req.siteContext;
    const { line_type, line_number, source } = req.query;
    
    console.log(`Getting nextcap products for site:`, req.siteCode);
    console.log('Query params:', { line_type, line_number, source });
    
    const data = await nextcapService.getProducts(site, {
      line_type,
      line_number: line_number ? parseInt(line_number, 10) : null,
      source
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateProducts(req, res, next) {
  try {
    const site = req.siteContext;
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Updates array is required' 
      });
    }
    
    console.log(`Updating nextcap products for site:`, req.siteCode);
    console.log(`Number of updates:`, updates.length);
    
    const result = await nextcapService.updateProducts(site, updates);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProductReference(req, res, next) {
  console.log('NextcapController: getProductReference called');
  
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    
    // Get site context from middleware
    const site = req.siteContext || req.site;
    if (!site) {
      console.error('Site context missing in getProductReference');
      return res.status(500).json({ 
        success: false, 
        error: 'Site context not found' 
      });
    }

    console.log('Getting product reference for site:', site.code);
    console.log('Parameters:', { page, limit, search });
    
    // Use product service to get products from product_ref_llk table
    const productService = require('../services/productService');
    const result = await productService.getProductsWithPagination(site, {
      page,
      limit,
      search
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message || 'Failed to fetch product reference'
      });
    }
  } catch (error) {
    console.error('Error in getProductReference:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function deleteProducts(req, res, next) {
  try {
    const site = req.siteContext;
    const { client, products } = req.body;
    
    if (!client || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client and products array are required' 
      });
    }
    
    console.log(`Deleting nextcap products for site:`, req.siteCode);
    console.log(`Number of products to delete:`, products.length);
    
    const result = await nextcapService.deleteProducts(site, client, products);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function insertProducts(req, res, next) {
  try {
    const site = req.siteContext;
    const { client, products } = req.body;
    
    if (!client || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client and products array are required' 
      });
    }
    
    console.log(`Inserting nextcap products for site:`, req.siteCode);
    console.log(`Number of products to insert:`, products.length);
    
    const result = await nextcapService.insertProducts(site, client, products);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClients,
  getProducts,
  updateProducts,
  deleteProducts,
  insertProducts,
  getProductReference
};