const express = require("express");
const router = express.Router();
const TPF = require("../models/TPF");

router.get("/tpf", async (req, res) => {
  const allFinance = await TPF.find();
  res.send(allFinance);
});

router.post("/tpf/find", async (req, res) => {
  try {
    const { financeNumber } = req.body; // extract it
    console.log("Searching for financeNumber:", financeNumber);
    const finance = await TPF.findOne({ financeNumber: Number(financeNumber) });
    if (!finance) return res.status(404).send({ message: "Finance not found" });
    res.send(finance);
  } catch (err) {
    console.error("Error in /tpf/find:", err);
    res.status(500).send({ error: "Internal Server Error" });
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

router.post("/tpf/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase();

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allfinances = await TPF.find();

    const result = allfinances.filter((finance) => {
      const financeObj = finance.toObject();
      return containsSearchTerm(financeObj, searchTerm);
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Error searching customer: " + err.message);
  }
});

router.post("/tpf/find/order", async (req, res) => {
  try {
    const { orderNumber } = req.body;
    const finance = await TPF.findOne({ orderNumber: Number(orderNumber) }); // make sure it's a number
    if (!finance) return res.status(404).send({ message: "Finance not found" });
    res.send(finance);
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" + err });
  }
});

router.post("/tpf", async (req, res) => {
  try {
    const { financeNumber, paymentAmount } = req.body;

    const FinanceObject = await TPF.findOne({ financeNumber });

    if (!FinanceObject) {
      return res.status(404).json({ error: "Finance record not found" });
    }

    const updatingEMI = { ...req.body, date: new Date() };
    FinanceObject.EMI = [...(FinanceObject.EMI || []), updatingEMI];

    // Update EMI Left
    let emiLeft = Number(FinanceObject.financeObject.numberOfEMILeft);
    const emiAmount = Number(FinanceObject.financeObject.amountOfEMI);

    if (Number(paymentAmount) >= emiAmount) {
      emiLeft -= 1;
    }

    emiLeft = Math.max(emiLeft, 0);
    FinanceObject.financeObject.numberOfEMILeft = emiLeft.toString();
    FinanceObject.markModified("financeObject");

    // Sum all payments
    const totalSum = FinanceObject.EMI.reduce(
      (acc, emi) => acc + Number(emi.paymentAmount),
      0
    );

    const totalAmount =
      emiAmount * Number(FinanceObject.financeObject.numberOfEMI);

    if (totalSum >= totalAmount) {
      FinanceObject.status = "Completed";
      FinanceObject.upcomingDate = null;
    } else {
      const currentDate = new Date(FinanceObject.upcomingDate || new Date());
      const nextMonth = new Date(
        currentDate.setMonth(currentDate.getMonth() + 1)
      );
      FinanceObject.upcomingDate = nextMonth;
    }

    await FinanceObject.save();

    res.status(200).json({
      message: "EMI added successfully",
      data: FinanceObject,
    });
  } catch (err) {
    console.error("Error in /tpf POST:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
