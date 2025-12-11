/**
 * TTLock Cloud API Integration
 * 
 * This module handles authentication and passcode generation for TTLock smart locks.
 * API Documentation: https://euopen.ttlock.com/doc/api/
 */

interface TTLockConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  baseUrl: string;
}

interface TTLockTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  openid: number;
}

interface CreatePasscodeParams {
  lockId: string;
  keyboardPwd: string;
  startDate: number; // Unix timestamp in milliseconds
  endDate: number; // Unix timestamp in milliseconds
  keyboardPwdName?: string;
  addType?: number; // 2 for custom passcode
  keyboardPwdType?: number; // 3 for time-limited
}

interface CreatePasscodeResponse {
  keyboardPwdId: number;
}

interface GetPasscodeResponse {
  keyboardPwd: string;
  keyboardPwdId: number;
}

interface DeletePasscodeParams {
  lockId: string;
  keyboardPwdId: number;
}

class TTLockClient {
  private config: TTLockConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: TTLockConfig) {
    this.config = config;
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // MD5 hash the password if it's not already hashed (32 chars hex)
    const isAlreadyHashed = /^[a-f0-9]{32}$/i.test(this.config.password);
    const password = isAlreadyHashed 
      ? this.config.password 
      : require('crypto').createHash('md5').update(this.config.password).digest('hex');

    // Request new token
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username: this.config.username,
      password: password,
      grant_type: 'password',
    });

    const response = await fetch(`${this.config.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTLock authentication failed: ${error}`);
    }

    const data: TTLockTokenResponse = await response.json();
    
    this.accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<T> {
    const token = await this.getAccessToken();

    const requestParams = new URLSearchParams({
      clientId: this.config.clientId,
      accessToken: token,
      date: Date.now().toString(),
      ...params,
    });

    let url = `${this.config.baseUrl}${endpoint}`;
    let fetchOptions: RequestInit = {};

    if (method === 'GET') {
      url += `?${requestParams.toString()}`;
      fetchOptions.method = 'GET';
    } else {
      fetchOptions.method = 'POST';
      fetchOptions.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      fetchOptions.body = requestParams.toString();
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTLock API request failed: ${error}`);
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.errcode && data.errcode !== 0) {
      throw new Error(`TTLock API error: ${data.errmsg || 'Unknown error'} (code: ${data.errcode})`);
    }

    return data;
  }

  /**
   * Generate a random 6-digit PIN code
   */
  private generatePinCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a time-limited passcode for a lock
   */
  async createPasscode(params: {
    lockId: string;
    startDate: Date;
    endDate: Date;
    guestName?: string;
  }): Promise<{ pinCode: string; keyboardPwdId: number }> {
    const pinCode = this.generatePinCode();

    const apiParams: any = {
      lockId: params.lockId,
      keyboardPwd: pinCode,
      startDate: params.startDate.getTime().toString(),
      endDate: params.endDate.getTime().toString(),
      keyboardPwdName: params.guestName || 'Guest',
      addType: '2', // Custom passcode
      keyboardPwdType: '3', // Time-limited
    };

    const response = await this.apiRequest<CreatePasscodeResponse>(
      '/v3/keyboardPwd/add',
      apiParams,
      'POST'
    );

    return {
      pinCode,
      keyboardPwdId: response.keyboardPwdId,
    };
  }

  /**
   * Get passcode details
   */
  async getPasscode(lockId: string, keyboardPwdId: number): Promise<GetPasscodeResponse> {
    return this.apiRequest<GetPasscodeResponse>('/v3/keyboardPwd/get', {
      lockId,
      keyboardPwdId,
    });
  }

  /**
   * Delete/revoke a passcode
   */
  async deletePasscode(lockId: string, keyboardPwdId: number): Promise<void> {
    await this.apiRequest('/v3/keyboardPwd/delete', {
      lockId,
      keyboardPwdId,
    }, 'POST');
  }

  /**
   * Unlock a lock remotely
   */
  async unlockLock(lockId: string): Promise<{ success: boolean }> {
    try {
      await this.apiRequest('/v3/lock/unlock', {
        lockId,
      }, 'POST');
      return { success: true };
    } catch (error) {
      console.error('Failed to unlock:', error);
      throw error;
    }
  }

  /**
   * Send eKey to user's TTLock app
   * This allows them to unlock via the mobile app
   */
  async sendEKey(params: {
    lockId: string;
    receiverUsername: string; // Guest's email
    startDate: number; // Timestamp in milliseconds
    endDate: number; // Timestamp in milliseconds
    remarks?: string;
  }): Promise<{ keyId: number }> {
    const response = await this.apiRequest<{ keyId: number }>(
      '/v3/key/send',
      {
        lockId: params.lockId,
        receiverUsername: params.receiverUsername,
        startDate: params.startDate.toString(),
        endDate: params.endDate.toString(),
        remarks: params.remarks || 'Hotel Room Access',
      },
      'POST'
    );
    return response;
  }

  /**
   * List all locks for the account
   */
  async listLocks(): Promise<any[]> {
    const response = await this.apiRequest<{ list: any[] }>('/v3/lock/list', {
      pageNo: 1,
      pageSize: 100,
    });
    return response.list || [];
  }
}

// Singleton instance
let ttlockClient: TTLockClient | null = null;

/**
 * Get TTLock client instance
 */
export function getTTLockClient(): TTLockClient {
  if (!ttlockClient) {
    const config: TTLockConfig = {
      clientId: process.env.TTLOCK_CLIENT_ID || '',
      clientSecret: process.env.TTLOCK_CLIENT_SECRET || '',
      username: process.env.TTLOCK_USERNAME || '',
      password: process.env.TTLOCK_PASSWORD || '',
      baseUrl: process.env.TTLOCK_BASE_URL || 'https://euapi.ttlock.com',
    };

    // Validate config with detailed error message
    const missing: string[] = [];
    if (!config.clientId) missing.push('TTLOCK_CLIENT_ID');
    if (!config.clientSecret) missing.push('TTLOCK_CLIENT_SECRET');
    if (!config.username) missing.push('TTLOCK_USERNAME');
    if (!config.password) missing.push('TTLOCK_PASSWORD');
    
    if (missing.length > 0) {
      throw new Error(
        `TTLock configuration is incomplete. Missing environment variables: ${missing.join(', ')}\n` +
        `Please add them to your .env file.`
      );
    }

    ttlockClient = new TTLockClient(config);
  }

  return ttlockClient;
}

/**
 * Create a lock key for a booking
 */
export async function createLockKeyForBooking(params: {
  bookingId: string;
  roomId: string;
  lockId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestName: string;
}): Promise<{ pinCode: string; remoteId: string }> {
  const client = getTTLockClient();

  // Adjust times for hotel check-in/out times
  const validFrom = new Date(params.checkInDate);
  validFrom.setHours(14, 0, 0, 0); // 2 PM check-in

  const validTo = new Date(params.checkOutDate);
  validTo.setHours(11, 0, 0, 0); // 11 AM check-out

  console.log('🔐 Creating passcode with params:');
  console.log(`   Lock ID: ${params.lockId}`);
  console.log(`   Valid from: ${validFrom.toISOString()} (${validFrom.getTime()})`);
  console.log(`   Valid to: ${validTo.toISOString()} (${validTo.getTime()})`);
  console.log(`   Guest: ${params.guestName}`);

  const result = await client.createPasscode({
    lockId: params.lockId,
    startDate: validFrom,
    endDate: validTo,
    guestName: params.guestName,
  });

  return {
    pinCode: result.pinCode,
    remoteId: result.keyboardPwdId.toString(),
  };
}

/**
 * Revoke a lock key
 */
export async function revokeLockKey(lockId: string, remoteId: string): Promise<void> {
  const client = getTTLockClient();
  await client.deletePasscode(lockId, parseInt(remoteId, 10));
}
