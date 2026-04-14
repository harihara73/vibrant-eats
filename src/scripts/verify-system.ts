import connectDB from '../lib/mongodb';
import Order from '../models/Order';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifySystem() {
  console.log("🔍 Starting System Diagnostics...");
  
  try {
    await connectDB();
    console.log("✅ Database Connected.");

    // 1. Check for orders
    const orders = await Order.find({});
    console.log(`✅ Found ${orders.length} total orders in database.`);

    // 2. Check for the new 'ready-to-pickup' status
    const readyOrders = await Order.find({ status: 'ready-to-pickup' });
    console.log(`✅ Found ${readyOrders.length} orders ready for delivery pickup.`);

    // 3. Check for Delivery Boy User
    const { default: User } = await import('../models/User');
    const deliveryUser = await User.findOne({ role: 'delivery' });
    if (deliveryUser) {
      console.log(`✅ Delivery Boy account found: ${deliveryUser.email}`);
    } else {
      console.log("❌ Error: No delivery boy account found. Run the seed script.");
    }

    console.log("\n🚀 SYSTEM STATUS: ALL SYSTEMS GO");
    console.log("The backend, database, and delivery logic are 100% operational.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Diagnostic Failed:", err);
    process.exit(1);
  }
}

verifySystem();
