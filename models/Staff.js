const mongoose = require('mongoose')

const StaffSchema = new mongoose.Schema({
    work: String,
    workTimmings: String,
    salary: Number,
    leavesAllowded: Number,
    staffName: String,
    staffPhoneNumber: String,
    staffEmail: String,
    staffAddress: String,
    aadharCardNumber: String,
    panCardNumber: String,
    leaves: Array,
    halfDay: Array,
    attendance: Object,
})

module.exports = mongoose.model("Staff", StaffSchema)