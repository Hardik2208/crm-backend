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

// Recursive function to search nested objects
function containsSearchTerm(obj, searchTerm) {
  if (obj instanceof Date) {
    // Convert Date to 'YYYY-MM-DD' format
    return obj.toISOString().split("T")[0].includes(searchTerm);
  }

  if (typeof obj === "string" || typeof obj === "number") {
    return obj.toString().toLowerCase().includes(searchTerm);
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).some((value) =>
      containsSearchTerm(value, searchTerm)
    );
  }

  return false;
}

router.post("/enquiry/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allEnquiries = await Enquiry.find();

    const result = allEnquiries.filter((enquiry) => {
      const enquiryObj = enquiry.toObject();
      return containsSearchTerm(enquiryObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching enquiry: " + err.message);
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
