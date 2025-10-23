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
        const deviceIds = (devices || []).map(d => d.device_id);

        // Energy share by device for last 24h (used in initial visuals)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const energyDocs = await Reading.aggregate([
            { $match: { timestamp: { $gte: since } } },
            { $sort: { timestamp: 1 } },
            { $group: { _id: "$device_id", first: { $first: "$energyWh" }, last: { $last: "$energyWh" } } },
            { $project: { device_id: "$_id", deltaWh: { $max: [ { $subtract: ["$last", "$first"] }, 0 ] } } }
        ]);
        const energyByDevice = (energyDocs || [])
            .map(e => ({ device_id: e.device_id, kWh: (Number(e.deltaWh) || 0) / 1000 }))
            .filter(e => e.kWh >= 0);

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
