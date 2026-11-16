const express = require("express");
const router = express.Router();

const Chore = require("../models/Chore");

router.get("/", async (req, res) => {
    try {
        const chores = await Chore.find();
        res.json(chores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const chore = await Chore.create(req.body);
        res.status(201).json(chore);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await Chore.findByIdAndDelete(req.params.id);
        res.json({ message: "Chore deleted" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;