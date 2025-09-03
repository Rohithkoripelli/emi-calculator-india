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

// Generate access token using OFFICIAL Groww Python SDK
async function generateAccessTokenDirect() {
  const apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY;
  const totpSecret = process.env.REACT_APP_GROWW_API_SECRET || process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_API_SECRET;
  
  if (!apiKey || !totpSecret) {
    throw new Error('Missing Groww API credentials');
  }
  
  console.log('🔄 Using official Groww Python SDK for token generation...');
  
  // Official Groww SDK Python script (same as in groww-token.js)
  const pythonScript = `
import sys
import pyotp
from growwapi import GrowwAPI

try:
    # Official Groww SDK authentication flow
    api_key = "${apiKey}"
    api_secret = "${totpSecret}"
    
    # Generate TOTP using official pyotp library
    totp_gen = pyotp.TOTP(api_secret)
    totp = totp_gen.now()
    
    print(f"🔐 Generated TOTP: {totp}", file=sys.stderr)
    
    # Use official Groww SDK method - the ONLY supported way
    access_token = GrowwAPI.get_access_token(api_key, totp)
    
    if access_token:
        print(access_token)
        sys.exit(0)
    else:
        print("ERROR: No access token returned from official SDK", file=sys.stderr)
        sys.exit(1)
        
except ImportError as e:
    print(f"ERROR: Missing required packages - {str(e)}", file=sys.stderr)
    print("ERROR: Make sure 'growwapi' and 'pyotp' are installed", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Official SDK authentication failed - {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
  
  // Execute official Python SDK
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
        console.log('✅ Official Groww SDK token generation successful!');
        
        // Cache the token with official 11-hour expiry
        const expiresInMs = 11 * 60 * 60 * 1000; // 11 hours
        tokenCache = {
          token: accessToken,
          expiry: Date.now() + expiresInMs - (5 * 60 * 1000) // 5 min buffer
        };
        
        resolve(accessToken);
      } else {
        console.error('❌ Official Groww SDK token generation failed');
        console.error('❌ Error details:', errorOutput);
        reject(new Error(`Official SDK failed: ${errorOutput}`));
      }
    });
    
    python.on('error', (error) => {
      console.error('❌ Python SDK process error:', error);
      reject(new Error(`Python SDK process failed: ${error.message}`));
    });
  });
}

// Hybrid Multi-Cloud Enterprise Authentication with Google Cloud Functions + Vercel
async function getValidAccessToken() {
  try {
    console.log('🌤️ Starting hybrid multi-cloud authentication flow...');
    
    // PRIORITY 1: Direct manual token check (fastest path)
    const manualToken = process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN;
    if (manualToken) {
      console.log('✅ Using manual token (Vercel environment)');
      return manualToken;
    }
    
    // PRIORITY 2: Google Cloud Functions TOTP Authentication Service
    const gcpAuthUrl = process.env.GCP_AUTH_SERVICE_URL || process.env.REACT_APP_GCP_AUTH_SERVICE_URL;
    
    if (gcpAuthUrl) {
      console.log('🔗 Calling Google Cloud Functions TOTP service...');
      
      try {
        const gcpResponse = await fetch(`${gcpAuthUrl}/token`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Vercel-Groww-Gateway/1.0',
            'X-Vercel-Origin': 'emi-calculator-india.vercel.app'
          },
          timeout: 25000
        });
        
        if (!gcpResponse.ok) {
          const errorText = await gcpResponse.text();
          console.error(`❌ GCP auth service error ${gcpResponse.status}: ${errorText}`);
          throw new Error(`GCP service failed: ${gcpResponse.status}`);
        }
        
        const gcpResult = await gcpResponse.json();
        console.log(`📊 GCP auth service response:`, {
          success: gcpResult.success,
          source: gcpResult.source,
          method: gcpResult.method,
          processing_time: gcpResult.processing_time_ms,
          cloud_provider: gcpResult.cloud_provider,
          request_id: gcpResult.request_id
        });
        
        if (gcpResult.success && gcpResult.token) {
          console.log(`✅ Token retrieved from Google Cloud Functions (${gcpResult.source})`);
          console.log(`🎟️ Token preview: ${gcpResult.token.substring(0, 30)}...`);
          console.log(`⏱️ Processing time: ${gcpResult.processing_time_ms}ms`);
          
          return gcpResult.token;
        } else {
          throw new Error(gcpResult.error || 'GCP authentication failed');
        }
        
      } catch (gcpError) {
        console.error('❌ Google Cloud Functions authentication failed:', gcpError.message);
        // Fall through to next priority
      }
    } else {
      console.log('⚠️ GCP_AUTH_SERVICE_URL not configured - skipping Google Cloud Functions');
    }
    
    // PRIORITY 3: Local Vercel Python service fallback (if available)
    console.log('🔗 Attempting local Vercel Python service fallback...');
    
    try {
      const localAuthUrl = `${getVercelBaseUrl()}/api/auth-service`;
      const localResponse = await fetch(`${localAuthUrl}?action=get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Local-Gateway/1.0'
        },
        timeout: 15000
      });
      
      if (localResponse.ok) {
        const localResult = await localResponse.json();
        if (localResult.success && localResult.token) {
          console.log('✅ Token retrieved from local Vercel Python service');
          return localResult.token;
        }
      }
    } catch (localError) {
      console.log('⚠️ Local Vercel Python service not available:', localError.message);
    }
    
    throw new Error('No authentication services available');
    
  } catch (error) {
    console.error('❌ Multi-cloud authentication flow failed:', error.message);
    
    // ULTIMATE FALLBACK: Emergency manual token
    const emergencyToken = process.env.REACT_APP_GROWW_ACCESS_TOKEN || process.env.GROWW_ACCESS_TOKEN;
    if (emergencyToken) {
      console.log('🆘 Using emergency manual token fallback');
      return emergencyToken;
    }
    
    throw new Error(`All authentication methods exhausted: ${error.message}. Configure GCP_AUTH_SERVICE_URL or set manual token.`);
  }
}

// Helper function to get Vercel base URL
function getVercelBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://emi-calculator-india.vercel.app';
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