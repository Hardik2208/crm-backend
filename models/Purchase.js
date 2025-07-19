const mongoose = require('mongoose')

const PurchaseSchema = new mongoose.Schema({
    category: String,
    quantity: Number,
    modelName: String, 
    supplierObject: Object,
});


module.exports = mongoose.model("Purchase", PurchaseSchema)