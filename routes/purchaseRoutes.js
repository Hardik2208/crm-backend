const express = require('express');
const Purchase = require('../models/Purchase');
const router = express.Router();

router.post('/purchase', async (req, res) => {
    try {
        const newPurchase = new Purchase(req.body);
        await newPurchase.save();
        res.status(201).send('Purchase Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding Purchase: ' + err.message);
    }
});

// Get All Purchases
router.get('/purchase', async (req, res) => {
    try {
        const allPurchase = await Purchase.find();
        res.status(200).send(allPurchase);
    } catch (err) {
        res.status(500).send('Error fetching purchase: ' + err.message);
    }
});

module.exports = router;