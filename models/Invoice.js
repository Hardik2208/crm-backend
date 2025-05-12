const mongoose = require('mongoose')

const InvoiceSchema = new mongoose.Schema(
   { invoiceNumber : Number,
    orderNumber : Number,
    category : String,
    modelName : String,
    quantity : Number,
    orderObject : Object,
    customerObject : Object,
    paymentObject : Object,
    date : Date,
}
)

module.exports = mongoose.model("Invoice", InvoiceSchema)