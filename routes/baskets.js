const express = require("express");
const Router = express.Router();

const PurchaseModel = require("../models/purchaseModel");

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
const purchaseModel = require("../models/purchaseModel");
require("dotenv").config();

Router.use(cookieParser());

Router.route("/cancels/:id").post(async (req, res) => {
  const productId = req.params?.id;

  try {
   const cancelledItem =  await purchaseModel.findById(productId);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: err.message });
  }
});

Router.route("/").post(async (req, res) => {});

Router.route("/:id").post(async (req, res) => {
  const id = req?.params?.id;

  try {
    const exists = await purchaseModel.findById(id);
    if (exists && exists.length) {
      return res.status(200).json(exists);
    } else {
      return res.status(404).json({ Alert: "Not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: err.message });
  }
});

module.exports = Router;
