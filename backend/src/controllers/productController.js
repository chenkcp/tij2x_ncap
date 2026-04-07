const productService = require('../services/productService');

async function getFamilies(req, res) {
  const data = await productService.getFamilies(req.siteContext);
  res.json(data);
}

async function getProductLookup(req, res) {
  const { familyCode } = req.query;
  const data = await productService.getProductLookup(req.siteContext, familyCode);
  res.json(data);
}

async function createProduct(req, res) {
  const data = await productService.createProduct(req.siteContext, req.body);
  res.status(201).json(data);
}

async function updateInkWeight(req, res) {
  const data = await productService.updateInkWeight(req.siteContext, req.body);
  res.json(data);
}

module.exports = {
  getFamilies,
  getProductLookup,
  createProduct,
  updateInkWeight
};