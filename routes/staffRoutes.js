const express = require('express');
const Staff = require('../models/Staff');
const router = express.Router();

// Add Staff
router.post('/staff', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        await newStaff.save();
        res.status(201).send('Staff Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding staff: ' + err.message);
    }
});

// Recursive function to search nested objects
function containsSearchTerm(obj, searchTerm) {
  if (typeof obj === "string" || typeof obj === "number") {
    return obj.toString().toLowerCase().includes(searchTerm);
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).some(value => containsSearchTerm(value, searchTerm));
  }

  return false;
}

router.post("/staff/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allStaffs = await Staff.find();

    const result = allStaffs.filter((staff) => {
      const staffObj = staff.toObject();
      return containsSearchTerm(staffObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching staff: " + err.message);
  }
});



// Get All Staff
router.get('/staff', async (req, res) => {
    try {
        const allStaff = await Staff.find();
        res.status(200).send(allStaff);
    } catch (err) {
        res.status(500).send('Error fetching staff: ' + err.message);
    }
});

// Delete Staff by ID
router.delete('/staff/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.status(200).send('Staff Deleted Successfully');
    } catch (err) {
        res.status(500).send('Error deleting staff: ' + err.message);
    }
});

// Update Staff by ID
router.put('/staff/:id', async (req, res) => {
    try {
        await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).send('Staff Updated Successfully');
    } catch (err) {
        res.status(500).send('Error updating staff: ' + err.message);
    }
});

module.exports = router;
