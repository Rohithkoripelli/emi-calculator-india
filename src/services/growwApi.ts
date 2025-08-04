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
    // Backend handles all credentials, we just check if service is configured
    console.log('✅ Using backend Groww API service - all authentication handled server-side');
    return true;
  }

  private static async callBackendAPI(endpoint: string, params: any = {}): Promise<any> {
    try {
      console.log(`🔄 Calling backend Groww API: ${endpoint}`);
      
      const response = await fetch('/api/groww-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Backend API Error ${response.status}: ${errorData.message || errorData.error}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Backend Groww API request succeeded');
        return data.data;
      } else {
        throw new Error('Invalid response from backend API');
      }
      
    } catch (error) {
      console.error('Backend Groww API request failed:', error);
      throw error;
    }
  }

  static async getIndexQuote(symbol: string): Promise<IndexData | null> {
    try {
      const response = await this.callBackendAPI('quote', { 
        symbols: [symbol], 
        type: 'quote' 
      });
      
      return response[symbol] || null;
    } catch (error) {
      console.error(`Error fetching Groww quote for ${symbol}:`, error);
      return null;
    }
  }

  static async getMultipleIndexLTP(symbols: string[]): Promise<Record<string, IndexData | null>> {
    try {
      const response = await this.callBackendAPI('ltp', { 
        symbols: symbols, 
        type: 'ltp' 
      });
      
      return response;
    } catch (error) {
      console.error(`Error fetching LTP batch:`, error);
      const results: Record<string, IndexData | null> = {};
      symbols.forEach(symbol => {
        results[symbol] = null;
      });
      return results;
    }
  }

  static async getIndexOHLC(symbol: string): Promise<IndexData | null> {
    try {
      const response = await this.callBackendAPI('ohlc', { 
        symbols: [symbol], 
        type: 'quote' 
      });
      
      return response[symbol] || null;
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
    console.log(`Fetching bulk data for ${symbols.length} symbols using backend Groww API`);
    
    try {
      const response = await this.callBackendAPI('bulk', { 
        symbols: symbols, 
        type: 'quote' 
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching bulk data:', error);
      const results: Record<string, IndexData | null> = {};
      symbols.forEach(symbol => {
        results[symbol] = null;
      });
      return results;
    }
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('Groww API cache cleared');
  }

  static getApiStatus(): { configured: boolean; tokenPresent: boolean } {
    return {
      configured: true, // Backend handles all configuration
      tokenPresent: true // Backend manages tokens
    };
  }
}