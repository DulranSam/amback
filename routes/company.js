// Assuming you have an Express route set up for handling company requests
const express = require("express");
const router = express.Router();
const Company = require("../models/companyModel");

// Route to fetch company by ID
router.post("/:id", async (req, res) => {
  try {
    const companyId = req.params?.id;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/validation").post(async (req, res) => {
  const { company } = req?.body;
  if (!company)
    return res.status(400).json({ Alert: "Company details required!" });

  try {
    const companyExists = await Company.findById(company._id);
    if (!companyExists) return res.status(409).json({ Alert: "Conflicts" });

    return res.status(200).json(companyExists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/registration").post(async (req, res) => {
  const {company} = req?.body;
  if (!company)
    return res.status(400).json({ Alert: "Company details required!" });


  
  try {
    const companyExists = await Company.findById(company._id);
    if (!companyExists) return res.status(409).json({ Alert: "Conflicts" });

    return res.status(200).json(companyExists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }



});

module.exports = router;
