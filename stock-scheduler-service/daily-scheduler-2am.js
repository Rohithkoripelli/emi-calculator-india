/**
 * DAILY 2 AM SCHEDULER
 * Runs comprehensive stock updates every day at 2 AM
 * Can be deployed on Railway/Heroku for 24/7 operation
 */

const cron = require('node-cron');
const http = require('http');
const url = require('url');
const StockScoringEngine = require('./stock-scoring-engine');

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
      // Run Yahoo Finance data collector - MUCH more reliable!
      const YahooFinanceCollector = require('./yahoo-finance-collector');
      const collector = new YahooFinanceCollector();
      
      console.log('🚀 Starting Yahoo Finance data collection...');
      const results = await collector.processAllStocks();
      console.log(`✅ Yahoo Finance collection completed: ${results.length} stocks processed`);
      
      // Also update the old format for compatibility
      const fs = require('fs');
      fs.writeFileSync('/tmp/stock_data.json', JSON.stringify(results, null, 2));

      // Log successful update (simplified for Railway compatibility)
      console.log('✅ Data fetch completed successfully');
      console.log(`📅 Next scheduled update: ${this.getNextScheduledTime().toISOString()}`);
      
    } catch (error) {
      console.error('💥 Scheduled update failed:', error);
      
      // Log failed update (simplified for Railway compatibility)
      console.error(`💥 Update failed at ${new Date().toISOString()}`);
      console.error(`📅 Next retry scheduled: ${this.getNextScheduledTime().toISOString()}`);
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
    
    // Create HTTP server to prevent Railway from sleeping
    const server = http.createServer((req, res) => {
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
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
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
            nextScheduledUpdate: this.getNextScheduledTime().toISOString()
          }, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: error.message,
            isRunning: this.isRunning,
            lastUpdate: new Date().toISOString()
          }));
        }
      } else if (url.startsWith('/recommend')) {
        // Stock recommendation endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const amount = parseInt(parsedUrl.searchParams.get('amount')) || 10000;
          const largeCap = parseInt(parsedUrl.searchParams.get('largeCap')) || 30;
          const midCap = parseInt(parsedUrl.searchParams.get('midCap')) || 40;
          const smallCap = parseInt(parsedUrl.searchParams.get('smallCap')) || 30;
          const topN = parseInt(parsedUrl.searchParams.get('topN')) || 3;

          const engine = new StockScoringEngine();
          const recommendations = engine.generateRecommendations(amount, {
            largeCap,
            midCap,
            smallCap
          }, topN);

          res.end(JSON.stringify(recommendations, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: 'Failed to generate recommendations',
            message: error.message 
          }));
        }
      } else if (url.startsWith('/top-stocks')) {
        // Top stocks by category endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const category = parsedUrl.searchParams.get('category') || 'all';
          const limit = parseInt(parsedUrl.searchParams.get('limit')) || 10;

          const engine = new StockScoringEngine();
          const topStocks = engine.getTopStocks(category, limit);

          res.end(JSON.stringify({
            category,
            limit,
            stocks: topStocks
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
            '/scoring-info': 'Get scoring methodology information'
          }
        }, null, 2));
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
    
    cron.schedule(cronExpression, async () => {
      console.log('⏰ 2 AM IST - Triggering scheduled stock update...');
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