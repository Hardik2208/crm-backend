const mongoose = require('mongoose')

const CustomerSchema = new mongoose.Schema({
    name: String,
    phoneNumber : Number,
    email: String,
    address: String,
    orderList: Array
})

module.exports = mongoose.model("Customer", CustomerSchema)