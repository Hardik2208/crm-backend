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

router.post("/porduct/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allProducts = await Product.find();

    const result = allProducts.filter((product) => {
      const productObj = product.toObject();
      return containsSearchTerm(productObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching product: " + err.message);
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

//Delete Product by ID
router.delete('/product/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).send('Product Deleted Successfully');
    } catch (err) {
        res.status(500).send('Error deleting product: ' + err.message);
    }
});

module.exports = router;
