const express = require('express');
const resolveSite = require('../middleware/resolveSite');
const controller = require('../controllers/productController');

const router = express.Router({ mergeParams: true });

router.use(resolveSite);
router.get('/site-info', controller.getSiteInfo);
router.get('/families', controller.getFamilies);
router.get('/lookup', controller.getProductLookup);
router.get('/check/:productNumber', controller.checkProductExists);  // Add this route
router.get('/single/:productNumber', controller.getProductByNumber);  // Add this route
router.post('/lookup', controller.createProduct);
router.put('/inkweight', controller.updateInkWeight);
router.put('/weights', controller.updateProductWeights);

module.exports = router;