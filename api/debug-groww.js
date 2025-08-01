// Simple debug endpoint to test Groww API directly
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
    
    const debug = {
      step: 1,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      isJWT: apiKey ? apiKey.startsWith('eyJ') : false
    };

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'Missing credentials',
        debug
      });
    }

    // Test JWT token directly if it's a JWT
    let token = apiKey;
    if (apiKey.startsWith('eyJ')) {
      debug.step = 2;
      debug.usingJWT = true;
      debug.message = 'Using JWT token directly as access token';
    } else {
      debug.step = 3;
      debug.usingTOTP = true;
      debug.message = 'Generating TOTP for authentication';
      // Would generate TOTP here but let's keep it simple for debugging
    }

    // Test a simple Groww API call
    debug.step = 4;
    debug.testingEndpoint = 'https://api.groww.in/v1/live-data/quote';
    
    const testParams = new URLSearchParams({
      exchange: 'NSE',
      segment: 'CASH',
      trading_symbol: 'NIFTY'
    });

    const testUrl = `${debug.testingEndpoint}?${testParams.toString()}`;
    debug.finalUrl = testUrl;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-VERSION': '1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'GrowwAPI/1.0'
      }
    });

    debug.step = 5;
    debug.responseStatus = response.status;
    debug.responseOk = response.ok;

    if (response.ok) {
      const data = await response.json();
      debug.step = 6;
      debug.dataReceived = true;
      debug.dataKeys = Object.keys(data);
      
      return res.status(200).json({
        success: true,
        debug,
        sampleResponse: data
      });
    } else {
      const errorText = await response.text();
      debug.step = 7;
      debug.error = errorText;
      
      return res.status(500).json({
        success: false,
        debug,
        error: errorText
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};