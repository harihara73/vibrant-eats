import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedTestOrder() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // 1. Find or create the Power-Up Pizza
    let pizza = await MenuItem.findOne({ name: 'Power-Up Pizza' });
    if (!pizza) {
      pizza = await MenuItem.create({
        name: 'Power-Up Pizza',
        price: 250,
        preparationTime: 15,
        category: 'Pizza',
        description: 'Created for testing dynamic timers',
        isAvailable: true
      });
      console.log('Created Power-Up Pizza');
    } else {
      console.log('Found existing Power-Up Pizza with prep time:', pizza.preparationTime);
    }

    // 2. Create an order in 'preparing' status
    const orderData = {
      customerName: 'Test User',
      customerPhone: '1234567890',
      address: '123 Test St, Test City',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      items: [
        {
          menuItem: pizza._id,
          name: pizza.name,
          price: pizza.price,
          quantity: 1
        }
      ],
      subtotal: pizza.price,
      total: pizza.price,
      status: 'preparing',
      preparingAt: new Date()
    };

    const order = await Order.create(orderData);
    console.log('Created Test Order ID:', order._id);
    console.log('Status: preparing');
    console.log('Timer should start around 15:00');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedTestOrder();
