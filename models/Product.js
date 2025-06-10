const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    category: String,
    productObject: Object,
    quantity: Number,
    modelName: String,
    description: String,
    amount: Number,
    sellingPrice: Number,
})

module.exports = mongoose.model("Product", ProductSchema)