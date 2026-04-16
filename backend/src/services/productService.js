const dbFactory = require('../db/dbFactory');
const ProductRepository = require('../repositories/productRepository');

class ProductService {
  _getRepository(site) {
    const config = {
      client: 'mock',
      name: 'product',
      site: site
    };
    const db = dbFactory.create(config);
    return new ProductRepository(db);
  }

  async getFamilies(site) {
    try {
      const repo = this._getRepository(site);
      // Mock families data
      return [
        { family_code: 'FAM001', family_name: 'Family 1' },
        { family_code: 'FAM002', family_name: 'Family 2' },
        { family_code: 'FAM003', family_name: 'Family 3' }
      ];
    } catch (error) {
      throw new Error(`Failed to get families: ${error.message}`);
    }
  }

  async getProductLookup(site, familyCode) {
    try {
      const repo = this._getRepository(site);
      // Mock product lookup data
      const allProducts = [
        { id: 1, productNumber: 'P001', productName: 'Product 1', familyCode: 'FAM001' },
        { id: 2, productNumber: 'P002', productName: 'Product 2', familyCode: 'FAM001' },
        { id: 3, productNumber: 'P003', productName: 'Product 3', familyCode: 'FAM002' }
      ];
      
      if (familyCode) {
        return allProducts.filter(p => p.familyCode === familyCode);
      }
      return allProducts;
    } catch (error) {
      throw new Error(`Failed to get product lookup: ${error.message}`);
    }
  }

  async createProduct(site, productData) {
    try {
      const repo = this._getRepository(site);
      // Validate required fields
      if (!productData.productNumber || !productData.productName) {
        throw new Error('Product number and name are required');
      }
      
      // Mock create operation
      const newProduct = {
        id: Date.now(),
        ...productData,
        createdAt: new Date().toISOString()
      };
      
      return { success: true, product: newProduct };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
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
}

module.exports = new ProductService();