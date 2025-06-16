const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    category: String,
    productObject: Object,
    quantity: Number,
    modelName: { type: String, unique: true }, // ✅ Unique index added
    description: String,
    amount: Number,
    sellingPrice: Number,
});


module.exports = mongoose.model("Product", ProductSchema)