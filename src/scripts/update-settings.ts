// Direct settings update script - run with: npx tsx src/scripts/update-settings.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing anything else
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';

async function updateSettings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected');

  const db = mongoose.connection.db!;
  const coll = db.collection('settings');

  // Check current state
  const current = await coll.findOne({ key: 'main_settings' });
  console.log('Current settings:', {
    restaurantLat: current?.restaurantLat,
    restaurantLng: current?.restaurantLng,
    deliveryRadiusKm: current?.deliveryRadiusKm,
    isLive: current?.isLive,
  });

  // Update with Hyderabad (Ameerpet) restaurant location
  const result = await coll.updateOne(
    { key: 'main_settings' },
    {
      $set: {
        restaurantLat: 17.43476,
        restaurantLng: 78.444719,
        restaurantName: 'VibrantEats Restaurant',
        deliveryRadiusKm: 10,
        deliveryCharges: { '5': 15, '10': 25, '15': 35, '20': 50 },
        deliveryDiscount: 0,
      }
    },
    { upsert: true }
  );

  console.log('✅ Update result:', result);

  // Verify
  const updated = await coll.findOne({ key: 'main_settings' });
  console.log('✅ Updated settings:', {
    restaurantLat: updated?.restaurantLat,
    restaurantLng: updated?.restaurantLng,
    deliveryRadiusKm: updated?.deliveryRadiusKm,
  });

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
}

updateSettings().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
