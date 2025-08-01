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
}