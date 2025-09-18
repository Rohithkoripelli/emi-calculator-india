/**
 * Production-Scale Data Fetching System
 * Handles 2619 stocks with proper rate limiting and scheduling
 * 
 * Rate Limits:
 * - Prices: 2619 stocks / 6 hours = 7.3 stocks/minute = 1 stock every 8.2 seconds
 * - Fundamentals: 2619 stocks / 24 hours = 1 stock every 10 seconds (user specified)
 */

import { GrowwApiService } from './growwApiService';
import { ScreenerDataService } from './screenerDataService';
import StockDatabaseService from './stockDatabaseService';
import StockScoringService from './stockScoringService';

interface FetchingStats {
  totalStocks: number;
  completed: number;
  successful: number;
  failed: number;
  startTime: Date;
  estimatedTimeRemaining: number;
  currentStock: string;
  rateLimitDelays: number;
}

interface ProductionFetchResult {
  type: 'PRICES' | 'FUNDAMENTALS' | 'FULL_REFRESH';
  totalProcessed: number;
  successful: number;
  failed: number;
  duration: number;
  errors: string[];
  nextScheduledRun?: Date;
}

export class ProductionDataFetcher {
  private static readonly PRICE_RATE_LIMIT = 8500; // 8.5 seconds between price fetches (safe margin)
  private static readonly FUNDAMENTAL_RATE_LIMIT = 10000; // 10 seconds between fundamental fetches
  private static readonly BATCH_SIZE_PRICES = 50; // Process prices in batches
  private static readonly BATCH_SIZE_FUNDAMENTALS = 25; // Process fundamentals in smaller batches
  
  private static isRunning = false;
  private static currentOperation: string | null = null;
  private static stats: FetchingStats | null = null;

  /**
   * Fetch prices for all 2619 stocks (runs every 6 hours)
   */
  static async fetchAllStockPrices(): Promise<ProductionFetchResult> {
    if (this.isRunning) {
      throw new Error('Data fetching operation already in progress');
    }

    console.log('🚀 Starting production-scale price fetching for 2619 stocks...');
    console.log('⏱️  Rate limit: 1 stock every 8.5 seconds');
    
    this.isRunning = true;
    this.currentOperation = 'PRICES';
    
    const startTime = new Date();
    const allSymbols = await StockDatabaseService.getAllStockSymbols();
    
    console.log(`📊 Found ${allSymbols.length} stock symbols to process`);
    
    // Initialize stats
    this.stats = {
      totalStocks: allSymbols.length,
      completed: 0,
      successful: 0,
      failed: 0,
      startTime,
      estimatedTimeRemaining: allSymbols.length * this.PRICE_RATE_LIMIT / 1000,
      currentStock: '',
      rateLimitDelays: 0
    };

    const results: ProductionFetchResult = {
      type: 'PRICES',
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      duration: 0,
      errors: []
    };

    try {
      // Process in batches to manage memory and provide progress updates
      for (let i = 0; i < allSymbols.length; i += this.BATCH_SIZE_PRICES) {
        const batch = allSymbols.slice(i, i + this.BATCH_SIZE_PRICES);
        
        console.log(`\n📦 Processing price batch ${Math.floor(i / this.BATCH_SIZE_PRICES) + 1}/${Math.ceil(allSymbols.length / this.BATCH_SIZE_PRICES)}`);
        console.log(`📈 Symbols: ${batch.slice(0, 5).join(', ')}${batch.length > 5 ? '...' : ''}`);
        
        const batchResult = await this.processPriceBatch(batch);
        
        results.totalProcessed += batchResult.processed;
        results.successful += batchResult.successful;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);
        
        // Update stats
        this.stats.completed = results.totalProcessed;
        this.stats.successful = results.successful;
        this.stats.failed = results.failed;
        
        const progress = (results.totalProcessed / allSymbols.length) * 100;
        const elapsed = (Date.now() - startTime.getTime()) / 1000;
        const estimatedTotal = elapsed * (allSymbols.length / results.totalProcessed);
        this.stats.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
        
        console.log(`✅ Batch complete: ${batchResult.successful}/${batchResult.processed} successful`);
        console.log(`📊 Overall Progress: ${progress.toFixed(1)}% (${results.totalProcessed}/${allSymbols.length})`);
        console.log(`⏱️  ETA: ${Math.floor(this.stats.estimatedTimeRemaining / 60)}m ${Math.floor(this.stats.estimatedTimeRemaining % 60)}s`);
      }

      results.duration = (Date.now() - startTime.getTime()) / 1000;
      results.nextScheduledRun = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

      console.log(`\n🎉 Price fetching completed!`);
      console.log(`✅ Success: ${results.successful}/${results.totalProcessed} stocks`);
      console.log(`⏱️  Duration: ${Math.floor(results.duration / 60)}m ${Math.floor(results.duration % 60)}s`);
      console.log(`📅 Next run: ${results.nextScheduledRun.toLocaleString()}`);

    } catch (error) {
      console.error(`❌ Fatal error in price fetching: ${error}`);
      results.errors.push(`Fatal error: ${error}`);
    } finally {
      this.isRunning = false;
      this.currentOperation = null;
      this.stats = null;
    }

