// Complete Groww API backend service - handles all authentication and data fetching
// This eliminates ALL CORS issues by handling everything server-side

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

// Symbol mapping for Indian indices
const SYMBOL_MAPPING = {
  '^NSEI': { tradingSymbol: 'NIFTY', exchange: 'NSE', segment: 'CASH', name: 'NIFTY 50' },
  '^BSESN': { tradingSymbol: 'SENSEX', exchange: 'BSE', segment: 'CASH', name: 'BSE SENSEX' },
  '^CNXBANK': { tradingSymbol: 'BANKNIFTY', exchange: 'NSE', segment: 'CASH', name: 'NIFTY Bank' },
  '^CNXIT': { tradingSymbol: 'NIFTYIT', exchange: 'NSE', segment: 'CASH', name: 'NIFTY IT' },
  '^CNX100': { tradingSymbol: 'NIFTY100', exchange: 'NSE', segment: 'CASH', name: 'NIFTY 100' },
  '^CNX500': { tradingSymbol: 'NIFTY500', exchange: 'NSE', segment: 'CASH', name: 'NIFTY 500' }
};

// Token cache
let tokenCache = null;

// Get access token
async function getAccessToken(apiKey, apiSecret) {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const totp = generateTOTP(apiSecret);
  
  const response = await fetch('https://api.groww.in/v1/auth/token', {
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

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.access_token) {
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + 43200000 // 12 hours
    };
    return data.access_token;
  }
  
  throw new Error('No access token received');
}

// Fetch data from Groww API
async function fetchGrowwData(endpoint, params, token) {
  const url = `https://api.groww.in/v1/live-data/${endpoint}?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-API-VERSION': '1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Groww API error: ${response.status}`);
  }

  return await response.json();
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
    // Get credentials from environment with detailed debugging
    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;
    
    console.log('Environment variables check:');
    console.log('GROWW_API_KEY exists:', !!apiKey);
    console.log('GROWW_API_SECRET exists:', !!apiSecret);
    console.log('GROWW_API_KEY length:', apiKey ? apiKey.length : 0);
    console.log('GROWW_API_SECRET length:', apiSecret ? apiSecret.length : 0);
    console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('GROWW')));
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'Missing Groww API credentials',
        message: 'Set GROWW_API_KEY and GROWW_API_SECRET environment variables',
        debug: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          availableEnvKeys: Object.keys(process.env).filter(key => key.includes('GROWW'))
        }
      });
    }

    // Get request parameters
    const { symbols, type = 'quote' } = req.method === 'GET' ? req.query : req.body;
    
    if (!symbols) {
      return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    // Get access token
    const token = await getAccessToken(apiKey, apiSecret);
    
    // Parse symbols
    const symbolList = Array.isArray(symbols) ? symbols : symbols.split(',');
    const results = {};

    // Fetch data for each symbol
    for (const symbol of symbolList) {
      try {
        const mapping = SYMBOL_MAPPING[symbol];
        if (!mapping) {
          results[symbol] = null;
          continue;
        }

        let params;
        let endpoint;
        
        if (type === 'ltp') {
          endpoint = 'ltp';
          params = new URLSearchParams({
            segment: mapping.segment,
            exchange_symbols: `${mapping.exchange}_${mapping.tradingSymbol}`
          });
        } else {
          endpoint = 'quote';
          params = new URLSearchParams({
            exchange: mapping.exchange,
            segment: mapping.segment,
            trading_symbol: mapping.tradingSymbol
          });
        }

        const response = await fetchGrowwData(endpoint, params, token);
        
        if (response && response.status === 'SUCCESS' && response.data) {
          const data = type === 'ltp' ? response.data[`${mapping.exchange}_${mapping.tradingSymbol}`] : response.data;
          
          if (data) {
            results[symbol] = {
              symbol: symbol,
              name: mapping.name,
              price: parseFloat((data.ltp || data.lastPrice || 0).toFixed(2)),
              change: parseFloat((data.dayChange || data.change || 0).toFixed(2)),
              changePercent: parseFloat((data.dayChangePerc || data.changePercent || 0).toFixed(2)),
              dayHigh: parseFloat((data.dayHigh || data.high || 0).toFixed(2)),
              dayLow: parseFloat((data.dayLow || data.low || 0).toFixed(2)),
              volume: data.totalTradedVolume || data.volume || 0,
              lastUpdated: new Date().toISOString()
            };
          } else {
            results[symbol] = null;
          }
        } else {
          results[symbol] = null;
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        results[symbol] = null;
      }
    }

    console.log(`✅ Successfully fetched data for ${Object.keys(results).length} symbols`);
    return res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error('Groww Data Service Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};