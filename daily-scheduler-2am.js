/**
 * DAILY 2 AM SCHEDULER
 * Runs comprehensive stock updates every day at 2 AM
 * Can be deployed on Railway/Heroku for 24/7 operation
 */

const cron = require('node-cron');
const { MongoClient } = require('mongodb');

const ATLAS_URI = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'intelligent_portfolio';

class DailyStockScheduler {
  constructor() {
    this.isRunning = false;
    console.log('🕐 Daily Stock Scheduler initialized');
    console.log('⏰ Scheduled for 2:00 AM IST daily');
  }

  async runStockUpdate() {
    if (this.isRunning) {
      console.log('⚠️ Stock update already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting scheduled incremental update at', new Date().toISOString());

    try {
      // Run incremental updates that preserve existing documents
      const { exec } = require('child_process');
      
      await new Promise((resolve, reject) => {
        exec('node real-data-fetcher-2600.js', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Scheduled real data update failed:', error);
            reject(error);
          } else {
            console.log('✅ Scheduled real data update completed successfully');
            console.log(stdout);
            resolve();
          }
        });
      });

      // Log successful update
      const client = new MongoClient(ATLAS_URI);
      await client.connect();
      const db = client.db(DB_NAME);
      
      await db.collection('update_logs').insertOne({
        type: 'SCHEDULED_DAILY_UPDATE',
        timestamp: new Date(),
        status: 'SUCCESS',
        nextScheduled: this.getNextScheduledTime()
      });

      await client.close();
      
    } catch (error) {
      console.error('💥 Scheduled update failed:', error);
      
      // Log failed update
      try {
        const client = new MongoClient(ATLAS_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        
        await db.collection('update_logs').insertOne({
          type: 'SCHEDULED_DAILY_UPDATE',
          timestamp: new Date(),
          status: 'FAILED',
          error: error.message,
          nextScheduled: this.getNextScheduledTime()
        });

        await client.close();
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    } finally {
      this.isRunning = false;
    }
  }

  getNextScheduledTime() {
    const now = new Date();
    const next = new Date();
    next.setHours(2, 0, 0, 0); // 2:00 AM
    
    if (next <= now) {
      next.setDate(next.getDate() + 1); // Next day if already past 2 AM
    }
    
    return next;
  }

  start() {
    console.log('🎯 Starting Daily Stock Scheduler...');
    
    // Schedule for 2:00 AM IST daily
    // Cron format: minute hour day month weekday
    const cronExpression = '0 2 * * *'; // Every day at 2:00 AM
    
    cron.schedule(cronExpression, async () => {
      await this.runStockUpdate();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // IST timezone
    });

    console.log('✅ Scheduler started successfully');
    console.log(`📅 Next update scheduled for: ${this.getNextScheduledTime().toLocaleString('en-IN')}`);
    
    // Keep the process alive
    console.log('🔄 Scheduler running... (Press Ctrl+C to stop)');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down scheduler...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      process.exit(0);
    });
  }

  // Method to run immediate update (for testing)
  async runImmediateUpdate() {
    console.log('🔥 Running immediate update...');
    await this.runStockUpdate();
  }
}

// Create and start scheduler
const scheduler = new DailyStockScheduler();

// Check if running with immediate flag
if (process.argv.includes('--immediate')) {
  scheduler.runImmediateUpdate()
    .then(() => {
      console.log('✅ Immediate update completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Immediate update failed:', error);
      process.exit(1);
    });
} else {
  scheduler.start();
}

module.exports = scheduler;