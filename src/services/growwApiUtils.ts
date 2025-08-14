/**
 * Groww API Utilities - Enhanced token management and status monitoring
 * Provides comprehensive token status tracking and user guidance
 */

interface TokenStatus {
  hasManualToken: boolean;
  hasCachedToken: boolean;
  hasCredentials: boolean;
  cacheExpiry: string | null;
  canGenerate: boolean;
}

interface TokenResponse {
  success: boolean;
  tokenStatus?: TokenStatus;
  hasToken?: boolean;
  tokenPreview?: string;
  source?: 'manual' | 'automated';
  error?: string;
  message?: string;
}

export class GrowwApiUtils {
  private static refreshInterval: NodeJS.Timeout | null = null;

  /**
   * Check the current status of Groww API tokens via backend
   */
  static async checkTokenStatus(): Promise<TokenStatus | null> {
    try {
      const response = await fetch('/api/groww-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'status'
        })
      });

      if (!response.ok) {
        console.error('❌ Failed to check token status:', response.status);
        return null;
      }

      const data: TokenResponse = await response.json();
      return data.tokenStatus || null;

    } catch (error) {
      console.error('❌ Error checking token status:', error);
      return null;
    }
  }

  /**
   * Test the complete token generation system
   */
  static async testTokenGeneration(): Promise<boolean> {
    try {
      console.log('🧪 Testing Groww API token system...');
      
      // Check status first
      const status = await this.checkTokenStatus();
      if (!status) {
        console.error('❌ Unable to check token status');
        return false;
      }

      console.log('📊 Token Status:', {
        hasManualToken: status.hasManualToken,
        hasCredentials: status.hasCredentials,
        canGenerate: status.canGenerate
      });

      // Try to get a token via backend
      const response = await fetch('/api/groww-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get'
        })
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        if (data.success && data.hasToken) {
          console.log(`✅ Token system working (${data.source} source)`);
          return true;
        }
      }

      // Provide guidance based on status
      if (!status.hasManualToken && !status.hasCredentials) {
        console.warn('⚠️ No Groww API credentials configured');
        this.displaySetupInstructions();
      } else if (status.hasCredentials && !status.canGenerate) {
        console.warn('⚠️ Automated token generation configured but not working');
        console.log('💡 This is expected - Groww uses proprietary authentication endpoints');
        console.log('💡 Recommended: Use manual token management instead');
        this.displaySetupInstructions();
      }

      return false;

    } catch (error) {
      console.error('❌ Token generation test failed:', error);
      this.displaySetupInstructions();
      return false;
    }
  }

  /**
   * Test an actual API call with the generated token
   */
  private static async testApiCall(token: string): Promise<void> {
    try {
      console.log('🌐 Testing API call with generated token...');
      
      // Test with a simple API call (user profile or similar)
      const response = await fetch('https://openapi.groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/CASH/latest_ohlc/TCS', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'GrowwAPI/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful! Sample data:', data);
      } else {
        console.warn(`⚠️ API call returned ${response.status}:`, await response.text());
      }
      
    } catch (error) {
      console.error('❌ API call test failed:', error);
    }
  }

  /**
   * Display setup instructions for the user
   */
  static displaySetupInstructions(): void {
    console.log(`
🔧 GROWW API SETUP INSTRUCTIONS:

🎯 RECOMMENDED APPROACH (Manual Token Management):
1. Visit: https://groww.in/user/profile/trading-apis
2. Generate a new access token (valid for 24 hours)
3. Add to Vercel environment variables:
   REACT_APP_GROWW_ACCESS_TOKEN=your_access_token_here
4. Set daily reminder to renew token at 6 AM IST

🔬 ALTERNATIVE APPROACH (Automated - Limited):
1. Add to Vercel environment variables:
   REACT_APP_GROWW_API_KEY=your_api_key_here
   REACT_APP_GROWW_TOTP_SECRET=your_totp_secret_here
   
2. Note: Automated approach has limitations due to proprietary endpoints

⚠️  IMPORTANT:
- Python SDK works because it uses internal Groww endpoints
- Public authentication endpoints are not available
- Manual token management is the most reliable approach

📚 Resources:
   - Get credentials: https://groww.in/user/profile/trading-apis
   - Setup guide: ./GROWW_API_SETUP.md
   - Python SDK: https://groww.in/trade-api/docs/python-sdk
`);
  }

  /**
   * Get current token status for debugging via backend API
   */
  static async getTokenStatus(): Promise<void> {
    try {
      const status = await this.checkTokenStatus();
      
      if (!status) {
        console.log('❌ Unable to check token status');
        return;
      }
      
      console.log('📊 Groww API Token Status:');
      console.log('  Has Manual Token:', status.hasManualToken ? '✅ Yes' : '❌ No');
      console.log('  Has Cached Token:', status.hasCachedToken ? '✅ Yes' : '❌ No');
      console.log('  Has Credentials:', status.hasCredentials ? '✅ Yes' : '❌ No');
      console.log('  Can Generate:', status.canGenerate ? '✅ Yes' : '❌ No');
      console.log('  Cache Expiry:', status.cacheExpiry || 'None');
      
      // Try to get token info
      const response = await fetch('/api/groww-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get' })
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        if (data.success && data.hasToken) {
          console.log('  Token Available:', '✅ Yes');
          console.log('  Token Source:', data.source || 'Unknown');
          console.log('  Token Preview:', data.tokenPreview || 'Hidden');
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting token status:', error);
    }
  }

  /**
   * Force refresh the token via backend
   */
  static async refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 Forcing token refresh via backend...');
      
      const response = await fetch('/api/groww-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate' })
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        if (data.success) {
          console.log('✅ Token refreshed successfully');
          return true;
        }
      }

      console.error('❌ Token refresh failed');
      return false;
      
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Setup automated token monitoring (call this on app startup)
   */
  static setupAutomatedRefresh(): void {
    console.log('⏰ Setting up Groww token monitoring...');
    
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check token status every hour and provide guidance
    this.refreshInterval = setInterval(async () => {
      try {
        const status = await this.checkTokenStatus();
        
        if (!status) {
          console.warn('⚠️ Unable to check Groww token status');
          return;
        }

        if (!status.hasManualToken && !status.hasCachedToken) {
          console.warn('⚠️ No Groww access token available');
          console.log('💡 Please set REACT_APP_GROWW_ACCESS_TOKEN');
          console.log('🔗 Get token at: https://groww.in/user/profile/trading-apis');
        } else {
          console.log('✅ Groww token status: OK');
        }

      } catch (error) {
        console.error('❌ Error in token monitoring:', error);
      }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log('✅ Token monitoring scheduled (checks every hour)');
  }

  /**
   * Clear automated monitoring
   */
  static clearAutomatedRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('🛑 Stopped Groww token monitoring');
    }
  }
}

// Make it available globally for testing in console
if (typeof window !== 'undefined') {
  (window as any).GrowwApiUtils = GrowwApiUtils;
  console.log('🔧 GrowwApiUtils available globally for testing. Try: GrowwApiUtils.testTokenGeneration()');
}

export default GrowwApiUtils;