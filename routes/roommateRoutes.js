const express = require("express");
const router = express.Router();

const Roommate = require("../models/Roommate");

router.get("/", async (req, res) => {
    try {
        const roommates = await Roommate.find();
        res.json(roommates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        const roommate = await Roommate.create({
            name: name.trim()
        });

        res.status(201).json(roommate);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await Roommate.findByIdAndDelete(req.params.id);
        res.json({ message: "Roommate deleted" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;