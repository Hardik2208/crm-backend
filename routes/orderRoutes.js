const express   = require("express");
const Order     = require("../models/Order");
const Customer  = require("../models/Customer");
const Product   = require("../models/Product");
const Category  = require("../models/Category");
const Finance   = require("../models/TPF");

const router = express.Router();

router.post("/order", async (req, res) => {
  try {
    
    const orderDate      = new Date();
    const nextMonthDate  = new Date(orderDate);      // kept for later use
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const {
      modelName,
      category: categoryName,           // string e.g. "MOBILE"
      orderObject,
      customerObject,
      paymentObject,
      tpf,
      customerImage,
      guaranteerImage
    } = req.body;

    const quantity       = Number(req.body.quantity);

    const product   = await Product.findOne({ modelName });
    if (!product || product.quantity < quantity) {
      return res
        .status(404)
        .send("Product not found in stock or insufficient quantity.");
    }

    const categoryDoc = await Category.findOne({ name: categoryName });
    if (!categoryDoc) {
      return res.status(400).send("Invalid category.");
    }

    const idField = categoryDoc.inputField; 
    
    if (idField) {
      const idsInOrder = orderObject[idField] || [];

      if (!Array.isArray(idsInOrder) || idsInOrder.length !== quantity) {
        return res
          .status(400)
          .send(`${idField} list must be an array with length equal to quantity.`);
      }

      const idsInStock = product?.productObject?.[idField];
      if (!Array.isArray(idsInStock)) {
        return res
          .status(500)
          .send(`Product ${idField} data is malformed or missing.`);
      }

      const allExist = idsInOrder.every((id) => idsInStock.includes(id));
      if (!allExist) {
        return res.status(400).send(`One or more ${idField}s not found in stock.`);
      }

      idsInOrder.forEach((id) => {
        const idx = idsInStock.indexOf(id);
        if (idx !== -1) idsInStock.splice(idx, 1);
      });

      product.quantity -= quantity;
      product.markModified(`productObject.${idField}`);
      await product.save();
    } else {
      product.quantity -= quantity;
      await product.save();
    }

    const primaryPhone   = Number(customerObject.phoneNumber);
    const secondaryPhone = customerObject.secondaryNumber
                           ? Number(customerObject.secondaryNumber)
                           : null;

    if (!primaryPhone || Number.isNaN(primaryPhone)) {
      return res.status(400).send("Invalid or missing primary phone number.");
    }
    if (customerObject.secondaryNumber &&
        (Number.isNaN(secondaryPhone) || !secondaryPhone)) {
      return res.status(400).send("Invalid secondary phone number.");
    }

    const orderNumber   = (await Order.countDocuments())   + 1;
    const financeNumber = (await Finance.countDocuments()) + 1;

    const newOrder = new Order({
      ...req.body,
      orderNumber,
      date: orderDate
    });
    await newOrder.save();

    let customer = await Customer.findOne({ phoneNumber: primaryPhone });

    if (!customer) {
      customer = new Customer({
        name:            customerObject.name,
        phoneNumber:     primaryPhone,
        secondaryNumber: secondaryPhone,
        address:         customerObject.address,
        email:           customerObject.email,
        orderList:       [{ ...req.body, orderNumber }]
      });
    } else {
      if (secondaryPhone && customer.secondaryNumber !== secondaryPhone) {
        customer.secondaryNumber = secondaryPhone;
      }
      customer.orderList.push({ ...req.body, orderNumber });
    }
    await customer.save();

    if (paymentObject.paymentType === "THIRD PARTY FINANCE") {
      const newFinance = new Finance({
        customerObject: {
          name:            customerObject.name,
          phoneNumber:     primaryPhone,
          secondaryNumber: secondaryPhone,
          address:         customerObject.address,
          email:           customerObject.email
        },
        status:        "Pending",
        orderNumber,
        customerImage,
        guaranteerImage,

        productObject: {
          ...orderObject,
          quantity,
          modelName,
          category: categoryName
        },

        paymentObject,

        guaranteerObject: {
          name:        tpf.guaranteerName,
          phoneNumber: tpf.guaranteerPhoneNumber,
          address:     tpf.guaranteerAddress
        },

        financeObject: {
          downPayment:      tpf.downPayment,
          numberOfEMI:      tpf.numberOfEMI,
          fileCharge:       tpf.fileCharge,
          interest:         tpf.intrest,
          amountOfEMI:      tpf.amountOfEMI,
          numberOfEMILeft:  tpf.numberOfEMI
        },

        date:         orderDate,
        upcomingDate: new Date(tpf.upcomingDate),
        financeNumber
      });
      await newFinance.save();
    }

    res.status(201).send("Order placed successfully.");

  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;


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
