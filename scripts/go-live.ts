import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Settings from '../models/Settings';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function goLive() {
  console.log('🚀 Attempting to set restaurant status to LIVE...');
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Database.');

    const settings = await Settings.findOneAndUpdate(
      { key: 'main_settings' },
      { isLive: true },
      { upsert: true, new: true }
    );

    console.log('\n✨ RESTAURANT IS NOW LIVE!');
    console.log('Status Details:', {
      key: settings.key,
      isLive: settings.isLive,
      updatedAt: settings.updatedAt
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ FAILED TO GO LIVE');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

goLive();
