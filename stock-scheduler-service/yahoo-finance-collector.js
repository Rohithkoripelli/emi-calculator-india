/**
 * YAHOO FINANCE DATA COLLECTOR
 * Robust, reliable stock data collection using Yahoo Finance API
 * Handles all 2600+ Indian stocks with comprehensive fundamentals
 */

const yahooFinance = require('yahoo-finance2').default;
const fs = require('fs');
const MongoDBService = require('./mongodb-service');

// Import the complete stock universe
const STOCK_SYMBOLS = require('./complete-stock-universe');

class YahooFinanceCollector {
  constructor() {
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.results = [];
    this.progressFile = '/tmp/yahoo_collection_progress.json';
    this.mongoService = new MongoDBService();
    this.dataFile = '/tmp/stock_data.json';
    this.batchSize = 10; // Optimized batch size for 2600+ stocks
    this.delayBetweenRequests = 500; // 500ms for faster processing of all stocks
    this.maxRetries = 2;
    
    // Suppress Yahoo Finance notices
    yahooFinance.suppressNotices(['yahooSurvey']);
    
    console.log('🚀 Yahoo Finance Collector initialized');
    console.log(`📊 Target: ${STOCK_SYMBOLS.length} stocks`);
    console.log(`⚡ Batch size: ${this.batchSize}, Delay: ${this.delayBetweenRequests}ms`);
    console.log('💪 Using reliable Yahoo Finance API');
  }

  // Convert stock symbol to Yahoo Finance format
  getYahooSymbol(symbol) {
    // Most Indian stocks are on NSE, try .NS first, fallback to .BO (BSE)
    return `${symbol}.NS`;
  }

