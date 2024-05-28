const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const ReferralModel = require("../models/referralModel");
const generateHash = require("../utils/hashUtil");
const authenticate = require("../utils/authMiddleware");
const cookieParser = require("cookie-parser");
require("dotenv").config();

Router.use(cookieParser());

Router.route("/").post(authenticate, async (req, res) => {
  const { productId } = req.body;
  const affiliateId = req.user._id;

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
      return res.status(404).json({ error: "User not found." });
    } else if (!affiliate.affiliated) {
      return res.status(403).json({ error: "User not affiliated." });
    }

    const hash = generateHash(product, productId, affiliateId);
    const affiliateLink = `/products/${productId}/affiliate/${affiliateId}?hash=${hash}`;

    return res.status(200).json({ affiliateLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/affiliated").post(authenticate, async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    } else if (user.affiliated) {
      return res.status(409).json({ error: "User already affiliated." });
    }

    user.affiliated = true;
    await user.save();

    return res.status(200).json({ message: "Affiliate status updated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/:productId/affiliate/:affiliateId").get(async (req, res) => {
  const { productId, affiliateId } = req.params;
  const hash = req.query.hash;

  if (!productId || !affiliateId || !hash) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  try {
    const validProduct = await findProductByHash(productId, hash);
    if (!validProduct) {
      return res.status(404).json({ error: "Invalid product or hash." });
    }

    await logAffiliateReferral(affiliateId, productId);
    res.cookie(
      "affiliate",
      { productId, affiliateId },
      { maxAge: 30 * 24 * 60 * 60 * 1000 }
    );

    return res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

Router.route("/purchase").post(authenticate, async (req, res) => {
  const { productId, amount } = req.body;
  const userId = req.user.id;
  const affiliateData = req.cookies.affiliate;

  let loyaltyPoints = 0;

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

    await userModel.findById(userId).then(async (exists) => {
      if (exists.status === 200 && exists && exists.length) {
        await exists.updateOne({ loyaltyPoints: (loyaltyPoints += 5) });
      }
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

Router.route("/commissions").get(authenticate, async (req, res) => {
  const affiliateId = req.user._id;

  try {
    const commissions = await CommissionModel.find({ affiliateId });
    if (!commissions.length) {
      return res.status(404).json({ error: "No commissions found." });
    }

    const totalAmount = commissions.reduce((acc, curr) => acc + curr.amount, 0);
    return res.status(200).json({ totalEarnings: totalAmount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

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
      totalEarnings: commissions.reduce((acc, curr) => acc + curr.amount, 0),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

// Utility functions

async function findProductByHash(productId, hash) {
  const product = await dataModel.findById(productId);
  if (product) {
    const generatedHash = generateHash(product, productId, product.affiliateId);
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

async function getReferralsByAffiliate(affiliateId) {
  try {
    const referrals = await ReferralModel.find({ affiliateId }).populate(
      "productId",
      "title"
    );
    return referrals;
  } catch (err) {
    console.error(
      `Error fetching referrals for affiliate ${affiliateId}:`,
      err
    );
    return [];
  }
}

function calculateCommission(amount, commissionRate) {
  return (amount * commissionRate) / 100;
}

module.exports = Router;
