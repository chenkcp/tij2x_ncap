const MSSQLDbProvider = require('./mssqlDbProvider');

class dbFactory {
  static create(config) {
    switch (config.client) {
      case 'mssql':
        return new MSSQLDbProvider(config);
        //throw new Error('MSSQL provider not implemented yet');
      default:
        throw new Error(`Unsupported DB client: ${config.client}`);
    }
  }
}

module.exports = dbFactory;