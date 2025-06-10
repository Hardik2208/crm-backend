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

    const { modelName, category, orderObject, quantity } = req.body;

    let product = await Product.findOne({ modelName });

    if (!product || product.quantity < quantity) {
      return res
        .status(404)
        .send("Product Not Found in Stock or insufficient quantity.");
    }

    // Category-specific unique identifier logic
    let updated = false;

    if (category === "MOBILE" && req.body.IMEI) {
      const imeiIndex = product.productObject.IMEI.indexOf(req.body.IMEI);
      if (imeiIndex === -1) {
        return res.status(400).send("IMEI not found in stock.");
      }
      product.productObject.IMEI.splice(imeiIndex, 1);
      product.quantity -= 1;
      updated = true;
    }

    if (
      ["TV", "FRIDGE", "WASHING MACHINE"].includes(category) &&
      req.body.serialNumber
    ) {
      const snIndex = product.productObject.serialNumber.indexOf(
        req.body.serialNumber
      );
      if (snIndex === -1) {
        return res.status(400).send("Serial Number not found in stock.");
      }
      product.productObject.serialNumber.splice(snIndex, 1);
      product.quantity -= 1;
      updated = true;
    }

    if (category === "OTHERS") {
      product.quantity -= quantity;
      updated = true;
    }

    if (!updated) {
      return res.status(400).send("Invalid category or missing identifiers.");
    }

    await product.save();

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
          quantity,
          modelName,
          serialNumber: req.body.serialNumber,
          IMEI: req.body.IMEI,
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
