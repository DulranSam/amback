const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const AffiliateModel = require("../models/affiliateModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const crypto = require("crypto");
const comissionModel = require("../models/comissionModel");


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

    const affiliate = await userModel.findById(affiliateId);

    if (!affiliate) {
      return res.status(404).json({ error: "User not found" });
    } else if (!affiliate.affiliated) {
      return res.status(500).json({ error: "User not affiliated" });
    }

    const hash = generateHash(product, productId, affiliateId);
    const affiliateLink = `/products/${productId}/affiliate/${affiliateId}?hash=${hash}`;

    return res.status(200).json({ affiliateLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/affiliated").post(async (req, res) => {
  //join affiliate program
  const { userId } = req?.body;
  if (!userId) return res.status(400).json({ alert: "User required!" });

  const userExists = await userModel.findById(userId);
  if (!userExists) {
    return res.status(404).json({ Alert: "User not found" });
  } else if (userExists.affiliated) {
    return res.status(402).json({ Alert: "User already affiliated" });
  }

  const state = await userExists.updateOne({ affiliated: true });
  if (!state) {
    return res.status(403).json({ alert: "Error while updating!" });
  } else if (state.affiliated) {
    return res.status(409).json({ Alert: "Already an affiliate!" });
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

Router.route("/purchase").post(async (req, res) => {
  const { productId, userId, affiliateId, amount } = req.body;

  try {
    if (!productId || !userId || !affiliateId || !amount) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const product = await dataModel.findById(productId);
    const user = await userModel.findById(userId);
    const affiliate = await userModel.findById(affiliateId);

    if (!product || !user || !affiliate) {
      return res
        .status(404)
        .json({ error: "Product, User or Affiliate not found." });
    }

    const purchase = new PurchaseModel({
      productId,
      userId,
      affiliateId,
      amount,
    });
    await purchase.save();

    const commissionAmount = calculateCommission(amount, product.commission);
    const commission = new CommissionModel({
      affiliateId,
      amount: commissionAmount,
    });
    await commission.save();

    return res
      .status(200)
      .json({ message: "Purchase recorded and commission calculated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

function calculateCommission(amount, commissionRate) {
  return (amount * commissionRate) / 100;
}

Router.route("/comissions").post(async (req, res) => {
  const { affiliate } = req?.body;
  if (!affiliate)
    return res.status(400).json({ Alert: "Affilate ID Required!" });

  const checkUp = await comissionModel.aggregate({
    $match: { affiliateId: affiliate },
  });
  if (!checkUp || !checkUp.length) {
    return res.status(404).json({ Alert: "Affiliate not found" });
  }

  let totalAmount = 0;

  checkUp.forEach((iter) => {
    if (iter?.amount > 0) {
      totalAmount += iter?.amount;
      return res.status(200).json({ totalEarnings: totalAmount });
    }
  });
});

module.exports = Router;
