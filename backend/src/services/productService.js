const dbFactory = require('../db/dbFactory');
const ProductRepository = require('../repositories/productRepository');

class ProductService {
  _getRepository(site) {
    // Validate site object
    if (!site) {
      throw new Error('Site object is null or undefined. Check resolveSite middleware.');
    }
    
    if (!site.productDb || !site.nextcapDb) {
      throw new Error(`Site configuration incomplete. Missing databases: ${!site.productDb ? 'productDb' : ''} ${!site.nextcapDb ? 'nextcapDb' : ''}`.trim());
    }
    
    console.log('=== DEBUG _getRepository ===');
    console.log('Site object keys:', Object.keys(site));
    console.log('Site.productDb:', site.productDb);
    console.log('Site.nextcapDb:', site.nextcapDb);
    
    const productDbConfig = {
      client: site.productDb.client,
      connectionString: site.productDb.connectionString,
      name: site.productDb.name
    };
    
    const nextcapDbConfig = {
      client: site.nextcapDb.client,
      connectionString: site.nextcapDb.connectionString,
      name: site.nextcapDb.name
    };
    
    console.log('ProductDb config (masked):', {
      client: productDbConfig.client,
      connectionString: productDbConfig.connectionString?.substring(0, 50) + '...',
      name: productDbConfig.name
    });
    
    console.log('NextcapDb config (masked):', {
      client: nextcapDbConfig.client,
      connectionString: nextcapDbConfig.connectionString?.substring(0, 50) + '...',
      name: nextcapDbConfig.name
    });
    
    const productDb = dbFactory.create(productDbConfig);
    const nextcapDb = dbFactory.create(nextcapDbConfig);
    
    // Pass both database connections to ProductRepository
    return new ProductRepository(productDb, nextcapDb);
  }

  async getFamilies(site) {
    try {
      console.log('Getting families for site:', site);
      const repo = this._getRepository(site);
      console.log('About to query product families from nextcap DB...');
      const families = await repo.getFamilies();
      console.log('Found families count:', Array.isArray(families) ? families.length : 0);
      console.log('Sample families:', Array.isArray(families) ? families.slice(0, 5) : families);
      return families;
    } catch (error) {
      console.error('Error in getFamilies:', error);
      throw new Error(`Failed to get families: ${error.message}`);
    }
  }

  async getProductLookup(site, familyCode) {
    try {
      const repo = this._getRepository(site);
      return await repo.getAllProducts(familyCode);
      // // Mock product lookup data
      // const allProducts = [
      //   { id: 1, productNumber: 'P001', productName: 'Product 1', familyCode: 'FAM001' },
      //   { id: 2, productNumber: 'P002', productName: 'Product 2', familyCode: 'FAM001' },
      //   { id: 3, productNumber: 'P003', productName: 'Product 3', familyCode: 'FAM002' }
      // ];
      
      // if (familyCode) {
      //   return allProducts.filter(p => p.familyCode === familyCode);
      // }
      // return allProducts;
    } catch (error) {
      throw new Error(`Failed to get product lookup: ${error.message}`);
    }
  }

