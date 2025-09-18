/**
 * Cron-based Data Scheduler
 * Schedules automatic data fetching at specific times (11 AM daily)
 */

import StockDataFetcher from './stockDataFetcher';
import StockDatabaseService from './stockDatabaseService';

interface CronJob {
  id: string;
  schedule: string;
  description: string;
  isRunning: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  timer: NodeJS.Timeout | null;
}

class CronScheduler {
  private static instance: CronScheduler | null = null;
  private jobs: Map<string, CronJob> = new Map();

  private constructor() {}

  static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  /**
   * Start the 11 AM daily data fetching schedule
   */
  async startDailyDataFetch(): Promise<void> {
    console.log('📅 Setting up daily data fetch at 11:00 AM...');

    // Stop existing job if running
    this.stopJob('daily-data-fetch');

    const job: CronJob = {
      id: 'daily-data-fetch',
      schedule: '0 11 * * *', // Daily at 11:00 AM
      description: 'Daily stock data fetching (prices + fundamentals)',
      isRunning: false,
      lastRun: null,
      nextRun: this.getNext11AM(),
      timer: null
    };

    // Schedule the job
    const timeUntilNext11AM = this.getTimeUntilNext11AM();
    
    job.timer = setTimeout(async () => {
      await this.executeDailyDataFetch();
      
      // Schedule next execution (24 hours later)
      this.scheduleRecurring(job);
    }, timeUntilNext11AM);

    this.jobs.set(job.id, job);

    console.log(`✅ Daily data fetch scheduled for: ${job.nextRun?.toLocaleString('en-IN')}`);
    console.log(`⏰ Time until next fetch: ${this.formatDuration(timeUntilNext11AM)}`);
  }

  /**
   * Execute the daily data fetching routine
   */
  private async executeDailyDataFetch(): Promise<void> {
    const job = this.jobs.get('daily-data-fetch');
    if (!job) return;

    console.log('\n🚀 Starting daily data fetch at 11:00 AM...');
    console.log('=' .repeat(60));

    try {
      job.isRunning = true;
      job.lastRun = new Date();

      // Get current database status
      const initialStats = await StockDatabaseService.getStats();
      console.log(`📊 Initial status: ${initialStats.stocksWithFundamentals} stocks with fundamentals`);

      // Step 1: Update fundamentals (daily priority)
      console.log('\n📈 Step 1: Updating stock fundamentals...');
      const stocksNeedingFundamentals = await StockDatabaseService.getStocksNeedingFundamentalUpdate();
      
      if (stocksNeedingFundamentals.length > 0) {
        console.log(`   Found ${stocksNeedingFundamentals.length} stocks needing fundamental updates`);
        
        // Process in batches to respect rate limits (max 100 per day)
        const batchSize = Math.min(50, stocksNeedingFundamentals.length); // Conservative batch
        const batch = stocksNeedingFundamentals.slice(0, batchSize);
        
        const fundamentalResult = await StockDataFetcher.bulkUpdateFundamentals(batch, 100);
        console.log(`   ✅ Fundamentals updated: ${fundamentalResult.successful} successful, ${fundamentalResult.failed} failed`);
      } else {
        console.log('   ✅ All stocks have recent fundamental data');
      }

      // Step 2: Update prices (hourly, but run during daily as well)
      console.log('\n💰 Step 2: Updating stock prices...');
      const stocksNeedingPrices = await StockDatabaseService.getStocksNeedingPriceUpdate();
      
      if (stocksNeedingPrices.length > 0) {
        console.log(`   Found ${stocksNeedingPrices.length} stocks needing price updates`);
        
        // Update prices for stocks with fundamentals first
        const priceResult = await StockDataFetcher.bulkUpdatePrices(stocksNeedingPrices.slice(0, 100));
        console.log(`   ✅ Prices updated: ${priceResult.successful} successful, ${priceResult.failed} failed`);
      } else {
        console.log('   ✅ All stocks have recent price data');
      }

      // Step 3: Initialize missing stocks if database is sparse
      const finalStats = await StockDatabaseService.getStats();
      if (finalStats.stocksWithFundamentals < 20) {
        console.log('\n🌱 Step 3: Initializing essential stocks...');
        await StockDataFetcher.initializeEssentialStocks();
      }

      // Final status report
      const endStats = await StockDatabaseService.getStats();
      console.log('\n📊 Daily fetch completed successfully:');
      console.log(`   Total stocks: ${endStats.totalStocks}`);
      console.log(`   Stocks with prices: ${endStats.stocksWithPrices}`);
      console.log(`   Stocks with fundamentals: ${endStats.stocksWithFundamentals}`);
      console.log(`   Recent price updates: ${endStats.recentPriceUpdates}`);
      console.log(`   Recent fundamental updates: ${endStats.recentFundamentalUpdates}`);

    } catch (error) {
      console.error('❌ Daily data fetch failed:', error);
    } finally {
      job.isRunning = false;
      job.nextRun = this.getNext11AM();
      console.log(`\n⏰ Next daily fetch scheduled for: ${job.nextRun?.toLocaleString('en-IN')}`);
    }
  }

