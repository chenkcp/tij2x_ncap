const MSSQLDbProvider = require('./mssqlDbProvider');

class dbFactory {
  static create(config) {
    switch (config.client) {
      case 'mssql':
      case 'odbc':
        return new MSSQLDbProvider(config);
      default:
        throw new Error(`Unsupported DB client: ${config.client}`);
    }
  }
}

module.exports = dbFactory;