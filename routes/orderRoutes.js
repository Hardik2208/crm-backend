const express = require("express");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Finance = require("../models/TPF");
const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    console.log(req.body)

    let product = await Product.findOne({
      modelName: req.body.modelName,
      productObject: req.body.orderObject,
    });

    if (!product || product.quantity < req.body.quantity) {
      return res
        .status(404)
        .send("Product Not Found in Stock! Update the Stock");
    }

    product.quantity -= req.body.quantity;
    await product.save();

    const allOrders = await Order.find();
    const allFinance = await Finance.find();
    const orderNumber = allOrders.length + 1;
    const financeNumber = allFinance.length + 1;

    const newOrder = new Order({
      ...req.body,
      orderNumber,
      date: new Date(),
    });

    await newOrder.save();

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

    if (req.body.paymentObject.paymentType === "THIRD PARTY FINANCE") {
      const newFinance = new Finance({
        customerObject: req.body.customerObject,
        orderNumber: orderNumber,
        productObject: {
          ...req.body.orderObject,
          quantity: req.body.quantity,
          modelName: req.body.modelName,
          category: req.body.category,
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
        
        financeNumber: financeNumber,
      });

      await newFinance.save();
    }

    res.status(201).send("Order placed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
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

  res.send(thisMonthOrders)
});

module.exports = router;
