const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Add Product
router.post('/product', async (req, res) => {
    try {
        console.log(req.body);
        const newProduct = new Product(req.body); // ✅ Corrected variable name
        await newProduct.save(); // ✅ Await save
        res.status(201).send('Product Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding product: ' + err.message);
    }
});

// Get All Products
router.get('/product', async (req, res) => {
    try {
        const allProducts = await Product.find();
        res.status(200).send(allProducts);
    } catch (err) {
        res.status(500).send('Error fetching products: ' + err.message);
    }
});

// Update Product by ID
router.put('/product/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).send('Product Updated Successfully');
    } catch (err) {
        res.status(500).send('Error updating product: ' + err.message);
    }
});

module.exports = router;
