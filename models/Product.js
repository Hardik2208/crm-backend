const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    category: String,
    productObject: Object,
    quantity: Number,
    modelName: { type: String, unique: true }, 
    description: String,
    amount: Number,
    sellingPrice: Number,
    supplierObject: Object,
});


module.exports = mongoose.model("Product", ProductSchema)