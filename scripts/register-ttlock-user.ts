/**
 * Script to register a new user for your TTLock application
 * Run: npx tsx scripts/register-ttlock-user.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function registerUser() {
  const clientId = process.env.TTLOCK_CLIENT_ID;
  const clientSecret = process.env.TTLOCK_CLIENT_SECRET;
  const baseUrl = process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com';
  
  if (!clientId || !clientSecret) {
    console.error('❌ TTLOCK_CLIENT_ID and TTLOCK_CLIENT_SECRET are required');
    return;
  }

  // Prompt for new user details
  console.log('🔐 TTLock User Registration\n');
  console.log('You need to create a NEW user specifically for your application.');
  console.log('This is NOT your existing TTLock app login.\n');
  
  // For this script, we'll use a simple username/password
  // In production, you might want to use readline to prompt the user
  const username = 'nnb_hotel_user'; // Will be prefixed by TTLock
  const password = 'NNBHotel2024!'; // Must be max 32 chars, lowercase recommended
  
  console.log(`Creating user: ${username}`);
  console.log(`Password: ${password}\n`);

  try {
    // MD5 hash the password (TTLock requirement)
    const md5Password = createHash('md5').update(password).digest('hex');
    
    const params = new URLSearchParams({
      clientId,
      clientSecret,
      username,
      password: md5Password,
      date: Date.now().toString(),
    });

    const response = await fetch(`${baseUrl}/v3/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.errcode && data.errcode !== 0) {
      console.error('❌ Registration failed:', data.errmsg || 'Unknown error');
      console.error('Error code:', data.errcode);
      
      if (data.errcode === 10003) {
        console.log('\n💡 User might already exist. Try getting a token instead.');
      }
      return;
    }

    console.log('✅ User registered successfully!\n');
    console.log('📋 User Details:');
    console.log(`   Username: ${data.username || username}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔑 Now getting access token...\n');

    // Get access token
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

    console.log('✅ Access token obtained!\n');
    console.log('📝 Update your .env file with:');
    console.log(`   TTLOCK_USERNAME="${data.username || username}"`);
    console.log(`   TTLOCK_PASSWORD="${md5Password}"`);
    console.log('\n⚠️  Note: Use the MD5 hashed password in .env, not the plain password!');
    console.log('\n🎉 You can now use the list-locks script to see your locks.');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

registerUser();
