/**
 * Groww API Token Manager
 * Handles automated token generation using API Key + TOTP
 * Based on Groww API documentation: https://groww.in/trade-api/docs/python-sdk
 */

// Simple TOTP implementation for browser compatibility

/**
 * Simple Base32 decoder for browser compatibility
 */
class SimpleBase32 {
  private static readonly ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  static decode(encoded: string): Uint8Array {
    encoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    const length = encoded.length;
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.floor((length * 5) / 8));
    
    for (let i = 0; i < length; i++) {
      const idx = this.ALPHABET.indexOf(encoded[i]);
      if (idx === -1) continue;
      
      value = (value << 5) | idx;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  }
}

/**
 * Simple HMAC-SHA1 implementation using Web Crypto API
 */
class SimpleHMAC {
  static async sha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  }
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class GrowwTokenManager {
  private static instance: GrowwTokenManager;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly API_BASE = 'https://openapi.groww.in';
  
  // Environment variables for security
  private readonly apiKey: string;
  private readonly totpSecret: string;

  private constructor() {
    this.apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY || '';
    this.totpSecret = process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_TOTP_SECRET || '';
    
    if (!this.apiKey || !this.totpSecret) {
      console.warn('⚠️ Groww API credentials not found. Set REACT_APP_GROWW_API_KEY and REACT_APP_GROWW_TOTP_SECRET for automated tokens');
      console.log('💡 Or set REACT_APP_GROWW_ACCESS_TOKEN for manual tokens');
    } else {
      console.log('✅ Groww API credentials found - will use automated token generation');
    }
    
    console.log('🚀 Initialized automated token manager');
  }

  static getInstance(): GrowwTokenManager {
    if (!GrowwTokenManager.instance) {
      GrowwTokenManager.instance = new GrowwTokenManager();
    }
    return GrowwTokenManager.instance;
  }

  /**
   * Generate TOTP code using the secret (browser-compatible implementation)
   */
  private async generateTOTP(): Promise<string> {
    try {
      if (!this.totpSecret) {
        throw new Error('TOTP secret not configured');
      }
      
      // Decode base32 secret
      const key = SimpleBase32.decode(this.totpSecret);
      
      // Get current time step (30-second intervals)
      const timeStep = Math.floor(Date.now() / 1000 / 30);
      
      // Convert time step to 8-byte array (big-endian)
      const timeBuffer = new ArrayBuffer(8);
      const timeView = new DataView(timeBuffer);
      timeView.setUint32(4, timeStep, false); // big-endian
      
      // Generate HMAC-SHA1
      const hmac = await SimpleHMAC.sha1(key, new Uint8Array(timeBuffer));
      
      // Dynamic truncation
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = ((hmac[offset] & 0x7f) << 24 |
                   (hmac[offset + 1] & 0xff) << 16 |
                   (hmac[offset + 2] & 0xff) << 8 |
                   (hmac[offset + 3] & 0xff)) % 1000000;
      
      const totpCode = code.toString().padStart(6, '0');
      console.log(`🔐 Generated TOTP: ${totpCode}`);
      return totpCode;
    } catch (error) {
      console.error('❌ Error generating TOTP:', error);
      throw error;
    }
  }

  /**
   * Get access token using Railway authentication service
   */
  private async fetchAccessToken(): Promise<string> {
    try {
      console.log('🔄 Requesting access token from Railway auth service...');
      
      const authServiceUrl = process.env.NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL || 
                            'https://emi-calculator-india-production.up.railway.app';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${authServiceUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Railway auth service error (${response.status}):`, errorText);
        throw new Error(`Failed to get access token from Railway: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Railway token generation failed');
      }

      if (!data.access_token) {
        throw new Error('No access token in Railway response');
      }

      console.log('✅ Successfully obtained access token from Railway auth service');
      console.log('🎉 Using automated TOTP + Groww SDK authentication');
      console.log(`⏰ Token expires at: ${data.expires_at}`);
      
      // Set expiry time based on Railway response
      if (data.expires_at) {
        this.tokenExpiry = new Date(data.expires_at).getTime();
      } else {
        // Default to 11 hours
        this.tokenExpiry = Date.now() + (11 * 60 * 60 * 1000);
      }
      
      return data.access_token;
      
    } catch (error) {
      console.error('❌ Error fetching Groww access token from Railway:', error);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if needed
   */
  async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) { // 5 min buffer
        console.log('✅ Using existing valid Groww token');
        return this.accessToken;
      }

      // Token expired or doesn't exist, get a new one
      if (this.accessToken) {
        console.log('🔄 Groww token expired, refreshing...');
      } else {
        console.log('🆕 No Groww token found, generating new one...');
      }

      this.accessToken = await this.fetchAccessToken();
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to get Groww access token:', error);
      
      // If we have an old token, try using it as fallback
      if (this.accessToken) {
        console.warn('⚠️ Using potentially expired token as fallback');
        return this.accessToken;
      }
      
      throw error;
    }
  }

  /**
   * Clear stored token (useful for testing or error recovery)
   */
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
    console.log('🗑️ Cleared stored Groww token');
  }

  /**
   * Check if token is valid and not expired
   */
  isTokenValid(): boolean {
    return !!(this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000);
  }

  /**
   * Get token expiry info for debugging
   */
  getTokenInfo(): { hasToken: boolean; expiresAt: Date | null; isValid: boolean } {
    return {
      hasToken: !!this.accessToken,
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry) : null,
      isValid: this.isTokenValid()
    };
  }

  /**
   * Test the Railway authentication service
   */
  async testTokenGeneration(): Promise<boolean> {
    try {
      console.log('🧪 Testing Railway Groww authentication service...');
      
      const authServiceUrl = process.env.NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL || 
                            'https://emi-calculator-india-production.up.railway.app';
      
      // Test service status
      const statusResponse = await fetch(`${authServiceUrl}/auth/status`);
      
      if (!statusResponse.ok) {
        console.error('❌ Railway auth service not available');
        return false;
      }
      
      const status = await statusResponse.json();
      console.log('📊 Railway auth service status:', status);
      
      if (!status.success || !status.status.configured) {
        console.error('❌ Railway service not configured properly');
        return false;
      }
      
      // Try to get an access token from Railway
      const token = await this.getAccessToken();
      console.log(`✅ Railway authentication working: ${token.substring(0, 20)}...`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Railway token generation test failed:', error);
      return false;
    }
  }
}

export default GrowwTokenManager;