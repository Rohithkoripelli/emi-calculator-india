import { IndexData, CompanyData, ChartData } from '../types/stock';

// Groww API Configuration
const GROWW_API_BASE = 'https://api.groww.in/v1';
const GROWW_LIVE_DATA = `${GROWW_API_BASE}/live-data`;

// Environment variables for API credentials
const GROWW_API_KEY = process.env.REACT_APP_GROWW_API_KEY;
const GROWW_API_SECRET = process.env.REACT_APP_GROWW_API_SECRET;
const GROWW_API_VERSION = '1.0.0';

// Groww API symbol mapping for Indian indices
const GROWW_INDEX_SYMBOLS: Record<string, { tradingSymbol: string; exchange: string; segment: string; displayName: string }> = {
  '^NSEI': {
    tradingSymbol: 'NIFTY 50',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 50'
  },
  '^BSESN': {
    tradingSymbol: 'SENSEX',
    exchange: 'BSE',
    segment: 'CASH',
    displayName: 'BSE SENSEX'
  },
  '^CNXBANK': {
    tradingSymbol: 'NIFTY BANK',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Bank'
  },
  '^CNXIT': {
    tradingSymbol: 'NIFTY IT',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY IT'
  },
  '^CNX100': {
    tradingSymbol: 'NIFTY 100',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 100'
  },
  '^CNX500': {
    tradingSymbol: 'NIFTY 500',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY 500'
  },
  '^CNXFIN': {
    tradingSymbol: 'NIFTY FIN SERVICE',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'Nifty Financial Services'
  },
  '^CNXAUTO': {
    tradingSymbol: 'NIFTY AUTO',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Auto'
  },
  '^CNXPHARMA': {
    tradingSymbol: 'NIFTY PHARMA',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Pharma'
  },
  '^CNXFMCG': {
    tradingSymbol: 'NIFTY FMCG',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'Nifty FMCG'
  },
  '^CNXMETAL': {
    tradingSymbol: 'NIFTY METAL',
    exchange: 'NSE',
    segment: 'CASH',
    displayName: 'NIFTY Metal'
  },
  '^CNXPSUBANK': {
    tradingSymbol: 'NIFTY PSU BANK',
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
    if (!GROWW_API_KEY || !GROWW_API_SECRET) {
      console.error('Groww API credentials not found. Please set REACT_APP_GROWW_API_KEY and REACT_APP_GROWW_API_SECRET in your environment variables.');
      return false;
    }
    return true;
  }

  private static getAuthHeaders(): HeadersInit {
    // Generate basic auth header using key:secret
    const credentials = btoa(`${GROWW_API_KEY}:${GROWW_API_SECRET}`);
    
    return {
      'Authorization': `Basic ${credentials}`,
      'X-API-Version': GROWW_API_VERSION,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private static async makeGrowwRequest(endpoint: string, params: URLSearchParams): Promise<any> {
    if (!this.validateApiCredentials()) {
      throw new Error('Groww API credentials not configured');
    }

    const url = `${endpoint}?${params.toString()}`;
    console.log(`Making Groww API request to: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groww API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Groww API response received successfully');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Groww API request failed:', error);
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
        tradingSymbol: mapping.tradingSymbol
      });

      const response: GrowwQuoteResponse = await this.makeGrowwRequest(
        `${GROWW_LIVE_DATA}/quote`,
        params
      );

      if (!response || typeof response.ltp !== 'number') {
        return null;
      }

      return {
        symbol: symbol,
        name: mapping.displayName,
        price: parseFloat(response.ltp.toFixed(2)),
        change: parseFloat(response.dayChange.toFixed(2)),
        changePercent: parseFloat(response.dayChangePerc.toFixed(2)),
        dayHigh: parseFloat(response.high.toFixed(2)),
        dayLow: parseFloat(response.low.toFixed(2)),
        volume: response.totalTradedVolume || 0,
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
        const growwSymbols = batch
          .map(symbol => {
            const mapping = GROWW_INDEX_SYMBOLS[symbol];
            return mapping ? `${mapping.exchange}:${mapping.segment}:${mapping.tradingSymbol}` : null;
          })
          .filter(Boolean) as string[];

        if (growwSymbols.length === 0) continue;

        const params = new URLSearchParams({
          instruments: growwSymbols.join(',')
        });

        const response: GrowwLTPResponse = await this.makeGrowwRequest(
          `${GROWW_LIVE_DATA}/ltp`,
          params
        );

        // Process response and map back to original symbols
        batch.forEach(symbol => {
          const mapping = GROWW_INDEX_SYMBOLS[symbol];
          if (mapping) {
            const growwKey = `${mapping.exchange}:${mapping.segment}:${mapping.tradingSymbol}`;
            const data = response[growwKey];
            
            if (data && typeof data.ltp === 'number') {
              results[symbol] = {
                symbol: symbol,
                name: mapping.displayName,
                price: parseFloat(data.ltp.toFixed(2)),
                change: parseFloat(data.dayChange.toFixed(2)),
                changePercent: parseFloat(data.dayChangePerc.toFixed(2)),
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

  static getApiStatus(): { configured: boolean; keyPresent: boolean; secretPresent: boolean } {
    return {
      configured: this.validateApiCredentials(),
      keyPresent: !!GROWW_API_KEY,
      secretPresent: !!GROWW_API_SECRET
    };
  }
}