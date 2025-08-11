/**
 * Groww API Utilities
 * Helper functions for testing and managing Groww API integration
 */

import { GrowwTokenManager } from './growwTokenManager';

export class GrowwApiUtils {
  /**
   * Test the automated token generation system
   */
  static async testTokenGeneration(): Promise<void> {
    try {
      console.log('🧪 Testing Groww API automated token generation...');
      
      const tokenManager = GrowwTokenManager.getInstance();
      
      // Check current token status
      const tokenInfo = tokenManager.getTokenInfo();
      console.log('📊 Current token status:', {
        hasToken: tokenInfo.hasToken,
        isValid: tokenInfo.isValid,
        expiresAt: tokenInfo.expiresAt?.toLocaleString() || 'Unknown'
      });
      
      // Test token generation
      const success = await tokenManager.testTokenGeneration();
      
      if (success) {
        console.log('✅ Token generation test passed!');
        
        // Get the token and display info
        const token = await tokenManager.getAccessToken();
        console.log('🔐 Generated token:', token.substring(0, 100) + '...');
        
        // Test with actual API call
        await this.testApiCall(token);
        
      } else {
        console.error('❌ Token generation test failed');
      }
      
    } catch (error) {
      console.error('❌ Error testing token generation:', error);
      this.displaySetupInstructions();
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

1. Add environment variables to your .env file or Vercel settings:
   
   REACT_APP_GROWW_API_KEY=your_api_key_here
   REACT_APP_GROWW_TOTP_SECRET=your_totp_secret_here

2. Your API Key should look like:
   eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9...

3. Your TOTP Secret should be the base32 string like:
   RIKJ6DLTOKBLXQTQFQPWQJGTPGSPXQNU

4. You can find these in your Groww API dashboard:
   https://groww.in/trade-api/dashboard

5. Test the setup by calling:
   GrowwApiUtils.testTokenGeneration()

📚 Documentation:
   - Python SDK: https://groww.in/trade-api/docs/python-sdk
   - API Docs: https://groww.in/trade-api/docs/curl
`);
  }

  /**
   * Get current token status for debugging
   */
  static async getTokenStatus(): Promise<void> {
    try {
      const tokenManager = GrowwTokenManager.getInstance();
      const tokenInfo = tokenManager.getTokenInfo();
      
      console.log('📊 Groww API Token Status:');
      console.log('  Has Token:', tokenInfo.hasToken ? '✅ Yes' : '❌ No');
      console.log('  Is Valid:', tokenInfo.isValid ? '✅ Valid' : '⚠️ Invalid/Expired');
      console.log('  Expires At:', tokenInfo.expiresAt?.toLocaleString() || 'Unknown');
      
      if (tokenInfo.hasToken && tokenInfo.isValid) {
        const token = await tokenManager.getAccessToken();
        console.log('  Token Preview:', token.substring(0, 50) + '...');
      }
      
    } catch (error) {
      console.error('❌ Error getting token status:', error);
    }
  }

  /**
   * Force refresh the token
   */
  static async refreshToken(): Promise<void> {
    try {
      console.log('🔄 Forcing token refresh...');
      
      const tokenManager = GrowwTokenManager.getInstance();
      tokenManager.clearToken();
      
      const newToken = await tokenManager.getAccessToken();
      console.log('✅ Token refreshed successfully');
      console.log('🔐 New token:', newToken.substring(0, 50) + '...');
      
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
    }
  }

  /**
   * Update backend with fresh token (for your backend API)
   */
  static async updateBackendToken(): Promise<void> {
    try {
      console.log('🔄 Updating backend with fresh token...');
      
      const tokenManager = GrowwTokenManager.getInstance();
      const token = await tokenManager.getAccessToken();
      
      // Send token to your backend endpoint
      const response = await fetch('/api/update-groww-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: token,
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Backend token updated successfully');
      } else {
        console.warn('⚠️ Backend token update failed:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Error updating backend token:', error);
    }
  }

  /**
   * Setup automated token refresh (call this on app startup)
   */
  static setupAutomatedRefresh(): void {
    console.log('⏰ Setting up automated token refresh...');
    
    // Refresh token every 10 hours (tokens expire after 11 hours)
    const refreshInterval = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
    
    setInterval(async () => {
      try {
        console.log('⏰ Automated token refresh triggered');
        await this.refreshToken();
        await this.updateBackendToken();
      } catch (error) {
        console.error('❌ Automated token refresh failed:', error);
      }
    }, refreshInterval);
    
    console.log(`✅ Automated refresh scheduled every ${refreshInterval / (60 * 60 * 1000)} hours`);
  }
}

// Make it available globally for testing in console
if (typeof window !== 'undefined') {
  (window as any).GrowwApiUtils = GrowwApiUtils;
  console.log('🔧 GrowwApiUtils available globally for testing. Try: GrowwApiUtils.testTokenGeneration()');
}

export default GrowwApiUtils;