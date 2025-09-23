/**
 * Stock Data Fetcher Service
 * Rate-limited data fetching from Groww API and Screener.in with MongoDB integration
 */

import { GrowwApiService } from './growwApiService';
import { ScreenerDataService } from './screenerDataService';
import StockDatabaseService from './stockDatabaseService';
import { 
  StockUpdateResult, 
  BulkUpdateResult, 
  DataUpdateLog, 
  StockFundamentals 
} from './stockDataModels';

class StockDataFetcher {
  private static lastScreenerCall = 0;
  private static readonly SCREENER_DELAY = 6000; // 6 seconds = 10 symbols per minute
  private static readonly GROWW_DELAY = 100; // 100ms between Groww API calls
  private static lastGrowwCall = 0;
  
  // Rate limiting statistics
  private static screenerCallsToday = 0;
  private static growwCallsToday = 0;
  private static lastResetDate = new Date().toDateString();
  
  /**
   * Reset daily counters if needed
   */
  private static resetDailyCountersIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.screenerCallsToday = 0;
      this.growwCallsToday = 0;
      this.lastResetDate = today;
      console.log(`📅 Reset daily API call counters for ${today}`);
    }
  }

  /**
   * Apply rate limiting for screener.in (10 symbols per minute max)
   */
  private static async applyScreenerRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastScreenerCall;
    
    if (timeSinceLastCall < this.SCREENER_DELAY) {
      const delayNeeded = this.SCREENER_DELAY - timeSinceLastCall;
      console.log(`⏳ Screener.in rate limiting: waiting ${delayNeeded}ms (10 symbols/minute limit)`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastScreenerCall = Date.now();
    this.screenerCallsToday++;
  }

  /**
   * Apply rate limiting for Groww API
   */
  private static async applyGrowwRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastGrowwCall;
    
    if (timeSinceLastCall < this.GROWW_DELAY) {
      const delayNeeded = this.GROWW_DELAY - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastGrowwCall = Date.now();
    this.growwCallsToday++;
  }

  /**
   * Fetch and update price data for a single stock
   */
  static async updateStockPrice(symbol: string): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      symbol,
      priceUpdated: false,
      fundamentalsUpdated: false,
      errors: [],
      lastUpdate: new Date()
    };

    try {
      console.log(`💰 Fetching price for ${symbol}...`);
      
      await this.applyGrowwRateLimit();
      
      const quote = await GrowwApiService.getRealTimeQuote(symbol);
      
      if (quote) {
        const success = await StockDatabaseService.updateStockPrice(symbol, {
          price: quote.currentPrice,
          dayChange: quote.dayChange,
          dayChangePercent: quote.dayChangePercent,
          volume: quote.volume
        });
        
        if (success) {
          result.priceUpdated = true;
          console.log(`✅ Updated price for ${symbol}: ₹${quote.currentPrice} (${quote.dayChangePercent > 0 ? '+' : ''}${quote.dayChangePercent.toFixed(2)}%)`);
        } else {
          result.errors.push('Failed to save price to database');
        }
      } else {
        result.errors.push('No quote data received from Groww API');
      }
    } catch (error) {
      const errorMsg = `Error fetching price: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg} for ${symbol}`);
    }

    return result;
  }

  /**
   * Fetch and update fundamental data for a single stock
   */
  static async updateStockFundamentals(symbol: string): Promise<StockUpdateResult> {
    const result: StockUpdateResult = {
      symbol,
      priceUpdated: false,
      fundamentalsUpdated: false,
      errors: [],
      lastUpdate: new Date()
    };

    try {
      console.log(`📊 Fetching fundamentals for ${symbol}...`);
      
      await this.applyScreenerRateLimit();
      
      const fundamentals = await ScreenerDataService.getFinancialMetrics(symbol);
      
      if (fundamentals) {
        // Convert screener data to our StockFundamentals format
        const stockFundamentals: StockFundamentals = {
          peRatio: fundamentals.pe,
          pbRatio: fundamentals.pbv,
          roe: fundamentals.roe,
          roce: fundamentals.roce,
          debtToEquity: fundamentals.debtToEquity,
          revenueGrowth: fundamentals.revenueGrowth,
          profitGrowth: fundamentals.profitGrowth,
          dividendYield: fundamentals.dividendYield,
          currentRatio: fundamentals.currentRatio,
          eps: fundamentals.eps,
          bookValue: fundamentals.bookValue,
          marketCap: fundamentals.marketCap,
          faceValue: fundamentals.faceValue,
          evEbitda: fundamentals.evEbitda,
          quarterlyResults: fundamentals.quarterlyResults,
          shareholdingPattern: fundamentals.shareholdingPattern
        };
        
        const companyInfo = {
          name: fundamentals.companyName,
          sector: fundamentals.sector,
          industry: fundamentals.industry
        };
        
        const success = await StockDatabaseService.updateStockFundamentals(
          symbol, 
          stockFundamentals, 
          companyInfo
        );
        
        if (success) {
          result.fundamentalsUpdated = true;
          console.log(`✅ Updated fundamentals for ${symbol}: PE=${fundamentals.pe}, ROE=${fundamentals.roe}%, Market Cap=${fundamentals.marketCap}`);
        } else {
          result.errors.push('Failed to save fundamentals to database');
        }
      } else {
        result.errors.push('No fundamental data received from Screener.in');
      }
    } catch (error) {
      const errorMsg = `Error fetching fundamentals: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg} for ${symbol}`);
    }

    return result;
  }

  /**
   * Bulk update prices for multiple stocks
   */
  static async bulkUpdatePrices(symbols: string[]): Promise<BulkUpdateResult> {
    this.resetDailyCountersIfNeeded();
    
    const startTime = Date.now();
    const results: StockUpdateResult[] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let totalRequests = 0;
    
    console.log(`🔄 Starting bulk price update for ${symbols.length} stocks...`);
    
    for (const symbol of symbols) {
      try {
        const result = await this.updateStockPrice(symbol);
        results.push(result);
        totalRequests++;
        
        if (result.priceUpdated) {
          successful++;
        } else if (result.errors.length > 0) {
          failed++;
        } else {
          skipped++;
        }
        
        // Progress logging
        if (totalRequests % 10 === 0) {
          console.log(`📊 Progress: ${totalRequests}/${symbols.length} stocks processed`);
        }
        
      } catch (error) {
        console.error(`❌ Critical error updating ${symbol}:`, error);
        failed++;
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const bulkResult: BulkUpdateResult = {
      totalRequested: symbols.length,
      successful,
      failed,
      skipped,
      results,
      duration,
      rateLimit: {
        requestsMade: totalRequests,
        averageDelay: totalRequests > 0 ? duration / totalRequests : 0
      }
    };
    
    // Log the operation
    await StockDatabaseService.logUpdate({
      type: 'PRICE_UPDATE',
      status: failed === 0 ? 'SUCCESS' : (successful > 0 ? 'PARTIAL' : 'FAILED'),
      recordsUpdated: successful,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      errors: results.filter(r => r.errors.length > 0).map(r => `${r.symbol}: ${r.errors.join(', ')}`),
      rateLimit: {
        requestsMade: totalRequests,
        delayApplied: this.GROWW_DELAY
      }
    });
    
    console.log(`✅ Bulk price update completed: ${successful} successful, ${failed} failed, ${skipped} skipped in ${duration}ms`);
    
    return bulkResult;
  }

  /**
   * Bulk update fundamentals for multiple stocks (respecting daily limits)
   */
  static async bulkUpdateFundamentals(symbols: string[], maxDaily: number = 500): Promise<BulkUpdateResult> {
    this.resetDailyCountersIfNeeded();
    
    // Check daily limit
    if (this.screenerCallsToday >= maxDaily) {
      console.warn(`⚠️ Daily screener.in limit reached (${this.screenerCallsToday}/${maxDaily}). Skipping fundamental updates.`);
      return {
        totalRequested: symbols.length,
        successful: 0,
        failed: 0,
        skipped: symbols.length,
        results: [],
        duration: 0,
        rateLimit: {
          requestsMade: 0,
          averageDelay: 0
        }
      };
    }
    
    const startTime = Date.now();
    const results: StockUpdateResult[] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let totalRequests = 0;
    
    // Limit symbols to remaining daily quota
    const remainingQuota = maxDaily - this.screenerCallsToday;
    const symbolsToProcess = symbols.slice(0, remainingQuota);
    
    console.log(`🔄 Starting bulk fundamental update for ${symbolsToProcess.length} stocks (quota: ${remainingQuota}/${maxDaily})...`);
    
    for (const symbol of symbolsToProcess) {
      try {
        const result = await this.updateStockFundamentals(symbol);
        results.push(result);
        totalRequests++;
        
        if (result.fundamentalsUpdated) {
          successful++;
        } else if (result.errors.length > 0) {
          failed++;
        } else {
          skipped++;
        }
        
        // Progress logging
        if (totalRequests % 5 === 0) {
          console.log(`📊 Progress: ${totalRequests}/${symbolsToProcess.length} stocks processed, ${this.screenerCallsToday} daily calls made`);
        }
        
      } catch (error) {
        console.error(`❌ Critical error updating ${symbol}:`, error);
        failed++;
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const bulkResult: BulkUpdateResult = {
      totalRequested: symbols.length,
      successful,
      failed,
      skipped: skipped + (symbols.length - symbolsToProcess.length), // Include quota-limited skips
      results,
      duration,
      rateLimit: {
        requestsMade: totalRequests,
        averageDelay: totalRequests > 0 ? duration / totalRequests : 0
      }
    };
    
    // Log the operation
    await StockDatabaseService.logUpdate({
      type: 'FUNDAMENTAL_UPDATE',
      status: failed === 0 ? 'SUCCESS' : (successful > 0 ? 'PARTIAL' : 'FAILED'),
      recordsUpdated: successful,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      errors: results.filter(r => r.errors.length > 0).map(r => `${r.symbol}: ${r.errors.join(', ')}`),
      rateLimit: {
        requestsMade: totalRequests,
        delayApplied: this.SCREENER_DELAY
      }
    });
    
    console.log(`✅ Bulk fundamental update completed: ${successful} successful, ${failed} failed, ${skipped} skipped in ${(duration/1000).toFixed(1)}s`);
    console.log(`📊 Daily usage: ${this.screenerCallsToday}/${maxDaily} screener.in calls, ${this.growwCallsToday} Groww calls`);
    
    return bulkResult;
  }

  /**
   * Auto-update routine: prices (hourly) and fundamentals (daily)
   */
  static async performAutoUpdate(): Promise<{
    priceUpdate: BulkUpdateResult;
    fundamentalUpdate: BulkUpdateResult;
  }> {
    console.log(`🤖 Starting automated data update routine...`);
    
    // Get stocks needing updates
    const stocksNeedingPrices = await StockDatabaseService.getStocksNeedingPriceUpdate();
    const stocksNeedingFundamentals = await StockDatabaseService.getStocksNeedingFundamentalUpdate();
    
    console.log(`📊 Update requirements: ${stocksNeedingPrices.length} need price updates, ${stocksNeedingFundamentals.length} need fundamental updates`);
    
    // Update prices first (faster)
    const priceUpdate = await this.bulkUpdatePrices(stocksNeedingPrices);
    
    // Then update fundamentals (slower, rate-limited)
    const fundamentalUpdate = await this.bulkUpdateFundamentals(stocksNeedingFundamentals, 500);
    
    // Get updated stats
    const stats = await StockDatabaseService.getStats();
    console.log(`📈 Database stats after update:`, stats);
    
    return {
      priceUpdate,
      fundamentalUpdate
    };
  }

  /**
   * Get rate limiting statistics
   */
  static getRateLimitStats(): {
    screenerCallsToday: number;
    growwCallsToday: number;
    screenerDelayMs: number;
    growwDelayMs: number;
    lastScreenerCall: Date;
    lastGrowwCall: Date;
  } {
    this.resetDailyCountersIfNeeded();
    
    return {
      screenerCallsToday: this.screenerCallsToday,
      growwCallsToday: this.growwCallsToday,
      screenerDelayMs: this.SCREENER_DELAY,
      growwDelayMs: this.GROWW_DELAY,
      lastScreenerCall: new Date(this.lastScreenerCall),
      lastGrowwCall: new Date(this.lastGrowwCall)
    };
  }

  /**
   * Initialize database with essential stocks
   */
  static async initializeEssentialStocks(): Promise<void> {
    console.log(`🚀 Initializing database with essential stocks...`);
    
    // Get all indices and extract unique symbols
    const indices = await StockDatabaseService.getAllIndices();
    const allSymbols = new Set<string>();
    
    indices.forEach(index => {
      index.stocks.forEach(symbol => allSymbols.add(symbol));
    });
    
    const symbolArray = Array.from(allSymbols);
    console.log(`📊 Found ${symbolArray.length} unique stocks across ${indices.length} indices`);
    
    // Update fundamentals for a subset first (respecting daily limits)
    const prioritySymbols = symbolArray.slice(0, 100); // Start with top 100
    const fundamentalResult = await this.bulkUpdateFundamentals(prioritySymbols, 100);
    
    // Update prices for all stocks with fundamentals
    const stocksWithFundamentals = fundamentalResult.results
      .filter(r => r.fundamentalsUpdated)
      .map(r => r.symbol);
    
    if (stocksWithFundamentals.length > 0) {
      await this.bulkUpdatePrices(stocksWithFundamentals);
    }
    
    console.log(`✅ Database initialization completed with ${stocksWithFundamentals.length} stocks`);
  }
}

export default StockDataFetcher;