  async getProductsWithPagination(site, options = {}) {
    try {
      console.log('Getting products with pagination for site:', site);
      const repo = this._getRepository(site);
      const { page = 1, limit = 50, search = '' } = options;

      const result = await repo.getProductsWithPagination({
        page,
        limit,
        search
      });

      return {
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error in getProductsWithPagination:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async createProduct(site, productData) {
    try {
      const repo = this._getRepository(site);
      
      // First check if product already exists
      const exists = await repo.checkProductExists(productData.productNumber);
      if (exists) {
        throw new Error(`Product number ${productData.productNumber} already exists`);
      }
      
      // Validate required fields
      if (!productData.productNumber || !productData.productName) {
        throw new Error('Product number and name are required');
      }
      
      // Prepare data with auto-filled fields (CPM stations handled separately)
      const productToInsert = {
        productNumber: productData.productNumber,
        productName: productData.productName,
        productType: productData.productType,
        PICA_CD: productData.PICA_CD || null,
        REGION_CD: productData.REGION_CD || null,
        ID_FET_PRODUCT: productData.ID_FET_PRODUCT || null,
        ID_FET_MARKETING: productData.ID_FET_MARKETING || null,
        MID_CD: productData.MID_CD || null,
        LOTID_CD: productData.LOTID_CD || null,
        SELECTABILITY_NR: productData.SELECTABILITY_NR || null,
        PROD_GEN_CD: productData.PROD_GEN_CD || null,
        WEIGHT_USL: productData.WEIGHT_USL ? parseFloat(productData.WEIGHT_USL) : null,
        WEIGHT_LSL: productData.WEIGHT_LSL ? parseFloat(productData.WEIGHT_LSL) : null,
        INSERT_DTTM: new Date().toISOString(),
        UPDATE_DTTM: new Date().toISOString(),
        UPDATE_USER_ID: 'System User', // Will be replaced with actual login later
        UPDATE_DM: new Date().toISOString().split('T')[0] // Date only
      };
      
      // Store CPM stations separately for other page use
      if (productData.cpmStations && productData.cpmStations.length > 0) {
        console.log('CPM Stations to save for other pages:', productData.cpmStations);
        // CPM stations will be handled by frontend context/storage
      }
      
      const result = await repo.createProduct(productToInsert);
      return { success: true, product: result };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async checkProductExists(site, productNumber) {
    try {
      const repo = this._getRepository(site);
      return await repo.checkProductExists(productNumber);
    } catch (error) {
      throw new Error(`Failed to check product existence: ${error.message}`);
    }
  }

  async getProductByNumber(site, productNumber) {
    try {
      console.log('Getting single product for site:', site, 'product:', productNumber);
      const repo = this._getRepository(site);
      const product = await repo.getProductByNumber(productNumber);
      
      if (!product) {
        return { 
          success: false, 
          error: `Product ${productNumber} not found` 
        };
      }
      
      return { 
        success: true, 
        data: product 
      };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateInkWeight(site, inkWeightData) {
    try {
      const repo = this._getRepository(site);
      // Validate required fields
      if (!inkWeightData.productNumber) {
        throw new Error('Product number is required');
      }
      
      // Mock update operation
      const updatedData = {
        ...inkWeightData,
        updatedAt: new Date().toISOString()
      };
      
      return { success: true, data: updatedData };
    } catch (error) {
      throw new Error(`Failed to update ink weight: ${error.message}`);
    }
  }

  async updateProductWeights(site, updates, confirmNewPica = false) {
    try {
      console.log('Updating product weights and codes for site:', site);
      console.log('Updates:', updates);
      console.log('Confirm new PICA:', confirmNewPica);
      
      const repo = this._getRepository(site);
      
      // If not confirming, do pre-validation to catch confirmation needs early
      if (!confirmNewPica) {
        console.log('Starting validation phase for all products...');
        for (const update of updates) {
          console.log(`Pre-validating product ${update.productNumber}...`);
          if (update.PICA_CD) {
            try {
              await this._validatePicaAndLotid(repo, update);
            } catch (validationError) {
              // If it's a confirmation error, pass it through
              if (validationError.code === 'PICA_CONFIRMATION_NEEDED') {
                throw validationError;
              }
              // Other validation errors
              throw new Error(`Validation failed for product ${update.productNumber}: ${validationError.message}`);
            }
          }
        }
        console.log('All products passed validation. Proceeding with updates...');
      }
      
      // Update each product
      const results = [];
      for (const update of updates) {
        console.log(`Updating product ${update.productNumber} with data:`, {
          WEIGHT_USL: update.WEIGHT_USL,
          WEIGHT_LSL: update.WEIGHT_LSL,
          PICA_CD: update.PICA_CD,
          MID_CD: update.MID_CD,
          LOTID_CD: update.LOTID_CD
        });
        
        const result = await repo.updateProductWeights(update, confirmNewPica);
        results.push(result);
      }
      
      return { 
        success: true, 
        message: `Updated ${results.length} products successfully`,
        results 
      };
    } catch (error) {
      console.error('Product update failed:', error.message);
      // Pass through confirmation errors with their code
      if (error.code === 'PICA_CONFIRMATION_NEEDED') {
        throw error;
      }
      throw new Error(`Failed to update product weights and codes: ${error.message}`);
    }
  }

  // Helper method for validation before batch updates
  async _validatePicaAndLotid(repo, updateData) {
    if (!updateData.PICA_CD) {
      return; // Skip validation if no PICA_CD
    }
    
    console.log(`Validating PICA_CD '${updateData.PICA_CD}' and LOTID_CD '${updateData.LOTID_CD}' for product ${updateData.productNumber}`);
    
    // Check if PICA_CD exists in nextcap database
    const picaValidationQuery = `
      SELECT MID, LOTID_CD 
      FROM dbo.pica_lkp 
      WHERE PICA_CD = @PICA_CD
    `;
    
    const picaResult = await repo.nextcapDb.query(picaValidationQuery, { 
      PICA_CD: updateData.PICA_CD 
    });
    
    if (!picaResult || picaResult.length === 0) {
      // PICA_CD not found - will be added, check MID uniqueness
      if (updateData.MID_CD) {
        const midCheckQuery = `
          SELECT PICA_CD 
          FROM dbo.pica_lkp 
          WHERE MID = @MID_CD
        `;
        
        const midResult = await repo.nextcapDb.query(midCheckQuery, { 
          MID_CD: updateData.MID_CD
        });
        
        if (midResult && midResult.length > 0) {
          throw new Error(`MID_CD '${updateData.MID_CD}' is already assigned to PICA_CD '${midResult[0].PICA_CD}'. Same MID cannot be assigned to multiple PICA codes.`);
        }
      }
      
      console.log(`PICA_CD '${updateData.PICA_CD}' will be added as new entry`);
      return;
    }
    
    // Check if LOTID_CD matches the existing one
    const existingLotidCd = picaResult[0].LOTID_CD;
    if (updateData.LOTID_CD && updateData.LOTID_CD !== existingLotidCd) {
      // Throw confirmation error
      const error = new Error(`LOTID_CD mismatch: Input '${updateData.LOTID_CD}' does not match existing '${existingLotidCd}' for PICA_CD '${updateData.PICA_CD}' in product ${updateData.productNumber}`);
      error.code = 'PICA_CONFIRMATION_NEEDED';
      error.details = {
        productNumber: updateData.productNumber,
        picaCd: updateData.PICA_CD,
        inputLotidCd: updateData.LOTID_CD,
        existingLotidCd: existingLotidCd
      };
      throw error;
    }
    
    console.log(`Validation passed: PICA_CD=${updateData.PICA_CD}, LOTID_CD=${updateData.LOTID_CD}`);
  }
}

module.exports = new ProductService();