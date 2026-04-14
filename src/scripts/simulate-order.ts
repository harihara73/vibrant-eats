import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Order from '../models/Order';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function simulateOrder() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // Create a valid order matching the schema
    const newOrder = await Order.create({
      customerName: "Test Order " + Math.floor(Math.random() * 1000),
      customerPhone: "9876543210",
      address: "Gourmet Street, Apt 101",
      coordinates: { lat: 12.9716, lng: 77.5946 }, // Bangalore coords
      items: [
        { 
          menuItem: new mongoose.Types.ObjectId(), 
          name: "Signature Truffle Pasta", 
          price: 850, 
          quantity: 1 
        }
      ],
      subtotal: 850,
      total: 850,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: 'Prepaid'
    });

    console.log('Order created successfully:', newOrder._id);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Error creating order:', err.message);
    process.exit(1);
  }
}

simulateOrder();