    return results;
  }

  /**
   * Fetch fundamentals for all 2619 stocks (runs every 24 hours)
   */
  static async fetchAllStockFundamentals(): Promise<ProductionFetchResult> {
    if (this.isRunning) {
      throw new Error('Data fetching operation already in progress');
    }

    console.log('🚀 Starting production-scale fundamental fetching for 2619 stocks...');
    console.log('⏱️  Rate limit: 1 stock every 10 seconds (respects screener.in limits)');
    
    this.isRunning = true;
    this.currentOperation = 'FUNDAMENTALS';
    
    const startTime = new Date();
    const allSymbols = await StockDatabaseService.getAllStockSymbols();
    
    console.log(`📊 Found ${allSymbols.length} stock symbols to process`);
    console.log(`⏱️  Estimated duration: ${Math.floor((allSymbols.length * 10) / 3600)}h ${Math.floor(((allSymbols.length * 10) % 3600) / 60)}m`);
    
    // Initialize stats
    this.stats = {
      totalStocks: allSymbols.length,
      completed: 0,
      successful: 0,
      failed: 0,
      startTime,
      estimatedTimeRemaining: allSymbols.length * 10, // 10 seconds per stock
      currentStock: '',
      rateLimitDelays: 0
    };

    const results: ProductionFetchResult = {
      type: 'FUNDAMENTALS',
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      duration: 0,
      errors: []
    };

    try {
      // Process in smaller batches for fundamentals due to longer processing time
      for (let i = 0; i < allSymbols.length; i += this.BATCH_SIZE_FUNDAMENTALS) {
        const batch = allSymbols.slice(i, i + this.BATCH_SIZE_FUNDAMENTALS);
        
        console.log(`\n📦 Processing fundamental batch ${Math.floor(i / this.BATCH_SIZE_FUNDAMENTALS) + 1}/${Math.ceil(allSymbols.length / this.BATCH_SIZE_FUNDAMENTALS)}`);
        console.log(`📈 Symbols: ${batch.slice(0, 3).join(', ')}${batch.length > 3 ? '...' : ''}`);
        
        const batchResult = await this.processFundamentalBatch(batch);
        
        results.totalProcessed += batchResult.processed;
        results.successful += batchResult.successful;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);
        
        // Update stats
        this.stats.completed = results.totalProcessed;
        this.stats.successful = results.successful;
        this.stats.failed = results.failed;
        
        const progress = (results.totalProcessed / allSymbols.length) * 100;
        const elapsed = (Date.now() - startTime.getTime()) / 1000;
        const estimatedTotal = elapsed * (allSymbols.length / results.totalProcessed);
        this.stats.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
        
        console.log(`✅ Batch complete: ${batchResult.successful}/${batchResult.processed} successful`);
        console.log(`📊 Overall Progress: ${progress.toFixed(1)}% (${results.totalProcessed}/${allSymbols.length})`);
        console.log(`⏱️  ETA: ${Math.floor(this.stats.estimatedTimeRemaining / 3600)}h ${Math.floor((this.stats.estimatedTimeRemaining % 3600) / 60)}m`);
      }

      results.duration = (Date.now() - startTime.getTime()) / 1000;
      results.nextScheduledRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      console.log(`\n🎉 Fundamental fetching completed!`);
      console.log(`✅ Success: ${results.successful}/${results.totalProcessed} stocks`);
      console.log(`⏱️  Duration: ${Math.floor(results.duration / 3600)}h ${Math.floor((results.duration % 3600) / 60)}m`);
      console.log(`📅 Next run: ${results.nextScheduledRun.toLocaleString()}`);

      // After fundamental fetching, recalculate all stock scores
      console.log('\n🎯 Recalculating stock scores with updated fundamental data...');
      await StockScoringService.calculateAllStockScores();

    } catch (error) {
      console.error(`❌ Fatal error in fundamental fetching: ${error}`);
      results.errors.push(`Fatal error: ${error}`);
    } finally {
      this.isRunning = false;
      this.currentOperation = null;
      this.stats = null;
    }

    return results;
  }

  /**
   * Process a batch of stocks for price updates
   */
  private static async processPriceBatch(symbols: string[]): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const result = { processed: 0, successful: 0, failed: 0, errors: [] };

    for (const symbol of symbols) {
      this.stats!.currentStock = symbol;
      
      try {
        console.log(`💰 Fetching price for ${symbol}...`);
        
        // Apply rate limiting
        if (result.processed > 0) {
          await this.delay(this.PRICE_RATE_LIMIT);
          this.stats!.rateLimitDelays++;
        }

        // Fetch price using existing GrowwApiService
        const quote = await GrowwApiService.getRealTimeQuote(symbol);
        
        if (quote) {
          // Update database with price data
          const success = await StockDatabaseService.updateStockPrice(symbol, {
            price: quote.currentPrice,
            dayChange: quote.dayChange,
            dayChangePercent: quote.dayChangePercent,
            volume: quote.volume
          });
          
          if (success) {
            result.successful++;
            console.log(`✅ ${symbol}: ₹${quote.currentPrice} (${quote.dayChangePercent > 0 ? '+' : ''}${quote.dayChangePercent.toFixed(2)}%)`);
          } else {
            result.failed++;
            result.errors.push(`${symbol}: Database update failed`);
            console.log(`❌ ${symbol}: Database update failed`);
          }
        } else {
          result.failed++;
          result.errors.push(`${symbol}: No price data received`);
          console.log(`⚠️ ${symbol}: No price data received`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`${symbol}: ${error}`);
        console.log(`❌ ${symbol}: Error - ${error}`);
      }
      
      result.processed++;
    }

    return result;
  }

  /**
   * Process a batch of stocks for fundamental updates
   */
  private static async processFundamentalBatch(symbols: string[]): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const result = { processed: 0, successful: 0, failed: 0, errors: [] };

    for (const symbol of symbols) {
      this.stats!.currentStock = symbol;
      
      try {
        console.log(`📊 Fetching fundamentals for ${symbol}...`);
        
        // Apply rate limiting (10 seconds between fundamental fetches)
        if (result.processed > 0) {
          await this.delay(this.FUNDAMENTAL_RATE_LIMIT);
          this.stats!.rateLimitDelays++;
        }

        // Fetch fundamentals using existing ScreenerDataService
        const fundamentals = await ScreenerDataService.getFinancialMetrics(symbol);
        
        if (fundamentals) {
          // Update database with fundamental data
          const success = await StockDatabaseService.updateStockFundamentals(symbol, {
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
          }, {
            name: fundamentals.companyName,
            sector: fundamentals.sector,
            industry: fundamentals.industry
          });
          
          if (success) {
            result.successful++;
            console.log(`✅ ${symbol}: PE=${fundamentals.pe}, ROE=${fundamentals.roe}%, Sector=${fundamentals.sector}`);
          } else {
            result.failed++;
            result.errors.push(`${symbol}: Database update failed`);
            console.log(`❌ ${symbol}: Database update failed`);
          }
        } else {
          result.failed++;
          result.errors.push(`${symbol}: No fundamental data received`);
          console.log(`⚠️ ${symbol}: No fundamental data received`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`${symbol}: ${error}`);
        console.log(`❌ ${symbol}: Error - ${error}`);
      }
      
      result.processed++;
    }

    return result;
  }

  /**
   * Full system refresh: fetch both prices and fundamentals, then recalculate scores
   */
  static async performFullRefresh(): Promise<ProductionFetchResult> {
    console.log('🔄 Starting full system refresh...');
    
    const startTime = new Date();
    
    try {
      // Step 1: Fetch all prices
      console.log('\n📈 Step 1: Fetching all stock prices...');
      const priceResult = await this.fetchAllStockPrices();
      
      // Step 2: Fetch all fundamentals  
      console.log('\n📊 Step 2: Fetching all stock fundamentals...');
      const fundamentalResult = await this.fetchAllStockFundamentals();
      
      // Step 3: Recalculate scores (already done in fetchAllStockFundamentals)
      console.log('\n🎯 Step 3: Stock scores recalculated');
      
      const totalDuration = (Date.now() - startTime.getTime()) / 1000;
      
      const result: ProductionFetchResult = {
        type: 'FULL_REFRESH',
        totalProcessed: priceResult.totalProcessed + fundamentalResult.totalProcessed,
        successful: priceResult.successful + fundamentalResult.successful,
        failed: priceResult.failed + fundamentalResult.failed,
        duration: totalDuration,
        errors: [...priceResult.errors, ...fundamentalResult.errors],
        nextScheduledRun: new Date(Date.now() + 6 * 60 * 60 * 1000) // Next price update in 6 hours
      };
      
      console.log('\n🎉 FULL SYSTEM REFRESH COMPLETED!');
      console.log(`✅ Total Success: ${result.successful} updates`);
      console.log(`❌ Total Failed: ${result.failed} updates`);
      console.log(`⏱️  Total Duration: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Fatal error in full refresh: ${error}`);
      throw error;
    }
  }

  /**
   * Get current fetching status
   */
  static getCurrentStatus(): FetchingStats | null {
    return this.stats;
  }

  /**
   * Check if fetching operation is running
   */
  static isOperationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current operation type
   */
  static getCurrentOperation(): string | null {
    return this.currentOperation;
  }

  /**
   * Utility function for rate limiting delays
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ProductionDataFetcher;