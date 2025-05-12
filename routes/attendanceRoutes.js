const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance'); // assuming you have a model for attendance


// GET request to fetch attendance by year and month
router.get('/attendance/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  try {
    const attendanceData = await Attendance.find({
      date: {
        $gte: new Date(`${year}-${month}-01`),
        $lt: new Date(`${year}-${parseInt(month) + 1}-01`)
      }
    });
    res.status(200).json(attendanceData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance data', error: err });
  }
});


router.post('/attendance/:year/:month', async(req, res) => {
  const { staff_id, status } = req.body;

  if (!staff_id || !status) {
    return res.status(400).json({ message: "Missing staff_id or status" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existing = await Attendance.findOne({
      staff_id,
      date: today
    });

    if (existing) {
      // If attendance already exists for today, send a conflict response
      return res.status(409).json({ message: "Attendance already marked for today." });
    }

    // Create new attendance record if not already marked
    const attendance = new Attendance({
      staff_id,
      date: today,
      status
    });

    await attendance.save();
    res.status(201).json({ message: "Attendance saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });}
});

module.exports = router;
