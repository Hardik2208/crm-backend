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
