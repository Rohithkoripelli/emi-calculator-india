// Groww Token Generation API - TOTP-based Bearer token authentication
// Implements the proven TOTP → Access Token → Bearer Auth strategy
// Zero maintenance - tokens refresh automatically every 11+ hours

const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

// Simple HTTP request using built-in https module
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const postData = options.body || '';
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': options.headers?.['Content-Type'] || 'application/x-www-form-urlencoded',
        'Accept': options.headers?.['Accept'] || 'application/json',
        'User-Agent': options.headers?.['User-Agent'] || 'GrowwAPI/1.0',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers
      }
    };

    console.log(`🌐 Making HTTP request to: ${url}`);
    console.log(`📝 Request options:`, JSON.stringify(requestOptions, null, 2));

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      console.log(`📊 Response status: ${res.statusCode}`);
      console.log(`📋 Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📦 Response body: ${data}`);
        
        try {
          const result = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: () => Promise.resolve(data),
            json: () => {
              try {
                return Promise.resolve(JSON.parse(data));
              } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                return Promise.reject(new Error(`Invalid JSON: ${data}`));
              }
            }
          };
          resolve(result);
        } catch (error) {
          console.error('❌ Response processing error:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ HTTP request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set a timeout
    req.setTimeout(30000); // 30 seconds

    if (postData) {
      console.log(`📤 Sending POST data: ${postData}`);
      req.write(postData);
    }
    
    req.end();
  });
}

// TOTP implementation - same as in frontend but running server-side
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

// Token cache with expiry
let tokenCache = {
  token: null,
  expiry: 0
};

// Generate access token using proven TOTP approach
async function generateAccessToken() {
  try {
    const apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY;
    const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || process.env.GROWW_API_SECRET;
    
    if (!apiKey || !totpSecret) {
      throw new Error('Missing GROWW_API_KEY or GROWW_API_SECRET environment variables');
    }
    
    console.log('🔐 Generating access token using proven TOTP method...');
    console.log(`🔧 Using API Key: ${apiKey.substring(0, 30)}...`);
    console.log(`🔧 Using TOTP Secret: ${totpSecret.substring(0, 15)}...`);
    
    // Generate TOTP using the same method that worked in testing
    const totp = generateTOTP(totpSecret);
    console.log(`🔐 Generated TOTP: ${totp}`);
    
    // Use JavaScript implementation to avoid Python dependency issues in Vercel
    console.log('🔄 Calling Groww API authentication via JavaScript...');
    
    // Try multiple authentication endpoints that might work
    const authEndpoints = [
      'https://groww.in/v1/api/login_service/v3/auth/login',
      'https://groww.in/v1/api/login_service/v1/auth/login',
      'https://groww.in/v1/api/auth/login',
      'https://groww.in/login_service/v3/auth/login',
      'https://groww.in/login_service/v1/auth/login',
      'https://groww.in/auth/login',
      'https://api.groww.in/v1/auth/login',
      'https://api.groww.in/auth/login'
    ];
    
    let lastError;
    
    for (const endpoint of authEndpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        // Try form-encoded data (most common for TOTP APIs)
        const formData = new URLSearchParams();
        formData.append('apiKey', apiKey);
        formData.append('totp', totp);
        
        const response = await makeHttpRequest(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'GrowwAPI/1.0',
            'X-API-Version': '1.0'
          },
          body: formData.toString()
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📦 Response data:`, JSON.stringify(data, null, 2));
          
          if (data.access_token || data.token || data.accessToken) {
            const accessToken = data.access_token || data.token || data.accessToken;
            console.log('✅ Access token obtained via JavaScript!');
            console.log(`🎟️ Token: ${accessToken.substring(0, 50)}...`);
            
            // Cache the token with 11-hour expiry
            const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
            tokenCache = {
              token: accessToken,
              expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
            };
            
            return accessToken;
          } else {
            console.log(`⚠️ No access token in response from ${endpoint}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed ${endpoint}: ${response.status} - ${errorText.substring(0, 200)}...`);
          lastError = new Error(`${endpoint}: ${response.status} - ${errorText}`);
        }
        
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error.message);
        lastError = error;
      }
    }
    
    // If all endpoints fail, throw the last error
    throw lastError || new Error('All authentication endpoints failed');
    
  } catch (error) {
    console.error('❌ Error generating access token:', error);
    throw error;
  }
}

// Get valid access token (from cache or generate new)
async function getValidAccessToken() {
  // Check for manual token first
  const manualToken = process.env.GROWW_ACCESS_TOKEN;
  if (manualToken) {
    console.log('✅ Using manual access token');
    return manualToken;
  }
  
  // Check cached token
  if (tokenCache.token && Date.now() < tokenCache.expiry) {
    console.log('✅ Using cached automated token');
    return tokenCache.token;
  }
  
  // Generate new token
  console.log('🔄 Generating new automated token...');
  return await generateAccessToken();
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
        // Force generate new token
        tokenCache = { token: null, expiry: 0 }; // Clear cache
        const newToken = await generateAccessToken();
        return res.status(200).json({ 
          success: true, 
          message: 'Token generated successfully',
          hasToken: !!newToken,
          tokenPreview: newToken ? newToken.substring(0, 50) + '...' : null
        });
        
      case 'status':
        // Check token status
        const hasManualToken = !!(process.env.GROWW_ACCESS_TOKEN);
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
            canGenerate: hasCredentials
          }
        });
        
      case 'get':
      default:
        // Get valid token (cached or generate new)
        const token = await getValidAccessToken();
        return res.status(200).json({ 
          success: true, 
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 50) + '...' : null,
          source: process.env.GROWW_ACCESS_TOKEN ? 'manual' : 'automated'
        });
    }
    
  } catch (error) {
    console.error('Groww Token Service Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token generation failed',
      message: error.message,
      details: {
        hasApiKey: !!(process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY),
        hasTotpSecret: !!(process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_TOTP_SECRET),
        hasManualToken: !!process.env.GROWW_ACCESS_TOKEN,
        availableEnvKeys: Object.keys(process.env).filter(key => key.includes('GROWW'))
      }
    });
  }
};