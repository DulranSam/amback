const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Router } = require("express");
require("dotenv").config();
const geminiKey = process.env.GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(geminiKey);

const router = Router(); 

router.post("/", async (req, res) => { 
  try {
    const search = req?.body?.search;
    if (!search) {
      return res.status(400).json({ alert: "Input not provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `What do you think about ${search}?`;

    const result = await model.generateContent(prompt);
    const response = result.data;

    if (!response || !response.text) {
      return res.status(400).json({ alert: "No data retrieved" });
    }

    const text = response.text;
    if (text.length !== 0) {
      return res.status(200).json({ generatedText: text });
    } else {
      return res.status(400).json({ alert: "No data retrieved" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ alert: "Internal server error" });
  }
});

module.exports = router; 
