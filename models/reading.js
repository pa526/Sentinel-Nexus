const mongoose = require("mongoose");
const { Schema } = mongoose;

const readingSchema = new Schema({
    device_id: {
        type: String,
        required: true,
        index: true
    },
    energyWh: {
        type: Number,
        required: true,
        min: 0
    },
    powerW: {
        type: Number,
        required: true,
        min: 0
    },
    voltageV: {
        type: Number,
        required: false,
        min: 0
    },
    currentA: {
        type: Number,
        required: false,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model("Reading", readingSchema);



