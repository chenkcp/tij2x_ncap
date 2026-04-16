const productService = require('../services/productService');

async function getFamilies(req, res, next) {
  try {
    const data = await productService.getFamilies(req.siteContext);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getProductLookup(req, res, next) {
  try {
    const { familyCode } = req.query;
    const data = await productService.getProductLookup(req.siteContext, familyCode);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const data = await productService.createProduct(req.siteContext, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateInkWeight(req, res, next) {
  try {
    const data = await productService.updateInkWeight(req.siteContext, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFamilies,
  getProductLookup,
  createProduct,
  updateInkWeight
};