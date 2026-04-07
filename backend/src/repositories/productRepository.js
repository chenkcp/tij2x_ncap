function getFamilies(db) {
  return db.getFamilies();
}

function getProductLookup(db, familyCode) {
  return db.getProductsByFamily(familyCode);
}

function createProduct(db, payload) {
  return db.insertProduct(payload);
}

function updateInkWeight(db, payload) {
  return db.updateInkWeight(payload);
}

module.exports = {
  getFamilies,
  getProductLookup,
  createProduct,
  updateInkWeight
};