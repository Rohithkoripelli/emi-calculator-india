/**
 * Groww Data API with Bearer Token Authentication
 * Uses proven TOTP → Access Token → Bearer Auth strategy
 * Implements official Groww API endpoints that were successfully tested
 */

// Token cache (shared with groww-token.js)
let tokenCache = {
  token: null,
  expiry: 0
};

// TOTP generation functions (same as in groww-token.js)
function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);
  
  const crypto = require('crypto');
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

// Generate access token directly using TOTP
async function generateAccessTokenDirect() {
  const apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY;
  const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || process.env.GROWW_API_SECRET;
  
  if (!apiKey || !totpSecret) {
    throw new Error('Missing Groww API credentials');
  }
  
  // Generate TOTP using JavaScript (same as in groww-token.js)
  const totp = generateTOTP(totpSecret);
  console.log(`🔐 Generated TOTP: ${totp}`);
  
  // JavaScript implementation to avoid Python dependencies
  const authEndpoints = [
    'https://groww.in/v1/api/login_service/v3/auth/login',
    'https://groww.in/v1/api/login_service/v1/auth/login',
    'https://groww.in/v1/api/auth/login',
    'https://api.groww.in/v1/auth/login'
  ];
  
  for (const endpoint of authEndpoints) {
    try {
      console.log(`🔄 Trying auth endpoint: ${endpoint}`);
      
      const https = require('https');
      const { URL } = require('url');
      const parsedUrl = new URL(endpoint);
      
      const formData = `apiKey=${encodeURIComponent(apiKey)}&totp=${encodeURIComponent(totp)}`;
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'GrowwAPI/1.0',
            'Content-Length': Buffer.byteLength(formData)
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data)
            });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timeout')));
        req.setTimeout(30000);
        req.write(formData);
        req.end();
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token || data.token || data.accessToken) {
          const accessToken = data.access_token || data.token || data.accessToken;
          console.log('✅ Direct JavaScript token generation successful');
          
          // Cache the token
          const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
          tokenCache = {
            token: accessToken,
            expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
          };
          
          return accessToken;
        }
      } else {
        const errorText = await response.text();
        console.log(`⚠️ Auth endpoint ${endpoint} failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Error with ${endpoint}:`, error.message);
    }
  }
  
  throw new Error('All authentication endpoints failed');
}

// Get valid access token (from cache or generate new)
async function getValidAccessToken() {
  try {
    // Check cached token first
    if (tokenCache.token && Date.now() < tokenCache.expiry) {
      console.log('✅ Using cached Bearer token');
      return tokenCache.token;
    }
    
    // Generate new token
    console.log('🔄 Generating new Bearer token...');
    return await generateAccessTokenDirect();
    
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    throw error;
  }
}

