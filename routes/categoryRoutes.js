const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

router.post('/category', async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        await newCategory.save();
        res.status(201).send('Category Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding Category: ' + err.message);
    }
});

// Get All Category
router.get('/category', async (req, res) => {
    try {
        const allCategory = await Category.find();
        res.status(200).send(allCategory);
    } catch (err) {
        res.status(500).send('Error fetching category: ' + err.message);
    }
});

module.exports = router;