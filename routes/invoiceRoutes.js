const express = require("express");
const Invoice = require("../models/Invoice");
const router = express.Router();
const Order = require("../models/Order");

// Get All Invoices
router.get("/invoice", async (req, res) => {
  try {
    const allInvoices = await Invoice.find();
    res.status(200).send(allInvoices);
  } catch (err) {
    res.status(500).send("Error fetching invoices: " + err.message);
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

router.post("/invoice/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allInvoices = await Invoice.find();

    const result = allInvoices.filter((invoice) => {
      const invoiceObj = invoice.toObject();
      return containsSearchTerm(invoiceObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching invoice: " + err.message);
  }
});



router.post("/invoice/order", async (req, res) => {
  try {
    const { orderNumber } = req.body;
    const orderList = await Order.findOne({ orderNumber: orderNumber });

    if (!orderList) {
      return res.status(404).send("Order not found");
    }

    res.status(200).send(orderList);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).send("Error fetching order: " + err.message);
  }
});


router.post("/invoice", async (req, res) => {
  try {
    const allInvoice = await Invoice.find()
    const {
      orderNumber,
      category,
      modelName,
      quantity,
      orderObject,
      customerObject,
      paymentObject,
    } = req.body;

    // Validate required fields
    if (
      !orderNumber ||
      !category ||
      !modelName ||
      !quantity ||
      !customerObject ||
      !paymentObject
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Create invoice
    const newInvoice = new Invoice({
      orderNumber,
      category,
      modelName,
      quantity,
      orderObject,
      customerObject,
      paymentObject,
      date: new Date(), // auto-set the date
    });

    newInvoice.invoiceNumber = allInvoice.length + 1;

    // Save to DB
    const savedInvoice = await newInvoice.save();

    // Respond with saved invoice
    return res.status(201).json(savedInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
