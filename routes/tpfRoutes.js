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
    const finance = await TPF.findOne({ financeNumber: Number(financeNumber) }); // make sure it's a number
    if (!finance) return res.status(404).send({ message: "Finance not found" });
    res.send(finance);
  } catch (err) {
    console.error("Error in /tpf/find:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/tpf/Search", async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm?.toLowerCase(); // May be undefined

    if (!searchTerm) {
      return res.status(400).send("Search term is missing");
    }

    const allTPFs = await TPF.find();

    const result = allTPFs.filter((customer) => {
      return Object.values(customer.toObject()).some(
        (value) => value && value.toString().toLowerCase().includes(searchTerm)
      );
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Search Error:", err); // ✅ log full error
    res.status(500).send("Error searching customer: " + err.message);
  }
});


router.post("/tpf/find/order", async (req, res) => {
  try {
    console.log(req.body)
    console.log("api hit")
    const { orderNumber } = req.body;
    console.log("Searching for orderNumber:", orderNumber);
    const finance = await TPF.findOne({ orderNumber: Number(orderNumber) }); // make sure it's a number
    if (!finance) return res.status(404).send({ message: "Finance not found" });
    res.send(finance);
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" + err });
  }
});

router.post("/tpf", async (req, res) => {
  try {
    const { financeNumber, paymentAmount, paymentType, remarks } = req.body;

    const FinanceObject = await TPF.findOne({ financeNumber });

    if (!FinanceObject) {
      return res.status(404).json({ error: "Finance record not found" });
    }

    let updatingEMI = { ...req.body, date: new Date() };
    FinanceObject.EMI = [...(FinanceObject.EMI || []), updatingEMI];


    let emiLeft = Number(FinanceObject.financeObject.numberOfEMILeft);
    if (emiLeft>0){emiLeft -= 1}
    FinanceObject.financeObject.numberOfEMILeft = emiLeft.toString();
    FinanceObject.markModified("financeObject");

    let totalSum =0;

    FinanceObject.EMI.map((i,index)=>{totalSum+=i.paymentAmount})

    
    let totalAmount = FinanceObject.financeObject.amountOfEMI*FinanceObject.financeObject.numberOfEMI

    if(totalAmount <= totalSum){
      FinanceObject.status = "Completed"
    }
    
    await FinanceObject.save();

    res.status(200).json({ message: "EMI added successfully", data: FinanceObject });
  } catch (err) {
    console.error("Error in /tpf POST:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
