const express = require("express");
const Router = express.Router();
const dataModel = require("../models/mainModel");
const crypto = require("crypto");

// POST route to create an affiliate link for added products
Router.route("/").post(async (req, res) => {
  const { productId } = req.body; // Assuming productId is provided in the request body

  try {
    // Validate productId (you can add more validation as needed)
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    // Find the product details from the database using productId
    const product = await dataModel.findById(productId);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Generate hash of product details including productId
    const hash = generateHash(product, productId);

    // Return the hashed value along with productId
    return res.status(200).json({ productId, hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route to handle incoming hashed product links
Router.route("/:hash").get(async (req, res) => {
  const { hash } = req.params;

  try {
    // Find the product with the matching hash
    const product = await findProductByHash(hash);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Redirect the user to the product page
    return res.status(200).json(product); // Assuming your product page route is /products/:productId
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Function to generate hash of product details including productId
function generateHash(product, productId) {
  const dataToHash = `${product.title}-${product.description}-${product.mediaUrl}-${product.mediaType}-${product.link}-${product.category}-${product.commission}-${productId}`;
  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
  return hash;
}

// Function to find product by hash
async function findProductByHash(hash) {
  // Query the database for the product with the matching hash
  // You need to implement this function based on your database structure
  // For example:
  return await dataModel.findOne({ hash });
}

module.exports = Router;
