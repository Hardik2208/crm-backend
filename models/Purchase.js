const mongoose = require('mongoose')

const PurchaseSchema = new mongoose.Schema({
    category: String,
    quantity: Number,
    modelName: { type: String, unique: true }, 
    supplierObject: Object,
});


module.exports = mongoose.model("Purchase", PurchaseSchema)