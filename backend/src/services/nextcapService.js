const dbFactory = require('../db/dbFactory');
const NextcapRepository = require('../repositories/nextcapRepository');

class NextcapService {
  _getRepository(site) {
    // Validate site object
    if (!site) {
      throw new Error('Site object is null or undefined. Check resolveSite middleware.');
    }
    
    if (!site.nextcapDb) {
      throw new Error('Site configuration incomplete. Missing nextcapDb.');
    }
    
    console.log('=== DEBUG NextcapService _getRepository ===');
    console.log('Site.nextcapDb:', site.nextcapDb);
    
    const nextcapDbConfig = {
      client: site.nextcapDb.client,
      connectionString: site.nextcapDb.connectionString,
      name: site.nextcapDb.name
    };
    
    console.log('NextcapDb config (masked):', {
      client: nextcapDbConfig.client,
      connectionString: nextcapDbConfig.connectionString?.substring(0, 50) + '...',
      name: nextcapDbConfig.name
    });
    
    const nextcapDb = dbFactory.create(nextcapDbConfig);
    
    // Pass nextcap database connection to NextcapRepository
    return new NextcapRepository(nextcapDb);
  }

  async getClients(site) {
    try {
      console.log('Getting nextcap clients for site:', site);
      const repo = this._getRepository(site);
      const clients = await repo.getClients();
      console.log('Found clients:', clients.length);
      return { success: true, data: clients };
    } catch (error) {
      console.error('Error in getClients:', error);
      throw new Error(`Failed to get nextcap clients: ${error.message}`);
    }
  }

  async getProducts(site, params) {
    try {
      console.log('Getting nextcap products for site:', site);
      console.log('Params:', params);
      const repo = this._getRepository(site);
      const products = await repo.getProducts(params);
      console.log('Found products:', products.length);
      return { success: true, data: products };
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw new Error(`Failed to get nextcap products: ${error.message}`);
    }
  }

  async updateProducts(site, updates) {
    try {
      console.log('Updating nextcap products for site:', site);
      console.log('Updates:', updates);
      
      const repo = this._getRepository(site);
      
      // Update each product
      const results = [];
      for (const update of updates) {
        console.log(`Updating nextcap product:`, update);
        
        const result = await repo.updateProduct(update);
        results.push(result);
      }
      
      return { 
        success: true, 
        message: `Updated ${results.length} products successfully`,
        results 
      };
    } catch (error) {
      throw new Error(`Failed to update nextcap products: ${error.message}`);
    }
  }

  async deleteProducts(site, client, products) {
    try {
      console.log('Deleting nextcap products for site:', site);
      console.log('Client:', client);
      console.log('Products to delete:', products.length);
      
      const repo = this._getRepository(site);
      
      // Delete each product
      const results = [];
      for (const product of products) {
        console.log(`Deleting nextcap product:`, product.product_number);
        
        const result = await repo.deleteProduct({
          line_type: client.line_type,
          line_number: client.line_number,
          source: client.source,
          product_number: product.product_number,
          product_name: product.product_name
        });
        results.push(result);
      }
      
      return { 
        success: true, 
        message: `Deleted ${results.length} products successfully`,
        results 
      };
    } catch (error) {
      throw new Error(`Failed to delete nextcap products: ${error.message}`);
    }
  }

  async insertProducts(site, client, products) {
    try {
      console.log('Inserting nextcap products for site:', site);
      console.log('Client:', client);
      console.log('Products to insert:', products.length);
      
      const repo = this._getRepository(site);
      
      // Insert each product
      const results = [];
      for (const product of products) {
        console.log(`Inserting nextcap product:`, product.product_number);
        
        const result = await repo.insertProduct({
          line_type: client.line_type,
          line_number: client.line_number,
          source: client.source,
          product_number: product.product_number,
          product_name: product.product_name,
          product_type: product.product_type || 'DEFAULT'
        });
        results.push(result);
      }
      
      return { 
        success: true, 
        message: `Inserted ${results.length} products successfully`,
        results 
      };
    } catch (error) {
      throw new Error(`Failed to insert nextcap products: ${error.message}`);
    }
  }
}

module.exports = new NextcapService();