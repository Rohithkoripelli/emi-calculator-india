// Test different authentication methods with Groww API
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
    
    const results = {
      step1_credentials: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        apiKeyType: apiKey ? (apiKey.startsWith('eyJ') ? 'JWT' : 'Other') : 'None',
        apiKeyLength: apiKey ? apiKey.length : 0
      }
    };

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'Missing credentials',
        results
      });
    }

    // Test 1: Try using JWT token directly (your current approach)
    console.log('=== TEST 1: Direct JWT Token ===');
    const testUrl1 = 'https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=NIFTY';
    
    try {
      const directResponse = await fetch(testUrl1, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-VERSION': '1.0',
          'Accept': 'application/json'
        }
      });
      
      const directText = await directResponse.text();
      let directData;
      try {
        directData = JSON.parse(directText);
      } catch (e) {
        directData = { rawText: directText };
      }
      
      results.test1_direct_jwt = {
        status: directResponse.status,
        success: directResponse.ok,
        data: directData
      };
    } catch (error) {
      results.test1_direct_jwt = {
        error: error.message
      };
    }

    // Test 2: Generate TOTP and get proper access token
    console.log('=== TEST 2: TOTP Authentication ===');
    try {
      const totp = generateTOTP(apiSecret);
      console.log('Generated TOTP:', totp);
      
      // Try to get access token using TOTP
      const authResponse = await fetch('https://api.groww.in/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          totp: totp
        })
      });
      
      const authText = await authResponse.text();
      let authData;
      try {
        authData = JSON.parse(authText);
      } catch (e) {
        authData = { rawText: authText };
      }
      
      results.test2_totp_auth = {
        totp: totp,
        authStatus: authResponse.status,
        authSuccess: authResponse.ok,
        authData: authData
      };
      
      // If we got a new access token, test it
      if (authResponse.ok && authData.access_token) {
        console.log('Got new access token, testing live data...');
        
        const liveDataResponse = await fetch(testUrl1, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.access_token}`,
            'X-API-VERSION': '1.0',
            'Accept': 'application/json'
          }
        });
        
        const liveDataText = await liveDataResponse.text();
        let liveData;
        try {
          liveData = JSON.parse(liveDataText);
        } catch (e) {
          liveData = { rawText: liveDataText };
        }
        
        results.test2_live_data = {
          status: liveDataResponse.status,
          success: liveDataResponse.ok,
          data: liveData
        };
      }
      
    } catch (error) {
      results.test2_totp_auth = {
        error: error.message
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Authentication tests completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};