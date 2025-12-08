/**
 * Script to list all TTLock locks in your account
 * Run: npx tsx scripts/list-ttlock-locks.ts
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { getTTLockClient } from '../app/lib/ttlock';

// Load .env file
loadEnv({ path: resolve(__dirname, '../.env') });

async function main() {
  try {
    console.log('🔍 Fetching locks from TTLock Cloud...\n');
    
    const client = getTTLockClient();
    const locks = await client.listLocks();

    if (locks.length === 0) {
      console.log('❌ No locks found in your account.');
      console.log('Make sure:');
      console.log('  1. Your lock is added to TTLock app');
      console.log('  2. Gateway is connected to the lock');
      console.log('  3. Credentials in .env are correct\n');
      return;
    }

    console.log(`✅ Found ${locks.length} lock(s):\n`);
    
    locks.forEach((lock, index) => {
      console.log(`Lock #${index + 1}:`);
      console.log(`  Lock ID: ${lock.lockId}`);
      console.log(`  Lock Name: ${lock.lockAlias || 'Unnamed'}`);
      console.log(`  Lock MAC: ${lock.lockMac || 'N/A'}`);
      console.log(`  Has Gateway: ${lock.hasGateway ? 'Yes ✓' : 'No ✗'}`);
      console.log(`  Electric Quantity: ${lock.electricQuantity || 'N/A'}%`);
      console.log(`  Lock Data: ${lock.lockData ? 'Available' : 'N/A'}`);
      console.log('');
    });

    console.log('📋 Copy the Lock ID above and use it to configure your room in the database.\n');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    console.log('\nTroubleshooting:');
    console.log('  1. Check TTLOCK_* variables in .env file');
    console.log('  2. Verify username/password are correct');
    console.log('  3. Make sure you have locks in your TTLock app\n');
  }
}

main();
