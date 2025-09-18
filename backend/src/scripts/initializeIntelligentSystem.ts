/**
 * Initialization Script for Intelligent Portfolio System
 * Sets up MongoDB, initializes data, and starts the scheduler
 */

import MongoDBConnection from '../config/mongodb';
import StockDatabaseService from '../services/stockDatabaseService';
import StockDataFetcher from '../services/stockDataFetcher';
import DataScheduler from '../services/dataScheduler';
import CronScheduler from '../services/cronScheduler';

interface InitializationResult {
  success: boolean;
  mongoConnected: boolean;
  dataInitialized: boolean;
  schedulerStarted: boolean;
  stats: any;
  errors: string[];
}

class IntelligentSystemInitializer {
  
  /**
   * Complete system initialization
   */
  static async initialize(options: {
    connectMongoDB?: boolean;
    initializeData?: boolean;
    startScheduler?: boolean;
    seedSampleData?: boolean;
    enableDailyCron?: boolean;
  } = {}): Promise<InitializationResult> {
    
    const {
      connectMongoDB = true,
      initializeData = true,
      startScheduler = true,
      seedSampleData = false,
      enableDailyCron = true
    } = options;

    const result: InitializationResult = {
      success: false,
      mongoConnected: false,
      dataInitialized: false,
      schedulerStarted: false,
      stats: null,
      errors: []
    };

    console.log('🚀 Initializing Intelligent Portfolio System...');
    console.log('=' .repeat(60));

    try {
      // Step 1: Connect to MongoDB
      if (connectMongoDB) {
        console.log('\n📊 Step 1: Connecting to MongoDB...');
        try {
          const mongoConnection = MongoDBConnection.getInstance();
          await mongoConnection.connect();
          await mongoConnection.initializeDatabase();
          
          const connectionStatus = await mongoConnection.getConnectionStatus();
          console.log(`✅ MongoDB connected: ${connectionStatus.database}`);
          console.log(`   Collections: ${connectionStatus.collections.join(', ')}`);
          
          result.mongoConnected = true;
        } catch (error) {
          const errorMsg = `MongoDB connection failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          return result; // Can't continue without database
        }
      }

      // Step 2: Initialize data
      if (initializeData) {
        console.log('\n📈 Step 2: Initializing stock data...');
        try {
          const initialStats = await StockDatabaseService.getStats();
          console.log(`   Current database: ${initialStats.totalStocks} stocks, ${initialStats.totalIndices} indices`);

          if (seedSampleData || initialStats.stocksWithFundamentals < 5) {
            console.log('   Seeding with sample stock data...');
            await this.seedSampleStockData();
          }

          if (initialStats.stocksWithFundamentals < 10) {
            console.log('   Initializing with essential stocks...');
            await StockDataFetcher.initializeEssentialStocks();
          }

          const finalStats = await StockDatabaseService.getStats();
          console.log(`✅ Data initialized: ${finalStats.stocksWithFundamentals} stocks with fundamentals`);
          
          result.dataInitialized = true;
          result.stats = finalStats;
        } catch (error) {
          const errorMsg = `Data initialization failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Step 3: Start data scheduler
      if (startScheduler) {
        console.log('\n⏰ Step 3: Starting data scheduler...');
        try {
          const scheduler = DataScheduler.getInstance();
          await scheduler.start();
          
          const schedulerStatus = scheduler.getStatus();
          console.log(`✅ Scheduler started:`);
          console.log(`   Price updates: every ${schedulerStatus.config.priceUpdateInterval / 60000} minutes`);
          console.log(`   Fundamental updates: every ${schedulerStatus.config.fundamentalUpdateInterval / 3600000} hours`);
          
          result.schedulerStarted = true;
        } catch (error) {
          const errorMsg = `Scheduler startup failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Step 4: Start daily cron job (11 AM data fetch)
      if (enableDailyCron) {
        console.log('\n📅 Step 4: Setting up daily 11 AM data fetch...');
        try {
          const cronScheduler = CronScheduler.getInstance();
          await cronScheduler.startDailyDataFetch();
          
          const jobStatus = cronScheduler.getJobStatus();
          const dailyJob = jobStatus.find(job => job.id === 'daily-data-fetch');
          
          if (dailyJob) {
            console.log(`✅ Daily cron job scheduled:`);
            console.log(`   Next fetch: ${dailyJob.nextRun}`);
            console.log(`   Time until next: ${dailyJob.timeUntilNext}`);
          }
          
        } catch (error) {
          const errorMsg = `Daily cron setup failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Final status
      result.success = result.mongoConnected && 
                      (result.dataInitialized || !initializeData) && 
                      (result.schedulerStarted || !startScheduler);

      console.log('\n🎯 Initialization Summary:');
      console.log('=' .repeat(40));
      console.log(`✅ MongoDB: ${result.mongoConnected ? 'Connected' : 'Failed'}`);
      console.log(`✅ Data: ${result.dataInitialized ? 'Initialized' : 'Failed'}`);
      console.log(`✅ Scheduler: ${result.schedulerStarted ? 'Started' : 'Failed'}`);
      console.log(`🎉 Overall: ${result.success ? 'SUCCESS' : 'FAILED'}`);

      if (result.errors.length > 0) {
        console.log('\n⚠️ Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }

      if (result.success) {
        console.log('\n🚀 Intelligent Portfolio System is ready for use!');
        
        if (result.stats) {
          console.log('\n📊 Database Status:');
          console.log(`   - Total stocks: ${result.stats.totalStocks}`);
          console.log(`   - Stocks with prices: ${result.stats.stocksWithPrices}`);
          console.log(`   - Stocks with fundamentals: ${result.stats.stocksWithFundamentals}`);
          console.log(`   - Total indices: ${result.stats.totalIndices}`);
        }
      }

    } catch (error) {
      const errorMsg = `Critical initialization error: ${error}`;
      result.errors.push(errorMsg);
      console.error(`💥 ${errorMsg}`);
    }

    return result;
  }

  /**
   * Seed database with sample stock data for testing
   */
  private static async seedSampleStockData(): Promise<void> {
    console.log('🌱 Seeding sample stock data...');

    const sampleStocks = [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        sector: 'Energy & Petrochemicals',
        price: 2456.75,
        fundamentals: {
          peRatio: 15.2,
          roe: 18.5,
          roce: 16.8,
          debtToEquity: 0.3,
          revenueGrowth: 12.5,
          profitGrowth: 15.2,
          dividendYield: 2.1,
          currentRatio: 1.2,
          eps: 125.5,
          bookValue: 850.2,
          marketCap: '₹15.2 L Cr',
          faceValue: 10
        }
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        sector: 'Information Technology',
        price: 1689.45,
        fundamentals: {
          peRatio: 22.3,
          roe: 25.6,
          roce: 28.2,
          debtToEquity: 0.1,
          revenueGrowth: 8.9,
          profitGrowth: 12.4,
          dividendYield: 2.8,
          currentRatio: 2.1,
          eps: 68.9,
          bookValue: 245.6,
          marketCap: '₹6.8 L Cr',
          faceValue: 5
        }
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        sector: 'Banking & Finance',
        price: 1687.30,
        fundamentals: {
          peRatio: 18.5,
          roe: 17.2,
          roce: 19.5,
          debtToEquity: 0.8,
          revenueGrowth: 15.8,
          profitGrowth: 18.6,
          dividendYield: 1.2,
          currentRatio: 1.8,
          eps: 91.2,
          bookValue: 520.8,
          marketCap: '₹9.3 L Cr',
          faceValue: 1
        }
      }
    ];

    for (const stock of sampleStocks) {
      try {
        // Add fundamentals
        await StockDatabaseService.updateStockFundamentals(
          stock.symbol,
          stock.fundamentals,
          {
            name: stock.name,
            sector: stock.sector
          }
        );

        // Add price data
        await StockDatabaseService.updateStockPrice(stock.symbol, {
          price: stock.price,
          dayChange: (Math.random() - 0.5) * 50, // Random day change
          dayChangePercent: (Math.random() - 0.5) * 3, // Random percentage
          volume: Math.floor(Math.random() * 1000000) + 100000 // Random volume
        });

        console.log(`   ✓ Added ${stock.symbol} (${stock.name})`);
      } catch (error) {
        console.error(`   ✗ Failed to add ${stock.symbol}: ${error}`);
      }
    }

    console.log(`✅ Sample data seeding completed`);
  }

  /**
   * Health check for the intelligent system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      mongodb: boolean;
      dataFreshness: boolean;
      scheduler: boolean;
    };
    details: any;
  }> {
    console.log('🏥 Running health check...');

    const checks = {
      mongodb: false,
      dataFreshness: false,
      scheduler: false
    };

    let details: any = {};

    try {
      // Check MongoDB connection
      const mongoConnection = MongoDBConnection.getInstance();
      const connectionStatus = await mongoConnection.getConnectionStatus();
      checks.mongodb = connectionStatus.connected;
      details.mongodb = connectionStatus;

      // Check data freshness
      const stats = await StockDatabaseService.getStats();
      checks.dataFreshness = stats.stocksWithFundamentals > 0;
      details.dataFreshness = stats;

      // Check scheduler
      const scheduler = DataScheduler.getInstance();
      const schedulerStatus = scheduler.getStatus();
      checks.scheduler = schedulerStatus.isRunning;
      details.scheduler = schedulerStatus;

    } catch (error) {
      details.error = error.toString();
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    console.log(`🏥 Health check result: ${status.toUpperCase()}`);
    console.log(`   MongoDB: ${checks.mongodb ? '✅' : '❌'}`);
    console.log(`   Data: ${checks.dataFreshness ? '✅' : '❌'}`);
    console.log(`   Scheduler: ${checks.scheduler ? '✅' : '❌'}`);

    return { status, checks, details };
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Intelligent Portfolio System...');

    try {
      // Stop scheduler
      const scheduler = DataScheduler.getInstance();
      scheduler.stop();

      // Stop cron jobs
      const cronScheduler = CronScheduler.getInstance();
      cronScheduler.stopAllJobs();

      // Disconnect from MongoDB
      await StockDatabaseService.disconnect();

      console.log('✅ Graceful shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

export default IntelligentSystemInitializer;

// Allow direct execution for testing
if (require.main === module) {
  IntelligentSystemInitializer.initialize({
    connectMongoDB: true,
    initializeData: true,
    startScheduler: true,
    seedSampleData: true
  })
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 System ready! Press Ctrl+C to shutdown.');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n👋 Received shutdown signal...');
        await IntelligentSystemInitializer.shutdown();
        process.exit(0);
      });
      
    } else {
      console.log('\n💥 System initialization failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Critical error:', error);
    process.exit(1);
  });
}