  /**
   * Schedule recurring execution
   */
  private scheduleRecurring(job: CronJob): void {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    job.timer = setTimeout(async () => {
      await this.executeDailyDataFetch();
      this.scheduleRecurring(job); // Schedule next execution
    }, twentyFourHours);

    job.nextRun = new Date(Date.now() + twentyFourHours);
  }

  /**
   * Get time until next 11 AM
   */
  private getTimeUntilNext11AM(): number {
    const now = new Date();
    const next11AM = this.getNext11AM();
    return next11AM.getTime() - now.getTime();
  }

  /**
   * Get next 11 AM date
   */
  private getNext11AM(): Date {
    const now = new Date();
    const next11AM = new Date();
    
    next11AM.setHours(11, 0, 0, 0); // 11:00:00.000
    
    // If 11 AM has already passed today, schedule for tomorrow
    if (next11AM <= now) {
      next11AM.setDate(next11AM.getDate() + 1);
    }
    
    return next11AM;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && job.timer) {
      clearTimeout(job.timer);
      job.timer = null;
      job.isRunning = false;
      console.log(`🛑 Stopped job: ${job.description}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    console.log('🛑 Stopping all scheduled jobs...');
    
    for (const [jobId, job] of this.jobs) {
      if (job.timer) {
        clearTimeout(job.timer);
        job.timer = null;
        job.isRunning = false;
      }
    }
    
    this.jobs.clear();
    console.log('✅ All jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getJobStatus(): Array<{
    id: string;
    description: string;
    isRunning: boolean;
    lastRun: string | null;
    nextRun: string | null;
    timeUntilNext: string | null;
  }> {
    const status = [];
    
    for (const [jobId, job] of this.jobs) {
      const now = new Date();
      const timeUntilNext = job.nextRun ? 
        this.formatDuration(job.nextRun.getTime() - now.getTime()) : null;
      
      status.push({
        id: job.id,
        description: job.description,
        isRunning: job.isRunning,
        lastRun: job.lastRun?.toLocaleString('en-IN') || null,
        nextRun: job.nextRun?.toLocaleString('en-IN') || null,
        timeUntilNext
      });
    }
    
    return status;
  }

  /**
   * Trigger immediate execution of daily fetch (for testing)
   */
  async triggerImmediateDailyFetch(): Promise<void> {
    console.log('🚀 Triggering immediate daily data fetch...');
    await this.executeDailyDataFetch();
  }

  /**
   * Schedule additional custom jobs
   */
  scheduleCustomJob(
    id: string,
    description: string,
    delayMs: number,
    callback: () => Promise<void>
  ): void {
    this.stopJob(id); // Stop existing job if any

    const job: CronJob = {
      id,
      description,
      schedule: 'custom',
      isRunning: false,
      lastRun: null,
      nextRun: new Date(Date.now() + delayMs),
      timer: setTimeout(async () => {
        job.isRunning = true;
        job.lastRun = new Date();
        
        try {
          await callback();
        } catch (error) {
          console.error(`❌ Custom job ${id} failed:`, error);
        } finally {
          job.isRunning = false;
          this.jobs.delete(id);
        }
      }, delayMs)
    };

    this.jobs.set(id, job);
    console.log(`✅ Custom job scheduled: ${description} in ${this.formatDuration(delayMs)}`);
  }
}

export default CronScheduler;