module.exports = {
  SITE_A: {
    productDb: {
      host: process.env.SITE_A_PRODUCT_DB_HOST
    },
    nextcapDb: {
      host: process.env.SITE_A_NEXTCAP_DB_HOST
    }
  },
  SITE_B: {
    productDb: {
      host: process.env.SITE_B_PRODUCT_DB_HOST
    },
    nextcapDb: {
      host: process.env.SITE_B_NEXTCAP_DB_HOST
    }
  }
};