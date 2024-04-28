const express = require("express");
const Router = express.Router();
const userModel = require("../models/userModel");
require('dotenv').config();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.jwtsupersecret;

Router.route("/register").post(async (req, res) => {
  const { gmail} = req?.body;
  if (!gmail )
    return res.status(400).json({ Alert: "Gmail Required" });

  try {
    const userExists = await userModel.findOne({ gmail });
    if (!userExists) {
 
      const newUser = await userModel.create({ gmail, password: hashedPassword });
      return res.status(201).json({ Alert: `${gmail} added` });
    } else {
      return res.status(409).json({ Alert: "Conflict" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

Router.route("/login").post(async (req, res) => {
  const { gmail, password } = req?.body;
  if (!gmail || !password)
    return res.status(400).json({ Alert: "Gmail and password required" });

  try {
    const user = await userModel.findOne({ gmail });
    if (!user) {
      return res.status(404).json({ Alert: "User not found" });
    }



    if (user.password === password) {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' }); // Expires in 1 hour

      return res.status(200).json({ token, user });
    } else {
      return res.status(401).json({ Alert: "Wrong password" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

module.exports = Router;
