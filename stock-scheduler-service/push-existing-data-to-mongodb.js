/**
 * Push Existing Collected Data to MongoDB
 * Takes the collected stock data from /tmp/stock_data.json and pushes it to MongoDB
 */

const fs = require('fs');
const MongoDBService = require('./mongodb-service');

async function pushExistingDataToMongoDB() {
  console.log('🚀 PUSHING EXISTING COLLECTED DATA TO MONGODB');
  console.log('=' * 60);
  
  const mongoService = new MongoDBService();
  const dataFile = '/tmp/stock_data.json';
  
  try {
    // Step 1: Check if data file exists
    if (!fs.existsSync(dataFile)) {
      throw new Error('No existing stock data found. Run data collection first.');
    }
    
    const fileStats = fs.statSync(dataFile);
    console.log(`📁 Found existing data file: ${(fileStats.size / 1024).toFixed(2)} KB`);
    
    // Step 2: Load existing data
    console.log('\n📊 Loading existing collected stock data...');
    const stocksData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`✅ Loaded ${stocksData.length} stocks from file`);
    
    // Step 3: Check MongoDB connection
    console.log('\n🔗 Checking MongoDB Atlas connection...');
    const healthCheck = await mongoService.healthCheck();
    if (healthCheck.status !== 'healthy') {
      throw new Error(`MongoDB connection failed: ${healthCheck.error}`);
    }
    console.log('✅ MongoDB Atlas connection verified');
    
    // Step 4: Get current MongoDB stats
    console.log('\n📊 Getting current MongoDB statistics...');
    const preStats = await mongoService.getStats();
    if (preStats.success) {
      console.log(`📈 Current stocks in MongoDB: ${preStats.stats.totalStocks}`);
      console.log(`📅 Latest update: ${preStats.stats.latestUpdate || 'None'}`);
    }
    
    // Step 5: Analyze the data to be pushed
    console.log('\n🔍 Analyzing data to be pushed...');
    const validStocks = stocksData.filter(stock => 
      stock.symbol && 
      stock.currentPrice && 
      stock.stockScore !== undefined
    );
    
    const scoredStocks = stocksData.filter(stock => stock.stockScore > 0);
    const categorizedStocks = stocksData.filter(stock => stock.category && stock.category !== 'other');
    
    console.log(`📊 Total stocks: ${stocksData.length}`);
    console.log(`✅ Valid stocks: ${validStocks.length}`);
    console.log(`🎯 Stocks with scores: ${scoredStocks.length}`);
    console.log(`🏷️ Categorized stocks: ${categorizedStocks.length}`);
    
    // Sample stock for verification
    if (validStocks.length > 0) {
      const sample = validStocks[0];
      console.log(`\n📋 Sample stock data:`, {
        symbol: sample.symbol,
        companyName: sample.companyName,
        currentPrice: sample.currentPrice,
        marketCapCrores: sample.marketCapCrores,
        stockScore: sample.stockScore,
        category: sample.category,
        fieldsCount: Object.keys(sample).length
      });
    }
    
    // Step 6: Push to MongoDB
    if (validStocks.length > 0) {
      console.log(`\n💾 Pushing ${validStocks.length} stocks to MongoDB Atlas...`);
      
      const startTime = Date.now();
      const mongoResult = await mongoService.saveStockData(validStocks);
      const endTime = Date.now();
      
      if (mongoResult.success) {
        console.log('\n🎉 MONGODB PUSH SUCCESSFUL!');
        console.log(`✅ Total processed: ${mongoResult.totalProcessed}`);
        console.log(`➕ Inserted: ${mongoResult.insertedCount}`);
        console.log(`🔄 Modified: ${mongoResult.modifiedCount}`);
        console.log(`⬆️ Upserted: ${mongoResult.upsertedCount}`);
        console.log(`⏱️ Push time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
      } else {
        throw new Error(`MongoDB save failed: ${mongoResult.error}`);
      }
    } else {
      console.log('⚠️ No valid data to push to MongoDB');
    }
    
    // Step 7: Verify push results
    console.log('\n📊 Verifying push results...');
    const postStats = await mongoService.getStats();
    if (postStats.success) {
      console.log(`📈 Total stocks in MongoDB: ${postStats.stats.totalStocks}`);
      console.log(`📅 Latest update: ${postStats.stats.latestUpdate}`);
      console.log(`🔝 Recent stocks:`, postStats.stats.recentlyUpdated.slice(0, 3).map(s => 
        `${s.symbol} (₹${s.currentPrice})`
      ).join(', '));
    }
    
    console.log('\n🏁 EXISTING DATA PUSH COMPLETED SUCCESSFULLY!');
    console.log(`💾 MongoDB ready with ${validStocks.length} stocks with scoring!`);
    
    return {
      success: true,
      totalPushed: validStocks.length,
      scoredStocks: scoredStocks.length,
      mongoInserted: mongoResult.insertedCount,
      mongoModified: mongoResult.modifiedCount,
      mongoUpserted: mongoResult.upsertedCount
    };
    
  } catch (error) {
    console.error('\n💥 PUSH FAILED:', error.message);
    console.error('🔍 Error details:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await mongoService.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  pushExistingDataToMongoDB()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Push completed successfully with ${result.totalPushed} stocks!`);
        process.exit(0);
      } else {
        console.error(`\n❌ Push failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = pushExistingDataToMongoDB;