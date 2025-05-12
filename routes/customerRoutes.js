const express = require('express');
const Customer = require('../models/Customer');
const router = express.Router();

// Add a Customer
router.post('/Customer', async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        await newCustomer.save();
        res.status(201).send('Customer Added Successfully!');
    } catch (err) {
        res.status(500).send('Error adding customer: ' + err.message);
    }
});

// Get All Customers
router.get('/Customer', async (req, res) => {
    try {
        const allEnquiries = await Customer.find();
        res.status(200).send(allEnquiries);
    } catch (err) {
        res.status(500).send('Error fetching customers: ' + err.message);
    }
});

// Delete a Customer by ID
router.delete('/Customer/:id', async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.status(200).send('Customer Deleted Successfully');
    } catch (err) {
        res.status(500).send('Error deleting customer: ' + err.message);
    }
});

// Update a Customer by ID
router.put('/Customer/:id', async (req, res) => {
    try {
        await Customer.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).send('Customer Updated Successfully');
    } catch (err) {
        res.status(500).send('Error updating customer: ' + err.message);
    }
});

// Reassign Order to Another Customer
router.put('/Customer/Reassign/:id', async (req, res) => {
    try {
        const assignedCustomer = await Customer.findOne({ phoneNumber: req.body.assignedNumber });
        if (!assignedCustomer) {
            return res.status(404).send("User Not Found");
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).send("Customer to reassign from not found");
        }

        // Transfer matching order
        const orderToMove = customer.orderList.filter(order => order.orderNumber === req.body.orderNumber);
        if (orderToMove.length === 0) {
            return res.status(400).send("Order not found in current customer");
        }

        assignedCustomer.orderList = [...assignedCustomer.orderList, ...orderToMove];
        customer.orderList = customer.orderList.filter(order => order.orderNumber !== req.body.orderNumber);

        await customer.save();
        await assignedCustomer.save();

        res.status(200).send("Order reassigned successfully");
    } catch (err) {
        res.status(500).send('Error during reassignment: ' + err.message);
    }
});

module.exports = router;
