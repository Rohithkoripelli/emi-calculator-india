/**
 * Production Scheduling System
 * Manages automated execution of data fetching for 2619 stocks
 * 
 * Schedule:
 * - Stock Prices: Every 6 hours (4 times per day)
 * - Stock Fundamentals: Every 24 hours (once per day)
 * - Stock Scoring: After each fundamental update
 */

import ProductionDataFetcher from './productionDataFetcher';
import StockScoringService from './stockScoringService';
import StockDatabaseService from './stockDatabaseService';

interface ScheduledJob {
  id: string;
  name: string;
  type: 'PRICES' | 'FUNDAMENTALS' | 'SCORING';
  schedule: string; // Cron-like expression
  intervalMs: number;
  lastRun: Date | null;
  nextRun: Date | null;
  isRunning: boolean;
  successCount: number;
  failureCount: number;
  timer: NodeJS.Timeout | null;
}

interface SchedulerStatus {
  isActive: boolean;
  totalJobs: number;
  runningJobs: number;
  nextExecution: Date | null;
  uptime: number;
  totalExecutions: number;
  successRate: number;
}

export class ProductionScheduler {
  private static instance: ProductionScheduler | null = null;
  private jobs: Map<string, ScheduledJob> = new Map();
  private isActive = false;
  private startTime: Date | null = null;
  private totalExecutions = 0;
  private totalSuccesses = 0;

  private constructor() {}

  static getInstance(): ProductionScheduler {
    if (!ProductionScheduler.instance) {
      ProductionScheduler.instance = new ProductionScheduler();
    }
    return ProductionScheduler.instance;
  }

  /**
   * Start the production scheduling system
   */
  async startProductionScheduling(): Promise<void> {
    if (this.isActive) {
      console.log('⚠️ Production scheduler is already running');
      return;
    }

    console.log('🚀 Starting Production Scheduling System for 2619 stocks...');
    console.log('=' .repeat(70));
    
    this.isActive = true;
    this.startTime = new Date();

    // Initialize all scheduled jobs
    await this.initializeJobs();

    // Start all jobs
    this.startAllJobs();

    console.log('✅ Production scheduler started successfully');
    this.logSchedule();
  }

  /**
   * Initialize all production jobs
   */
  private async initializeJobs(): Promise<void> {
    // Job 1: Stock Prices - Every 6 hours
    const priceJob: ScheduledJob = {
      id: 'price-fetcher',
      name: 'Stock Price Updates',
      type: 'PRICES',
      schedule: '0 */6 * * *', // Every 6 hours
      intervalMs: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
      lastRun: null,
      nextRun: this.getNextRunTime(6 * 60 * 60 * 1000),
      isRunning: false,
      successCount: 0,
      failureCount: 0,
      timer: null
    };

    // Job 2: Stock Fundamentals - Every 24 hours
    const fundamentalJob: ScheduledJob = {
      id: 'fundamental-fetcher',
      name: 'Stock Fundamental Updates',
      type: 'FUNDAMENTALS',
      schedule: '0 2 * * *', // Every day at 2 AM
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      lastRun: null,
      nextRun: this.getNext2AM(),
      isRunning: false,
      successCount: 0,
      failureCount: 0,
      timer: null
    };

    // Job 3: Stock Scoring - After fundamental updates
    const scoringJob: ScheduledJob = {
      id: 'stock-scorer',
      name: 'Stock Scoring Calculation',
      type: 'SCORING',
      schedule: 'after-fundamentals',
      intervalMs: 0, // Triggered by fundamentals job
      lastRun: null,
      nextRun: null,
      isRunning: false,
      successCount: 0,
      failureCount: 0,
      timer: null
    };

    this.jobs.set(priceJob.id, priceJob);
    this.jobs.set(fundamentalJob.id, fundamentalJob);
    this.jobs.set(scoringJob.id, scoringJob);

    console.log(`📅 Initialized ${this.jobs.size} production jobs`);
  }

  /**
   * Start all scheduled jobs
   */
  private startAllJobs(): void {
    for (const [jobId, job] of this.jobs) {
      if (job.type !== 'SCORING') { // Scoring is triggered by fundamentals
        this.scheduleJob(job);
      }
    }
  }

  /**
   * Schedule a specific job
   */
  private scheduleJob(job: ScheduledJob): void {
    if (job.timer) {
      clearTimeout(job.timer);
    }

    const now = Date.now();
    const nextRunTime = job.nextRun?.getTime() || now;
    const delay = Math.max(0, nextRunTime - now);

    console.log(`⏰ Scheduling ${job.name} to run in ${Math.floor(delay / 1000 / 60)} minutes`);

    job.timer = setTimeout(async () => {
      await this.executeJob(job);
      // Reschedule for next execution
      job.nextRun = this.getNextRunTime(job.intervalMs);
      this.scheduleJob(job);
    }, delay);
  }

