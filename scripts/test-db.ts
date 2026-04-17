import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  console.log('--- MONGODB CONNECTIVITY DIAGNOSTIC v1.0 ---');
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const maskedUri = MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@');
  console.log('Attempting to connect to:');
  console.log(maskedUri);
  console.log('-------------------------------------------');

  try {
    const start = Date.now();
    
    // Set a reasonably short timeout for the diagnostic
    const options = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    };

    console.log('[DEBUG] Calling mongoose.connect...');
    await mongoose.connect(MONGODB_URI, options);
    
    const duration = Date.now() - start;
    console.log(`\n✅ SUCCESS: Connected in ${duration}ms!`);
    
    console.log('[DEBUG] Testing query on "menu-items" collection...');
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Collections in database:', collections?.map(c => c.name).join(', ') || 'None');
    
    await mongoose.disconnect();
    console.log('\nDiagnostic complete. Database is reachable.');
    process.exit(0);
    
  } catch (err: any) {
    console.error('\n❌ CONNECTION FAILED');
    console.error('Error Name:', err.name);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    
    if (err.message.includes('ETIMEDOUT') || err.message.includes('serverSelectionTimeoutMS')) {
      console.log('\n🔎 DIAGNOSIS: NETWORK TIMEOUT');
      console.log('This usually means one of two things:');
      console.log('1. Your current IP address is NOT whitelisted in the MongoDB Atlas console.');
      console.log('2. Your local firewall or network is blocking the connection to port 27017.');
    } else if (err.message.includes('Authentication failed')) {
      console.log('\n🔎 DIAGNOSIS: AUTHENTICATION FAILED');
      console.log('Your username or password in .env.local is incorrect.');
    }
    
    process.exit(1);
  }
}

testConnection().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
