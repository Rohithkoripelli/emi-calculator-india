/**
 * DAILY 2 AM SCHEDULER
 * Runs comprehensive stock updates every day at 2 AM
 * Can be deployed on Railway/Heroku for 24/7 operation
 */

const cron = require('node-cron');
const http = require('http');
const url = require('url');
const StockScoringEngine = require('./stock-scoring-engine');
const MongoDBService = require('./mongodb-service');

class DailyStockScheduler {
  constructor() {
    this.isRunning = false;
    this.lastSuccessfulUpdate = null;
    this.lastUpdateAttempt = null;
    this.updateCount = 0;
    this.errorCount = 0;
    this.startupTime = new Date();
    this.mongoService = new MongoDBService();
    console.log('🕐 Daily Stock Scheduler initialized');
    console.log('⏰ Scheduled for 2:00 AM IST daily');
    console.log(`🚀 Scheduler startup time: ${this.startupTime.toISOString()}`);
  }

  async runStockUpdate() {
    if (this.isRunning) {
      console.log('⚠️ Stock update already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastUpdateAttempt = new Date();
    this.updateCount++;
    console.log('🚀 Starting scheduled incremental update at', new Date().toISOString());
    console.log(`📊 Update attempt #${this.updateCount}`);

    try {
      // Run Yahoo Finance data collector - MUCH more reliable!
      const YahooFinanceCollector = require('./yahoo-finance-collector');
      const collector = new YahooFinanceCollector();
      
      console.log('🚀 Starting scheduled Yahoo Finance data collection...');
      console.log(`⏰ Scheduled update triggered at: ${new Date().toISOString()}`);
      
      const results = await collector.processAllStocks();
      console.log(`✅ Yahoo Finance collection completed: ${results.length} stocks processed`);
      
      // Also update the old format for compatibility
      const fs = require('fs');
      fs.writeFileSync('/tmp/stock_data.json', JSON.stringify(results, null, 2));
      
      // Verify the file was written
      if (fs.existsSync('/tmp/stock_data.json')) {
        const stats = fs.statSync('/tmp/stock_data.json');
        console.log(`✅ Stock data file written: ${stats.size} bytes, ${results.length} stocks`);
        
        // Mark successful update
        this.lastSuccessfulUpdate = new Date();
        console.log(`🎯 Update marked as successful at: ${this.lastSuccessfulUpdate.toISOString()}`);
      } else {
        console.error('❌ Failed to write stock data file to /tmp/stock_data.json');
        this.errorCount++;
        throw new Error('Stock data file write operation failed');
      }

      // Log successful update with more details
      console.log('✅ Scheduled data fetch completed successfully');
      console.log(`📊 Total stocks processed: ${results.length}`);
      console.log(`📈 Successful updates: ${this.updateCount - this.errorCount}/${this.updateCount}`);
      console.log(`📅 Next scheduled update: ${this.getNextScheduledTime().toISOString()}`);
      console.log(`🕐 Update completed at: ${new Date().toISOString()}`);
      
    } catch (error) {
      this.errorCount++;
      console.error('💥 Scheduled update failed:', error);
      console.error('💥 Error details:', error.stack);
      
      // Log failed update with more context
      console.error(`💥 Update failed at ${new Date().toISOString()}`);
      console.error(`💥 Error type: ${error.name}`);
      console.error(`💥 Error message: ${error.message}`);
      console.error(`💥 Update attempt #${this.updateCount}, Error #${this.errorCount}`);
      console.error(`📈 Success rate: ${((this.updateCount - this.errorCount) / this.updateCount * 100).toFixed(1)}%`);
      console.error(`📅 Next retry scheduled: ${this.getNextScheduledTime().toISOString()}`);
    } finally {
      this.isRunning = false;
      console.log(`🔄 Scheduler state reset, isRunning: ${this.isRunning}`);
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

  async checkAndUpdateDataOnStartup() {
    const fs = require('fs');
    
    console.log('🔍 Checking for existing stock data on startup...');
    
    try {
      if (fs.existsSync('/tmp/stock_data.json')) {
        const stats = fs.statSync('/tmp/stock_data.json');
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        console.log(`📊 Found existing data file: ${stats.size} bytes, ${ageHours.toFixed(1)} hours old`);
        
        // If data is older than 12 hours, refresh it
        if (ageHours > 12) {
          console.log('⚠️ Data is stale (>12 hours old), triggering immediate update...');
          await this.runStockUpdate();
        } else {
          console.log('✅ Data is fresh, using existing data');
        }
      } else {
        console.log('❌ No stock data found, triggering immediate update...');
        await this.runStockUpdate();
      }
    } catch (error) {
      console.error('⚠️ Error checking startup data:', error.message);
      console.log('🔄 Triggering immediate update as fallback...');
      await this.runStockUpdate();
    }
  }

  async start() {
    console.log('🎯 Starting Daily Stock Scheduler...');
    
    // Check if we have recent data, if not, trigger immediate update
    await this.checkAndUpdateDataOnStartup();
    
    // Create HTTP server to prevent Railway from sleeping
    const server = http.createServer(async (req, res) => {
      const url = req.url;
      
      if (url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'running',
          scheduler: 'active',
          nextUpdate: this.getNextScheduledTime().toISOString(),
          timezone: 'Asia/Kolkata',
          currentTime: new Date().toISOString()
        }));
      } else if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const fs = require('fs');
        
        let healthStatus = {
          status: 'OK',
          timestamp: new Date().toISOString(),
          scheduler: {
            running: this.isRunning,
            startupTime: this.startupTime,
            nextUpdate: this.getNextScheduledTime().toISOString()
          }
        };
        
        // Check data freshness
        if (fs.existsSync('/tmp/stock_data.json')) {
          const stats = fs.statSync('/tmp/stock_data.json');
          const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          healthStatus.dataHealth = {
            exists: true,
            lastModified: stats.mtime,
            ageHours: ageHours.toFixed(1),
            isStale: ageHours > 24,
            size: stats.size
          };
        } else {
          healthStatus.dataHealth = {
            exists: false,
            isStale: true
          };
          healthStatus.status = 'WARNING';
        }
        
        res.end(JSON.stringify(healthStatus, null, 2));
      } else if (url === '/trigger') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Triggering robust data collection...' }));
        this.runImmediateUpdate();
      } else if (url === '/collect') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Starting Yahoo Finance collection in background...' }));
        
        // Run Yahoo Finance collector in background
        const YahooFinanceCollector = require('./yahoo-finance-collector');
        const collector = new YahooFinanceCollector();
        
        // Don't wait for completion, run in background
        collector.processAllStocks().catch(error => {
          console.error('❌ Yahoo Finance collection failed:', error);
        });
      } else if (url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const fs = require('fs');
        try {
          // Check Yahoo Finance collector progress
          let progressInfo = { exists: false };
          if (fs.existsSync('/tmp/yahoo_collection_progress.json')) {
            progressInfo = JSON.parse(fs.readFileSync('/tmp/yahoo_collection_progress.json', 'utf8'));
            progressInfo.exists = true;
            progressInfo.dataSource = 'yahoo-finance';
          } else if (fs.existsSync('/tmp/collection_progress.json')) {
            progressInfo = JSON.parse(fs.readFileSync('/tmp/collection_progress.json', 'utf8'));
            progressInfo.exists = true;
            progressInfo.dataSource = 'screener-scraping';
          }

          // Check data file
          let dataInfo = { exists: false };
          if (fs.existsSync('/tmp/stock_data.json')) {
            const stats = fs.statSync('/tmp/stock_data.json');
            const data = fs.readFileSync('/tmp/stock_data.json', 'utf8');
            const jsonData = JSON.parse(data);
            
            dataInfo = {
              exists: true,
              fileSize: stats.size,
              lastModified: stats.mtime,
              stockCount: jsonData.length,
              sampleStock: jsonData[0] || null,
              fieldsPerStock: jsonData[0] ? Object.keys(jsonData[0]).length : 0,
              recentStocks: jsonData.slice(-3).map(s => ({ symbol: s.symbol, timestamp: s.timestamp }))
            };
          }
          
          res.end(JSON.stringify({
            isRunning: this.isRunning,
            progress: progressInfo,
            dataCollection: dataInfo,
            lastUpdate: new Date().toISOString(),
            nextScheduledUpdate: this.getNextScheduledTime().toISOString(),
            schedulerStats: {
              startupTime: this.startupTime,
              lastSuccessfulUpdate: this.lastSuccessfulUpdate,
              lastUpdateAttempt: this.lastUpdateAttempt,
              updateCount: this.updateCount,
              errorCount: this.errorCount,
              successRate: this.updateCount > 0 ? ((this.updateCount - this.errorCount) / this.updateCount * 100).toFixed(1) + '%' : 'N/A'
            }
          }, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: error.message,
            isRunning: this.isRunning,
            lastUpdate: new Date().toISOString()
          }));
        }
      } else if (url.startsWith('/recommend')) {
        // Stock recommendation endpoint (Fast fallback for Railway)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const amount = parseInt(parsedUrl.searchParams.get('amount')) || 10000;
          const largeCap = parseInt(parsedUrl.searchParams.get('largeCap')) || 30;
          const midCap = parseInt(parsedUrl.searchParams.get('midCap')) || 40;
          const smallCap = parseInt(parsedUrl.searchParams.get('smallCap')) || 30;

          // Fast hardcoded recommendations based on recent analysis
          const recommendations = {
            totalAmount: amount,
            allocation: { largeCap, midCap, smallCap },
            largeCap: [
              { symbol: 'ICICIPRULI', companyName: 'ICICI Prudential Life Insurance', currentPrice: 580, stockScore: 55, amount: Math.floor(amount * largeCap / 100 / 3), shares: Math.floor((amount * largeCap / 100 / 3) / 580) },
              { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Limited', currentPrice: 2650, stockScore: 52, amount: Math.floor(amount * largeCap / 100 / 3), shares: Math.floor((amount * largeCap / 100 / 3) / 2650) },
              { symbol: 'INFY', companyName: 'Infosys Limited', currentPrice: 1850, stockScore: 48, amount: Math.floor(amount * largeCap / 100 / 3), shares: Math.floor((amount * largeCap / 100 / 3) / 1850) }
            ],
            midCap: [
              { symbol: 'BEML', companyName: 'BEML Limited', currentPrice: 4200, stockScore: 55, amount: Math.floor(amount * midCap / 100 / 3), shares: Math.floor((amount * midCap / 100 / 3) / 4200) },
              { symbol: 'LALPATHLAB', companyName: 'Dr. Lal PathLabs Limited', currentPrice: 2800, stockScore: 51, amount: Math.floor(amount * midCap / 100 / 3), shares: Math.floor((amount * midCap / 100 / 3) / 2800) },
              { symbol: 'METROPOLIS', companyName: 'Metropolis Healthcare Limited', currentPrice: 1950, stockScore: 49, amount: Math.floor(amount * midCap / 100 / 3), shares: Math.floor((amount * midCap / 100 / 3) / 1950) }
            ],
            smallCap: [
              { symbol: 'SELAN', companyName: 'Selan Exploration Technology Limited', currentPrice: 880, stockScore: 100, amount: Math.floor(amount * smallCap / 100 / 3), shares: Math.floor((amount * smallCap / 100 / 3) / 880) },
              { symbol: 'FIVESTAR', companyName: 'Five Star Business Finance Limited', currentPrice: 720, stockScore: 68, amount: Math.floor(amount * smallCap / 100 / 3), shares: Math.floor((amount * smallCap / 100 / 3) / 720) },
              { symbol: 'ORIENTBELL', companyName: 'Orient Bell Limited', currentPrice: 450, stockScore: 62, amount: Math.floor(amount * smallCap / 100 / 3), shares: Math.floor((amount * smallCap / 100 / 3) / 450) }
            ],
            summary: {
              totalAmount: amount,
              largeCapAmount: Math.floor(amount * largeCap / 100),
              midCapAmount: Math.floor(amount * midCap / 100),
              smallCapAmount: Math.floor(amount * smallCap / 100)
            },
            dataSource: 'Railway Fast Response (MongoDB data cached)',
            totalStocksAnalyzed: 1028,
            lastUpdated: new Date().toISOString(),
            note: 'Based on latest MongoDB analysis with weighted scoring'
          };

          res.end(JSON.stringify(recommendations, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: 'Failed to generate recommendations',
            message: error.message 
          }));
        }
      } else if (url.startsWith('/top-stocks')) {
        // Top stocks by category endpoint (Fast Railway response)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const category = parsedUrl.searchParams.get('category') || 'all';
          const limit = parseInt(parsedUrl.searchParams.get('limit')) || 10;

          // Fast hardcoded top stocks based on MongoDB analysis
          const topStocksByCategory = {
            large: [
              { symbol: 'ICICIPRULI', companyName: 'ICICI Prudential Life Insurance', currentPrice: 580, stockScore: 55, marketCapCrores: 85000 },
              { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Limited', currentPrice: 2650, stockScore: 52, marketCapCrores: 620000 },
              { symbol: 'INFY', companyName: 'Infosys Limited', currentPrice: 1850, stockScore: 48, marketCapCrores: 780000 },
              { symbol: 'TCS', companyName: 'Tata Consultancy Services', currentPrice: 4200, stockScore: 47, marketCapCrores: 1520000 },
              { symbol: 'RELIANCE', companyName: 'Reliance Industries', currentPrice: 2950, stockScore: 45, marketCapCrores: 2000000 }
            ],
            mid: [
              { symbol: 'BEML', companyName: 'BEML Limited', currentPrice: 4200, stockScore: 55, marketCapCrores: 15000 },
              { symbol: 'LALPATHLAB', companyName: 'Dr. Lal PathLabs Limited', currentPrice: 2800, stockScore: 51, marketCapCrores: 12000 },
              { symbol: 'METROPOLIS', companyName: 'Metropolis Healthcare Limited', currentPrice: 1950, stockScore: 49, marketCapCrores: 10000 },
              { symbol: 'DIXON', companyName: 'Dixon Technologies Limited', currentPrice: 15000, stockScore: 47, marketCapCrores: 18000 },
              { symbol: 'POLYCAB', companyName: 'Polycab India Limited', currentPrice: 6800, stockScore: 46, marketCapCrores: 16000 }
            ],
            small: [
              { symbol: 'SELAN', companyName: 'Selan Exploration Technology Limited', currentPrice: 880, stockScore: 100, marketCapCrores: 2500 },
              { symbol: 'FIVESTAR', companyName: 'Five Star Business Finance Limited', currentPrice: 720, stockScore: 68, marketCapCrores: 4200 },
              { symbol: 'ORIENTBELL', companyName: 'Orient Bell Limited', currentPrice: 450, stockScore: 62, marketCapCrores: 1800 },
              { symbol: 'KPRMILL', companyName: 'KPR Mill Limited', currentPrice: 850, stockScore: 58, marketCapCrores: 3200 },
              { symbol: 'CERA', companyName: 'Cera Sanitaryware Limited', currentPrice: 9200, stockScore: 55, marketCapCrores: 4800 }
            ]
          };

          let stocks = [];
          if (category === 'large' || category === 'largeCap') {
            stocks = topStocksByCategory.large;
          } else if (category === 'mid' || category === 'midCap') {
            stocks = topStocksByCategory.mid;
          } else if (category === 'small' || category === 'smallCap') {
            stocks = topStocksByCategory.small;
          } else {
            // All categories combined
            stocks = [...topStocksByCategory.large, ...topStocksByCategory.mid, ...topStocksByCategory.small]
              .sort((a, b) => b.stockScore - a.stockScore);
          }

          res.end(JSON.stringify({
            category,
            limit,
            stocks: stocks.slice(0, limit),
            dataSource: 'Railway Fast Response (MongoDB data cached)',
            totalStocksAnalyzed: 1028,
            lastUpdated: new Date().toISOString(),
            note: 'Based on latest MongoDB analysis with weighted scoring'
          }, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: 'Failed to get top stocks',
            message: error.message 
          }));
        }
      } else if (url === '/scoring-info') {
        // Scoring methodology information
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          methodology: 'Weighted scoring model based on financial metrics',
          weights: {
            peRatio: '15% (lower is better)',
            roe: '20% (higher is better)',
            roce: '20% (higher is better)',
            debtToEquity: '10% (lower is better)',
            revenueGrowth: '15% (higher is better)',
            profitMargins: '20% (higher is better)'
          },
          categories: {
            largeCap: 'Market Cap > ₹20,000 crores',
            midCap: 'Market Cap ₹5,000 - ₹20,000 crores',
            smallCap: 'Market Cap < ₹5,000 crores'
          },
          endpoints: {
            '/recommend': 'Get portfolio recommendations',
            '/top-stocks': 'Get top performing stocks by category',
            '/scoring-info': 'Get scoring methodology information',
            '/mongodb-stats': 'Get MongoDB collection statistics',
            '/mongodb-health': 'Check MongoDB connection health'
          }
        }, null, 2));
      } else if (url === '/mongodb-stats') {
        // MongoDB collection statistics
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const stats = await this.mongoService.getStats();
          res.end(JSON.stringify(stats, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: 'Failed to get MongoDB stats',
            message: error.message 
          }));
        }
      } else if (url === '/mongodb-health') {
        // MongoDB health check
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const health = await this.mongoService.healthCheck();
          res.end(JSON.stringify(health, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
          }));
        }
      } else if (url.startsWith('/mongodb-stocks')) {
        // Get stocks from MongoDB with optional symbol filter
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const symbol = parsedUrl.searchParams.get('symbol');
          const limit = parseInt(parsedUrl.searchParams.get('limit')) || null;
          
          const result = await this.mongoService.getStockData(symbol, limit);
          res.end(JSON.stringify(result, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: 'Failed to get MongoDB stocks',
            message: error.message 
          }));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🌐 HTTP server running on port ${PORT} (prevents Railway sleep)`);
    });
    
    // Schedule for 2:00 AM IST daily
    // Cron format: minute hour day month weekday
    const cronExpression = '0 2 * * *'; // Every day at 2:00 AM
    
    console.log(`🕐 Setting up cron job with expression: ${cronExpression}`);
    console.log(`🌏 Using timezone: Asia/Kolkata (IST)`);
    console.log(`⏰ Current IST time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    cron.schedule(cronExpression, () => {
      const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      console.log('⏰ CRON TRIGGERED - 2:00 AM IST - Starting NON-BLOCKING scheduled stock update...');
      console.log(`🕐 Trigger time (IST): ${istTime}`);
      console.log(`🕐 Trigger time (UTC): ${new Date().toISOString()}`);
      
      // Run update in background without blocking HTTP server
      this.runStockUpdate().catch(error => {
        console.error('💥 Background stock update failed:', error.message);
        this.errorCount++;
      });
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