const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const AffiliateModel = require("../models/affiliateModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const crypto = require("crypto");

// Route to generate affiliate link
Router.route("/").post(async (req, res) => {
  const { productId, affiliateId } = req.body;

  try {
    if (!productId || !affiliateId) {
      return res.status(400).json({ error: "Product ID and Affiliate ID are required." });
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

// Route to join affiliate program
Router.route("/affiliated").post(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ alert: "User ID required!" });

  try {
    const userExists = await userModel.findById(userId);
    if (!userExists) {
      return res.status(404).json({ alert: "User not found" });
    } else if (userExists.affiliated) {
      return res.status(402).json({ alert: "User already affiliated" });
    }

    await userExists.updateOne({ affiliated: true });
    return res.status(200).json({ alert: "Affiliate Updated!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ alert: "Error while updating!", error: err.message });
  }
});

// Route to handle affiliate link redirection
Router.route("/:productId/affiliate/:affiliateId").get(async (req, res) => {
  const { productId, affiliateId } = req.params;
  const hash = req.query.hash;

  if (!productId || !affiliateId || !hash) {
    return res.status(400).json({ alert: "Required fields missing!" });
  }

  try {
    const validProduct = await findProductByHash(productId, hash);
    if (!validProduct) {
      return res.status(404).json({ error: "Invalid product or hash." });
    }

    logAffiliateReferral(affiliateId, productId);

    // Implement redirection or other response logic as needed
    return res.status(200).json({ message: "Referral logged." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Function to generate hash
function generateHash(product, productId, affiliateId) {
  const dataToHash = `${product.title}-${product.description}-${product.mediaUrl}-${product.mediaType}-${product.link}-${product.category}-${product.commission}-${productId}-${affiliateId}`;
  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
  return hash;
}

// Function to find product by hash
async function findProductByHash(productId, hash) {
  // This logic might need adjustment depending on how the hash is stored or used
  const product = await dataModel.findById(productId);
  if (product) {
    const generatedHash = generateHash(product, productId, product.affiliateId); // Adjust parameters as needed
    if (generatedHash === hash) {
      return product;
    }
  }
  return null;
}

// Function to log affiliate referral
function logAffiliateReferral(affiliateId, productId) {
  console.log(`Affiliate ${affiliateId} referred product ${productId}`);
}

// Route to handle purchase
Router.route("/purchase").post(async (req, res) => {
  const { productId, userId, affiliateId, amount } = req.body;

  try {
    if (!productId || !userId || !affiliateId || !amount) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const [product, user, affiliate] = await Promise.all([
      dataModel.findById(productId),
      userModel.findById(userId),
      userModel.findById(affiliateId)
    ]);

    if (!product || !user || !affiliate) {
      return res.status(404).json({ error: "Product, User, or Affiliate not found." });
    }

    const purchase = new PurchaseModel({ productId, userId, affiliateId, amount });
    await purchase.save();

    const commissionAmount = calculateCommission(amount, product.commission);
    const commission = new CommissionModel({ affiliateId, amount: commissionAmount });
    await commission.save();

    return res.status(200).json({ message: "Purchase recorded and commission calculated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Function to calculate commission
function calculateCommission(amount, commissionRate) {
  return (amount * commissionRate) / 100;
}

// Route to handle commissions
Router.route("/comissions").post(async (req, res) => {
  const { affiliate } = req.body;
  if (!affiliate) return res.status(400).json({ alert: "Affiliate ID Required!" });

  try {
    const checkUp = await CommissionModel.aggregate([
      { $match: { affiliateId: affiliate } }
    ]);

    if (!checkUp.length) {
      return res.status(404).json({ alert: "Affiliate not found" });
    }

    const totalAmount = checkUp.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    if (totalAmount > 0) {
      return res.status(200).json({ totalEarnings: totalAmount });
    } else {
      return res.status(410).json({ alert: "No earnings!" });
    }
  } catch (error) {
    return res.status(500).json({ alert: "Internal Server Error", error: error.message });
  }
});

module.exports = Router;
