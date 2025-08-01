import { IndexData, CompanyData, ChartData } from '../types/stock';

// Real-time Indian Stock Market APIs
const NSE_INDIA_API = 'https://latest-stock-price.p.rapidapi.com/price'; // RapidAPI NSE service
const STOCK_MARKET_INDIA_API = 'https://stock-market-india-api.vercel.app'; // Open source API
const NSE_LIVE_API = 'https://www.nseindia.com/api/equity-meta'; // NSE official API
const YAHOO_QUOTE_BASE = 'https://query1.finance.yahoo.com/v1/finance/quote';
const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Multiple CORS proxies for better reliability
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/'
];

// Index symbol mapping for accurate data
const INDEX_SYMBOL_MAP: Record<string, { yahoo: string; nseName: string; displayName: string }> = {
  '^NSEI': { yahoo: '^NSEI', nseName: 'NIFTY 50', displayName: 'NIFTY 50' },
  '^BSESN': { yahoo: '^BSESN', nseName: 'SENSEX', displayName: 'BSE SENSEX' },
  '^CNXBANK': { yahoo: 'NIFTY_BANK.NS', nseName: 'NIFTY BANK', displayName: 'NIFTY Bank' },
  '^CNXIT': { yahoo: 'NIFTY_IT.NS', nseName: 'NIFTY IT', displayName: 'NIFTY IT' },
  '^CNX100': { yahoo: 'NIFTY_100.NS', nseName: 'NIFTY 100', displayName: 'NIFTY 100' },
  '^CNX500': { yahoo: 'NIFTY_500.NS', nseName: 'NIFTY 500', displayName: 'NIFTY 500' },
  '^CNXFIN': { yahoo: 'NIFTY_FIN_SERVICE.NS', nseName: 'NIFTY FIN SERVICE', displayName: 'Nifty Financial Services' },
  '^CNXAUTO': { yahoo: 'NIFTY_AUTO.NS', nseName: 'NIFTY AUTO', displayName: 'NIFTY Auto' },
  '^CNXPHARMA': { yahoo: 'NIFTY_PHARMA.NS', nseName: 'NIFTY PHARMA', displayName: 'NIFTY Pharma' },
  '^CNXFMCG': { yahoo: 'NIFTY_FMCG.NS', nseName: 'NIFTY FMCG', displayName: 'Nifty FMCG' },
  '^CNXMETAL': { yahoo: 'NIFTY_METAL.NS', nseName: 'NIFTY METAL', displayName: 'NIFTY Metal' },
  '^CNXPSUBANK': { yahoo: 'NIFTY_PSU_BANK.NS', nseName: 'NIFTY PSU BANK', displayName: 'NIFTY PSU Bank' }
};

