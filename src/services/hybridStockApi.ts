import { IndexData } from '../types/stock';
import { AlphaVantageApiService } from './alphaVantageApi';
import { StockApiService } from './stockApi';

export class HybridStockApiService {
  private static useAlphaVantageApi = true;

  static async initialize(): Promise<void> {
    // Check if AlphaVantage API is configured
    const alphaVantageStatus = AlphaVantageApiService.getApiStatus();
    this.useAlphaVantageApi = alphaVantageStatus.configured;
    
    if (this.useAlphaVantageApi) {
      console.log('✅ Using AlphaVantage API for accurate real-time data');
    } else {
      console.log('⚠️ AlphaVantage API not configured, falling back to free APIs');
      if (!alphaVantageStatus.keyPresent) {
        console.log('💡 To get accurate data, add your AlphaVantage API key to .env file');
      }
    }
  }

  static async getIndexData(symbol: string): Promise<IndexData | null> {
    await this.initialize();

    if (this.useAlphaVantageApi) {
      try {
        const data = await AlphaVantageApiService.getIndexDataWithCache(symbol);
        if (data) {
          console.log(`✅ Got accurate data from AlphaVantage API for ${symbol}`);
          return data;
        }
      } catch (error) {
        console.warn(`AlphaVantage API failed for ${symbol}, falling back:`, error);
      }
    }

    // Fallback to free APIs
    console.log(`📊 Using free APIs for ${symbol} (may be less accurate)`);
    return await StockApiService.getIndexDataWithCache(symbol);
  }

  static async getBulkIndexData(symbols: string[]): Promise<Record<string, IndexData | null>> {
    await this.initialize();

    if (this.useAlphaVantageApi) {
      try {
        console.log(`🚀 Fetching bulk data for ${symbols.length} symbols using AlphaVantage API`);
        const data = await AlphaVantageApiService.getBulkIndexData(symbols);
        
        // Check if we got any data
        const successCount = Object.values(data).filter(Boolean).length;
        if (successCount > 0) {
          console.log(`✅ Got ${successCount}/${symbols.length} accurate results from AlphaVantage API`);
          return data;
        }
      } catch (error) {
        console.warn('AlphaVantage bulk API failed, falling back:', error);
      }
    }

    // Fallback to individual free API calls
    console.log(`📊 Using free APIs for ${symbols.length} symbols (may be less accurate)`);
    const results: Record<string, IndexData | null> = {};
    
    // Process in smaller batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(async symbol => {
        const data = await StockApiService.getIndexDataWithCache(symbol);
        return { symbol, data };
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results[result.value.symbol] = result.value.data;
        }
      });
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
    const alphaVantageStatus = AlphaVantageApiService.getApiStatus();
    const missingCredentials: string[] = [];
    
    if (!alphaVantageStatus.keyPresent) missingCredentials.push('AlphaVantage API Key');
    
    if (alphaVantageStatus.configured) {
      return {
        primary: 'AlphaVantage API',
        configured: true,
        accuracy: 'Professional Grade - Exchange Licensed Data',
        cost: 'Free tier available, Premium from $49.99/month',
        setupRequired: false,
        missingCredentials: []
      };
    } else {
      return {
        primary: 'Free APIs (Yahoo Finance, NSE)',
        configured: false,
        accuracy: 'Basic (may have delays/inaccuracies)',
        cost: 'Free',
        setupRequired: missingCredentials.length > 0,
        missingCredentials
      };
    }
  }

  static clearCache(): void {
    AlphaVantageApiService.clearCache();
    StockApiService.clearCache();
  }

  static formatNumber = StockApiService.formatNumber;
  static formatIndianNumber = StockApiService.formatIndianNumber;
}