/**
 * Groww Authentication Client
 * Client service to interact with the Railway-deployed Groww Authentication Service
 * Replaces the previous backend API calls with calls to the dedicated Python service
 */

interface AuthServiceResponse {
  success: boolean;
  access_token?: string;
  expires_at?: string;
  error?: string;
  message?: string;
}

interface AuthServiceStatus {
  success: boolean;
  status?: {
    configured: boolean;
    has_token: boolean;
    token_expires_at: string | null;
    is_token_valid: boolean;
  };
  error?: string;
}

export class GrowwAuthClient {
  private static instance: GrowwAuthClient;
  private authServiceUrl: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private constructor() {
    // Use environment variable for auth service URL
    // In production, this will be your Railway deployment URL
    this.authServiceUrl = process.env.REACT_APP_GROWW_AUTH_SERVICE_URL || 
                         process.env.NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL || 
                         'http://localhost:8080';
    
    console.log(`🔧 Groww Auth Client initialized with service URL: ${this.authServiceUrl}`);
  }

  static getInstance(): GrowwAuthClient {
    if (!GrowwAuthClient.instance) {
      GrowwAuthClient.instance = new GrowwAuthClient();
    }
    return GrowwAuthClient.instance;
  }

  /**
   * Get access token from the authentication service
   */
  async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.cachedToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        console.log('✅ Using cached valid access token');
        return this.cachedToken;
      }

      console.log('🔄 Fetching new access token from authentication service...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.authServiceUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth service error (${response.status}): ${errorText}`);
      }

      const data: AuthServiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get access token from auth service');
      }

      if (!data.access_token) {
        throw new Error('No access token returned from auth service');
      }

      // Cache the token
      this.cachedToken = data.access_token;
      
      // Set expiry (with 5-minute buffer)
      if (data.expires_at) {
        this.tokenExpiresAt = new Date(new Date(data.expires_at).getTime() - 5 * 60 * 1000);
      } else {
        // Default to 11 hours from now if no expiry provided
        this.tokenExpiresAt = new Date(Date.now() + 11 * 60 * 60 * 1000 - 5 * 60 * 1000);
      }

      console.log(`✅ Successfully obtained access token from auth service`);
      console.log(`📅 Token expires at: ${this.tokenExpiresAt.toISOString()}`);

      return this.cachedToken;

    } catch (error) {
      console.error('❌ Error getting access token from auth service:', error);
      
      // If we have a cached token, try using it as fallback
      if (this.cachedToken) {
        console.warn('⚠️ Using potentially expired token as fallback');
        return this.cachedToken;
      }
      
      throw error;
    }
  }

  /**
   * Check the status of the authentication service
   */
  async getServiceStatus(): Promise<AuthServiceStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.authServiceUrl}/auth/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data: AuthServiceStatus = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Error checking auth service status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test the authentication service
   */
  async testService(): Promise<boolean> {
    try {
      console.log('🧪 Testing authentication service...');

      // Test health check first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const healthResponse = await fetch(`${this.authServiceUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!healthResponse.ok) {
        console.error('❌ Auth service health check failed');
        return false;
      }

      // Test status endpoint
      const statusResult = await this.getServiceStatus();
      if (!statusResult.success) {
        console.error('❌ Auth service status check failed');
        return false;
      }

      console.log('📊 Auth service status:', statusResult.status);

      // If service is configured, try to get a token
      if (statusResult.status?.configured) {
        try {
          const token = await this.getAccessToken();
          console.log('✅ Auth service test successful - token obtained');
          return true;
        } catch (error) {
          console.warn('⚠️ Auth service is configured but token fetch failed:', error);
          return false;
        }
      } else {
        console.warn('⚠️ Auth service is running but not configured (missing API credentials)');
        return false;
      }

    } catch (error) {
      console.error('❌ Auth service test failed:', error);
      return false;
    }
  }

  /**
   * Clear cached token (useful for testing or error recovery)
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = null;
    console.log('🗑️ Cleared cached access token');
  }

  /**
   * Check if we have a valid cached token
   */
  hasValidToken(): boolean {
    return !!(this.cachedToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt);
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(): { 
    hasToken: boolean; 
    expiresAt: string | null; 
    isValid: boolean;
    serviceUrl: string;
  } {
    return {
      hasToken: !!this.cachedToken,
      expiresAt: this.tokenExpiresAt ? this.tokenExpiresAt.toISOString() : null,
      isValid: this.hasValidToken(),
      serviceUrl: this.authServiceUrl
    };
  }

  /**
   * Set a custom auth service URL (useful for testing different environments)
   */
  setAuthServiceUrl(url: string): void {
    this.authServiceUrl = url;
    this.clearCache(); // Clear cache when changing service URL
    console.log(`🔧 Auth service URL updated to: ${url}`);
  }
}

export default GrowwAuthClient;