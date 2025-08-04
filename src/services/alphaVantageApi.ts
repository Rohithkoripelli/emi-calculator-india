import { IndexData } from '../types/stock';

// AlphaVantage API Configuration
const ALPHA_VANTAGE_API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// NSE/BSE symbol mapping for AlphaVantage
const ALPHA_VANTAGE_SYMBOLS: Record<string, { symbol: string; displayName: string }> = {
  '^NSEI': { symbol: 'NIFTY50.NSE', displayName: 'NIFTY 50' },
  '^BSESN': { symbol: 'SENSEX.BSE', displayName: 'BSE SENSEX' },
  '^CNXBANK': { symbol: 'NIFTYBANK.NSE', displayName: 'NIFTY Bank' },
  '^CNXIT': { symbol: 'NIFTYIT.NSE', displayName: 'NIFTY IT' },
  '^CNX100': { symbol: 'NIFTY100.NSE', displayName: 'NIFTY 100' },
  '^CNX500': { symbol: 'NIFTY500.NSE', displayName: 'NIFTY 500' },
  '^CNXFIN': { symbol: 'NIFTYFIN.NSE', displayName: 'Nifty Financial Services' },
  '^CNXAUTO': { symbol: 'NIFTYAUTO.NSE', displayName: 'NIFTY Auto' },
  '^CNXPHARMA': { symbol: 'NIFTYPHARMA.NSE', displayName: 'NIFTY Pharma' },
  '^CNXFMCG': { symbol: 'NIFTYFMCG.NSE', displayName: 'Nifty FMCG' },
  '^CNXMETAL': { symbol: 'NIFTYMETAL.NSE', displayName: 'NIFTY Metal' },
  '^CNXPSUBANK': { symbol: 'NIFTYPSUBANK.NSE', displayName: 'NIFTY PSU Bank' },
};

interface AlphaVantageQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export class AlphaVantageApiService {
  private static validateApiKey(): boolean {
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('AlphaVantage API key not found. Please set REACT_APP_ALPHA_VANTAGE_API_KEY in your environment variables.');
      return false;
    }
    return true;
  }

  private static async makeAlphaVantageRequest(params: Record<string, string>): Promise<any> {
    if (!this.validateApiKey()) {
      throw new Error('AlphaVantage API key not configured');
    }

    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    const searchParams = new URLSearchParams({
      ...params,
      apikey: ALPHA_VANTAGE_API_KEY!
    });

    url.search = searchParams.toString();

    console.log(`Making AlphaVantage API request: ${params.function} for ${params.symbol}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AlphaVantage API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API error messages
      if (data['Error Message']) {
        throw new Error(`AlphaVantage API Error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error(`AlphaVantage API Rate Limit: ${data['Note']}`);
      }

      console.log('AlphaVantage API response received successfully');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('AlphaVantage API request failed:', error);
      throw error;
    }
  }

  static async getIndexQuote(symbol: string): Promise<IndexData | null> {
    const mapping = ALPHA_VANTAGE_SYMBOLS[symbol];
    if (!mapping) {
      console.warn(`No AlphaVantage mapping found for symbol: ${symbol}`);
      return null;
    }

    try {
      const response: AlphaVantageQuoteResponse = await this.makeAlphaVantageRequest({
        function: 'GLOBAL_QUOTE',
        symbol: mapping.symbol
      });

      const quote = response['Global Quote'];
      if (!quote || !quote['05. price']) {
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        symbol: symbol,
        name: mapping.displayName,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        dayHigh: parseFloat(quote['03. high']),
        dayLow: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume'] || '0'),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching AlphaVantage quote for ${symbol}:`, error);
      return null;
    }
  }

  static async getBulkIndexData(symbols: string[]): Promise<Record<string, IndexData | null>> {
    console.log(`Fetching data for ${symbols.length} symbols using AlphaVantage API`);
    
    const results: Record<string, IndexData | null> = {};
    
    // AlphaVantage has rate limits, so we'll process sequentially with delays
    for (const symbol of symbols) {
      try {
        const data = await this.getIndexQuote(symbol);
        results[symbol] = data;
        
        // Add delay between requests to respect rate limits (5 calls per minute for free tier)
        if (symbols.indexOf(symbol) < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced to 0.5 second for speed
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        results[symbol] = null;
        
        // Continue with minimal delay even on error
        if (symbols.indexOf(symbol) < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced to 0.5 second for speed
        }
      }
    }
    
    return results;
  }

  // Cache for reducing API calls
  private static cache = new Map<string, { data: IndexData; timestamp: number }>();
  private static CACHE_DURATION = 60000; // 1 minute cache due to API rate limits

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  static async getIndexDataWithCache(symbol: string): Promise<IndexData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached AlphaVantage data for ${symbol}`);
      return cached.data;
    }

    console.log(`Fetching fresh AlphaVantage data for ${symbol}`);
    const data = await this.getIndexQuote(symbol);
    
    if (data) {
      this.cache.set(symbol, { data, timestamp: Date.now() });
    }

    return data;
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('AlphaVantage API cache cleared');
  }

  static getApiStatus(): { configured: boolean; keyPresent: boolean } {
    return {
      configured: this.validateApiKey(),
      keyPresent: !!ALPHA_VANTAGE_API_KEY
    };
  }

  static getApiInfo(): {
    provider: string;
    tier: string;
    rateLimit: string;
    accuracy: string;
    cost: string;
  } {
    return {
      provider: 'AlphaVantage',
      tier: ALPHA_VANTAGE_API_KEY ? 'Paid/Premium' : 'Free',
      rateLimit: '5 calls/minute (Free) or 75 calls/minute (Premium)',
      accuracy: 'Professional Grade - Exchange Licensed Data',
      cost: 'Free tier available, Premium from $49.99/month'
    };
  }
}