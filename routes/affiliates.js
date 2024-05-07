const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const crypto = require("crypto");


Router.route("/").post(async (req, res) => {
  const { productId, affiliateId } = req?.body;

  try {
    if (!productId || !affiliateId) {
      return res
        .status(400)
        .json({ error: "Product ID and Affiliate ID are required." });
    }

    const product = await dataModel.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const hash = generateHash(product, productId, affiliateId);

    return res.status(200).json({ productId, affiliateId, hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/:affiliateId/:hash").get(async (req, res) => {
  const { affiliateId, hash } = req.params;

  try {
    const validUser = await dataModel.aggregate({ $match: { affiliateId } });
    if (validUser) {
      const product = await findProductByHash(hash);

      if (!product) {
        return res.status(404).json({ error: "Product not found." });
      }

      return res.status(200).json(product);
    } else {
      return res.status(404).json({ Alert: "User not found" });
    }
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

async function findProductByHash(hash) {
  return await dataModel.findOne({ hash });
}

module.exports = Router;
