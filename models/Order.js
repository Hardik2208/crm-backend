const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema(
   { orderNumber : Number,
    category : String,
    modelName : String,
    quantity : Number,
    orderObject : Object,
    customerObject : Object,
    paymentObject : Object,
    tpf : Object,
    date : Date,
}
)

module.exports = mongoose.model("Order", OrderSchema)