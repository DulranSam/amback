const express = require("express");
const Router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const JWT_SECRET = process.env.jwtsupersecret;
const EMAIL_USER = process.env.personalMail;
const EMAIL_PASS = process.env.personalPass;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

Router.route("/register").post(async (req, res) => {
  const { gmail, password } = req.body;
  if (!gmail || !password)
    return res.status(400).json({ Alert: "Gmail and password required" });

  try {
    const userExists = await userModel.findOne({ gmail });
    if (userExists) {
      return res.status(409).json({ Alert: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, Math.random());
    const newUser = await userModel.create({ gmail, password: hashedPassword });

    // Send email to the newly registered user
    const mailOptions = {
      from: process.env.personalMail,
      to: newUser.gmail,
      subject: "Welcome to Affiliates!",
      text: `Welcome to Affiliates!\n\nYour login credentials are:\n\nGmail: ${newUser.gmail}\nPassword: ${password}\n\nWe hope to help your company leverage your potential with our service!\n\nBest Regards,\nTeam Velo!`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    return res.status(201).json({ Alert: `${gmail} added` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

Router.route("/login").post(async (req, res) => {
  const { gmail, password } = req.body;
  if (!gmail || !password)
    return res.status(400).json({ Alert: "Gmail and password required" });

  try {
    const user = await userModel.findOne({ gmail });
    if (!user) {
      return res.status(404).json({ Alert: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "1h",
      }); // Expires in 1 hour
      return res.status(200).json({ token, user });
    } else {
      return res.status(401).json({ Alert: "Wrong password" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

Router.route("/forgot/:id").put(async (req, res) => {
  const id = req.params.id;
  if(!id) return res.status(400).json({Alert:"ID required"})
  const { password } = req.body;

  if (!id) return res.status(400).json({ Alert: "ID Required" });

  try {
    const validUser = await userModel.findById(id);

    if (!validUser) {
      return res
        .status(404)
        .json({ Alert: "No user found with the provided ID" });
    } else {
      await userModel.findByIdAndUpdate(id, { password });

      return res.status(200).json({ Alert: "Password updated successfully" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

module.exports = Router;
