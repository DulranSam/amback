const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const AffiliateModel = require("../models/affiliateModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const ReferralModel = require("../models/ReferralModel"); // Add this line
const crypto = require("crypto");
const jwt = require("jsonwebtoken"); // For authentication
const cookieParser = require("cookie-parser");

const { SECRET_KEY } = process.env;

// Middleware to check authentication
function authenticate(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token." });
    }
    req.user = decoded;
    next();
  });
}

// Use cookie-parser middleware
Router.use(cookieParser());

// Route to generate affiliate link
Router.route("/").post(authenticate, async (req, res) => {
  const { productId } = req.body;
  const affiliateId = req.user.id;

  try {
    if (!productId) {
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

// Route to join affiliate program
Router.route("/affiliated").post(authenticate, async (req, res) => {
  const userId = req.user.id;

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
    return res
      .status(500)
      .json({ alert: "Error while updating!", error: err.message });
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

    await logAffiliateReferral(affiliateId, productId); // Ensure referral is logged
    res.cookie(
      "affiliate",
      { productId, affiliateId },
      { maxAge: 30 * 24 * 60 * 60 * 1000 }
    ); // Store referral in cookie

    // Implement redirection to the product page or other response logic as needed
    return res.redirect(`/products/${productId}`);
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
  const product = await dataModel.findById(productId);
  if (product) {
    const generatedHash = generateHash(product, productId, product.affiliateId); // Adjust parameters as needed
    if (generatedHash === hash) {
      return product;
    }
  }
  return null;
}


async function logAffiliateReferral(affiliateId, productId) {
  try {
    const newReferral = new ReferralModel({ affiliateId, productId });
    await newReferral.save();
    console.log(
      `Logged referral for affiliate ${affiliateId} and product ${productId}`
    );
  } catch (err) {
    console.error(
      `Error logging referral for affiliate ${affiliateId} and product ${productId}:`,
      err
    );
  }
}

// Route to handle purchase
Router.route("/purchase").post(authenticate, async (req, res) => {
  const { productId, amount } = req.body;
  const userId = req.user.id;
  const affiliateData = req.cookies.affiliate;

  try {
    if (!productId || !amount) {
      return res
        .status(400)
        .json({ error: "Product ID and amount are required." });
    }

    if (
      !affiliateData ||
      !affiliateData.affiliateId ||
      !affiliateData.productId
    ) {
      return res.status(400).json({ error: "Affiliate data missing." });
    }

    const affiliateId = affiliateData.affiliateId;

    const [product, user, affiliate] = await Promise.all([
      dataModel.findById(productId),
      userModel.findById(userId),
      userModel.findById(affiliateId),
    ]);

    if (!product || !user || !affiliate) {
      return res
        .status(404)
        .json({ error: "Product, User, or Affiliate not found." });
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

// Function to calculate commission
function calculateCommission(amount, commissionRate) {
  return (amount * commissionRate) / 100;
}

// Route to handle commissions
Router.route("/commissions").post(authenticate, async (req, res) => {
  const affiliateId = req.user.id;

  try {
    const commissions = await CommissionModel.find({ affiliateId });
    if (!commissions.length) {
      return res.status(404).json({ alert: "Affiliate not found" });
    }

    const totalAmount = commissions.reduce(
      (acc, curr) => acc + (curr.amount || 0),
      0
    );
    return res.status(200).json({ totalEarnings: totalAmount });
  } catch (error) {
    return res
      .status(500)
      .json({ alert: "Internal Server Error", error: error.message });
  }
});

// Route to get affiliate dashboard
Router.route("/dashboard").get(authenticate, async (req, res) => {
  const affiliateId = req.user.id;

  try {
    const [referrals, purchases, commissions] = await Promise.all([
      getReferralsByAffiliate(affiliateId),
      PurchaseModel.find({ affiliateId }),
      CommissionModel.find({ affiliateId }),
    ]);

    return res.status(200).json({
      referrals,
      purchases,
      totalEarnings: commissions.reduce(
        (acc, curr) => acc + (curr.amount || 0),
        0
      ),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ alert: "Internal Server Error", error: error.message });
  }
});

// Implementing the getReferralsByAffiliate function
async function getReferralsByAffiliate(affiliateId) {
  try {
    const referrals = await ReferralModel.find({ affiliateId }).populate(
      "productId",
      "title"
    ); // Populating with product title for better context
    return referrals;
  } catch (err) {
    console.error(
      `Error fetching referrals for affiliate ${affiliateId}:`,
      err
    );
    return [];
  }
}

module.exports = Router;
