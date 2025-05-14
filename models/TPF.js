const mongoose = require('mongoose')

const TPFSchema = new mongoose.Schema({
    orderNumber: Number,
    financeNumber: Number,
    financeObject: Object,
    paymentObject : Object,
    guaranteerObject: Object,
    customerObject: Object,
    productObject: Object,
    status: String,
    EMI: Array,
})

module.exports = mongoose.model("TPF", TPFSchema)