// Make authenticated API calls to Groww with Bearer token
async function makeGrowwAPICall(endpoint, params = {}) {
  try {
    const accessToken = await getValidAccessToken();
    
    // Official Groww API base URL (proven to work)
    const baseURL = 'https://api.groww.in';
    
    // Official headers format from successful tests
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'X-API-VERSION': '1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'GrowwAPI/1.0'
    };
    
    // Build URL with parameters
    const url = new URL(`${baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    console.log(`📞 Making Groww API call: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: headers,
      timeout: 15000
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groww API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'SUCCESS') {
      console.log(`✅ Groww API call successful: ${endpoint}`);
      return data.payload;
    } else {
      throw new Error(`Groww API returned error: ${JSON.stringify(data)}`);
    }
    
  } catch (error) {
    console.error(`❌ Groww API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Get live stock quote (proven endpoint)
async function getLiveQuote(tradingSymbol, exchange = 'NSE', segment = 'CASH') {
  try {
    const params = {
      exchange: exchange,
      segment: segment, 
      trading_symbol: tradingSymbol
    };
    
    const data = await makeGrowwAPICall('/v1/live-data/quote', params);
    
    // Transform to our expected format
    return {
      symbol: tradingSymbol,
      currentPrice: data.ltp || data.last_price,
      dayChange: data.day_change,
      dayChangePercent: data.day_change_perc,
      volume: data.volume,
      ohlc: data.ohlc,
      lastUpdated: new Date().toISOString(),
      source: 'Groww Bearer API'
    };
    
  } catch (error) {
    console.error(`❌ Error getting live quote for ${tradingSymbol}:`, error);
    throw error;
  }
}

// Get Last Traded Price (proven endpoint)
async function getLastTradedPrice(tradingSymbol, exchange = 'NSE', segment = 'CASH') {
  try {
    const exchangeSymbol = `${exchange}_${tradingSymbol}`;
    const params = {
      segment: segment,
      exchange_symbols: exchangeSymbol
    };
    
    const data = await makeGrowwAPICall('/v1/live-data/ltp', params);
    
    const price = data[exchangeSymbol];
    if (price === undefined) {
      throw new Error(`No price data found for ${exchangeSymbol}`);
    }
    
    return {
      symbol: tradingSymbol,
      currentPrice: price,
      lastUpdated: new Date().toISOString(),
      source: 'Groww Bearer API'
    };
    
  } catch (error) {
    console.error(`❌ Error getting LTP for ${tradingSymbol}:`, error);
    throw error;
  }
}

// Get OHLC data (proven endpoint)
async function getOHLCData(tradingSymbol, exchange = 'NSE', segment = 'CASH') {
  try {
    const exchangeSymbol = `${exchange}_${tradingSymbol}`;
    const params = {
      segment: segment,
      exchange_symbols: exchangeSymbol
    };
    
    const data = await makeGrowwAPICall('/v1/live-data/ohlc', params);
    
    const ohlc = data[exchangeSymbol];
    if (!ohlc) {
      throw new Error(`No OHLC data found for ${exchangeSymbol}`);
    }
    
    return {
      symbol: tradingSymbol,
      ohlc: ohlc,
      lastUpdated: new Date().toISOString(),
      source: 'Groww Bearer API'
    };
    
  } catch (error) {
    console.error(`❌ Error getting OHLC for ${tradingSymbol}:`, error);
    throw error;
  }
}

// Get historical candle data (proven endpoint)
async function getHistoricalData(tradingSymbol, days = 30, exchange = 'NSE', segment = 'CASH') {
  try {
    console.log(`📈 Getting ${days}-day historical data for ${tradingSymbol}...`);
    
    // Calculate date range for API call
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Format dates as required by Groww API: "2025-07-06 09:15:00"
    const formatDate = (date) => {
      return date.toISOString().replace('T', ' ').slice(0, 19);
    };
    
    const params = {
      exchange: exchange,
      segment: segment,
      trading_symbol: tradingSymbol,
      start_time: formatDate(startTime),
      end_time: formatDate(endTime),
      interval_in_minutes: 3600 // 1 hour intervals
    };
    
    const data = await makeGrowwAPICall('/v1/historical/candle/range', params);
    
    if (data.candles && data.candles.length > 0) {
      // Convert Groww API format to our HistoricalCandle format
      const candles = data.candles.map(([timestamp, open, high, low, close, volume]) => ({
        timestamp: timestamp,
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume
      }));
      
      console.log(`✅ Retrieved ${candles.length} historical candles for ${tradingSymbol}`);
      return {
        symbol: tradingSymbol,
        candles: candles,
        period: days,
        lastUpdated: new Date().toISOString(),
        source: 'Groww Bearer API'
      };
    } else {
      throw new Error(`No historical data found for ${tradingSymbol}`);
    }
    
  } catch (error) {
    console.error(`❌ Error getting historical data for ${tradingSymbol}:`, error);
    throw error;
  }
}

// Get comprehensive stock data (combines multiple endpoints)
async function getComprehensiveStockData(tradingSymbol) {
  try {
    console.log(`📊 Getting comprehensive data for ${tradingSymbol}...`);
    
    // Use Promise.all to fetch data in parallel for better performance
    const [quoteData, ltpData, ohlcData] = await Promise.allSettled([
      getLiveQuote(tradingSymbol),
      getLastTradedPrice(tradingSymbol),
      getOHLCData(tradingSymbol)
    ]);
    
    // Combine successful results
    const result = {
      symbol: tradingSymbol,
      lastUpdated: new Date().toISOString(),
      source: 'Groww Bearer API',
      dataQuality: 'high'
    };
    
    if (quoteData.status === 'fulfilled') {
      Object.assign(result, quoteData.value);
    }
    
    if (ltpData.status === 'fulfilled' && !result.currentPrice) {
      result.currentPrice = ltpData.value.currentPrice;
    }
    
    if (ohlcData.status === 'fulfilled' && !result.ohlc) {
      result.ohlc = ohlcData.value.ohlc;
    }
    
    console.log(`✅ Comprehensive data retrieved for ${tradingSymbol}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Error getting comprehensive data for ${tradingSymbol}:`, error);
    throw error;
  }
}

// Main handler for Vercel serverless function
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol, type, days, exchange, segment } = req.method === 'GET' ? req.query : req.body;
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Symbol is required',
        example: { symbol: 'HDFCBANK', type: 'quote' }
      });
    }
    
    console.log(`🔍 Groww Bearer API request for ${symbol}, type: ${type || 'comprehensive'}`);
    
    let result;
    
    switch (type) {
      case 'quote':
        result = await getLiveQuote(symbol, exchange, segment);
        break;
      case 'ltp':
        result = await getLastTradedPrice(symbol, exchange, segment);
        break;
      case 'ohlc':
        result = await getOHLCData(symbol, exchange, segment);
        break;
      case 'historical':
        result = await getHistoricalData(symbol, parseInt(days) || 30, exchange, segment);
        break;
      default:
        result = await getComprehensiveStockData(symbol);
        break;
    }
    
    return res.status(200).json({
      success: true,
      data: result,
      method: 'bearer_token_authentication',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Groww Bearer API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stock data',
      message: error.message,
      method: 'bearer_token_authentication'
    });
  }
};