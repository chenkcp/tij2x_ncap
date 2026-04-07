const MockDbProvider = require('./mockDbProvider');

class DbProviderFactory {
  static create(config) {
    switch (config.client) {
      case 'mock':
        return new MockDbProvider(config);
      default:
        throw new Error(`Unsupported DB client: ${config.client}`);
    }
  }
}

module.exports = DbProviderFactory;