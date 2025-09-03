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

// Generate access token directly using TOTP
async function generateAccessTokenDirect() {
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