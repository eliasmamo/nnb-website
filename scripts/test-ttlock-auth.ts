/**
 * Script to test TTLock authentication and see detailed errors
 * Run: npx tsx scripts/test-ttlock-auth.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function testAuth() {
  const clientId = process.env.TTLOCK_CLIENT_ID;
  const clientSecret = process.env.TTLOCK_CLIENT_SECRET;
  const username = process.env.TTLOCK_USERNAME;
  const password = process.env.TTLOCK_PASSWORD;
  const baseUrl = process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com';

  console.log('🔍 Testing TTLock Authentication...\n');
  console.log('Config:');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Client ID: ${clientId}`);
  console.log(`  Username: ${username}\n`);

  // MD5 hash the password if not already hashed
  const isAlreadyHashed = /^[a-f0-9]{32}$/i.test(password || '');
  const hashedPassword = isAlreadyHashed 
    ? password 
    : createHash('md5').update(password || '').digest('hex');

  console.log(`  Password (MD5): ${hashedPassword}\n`);

  const params = new URLSearchParams({
    client_id: clientId || '',
    client_secret: clientSecret || '',
    username: username || '',
    password: hashedPassword,
    grant_type: 'password',
  });

  console.log('📤 Request Parameters:');
  console.log(params.toString());
  console.log('\n🌐 Making request to:', `${baseUrl}/oauth2/token\n`);

  try {
    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`);

    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}\n`);

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('📋 Response Data:');
      console.log(JSON.stringify(data, null, 2));

      if (data.errcode) {
        console.log('\n❌ Error Details:');
        console.log(`  Error Code: ${data.errcode}`);
        console.log(`  Error Message: ${data.errmsg || 'No message'}`);
        
        if (data.errcode === -2009) {
          console.log('\n💡 This error usually means:');
          console.log('  - Username does not exist for this application');
          console.log('  - You need to register a user for your app first');
          console.log('\n  Run: npx tsx scripts/register-ttlock-user.ts');
        }
      } else if (data.access_token) {
        console.log('\n✅ Authentication successful!');
        console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
      }
    } else {
      const text = await response.text();
      console.log('📋 Response (HTML/Text):');
      console.log(text.substring(0, 500));
      console.log('\n❌ Received HTML error page instead of JSON');
      console.log('This usually means the API endpoint or parameters are incorrect.');
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error);
  }
}

testAuth();
