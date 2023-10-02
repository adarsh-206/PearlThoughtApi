// doctor.js

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    specialty: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    // Additional fields as needed
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;