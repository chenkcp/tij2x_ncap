//defines API endpoints.
const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Product routes
router.get("/sites/:siteCode/products", (req, res) => {
  const { siteCode } = req.params;
  // TODO: Implement product logic
  res.json({ 
    message: `Products for site ${siteCode}`, 
    siteCode,
    products: []
  });
});

module.exports = router;