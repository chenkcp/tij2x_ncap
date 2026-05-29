const sql = require('mssql');

class MSSQLDbProvider {
  constructor(config) {
    this.connectionString = config.connectionString;
    this.dbName = config.name;
    this.pool = null;
    this.uniqueId = Math.random().toString(36).substring(7);
    console.log(`[${this.dbName}] MSSQLDbProvider created with ID: ${this.uniqueId}`);
  }

  _toBool(value, fallback = false) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    const normalized = String(value).trim().toLowerCase();
    if (['true', 'yes', '1'].includes(normalized)) return true;
    if (['false', 'no', '0'].includes(normalized)) return false;
    return fallback;
  }

  _toMs(value, fallbackMs) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      return fallbackMs;
    }
    return n * 1000;
  }

  _toMssqlConfig(rawConnectionString) {
    if (!rawConnectionString) {
      throw new Error(`[${this.dbName}] Missing connection string`);
    }

    const pairs = rawConnectionString
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        if (idx < 0) {
          return null;
        }
        const key = part.slice(0, idx).trim().toLowerCase();
        const value = part.slice(idx + 1).trim();
        return [key, value];
      })
      .filter(Boolean);

    const source = Object.fromEntries(pairs);

    const serverRaw = source.server || source['data source'] || source.address;
    const [server, portRaw] = String(serverRaw || '').split(',');

    const database = source.database || source['initial catalog'];
    const user = source['user id'] || source.uid || source.user;
    const password = source.password || source.pwd;

    const encrypt = this._toBool(source.encrypt, true);
    const trustServerCertificate = this._toBool(source.trustservercertificate, true);
    const connectionTimeoutMs = this._toMs(
      source['connection timeout'] || source.connectiontimeout,
      60000
    );

    return {
      server,
      port: Number(portRaw) || 1433,
      database,
      user,
      password,
      options: {
        encrypt,
        trustServerCertificate,
        enableArithAbort: true
      },
      connectionTimeout: connectionTimeoutMs,
      requestTimeout: connectionTimeoutMs,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }

  _extractParamNames(sqlQuery) {
    const matches = sqlQuery.match(/(?<!@)@([A-Za-z_][A-Za-z0-9_]*)/g) || [];
    return [...new Set(matches.map((m) => m.slice(1)))];
  }

  async connect() {
    if (!this.pool) {
      try {
        const mssqlConfig = this._toMssqlConfig(this.connectionString);
        this.pool = new sql.ConnectionPool(mssqlConfig);
        await this.pool.connect();
        console.log(`[${this.dbName}] Successfully connected via mssql`);
      } catch (error) {
        console.error(`[${this.dbName}] MSSQL connection failed:`, error.message);
        throw new Error(`[${this.dbName}] ${error.message}`);
      }
    }
    return this.pool;
  }

  async query(sqlQuery, params = {}) {
    try {
      console.log(`[${this.dbName}] Query requested; params keys:`, Object.keys(params));
      const pool = await this.connect();
      const request = pool.request();

      const paramNames = this._extractParamNames(sqlQuery);
      const missing = paramNames.filter((name) => !Object.prototype.hasOwnProperty.call(params, name));
      if (missing.length > 0) {
        throw new Error(`[${this.dbName}] Missing SQL parameters: ${missing.join(', ')}`);
      }

      for (const name of paramNames) {
        request.input(name, params[name]);
      }

      const queryPreview = sqlQuery.replace(/\s+/g, ' ').trim();
      console.log(`[${this.dbName}] Executing query: ${queryPreview.substring(0, 120)}...`);

      const result = await request.query(sqlQuery);
      const trimmedQuery = sqlQuery.trim().toUpperCase();

      if (trimmedQuery.startsWith('SELECT')) {
        return result.recordset || [];
      }

      const rowsAffected = Array.isArray(result.rowsAffected)
        ? result.rowsAffected.reduce((sum, count) => sum + count, 0)
        : 0;

      return { rowsAffected };
    } catch (error) {
      console.error(`[${this.dbName}] Query failed:`, error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log(`[${this.dbName}] MSSQL connection closed`);
    }
  }
}

module.exports = MSSQLDbProvider;