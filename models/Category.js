const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true              
    },
    inputField : String,
});


module.exports = mongoose.model("Category", CategorySchema)