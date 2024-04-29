const express = require("express");
const Router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;


Router.route("/register").post(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ Alert: "username and password required" });

  try {
    const userExists = await userModel.findOne({ username });
    if (userExists) {
      return res.status(409).json({ Alert: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
    const newUser = await userModel.create({ username, password: hashedPassword });

    return res.status(201).json({Alert:`${newUser} created`})
   
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

Router.route("/login").post(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ Alert: "username and password required" });

  try {
    const user = await userModel.findOne({ username });
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
  if (!id) return res.status(400).json({ Alert: "ID required" });
  const { password } = req.body;

  try {
    const validUser = await userModel.findById(id);

    if (!validUser) {
      return res
        .status(404)
        .json({ Alert: "No user found with the provided ID" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds
      await userModel.findByIdAndUpdate(id, { password: hashedPassword });

      return res.status(200).json({ Alert: "Password updated successfully" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: err.message });
  }
});

module.exports = Router;
