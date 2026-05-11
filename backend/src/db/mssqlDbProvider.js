const sql = require('mssql');

class MSSQLDbProvider {
  constructor(config) {
    this.connectionString = config.connectionString;
    this.dbName = config.name;
    this.pool = null;
    
    // Add unique identifier to prevent connection reuse
    this.uniqueId = Math.random().toString(36).substring(7);
    console.log(`[${this.dbName}] MSSQLDbProvider created with ID: ${this.uniqueId}`);
  }

  async connect() {
    if (!this.pool) {
      try {
        console.log(`[${this.dbName}] Creating new connection pool...`);
        console.log(`[${this.dbName}] Connection string: ${this.connectionString.substring(0, 80)}...`);
        
        // Create a new connection pool instead of using global sql.connect()
        this.pool = new sql.ConnectionPool(this.connectionString);
        await this.pool.connect();
        
        console.log(`[${this.dbName}] Successfully connected to database`);
        
        // Verify connection
        const request = this.pool.request();
        const result = await request.query('SELECT DB_NAME() as current_db, @@SERVERNAME as server_name');
        console.log(`[${this.dbName}] Verified connection:`, result.recordset[0]);
        
      } catch (error) {
        console.error(`[${this.dbName}] Connection failed:`, error.message);
        throw error;
      }
    }
    return this.pool;
  }

  async query(sqlQuery, params = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();
      
      // Add parameters
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      console.log(`[${this.dbName}] Executing query: ${sqlQuery.substring(0, 100)}...`);
      const result = await request.query(sqlQuery);
      console.log(`[${this.dbName}] Query returned ${result.recordset?.length || 0} rows, affected: ${result.rowsAffected?.[0] || 0} rows`);
      
      // For SELECT queries, return recordset for backward compatibility
      // For INSERT/UPDATE/DELETE queries, return full result object with rowsAffected
      const trimmedQuery = sqlQuery.trim().toUpperCase();
      if (trimmedQuery.startsWith('SELECT')) {
        return result.recordset;
      } else {
        // For modification queries (INSERT, UPDATE, DELETE), return full result
        return result;
      }
    } catch (error) {
      console.error(`[${this.dbName}] Query failed:`, error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log(`[${this.dbName}] Connection pool closed`);
    }
  }
}

module.exports = MSSQLDbProvider;