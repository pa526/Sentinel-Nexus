const sampleData = [
    {
        device_id: "INV123",
        user_id: "652b7a83f4d2c9a9b7e67890",
        name: "Solar Inverter A1",
        type: "inverter",
        status: "offline",
        registeredAt: "2025-09-20T14:22:10Z"
    },
    {
        device_id: "BAT456",
        user_id: "652b7a83f4d2c9a9b7e99999",
        name: "Battery Unit 2",
        type: "battery",
        status: "online",
        registeredAt: "2025-10-01T09:45:33Z"
    },
    {
        device_id: "DEV001",
        user_id: "652b7a83f4d2c9a9b7e12345",
        name: "Main Smart Meter",
        type: "meter",
        status: "online",
        registeredAt: "2025-10-08T10:15:00Z"
    },
    {
        device_id: "MTR789",
        user_id: "652b7a83f4d2c9a9b7e55555",
        name: "Backup Meter",
        type: "meter",
        status: "offline",
        registeredAt: "2025-08-30T17:30:00Z"
    },
    {
        device_id: "INV900",
        user_id: "652b7a83f4d2c9a9b7e33333",
        name: "Roof Solar Inverter",
        type: "inverter",
        status: "online",
        registeredAt: "2025-10-06T12:10:45Z"
    }
];

module.exports = {data: sampleData};