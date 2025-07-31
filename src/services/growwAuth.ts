// Groww TOTP Authentication Service - No Daily Renewals Required!

interface TOTPAuthResponse {
  access_token: string;
  expires_in?: number;
}

export class GrowwAuthService {
  private static API_KEY = process.env.REACT_APP_GROWW_API_KEY;
  private static API_SECRET = process.env.REACT_APP_GROWW_API_SECRET;
  private static BASE_URL = 'https://api.groww.in/v1';
  
  // Cache for access token to avoid frequent TOTP generation
  private static tokenCache: {
    token: string;
    expiresAt: number;
  } | null = null;

  /**
   * Generate TOTP (Time-based One-Time Password) using API Secret
   * This is a JavaScript implementation of Python's pyotp.TOTP
   */
  private static generateTOTP(secret: string): string {
    // Convert base32 secret to bytes
    const key = this.base32ToBytes(secret);
    
    // Get current time step (30-second intervals)
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    
    // Generate HMAC-SHA1
    const hmac = this.hmacSha1(key, this.intToBytes(timeStep));
    
    // Apply dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const truncated = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);
    
    // Return 6-digit TOTP
    return (truncated % 1000000).toString().padStart(6, '0');
  }

  /**
   * Convert base32 string to bytes
   */
  private static base32ToBytes(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (const char of base32.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }
    
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    
    return bytes;
  }

  /**
   * Convert integer to 8-byte array (big-endian)
   */
  private static intToBytes(num: number): Uint8Array {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xff;
      num >>= 8;
    }
    return bytes;
  }

  /**
   * HMAC-SHA1 implementation
   */
  private static hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
    // Simplified HMAC-SHA1 - in production, use crypto.subtle.sign
    // For now, we'll use a CORS proxy to call a server-side TOTP service
    throw new Error('HMAC-SHA1 requires server-side implementation due to browser crypto limitations');
  }

  /**
   * Get access token using TOTP authentication
   * This method handles the complexity of TOTP generation server-side
   */
  static async getAccessToken(): Promise<string> {
    if (!this.API_KEY || !this.API_SECRET) {
      throw new Error('Groww API Key and Secret are required for TOTP authentication');
    }

    // Check if we have a valid cached token
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      console.log('Using cached Groww access token');
      return this.tokenCache.token;
    }

    try {
      console.log('Generating new Groww access token using TOTP...');
      
      // Use server-side TOTP generation service
      const totpResponse = await this.generateTOTPServerSide();
      
      if (totpResponse.access_token) {
        // Cache the token (assume 12 hours expiry if not specified)
        const expiresIn = totpResponse.expires_in || 12 * 60 * 60; // 12 hours in seconds
        this.tokenCache = {
          token: totpResponse.access_token,
          expiresAt: Date.now() + (expiresIn * 1000)
        };
        
        console.log('✅ Successfully generated Groww access token via TOTP');
        return totpResponse.access_token;
      }
      
      throw new Error('No access token received from TOTP service');
      
    } catch (error) {
      console.error('Failed to generate Groww access token:', error);
      throw error;
    }
  }

  /**
   * Generate TOTP and get access token using server-side service
   * This bypasses browser crypto limitations
   */
  private static async generateTOTPServerSide(): Promise<TOTPAuthResponse> {
    // Use a serverless function or API endpoint to generate TOTP
    const totpServiceUrl = process.env.REACT_APP_TOTP_SERVICE_URL || 
                          'https://your-totp-service.vercel.app/api/groww-totp';
    
    const response = await fetch(totpServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.API_KEY,
        api_secret: this.API_SECRET
      })
    });

    if (!response.ok) {
      throw new Error(`TOTP service error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Alternative: Use simple token rotation system with multiple pre-generated tokens
   * This is for immediate implementation while setting up TOTP service
   */
  static async getAccessTokenWithRotation(): Promise<string> {
    // Use multiple access tokens and rotate them
    const tokens = [
      process.env.REACT_APP_GROWW_TOKEN_1,
      process.env.REACT_APP_GROWW_TOKEN_2,
      process.env.REACT_APP_GROWW_TOKEN_3,
      process.env.REACT_APP_GROWW_TOKEN_4,
      process.env.REACT_APP_GROWW_TOKEN_5
    ].filter(Boolean);

    if (tokens.length === 0) {
      throw new Error('No Groww tokens configured for rotation');
    }

    // Try tokens in order until one works
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (await this.validateToken(token!)) {
        console.log(`✅ Using Groww token ${i + 1}/${tokens.length}`);
        return token!;
      }
    }

    throw new Error('All Groww tokens in rotation are invalid');
  }

  /**
   * Validate if a token is still working
   */
  private static async validateToken(token: string): Promise<boolean> {
    try {
      const testResponse = await fetch('https://api.groww.in/v1/live-data/ltp?segment=CASH&exchange_symbols=NSE_NIFTY', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-VERSION': '1.0',
          'Accept': 'application/json'
        }
      });
      
      return testResponse.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached token (useful for testing)
   */
  static clearTokenCache(): void {
    this.tokenCache = null;
    console.log('Groww token cache cleared');
  }
}