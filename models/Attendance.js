const mongoose = require('mongoose')

const AttendanceSchema = new mongoose.Schema({
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff', // This references the Staff model
        required: true
    },
    date: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        enum: ['present', 'half-day', 'leave'],
        required: true
      }    
    });


module.exports = mongoose.model("Attendance", AttendanceSchema)