  /**
   * Execute a specific job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    if (job.isRunning) {
      console.log(`⚠️ Job ${job.name} is already running, skipping execution`);
      return;
    }

    console.log(`\n🚀 EXECUTING: ${job.name}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('=' .repeat(50));

    job.isRunning = true;
    job.lastRun = new Date();
    this.totalExecutions++;

    try {
      let result;

      switch (job.type) {
        case 'PRICES':
          result = await ProductionDataFetcher.fetchAllStockPrices();
          break;
        
        case 'FUNDAMENTALS':
          result = await ProductionDataFetcher.fetchAllStockFundamentals();
          // Trigger scoring job after fundamentals
          await this.triggerScoringJob();
          break;
        
        case 'SCORING':
          await StockScoringService.calculateAllStockScores();
          result = { successful: 1, failed: 0 }; // Simple result for scoring
          break;
        
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Log successful execution
      job.successCount++;
      this.totalSuccesses++;
      
      console.log(`✅ ${job.name} completed successfully`);
      if (result && 'successful' in result) {
        console.log(`📊 Result: ${result.successful} successful, ${result.failed} failed`);
      }

      // Log to database
      await this.logJobExecution(job, 'SUCCESS', result);

    } catch (error) {
      job.failureCount++;
      console.error(`❌ ${job.name} failed: ${error}`);
      
      // Log failure to database
      await this.logJobExecution(job, 'FAILURE', { error: String(error) });
    } finally {
      job.isRunning = false;
      console.log(`⏱️ ${job.name} finished at: ${new Date().toLocaleString()}`);
      console.log('=' .repeat(50));
    }
  }

  /**
   * Trigger scoring job (called after fundamentals update)
   */
  private async triggerScoringJob(): Promise<void> {
    const scoringJob = this.jobs.get('stock-scorer');
    if (scoringJob) {
      console.log('\n🎯 Triggering stock scoring after fundamental updates...');
      await this.executeJob(scoringJob);
    }
  }

  /**
   * Get next run time based on interval
   */
  private getNextRunTime(intervalMs: number): Date {
    return new Date(Date.now() + intervalMs);
  }

  /**
   * Get next 2 AM time for fundamental updates
   */
  private getNext2AM(): Date {
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    // If 2 AM today has passed, schedule for tomorrow
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    return next2AM;
  }

  /**
   * Stop the production scheduling system
   */
  stopProductionScheduling(): void {
    if (!this.isActive) {
      console.log('⚠️ Production scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Production Scheduling System...');

    // Clear all timers
    for (const [jobId, job] of this.jobs) {
      if (job.timer) {
        clearTimeout(job.timer);
        job.timer = null;
      }
    }

    this.isActive = false;
    console.log('✅ Production scheduler stopped');
  }

  /**
   * Get current scheduler status
   */
  getStatus(): SchedulerStatus {
    const runningJobs = Array.from(this.jobs.values()).filter(job => job.isRunning).length;
    const nextExecution = this.getNextExecutionTime();
    const uptime = this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0;
    const successRate = this.totalExecutions > 0 ? (this.totalSuccesses / this.totalExecutions) * 100 : 100;

    return {
      isActive: this.isActive,
      totalJobs: this.jobs.size,
      runningJobs,
      nextExecution,
      uptime,
      totalExecutions: this.totalExecutions,
      successRate
    };
  }

  /**
   * Get next scheduled execution time
   */
  private getNextExecutionTime(): Date | null {
    let nextExecution: Date | null = null;

    for (const job of this.jobs.values()) {
      if (job.nextRun && (!nextExecution || job.nextRun < nextExecution)) {
        nextExecution = job.nextRun;
      }
    }

    return nextExecution;
  }

  /**
   * Get detailed job information
   */
  getJobDetails(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Log schedule information
   */
  private logSchedule(): void {
    console.log('\n📅 PRODUCTION SCHEDULE:');
    console.log('=' .repeat(50));

    for (const job of this.jobs.values()) {
      console.log(`📋 ${job.name}:`);
      console.log(`   Type: ${job.type}`);
      console.log(`   Schedule: ${job.schedule}`);
      if (job.nextRun) {
        console.log(`   Next Run: ${job.nextRun.toLocaleString()}`);
      }
      console.log(`   Success/Failure: ${job.successCount}/${job.failureCount}`);
      console.log('');
    }

    console.log('💡 The system will automatically:');
    console.log('   • Update stock prices every 6 hours');
    console.log('   • Update fundamentals every 24 hours at 2 AM');
    console.log('   • Recalculate stock scores after fundamental updates');
    console.log('   • Respect rate limits (8.5s for prices, 10s for fundamentals)');
    console.log('   • Process all 2619 stocks systematically');
  }

  /**
   * Log job execution to database
   */
  private async logJobExecution(job: ScheduledJob, status: 'SUCCESS' | 'FAILURE', result: any): Promise<void> {
    try {
      // This would typically log to a database - for now just console
      const logEntry = {
        jobId: job.id,
        jobName: job.name,
        jobType: job.type,
        status,
        executionTime: new Date(),
        result,
        totalExecutions: this.totalExecutions,
        successRate: this.totalExecutions > 0 ? (this.totalSuccesses / this.totalExecutions) * 100 : 100
      };

      console.log(`📝 Job execution logged: ${job.name} - ${status}`);
    } catch (error) {
      console.error(`❌ Failed to log job execution: ${error}`);
    }
  }

  /**
   * Force execute a specific job immediately (for testing/manual triggers)
   */
  async forceExecuteJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    console.log(`🔧 Force executing job: ${job.name}`);
    await this.executeJob(job);
  }

  /**
   * Run initial data population (first-time setup)
   */
  async runInitialDataPopulation(): Promise<void> {
    console.log('🏗️ Running initial data population for 2619 stocks...');
    console.log('⚠️ This is a one-time setup that will take several hours');
    
    try {
      // Full refresh: prices + fundamentals + scoring
      const result = await ProductionDataFetcher.performFullRefresh();
      
      console.log('🎉 Initial data population completed!');
      console.log(`✅ Success Rate: ${((result.successful / result.totalProcessed) * 100).toFixed(1)}%`);
      console.log('🚀 Production scheduler is now ready to maintain the data');
      
    } catch (error) {
      console.error(`❌ Initial data population failed: ${error}`);
      throw error;
    }
  }
}

export default ProductionScheduler;