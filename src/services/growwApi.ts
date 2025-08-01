import { IndexData, CompanyData, ChartData } from '../types/stock';

// Groww API Configuration
const GROWW_API_BASE = 'https://api.groww.in/v1';
const GROWW_LIVE_DATA = `${GROWW_API_BASE}/live-data`;

// Environment variables for API credentials
const GROWW_API_KEY = process.env.REACT_APP_GROWW_API_KEY;
const GROWW_API_SECRET = process.env.REACT_APP_GROWW_API_SECRET;
const GROWW_ACCESS_TOKEN = process.env.REACT_APP_GROWW_ACCESS_TOKEN; // Fallback manual token
const GROWW_API_VERSION = '1.0';

// Token cache to avoid frequent TOTP generation
let tokenCache: { token: string; expiresAt: number } | null = null;

// Groww API symbol mapping for Indian indices (format: EXCHANGE_SYMBOL for LTP/OHLC)
const GROWW_INDEX_SYMBOLS: Record<string, { tradingSymbol: string; exchangeSymbol: string; exchange: string; segment: string; displayName: string }> = {
  '^NSEI': {
    tradingSymbol: 'NIFTY',
    exchangeSymbol: 'NSE_NIFTY',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 50'
  },
  '^BSESN': {
    tradingSymbol: 'SENSEX',
    exchangeSymbol: 'BSE_SENSEX',
    exchange: 'BSE',
    segment: 'CASH',
    displayName: 'BSE SENSEX'
  },
  '^CNXBANK': {
    tradingSymbol: 'BANKNIFTY',
    exchangeSymbol: 'NSE_BANKNIFTY',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Bank'
  },
  '^CNXIT': {
    tradingSymbol: 'NIFTYIT',
    exchangeSymbol: 'NSE_NIFTYIT',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY IT'
  },
  '^CNX100': {
    tradingSymbol: 'NIFTY100',
    exchangeSymbol: 'NSE_NIFTY100',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 100'
  },
  '^CNX500': {
    tradingSymbol: 'NIFTY500',
    exchangeSymbol: 'NSE_NIFTY500',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 500'
  },
  '^CNXFIN': {
    tradingSymbol: 'NIFTYFIN',
    exchangeSymbol: 'NSE_NIFTYFIN',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'Nifty Financial Services'
  },
  '^CNXAUTO': {
    tradingSymbol: 'NIFTYAUTO',
    exchangeSymbol: 'NSE_NIFTYAUTO',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Auto'
  },
  '^CNXPHARMA': {
    tradingSymbol: 'NIFTYPHARMA',
    exchangeSymbol: 'NSE_NIFTYPHARMA',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Pharma'
  },
  '^CNXFMCG': {
    tradingSymbol: 'NIFTYFMCG',
    exchangeSymbol: 'NSE_NIFTYFMCG',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'Nifty FMCG'
  },
  '^CNXMETAL': {
    tradingSymbol: 'NIFTYMETAL',
    exchangeSymbol: 'NSE_NIFTYMETAL',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Metal'
  },
  '^CNXPSUBANK': {
    tradingSymbol: 'NIFTYPSUBANK',
    exchangeSymbol: 'NSE_NIFTYPSUBANK',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY PSU Bank'
  }
};

interface GrowwQuoteResponse {
  avgPrice: number;
  close: number;
  dayChange: number;
  dayChangePerc: number;
  high: number;
  low: number;
  ltp: number;
  open: number;
  totalTradedVolume: number;
  high52w: number;
  low52w: number;
  marketDepth: {
    buy: Array<{ price: number; quantity: number }>;
    sell: Array<{ price: number; quantity: number }>;
  };
}

interface GrowwLTPResponse {
  [key: string]: {
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
  };
}

export class GrowwApiService {
  private static validateApiCredentials(): boolean {
    // Check if we have TOTP credentials (preferred) or fallback token
    if (GROWW_API_KEY && GROWW_API_SECRET) {
      console.log('✅ Groww TOTP credentials found - will auto-generate tokens');
      return true;
    } else if (GROWW_ACCESS_TOKEN) {
      console.log('⚠️ Using fallback manual access token (expires daily at 6 AM)');
      return true;
    } else {
      console.error('❌ No Groww credentials found. Set REACT_APP_GROWW_API_KEY + REACT_APP_GROWW_API_SECRET for auto-refresh, or REACT_APP_GROWW_ACCESS_TOKEN for manual mode.');
      return false;
    }
  }

