const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const Device = require("../models/device");
const Reading = require("../models/reading");

// AI Insights page body (no navbar/header)
router.get("/ai/insights", requireAuth, async (req, res) => {
    try {
        const deviceId = req.query.device_id || "__ALL__";
        // Devices list for selector
        const devices = await Device.find({}, { device_id: 1, _id: 0 }).lean();
        const deviceIds = devices.map(d => d.device_id);
        
        // Add additional devices to the selector
        const additionalDevices = [
            'DEV-005', 'DEV-006', 'DEV-007', 'DEV-008', 'DEV-009', 'DEV-010',
            'DEV-011', 'DEV-012', 'DEV-013', 'DEV-014', 'DEV-015', 'DEV-016'
        ];
        
        // Merge additional devices with existing ones (avoid duplicates)
        additionalDevices.forEach(deviceId => {
            if (!deviceIds.includes(deviceId)) {
                deviceIds.push(deviceId);
            }
        });

        // Energy share by device for last 24h (used in initial visuals)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const energyDocs = await Reading.aggregate([
            { $match: { timestamp: { $gte: since } } },
            { $sort: { timestamp: 1 } },
            { $group: { _id: "$device_id", first: { $first: "$energyWh" }, last: { $last: "$energyWh" } } },
            { $project: { device_id: "$_id", deltaWh: { $max: [ { $subtract: ["$last", "$first"] }, 0 ] } } }
        ]);
        
        // Create a map of actual energy consumption
        const energyMap = {};
        (energyDocs || []).forEach(e => {
            energyMap[e.device_id] = (Number(e.deltaWh) || 0) / 1000;
        });
        
        // Add sample energy data for additional devices
        additionalDevices.forEach(deviceId => {
            if (!energyMap[deviceId]) {
                // Generate realistic energy consumption (0.5 to 15 kWh)
                energyMap[deviceId] = Math.round((Math.random() * 14.5 + 0.5) * 100) / 100;
            }
        });
        
        // Convert to array format and sort by energy consumption (descending)
        const energyByDevice = Object.entries(energyMap)
            .map(([device_id, kWh]) => ({ device_id, kWh }))
            .filter(e => e.kWh >= 0)
            .sort((a, b) => b.kWh - a.kWh);

        // Also include byType and byStatus like insights
        const devicesAll = await Device.find({}, { device_id:1, type:1, status:1 }).lean();
        const byType = (devicesAll || []).reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {});
        const byStatus = (devicesAll || []).reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});

        res.render("ai-insights", {
            username: req.user.username,
            deviceId,
            init: { deviceIds, energyByDevice, byType, byStatus }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to load AI Insights");
    }
});

module.exports = router;
