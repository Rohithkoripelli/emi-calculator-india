/**
 * Data Scheduler Service
 * Manages automated data fetching schedules for stock prices and fundamentals
 */

import StockDataFetcher from './stockDataFetcher';
import StockDatabaseService from './stockDatabaseService';

interface SchedulerConfig {
  priceUpdateInterval: number;    // in milliseconds (default: 1 hour)
  fundamentalUpdateInterval: number; // in milliseconds (default: 24 hours)
  maxPriceUpdatesPerRun: number; // limit to prevent API overload
  maxFundamentalUpdatesPerRun: number;
  enabled: boolean;
}

class DataScheduler {
  private static instance: DataScheduler | null = null;
  private priceUpdateTimer: NodeJS.Timeout | null = null;
  private fundamentalUpdateTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  private config: SchedulerConfig = {
    priceUpdateInterval: 60 * 60 * 1000,      // 1 hour
    fundamentalUpdateInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxPriceUpdatesPerRun: 50,               // 50 stocks per run
    maxFundamentalUpdatesPerRun: 20,         // 20 stocks per run (respecting screener.in limits)
    enabled: true
  };

  private constructor() {}

  static getInstance(): DataScheduler {
    if (!DataScheduler.instance) {
      DataScheduler.instance = new DataScheduler();
    }
    return DataScheduler.instance;
  }

  /**
   * Start automated data fetching schedules
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Data scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⚠️ Data scheduler is disabled');
      return;
    }

    console.log('🚀 Starting automated data scheduler...');
    this.isRunning = true;

    // Initial data fetch
    await this.performInitialDataFetch();

    // Schedule price updates (every hour)
    this.priceUpdateTimer = setInterval(async () => {
      try {
        await this.scheduledPriceUpdate();
      } catch (error) {
        console.error('❌ Error in scheduled price update:', error);
      }
    }, this.config.priceUpdateInterval);

    // Schedule fundamental updates (every 24 hours, but staggered)
    this.fundamentalUpdateTimer = setInterval(async () => {
      try {
        await this.scheduledFundamentalUpdate();
      } catch (error) {
        console.error('❌ Error in scheduled fundamental update:', error);
      }
    }, this.config.fundamentalUpdateInterval);

    console.log(`✅ Data scheduler started with intervals:`);
    console.log(`   - Price updates: every ${this.config.priceUpdateInterval / 60000} minutes`);
    console.log(`   - Fundamental updates: every ${this.config.fundamentalUpdateInterval / 3600000} hours`);
  }

  /**
   * Stop automated data fetching schedules
   */
  stop(): void {
    console.log('🛑 Stopping data scheduler...');
    
    if (this.priceUpdateTimer) {
      clearInterval(this.priceUpdateTimer);
      this.priceUpdateTimer = null;
    }

    if (this.fundamentalUpdateTimer) {
      clearInterval(this.fundamentalUpdateTimer);
      this.fundamentalUpdateTimer = null;
    }

    this.isRunning = false;
    console.log('✅ Data scheduler stopped');
  }

  /**
   * Perform initial data fetch when starting the system
   */
  private async performInitialDataFetch(): Promise<void> {
    console.log('🔄 Performing initial data fetch...');
    
    try {
      const stats = await StockDatabaseService.getStats();
      console.log(`📊 Current database status:`, {
        totalStocks: stats.totalStocks,
        stocksWithPrices: stats.stocksWithPrices,
        stocksWithFundamentals: stats.stocksWithFundamentals
      });

      // If we have very little data, initialize with essential stocks
      if (stats.stocksWithFundamentals < 10) {
        console.log('📈 Initializing with essential stocks...');
        await StockDataFetcher.initializeEssentialStocks();
      } else {
        // Otherwise, just update existing data
        console.log('🔄 Updating existing stock data...');
        await this.scheduledPriceUpdate();
        await this.scheduledFundamentalUpdate();
      }

    } catch (error) {
      console.error('❌ Error in initial data fetch:', error);
    }
  }

  /**
   * Scheduled price update task
   */
  private async scheduledPriceUpdate(): Promise<void> {
    console.log(`🔄 Running scheduled price update...`);
    
    try {
      const stocksNeedingPrices = await StockDatabaseService.getStocksNeedingPriceUpdate();
      
      if (stocksNeedingPrices.length === 0) {
        console.log('✅ All stocks have recent price data');
        return;
      }

      // Limit the number of stocks to update per run
      const symbolsToUpdate = stocksNeedingPrices.slice(0, this.config.maxPriceUpdatesPerRun);
      
      console.log(`📊 Updating prices for ${symbolsToUpdate.length} stocks (${stocksNeedingPrices.length} total need updates)`);
      
      const result = await StockDataFetcher.bulkUpdatePrices(symbolsToUpdate);
      
      console.log(`✅ Price update completed: ${result.successful} successful, ${result.failed} failed in ${(result.duration/1000).toFixed(1)}s`);
      
    } catch (error) {
      console.error('❌ Error in scheduled price update:', error);
    }
  }