export class StockApiService {
  private static async fetchWithCORS(url: string, retryCount = 0): Promise<any> {
    const maxRetries = CORS_PROXIES.length;
    
    if (retryCount >= maxRetries) {
      throw new Error('All CORS proxies failed');
    }

    try {
      const proxy = CORS_PROXIES[retryCount];
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      
      console.log(`Attempting to fetch data from: ${url} via proxy ${retryCount + 1}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different proxy response formats
      if (data.contents) {
        try {
          return JSON.parse(data.contents);
        } catch {
          return data.contents;
        }
      }
      
      return data;
    } catch (error) {
      console.warn(`Proxy ${retryCount + 1} failed:`, error);
      
      if (retryCount < maxRetries - 1) {
        // Try next proxy
        return this.fetchWithCORS(url, retryCount + 1);
      }
      
      console.error('All proxies failed for URL:', url);
      throw error;
    }
  }

  // Fetch real-time NSE data using multiple sources
  private static async fetchNSEIndicesData(): Promise<any> {
    try {
      // Try stock-market-india API for NSE indices
      const url = `${STOCK_MARKET_INDIA_API}/nse/get_indices`;
      const data = await this.fetchWithCORS(url);
      return data;
    } catch (error) {
      console.error('NSE Indices API failed:', error);
      return null;
    }
  }

  private static async fetchStockMarketIndiaData(symbol: string): Promise<any> {
    try {
      const mapping = INDEX_SYMBOL_MAP[symbol];
      if (!mapping) return null;

      // Try to get index data from stock-market-india API
      const url = `${STOCK_MARKET_INDIA_API}/nse/get_indices`;
      const data = await this.fetchWithCORS(url);
      
      if (data && Array.isArray(data)) {
        // Find the matching index
        const indexData = data.find((item: any) => 
          item.name?.toUpperCase().includes(mapping.nseName.toUpperCase()) ||
          item.indexName?.toUpperCase().includes(mapping.nseName.toUpperCase())
        );
        return indexData;
      }
      return null;
    } catch (error) {
      console.error('Stock Market India API failed:', error);
      return null;
    }
  }

  static async getIndexData(symbol: string): Promise<IndexData | null> {
    const mapping = INDEX_SYMBOL_MAP[symbol];
    if (!mapping) {
      console.warn(`No mapping found for symbol: ${symbol}`);
      return null;
    }

    const dataSources = [
      () => this.fetchStockMarketIndiaData(symbol),
      () => this.fetchYahooFinanceData(symbol, mapping),
      () => this.fetchAlternativeNSEData(symbol, mapping)
    ];

    // Try each data source in order
    for (let i = 0; i < dataSources.length; i++) {
      try {
        console.log(`Trying data source ${i + 1}/${dataSources.length} for ${symbol}`);
        const data = await dataSources[i]();
        
        if (data && this.validateIndexData(data)) {
          console.log(`Successfully fetched data from source ${i + 1} for ${symbol}`);
          return data;
        }
      } catch (error) {
        console.warn(`Data source ${i + 1} failed for ${symbol}:`, error);
        continue;
      }
    }

    console.error(`All data sources failed for ${symbol}`);
    return null;
  }

  private static async fetchYahooFinanceData(symbol: string, mapping: any): Promise<IndexData | null> {
    try {
      const yahooUrl = `${YAHOO_QUOTE_BASE}?symbols=${mapping.yahoo}`;
      const yahooData = await this.fetchWithCORS(yahooUrl);
      
      if (yahooData?.quoteResponse?.result?.[0]) {
        const quote = yahooData.quoteResponse.result[0];
        return {
          symbol: symbol,
          name: mapping.displayName,
          price: parseFloat((quote.regularMarketPrice || 0).toFixed(2)),
          change: parseFloat((quote.regularMarketChange || 0).toFixed(2)),
          changePercent: parseFloat((quote.regularMarketChangePercent || 0).toFixed(2)),
          dayHigh: parseFloat((quote.regularMarketDayHigh || 0).toFixed(2)),
          dayLow: parseFloat((quote.regularMarketDayLow || 0).toFixed(2)),
          volume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap,
          lastUpdated: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Yahoo Finance fetch failed:', error);
      return null;
    }
  }

  private static async fetchAlternativeNSEData(symbol: string, mapping: any): Promise<IndexData | null> {
    try {
      // Try alternative NSE data source
      const nseUrl = `https://api.kite.trade/quote/nse:${mapping.nseName.replace(' ', '')}`;
      const nseData = await this.fetchWithCORS(nseUrl);
      
      if (nseData && nseData.data) {
        const quote = nseData.data;
        return {
          symbol: symbol,
          name: mapping.displayName,
          price: parseFloat((quote.last_price || 0).toFixed(2)),
          change: parseFloat((quote.net_change || 0).toFixed(2)),
          changePercent: parseFloat(((quote.net_change / (quote.last_price - quote.net_change)) * 100 || 0).toFixed(2)),
          dayHigh: parseFloat((quote.ohlc?.high || 0).toFixed(2)),
          dayLow: parseFloat((quote.ohlc?.low || 0).toFixed(2)),
          volume: quote.volume || 0,
          lastUpdated: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Alternative NSE fetch failed:', error);
      return null;
    }
  }

  private static validateIndexData(data: IndexData): boolean {
    return !!(
      data &&
      data.price > 0 &&
      typeof data.change === 'number' &&
      typeof data.changePercent === 'number' &&
      data.symbol &&
      data.name
    );
  }

  private static parseStockMarketIndiaData(data: any, symbol: string, displayName: string): IndexData | null {
    try {
      // Parse Stock Market India API response
      if (data) {
        const price = parseFloat(data.lastPrice || data.last || data.close || data.ltp || 0);
        const change = parseFloat(data.change || data.netChange || data.chng || 0);
        const changePercent = parseFloat(data.pChange || data.changePercent || data.per_chng || 0);
        
        // Ensure we have valid numeric data
        if (price <= 0) {
          return null;
        }
        
        return {
          symbol: symbol,
          name: displayName,
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          dayHigh: parseFloat((data.dayHigh || data.high || data.dayhigh || price * 1.01).toFixed(2)),
          dayLow: parseFloat((data.dayLow || data.low || data.daylow || price * 0.99).toFixed(2)),
          volume: parseInt(data.totalTradedVolume || data.volume || data.vol || 0),
          lastUpdated: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing Stock Market India data:', error);
      return null;
    }
  }

  // Cache for reducing API calls with real-time consideration
  private static cache = new Map<string, { data: IndexData; timestamp: number }>();
  private static CACHE_DURATION = 15000; // 15 seconds cache for real-time feel
  private static refreshCallbacks = new Map<string, (() => void)[]>();

  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  static async getIndexDataWithCache(symbol: string): Promise<IndexData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached data for ${symbol}`);
      return cached.data;
    }

    console.log(`Fetching fresh data for ${symbol}`);
    // Fetch fresh data
    const data = await this.getIndexData(symbol);
    if (data) {
      this.cache.set(symbol, { data, timestamp: Date.now() });
      
      // Trigger any registered refresh callbacks
      const callbacks = this.refreshCallbacks.get(symbol) || [];
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in refresh callback:', error);
        }
      });
    }

    return data;
  }

  static registerRefreshCallback(symbol: string, callback: () => void): void {
    if (!this.refreshCallbacks.has(symbol)) {
      this.refreshCallbacks.set(symbol, []);
    }
    this.refreshCallbacks.get(symbol)?.push(callback);
  }

  static unregisterRefreshCallback(symbol: string, callback: () => void): void {
    const callbacks = this.refreshCallbacks.get(symbol);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('Stock data cache cleared');
  }

  static async getChartData(symbol: string, timeframe: string): Promise<ChartData[]> {
    try {
      const intervals: Record<string, string> = {
        '1D': '5m',
        '5D': '15m',
        '1M': '1d',
        '3M': '1d',
        '6M': '1d',
        '1Y': '1wk',
        '3Y': '1mo',
        '5Y': '1mo',
        'ALL': '1mo'
      };

      const ranges: Record<string, string> = {
        '1D': '1d',
        '5D': '5d',
        '1M': '1mo',
        '3M': '3mo',
        '6M': '6mo',
        '1Y': '1y',
        '3Y': '3y',
        '5Y': '5y',
        'ALL': 'max'
      };

      const interval = intervals[timeframe] || '1d';
      const range = ranges[timeframe] || '1y';

      const url = `${YAHOO_CHART_BASE}/${symbol}?interval=${interval}&range=${range}`;
      const data = await this.fetchWithCORS(url);

      if (!data.chart?.result?.[0]) {
        return [];
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const prices = result.indicators?.quote?.[0]?.close || [];

      return timestamps.map((timestamp: number, index: number) => ({
        timestamp: new Date(timestamp * 1000).toISOString(),
        price: prices[index] || 0,
        volume: result.indicators?.quote?.[0]?.volume?.[index]
      })).filter((item: ChartData) => item.price > 0);
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      return [];
    }
  }

  static async getIndexConstituents(symbol: string): Promise<CompanyData[]> {
    // This is a mock implementation since Yahoo Finance doesn't provide index constituents directly
    // In a real implementation, you would need a different API or data source for this
    try {
      // Mock data for demonstration
      const mockConstituents: CompanyData[] = [
        {
          symbol: 'RELIANCE.NS',
          name: 'Reliance Industries Ltd',
          marketCap: 1500000000000,
          price: 2500,
          change: 25,
          changePercent: 1.0,
          sector: 'Oil & Gas',
          industry: 'Refining'
        },
        {
          symbol: 'TCS.NS',
          name: 'Tata Consultancy Services Ltd',
          marketCap: 1200000000000,
          price: 3200,
          change: -15,
          changePercent: -0.47,
          sector: 'Information Technology',
          industry: 'IT Services'
        },
        {
          symbol: 'HDFCBANK.NS',
          name: 'HDFC Bank Ltd',
          marketCap: 800000000000,
          price: 1450,
          change: 10,
          changePercent: 0.69,
          sector: 'Financial Services',
          industry: 'Private Sector Bank'
        },
        {
          symbol: 'INFY.NS',
          name: 'Infosys Ltd',
          marketCap: 700000000000,
          price: 1650,
          change: 8,
          changePercent: 0.49,
          sector: 'Information Technology',
          industry: 'IT Services'
        },
        {
          symbol: 'ICICIBANK.NS',
          name: 'ICICI Bank Ltd',
          marketCap: 650000000000,
          price: 950,
          change: -5,
          changePercent: -0.52,
          sector: 'Financial Services',
          industry: 'Private Sector Bank'
        }
      ];

      return mockConstituents;
    } catch (error) {
      console.error(`Error fetching constituents for ${symbol}:`, error);
      return [];
    }
  }

  static formatIndianNumber(num: number): string {
    // Handle null/undefined/NaN values
    if (num == null || isNaN(num)) {
      return '₹0.00';
    }
    
    const numValue = Number(num);
    if (numValue >= 10000000) { // 1 crore
      return `₹${(numValue / 10000000).toFixed(2)} Cr`;
    } else if (numValue >= 100000) { // 1 lakh
      return `₹${(numValue / 100000).toFixed(2)} L`;
    } else if (numValue >= 1000) { // 1 thousand
      return `₹${(numValue / 1000).toFixed(2)} K`;
    }
    return `₹${numValue.toFixed(2)}`;
  }

  static formatNumber(num: number): string {
    // Handle null/undefined/NaN values
    if (num == null || isNaN(num)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(Number(num));
  }
}