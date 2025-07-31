import { IndexData, CompanyData, ChartData } from '../types/stock';

// Multiple API endpoints for accuracy
const NSE_API_BASE = 'https://www.nseindia.com/api';
const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_BASE = 'https://query1.finance.yahoo.com/v1/finance/quote';

// CORS proxy for development (replace with your own backend in production)
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

// Alpha Vantage API (free tier available)
const ALPHA_VANTAGE_KEY = 'demo'; // Replace with actual key
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

export class StockApiService {
  private static async fetchWithCORS(url: string): Promise<any> {
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        try {
          return JSON.parse(data.contents);
        } catch {
          return data.contents;
        }
      }
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  private static async fetchNSEData(symbol: string): Promise<any> {
    try {
      // Try NSE API first for most accurate data
      const nseSymbol = symbol.replace('^', '').replace('NSE', '').replace('BSE', '');
      const url = `${NSE_API_BASE}/equity-stockIndices?index=${nseSymbol}`;
      return await this.fetchWithCORS(url);
    } catch (error) {
      console.error('NSE API failed:', error);
      return null;
    }
  }

  static async getIndexData(symbol: string): Promise<IndexData | null> {
    // Try multiple data sources for accuracy
    let indexData = null;
    
    try {
      // First try NSE API for Indian indices
      if (symbol.includes('NSE') || symbol.includes('CNX') || symbol.includes('NIFTY')) {
        indexData = await this.fetchNSEData(symbol);
        if (indexData) {
          return this.parseNSEIndexData(indexData, symbol);
        }
      }
      
      // Fallback to Yahoo Finance
      const url = `${YAHOO_QUOTE_BASE}?symbols=${symbol}`;
      const data = await this.fetchWithCORS(url);
      
      if (!data.quoteResponse?.result?.[0]) {
        return this.getMockData(symbol); // Return mock data if all APIs fail
      }

      const quote = data.quoteResponse.result[0];
      
      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        dayHigh: quote.regularMarketDayHigh || 0,
        dayLow: quote.regularMarketDayLow || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching index data for ${symbol}:`, error);
      return this.getMockData(symbol); // Return mock data if all APIs fail
    }
  }

  private static parseNSEIndexData(data: any, symbol: string): IndexData | null {
    try {
      // Parse NSE API response
      if (data && data.data && data.data.length > 0) {
        const indexInfo = data.data[0];
        return {
          symbol: symbol,
          name: indexInfo.indexName || 'Unknown Index',
          price: parseFloat(indexInfo.last) || 0,
          change: parseFloat(indexInfo.netChange) || 0,
          changePercent: parseFloat(indexInfo.pChange) || 0,
          dayHigh: parseFloat(indexInfo.dayHigh) || 0,
          dayLow: parseFloat(indexInfo.dayLow) || 0,
          volume: parseInt(indexInfo.totalTradedVolume) || 0,
          lastUpdated: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing NSE data:', error);
      return null;
    }
  }

  private static getMockData(symbol: string): IndexData {
    // Provide realistic mock data with current market context
    const mockData: Record<string, Partial<IndexData>> = {
      '^NSEI': { name: 'NIFTY 50', price: 24667.85, change: 142.75, changePercent: 0.58 },
      '^BSESN': { name: 'BSE SENSEX', price: 81086.21, change: 454.11, changePercent: 0.56 },
      '^CNXBANK': { name: 'NIFTY Bank', price: 53247.30, change: 298.65, changePercent: 0.56 },
      '^CNXIT': { name: 'NIFTY IT', price: 42156.25, change: -156.45, changePercent: -0.37 },
      '^CNX100': { name: 'NIFTY 100', price: 25567.80, change: 134.20, changePercent: 0.53 },
      '^CNX500': { name: 'NIFTY 500', price: 23845.60, change: 118.35, changePercent: 0.50 },
    };

    const base = mockData[symbol] || { 
      name: symbol.replace('^', '').replace('CNX', 'NIFTY '), 
      price: 15000 + Math.random() * 10000, 
      change: (Math.random() - 0.5) * 200,
      changePercent: (Math.random() - 0.5) * 2
    };

    return {
      symbol,
      name: base.name!,
      price: base.price!,
      change: base.change!,
      changePercent: base.changePercent!,
      dayHigh: base.price! * (1 + Math.random() * 0.02),
      dayLow: base.price! * (1 - Math.random() * 0.02),
      volume: Math.floor(Math.random() * 1000000),
      lastUpdated: new Date().toISOString()
    };
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
    if (num >= 10000000) { // 1 crore
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) { // 1 lakh
      return `₹${(num / 100000).toFixed(2)} L`;
    } else if (num >= 1000) { // 1 thousand
      return `₹${(num / 1000).toFixed(2)} K`;
    }
    return `₹${num.toFixed(2)}`;
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }
}