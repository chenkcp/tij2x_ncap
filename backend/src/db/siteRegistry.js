// Load environment variables
require('dotenv').config();

// DEBUG: Check what environment variables are loaded
console.log('=== DEBUG Environment Variables ===');
console.log('CJA1_PRODUCT_DB_CONNECTION:', process.env.CJA1_PRODUCT_DB_CONNECTION?.substring(0, 80) + '...');
console.log('CJA1_NEXTCAP_DB_CONNECTION:', process.env.CJA1_NEXTCAP_DB_CONNECTION?.substring(0, 80) + '...');
console.log('Are they different?', 
  process.env.CJA1_PRODUCT_DB_CONNECTION !== process.env.CJA1_NEXTCAP_DB_CONNECTION
);

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
};