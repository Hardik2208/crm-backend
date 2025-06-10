const express = require("express");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Finance = require("../models/TPF");
const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    const orderDate = new Date();
    const nextMonthDate = new Date(orderDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const { modelName, category, orderObject } = req.body;
    let quantity = parseInt(req.body.quantity); // convert string to number

    let product = await Product.findOne({ modelName });

    if (!product || product.quantity < quantity) {
      return res
        .status(404)
        .send("Product Not Found in Stock or insufficient quantity.");
    }

    let updated = false;

    if (category === "MOBILE") {
      const imei = orderObject.IMEI;
      if (!imei) {
        return res.status(400).send("IMEI is required for MOBILE category.");
      }

      // --- Important: Ensure IMEI is an array for consistent handling ---
      // This handles cases where IMEI might be stored as a single string instead of an array.
      // Ideally, your schema and data entry should always ensure it's an array.
      if (typeof product.productObject.IMEI === 'string') {
          product.productObject.IMEI = [product.productObject.IMEI];
      } else if (!Array.isArray(product.productObject.IMEI)) {
          return res.status(500).send("Product IMEI data is malformed (not string or array).");
      }

      const imeiIndex = product.productObject.IMEI.indexOf(imei);
      if (imeiIndex === -1) {
        return res.status(400).send("IMEI not found in stock.");
      }

      console.log("Found IMEI to remove:", product.productObject.IMEI[imeiIndex]); // Log to confirm
      product.productObject.IMEI.splice(imeiIndex, 1);
      product.quantity -= 1;
      // --- CRITICAL LINE FOR NESTED ARRAY MODIFICATIONS ---
      product.markModified('productObject.IMEI'); // <--- ADD THIS LINE
      await product.save(); // Save immediately after modification
      updated = true;
    }

    if (["TV", "FRIDGE", "WASHING MACHINE"].includes(category)) {
      const serial = orderObject.serialNumber;
      if (!serial) {
        return res
          .status(400)
          .send("Serial Number is required for this category.");
      }

      // --- Important: Ensure serialNumber is an array for consistent handling ---
      if (typeof product.productObject.serialNumber === 'string') {
          product.productObject.serialNumber = [product.productObject.serialNumber];
      } else if (!Array.isArray(product.productObject.serialNumber)) {
          return res.status(500).send("Product Serial Number data is malformed (not string or array).");
      }

      const serialIndex = product.productObject.serialNumber.indexOf(serial);
      if (serialIndex === -1) {
        return res.status(400).send("Serial Number not found in stock.");
      }

      console.log("Found Serial Number to remove:", product.productObject.serialNumber[serialIndex]); // Log to confirm
      product.productObject.serialNumber.splice(serialIndex, 1);
      product.quantity -= 1;
      // --- CRITICAL LINE FOR NESTED ARRAY MODIFICATIONS ---
      product.markModified('productObject.serialNumber'); // <--- ADD THIS LINE
      await product.save(); // Save immediately after modification
      updated = true;
    }

    if (category === "OTHERS") {
      product.quantity -= quantity;
      await product.save(); // Quantity change on top-level field is usually detected
      updated = true;
    }

    if (!updated) {
      return res.status(400).send("Invalid category or missing identifiers.");
    }

    // --- Rest of your code (no changes needed here related to product update) ---

    // Generate order and finance numbers
    const orderNumber = (await Order.countDocuments()) + 1;
    const financeNumber = (await Finance.countDocuments()) + 1;

    const newOrder = new Order({
      ...req.body,
      orderNumber,
      date: orderDate,
    });

    await newOrder.save();

    // Add or update customer
    let customer = await Customer.findOne({
      phoneNumber: req.body.customerObject.phoneNumber,
    });

    if (!customer) {
      let newCustomer = new Customer({
        ...req.body.customerObject,
        orderList: [{ ...req.body, orderNumber }],
      });
      await newCustomer.save();
    } else {
      customer.orderList.push({ ...req.body, orderNumber });
      await customer.save();
    }

    // If finance type is TPF
    if (req.body.paymentObject.paymentType === "THIRD PARTY FINANCE") {
      const newFinance = new Finance({
        customerObject: req.body.customerObject,
        status: "Pending",
        orderNumber,
        customerImage: req.body.customerImage,
        guaranteerImage: req.body.guaranteerImage,
        productObject: {
          ...req.body.orderObject,
          quantity: 1, // Quantity for single IMEI/Serial products is 1
          modelName,
          serialNumber: req.body.orderObject.serialNumber, // Get from orderObject
          IMEI: req.body.orderObject.IMEI, // Get from orderObject
          category,
        },
        paymentObject: req.body.paymentObject,
        guaranteerObject: {
          name: req.body.tpf.guaranteerName,
          phoneNumber: req.body.tpf.guaranteerPhoneNumber,
        },
        financeObject: {
          downPayment: req.body.tpf.downPayment,
          numberOfEMI: req.body.tpf.numberOfEMI,
          fileCharge: req.body.tpf.fileCharge,
          interest: req.body.tpf.intrest,
          amountOfEMI: req.body.tpf.amountOfEMI,
          numberOfEMILeft: req.body.tpf.numberOfEMI,
        },
        date: orderDate,
        upcomingDate: nextMonthDate,
        financeNumber,
      });

      await newFinance.save();
    }

    res.status(201).send("Order placed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
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

router.post("/order/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allOrders = await Order.find();

    const result = allOrders.filter((order) => {
      const orderObj = order.toObject();
      return containsSearchTerm(orderObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching order: " + err.message);
  }
});

router.get("/order", async (req, res) => {
  const allOrder = await Order.find();
  res.send(allOrder);
});

router.get("/order/month", async (req, res) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  );

  const thisMonthOrders = await Order.find({
    date: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  });

  res.send(thisMonthOrders);
});

module.exports = router;
