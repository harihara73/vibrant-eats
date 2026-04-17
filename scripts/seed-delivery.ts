import mongoose, { Schema, model, models } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define User Schema inline to avoid import issues in standalone script
const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'customer', 'delivery'], default: 'customer' },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

async function seedDelivery() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const deliveryEmail = 'delivery@restaurant.com';
    const existingUser = await User.findOne({ email: deliveryEmail });

    if (existingUser) {
      console.log('Delivery user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('delivery123', 10);
    
    await User.create({
      name: 'Quick Delivery',
      email: deliveryEmail,
      password: hashedPassword,
      role: 'delivery',
    });

    console.log('✅ Delivery user created: delivery@restaurant.com / delivery123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedDelivery();
