//defines API endpoints.
const express = require("express");
const resolveSite = require('../middleware/resolveSite');
const productRoutes = require('./productRoutes');
const nextcapRoutes = require('./nextcapRoutes');
const authRoutes = require('./auth');
const router = express.Router();

// Public authentication routes (no site resolution needed)
router.use('/auth', authRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Mount product routes with site resolution middleware
router.use('/sites/:siteCode', resolveSite);
router.use('/sites/:siteCode/products', productRoutes);

// Mount nextcap routes with site resolution middleware  
router.use('/sites/:siteCode/nextcap', nextcapRoutes);

module.exports = router;