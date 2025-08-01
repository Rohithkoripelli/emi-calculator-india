import { IndexData } from '../types/stock';
import { GrowwApiService } from './growwApi';

export class HybridStockApiService {
  static async initialize(): Promise<void> {
    console.log('🚀 Using Groww API exclusively for professional-grade real-time data');
  }

  static async getIndexData(symbol: string): Promise<IndexData | null> {
    try {
      const data = await GrowwApiService.getIndexDataWithCache(symbol);
      if (data) {
        console.log(`✅ Got professional data from Groww API for ${symbol}`);
        return data;
      } else {
        console.warn(`⚠️ No data available for ${symbol} from Groww API`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Groww API failed for ${symbol}:`, error);
      return null;
    }
  }

  static async getBulkIndexData(symbols: string[]): Promise<Record<string, IndexData | null>> {
    try {
      console.log(`🚀 Fetching bulk data for ${symbols.length} symbols using Groww API exclusively`);
      const data = await GrowwApiService.getBulkIndexData(symbols);
      
      const successCount = Object.values(data).filter(Boolean).length;
      console.log(`✅ Got ${successCount}/${symbols.length} professional results from Groww API`);
      
      return data;
    } catch (error) {
      console.error('❌ Groww bulk API failed:', error);
      
      // Return empty results for all symbols
      const results: Record<string, IndexData | null> = {};
      symbols.forEach(symbol => {
        results[symbol] = null;
      });
      return results;
    }
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
      primary: 'Groww API (Exclusive)',
      configured: true,
      accuracy: 'Professional Trading Platform - Real-time NSE/BSE Data',
      cost: '₹499 + taxes per month',
      setupRequired: false,
      missingCredentials: []
    };
  }

  static clearCache(): void {
    GrowwApiService.clearCache();
  }

  // Number formatting utilities
  static formatNumber(num: number): string {
    if (num >= 10000000) { // 1 crore
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) { // 1 lakh
      return `₹${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) { // 1 thousand
      return `₹${(num / 1000).toFixed(2)}K`;
    }
    return `₹${num.toFixed(2)}`;
  }

  static formatIndianNumber(num: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Get index constituents with real stock data from Groww API
  static async getIndexConstituents(symbol: string): Promise<any[]> {
    try {
      // Major constituents for different indices (top companies)
      const constituentMappings: Record<string, string[]> = {
        '^NSEI': ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN'],
        '^BSESN': ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'LT', 'ITC', 'SBIN'],
        '^CNXBANK': ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK', 'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'PNB', 'BANKBARODA'],
        '^CNXIT': ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'MPHASIS', 'PERSISTENT', 'COFORGE', 'MINDTREE']
      };

      const companies = constituentMappings[symbol] || ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR'];
      const results = [];

      // Fetch real stock data for each company
      for (let i = 0; i < Math.min(companies.length, 10); i++) { // Limit to 10 companies
        try {
          const response = await fetch('/api/groww-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              symbols: [companies[i]], 
              type: 'stock' // Different type for individual stocks
            })
          });

          if (response.ok) {
            const data = await response.json();
            const stockData = data.data?.[companies[i]];
            
            if (stockData) {
              results.push({
                symbol: `${companies[i]}.NS`,
                name: stockData.name || companies[i],
                marketCap: stockData.marketCap || 0,
                price: stockData.price || 0,
                change: stockData.change || 0,
                changePercent: stockData.changePercent || 0,
                sector: this.getSectorForStock(companies[i]),
                industry: this.getIndustryForStock(companies[i])
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${companies[i]}:`, error);
        }
      }

      // If no real data, return realistic mock data with disclaimer
      if (results.length === 0) {
        return [
          {
            symbol: 'SAMPLE.NS',
            name: 'Sample Company Ltd',
            marketCap: 1000000000000,
            price: 2500,
            change: 25,
            changePercent: 1.0,
            sector: 'Note',
            industry: 'Real company data requires separate API subscription'
          }
        ];
      }

      return results;
    } catch (error) {
      console.error('Error fetching constituents:', error);
      return [];
    }
  }

  // Helper functions for sector/industry mapping
  private static getSectorForStock(symbol: string): string {
    const sectorMap: Record<string, string> = {
      'RELIANCE': 'Oil & Gas', 'TCS': 'Information Technology', 'HDFCBANK': 'Financial Services',
      'INFY': 'Information Technology', 'HINDUNILVR': 'Consumer Goods', 'ICICIBANK': 'Financial Services',
      'KOTAKBANK': 'Financial Services', 'LT': 'Infrastructure', 'ITC': 'Consumer Goods', 'SBIN': 'Financial Services'
    };
    return sectorMap[symbol] || 'Other';
  }

  private static getIndustryForStock(symbol: string): string {
    const industryMap: Record<string, string> = {
      'RELIANCE': 'Petrochemicals', 'TCS': 'IT Services', 'HDFCBANK': 'Private Bank',
      'INFY': 'IT Services', 'HINDUNILVR': 'FMCG', 'ICICIBANK': 'Private Bank',
      'KOTAKBANK': 'Private Bank', 'LT': 'Engineering', 'ITC': 'Tobacco & FMCG', 'SBIN': 'Public Bank'
    };
    return industryMap[symbol] || 'Other';
  }
}