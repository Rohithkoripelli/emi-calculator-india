/**
 * DAILY 2 AM SCHEDULER
 * Runs comprehensive stock updates every day at 2 AM
 * Can be deployed on Railway/Heroku for 24/7 operation
 */

const cron = require('node-cron');
const http = require('http');

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
      // Run Railway-compatible data fetcher (no MongoDB dependency issues)
      const { exec } = require('child_process');
      
      await new Promise((resolve, reject) => {
        exec('node railway-data-fetcher.js', (error, stdout, stderr) => {
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
        res.end(JSON.stringify({ message: 'Triggering immediate update...' }));
        this.runImmediateUpdate();
      } else if (url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const fs = require('fs');
        try {
          const dataExists = fs.existsSync('/tmp/stock_data.json');
          let dataInfo = { exists: dataExists };
          
          if (dataExists) {
            const stats = fs.statSync('/tmp/stock_data.json');
            const data = fs.readFileSync('/tmp/stock_data.json', 'utf8');
            const jsonData = JSON.parse(data);
            
            dataInfo = {
              exists: true,
              fileSize: stats.size,
              lastModified: stats.mtime,
              stockCount: jsonData.length,
              sampleStock: jsonData[0] || null,
              fieldsPerStock: jsonData[0] ? Object.keys(jsonData[0]).length : 0
            };
          }
          
          res.end(JSON.stringify({
            isRunning: this.isRunning,
            dataCollection: dataInfo,
            lastUpdate: new Date().toISOString()
          }, null, 2));
        } catch (error) {
          res.end(JSON.stringify({ 
            error: error.message,
            isRunning: this.isRunning,
            lastUpdate: new Date().toISOString()
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