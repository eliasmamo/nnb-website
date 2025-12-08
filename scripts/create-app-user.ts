/**
 * Script to create a new user for your TTLock application
 * This user will be used by your app to access locks
 * Run: npx tsx scripts/create-app-user.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function createAppUser() {
  const clientId = process.env.TTLOCK_CLIENT_ID;
  const clientSecret = process.env.TTLOCK_CLIENT_SECRET;
  const baseUrl = process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com';
  
  if (!clientId || !clientSecret) {
    console.error('❌ TTLOCK_CLIENT_ID and TTLOCK_CLIENT_SECRET are required');
    return;
  }

  console.log('🔐 Creating TTLock Application User\n');
  console.log('This creates a NEW user specifically for your application.');
  console.log('This user will have access to locks you transfer to it.\n');
  
  // Generate a unique username and password
  const timestamp = Date.now();
  const username = `nnbhotel_${timestamp}`;
  const password = `NNBHotel${timestamp}!`;
  
  console.log(`📝 User Details:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`\n⏳ Creating user...\n`);

  try {
    // MD5 hash the password (TTLock requirement)
    const md5Password = createHash('md5').update(password).digest('hex');
    
    const params = new URLSearchParams({
      clientId,
      clientSecret,
      username,
      password: md5Password,
      date: timestamp.toString(),
    });

    const response = await fetch(`${baseUrl}/v3/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Received HTML instead of JSON:');
      console.error(text.substring(0, 300));
      return;
    }

    const data = await response.json();

    if (data.errcode && data.errcode !== 0) {
      console.error('❌ Registration failed!');
      console.error(`   Error code: ${data.errcode}`);
      console.error(`   Error message: ${data.errmsg || 'Unknown error'}`);
      
      if (data.errcode === 10003) {
        console.log('\n💡 User already exists. This is normal if you ran this before.');
      }
      return;
    }

    console.log('✅ User created successfully!\n');
    console.log('📋 Registered Username:', data.username || username);
    console.log('\n🔑 Now getting access token...\n');

    // Get access token for the new user
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      username: data.username || username,
      password: md5Password,
      grant_type: 'password',
    });

    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.errcode && tokenData.errcode !== 0) {
      console.error('❌ Token request failed:', tokenData.errmsg || 'Unknown error');
      return;
    }

    if (!tokenData.access_token) {
      console.error('❌ No access token received');
      console.error(JSON.stringify(tokenData, null, 2));
      return;
    }

    console.log('✅ Access token obtained!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 UPDATE YOUR .ENV FILE WITH THESE VALUES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`TTLOCK_USERNAME="${data.username || username}"`);
    console.log(`TTLOCK_PASSWORD="${password}"`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT NEXT STEPS:\n');
    console.log('1. Update your .env file with the values above');
    console.log('2. In TTLock mobile app, log in with your ORIGINAL account');
    console.log('3. Go to each lock → Settings → Authorization');
    console.log(`4. Add user: ${data.username || username}`);
    console.log('5. Grant "Admin" or "User" permissions');
    console.log('6. Run: npx tsx scripts/list-ttlock-locks.ts\n');
    console.log('💡 The new user won\'t see any locks until you share them!');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

createAppUser();
