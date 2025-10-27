const express = require("express");
const router = express.Router();
const Reading = require("../models/reading");

// POST /api/readings  { device_id, energyWh, powerW, voltageV?, currentA?, timestamp? }
router.post("/", async (req, res) => {
    try {
        const { device_id, energyWh, powerW, voltageV, currentA, timestamp } = req.body;
        if (!device_id || energyWh == null || powerW == null) {
            return res.status(400).json({ message: "device_id, energyWh and powerW are required" });
        }

        const reading = await Reading.create({ device_id, energyWh, powerW, voltageV, currentA, timestamp });
        req.app.get('io').emit("reading:new", reading);
        res.status(201).json(reading);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create reading" });
    }
});

// GET /api/readings?device_id=ABC&limit=100
router.get("/", async (req, res) => {
    try {
        const { device_id } = req.query;
        const limit = Math.min(parseInt(req.query.limit || "100", 10), 1000);

        const filter = {};
        if (device_id) filter.device_id = device_id;

        const readings = await Reading.find(filter).sort({ timestamp: -1 }).limit(limit);
        res.json(readings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch readings" });
    }
});

module.exports = router;






