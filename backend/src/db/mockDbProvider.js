const mockDataByDb = {
  CJA1_PRODUCT_DB: {
    families: [
      { family_code: 'AXUM', family_name: 'AXUM' },
      { family_code: 'BRONZE', family_name: 'BRONZE' }
    ],
    products: [
      { product_number: '3YM56-60002', product_name: 'Axum', family_code: 'AXUM', line_type: 'GEO', source: 'Z1A-CPM' },
      { product_number: '3YP42-60001', product_name: 'Bronze A 803', family_code: 'BRONZE', line_type: 'GEO', source: 'Z1A-CPM' }
    ]
  },
  CJA2_PRODUCT_DB: {
    families: [{ family_code: 'OEM', family_name: 'OEM' }],
    products: [{ product_number: '1VB22-65003', product_name: '90ML Black', family_code: 'OEM', line_type: 'BJC', source: 'Q5' }]
  },
  PDY1_PRODUCT_DB: {
    families: [{ family_code: 'CLEO', family_name: 'CLEO' }],
    products: [{ product_number: '3JB26-30001', product_name: 'CLEO 67/305 II LONG', family_code: 'CLEO', line_type: 'GEO', source: 'V0' }]
  },
  PDY2_PRODUCT_DB: {
    families: [{ family_code: 'NODI', family_name: 'NODI' }],
    products: [{ product_number: '3UB10-30001', product_name: 'NODI', family_code: 'NODI', line_type: 'GEO', source: 'P1' }]
  }
};

class MockDbProvider {
  constructor(config) {
    this.dbName = config.name;
  }

  getFamilies() {
    return mockDataByDb[this.dbName]?.families || [];
  }

  getProductsByFamily(familyCode) {
    const rows = mockDataByDb[this.dbName]?.products || [];
    if (!familyCode) return rows;
    return rows.filter((row) => row.family_code === familyCode);
  }

  insertProduct(payload) {
    const row = {
      product_number: payload.productNumber,
      product_name: payload.productName,
      family_code: payload.familyCode,
      line_type: payload.lineType,
      source: payload.source
    };
    mockDataByDb[this.dbName].products.push(row);
    return row;
  }

  updateInkWeight(payload) {
    return {
      productNumber: payload.productNumber,
      newLsl: payload.newLsl,
      newUsl: payload.newUsl,
      updatedUser: payload.updatedUser,
      updated: true
    };
  }
}

module.exports = MockDbProvider;