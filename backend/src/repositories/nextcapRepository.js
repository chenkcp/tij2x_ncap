class NextcapRepository {
  constructor(db) {
    this.db = db;
  }

  async getClients() {
    console.log('NextcapRepository: Getting clients');
    
    // Use the correct column names that exist in the database
    const query = `
      SELECT client_name, line_type, line_number, source 
      FROM nextcap_cm.dbo.client_customers
      ORDER BY client_name, line_type, line_number, source
    `;
    
    console.log('SQL Query:', query);
    
    try {
      const result = await this.db.query(query);
      console.log('Query successful! Returned', result.length, 'rows');
      if (result.length > 0) {
        console.log('Sample data:', result[0]);
      }
      return result;
    } catch (error) {
      console.error('Database error in getClients:', error);
      throw error;
    }
  }

  async getProducts(params) {
    console.log('NextcapRepository: Getting products with params:', params);
    
    // Extract parameters with proper type conversion
    const { line_type = 'GEO', line_number = 22, source = 'Z3-CPM' } = params;
    
    // Ensure line_number is an integer
    const lineNumberInt = parseInt(line_number, 10);
    
    console.log('Processed params:', {
      line_type,
      line_number: lineNumberInt,
      source
    });
    
    const query = `
      SELECT line_type, line_number, [source], product_name, product_number, product_type 
      FROM nextcap_cm.dbo.products 
      WHERE line_type = @line_type 
        AND line_number = @line_number 
        AND [source] = @source
      ORDER BY product_name
    `;
    
    const queryParams = {
      line_type,
      line_number: lineNumberInt,
      source
    };
    
    console.log('SQL Query:', query);
    console.log('Query params:', queryParams);
    
    try {
      const result = await this.db.query(query, queryParams);
      console.log('Query result count:', result.length);
      return result;
    } catch (error) {
      console.error('Database error in getProducts:', error);
      throw error;
    }
  }

  async updateProduct(update) {
    console.log('NextcapRepository: Updating product:', update);
    
    // Extract update parameters
    const { 
      line_type, 
      line_number, 
      source, 
      product_name, 
      product_number, 
      product_type,
      // For identifying the record to update
      original_product_name,
      original_product_number
    } = update;
    
    // Ensure line_number is an integer
    const lineNumberInt = parseInt(line_number, 10);
    
    // Build update clause dynamically based on what's being updated
    const updateFields = [];
    const queryParams = {
      // WHERE clause parameters
      where_line_type: line_type,
      where_line_number: lineNumberInt,
      where_source: source,
      where_product_name: original_product_name || product_name,
      where_product_number: original_product_number || product_number
    };
    
    if (product_name !== undefined) {
      updateFields.push('product_name = @product_name');
      queryParams.product_name = product_name;
    }
    
    if (product_number !== undefined) {
      updateFields.push('product_number = @product_number');
      queryParams.product_number = product_number;
    }
    
    if (product_type !== undefined) {
      updateFields.push('product_type = @product_type');
      queryParams.product_type = product_type;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE nextcap_cm.dbo.products 
      SET ${updateFields.join(', ')}
      WHERE line_type = @where_line_type 
        AND line_number = @where_line_number 
        AND [source] = @where_source
        AND product_name = @where_product_name 
        AND product_number = @where_product_number
    `;
    
    console.log('SQL Update Query:', query);
    console.log('All params:', queryParams);
    
    try {
      const result = await this.db.query(query, queryParams);
      console.log('Update result:', result);
      
      // Return indication of success
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
        updatedProduct: update
      };
    } catch (error) {
      console.error('Database error in updateProduct:', error);
      throw error;
    }
  }

  async deleteProduct(params) {
    console.log('NextcapRepository: Deleting product:', params);
    
    const { 
      line_type, 
      line_number, 
      source, 
      product_name, 
      product_number 
    } = params;
    
    // Ensure line_number is an integer
    const lineNumberInt = parseInt(line_number, 10);
    
    const query = `
      DELETE FROM nextcap_cm.dbo.products 
      WHERE line_type = @line_type 
        AND line_number = @line_number 
        AND [source] = @source
        AND product_name = @product_name 
        AND product_number = @product_number
    `;
    
    const queryParams = {
      line_type: line_type,
      line_number: lineNumberInt,
      source: source,
      product_name: product_name,
      product_number: product_number
    };
    
    console.log('SQL Delete Query:', query);
    console.log('Delete params:', queryParams);
    
    try {
      const result = await this.db.query(query, queryParams);
      console.log('Delete result:', result);
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
        deletedProduct: params
      };
    } catch (error) {
      console.error('Database error in deleteProduct:', error);
      throw error;
    }
  }

  async insertProduct(params) {
    console.log('NextcapRepository: Inserting product:', params);
    
    const { 
      line_type, 
      line_number, 
      source, 
      product_name, 
      product_number,
      product_type 
    } = params;
    
    // Ensure line_number is an integer
    const lineNumberInt = parseInt(line_number, 10);
    
    const query = `
      INSERT INTO nextcap_cm.dbo.products 
      (line_type, line_number, [source], product_name, product_number, product_type)
      VALUES (@line_type, @line_number, @source, @product_name, @product_number, @product_type)
    `;
    
    const queryParams = {
      line_type: line_type,
      line_number: lineNumberInt,
      source: source,
      product_name: product_name,
      product_number: product_number,
      product_type: product_type || 'DEFAULT'
    };
    
    console.log('SQL Insert Query:', query);
    console.log('Insert params:', queryParams);
    
    try {
      const result = await this.db.query(query, queryParams);
      console.log('Insert result:', result);
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
        insertedProduct: params
      };
    } catch (error) {
      console.error('Database error in insertProduct:', error);
      throw error;
    }
  }
}

module.exports = NextcapRepository;