const express = require('express');
const resolveSite = require('../middleware/resolveSite');
const controller = require('../controllers/productController');

const router = express.Router({ mergeParams: true });

router.use(resolveSite);

router.get('/families', controller.getFamilies);
router.get('/lookup', controller.getProductLookup);
router.post('/lookup', controller.createProduct);
router.put('/inkweight', controller.updateInkWeight);

module.exports = router;