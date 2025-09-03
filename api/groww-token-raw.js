/**
 * Internal Token Retrieval Service
 * Provides raw access token to other internal services
 * Security: Only accessible from internal services
 */

// Import the token cache from groww-token.js
// We'll share the same cache to avoid duplicate token generation

// Token cache (shared with groww-token.js)
let tokenCache = {
  token: null,
  expiry: 0
};

// Get cached token or generate new one
async function getCachedOrNewToken() {
  // Check cached token
  if (tokenCache.token && Date.now() < tokenCache.expiry) {
    console.log('✅ Using cached Bearer token');
    return tokenCache.token;
  }
  
  // Generate new token by calling our proven service
  try {
    const response = await fetch('/api/groww-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ New Bearer token generated');
      // The token is now cached in the main service
      // We need to extract it - for now, we'll use a direct approach
      
      // Since we can't easily share the token cache between files in Vercel,
      // we'll generate it directly here using the same method
      return await generateTokenDirect();
    } else {
      throw new Error('Token generation service failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to get token from service:', error);
    throw error;
  }
}

// Generate token directly using the same proven method
async function generateTokenDirect() {
  const apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY;
  const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || process.env.GROWW_API_SECRET;
  
  if (!apiKey || !totpSecret) {
    throw new Error('Missing Groww API credentials');
  }
  
  // Python script to generate token (same as in groww-token.js)
  const pythonScript = `
import sys
import pyotp
from growwapi import GrowwAPI

try:
    api_key = "${apiKey}"
    api_secret = "${totpSecret}"
    
    # Generate TOTP
    totp_gen = pyotp.TOTP(api_secret)
    totp = totp_gen.now()
    
    # Get access token using the proven SDK method
    access_token = GrowwAPI.get_access_token(api_key, totp)
    
    if access_token:
        print(access_token)
        sys.exit(0)
    else:
        print("ERROR: No access token returned", file=sys.stderr)
        sys.exit(1)
        
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
  
  // Execute Python script
  const { spawn } = require('child_process');
  const python = spawn('python3', ['-c', pythonScript]);
  
  let accessToken = '';
  let errorOutput = '';
  
  return new Promise((resolve, reject) => {
    python.stdout.on('data', (data) => {
      accessToken += data.toString().trim();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && accessToken) {
        console.log('✅ Direct token generation successful');
        
        // Cache the token
        const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
        tokenCache = {
          token: accessToken,
          expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
        };
        
        resolve(accessToken);
      } else {
        console.error('❌ Direct token generation failed:', errorOutput);
        reject(new Error(`Token generation failed: ${errorOutput}`));
      }
    });
    
    python.on('error', (error) => {
      console.error('❌ Python process error:', error);
      reject(error);
    });
  });
}

// Main handler
module.exports = async function handler(req, res) {
  // Security check - only allow internal service calls
  const authHeader = req.headers.authorization;
  if (authHeader !== 'internal-service') {
    return res.status(401).json({
      error: 'Unauthorized - Internal service only'
    });
  }
  
  try {
    const token = await getCachedOrNewToken();
    
    return res.status(200).json({
      success: true,
      token: token,
      cached: tokenCache.token ? Date.now() < tokenCache.expiry : false,
      expiresAt: new Date(tokenCache.expiry).toISOString()
    });
    
  } catch (error) {
    console.error('❌ Token retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token retrieval failed',
      message: error.message
    });
  }
};