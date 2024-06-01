const crypto = require("crypto");
const dataModel = require("../models/mainModel");
const userModel = require("../models/userModel");
const PurchaseModel = require("../models/purchaseModel");
const CommissionModel = require("../models/comissionModel");
const ReferralModel = require("../models/referralModel");

function generateHash(product, productId, affiliateId) {
  const hash = crypto.createHash("sha256");
  hash.update(`${product._id}${productId}${affiliateId}`);
  return hash.digest("hex");
}

async function findProductByHash(productId, hash) {
  const product = await dataModel.findById(productId).populate("companyId");
  if (product) {
    const generatedHash = generateHash(product, productId, product.companyId);
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
    const purchases = await PurchaseModel.find({ affiliateId }).session(
      session
    );

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

async function reverseCommission(purchaseId, session) { //refunds
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
    console.error(
      `Error reversing commission for purchase ${purchaseId}:`,
      err
    );
  }
}

async function getReferralsByAffiliate(affiliateId) {
  const referrals = await ReferralModel.find({ affiliateId }).populate(
    "productId"
  );
  return referrals;
}

module.exports = {
  findProductByHash,
  logAffiliateReferral,
  calculateCommission,
  rankUp,
  reverseCommission,
  getReferralsByAffiliate,
};
