const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.GEMINI_KEY;

router.route("/").post(async (req, res) => {
  try {
    const { search } = req.body;

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `${search}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const textArray = response.split("\n").filter(line => line.trim() !== ""); // Remove empty lines

    if (textArray.length) {
      return res.status(200).json(textArray);
    } else {
      return res.status(400).send("No results found!");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: `Something went wrong ${err.status}` });
  }
});

module.exports = router;
