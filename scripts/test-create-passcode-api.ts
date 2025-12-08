/**
 * Script to test passcode creation with detailed debugging
 * Run: npx tsx scripts/test-create-passcode-api.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { createHash } from 'crypto';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function testCreatePasscode() {
  const clientId = process.env.TTLOCK_CLIENT_ID;
  const clientSecret = process.env.TTLOCK_CLIENT_SECRET;
  const username = process.env.TTLOCK_USERNAME;
  const password = process.env.TTLOCK_PASSWORD;
  const baseUrl = process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com';

  console.log('🔐 Testing Passcode Creation API...\n');

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
    return;
  }

  console.log(`✅ Access token obtained\n`);

  // Step 2: Create passcode
  console.log('2️⃣ Creating passcode...\n');

  const lockId = '27371634'; // Your lock ID
  const pinCode = '123456'; // Test PIN
  
  // Calculate dates (tomorrow 2PM to next week 11AM)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(14, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 8);
  endDate.setHours(11, 0, 0, 0);

  console.log('📅 Validity Period:');
  console.log(`   Start: ${startDate.toISOString()}`);
  console.log(`   End: ${endDate.toISOString()}`);
  console.log(`   Start (ms): ${startDate.getTime()}`);
  console.log(`   End (ms): ${endDate.getTime()}\n`);

  const passcodeParams = new URLSearchParams({
    clientId: clientId || '',
    accessToken: authData.access_token,
    lockId: lockId,
    keyboardPwd: pinCode,
    startDate: startDate.getTime().toString(),
    endDate: endDate.getTime().toString(),
    keyboardPwdName: 'Test Guest',
    addType: '2',
    keyboardPwdType: '3',
    date: Date.now().toString(),
  });

  console.log('📤 Request Parameters:');
  console.log(passcodeParams.toString());
  console.log('\n🌐 Making POST request to:', `${baseUrl}/v3/keyboardPwd/add\n`);

  const passcodeResponse = await fetch(`${baseUrl}/v3/keyboardPwd/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: passcodeParams.toString(),
  });

  console.log(`📥 Response Status: ${passcodeResponse.status} ${passcodeResponse.statusText}\n`);

  const contentType = passcodeResponse.headers.get('content-type');
  console.log(`Content-Type: ${contentType}\n`);

  if (contentType?.includes('application/json')) {
    const passcodeData = await passcodeResponse.json();
    console.log('📋 Response Data:');
    console.log(JSON.stringify(passcodeData, null, 2));

    if (passcodeData.errcode && passcodeData.errcode !== 0) {
      console.log('\n❌ Error Details:');
      console.log(`  Error Code: ${passcodeData.errcode}`);
      console.log(`  Error Message: ${passcodeData.errmsg || 'No message'}`);
      
      console.log('\n💡 Common error codes:');
      console.log('  -3: Invalid Parameter (check lockId, dates, or other params)');
      console.log('  -2009: User does not have access to this lock');
      console.log('  10003: Passcode already exists');
    } else if (passcodeData.keyboardPwdId) {
      console.log('\n✅ Passcode created successfully!');
      console.log(`  Passcode ID: ${passcodeData.keyboardPwdId}`);
      console.log(`  PIN Code: ${pinCode}`);
    }
  } else {
    const text = await passcodeResponse.text();
    console.log('📋 Response (HTML/Text):');
    console.log(text);
  }
}

testCreatePasscode();