  private static async getValidAccessToken(): Promise<string> {
    // If we have TOTP credentials, use them for auto-refresh
    if (GROWW_API_KEY && GROWW_API_SECRET) {
      return await this.getAccessTokenViaTOTP();
    }
    
    // Fallback to manual token
    if (GROWW_ACCESS_TOKEN) {
      return GROWW_ACCESS_TOKEN;
    }
    
    throw new Error('No valid Groww credentials available');
  }

  private static async getAccessTokenViaTOTP(): Promise<string> {
    // Check cache first
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
      console.log('Using cached Groww access token');
      return tokenCache.token;
    }

    try {
      console.log('🔄 Generating new Groww access token via TOTP...');
      
      // Call our serverless TOTP function
      const response = await fetch('/api/groww-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: GROWW_API_KEY,
          api_secret: GROWW_API_SECRET
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TOTP service failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        // Cache token (expires in 12 hours)
        const expiresIn = data.expires_in || 43200; // 12 hours
        tokenCache = {
          token: data.access_token,
          expiresAt: Date.now() + (expiresIn * 1000)
        };
        
        console.log('✅ Successfully generated Groww access token via TOTP');
        return data.access_token;
      }
      
      throw new Error('No access token received from TOTP service');
      
    } catch (error) {
      console.error('TOTP token generation failed:', error);
      
      // Fallback to manual token if available
      if (GROWW_ACCESS_TOKEN) {
        console.log('🔄 Falling back to manual access token');
        return GROWW_ACCESS_TOKEN;
      }
      
      throw error;
    }
  }

  private static async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getValidAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'X-API-VERSION': GROWW_API_VERSION,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  private static async makeGrowwRequest(endpoint: string, params: URLSearchParams): Promise<any> {
    if (!this.validateApiCredentials()) {
      throw new Error('Groww API credentials not configured');
    }

    const targetUrl = `${endpoint}?${params.toString()}`;
    console.log(`Making Groww API request to: ${targetUrl}`);

    // Get auth headers (this may involve TOTP generation)
    const authHeaders = await this.getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Direct request to Groww API
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          ...authHeaders,
          'Origin': window.location.origin,
          'Referer': window.location.origin
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Groww API Error ${response.status}: ${response.statusText}`);
      }

      const apiData = await response.json();
      console.log('Groww API response received successfully');
      return apiData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Groww API request failed:', error);
      
      // If CORS error, try using our backend proxy
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('CORS error detected, trying backend proxy...');
        try {
          const proxyResponse = await fetch('/api/groww-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: targetUrl,
              headers: authHeaders
            })
          });
          
          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            console.log('Backend proxy request succeeded');
            return proxyData;
          }
        } catch (proxyError) {
          console.warn('Backend proxy also failed:', proxyError);
        }
      }
      
      throw error;
    }
  }

  static async getIndexQuote(symbol: string): Promise<IndexData | null> {
    const mapping = GROWW_INDEX_SYMBOLS[symbol];
    if (!mapping) {
      console.warn(`No Groww mapping found for symbol: ${symbol}`);
      return null;
    }

    try {
      const params = new URLSearchParams({
        exchange: mapping.exchange,
        segment: mapping.segment,
        trading_symbol: mapping.tradingSymbol
      });

      const response = await this.makeGrowwRequest(
        `${GROWW_LIVE_DATA}/quote`,
        params
      );

      if (!response || response.status !== 'SUCCESS' || !response.data) {
        console.warn(`No valid data in Groww response for ${symbol}:`, response);
        return null;
      }

      const data = response.data;
      
      return {
        symbol: symbol,
        name: mapping.displayName,
        price: parseFloat((data.ltp || data.lastPrice || 0).toFixed(2)),
        change: parseFloat((data.dayChange || data.change || 0).toFixed(2)),
        changePercent: parseFloat((data.dayChangePerc || data.changePercent || 0).toFixed(2)),
        dayHigh: parseFloat((data.dayHigh || data.high || 0).toFixed(2)),
        dayLow: parseFloat((data.dayLow || data.low || 0).toFixed(2)),
        volume: data.totalTradedVolume || data.volume || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching Groww quote for ${symbol}:`, error);
      return null;
    }
  }

  static async getMultipleIndexLTP(symbols: string[]): Promise<Record<string, IndexData | null>> {
    if (!this.validateApiCredentials()) {
      return {};
    }

    const results: Record<string, IndexData | null> = {};
    
    // Groww supports up to 50 instruments per request
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      try {
        const exchangeSymbols = batch
          .map(symbol => {
            const mapping = GROWW_INDEX_SYMBOLS[symbol];
            return mapping ? mapping.exchangeSymbol : null;
          })
          .filter(Boolean) as string[];

        if (exchangeSymbols.length === 0) continue;

        const params = new URLSearchParams({
          segment: 'CASH',
          exchange_symbols: exchangeSymbols.join(',')
        });

        const response = await this.makeGrowwRequest(
          `${GROWW_LIVE_DATA}/ltp`,
          params
        );

        if (response && response.status === 'SUCCESS' && response.data) {
          // Process response data
          batch.forEach(symbol => {
            const mapping = GROWW_INDEX_SYMBOLS[symbol];
            if (mapping) {
              const symbolData = response.data[mapping.exchangeSymbol];
              
              if (symbolData && typeof symbolData.ltp === 'number') {
                results[symbol] = {
                  symbol: symbol,
                  name: mapping.displayName,
                  price: parseFloat(symbolData.ltp.toFixed(2)),
                  change: parseFloat((symbolData.dayChange || 0).toFixed(2)),
                  changePercent: parseFloat((symbolData.dayChangePerc || 0).toFixed(2)),
                  dayHigh: 0, // LTP endpoint doesn't provide OHLC
                  dayLow: 0,
                  volume: 0,
                  lastUpdated: new Date().toISOString()
                };
              } else {
                results[symbol] = null;
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching LTP batch:`, error);
        // Set failed symbols to null
        batch.forEach(symbol => {
          results[symbol] = null;
        });
      }
    }

    return results;
  }

  static async getIndexOHLC(symbol: string): Promise<IndexData | null> {
    const mapping = GROWW_INDEX_SYMBOLS[symbol];
    if (!mapping) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        instruments: `${mapping.exchange}:${mapping.segment}:${mapping.tradingSymbol}`
      });

      const response = await this.makeGrowwRequest(
        `${GROWW_LIVE_DATA}/ohlc`,
        params
      );

      const key = `${mapping.exchange}:${mapping.segment}:${mapping.tradingSymbol}`;
      const data = response[key];

      if (!data) return null;

      return {
        symbol: symbol,
        name: mapping.displayName,
        price: parseFloat(data.ltp?.toFixed(2) || 0),
        change: parseFloat(data.dayChange?.toFixed(2) || 0),
        changePercent: parseFloat(data.dayChangePerc?.toFixed(2) || 0),
        dayHigh: parseFloat(data.high?.toFixed(2) || 0),
        dayLow: parseFloat(data.low?.toFixed(2) || 0),
        volume: data.volume || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching OHLC for ${symbol}:`, error);
      return null;
    }
  }

  // Cache for reducing API calls
  private static cache = new Map<string, { data: IndexData; timestamp: number }>();
  private static CACHE_DURATION = 10000; // 10 seconds for real-time data

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  static async getIndexDataWithCache(symbol: string): Promise<IndexData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached Groww data for ${symbol}`);
      return cached.data;
    }

    console.log(`Fetching fresh Groww data for ${symbol}`);
    
    // Try quote first (most comprehensive), fallback to OHLC if quote fails
    let data = await this.getIndexQuote(symbol);
    if (!data) {
      data = await this.getIndexOHLC(symbol);
    }

    if (data) {
      this.cache.set(symbol, { data, timestamp: Date.now() });
    }

    return data;
  }

  static async getBulkIndexData(symbols: string[]): Promise<Record<string, IndexData | null>> {
    console.log(`Fetching bulk data for ${symbols.length} symbols using Groww API`);
    
    // For better performance, use LTP for bulk requests and then get detailed quotes for visible items
    return await this.getMultipleIndexLTP(symbols);
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('Groww API cache cleared');
  }

  static getApiStatus(): { configured: boolean; tokenPresent: boolean } {
    return {
      configured: this.validateApiCredentials(),
      tokenPresent: !!GROWW_ACCESS_TOKEN
    };
  }
}