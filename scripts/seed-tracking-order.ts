import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedNewOrder() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    
    const pizza = await MenuItem.findOne({ name: 'Power-Up Pizza' });
    if (!pizza) {
        console.error('Pizza not found');
        process.exit(1);
    }

    const orderData = {
      customerName: 'Tracking Tester',
      customerPhone: '9998887776',
      address: '456 Timer Lane, Clock City',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      items: [
        {
          menuItem: pizza._id,
          name: pizza.name,
          price: pizza.price,
          quantity: 2
        }
      ],
      subtotal: pizza.price * 2,
      total: pizza.price * 2,
      status: 'pending'
    };

    const order = await Order.create(orderData);
    console.log('NEW_ORDER_ID:' + order._id);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedNewOrder();
