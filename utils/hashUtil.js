const crypto = require('crypto');

function generateHash(product, productId, affiliateId) {
  const dataToHash = `${product.title}-${product.description}-${product.mediaUrl}-${product.mediaType}-${product.link}-${product.category}-${product.commission}-${productId}-${affiliateId}`;
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  return hash;
}

module.exports = generateHash;
