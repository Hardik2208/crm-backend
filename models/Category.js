const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name : String,
    inputField : Array,
});


module.exports = mongoose.model("Category", CategorySchema)