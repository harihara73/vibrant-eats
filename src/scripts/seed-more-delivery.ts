import mongoose, { Schema, model, models } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'customer', 'delivery'], default: 'customer' },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

async function seedMoreDelivery() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const hashedPassword = await bcrypt.hash('rahul123', 10);
    const hashedPassword2 = await bcrypt.hash('ankit123', 10);

    const boys = [
      { name: 'Rahul Sharma', email: 'rahul@delivery.com', password: hashedPassword, role: 'delivery' },
      { name: 'Ankit Kumar', email: 'ankit@delivery.com', password: hashedPassword2, role: 'delivery' }
    ];

    for (const boy of boys) {
      await User.findOneAndUpdate(
        { email: boy.email },
        boy,
        { upsert: true, new: true }
      );
      console.log(`✅ Created/Updated: ${boy.name} (${boy.email})`);
    }

    console.log('\n🚀 Multi-account test team is ready!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedMoreDelivery();
