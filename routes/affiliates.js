const express = require("express");
const Router = express.Router();
const mongoose = require("mongoose");
const dataModel = require("../models/mainModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const ReferralModel = require("../models/referralModel");
const RefundModel = require("../models/refundModel");
const {
  generateHash,
  calculateCommission,
  rankUp,
  reverseCommission,
  findProductByHash,
  logAffiliateReferral,
} = require("../utils/affiliateUtils");
const authenticate = require("../utils/authMiddleware");
const cookieParser = require("cookie-parser");
require("dotenv").config();

Router.use(cookieParser());

Router.route("/").post(authenticate, async (req, res) => {
  const { productId } = req.body;
  const affiliateId = req.user._id;

  try {
    if (req.user.userType !== "user") {
      return res
        .status(403)
        .json({ error: "Only normal users can be affiliated." });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    const product = await dataModel.findById(productId).populate("companyId");
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const affiliate = await userModel.findById(affiliateId);
    if (!affiliate) {
      return res.status(404).json({ error: "User not found." });
    } else if (!affiliate.affiliated) {
      return res.status(403).json({ error: "User not affiliated." });
    }

    if (product.commission < 5) {
      return res
        .status(400)
        .json({ error: "Product commission must be at least 5%." });
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
    if (req.user.userType !== "user") {
      return res
        .status(403)
        .json({ error: "Only normal users can be affiliated." });
    }

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
    if (req.user.userType !== "user") {
      return res
        .status(403)
        .json({ error: "Only normal users can make purchases." });
    }

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
      return res
        .status(400)
        .json({ error: "Affiliate information is missing." });
    }

    const product = await dataModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const affiliate = await userModel.findById(affiliateData.affiliateId);
    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate not found." });
    }

    const purchase = new PurchaseModel({
      productId,
      userId,
      affiliateId: affiliate._id,
      amount,
    });
    await purchase.save();

    const commissionAmount = calculateCommission(amount, product.commission);
    const commission = new CommissionModel({
      affiliateId: affiliate._id,
      amount: commissionAmount,
    });
    await commission.save();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await rankUp(affiliate._id, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return res.status(200).json({ message: "Purchase successful." });
  } catch (err) {
    console.error("Error processing purchase:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/refund").post(authenticate, async (req, res) => {
  const { purchaseId, reason } = req.body;

  try {
    const userId = req.user._id;
    const purchase = await PurchaseModel.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found." });
    }

    if (purchase.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const refund = new RefundModel({ purchaseId, userId, reason });
      await refund.save({ session });
      await reverseCommission(purchaseId, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return res.status(200).json({ message: "Refund processed successfully." });
  } catch (err) {
    console.error("Error processing refund:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

Router.route("/score").put(async (req, res) => {
  const { score, user } = req?.body;
  if (!score || !user)
    return res.status(400).json({ Alert: "Score required to update" });

  try {
    const connectedUser = await userModel.findById(user._id);
    if (!connectedUser) {
      return res.status(404).json({ Alert: "No user found!" });
    } else {
      await connectedUser.updateOne({
        affiliatePoints: (affiliatePoints += score),
      });
      return res.status(200).json({ Alert: "Score updated!" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

module.exports = Router;
