const express = require("express");
const router = express.Router();
const Reading = require("../models/reading");

router.post("/generate", async (req, res) => {
    try {
        const { device_id = "DEV-001", points = 50, intervalSeconds = 30 } = req.body || {};
        const now = Date.now();

        function rand(min, max) { return Math.random() * (max - min) + min; }
        const docs = [];
        let energyWh = Math.round(rand(0, 500));
        for (let i = points - 1; i >= 0; i--) {
            const ts = new Date(now - i * intervalSeconds * 1000);
            const voltageV = Math.round(rand(215, 245) * 10) / 10;
            const currentA = Math.round(rand(0.2, 10) * 100) / 100;
            const powerW = Math.max(0, Math.round(voltageV * currentA + rand(-30, 30)));
            const dtHrs = intervalSeconds / 3600;
            energyWh += Math.round(powerW * dtHrs);
            docs.push({ device_id, powerW, energyWh, voltageV, currentA, timestamp: ts });
        }

        await Reading.insertMany(docs);
        const inserted = await Reading.find({ device_id }).sort({ timestamp: 1 }).lean();
        req.app.get('io').emit("reading:new", inserted[inserted.length - 1]);
        res.json({ ok: true, inserted: docs.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate sample" });
    }
});

module.exports = router;






