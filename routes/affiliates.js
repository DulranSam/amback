const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const AffiliateModel = require("../models/affiliateModel"); // Import AffiliateModel
const crypto = require("crypto");

Router.route("/").post(async (req, res) => {
  const { productId, affiliateId } = req?.body;

  try {
    if (!productId || !affiliateId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    const product = await dataModel.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const affiliate = await AffiliateModel.findById(affiliateId);

    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate not found." });
    }

    const hash = generateHash(product, productId, affiliateId);
    const affiliateLink = `/products/${productId}/affiliate/${affiliateId}?hash=${hash}`;

    return res.status(200).json({ affiliateLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/:productId/affiliate/:affiliateId").get(async (req, res) => {
  const { productId, affiliateId } = req.params;
  const hash = req.query.hash;

  if (!productId || !affiliateId || !hash) {
    return res.status(400).json({ Alert: "Required fields missing!" });
  }

  try {
    const validProduct = await findProductByHash(productId, hash);

    if (!validProduct) {
      return res.status(404).json({ error: "Invalid product or hash." });
    }

    logAffiliateReferral(affiliateId, productId);

    return res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

function generateHash(product, productId, affiliateId) {
  const dataToHash = `${product.title}-${product.description}-${product.mediaUrl}-${product.mediaType}-${product.link}-${product.category}-${product.commission}-${productId}-${affiliateId}`;
  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
  return hash;
}

async function findProductByHash(productId, hash) {
  return await dataModel.findOne({ _id: productId, hash });
}

function logAffiliateReferral(affiliateId, productId) {
  console.log(`Affiliate ${affiliateId} referred product ${productId}`);
}

module.exports = Router;