  /**
   * Scheduled fundamental update task
   */
  private async scheduledFundamentalUpdate(): Promise<void> {
    console.log(`🔄 Running scheduled fundamental update...`);
    
    try {
      const stocksNeedingFundamentals = await StockDatabaseService.getStocksNeedingFundamentalUpdate();
      
      if (stocksNeedingFundamentals.length === 0) {
        console.log('✅ All stocks have recent fundamental data');
        return;
      }

      // Limit the number of stocks to update per run (respect screener.in rate limits)
      const symbolsToUpdate = stocksNeedingFundamentals.slice(0, this.config.maxFundamentalUpdatesPerRun);
      
      console.log(`📊 Updating fundamentals for ${symbolsToUpdate.length} stocks (${stocksNeedingFundamentals.length} total need updates)`);
      
      const result = await StockDataFetcher.bulkUpdateFundamentals(symbolsToUpdate, 50); // Daily limit of 50
      
      console.log(`✅ Fundamental update completed: ${result.successful} successful, ${result.failed} failed in ${(result.duration/1000).toFixed(1)}s`);
      
    } catch (error) {
      console.error('❌ Error in scheduled fundamental update:', error);
    }
  }

  /**
   * Manual trigger for immediate data update
   */
  async triggerImmediateUpdate(type: 'prices' | 'fundamentals' | 'both' = 'both'): Promise<void> {
    console.log(`🚀 Triggering immediate ${type} update...`);
    
    try {
      if (type === 'prices' || type === 'both') {
        await this.scheduledPriceUpdate();
      }
      
      if (type === 'fundamentals' || type === 'both') {
        await this.scheduledFundamentalUpdate();
      }
      
      console.log(`✅ Manual ${type} update completed`);
      
    } catch (error) {
      console.error(`❌ Error in manual ${type} update:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
    nextPriceUpdate: Date | null;
    nextFundamentalUpdate: Date | null;
    rateLimitStats: any;
  } {
    const now = new Date();
    
    return {
      isRunning: this.isRunning,
      config: this.config,
      nextPriceUpdate: this.priceUpdateTimer ? 
        new Date(now.getTime() + this.config.priceUpdateInterval) : null,
      nextFundamentalUpdate: this.fundamentalUpdateTimer ? 
        new Date(now.getTime() + this.config.fundamentalUpdateInterval) : null,
      rateLimitStats: StockDataFetcher.getRateLimitStats()
    };
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    console.log('🔧 Updating scheduler configuration...');
    
    const wasRunning = this.isRunning;
    
    // Stop scheduler if running
    if (wasRunning) {
      this.stop();
    }
    
    // Update configuration
    this.config = { ...this.config, ...newConfig };
    
    console.log('✅ Scheduler configuration updated:', this.config);
    
    // Restart if it was running
    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }

  /**
   * Enable/disable scheduler
   */
  setEnabled(enabled: boolean): void {
    if (enabled && !this.config.enabled) {
      this.config.enabled = true;
      this.start();
    } else if (!enabled && this.config.enabled) {
      this.config.enabled = false;
      this.stop();
    }
  }

  /**
   * Get data freshness report
   */
  async getDataFreshnessReport(): Promise<{
    priceData: {
      total: number;
      fresh: number; // Updated within last hour
      stale: number; // Older than 1 hour
      veryStale: number; // Older than 24 hours
    };
    fundamentalData: {
      total: number;
      fresh: number; // Updated within last 24 hours
      stale: number; // Older than 24 hours
      veryStale: number; // Older than 7 days
    };
    lastUpdate: Date | null;
  }> {
    try {
      const stats = await StockDatabaseService.getStats();
      const now = new Date();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      const oneWeek = 7 * oneDay;

      // For simplicity, using aggregated stats
      // In a real implementation, you might want more detailed queries
      
      return {
        priceData: {
          total: stats.totalStocks,
          fresh: stats.recentPriceUpdates,
          stale: stats.totalStocks - stats.recentPriceUpdates,
          veryStale: 0 // Would need separate query
        },
        fundamentalData: {
          total: stats.totalStocks,
          fresh: stats.recentFundamentalUpdates,
          stale: stats.totalStocks - stats.recentFundamentalUpdates,
          veryStale: 0 // Would need separate query
        },
        lastUpdate: stats.lastUpdate
      };
      
    } catch (error) {
      console.error('❌ Error getting data freshness report:', error);
      throw error;
    }
  }
}

export default DataScheduler;