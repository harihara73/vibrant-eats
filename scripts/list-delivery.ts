import connectDB from '../lib/mongodb';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listDeliveryUsers() {
  try {
    await connectDB();
    const users = await User.find({ role: 'delivery' });
    console.log("Delivery Users:");
    users.forEach(u => console.log(`- ${u.email}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listDeliveryUsers();
