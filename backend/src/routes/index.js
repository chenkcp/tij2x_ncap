//defines API endpoints.
const express = require("express");
const resolveSite = require('../middleware/resolveSite');
const productRoutes = require('./productRoutes');
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Mount product routes with site resolution middleware
router.use('/sites/:siteCode', resolveSite);
router.use('/sites/:siteCode/products', productRoutes);

module.exports = router;