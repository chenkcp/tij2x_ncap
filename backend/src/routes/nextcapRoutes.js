const express = require('express');
const resolveSite = require('../middleware/resolveSite');
const controller = require('../controllers/nextcapController');

const router = express.Router({ mergeParams: true });

router.use(resolveSite);
router.get('/clients', controller.getClients);
router.get('/products', controller.getProducts);
router.put('/products', controller.updateProducts);
router.delete('/products', controller.deleteProducts);
router.post('/products', controller.insertProducts);

// Test simple route first
router.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Product reference routes for drag and drop lists  
router.get('/product-ref', controller.getProductReference);

module.exports = router;