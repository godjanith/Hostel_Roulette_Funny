const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
    roommate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Roommate",
        required: true
    },
    chore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chore",
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending"
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Assignment", assignmentSchema);