const express = require('express');
const Enquiry = require('../models/Enquiry');
const router = express.Router();

// Add Enquiry
router.post('/enquiry', async (req, res) => {
    try {
        const newEnquiry = new Enquiry(req.body);
        newEnquiry.dateOfEnquriy = new Date();
        await newEnquiry.save();
        res.status(201).send('Enquiry Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding enquiry: ' + err.message);
    }
});


router.post("/enquiry/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase(); // May be undefined

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allEnquiry = await Enquiry.find();

    const result = allEnquiry.filter((Enquiry) => {
      return Object.values(Enquiry.toObject()).some(
        (value) => value && value.toString().toLowerCase().includes(searchTerm)
      );
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err); // ✅ log full error
    res.status(500).send("Error searching Enquiry: " + err.message);
  }
});

// Get All Enquiries
router.get('/enquiry', async (req, res) => {
    try {
        const allEnquiries = await Enquiry.find();
        res.status(200).send(allEnquiries);
    } catch (err) {
        res.status(500).send('Error fetching enquiries: ' + err.message);
    }
});

// Delete Enquiry
router.delete('/enquiry/:id', async (req, res) => {
    try {
        await Enquiry.findByIdAndDelete(req.params.id);
        res.status(200).send('Enquiry Deleted Successfully');
    } catch (err) {
        res.status(500).send('Error deleting enquiry: ' + err.message);
    }
});

// Update Enquiry
router.put('/enquiry/:id', async (req, res) => {
    try {
        await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).send('Enquiry Updated Successfully');
    } catch (err) {
        res.status(500).send('Error updating enquiry: ' + err.message);
    }
});

module.exports = router;