  // Load existing progress and data
  loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.processedCount = progress.processedCount || 0;
        this.successCount = progress.successCount || 0;
        this.errorCount = progress.errorCount || 0;
        this.skippedCount = progress.skippedCount || 0;
        console.log(`📂 Resuming from: ${this.processedCount}/${STOCK_SYMBOLS.length} stocks`);
      }

      if (fs.existsSync(this.dataFile)) {
        this.results = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        console.log(`📊 Loaded existing data: ${this.results.length} stocks`);
      }
    } catch (error) {
      console.error('⚠️ Error loading progress:', error.message);
    }
  }

  // Save progress incrementally
  saveProgress() {
    try {
      const progress = {
        processedCount: this.processedCount,
        successCount: this.successCount,
        errorCount: this.errorCount,
        skippedCount: this.skippedCount,
        lastUpdated: new Date().toISOString(),
        completionPercentage: Math.round((this.processedCount / STOCK_SYMBOLS.length) * 100)
      };

      fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
      fs.writeFileSync(this.dataFile, JSON.stringify(this.results, null, 2));
      
      console.log(`💾 Progress saved: ${this.processedCount}/${STOCK_SYMBOLS.length} (${progress.completionPercentage}%)`);
    } catch (error) {
      console.error('❌ Error saving progress:', error.message);
    }
  }

  // Get list of stocks already processed
  getProcessedSymbols() {
    return new Set(this.results.map(stock => stock.symbol));
  }

  // Fetch comprehensive stock data from Yahoo Finance
  async fetchYahooData(symbol, retryCount = 0) {
    const yahooSymbol = this.getYahooSymbol(symbol);
    
    try {
      console.log(`📈 Fetching ${yahooSymbol}...`);
      
      const result = await yahooFinance.quoteSummary(yahooSymbol, {
        modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics']
      });

      const fundamentals = this.extractFundamentals(result, symbol, yahooSymbol);
      return { success: true, data: fundamentals };

    } catch (error) {
      console.error(`❌ Yahoo Finance error for ${yahooSymbol}:`, error.message);
      
      // Try BSE if NSE fails
      if (yahooSymbol.endsWith('.NS') && retryCount < this.maxRetries) {
        console.log(`🔄 Retrying ${symbol} with BSE (.BO)...`);
        const bseSymbol = `${symbol}.BO`;
        
        try {
          const result = await yahooFinance.quoteSummary(bseSymbol, {
            modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics']
          });
          
          const fundamentals = this.extractFundamentals(result, symbol, bseSymbol);
          return { success: true, data: fundamentals };
        } catch (bseError) {
          console.error(`❌ BSE also failed for ${symbol}:`, bseError.message);
        }
      }
      
      return { success: false, error: error.message };
    }
  }

  // Extract comprehensive fundamentals from Yahoo Finance data
  extractFundamentals(yahooData, originalSymbol, yahooSymbol) {
    const fundamentals = {
      symbol: originalSymbol,
      yahooSymbol: yahooSymbol,
      timestamp: new Date().toISOString(),
      source: 'yahoo-finance',
      exchange: yahooData.price?.exchangeName || 'NSE'
    };

    // Price data
    if (yahooData.price) {
      fundamentals.currentPrice = yahooData.price.regularMarketPrice;
      fundamentals.marketCap = yahooData.price.marketCap;
      fundamentals.currency = yahooData.price.currency;
      fundamentals.volume = yahooData.price.regularMarketVolume;
      fundamentals.dayHigh = yahooData.price.regularMarketDayHigh;
      fundamentals.dayLow = yahooData.price.regularMarketDayLow;
      fundamentals.previousClose = yahooData.price.regularMarketPreviousClose;
      fundamentals.marketState = yahooData.price.marketState;
      fundamentals.companyName = yahooData.price.longName || yahooData.price.shortName;
    }

    // Summary detail data
    if (yahooData.summaryDetail) {
      fundamentals.week52High = yahooData.summaryDetail.fiftyTwoWeekHigh;
      fundamentals.week52Low = yahooData.summaryDetail.fiftyTwoWeekLow;
      fundamentals.peRatio = yahooData.summaryDetail.trailingPE;
      fundamentals.forwardPE = yahooData.summaryDetail.forwardPE;
      fundamentals.beta = yahooData.summaryDetail.beta;
      fundamentals.dividendRate = yahooData.summaryDetail.dividendRate;
      fundamentals.dividendYield = yahooData.summaryDetail.dividendYield;
      fundamentals.payoutRatio = yahooData.summaryDetail.payoutRatio;
      fundamentals.fiveYearAvgDividendYield = yahooData.summaryDetail.fiveYearAvgDividendYield;
      fundamentals.priceToSales = yahooData.summaryDetail.priceToSalesTrailing12Months;
      fundamentals.averageVolume = yahooData.summaryDetail.averageVolume;
      fundamentals.fiftyDayAverage = yahooData.summaryDetail.fiftyDayAverage;
      fundamentals.twoHundredDayAverage = yahooData.summaryDetail.twoHundredDayAverage;
    }

    // Financial data
    if (yahooData.financialData) {
      fundamentals.targetHighPrice = yahooData.financialData.targetHighPrice;
      fundamentals.targetLowPrice = yahooData.financialData.targetLowPrice;
      fundamentals.targetMeanPrice = yahooData.financialData.targetMeanPrice;
      fundamentals.recommendationMean = yahooData.financialData.recommendationMean;
      fundamentals.recommendationKey = yahooData.financialData.recommendationKey;
      fundamentals.numberOfAnalystOpinions = yahooData.financialData.numberOfAnalystOpinions;
      fundamentals.totalCash = yahooData.financialData.totalCash;
      fundamentals.totalCashPerShare = yahooData.financialData.totalCashPerShare;
      fundamentals.ebitda = yahooData.financialData.ebitda;
      fundamentals.totalDebt = yahooData.financialData.totalDebt;
      fundamentals.totalRevenue = yahooData.financialData.totalRevenue;
      fundamentals.debtToEquity = yahooData.financialData.debtToEquity;
      fundamentals.revenuePerShare = yahooData.financialData.revenuePerShare;
      fundamentals.revenueGrowth = yahooData.financialData.revenueGrowth;
      fundamentals.earningsGrowth = yahooData.financialData.earningsGrowth;
      fundamentals.grossMargins = yahooData.financialData.grossMargins;
      fundamentals.ebitdaMargins = yahooData.financialData.ebitdaMargins;
      fundamentals.operatingMargins = yahooData.financialData.operatingMargins;
      fundamentals.profitMargins = yahooData.financialData.profitMargins;
    }

    // Key statistics
    if (yahooData.defaultKeyStatistics) {
      fundamentals.pegRatio = yahooData.defaultKeyStatistics.pegRatio;
      fundamentals.priceToBook = yahooData.defaultKeyStatistics.priceToBook;
      fundamentals.enterpriseValue = yahooData.defaultKeyStatistics.enterpriseValue;
      fundamentals.enterpriseToRevenue = yahooData.defaultKeyStatistics.enterpriseToRevenue;
      fundamentals.enterpriseToEbitda = yahooData.defaultKeyStatistics.enterpriseToEbitda;
      fundamentals.bookValue = yahooData.defaultKeyStatistics.bookValue;
      fundamentals.priceToBook = yahooData.defaultKeyStatistics.priceToBook;
      fundamentals.lastFiscalYearEnd = yahooData.defaultKeyStatistics.lastFiscalYearEnd;
      fundamentals.nextFiscalYearEnd = yahooData.defaultKeyStatistics.nextFiscalYearEnd;
      fundamentals.mostRecentQuarter = yahooData.defaultKeyStatistics.mostRecentQuarter;
      fundamentals.netIncomeToCommon = yahooData.defaultKeyStatistics.netIncomeToCommon;
      fundamentals.trailingEps = yahooData.defaultKeyStatistics.trailingEps;
      fundamentals.forwardEps = yahooData.defaultKeyStatistics.forwardEps;
    }

    // Calculate price change from 52-week low
    if (fundamentals.currentPrice && fundamentals.week52Low) {
      const change = fundamentals.currentPrice - fundamentals.week52Low;
      const changePercent = (change / fundamentals.week52Low) * 100;
      
      fundamentals.priceChange = parseFloat(change.toFixed(2));
      fundamentals.priceChangePercent = parseFloat(changePercent.toFixed(2));
    }

    // Calculate market cap value in crores
    if (fundamentals.marketCap) {
      fundamentals.marketCapCrores = Math.round(fundamentals.marketCap / 10000000); // Convert to crores
    }

    console.log(`✅ ${originalSymbol}: ${Object.keys(fundamentals).length} fields extracted`);
    return fundamentals;
  }

  // Process all stocks with Yahoo Finance
  async processAllStocks() {
    console.log(`🚀 Starting Yahoo Finance collection for ${STOCK_SYMBOLS.length} stocks`);
    
    this.loadProgress();
    const processedSymbols = this.getProcessedSymbols();
    const remainingStocks = STOCK_SYMBOLS.filter(symbol => !processedSymbols.has(symbol));
    
    console.log(`📊 Remaining stocks to process: ${remainingStocks.length}`);
    
    if (remainingStocks.length === 0) {
      console.log('✅ All stocks already processed!');
      return this.results;
    }

    // Process in batches
    for (let i = 0; i < remainingStocks.length; i += this.batchSize) {
      const batch = remainingStocks.slice(i, i + this.batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(remainingStocks.length/this.batchSize)}`);
      
      // Process batch sequentially to respect API limits
      for (const symbol of batch) {
        this.processedCount++;
        console.log(`📊 Processing ${symbol} (${this.processedCount}/${STOCK_SYMBOLS.length})`);
        
        try {
          const result = await this.fetchYahooData(symbol);
          
          if (result.success) {
            this.results.push(result.data);
            this.successCount++;
            console.log(`✅ ${symbol}: Success - ${Object.keys(result.data).length} fields`);
          } else {
            this.errorCount++;
            console.log(`❌ ${symbol}: ${result.error}`);
          }
        } catch (error) {
          this.errorCount++;
          console.error(`💥 ${symbol}: ${error.message}`);
        }
        
        // Delay between requests
        if (this.processedCount < STOCK_SYMBOLS.length) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
        }
      }

      // Save progress after each batch
      this.saveProgress();
      
      console.log(`📊 Batch completed: ${this.successCount} success, ${this.errorCount} errors`);
      
      // Shorter delay between batches for faster processing
      if (i + this.batchSize < remainingStocks.length) {
        console.log('⏸️ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.saveProgress();
    
    console.log(`\n🎯 YAHOO FINANCE COLLECTION COMPLETE!`);
    console.log(`✅ Successfully processed: ${this.successCount} stocks`);
    console.log(`❌ Failed: ${this.errorCount} stocks`);
    console.log(`📁 Total in dataset: ${this.results.length} stocks`);
    console.log(`💾 Data saved to: ${this.dataFile}`);
    
    // Save to MongoDB Atlas
    if (this.results.length > 0) {
      console.log(`\n📊 Saving ${this.results.length} stocks to MongoDB Atlas...`);
      try {
        const mongoResult = await this.mongoService.saveStockData(this.results);
        if (mongoResult.success) {
          console.log(`✅ MongoDB save successful: ${mongoResult.totalProcessed} stocks saved`);
          console.log(`📊 Inserted: ${mongoResult.insertedCount}, Modified: ${mongoResult.modifiedCount}, Upserted: ${mongoResult.upsertedCount}`);
        } else {
          console.error(`❌ MongoDB save failed: ${mongoResult.error}`);
        }
      } catch (mongoError) {
        console.error(`❌ MongoDB save error: ${mongoError.message}`);
      }
    }
    
    return this.results;
  }

  // Get collection status
  getStatus() {
    const progress = {
      totalStocks: STOCK_SYMBOLS.length,
      processedCount: this.processedCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      completionPercentage: Math.round((this.processedCount / STOCK_SYMBOLS.length) * 100),
      dataFileExists: fs.existsSync(this.dataFile),
      dataFileSize: fs.existsSync(this.dataFile) ? fs.statSync(this.dataFile).size : 0,
      stocksInDataset: this.results.length,
      isRunning: this.processedCount < STOCK_SYMBOLS.length,
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      dataSource: 'yahoo-finance'
    };

    return progress;
  }

  getEstimatedTimeRemaining() {
    const remaining = STOCK_SYMBOLS.length - this.processedCount;
    const avgTimePerStock = (this.delayBetweenRequests + 1000) / 1000; // seconds (optimized)
    const estimatedSeconds = remaining * avgTimePerStock;
    
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new YahooFinanceCollector();
  collector.processAllStocks()
    .then(results => {
      console.log(`🏁 Yahoo Finance collection completed with ${results.length} results`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Yahoo Finance collection failed:', error);
      process.exit(1);
    });
}

module.exports = YahooFinanceCollector;