/**
 * Script to test listing locks with detailed debugging
 * Run: npx tsx scripts/test-list-locks.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function testListLocks() {
  const clientId = process.env.TTLOCK_CLIENT_ID;
  const clientSecret = process.env.TTLOCK_CLIENT_SECRET;
  const username = process.env.TTLOCK_USERNAME;
  const password = process.env.TTLOCK_PASSWORD;
  const baseUrl = process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com';

  console.log('🔍 Testing Lock List API...\n');

  // Step 1: Get access token
  const isAlreadyHashed = /^[a-f0-9]{32}$/i.test(password || '');
  const hashedPassword = isAlreadyHashed 
    ? password 
    : createHash('md5').update(password || '').digest('hex');

  const authParams = new URLSearchParams({
    client_id: clientId || '',
    client_secret: clientSecret || '',
    username: username || '',
    password: hashedPassword,
    grant_type: 'password',
  });

  console.log('1️⃣ Getting access token...');
  const authResponse = await fetch(`${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: authParams.toString(),
  });

  const authData = await authResponse.json();
  
  if (!authData.access_token) {
    console.error('❌ Failed to get access token');
    console.error(JSON.stringify(authData, null, 2));
    return;
  }

  console.log(`✅ Access token: ${authData.access_token.substring(0, 20)}...\n`);

  // Step 2: List locks
  console.log('2️⃣ Listing locks...');
  
  // Try with current timestamp (some APIs require this)
  const lockParams = new URLSearchParams({
    clientId: clientId || '',
    accessToken: authData.access_token,
    pageNo: '1',
    pageSize: '100',
    date: Date.now().toString(),
  });

  console.log('📤 Request Parameters:');
  console.log(lockParams.toString());
  
  // Try GET method with query parameters
  const url = `${baseUrl}/v3/lock/list?${lockParams.toString()}`;
  console.log('\n🌐 Making GET request to:', url, '\n');

  const lockResponse = await fetch(url, {
    method: 'GET',
  });

  console.log(`📥 Response Status: ${lockResponse.status} ${lockResponse.statusText}\n`);

  const contentType = lockResponse.headers.get('content-type');
  console.log(`Content-Type: ${contentType}\n`);

  if (contentType?.includes('application/json')) {
    const lockData = await lockResponse.json();
    console.log('📋 Response Data:');
    console.log(JSON.stringify(lockData, null, 2));

    if (lockData.errcode && lockData.errcode !== 0) {
      console.log('\n❌ Error Details:');
      console.log(`  Error Code: ${lockData.errcode}`);
      console.log(`  Error Message: ${lockData.errmsg || 'No message'}`);
    } else if (lockData.list) {
      console.log(`\n✅ Found ${lockData.list.length} lock(s)!`);
      lockData.list.forEach((lock: any, i: number) => {
        console.log(`\nLock #${i + 1}:`);
        console.log(`  Lock ID: ${lock.lockId}`);
        console.log(`  Lock Name: ${lock.lockAlias || 'Unnamed'}`);
        console.log(`  Has Gateway: ${lock.hasGateway ? 'Yes' : 'No'}`);
      });
    }
  } else {
    const text = await lockResponse.text();
    console.log('📋 Response (HTML/Text):');
    console.log(text);
  }
}

testListLocks();
