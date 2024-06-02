// Assuming you have an Express route set up for handling company requests
const express = require('express');
const router = express.Router();
const Company = require('../models/companyModel');

// Route to fetch company by ID
router.post(':id', async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
