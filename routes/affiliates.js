const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const AffiliateModel = require("../models/affiliateModel"); // Import AffiliateModel
const userModel = require("../models/userModel");
const crypto = require("crypto");

Router.route("/").post(async (req, res) => {
  //hashing to url
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

Router.route("/affiliated").post(async (req, res) => { //join affiliate program
  const { userId } = req?.body;
  if (!userId) return res.status(400).json({ alert: "User required!" });

  const userExists = await userModel.findById(userId);
  if (!userExists) {
    return res.status(404).json({ Alert: "User not found" });
  }

  const state = await userExists.updateOne({ affiliated: true });
  if (!state) {
    return res.status(403).json({ alert: "Error while updating!" });
  } else {
    return res.status(200).json({ Alert: "Affiliate Updated!" });
  }
});

Router.route("/:productId/affiliate/:affiliateId").get(async (req, res) => {
  //amazon url to redirect type system
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

    const outcome = logAffiliateReferral(affiliateId, productId); //why?

    return res.status(200).json(outcome);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

function generateHash(product, productId, affiliateId) {
  //hashing
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
