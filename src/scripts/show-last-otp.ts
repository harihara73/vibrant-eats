import mongoose from "mongoose";
import connectDB from "../lib/mongodb";
import OTP from "../models/OTP";

async function showLastOTP() {
  try {
    await connectDB();
    const dbName = mongoose.connection.db?.databaseName;
    console.log(`📡 Connected to Database: [${dbName}]`);

    const lastOTP = await OTP.findOne().sort({ createdAt: -1 });

    if (lastOTP) {
      console.log("\n==============================");
      console.log("   🔑 REVEALED OTP CODE   ");
      console.log("==============================");
      console.log(`Phone: ${lastOTP.phone}`);
      console.log(`Code:  ${lastOTP.code}`);
      console.log("------------------------------");
      console.log(`(Generated at: ${lastOTP.createdAt.toLocaleTimeString()})`);
      console.log("==============================\n");
    } else {
      console.log("\n❌ No active OTPs found in the database.");
    }
    process.exit(0);
  } catch (err: any) {
    console.error("Error fetching OTP:", err.message);
    process.exit(1);
  }
}

showLastOTP();
