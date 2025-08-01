// Comprehensive TOTP endpoint discovery
const crypto = require('crypto');

// TOTP implementation
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Missing API credentials' });
    }

    const totp = generateTOTP(apiSecret);
    console.log('Generated TOTP:', totp);

    // Test multiple possible endpoint combinations
    const baseUrls = [
      'https://api.groww.in',
      'https://groww.in/api',
      'https://trade-api.groww.in',
      'https://backend.groww.in',
      'https://auth.groww.in',
      'https://trading.groww.in'
    ];

    const paths = [
      '/v1/auth/token',
      '/v1/auth/access-token',
      '/v1/trading/auth/token',
      '/v1/login',
      '/auth/token',
      '/api/v1/auth/token',
      '/v1/auth/login',
      '/v1/user/auth/token'
    ];

    const parameterFormats = [
      { api_key: apiKey, totp: totp },
      { apiKey: apiKey, totp: totp },
      { username: apiKey, password: totp },
      { key: apiKey, otp: totp },
      { client_id: apiKey, totp_code: totp }
    ];

    const results = [];
    let workingEndpoint = null;

    // Test all combinations
    for (const baseUrl of baseUrls) {
      for (const path of paths) {
        for (let i = 0; i < parameterFormats.length; i++) {
          try {
            const endpoint = `${baseUrl}${path}`;
            const params = parameterFormats[i];
            
            console.log(`Testing: ${endpoint} with params format ${i + 1}`);
            
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-VERSION': '1.0',
                'User-Agent': 'GrowwAPI/1.0'
              },
              body: JSON.stringify(params)
            });

            const text = await response.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              data = { rawText: text.substring(0, 200) + '...' };
            }

            const result = {
              endpoint,
              paramsFormat: i + 1,
              status: response.status,
              success: response.ok,
              data: data
            };

            // Only save non-404 responses
            if (response.status !== 404) {
              results.push(result);
              
              // If we got a successful response with an access token
              if (response.ok && data.access_token) {
                workingEndpoint = result;
                console.log(`✅ FOUND WORKING ENDPOINT: ${endpoint}`);
                break;
              }
            }

          } catch (error) {
            // Ignore network errors, continue testing
          }
        }
        
        if (workingEndpoint) break;
      }
      
      if (workingEndpoint) break;
    }

    return res.status(200).json({
      success: !!workingEndpoint,
      message: workingEndpoint ? 'Found working endpoint!' : 'No working endpoint discovered',
      workingEndpoint,
      allNon404Results: results,
      totalTested: baseUrls.length * paths.length * parameterFormats.length,
      totp: totp,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};