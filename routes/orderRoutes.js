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
    const quantity = parseInt(req.body.quantity);

    let product = await Product.findOne({ modelName });

    if (!product || product.quantity < quantity) {
      return res
        .status(404)
        .send("Product Not Found in Stock or insufficient quantity.");
    }

    let updated = false;

    // Category-wise IMEI / Serial Number Checks
    if (category === "MOBILE") {
      const imeis = orderObject.IMEI || orderObject.imei || [];

      if (!Array.isArray(imeis) || imeis.length !== quantity) {
        return res
          .status(400)
          .send("IMEI list must be an array with a length equal to quantity.");
      }

      if (!Array.isArray(product.productObject.IMEI)) {
        return res
          .status(500)
          .send("Product IMEI data is malformed or missing.");
      }

      const allExist = imeis.every((i) =>
        product.productObject.IMEI.includes(i)
      );

      if (!allExist) {
        return res.status(400).send("One or more IMEIs not found in stock.");
      }

      imeis.forEach((i) => {
        const index = product.productObject.IMEI.indexOf(i);
        if (index !== -1) product.productObject.IMEI.splice(index, 1);
      });

      product.quantity -= quantity;
      product.markModified("productObject.IMEI");
      await product.save();
      updated = true;
    }

    if (["TV", "FRIDGE", "WASHING MACHINE"].includes(category)) {
      const serials = orderObject.serialNumber || [];

      if (!Array.isArray(serials) || serials.length !== quantity) {
        return res.status(400).send("Serial list must match quantity.");
      }

      if (!Array.isArray(product.productObject.serialNumber)) {
        return res
          .status(500)
          .send("Product Serial Number data is malformed or missing.");
      }

      const allExist = serials.every((s) =>
        product.productObject.serialNumber.includes(s)
      );

      if (!allExist) {
        return res
          .status(400)
          .send("One or more Serial Numbers not found in stock.");
      }

      serials.forEach((s) => {
        const index = product.productObject.serialNumber.indexOf(s);
        if (index !== -1) product.productObject.serialNumber.splice(index, 1);
      });

      product.quantity -= quantity;
      product.markModified("productObject.serialNumber");
      await product.save();
      updated = true;
    }

    if (category === "OTHERS") {
      product.quantity -= quantity;
      await product.save();
      updated = true;
    }

    if (!updated) {
      return res.status(400).send("Invalid category or missing identifiers.");
    }

    const orderNumber = (await Order.countDocuments()) + 1;
    const financeNumber = (await Finance.countDocuments()) + 1;

    // ✅ Extract & Convert Phone Numbers to Number
    const customerPhone = Number(req.body.customerObject.phoneNumber);
    const customerSecondary = req.body.customerObject.secondaryNumber
      ? Number(req.body.customerObject.secondaryNumber)
      : null;

    // ✅ Validate
    if (!customerPhone || isNaN(customerPhone)) {
      return res.status(400).send("Invalid or missing primary phone number.");
    }

    if (
      req.body.customerObject.secondaryNumber &&
      (isNaN(customerSecondary) || !customerSecondary)
    ) {
      return res.status(400).send("Invalid secondary phone number.");
    }

    // ✅ Save order
    const newOrder = new Order({
      ...req.body,
      orderNumber,
      date: orderDate,
    });

    await newOrder.save();

    // ✅ Check by primary number only
    let customer = await Customer.findOne({ phoneNumber: customerPhone });

    if (!customer) {
      const newCustomer = new Customer({
        name: req.body.customerObject.name,
        phoneNumber: customerPhone,
        secondaryNumber: customerSecondary,
        address: req.body.customerObject.address,
        email: req.body.customerObject.email,
        orderList: [{ ...req.body, orderNumber }],
      });
      await newCustomer.save();
    } else {
      // Optional: Update secondary number
      if (customerSecondary && customer.secondaryNumber !== customerSecondary) {
        customer.secondaryNumber = customerSecondary;
      }

      customer.orderList.push({ ...req.body, orderNumber });
      await customer.save();
    }

    // ✅ Handle Finance if applicable
    if (req.body.paymentObject.paymentType === "THIRD PARTY FINANCE") {
      const newFinance = new Finance({
        customerObject: {
          name: req.body.customerObject.name,
          phoneNumber: customerPhone,
          secondaryNumber: customerSecondary,
          address: req.body.customerObject.address,
          email: req.body.customerObject.email,
        },
        status: "Pending",
        orderNumber,
        customerImage: req.body.customerImage,
        guaranteerImage: req.body.guaranteerImage,
        productObject: {
          ...req.body.orderObject,
          quantity,
          modelName,
          serialNumber: req.body.orderObject.serialNumber,
          IMEI: req.body.orderObject.IMEI,
          category,
        },
        paymentObject: req.body.paymentObject,
        guaranteerObject: {
          name: req.body.tpf.guaranteerName,
          phoneNumber: req.body.tpf.guaranteerPhoneNumber,
          address: req.body.tpf.guaranteerAddress,
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
        upcomingDate: new Date(req.body.tpf.upcomingDate),
        financeNumber,
      });

      await newFinance.save();
    }

    res.status(201).send("Order placed successfully.");
  } catch (err) {
    console.error("Error placing order:", err);
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
