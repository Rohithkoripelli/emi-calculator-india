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
    const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_API_SECRET;
    
    if (!apiKey || !totpSecret) {
      throw new Error('Missing GROWW_API_KEY or GROWW_API_SECRET environment variables');
    }
    
    console.log('🔐 Generating access token using proven TOTP method...');
    console.log(`🔧 Using API Key: ${apiKey.substring(0, 30)}...`);
    console.log(`🔧 Using TOTP Secret: ${totpSecret.substring(0, 15)}...`);
    
    // Generate TOTP using the same method that worked in testing
    const totp = generateTOTP(totpSecret);
    console.log(`🔐 Generated TOTP: ${totp}`);
    
    // Use the OFFICIAL Groww Python SDK (the only supported method)
    // This is the proven approach that works with the official API
    console.log('🔄 Calling official GrowwAPI.get_access_token() via Python SDK...');
    
    const pythonScript = `
import sys
import os

# Debug: Check environment and dependencies
print(f"🐍 Python version: {sys.version}", file=sys.stderr)
print(f"🐍 Python path: {sys.path}", file=sys.stderr)
print(f"🐍 Environment: Vercel serverless", file=sys.stderr)

try:
    import pyotp
    print("✅ pyotp imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ pyotp import failed: {str(e)}", file=sys.stderr)
    print("❌ Try: pip install pyotp>=2.6.0", file=sys.stderr)
    sys.exit(1)

try:
    from growwapi import GrowwAPI
    print("✅ growwapi imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ growwapi import failed: {str(e)}", file=sys.stderr)
    print("❌ Try: pip install growwapi==0.0.8", file=sys.stderr)
    sys.exit(1)

try:
    # Official Groww SDK authentication flow
    api_key = "${apiKey}"
    api_secret = "${totpSecret}"
    
    print(f"🔐 API Key length: {len(api_key)} chars", file=sys.stderr)
    print(f"🔐 API Secret length: {len(api_secret)} chars", file=sys.stderr)
    
    # Generate TOTP using official pyotp library
    totp_gen = pyotp.TOTP(api_secret)
    totp = totp_gen.now()
    
    print(f"🔐 Generated TOTP: {totp}", file=sys.stderr)
    
    # Use official Groww SDK method - the ONLY supported way
    print("🔄 Calling GrowwAPI.get_access_token()...", file=sys.stderr)
    access_token = GrowwAPI.get_access_token(api_key, totp)
    
    if access_token:
        print(f"✅ Token received: {len(access_token)} chars", file=sys.stderr)
        print(access_token)
        sys.exit(0)
    else:
        print("ERROR: No access token returned from official SDK", file=sys.stderr)
        sys.exit(1)
        
except Exception as e:
    print(f"ERROR: Official SDK authentication failed - {str(e)}", file=sys.stderr)
    print(f"ERROR: Exception type: {type(e).__name__}", file=sys.stderr)
    sys.exit(1)
`;
    
    // Execute official Python SDK via child process
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
        console.log('🐍 Python SDK:', data.toString().trim());
      });
      
      python.on('close', (code) => {
        if (code === 0 && accessToken) {
          console.log('✅ Official Groww SDK authentication successful!');
          console.log(`🎟️ Token: ${accessToken.substring(0, 50)}...`);
          
          // Cache the token with 11-hour expiry (official Groww token duration)
          const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
          tokenCache = {
            token: accessToken,
            expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
          };
          
          resolve(accessToken);
        } else {
          console.error('❌ Official Groww SDK authentication failed');
          console.error('❌ Error details:', errorOutput);
          reject(new Error(`Official SDK authentication failed: ${errorOutput}`));
        }
      });
      
      python.on('error', (error) => {
        console.error('❌ Python process error:', error);
        reject(new Error(`Python process failed: ${error.message}`));
      });
    });
    
  } catch (error) {
    console.error('❌ Error generating access token:', error);
    throw error;
  }
}

// Get valid access token (from cache or generate new)
async function getValidAccessToken() {
  // PRIORITY 1: Check for manual token first (immediate fallback)
  const manualToken = process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN;
  if (manualToken) {
    console.log('✅ Using manual access token (bypassing Python SDK)');
    return manualToken;
  }
  
  // PRIORITY 2: Check cached automated token
  if (tokenCache.token && Date.now() < tokenCache.expiry) {
    console.log('✅ Using cached automated token');
    return tokenCache.token;
  }
  
  // PRIORITY 3: Try to generate new token via Python SDK
  console.log('🔄 Attempting automated token generation via Python SDK...');
  try {
    return await generateAccessToken();
  } catch (error) {
    console.error('❌ Python SDK token generation failed:', error.message);
    
    // FINAL FALLBACK: Return null to trigger API fallback chain
    console.log('💡 Set REACT_APP_GROWW_ACCESS_TOKEN for manual token bypass');
    throw new Error(`Python SDK failed: ${error.message}. Set manual token as fallback.`);
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