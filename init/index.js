const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const initData = require("./data.js");
const initUsers = require("./users-data.js");
const Device = require("../models/device.js");
const User = require("../models/user.js");

let mongoUrl = 'mongodb://127.0.0.1:27017/sentinelNexus';

async function main() {
  try {
    console.log("Connecting to MongoDB at:", mongoUrl);
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("Connected successfully");
    
    console.log("Initializing user data...");
    await initUsersDB();
    
    console.log("Initializing device data...");
    await initDB();
    
    console.log("Data initialization completed successfully");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

const initUsersDB = async() => {
  try {
    // Clear existing users first
    await User.deleteMany({});
    console.log("Cleared existing user data");
    
    // Create users with default password
    const defaultPassword = "password123";
    const createdUsers = [];
    
    for (const userData of initUsers.users) {
      const user = new User({ username: userData.username, email: userData.email });
      await User.register(user, defaultPassword);
      createdUsers.push(user);
    }
    
    console.log(`Created ${createdUsers.length} users successfully`);
    console.log("Default password for all users: password123");
    console.log("Sample users:", createdUsers.slice(0, 3).map(u => ({ username: u.username, _id: u._id })));
    
    return createdUsers;
  } catch (error) {
    console.error("Error creating users:", error);
    throw error;
  }
};

const initDB = async() => {
   try {
     // Convert string user_ids to ObjectIds
     const processedData = initData.data.map(device => ({
       ...device,
       user_id: new mongoose.Types.ObjectId(device.user_id),
       registeredAt: new Date(device.registeredAt)
     }));
     
     // Clear existing data first
     await Device.deleteMany({});
     console.log("Cleared existing device data");
     
     // Insert new data
     const deviceData = await Device.insertMany(processedData);
     console.log(`Inserted ${deviceData.length} devices successfully`);
     console.log("Sample inserted data:", deviceData.slice(0, 3));
   } catch (error) {
     console.error("Error inserting data:", error);
     throw error;
   }
};

main();