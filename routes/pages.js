const express = require("express");
const router = express.Router();
const Device = require("../models/device");
const Reading = require("../models/reading");
const { requireAuth } = require("../middleware/auth");

router.get("/", (req, res) => {
    res.send("the route is working");
});

// Web dashboard (all devices or filter by device_id)
router.get("/dashboard", requireAuth, async (req, res) => {
    try {
        const device_id = req.query.device_id || "__ALL__";
        const devices = await Device.find({}, { device_id: 1, _id: 0 }).lean();
        const deviceIds = devices.map(d => d.device_id);
        
        // Filter to only last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filter = device_id === "__ALL__" ? { timestamp: { $gte: twentyFourHoursAgo } } : { device_id, timestamp: { $gte: twentyFourHoursAgo } };
        
        const readings = await Reading.find(filter).sort({ timestamp: 1 }).lean();
        const totalReadings = readings.length;
        const uniqueDevices = new Set(readings.map(r => r.device_id)).size;
        res.render("dashboard", {
            deviceId: device_id,
            deviceIds,
            initialReadings: readings || [],
            summary: { totalReadings, uniqueDevices },
            username: req.user.username,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load dashboard");
    }
});

module.exports = router;



