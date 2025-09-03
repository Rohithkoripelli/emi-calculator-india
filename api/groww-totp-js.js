/**
 * Groww TOTP Authentication - Pure JavaScript Implementation
 * Implements TOTP generation and official Groww API token generation
 * No Python dependencies - works entirely in Node.js runtime
 */

const crypto = require('crypto');

// TOTP implementation using Node.js crypto
function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const truncated = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
  
  const totp = (truncated % Math.pow(10, digits)).toString().padStart(digits, '0');
  return totp;
}

function base32Decode(encoded) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
    const index = alphabet.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character');
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i < Math.floor(bits.length / 8) * 8; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  
  return Buffer.from(bytes);
}

// Token cache
let tokenCache = {
  token: null,
  expiry: 0
};

// Generate access token using Groww's official authentication method
async function generateGrowwAccessToken() {
  const apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY;
  const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || 
                    process.env.REACT_APP_GROWW_TOTP_SECRET || 
                    process.env.GROWW_API_SECRET;
  
  if (!apiKey || !totpSecret) {
    throw new Error('Missing GROWW_API_KEY or GROWW_TOTP_SECRET environment variables');
  }
  
  console.log('🔐 Generating TOTP token using JavaScript implementation...');
  console.log(`🔧 API Key: ${apiKey.substring(0, 30)}...`);
  console.log(`🔧 TOTP Secret: ${totpSecret.substring(0, 15)}...`);
  
  // Generate TOTP
  const totp = generateTOTP(totpSecret);
  console.log(`🔐 Generated TOTP: ${totp}`);
  
  // Call Groww's official token generation endpoint
  const tokenEndpoint = 'https://api.groww.in/v1/auth/access-token';
  
  const requestBody = {
    api_key: apiKey,
    totp: totp
  };
  
  console.log('🔄 Calling official Groww token endpoint...');
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'GrowwAPI/1.0'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groww token API error ${response.status}: ${errorText}`);
  }
  
  const tokenData = await response.json();
  
  if (tokenData.status === 'SUCCESS' && tokenData.payload && tokenData.payload.access_token) {
    const accessToken = tokenData.payload.access_token;
    console.log(`✅ Official Groww token generation successful!`);
    console.log(`🎟️ Token: ${accessToken.substring(0, 50)}...`);
    
    // Cache the token with 11-hour expiry
    const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
    tokenCache = {
      token: accessToken,
      expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
    };
    
    return accessToken;
  } else {
    throw new Error(`Groww token API returned error: ${JSON.stringify(tokenData)}`);
  }
}

// Get valid access token with priority chain
async function getValidAccessToken() {
  // PRIORITY 1: Manual token (immediate fallback)
  const manualToken = process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN;
  if (manualToken) {
    console.log('✅ Using manual access token (bypassing TOTP generation)');
    return {
      token: manualToken,
      source: 'manual'
    };
  }
  
  // PRIORITY 2: Cached TOTP-generated token
  if (tokenCache.token && Date.now() < tokenCache.expiry) {
    console.log('✅ Using cached TOTP-generated token');
    return {
      token: tokenCache.token,
      source: 'cached'
    };
  }
  
  // PRIORITY 3: Generate new TOTP token
  console.log('🔄 No manual token found - generating new TOTP token...');
  try {
    const token = await generateGrowwAccessToken();
    return {
      token: token,
      source: 'generated'
    };
  } catch (error) {
    console.error('❌ TOTP token generation failed:', error.message);
    throw new Error(`TOTP authentication failed: ${error.message}. Set REACT_APP_GROWW_ACCESS_TOKEN for manual fallback.`);
  }
}

// Main handler
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.method === 'GET' ? req.query : req.body;
    
    switch (action) {
      case 'generate':
        // Force generate new TOTP token
        tokenCache = { token: null, expiry: 0 }; // Clear cache
        const result = await getValidAccessToken();
        return res.status(200).json({ 
          success: true, 
          message: 'Token generated successfully',
          hasToken: !!result.token,
          tokenPreview: result.token ? result.token.substring(0, 50) + '...' : null,
          source: result.source,
          method: 'javascript_totp'
        });
        
      case 'status':
        // Check token status
        const hasManualToken = !!(process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN);
        const hasCachedToken = !!(tokenCache.token && Date.now() < tokenCache.expiry);
        const hasCredentials = !!(process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY) && 
                             !!(process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_TOTP_SECRET);
        
        return res.status(200).json({
          success: true,
          tokenStatus: {
            hasManualToken,
            hasCachedToken,
            hasCredentials,
            cacheExpiry: tokenCache.expiry > 0 ? new Date(tokenCache.expiry).toISOString() : null,
            canGenerate: hasCredentials,
            method: 'javascript_totp'
          }
        });
        
      case 'get':
      default:
        // Get valid token (cached or generate new)
        const tokenResult = await getValidAccessToken();
        return res.status(200).json({ 
          success: true, 
          hasToken: !!tokenResult.token,
          tokenPreview: tokenResult.token ? tokenResult.token.substring(0, 50) + '...' : null,
          source: tokenResult.source,
          method: 'javascript_totp'
        });
    }
    
  } catch (error) {
    console.error('Groww TOTP Token Service Error:', error);
    return res.status(500).json({
      success: false,
      error: 'TOTP token generation failed',
      message: error.message,
      method: 'javascript_totp',
      details: {
        hasApiKey: !!(process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY),
        hasTotpSecret: !!(process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_TOTP_SECRET),
        hasManualToken: !!(process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN),
        availableEnvKeys: Object.keys(process.env).filter(key => key.includes('GROWW'))
      }
    });
  }
};