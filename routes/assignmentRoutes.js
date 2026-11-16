const express = require("express");
const router = express.Router();

const Roommate = require("../models/Roommate");
const Chore = require("../models/Chore");
const Assignment = require("../models/Assignment");

// Get assignment history
router.get("/", async (req, res) => {
    try {
        const assignments = await Assignment.find()
            .populate("roommate", "name")
            .populate("chore", "title")
            .sort({ assignedAt: -1 });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Spin roulette and assign chore
router.post("/spin", async (req, res) => {
    try {
        const { choreId } = req.body;

        const chore = await Chore.findById(choreId);

        if (!chore) {
            return res.status(404).json({ message: "Chore not found" });
        }

        const roommates = await Roommate.find();

        if (roommates.length === 0) {
            return res.status(400).json({
                message: "Add roommates first"
            });
        }

        const pending = await Assignment.findOne({
            chore: choreId,
            status: "Pending"
        });

        if (pending) {
            return res.status(409).json({
                message: "This chore already has a pending assignment"
            });
        }

        // Find roommates with the lowest assignment count
        const minCount = Math.min(
            ...roommates.map(r => r.assignedCount)
        );

        const eligible = roommates.filter(
            r => r.assignedCount === minCount
        );

        // Randomly select among eligible roommates
        const selected =
            eligible[Math.floor(Math.random() * eligible.length)];

        const assignment = await Assignment.create({
            roommate: selected._id,
            chore: choreId
        });

        selected.assignedCount++;
        await selected.save();

        const result = await assignment.populate([
            { path: "roommate", select: "name" },
            { path: "chore", select: "title" }
        ]);

        res.status(201).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Complete a chore
router.patch("/:id/complete", async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        if (assignment.status === "Completed") {
            return res.status(409).json({
                message: "Already completed"
            });
        }

        assignment.status = "Completed";
        assignment.completedAt = new Date();

        await assignment.save();

        await Roommate.findByIdAndUpdate(
            assignment.roommate,
            { $inc: { completedCount: 1 } }
        );

        res.json(assignment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;