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

    // Format the response: apply bold for text between **, line breaks for "\n",
    // and remove unwanted characters
    const formattedResponse = response
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold text between **
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/[^\w\s<>/.\-?!,"']+$/g, ''); // Remove unwanted characters

    return res.status(200).send(formattedResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Alert: `Something went wrong ${err.status}` });
  }
});

module.exports = router;
