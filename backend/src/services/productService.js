const DbProviderFactory = require('../db/dbProviderFactory');
const productRepository = require('../repositories/productRepository');

async function getFamilies(siteContext) {
  const db = DbProviderFactory.create(siteContext.productDb);
  return productRepository.getFamilies(db);
}

async function getProductLookup(siteContext, familyCode) {
  const db = DbProviderFactory.create(siteContext.productDb);
  return productRepository.getProductLookup(db, familyCode);
}

async function createProduct(siteContext, payload) {
  const db = DbProviderFactory.create(siteContext.productDb);
  return productRepository.createProduct(db, payload);
}

async function updateInkWeight(siteContext, payload) {
  const db = DbProviderFactory.create(siteContext.productDb);
  return productRepository.updateInkWeight(db, payload);
}

module.exports = {
  getFamilies,
  getProductLookup,
  createProduct,
  updateInkWeight
};