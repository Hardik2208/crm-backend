const express = require("express");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const router = express.Router();

// Add Product
router.post("/product", async (req, res) => {
  try {
    const {
      category,
      quantity,
      modelName,
      supplierObject,
      amount,
      sellingPrice,
      productObject = {},
    } = req.body;

    const quantityNumber = parseInt(quantity);
    if (isNaN(quantityNumber)) {
      return res.status(400).send("Invalid quantity provided.");
    }

    // Save purchase entry
    const newPurchase = new Purchase({
      category,
      quantity: quantityNumber,
      modelName,
      supplierObject,
      amount,
      sellingPrice,
    });
    await newPurchase.save();

    // Check if product already exists
    const existingProduct = await Product.findOne({ modelName });

    if (existingProduct) {
      // ✅ Safely convert and add quantity
      const currentQty = parseInt(existingProduct.quantity || 0);
      const newQty = currentQty + quantityNumber;

      // ✅ Assign explicitly
      existingProduct.set("quantity", newQty);
      existingProduct.set("amount", amount);
      existingProduct.set("sellingPrice", sellingPrice);
      existingProduct.set("supplierObject", supplierObject);

      // ✅ Handle productObject updates safely
      const key = category === "MOBILE" ? "IMEI" : "serialNumber";
      const newList = productObject[key] || [];

      if (!existingProduct.productObject) {
        existingProduct.productObject = {};
      }

      const existingList = existingProduct.productObject[key] || [];
      const mergedList = [...new Set([...existingList, ...newList])];

      existingProduct.set("productObject", {
        ...existingProduct.productObject,
        [key]: mergedList,
      });

      await existingProduct.save();

      console.log("✅ Updated product:", existingProduct);

      return res.status(200).send("Existing product updated with new quantity and identifiers.");
    } else {
      // ✅ Create new product
      const newProduct = new Product({
        category,
        quantity: quantityNumber,
        modelName,
        supplierObject,
        amount,
        sellingPrice,
        productObject,
      });

      await newProduct.save();
      return res.status(201).send("New product added successfully!");
    }
  } catch (err) {
    console.error("❌ Product update error:", err);
    res.status(500).send("Error adding/updating product: " + err.message);
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
router.get("/product", async (req, res) => {
  try {
    const allProducts = await Product.find();
    res.status(200).send(allProducts);
  } catch (err) {
    res.status(500).send("Error fetching products: " + err.message);
  }
});

// Update Product by ID
router.put("/product/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).send("Product Updated Successfully");
  } catch (err) {
    res.status(500).send("Error updating product: " + err.message);
  }
});

//Delete Product by ID
router.delete("/product/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).send("Product Deleted Successfully");
  } catch (err) {
    res.status(500).send("Error deleting product: " + err.message);
  }
});

router.get("/product/model-suggestions", async (req, res) => {
  try {
    const { category, query = "" } = req.query;

    if (!category) {
      return res.status(400).json({ error: "Category required" });
    }

    // Escape regex special characters in query to avoid crash
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const models = await Product.find({
      category: category.toUpperCase(),
      modelName: { $regex: `^${escapedQuery}`, $options: "i" },
    }).distinct("modelName");

    res.json(models);
  } catch (error) {
    console.error("Model suggestions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/product/serial-suggestions", async (req, res) => {
  try {
    const { modelName, query = "", category } = req.query;
    if (!modelName || !category)
      return res.status(400).json({ error: "Model name & category required" });

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await Product.find({
      modelName: modelName.toUpperCase(),
      category: category.toUpperCase(),
    });

    // Initialize allSerials properly
    let allSerials = [];

    for (let p of products) {
      const entries =
        category.toUpperCase() === "MOBILE"
          ? p.productObject?.IMEI || []
          : p.productObject?.serialNumber || [];

      allSerials.push(...entries);
    }

    const filtered = allSerials.filter((s) =>
      new RegExp(`^${escapedQuery}`, "i").test(s)
    );

    return res.json([...new Set(filtered)]);
  } catch (error) {
    console.error("Serial suggestions error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
