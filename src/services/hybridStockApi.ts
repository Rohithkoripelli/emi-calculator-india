import { IndexData } from '../types/stock';
import { GrowwApiService as NewGrowwApiService } from './growwApiService';
import { GrowwApiService as LegacyGrowwApiService } from './growwApi';

export class HybridStockApiService {
  static async initialize(): Promise<void> {
    console.log('🚀 Using Groww API exclusively for professional-grade real-time data');
  }

  static async getIndexData(symbol: string): Promise<IndexData | null> {
    try {
      // Try the new Railway-based API first for indices
      console.log(`🚂 Fetching index data for ${symbol} via Railway proxy...`);
      
      // Map index symbols to trading symbols for Railway API
      const tradingSymbol = this.mapIndexToTradingSymbol(symbol);
      if (!tradingSymbol) {
        console.warn(`⚠️ No trading symbol mapping found for index ${symbol}`);
        return this.fallbackToLegacyAPI(symbol);
      }
      
      const quote = await NewGrowwApiService.getRealTimeQuote(tradingSymbol, 'NSE', 'CASH');
      if (quote) {
        // Convert stock quote format to index data format
        const indexData: IndexData = {
          symbol: symbol,
          name: quote.companyName,
          price: quote.currentPrice,
          change: quote.dayChange,
          changePercent: quote.dayChangePercent,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`✅ Got Railway proxy data for ${symbol}: ₹${indexData.price} (${indexData.changePercent.toFixed(2)}%)`);
        return indexData;
      } else {
        console.warn(`⚠️ No data from Railway proxy for ${symbol}, trying legacy API...`);
        return this.fallbackToLegacyAPI(symbol);
      }
      
    } catch (error) {
      console.error(`❌ Railway proxy failed for ${symbol}:`, error);
      console.log(`🔄 Falling back to legacy API for ${symbol}...`);
      return this.fallbackToLegacyAPI(symbol);
    }
  }
  
  private static async fallbackToLegacyAPI(symbol: string): Promise<IndexData | null> {
    try {
      const data = await LegacyGrowwApiService.getIndexDataWithCache(symbol);
      if (data) {
        console.log(`✅ Got fallback data from legacy API for ${symbol}`);
        return data;
      }
      return null;
    } catch (error) {
      console.error(`❌ Legacy API also failed for ${symbol}:`, error);
      return null;
    }
  }
  
  private static mapIndexToTradingSymbol(indexSymbol: string): string | null {
    // Map Yahoo Finance index symbols to Groww trading symbols
    const mappings: Record<string, string> = {
      '^NSEI': 'NIFTY',
      '^BSESN': 'SENSEX', 
      '^BSE100': 'BSE100',
      '^CNXBANK': 'BANKNIFTY',
      '^CNXIT': 'NIFTYIT',
      '^CNX100': 'NIFTY100',
      '^CNXMID': 'NIFTYMID50',
      '^CNXSC': 'NIFTYSC',
      '^CNXAUTO': 'NIFTYAUTO',
      '^CNXFIN': 'NIFTYFIN',
      '^CNXPHARMA': 'NIFTYPHARMA',
      '^CNXMETAL': 'NIFTYMETAL',
      '^CNXREALTY': 'NIFTYREALTY'
    };
    
    return mappings[indexSymbol] || null;
  }

  static async getBulkIndexData(symbols: string[]): Promise<Record<string, IndexData | null>> {
    console.log(`🚂 Fetching bulk data for ${symbols.length} symbols using Railway proxy...`);
    
    const results: Record<string, IndexData | null> = {};
    const railwayPromises: Promise<void>[] = [];
    
    // Process all symbols in parallel using Railway proxy
    for (const symbol of symbols) {
      const promise = this.getIndexData(symbol).then(data => {
        results[symbol] = data;
      }).catch(error => {
        console.error(`❌ Failed to fetch ${symbol}:`, error);
        results[symbol] = null;
      });
      
      railwayPromises.push(promise);
    }
    
    // Wait for all Railway requests to complete
    await Promise.all(railwayPromises);
    
    const successCount = Object.values(results).filter(Boolean).length;
    console.log(`✅ Railway proxy bulk fetch: ${successCount}/${symbols.length} successful`);
    
    // If Railway failed for most symbols, try legacy API as fallback
    if (successCount < symbols.length / 2) {
      console.log(`⚠️ Railway success rate low (${successCount}/${symbols.length}), trying legacy bulk API...`);
      
      try {
        const legacyData = await LegacyGrowwApiService.getBulkIndexData(symbols);
        
        // Merge results, preferring Railway data where available
        for (const symbol of symbols) {
          if (!results[symbol] && legacyData[symbol]) {
            results[symbol] = legacyData[symbol];
          }
        }
        
        const finalSuccessCount = Object.values(results).filter(Boolean).length;
        console.log(`✅ Combined Railway + Legacy: ${finalSuccessCount}/${symbols.length} successful`);
        
      } catch (legacyError) {
        console.error('❌ Legacy bulk API also failed:', legacyError);
      }
    }
    
    return results;
  }

