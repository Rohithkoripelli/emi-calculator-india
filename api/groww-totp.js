// Serverless function to generate Groww TOTP and access token
// Deploy this to Vercel to handle TOTP authentication server-side

const crypto = require('crypto');

// TOTP implementation for server-side
function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  // Convert base32 secret to buffer
  const key = base32Decode(secret);
  
  // Create counter buffer (8 bytes, big-endian)
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);
  
  // Generate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const truncated = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
  
  // Generate final TOTP
  const totp = (truncated % Math.pow(10, digits)).toString().padStart(digits, '0');
  return totp;
}

// Base32 decoder
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

// Main API handler
module.exports = async function handler(req, res) {
  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { api_key, api_secret } = req.body;
    
    if (!api_key || !api_secret) {
      return res.status(400).json({ 
        error: 'Missing api_key or api_secret' 
      });
    }
    
    // Generate TOTP
    const totp = generateTOTP(api_secret);
    console.log(`Generated TOTP: ${totp} for API Key: ${api_key.substring(0, 8)}...`);
    
    // Call Groww API to get access token
    const growwResponse = await fetch('https://api.groww.in/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        api_key: api_key,
        totp: totp
      })
    });
    
    if (!growwResponse.ok) {
      const errorText = await growwResponse.text();
      console.error('Groww API Error:', errorText);
      return res.status(growwResponse.status).json({ 
        error: `Groww API Error: ${growwResponse.status}`,
        details: errorText
      });
    }
    
    const tokenData = await growwResponse.json();
    
    if (tokenData.access_token) {
      console.log('✅ Successfully generated Groww access token');
      return res.status(200).json({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in || 43200, // 12 hours default
        generated_at: new Date().toISOString()
      });
    } else {
      return res.status(400).json({ 
        error: 'No access token in Groww response',
        response: tokenData
      });
    }
    
  } catch (error) {
    console.error('TOTP Service Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}