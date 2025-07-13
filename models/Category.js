const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name : String,
    inputField : String,
});


module.exports = mongoose.model("Category", CategorySchema)