const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const dataModel = require("../models/mainModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const ReferralModel = require("../models/referralModel");
const RefundModel = require("../models/refundModel");
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
    console.error("Error generating affiliate link:", err);
    return res.status(500).json({ error: "Internal Server Error." });
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
    console.error("Error updating affiliate status:", err);
    return res.status(500).json({ error: "Internal Server Error." });
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
    console.error("Error processing affiliate link:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/purchase").post(authenticate, async (req, res) => {
  const { productId, amount } = req.body;
  const userId = req.user._id;
  const affiliateData = req.cookies.affiliate;

  try {
    if (!productId || !amount) {
      return res.status(400).json({ error: "Product ID and amount are required." });
    }

    if (!affiliateData || !affiliateData.affiliateId || !affiliateData.productId) {
      return res.status(400).json({ error: "Affiliate data missing." });
    }

    const affiliateId = affiliateData.affiliateId;

    const session = await mongoose.startSession();
    session.startTransaction();

    const [product, user, affiliate] = await Promise.all([
      dataModel.findById(productId).session(session),
      userModel.findById(userId).session(session),
      userModel.findById(affiliateId).session(session),
    ]);

    if (!product || !user || !affiliate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Product, User, or Affiliate not found." });
    }

    const purchase = new PurchaseModel({
      productId,
      userId,
      affiliateId,
      amount,
    });

    await purchase.save({ session });

    const commissionAmount = calculateCommission(amount, product.commission);
    const commission = new CommissionModel({
      affiliateId,
      amount: commissionAmount,
    });
    await commission.save({ session });

    await rankUp(affiliateId, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Purchase recorded and commission calculated." });
  } catch (err) {
    console.error("Error recording purchase:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/refund").post(authenticate, async (req, res) => {
  const { purchaseId, reason } = req.body;
  const userId = req.user._id;

  try {
    if (!purchaseId || !reason) {
      return res.status(400).json({ error: "Purchase ID and reason are required." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const purchase = await PurchaseModel.findById(purchaseId).session(session);
    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Purchase not found." });
    }

    if (purchase.userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: "Unauthorized action." });
    }

    const refund = new RefundModel({
      purchaseId,
      userId,
      reason,
    });

    await refund.save({ session });

    await reverseCommission(purchaseId, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Refund processed." });
  } catch (err) {
    console.error("Error processing refund:", err);
    return res.status(500).json({ error: "Internal Server Error." });
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
    console.error("Error fetching commissions:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/dashboard").get(authenticate, async (req, res) => {
  const affiliateId = req.user._id;

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
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/myrank/:id").get(async (req, res) => {
  const id = req.params?.id;
  if (!id) return res.status(400).json({ Alert: "ID required!" });
  try {
    await userModel.findById(id).then(async (userExists) => {
      if (userExists) {
        return res.status(200).json({ affiliateRank: userExists?.affiliateRank });
      } else {
        return res.status(404).json({ Alert: "User not found!" });
      }
    });
  } catch (err) {
    console.error("Error fetching user rank:", err);
    return res.status(500).json({ Error: err?.message });
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
    console.error("Error logging referral:", err);
  }
}

function calculateCommission(amount, commissionRate) {
  return (amount * commissionRate) / 100;
}

async function rankUp(affiliateId, session) {
  try {
    const affiliate = await userModel.findById(affiliateId).session(session);
    const purchases = await PurchaseModel.find({ affiliateId }).session(session);

    if (purchases.length >= 10) {
      affiliate.affiliateRank = "Bronze";
    }
    if (purchases.length >= 20) {
      affiliate.affiliateRank = "Silver";
    }
    if (purchases.length >= 30) {
      affiliate.affiliateRank = "Gold";
    }
    if (purchases.length >= 40) {
      affiliate.affiliateRank = "Platinum";
    }

    await affiliate.save({ session });
  } catch (err) {
    console.error("Error ranking up affiliate:", err);
  }
}

async function reverseCommission(purchaseId, session) {
  try {
    const purchase = await PurchaseModel.findById(purchaseId).session(session);
    if (!purchase) throw new Error("Purchase not found.");

    const commission = await CommissionModel.findOne({
      affiliateId: purchase.affiliateId,
      amount: calculateCommission(purchase.amount, purchase.product.commission),
    }).session(session);

    if (commission) {
      await commission.remove({ session });
    }

    await PurchaseModel.deleteOne({ _id: purchaseId }).session(session);
  } catch (err) {
    console.error(`Error reversing commission for purchase ${purchaseId}:`, err);
  }
}

async function getReferralsByAffiliate(affiliateId) {
  const referrals = await ReferralModel.find({ affiliateId }).populate("productId");
  return referrals;
}

module.exports = Router;
