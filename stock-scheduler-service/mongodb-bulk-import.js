/**
 * MongoDB Bulk Import - Comprehensive Stock Data Collection with Scoring
 * Collects all 2600+ stocks from Yahoo Finance and pushes to MongoDB with weighted scoring
 */

const YahooFinanceCollector = require('./yahoo-finance-collector');
const MongoDBService = require('./mongodb-service');

class MongoDBBulkImport {
  constructor() {
    this.collector = new YahooFinanceCollector();
    this.mongoService = new MongoDBService();
    this.startTime = new Date();
    console.log('🚀 MongoDB Bulk Import initialized');
    console.log(`⏰ Started at: ${this.startTime.toISOString()}`);
  }

  async performBulkImport() {
    console.log('\n🎯 STARTING COMPREHENSIVE MONGODB BULK IMPORT');
    console.log('📊 Target: All 2600+ Indian stocks with Yahoo Finance data');
    console.log('🏆 Features: Weighted scoring, market cap categorization, comprehensive fundamentals');
    
    try {
      // Step 1: Check MongoDB connection
      console.log('\n🔗 Step 1: Checking MongoDB Atlas connection...');
      const healthCheck = await this.mongoService.healthCheck();
      if (healthCheck.status !== 'healthy') {
        throw new Error(`MongoDB connection failed: ${healthCheck.error}`);
      }
      console.log('✅ MongoDB Atlas connection verified');

      // Step 2: Get current MongoDB stats (before import)
      console.log('\n📊 Step 2: Getting pre-import MongoDB statistics...');
      const preStats = await this.mongoService.getStats();
      if (preStats.success) {
        console.log(`📈 Current stocks in MongoDB: ${preStats.stats.totalStocks}`);
        console.log(`📅 Latest update: ${preStats.stats.latestUpdate || 'None'}`);
      }

      // Step 3: Start comprehensive data collection
      console.log('\n🚀 Step 3: Starting comprehensive Yahoo Finance data collection...');
      console.log('⚡ Features enabled: Rate limiting (500ms), Batch processing (10 stocks), Scoring engine');
      
      const results = await this.collector.processAllStocks();
      
      console.log(`\n✅ Yahoo Finance collection completed!`);
      console.log(`📊 Total stocks collected: ${results.length}`);
      console.log(`🎯 Success rate: ${this.collector.successCount}/${this.collector.processedCount}`);
      console.log(`❌ Errors: ${this.collector.errorCount}`);

      // Step 4: Verify data quality
      console.log('\n🔍 Step 4: Verifying data quality...');
      const scoredStocks = results.filter(stock => stock.stockScore > 0);
      const categorizedStocks = results.filter(stock => stock.category && stock.category !== 'other');
      
      console.log(`📈 Stocks with valid scores: ${scoredStocks.length}/${results.length}`);
      console.log(`🏷️ Stocks with categories: ${categorizedStocks.length}/${results.length}`);
      
      // Sample data quality check
      if (results.length > 0) {
        const sampleStock = results[0];
        console.log(`\n📋 Sample stock data:`, {
          symbol: sampleStock.symbol,
          companyName: sampleStock.companyName,
          currentPrice: sampleStock.currentPrice,
          marketCapCrores: sampleStock.marketCapCrores,
          stockScore: sampleStock.stockScore,
          category: sampleStock.category,
          fieldsCount: Object.keys(sampleStock).length
        });
      }

      // Step 5: MongoDB bulk insert
      if (results.length > 0) {
        console.log(`\n💾 Step 5: Bulk inserting ${results.length} stocks to MongoDB Atlas...`);
        
        const mongoResult = await this.mongoService.saveStockData(results);
        
        if (mongoResult.success) {
          console.log('🎉 MONGODB BULK IMPORT SUCCESSFUL!');
          console.log(`✅ Total processed: ${mongoResult.totalProcessed}`);
          console.log(`➕ Inserted: ${mongoResult.insertedCount}`);
          console.log(`🔄 Modified: ${mongoResult.modifiedCount}`);
          console.log(`⬆️ Upserted: ${mongoResult.upsertedCount}`);
        } else {
          throw new Error(`MongoDB save failed: ${mongoResult.error}`);
        }
      } else {
        console.log('⚠️ No data to import to MongoDB');
      }

      // Step 6: Post-import verification
      console.log('\n📊 Step 6: Post-import verification...');
      const postStats = await this.mongoService.getStats();
      if (postStats.success) {
        console.log(`📈 Total stocks in MongoDB: ${postStats.stats.totalStocks}`);
        console.log(`📅 Latest update: ${postStats.stats.latestUpdate}`);
        console.log(`🔝 Recent stocks:`, postStats.stats.recentlyUpdated.slice(0, 3).map(s => 
          `${s.symbol} (₹${s.currentPrice})`
        ).join(', '));
      }

      // Step 7: Calculate completion stats
      const endTime = new Date();
      const duration = Math.round((endTime - this.startTime) / 1000 / 60); // minutes
      
      console.log(`\n🏁 BULK IMPORT COMPLETED SUCCESSFULLY!`);
      console.log(`⏱️ Total time: ${duration} minutes`);
      console.log(`📊 Processing rate: ${Math.round(results.length / duration)} stocks/minute`);
      console.log(`🎯 Final count: ${results.length} stocks with scoring`);
      console.log(`💾 MongoDB ready for recommendations!`);

      return {
        success: true,
        totalStocks: results.length,
        scoredStocks: scoredStocks.length,
        mongoInserted: mongoResult.insertedCount,
        mongoModified: mongoResult.modifiedCount,
        mongoUpserted: mongoResult.upsertedCount,
        duration: duration
      };

    } catch (error) {
      console.error('\n💥 BULK IMPORT FAILED:', error.message);
      console.error('🔍 Error details:', error.stack);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getImportStatus() {
    try {
      const mongoStats = await this.mongoService.getStats();
      const collectorStatus = this.collector.getStatus();
      
      return {
        mongodb: mongoStats,
        collector: collectorStatus,
        isRunning: collectorStatus.isRunning
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  const importer = new MongoDBBulkImport();
  
  // Check if --status flag is provided
  if (process.argv.includes('--status')) {
    importer.getImportStatus()
      .then(status => {
        console.log('📊 Current Import Status:');
        console.log(JSON.stringify(status, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Status check failed:', error);
        process.exit(1);
      });
  } else {
    // Run full import
    importer.performBulkImport()
      .then(result => {
        if (result.success) {
          console.log(`\n✅ Import completed successfully!`);
          process.exit(0);
        } else {
          console.error(`\n❌ Import failed: ${result.error}`);
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
      });
  }
}

module.exports = MongoDBBulkImport;