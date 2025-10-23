const mongoose = require("mongoose");
const {Schema} = mongoose;

const deviceSchema = new Schema({
  device_id: {
    type: String,
    required: true,
    unique: true
  },

  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    default: "My Smart Meter"
  },

  type: {
    type: String,
    enum: ["meter", "inverter", "battery"],
    default: "meter"
  },

  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline"
  },

  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Device", deviceSchema);