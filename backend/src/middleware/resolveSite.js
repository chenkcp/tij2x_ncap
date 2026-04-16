const siteRegistry = require('../db/siteRegistry');

function resolveSite(req, res, next) {
  try {
    const { siteCode } = req.params;
    const site = siteRegistry[siteCode];

    if (!site) {
      const error = new Error(`Invalid site: ${siteCode}`);
      error.statusCode = 400;
      return next(error);
    }

    req.siteContext = site;
    req.siteCode = siteCode;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = resolveSite;