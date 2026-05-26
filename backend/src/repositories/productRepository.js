class ProductRepository {
   constructor(productDb, nextcapDb) {
    this.productDb = productDb;      // For product-related queries
    this.nextcapDb = nextcapDb;      // For nextcap-related queries

  }

  async getAll() {
    // Placeholder method currently unused by active routes.
    return [];
  }

  async getFamilies(familyCode) {
    const query = `
      SELECT distinct product_type as family_code, product_type as family_name
      FROM dbo.products 
      ORDER BY product_type
    `;
    console.log(`[${this.nextcapDb?.dbName || 'nextcapDb'}] Fetching product families...`);
    console.log(`[${this.nextcapDb?.dbName || 'nextcapDb'}] Families query:`, query.replace(/\s+/g, ' ').trim());
    return await this.nextcapDb.query(query);
  }

  

   async getAllProducts(familyCode) {
    try {
      console.log('=== DEBUG getAllProducts ===');
      console.log('1. Input familyCode:', familyCode);
      console.log('2. Database connections available:');
      console.log('   - nextcapDb.dbName:', this.nextcapDb?.dbName);
      console.log('   - productDb.dbName:', this.productDb?.dbName);
      
      // Step 1: Query nextcap database to get product numbers for the selected family
      console.log('3. Starting Step 1: Query nextcap database');
      const familyQuery = `
        SELECT product_number 
        FROM dbo.products 
        WHERE product_type = @familyCode
      `;
      
      console.log('4. NextCap query:', familyQuery);
      console.log('5. Query parameters:', { familyCode });
      
      const productNumbers = await this.nextcapDb.query(familyQuery, { familyCode });
      console.log('6. NextCap query results:', productNumbers);
      console.log('7. Found', productNumbers?.length || 0, 'product numbers');
      
      // If no products found for this family, return empty array
      if (!productNumbers || productNumbers.length === 0) {
        console.log('8. No products found for family, returning empty array');
        return [];
      }
      
      // Extract product numbers into array
      const productNumberList = productNumbers.map(row => row.product_number);
      console.log('9. Product number list count:', productNumberList.length);
      
      // Remove duplicates to reduce parameter count
      const uniqueProductNumbers = [...new Set(productNumberList)];
      console.log('9b. Unique product numbers count:', uniqueProductNumbers.length);
      
      // Step 2: Query product database to get detailed information
      console.log('10. Starting Step 2: Query product database (dbo schema)');
      console.log('11. ProductDb connection string (masked):', this.productDb.connectionString?.replace(/Password=([^;]+)/gi, 'Password=***'));
      
      // Build IN clause with parameters (using unique product numbers)
      const placeholders = uniqueProductNumbers.map((_, index) => `@productNum${index}`).join(',');
      console.log('12. Placeholders count:', uniqueProductNumbers.length);
      
      const productQuery = `
        SELECT INV_ITEM_LK_NR as product_number,
              PRODUCT_NM as product_name,
              PICA_CD,
              REGION_CD,
              ID_FET_PRODUCT,
              ID_FET_MARKETING,
              MID_CD,
              SELECTABILITY_NR,
              PROD_GEN_CD,
              UPDATE_DM,
              UPDATE_USER_ID,
              INSERT_DTTM,
              UPDATE_DTTM,
              WEIGHT_USL,
              WEIGHT_LSL
        FROM dbo.product_ref_llk 
        WHERE INV_ITEM_LK_NR IN (${placeholders})
        ORDER BY INV_ITEM_LK_NR
      `;
      
      console.log('13. Product query:', productQuery);
      
      // Create parameters object for product numbers
      const params = {};
      uniqueProductNumbers.forEach((productNum, index) => {
        params[`productNum${index}`] = productNum;
      });
      console.log('14. Product query parameter count:', Object.keys(params).length);
      
      console.log('15. About to execute product query on productDb...');
      
      // Try to check what database we're connected to first
      try {
        const dbInfo = await this.productDb.query('SELECT DB_NAME() as current_db, @@SERVERNAME as server_name');
        console.log('16. Current database info:', dbInfo);
      } catch (dbInfoError) {
        console.log('16. Could not get database info:', dbInfoError.message);
      }
      
      // Try to check if the mfg schema exists
      try {
        const schemaCheck = await this.productDb.query(`
          SELECT SCHEMA_NAME 
          FROM INFORMATION_SCHEMA.SCHEMATA 
          WHERE SCHEMA_NAME = 'mfg'
        `);
        console.log('17. mfg schema exists:', schemaCheck?.length > 0 ? 'YES' : 'NO');
        if (schemaCheck?.length === 0) {
          console.log('18. Available schemas:');
          const allSchemas = await this.productDb.query(`
            SELECT SCHEMA_NAME 
            FROM INFORMATION_SCHEMA.SCHEMATA 
            ORDER BY SCHEMA_NAME
          `);
          console.log(allSchemas);
        }
      } catch (schemaError) {
        console.log('17. Could not check schema:', schemaError.message);
      }
      
      // Try to check if the product_ref_llk table exists in any schema
      try {
        const tableCheck = await this.productDb.query(`
          SELECT TABLE_SCHEMA, TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME LIKE '%product_ref%' OR TABLE_NAME LIKE '%product%'
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        console.log('18. Tables with "product" in name:', tableCheck);
      } catch (tableError) {
        console.log('18. Could not check tables:', tableError.message);
      }
      
      console.log('19. Executing main product query...');
      const result = await this.productDb.query(productQuery, params);
      console.log('20. Product query successful, returned', result?.length || 0, 'products');
      console.log('21. Sample result (first 2 products):', result?.slice(0, 2));
      
      return result;
      
    } catch (error) {
      console.error('=== ERROR in getAllProducts ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }
  async create(productData) {
    // Mock implementation
    return { id: Date.now(), ...productData };
  }

  async checkProductExists(productNumber) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM dbo.product_ref_llk 
        WHERE INV_ITEM_LK_NR = @productNumber
      `;
      const result = await this.productDb.query(query, { productNumber });
      return result[0].count > 0;
    } catch (error) {
      console.error('Error checking product existence:', error.message);
      return false; // Return false on error to be safe
    }
  }

  async getProductByNumber(productNumber) {
    try {
      console.log('Getting single product:', productNumber);
      
      const query = `
        SELECT INV_ITEM_LK_NR as product_number,
               PRODUCT_NM as product_name,
               PICA_CD,
               REGION_CD,
               ID_FET_PRODUCT,
               ID_FET_MARKETING,
               MID_CD,
               SELECTABILITY_NR,
               PROD_GEN_CD,
               UPDATE_DM,
               UPDATE_USER_ID,
               INSERT_DTTM,
               UPDATE_DTTM,
               WEIGHT_USL,
               WEIGHT_LSL
        FROM dbo.product_ref_llk 
        WHERE INV_ITEM_LK_NR = @productNumber
      `;
      
      const params = { productNumber };
      console.log('Executing single product query with params:', params);
      
      const result = await this.productDb.query(query, params);
      console.log('Single product query result:', result);
      
      if (result && result.length > 0) {
        return result[0]; // Return the single product
      } else {
        return null; // Product not found
      }
      
    } catch (error) {
      console.error('Error getting product by number:', error.message);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      const query = `
        INSERT INTO dbo.product_ref_llk (
          INV_ITEM_LK_NR, PRODUCT_NM, PICA_CD, REGION_CD, 
          ID_FET_PRODUCT, ID_FET_MARKETING, MID_CD, LOTID_CD,
          SELECTABILITY_NR, PROD_GEN_CD, UPDATE_DM, UPDATE_USER_ID,
          INSERT_DTTM, UPDATE_DTTM, WEIGHT_USL, WEIGHT_LSL
        )
        VALUES (
          @productNumber, @productName, @PICA_CD, @REGION_CD,
          @ID_FET_PRODUCT, @ID_FET_MARKETING, @MID_CD, @LOTID_CD,
          @SELECTABILITY_NR, @PROD_GEN_CD, @UPDATE_DM, @UPDATE_USER_ID,
          @INSERT_DTTM, @UPDATE_DTTM, @WEIGHT_USL, @WEIGHT_LSL
        )
      `;
      
      const params = {
        productNumber: productData.productNumber,
        productName: productData.productName,
        PICA_CD: productData.PICA_CD,
        REGION_CD: productData.REGION_CD,
        ID_FET_PRODUCT: productData.ID_FET_PRODUCT,
        ID_FET_MARKETING: productData.ID_FET_MARKETING,
        MID_CD: productData.MID_CD,
        LOTID_CD: productData.LOTID_CD,
        SELECTABILITY_NR: productData.SELECTABILITY_NR,
        PROD_GEN_CD: productData.PROD_GEN_CD,
        UPDATE_DM: productData.UPDATE_DM,
        UPDATE_USER_ID: productData.UPDATE_USER_ID,
        INSERT_DTTM: productData.INSERT_DTTM,
        UPDATE_DTTM: productData.UPDATE_DTTM,
        WEIGHT_USL: productData.WEIGHT_USL,
        WEIGHT_LSL: productData.WEIGHT_LSL
      };
      
      await this.productDb.query(query, params);
      
      // Also insert into nextcap products table for the product type
      if (productData.productType) {
        const nextcapQuery = `
          INSERT INTO dbo.products (product_number, product_name, product_type)
          VALUES (@productNumber, @productName, @productType)
        `;
        
        const nextcapParams = {
          productNumber: productData.productNumber,
          productName: productData.productName,
          productType: productData.productType
        };
        
        try {
          await this.nextcapDb.query(nextcapQuery, nextcapParams);
        } catch (nextcapError) {
          console.warn('Could not insert into nextcap products table:', nextcapError.message);
        }
      }
      
      return {
        id: Date.now(),
        ...productData,
        success: true
      };
      
    } catch (error) {
      console.error('Error creating product:', error.message);
      throw new Error(`Database insert failed: ${error.message}`);
    }
  }

  async update(id, productData) {
    // Mock implementation
    return { id, ...productData };
  }

  async updateProductWeights(updateData, confirmNewPica = false) {
    try {
      console.log('Updating product weights and codes in database:', updateData);
      
      // Validation and management of PICA_CD entries
      if (updateData.PICA_CD) {
        await this._validateAndManagePicaEntry(updateData, confirmNewPica);
      }
      
      const query = `
        UPDATE dbo.product_ref_llk 
        SET WEIGHT_USL = @WEIGHT_USL,
            WEIGHT_LSL = @WEIGHT_LSL,
            PICA_CD = @PICA_CD,
            MID_CD = @MID_CD,
            LOTID_CD = @LOTID_CD,
            UPDATE_DTTM = @UPDATE_DTTM,
            UPDATE_DM = @UPDATE_DM,
            UPDATE_USER_ID = @UPDATE_USER_ID
        WHERE INV_ITEM_LK_NR = @productNumber
      `;
      
      const params = {
        productNumber: updateData.productNumber,
        WEIGHT_USL: updateData.WEIGHT_USL,
        WEIGHT_LSL: updateData.WEIGHT_LSL,
        PICA_CD: updateData.PICA_CD,
        MID_CD: updateData.MID_CD,
        LOTID_CD: updateData.LOTID_CD,
        UPDATE_DTTM: new Date().toISOString(),
        UPDATE_DM: new Date().toISOString().split('T')[0], // Date only (YYYY-MM-DD)
        UPDATE_USER_ID: 'System User' // Will be replaced with actual user later
      };
      
      console.log('Executing weight and codes update query with params:', params);
      await this.productDb.query(query, params);
      
      return {
        productNumber: updateData.productNumber,
        success: true,
        updatedAt: params.UPDATE_DTTM
      };
      
    } catch (error) {
      console.error('Error updating product weights and codes:', error.message);
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  // Helper method for PICA_CD validation and management
  async _validateAndManagePicaEntry(updateData, confirmNewPica = false) {
    console.log('Validating PICA_CD and LOTID_CD for product:', updateData.productNumber);
    
    // Check if PICA_CD exists in nextcap database
    const picaValidationQuery = `
      SELECT MID as LOTID_CD 
      FROM dbo.pica_lkp 
      WHERE PICA_CD = @PICA_CD
    `;
    
    const picaResult = await this.nextcapDb.query(picaValidationQuery, { 
      PICA_CD: updateData.PICA_CD 
    });
    
    if (!picaResult || picaResult.length === 0) {
      // PICA_CD not found - need to add it
      console.log(`PICA_CD '${updateData.PICA_CD}' not found, will add to pica_lkp table`);
      await this._addNewPicaEntry(updateData);
    } else {
      // PICA_CD exists - check if LOTID_CD matches
      const existingLotidCd = picaResult[0].LOTID_CD;
      
      if (updateData.LOTID_CD !== existingLotidCd) {
        if (!confirmNewPica) {
          // Throw special error that frontend can catch to show confirmation dialog
          const error = new Error(`LOTID_CD mismatch: Input '${updateData.LOTID_CD}' does not match existing '${existingLotidCd}' for PICA_CD '${updateData.PICA_CD}' in product ${updateData.productNumber}`);
          error.code = 'PICA_CONFIRMATION_NEEDED';
          error.details = {
            productNumber: updateData.productNumber,
            picaCd: updateData.PICA_CD,
            inputLotidCd: updateData.LOTID_CD,
            existingLotidCd: existingLotidCd
          };
          throw error;
        } else {
          // User confirmed - add new combination
          console.log(`User confirmed new PICA/LOTID combination for ${updateData.PICA_CD}`);
          await this._addNewPicaEntry(updateData);
        }
      } else {
        console.log(`Validation passed: PICA_CD=${updateData.PICA_CD}, LOTID_CD=${updateData.LOTID_CD}`);
      }
    }
  }

  // Helper method to add new PICA entry with MID_CD uniqueness validation
  async _addNewPicaEntry(updateData) {
    // Check if MID_CD is already assigned to another PICA_CD
    if (updateData.MID_CD) {
      const midCheckQuery = `
        SELECT PICA_CD 
        FROM dbo.pica_lkp 
        WHERE MID = @LOTID_CD AND PICA_CD != @PICA_CD
      `;
      
      const midResult = await this.nextcapDb.query(midCheckQuery, { 
        LOTID_CD: updateData.LOTID_CD,
        PICA_CD: updateData.PICA_CD
      });
      
      if (midResult && midResult.length > 0) {
        throw new Error(`LOTID_CD '${updateData.LOTID_CD}' is already assigned to PICA_CD '${midResult[0].PICA_CD}'. Same LOTID cannot be assigned to multiple PICA codes.`);
      }
    }
    
    // Insert new entry into pica_lkp table
    const insertPicaQuery = `
      INSERT INTO dbo.pica_lkp (PICA_CD, MID, UPDATE_DTTM, UPDATE_USER_ID)
      VALUES (@PICA_CD, @LOTID_CD, @UPDATE_DTTM, @UPDATE_USER_ID)
    `;
    
    const picaParams = {
      PICA_CD: updateData.PICA_CD,
      MID: updateData.LOTID_CD,
      UPDATE_DTTM: new Date().toISOString(),
      UPDATE_USER_ID: 'System User'
    };
    
    console.log('Adding new PICA entry:', picaParams);
    await this.nextcapDb.query(insertPicaQuery, picaParams);
    console.log(`Successfully added new PICA entry: ${updateData.PICA_CD} -> ${updateData.LOTID_CD}`);
  }

  async getProductsWithPagination(options = {}) {
    try {
      const { page = 1, limit = 50, search = '' } = options;
      const offset = (page - 1) * limit;

      console.log('Getting products with pagination:', { page, limit, search, offset });

      // Build the WHERE clause for search
      let whereClause = '';
      let searchParams = {};
      
      if (search.trim()) {
        whereClause = `WHERE (INV_ITEM_LK_NR LIKE @search OR PRODUCT_NM LIKE @search)`;
        searchParams.search = `%${search.trim()}%`;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM dbo.product_ref_llk 
        ${whereClause}
      `;

      const countResult = await this.productDb.query(countQuery, searchParams);
      const total = countResult[0]?.total || 0;

      // Get paginated data
      const dataQuery = `
        SELECT INV_ITEM_LK_NR, PRODUCT_NM AS product_name
        FROM dbo.product_ref_llk 
        ${whereClause}
        ORDER BY INV_ITEM_LK_NR
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const dataParams = {
        ...searchParams,
        offset,
        limit
      };

      console.log('Executing pagination query:', dataQuery);
      console.log('With parameters:', dataParams);

      const data = await this.productDb.query(dataQuery, dataParams);

      console.log(`Pagination results: ${data.length} items out of ${total} total`);

      return {
        data,
        total,
        page,
        limit
      };

    } catch (error) {
      console.error('Error in getProductsWithPagination:', error);
      throw error;
    }
  }
}

module.exports = ProductRepository;