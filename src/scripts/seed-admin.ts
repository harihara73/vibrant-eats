import connectDB from '../lib/mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  await connectDB();
  
  const adminEmail = 'admin@restaurant.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await User.create({
    name: 'Restaurant Owner',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
  });

  console.log('Admin user created: admin@restaurant.com / admin123');
  process.exit(0);
}

seedAdmin().catch(console.error);
