const mongoose = require("mongoose");
const path = require("path");

// Ensure we can require models with relative path
const Reading = require(path.join(__dirname, "..", "models", "reading"));

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sentinelNexus";

// Configure what to seed
const DEVICE_IDS = ["DEV-001", "DEV-002", "DEV-003"]; // add/remove as needed
const INTERVAL_SECONDS = 30; // reading interval
const TOTAL_POINTS = 200; // number of readings per device

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function generateReading(deviceId, baseTimeMs, indexFromEnd) {
    const ts = new Date(baseTimeMs - indexFromEnd * INTERVAL_SECONDS * 1000);

    // Simulate semi-realistic ranges
    const voltageV = Math.round(randomInRange(215, 245) * 10) / 10;
    const currentA = Math.round(randomInRange(0.2, 10) * 100) / 100;
    const powerW = Math.round(voltageV * currentA + randomInRange(-30, 30));

    // Accumulate energy reading
    // energyWh += power(W) * dt(h)
    const dtHours = INTERVAL_SECONDS / 3600;
    // Start energy around some random baseline and grow
    const startWh = Math.round(randomInRange(0, 500));
    const energyWh = startWh + Math.round(powerW * dtHours * indexFromEnd);

    return {
        device_id: deviceId,
        powerW: Math.max(0, powerW),
        energyWh: Math.max(0, energyWh),
        voltageV,
        currentA,
        timestamp: ts
    };
}

async function run() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to Mongo:", MONGO_URL);

    const now = Date.now();
    const docs = [];

    for (const deviceId of DEVICE_IDS) {
        for (let i = TOTAL_POINTS - 1; i >= 0; i--) {
            docs.push(generateReading(deviceId, now, i));
        }
    }

    console.log(`Inserting ${docs.length} readings for devices:`, DEVICE_IDS.join(", "));
    await Reading.insertMany(docs);
    console.log("Seed complete.");
}

run()
    .catch((err) => {
        console.error("Seed failed:", err);
        process.exitCode = 1;
    })
    .finally(() => mongoose.connection.close());



