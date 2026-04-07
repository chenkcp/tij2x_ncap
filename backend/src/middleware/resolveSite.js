const siteRegistry = require('../db/siteRegistry');

function resolveSite(req, res, next) {
  const { siteCode } = req.params;
  const site = siteRegistry[siteCode];

  if (!site) {
    return res.status(400).json({ message: `Invalid site: ${siteCode}` });
  }

  req.siteContext = site;
  req.siteCode = siteCode;
  next();
}

module.exports = resolveSite;