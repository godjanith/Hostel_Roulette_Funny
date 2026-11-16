const mongoose = require("mongoose");

const roommateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    assignedCount: {
        type: Number,
        default: 0
    },
    completedCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Roommate", roommateSchema);