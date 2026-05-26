// Connection strings are injected into process.env before this module is loaded:
// - In production (ECS): loaded from AWS Secrets Manager via loadSecrets() in server.js
// - In development: loaded from .env via dotenv in server.js

module.exports = {
  CJASite_1: {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA1_PRODUCT_DB_CONNECTION,
      name: 'CJA1_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA1_NEXTCAP_DB_CONNECTION,
      name: 'CJA1_NEXTCAP_DB' 
    }
  },
  CJASite_2: {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA2_PRODUCT_DB_CONNECTION,
      name: 'CJA2_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA2_NEXTCAP_DB_CONNECTION,
      name: 'CJA2_NEXTCAP_DB' 
    }
  },
  PDYSite_1: {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.PDY1_PRODUCT_DB_CONNECTION,
      name: 'PDY1_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.PDY1_NEXTCAP_DB_CONNECTION,
      name: 'PDY1_NEXTCAP_DB' 
    }
  },
  PDYSite_2: {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.PDY2_PRODUCT_DB_CONNECTION,
      name: 'PDY2_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.PDY2_NEXTCAP_DB_CONNECTION,
      name: 'PDY2_NEXTCAP_DB' 
    }
  },
  'STL-TUAS': {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.STL_TUAS_PRODUCT_DB_CONNECTION,
      name: 'STL_TUAS_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.STL_TUAS_NEXTCAP_DB_CONNECTION,
      name: 'STL_TUAS_NEXTCAP_DB' 
    }
  },
  'CJA-Penang': {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA_Penang_PRODUCT_DB_CONNECTION,
      name: 'CJA_Penang_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.CJA_Penang_NEXTCAP_DB_CONNECTION,
      name: 'CJA_Penang_NEXTCAP_DB' 
    }
  },
  'TEST': {
    productDb: { 
      client: 'mssql', 
      connectionString: process.env.TEST_PRODUCT_DB_CONNECTION,
      name: 'TEST_PRODUCT_DB' 
    },
    nextcapDb: { 
      client: 'mssql', 
      connectionString: process.env.TEST_NEXTCAP_DB_CONNECTION,
      name: 'TEST_NEXTCAP_DB' 
    }
  },
};