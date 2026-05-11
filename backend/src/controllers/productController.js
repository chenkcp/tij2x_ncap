const productService = require('../services/productService');

async function getFamilies(req, res, next) {
  try {
    const data = await productService.getFamilies(req.siteContext);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getSiteInfo(req, res, next) {
  try {
    const siteInfo = {
      siteCode: req.siteCode,
      connectionInfo: {
        productDb: {
          name: req.siteContext.productDb.name,
          client: req.siteContext.productDb.client,
          // Only show masked connection string for security
          connectionString: maskConnectionString(req.siteContext.productDb.connectionString)
        },
        nextcapDb: {
          name: req.siteContext.nextcapDb.name,
          client: req.siteContext.nextcapDb.client,
          connectionString: maskConnectionString(req.siteContext.nextcapDb.connectionString)
        }
      }
    };
    res.json({ success: true, data: siteInfo });
  } catch (error) {
    next(error);
  }
}

// Helper function to mask sensitive connection string data
function maskConnectionString(connectionString) {
  if (!connectionString) return 'Not configured';
  
  // Mask password and sensitive info
  return connectionString
    .replace(/Password=([^;]+)/gi, 'Password=***')
    .replace(/User Id=([^;]+)/gi, 'User Id=***')
    .replace(/User ID=([^;]+)/gi, 'User ID=***');
}

async function getProductLookup(req, res, next) {
  try {
    const { familyCode } = req.query;
    const data = await productService.getProductLookup(req.siteContext, familyCode);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const data = await productService.createProduct(req.siteContext, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateInkWeight(req, res, next) {
  try {
    const data = await productService.updateInkWeight(req.siteContext, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function checkProductExists(req, res, next) {
  try {
    const { productNumber } = req.params;
    const exists = await productService.checkProductExists(req.siteContext, productNumber);
    res.json({ success: true, exists, productNumber });
  } catch (error) {
    next(error);
  }
}

async function getProductByNumber(req, res, next) {
  try {
    const site = req.siteContext;
    const { productNumber } = req.params;
    
    console.log(`Getting product by number ${productNumber} for site:`, req.siteCode);
    
    const result = await productService.getProductByNumber(site, productNumber);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateProductWeights(req, res, next) {
  try {
    const site = req.siteContext;
    const { updates, confirmNewPica = false } = req.body;
    
    // Validate input
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Updates array is required' 
      });
    }
    
    // Validate each update object
    for (const update of updates) {
      if (!update.productNumber) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product number is required for each update' 
        });
      }
    }
    
    console.log(`Updating weights for ${updates.length} products for site:`, req.siteCode);
    console.log('Confirm new PICA flag:', confirmNewPica);
    
    const result = await productService.updateProductWeights(site, updates, confirmNewPica);
    res.json(result);
  } catch (error) {
    // Handle PICA confirmation errors specially
    if (error.code === 'PICA_CONFIRMATION_NEEDED') {
      return res.status(422).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        confirmationRequired: true
      });
    }
    next(error);
  }
}

module.exports = {
  getFamilies,
  getProductLookup,
  createProduct,
  updateInkWeight,
  updateProductWeights,
  getProductByNumber,
  getSiteInfo,
  checkProductExists  // Add this
};