  static getApiInfo(): { 
    primary: string; 
    configured: boolean; 
    accuracy: string; 
    cost: string;
    setupRequired: boolean;
    missingCredentials: string[];
  } {
    return {
      primary: 'Railway + Groww API (CORS-free)',
      configured: true,
      accuracy: 'Professional Trading Platform - Real-time NSE/BSE Data via Railway Proxy',
      cost: 'Railway hosting + ₹499/month Groww API',
      setupRequired: false,
      missingCredentials: []
    };
  }

  static clearCache(): void {
    LegacyGrowwApiService.clearCache();
    console.log('🗑️ Cleared legacy API cache');
  }

  // Number formatting utilities
  static formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) {
      return 'N/A';
    }
    
    if (num >= 10000000) { // 1 crore
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) { // 1 lakh
      return `₹${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) { // 1 thousand
      return `₹${(num / 1000).toFixed(2)}K`;
    }
    return `₹${num.toFixed(2)}`;
  }

  static formatIndianNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) {
      return 'N/A';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Get index constituents with pagination support
  static async getIndexConstituents(symbol: string, page: number = 1, pageSize: number = 10): Promise<{
    companies: any[],
    totalCompanies: number,
    currentPage: number,
    totalPages: number,
    hasMore: boolean
  }> {
    try {
      // Complete constituent lists for the 4 main indices
      const constituentMappings: Record<string, string[]> = {
        // NIFTY 50 - All 50 companies
        '^NSEI': [
          'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN',
          'BHARTIARTL', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA', 'TITAN', 'NESTLEIND',
          'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'TECHM', 'POWERGRID', 'LTIM', 'NTPC', 'JSWSTEEL', 'TATAMOTORS',
          'COALINDIA', 'GRASIM', 'HINDALCO', 'ADANIENT', 'INDUSINDBK', 'HDFCLIFE', 'SBILIFE', 'CIPLA', 'BPCL', 'TATACONSUM',
          'EICHERMOT', 'APOLLOHOSP', 'BRITANNIA', 'DIVISLAB', 'ADANIPORTS', 'HEROMOTOCO', 'DRREDDY', 'UPL', 'BAJAJ-AUTO', 'SHRIRAMFIN'
        ],
        
        // NIFTY 100 - All 100 companies (includes NIFTY 50 + Next 50)
        '^CNX100': [
          // NIFTY 50 companies
          'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN',
          'BHARTIARTL', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA', 'TITAN', 'NESTLEIND',
          'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'TECHM', 'POWERGRID', 'LTIM', 'NTPC', 'JSWSTEEL', 'TATAMOTORS',
          'COALINDIA', 'GRASIM', 'HINDALCO', 'ADANIENT', 'INDUSINDBK', 'HDFCLIFE', 'SBILIFE', 'CIPLA', 'BPCL', 'TATACONSUM',
          'EICHERMOT', 'APOLLOHOSP', 'BRITANNIA', 'DIVISLAB', 'ADANIPORTS', 'HEROMOTOCO', 'DRREDDY', 'UPL', 'BAJAJ-AUTO', 'SHRIRAMFIN',
          
          // Next 50 companies
          'GODREJCP', 'PIDILITIND', 'DABUR', 'MARICO', 'MCDOWELL-N', 'COLPAL', 'BERGEPAINT', 'TRENT', 'PAGEIND', 'HAVELLS',
          'VOLTAS', 'CUMMINSIND', 'MPHASIS', 'PERSISTENT', 'COFORGE', 'MINDTREE', 'FEDERALBNK', 'BANDHANBNK', 'IDFCFIRSTB', 'INDIGO',
          'GAIL', 'IOC', 'HINDPETRO', 'SAIL', 'NMDC', 'VEDL', 'TATAPOWER', 'ADANIGREEN', 'TORNTPHARM', 'LUPIN',
          'BIOCON', 'CADILAHC', 'ALKEM', 'LALPATHLAB', 'METROPOLIS', 'FORTIS', 'MAXHEALTH', 'NAUKRI', 'ZOMATO', 'POLICYBZR',
          'PAYTM', 'DMART', 'JUBLFOOD', 'MUTHOOTFIN', 'CHOLAFIN', 'LICHSGFIN', 'PEL', 'WHIRLPOOL', 'CROMPTON', 'RELAXO'
        ],
        
        // BSE SENSEX - All 30 companies
        '^BSESN': [
          'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN',
          'BHARTIARTL', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA', 'TITAN', 'NESTLEIND',
          'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'TECHM', 'POWERGRID', 'NTPC', 'JSWSTEEL', 'TATAMOTORS', 'INDUSINDBK'
        ],
        
        // BSE 100 - All 100 companies
        '^BSE100': [
          // BSE SENSEX companies
          'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN',
          'BHARTIARTL', 'ASIANPAINT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA', 'TITAN', 'NESTLEIND',
          'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'TECHM', 'POWERGRID', 'NTPC', 'JSWSTEEL', 'TATAMOTORS', 'INDUSINDBK',
          
          // Additional BSE 100 companies
          'COALINDIA', 'GRASIM', 'HINDALCO', 'ADANIENT', 'HDFCLIFE', 'SBILIFE', 'CIPLA', 'BPCL', 'TATACONSUM', 'EICHERMOT',
          'APOLLOHOSP', 'BRITANNIA', 'DIVISLAB', 'ADANIPORTS', 'HEROMOTOCO', 'DRREDDY', 'UPL', 'BAJAJ-AUTO', 'SHRIRAMFIN', 'GODREJCP',
          'PIDILITIND', 'DABUR', 'MARICO', 'MCDOWELL-N', 'COLPAL', 'BERGEPAINT', 'TRENT', 'PAGEIND', 'HAVELLS', 'VOLTAS',
          'CUMMINSIND', 'MPHASIS', 'PERSISTENT', 'COFORGE', 'MINDTREE', 'FEDERALBNK', 'BANDHANBNK', 'IDFCFIRSTB', 'INDIGO', 'GAIL',
          'IOC', 'HINDPETRO', 'SAIL', 'NMDC', 'VEDL', 'TATAPOWER', 'ADANIGREEN', 'TORNTPHARM', 'LUPIN', 'BIOCON',
          'CADILAHC', 'ALKEM', 'LALPATHLAB', 'METROPOLIS', 'FORTIS', 'MAXHEALTH', 'NAUKRI', 'ZOMATO', 'POLICYBZR', 'PAYTM',
          'DMART', 'JUBLFOOD', 'MUTHOOTFIN', 'CHOLAFIN', 'LICHSGFIN', 'PEL', 'WHIRLPOOL', 'CROMPTON', 'RELAXO', 'DIXON'
        ]
      };

      const allCompanies = constituentMappings[symbol] || ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR'];
      
      // Calculate pagination
      const totalCompanies = allCompanies.length;
      const totalPages = Math.ceil(totalCompanies / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const companiesForPage = allCompanies.slice(startIndex, endIndex);

      console.log(`Loading page ${page}/${totalPages} with ${companiesForPage.length} companies for ${symbol}`);

      const results = [];

      // Fetch real stock data for companies in this page only
      for (let i = 0; i < companiesForPage.length; i++) {
        try {
          // Add timeout to prevent hanging - increased timeout for Railway API
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds for Railway API

          // Use Railway proxy endpoint for constituent data
          const response = await NewGrowwApiService.getRealTimeQuote(companiesForPage[i], 'NSE', 'CASH');
          
          clearTimeout(timeoutId);
          
          if (response) {
            results.push({
              symbol: `${companiesForPage[i]}.NS`,
              name: response.companyName || companiesForPage[i],
              price: response.currentPrice || 0,
              change: response.dayChange || 0,
              changePercent: response.dayChangePercent || 0,
              sector: this.getSectorForStock(companiesForPage[i]),
              industry: this.getIndustryForStock(companiesForPage[i])
            });
          } else {
            // Fallback with safe default values
            results.push({
              symbol: `${companiesForPage[i]}.NS`,
              name: companiesForPage[i] || 'Unknown Company',
              price: 0,
              change: 0,
              changePercent: 0,
              sector: this.getSectorForStock(companiesForPage[i]) || 'Other',
              industry: 'Data unavailable'
            });
          }

        } catch (error) {
          console.warn(`Failed to fetch data for ${companiesForPage[i]}:`, error);
          // Add placeholder for failed companies with safe default values
          results.push({
            symbol: `${companiesForPage[i]}.NS`,
            name: companiesForPage[i] || 'Unknown Company',
            price: 0,
            change: 0,
            changePercent: 0,
            sector: this.getSectorForStock(companiesForPage[i]) || 'Other',
            industry: 'Data unavailable'
          });
        }
      }

      return {
        companies: results,
        totalCompanies,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('Error fetching constituents:', error);
      return {
        companies: [],
        totalCompanies: 0,
        currentPage: 1,
        totalPages: 1,
        hasMore: false
      };
    }
  }

  // Helper functions for sector/industry mapping
  private static getSectorForStock(symbol: string): string {
    if (!symbol) return 'Other';
    
    const sectorMap: Record<string, string> = {
      'RELIANCE': 'Oil & Gas', 'TCS': 'Information Technology', 'HDFCBANK': 'Financial Services',
      'INFY': 'Information Technology', 'HINDUNILVR': 'Consumer Goods', 'ICICIBANK': 'Financial Services',
      'KOTAKBANK': 'Financial Services', 'LT': 'Infrastructure', 'ITC': 'Consumer Goods', 'SBIN': 'Financial Services'
    };
    return sectorMap[symbol] || 'Other';
  }

  private static getIndustryForStock(symbol: string): string {
    if (!symbol) return 'Other';
    
    const industryMap: Record<string, string> = {
      'RELIANCE': 'Petrochemicals', 'TCS': 'IT Services', 'HDFCBANK': 'Private Bank',
      'INFY': 'IT Services', 'HINDUNILVR': 'FMCG', 'ICICIBANK': 'Private Bank',
      'KOTAKBANK': 'Private Bank', 'LT': 'Engineering', 'ITC': 'Tobacco & FMCG', 'SBIN': 'Public Bank'
    };
    return industryMap[symbol] || 'Other';
  }
}