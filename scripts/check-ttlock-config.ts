/**
 * Script to check TTLock configuration
 * Run: npx tsx scripts/check-ttlock-config.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

console.log('🔍 Checking TTLock Configuration...\n');

const config = {
  TTLOCK_CLIENT_ID: process.env.TTLOCK_CLIENT_ID,
  TTLOCK_CLIENT_SECRET: process.env.TTLOCK_CLIENT_SECRET,
  TTLOCK_USERNAME: process.env.TTLOCK_USERNAME,
  TTLOCK_PASSWORD: process.env.TTLOCK_PASSWORD,
  TTLOCK_BASE_URL: process.env.TTLOCK_BASE_URL,
};

console.log('Environment Variables:');
console.log('─────────────────────────────────────');

Object.entries(config).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = value 
    ? (key.includes('PASSWORD') || key.includes('SECRET') 
        ? `${value.substring(0, 3)}***${value.substring(value.length - 3)}` 
        : value)
    : 'NOT SET';
  
  console.log(`${status} ${key}: ${display}`);
});

console.log('─────────────────────────────────────\n');

const allSet = Object.values(config).every(v => v && v.length > 0);

if (allSet) {
  console.log('✅ All required variables are set!\n');
  console.log('Next step: Run the list-locks script:');
  console.log('  npx tsx scripts/list-ttlock-locks.ts\n');
} else {
  console.log('❌ Some variables are missing!\n');
  console.log('Fix your .env file and make sure it has:');
  console.log('  TTLOCK_CLIENT_ID="..."');
  console.log('  TTLOCK_CLIENT_SECRET="..."');
  console.log('  TTLOCK_USERNAME="..."');
  console.log('  TTLOCK_PASSWORD="..."');
  console.log('  TTLOCK_BASE_URL="https://euapi.ttlock.com"\n');
  console.log('Note: No spaces around the = sign, and values in quotes\n');
}
