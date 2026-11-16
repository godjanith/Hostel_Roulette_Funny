const mongoose = require("mongoose");

const choreSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    frequency: {
        type: String,
        enum: ["Daily", "Weekly", "One-time"],
        default: "Daily"
    }
});

module.exports = mongoose.model("Chore", choreSchema);