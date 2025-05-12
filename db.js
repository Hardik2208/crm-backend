const mongoose = require('mongoose')

const connectDB = ()=>{
    mongoose.connect('mongodb+srv://hardik:hardik@hardik.tx2wnw3.mongodb.net/crm')
    .then((res)=> console.log(`MongoDB COnnected Successfully`))
    .catch((err)=> console.log(err))
}

module.exports = connectDB