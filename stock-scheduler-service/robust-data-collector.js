/**
 * ROBUST RESUMABLE STOCK DATA COLLECTOR
 * Handles Railway container restarts and saves progress incrementally
 * Processes all 2600+ stocks with comprehensive error handling
 */

const https = require('https');
const fs = require('fs');

// Import the complete stock universe
const STOCK_SYMBOLS = require('./complete-stock-universe');

class RobustDataCollector {
  constructor() {
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.results = [];
    this.progressFile = '/tmp/collection_progress.json';
    this.dataFile = '/tmp/stock_data.json';
    this.batchSize = 10; // Process in batches of 10
    this.delayBetweenRequests = 2000; // 2 seconds instead of 5
    this.maxRetries = 3;
    
    console.log('🚀 Robust Data Collector initialized');
    console.log(`📊 Target: ${STOCK_SYMBOLS.length} stocks`);
    console.log(`⚡ Batch size: ${this.batchSize}, Delay: ${this.delayBetweenRequests}ms`);
    console.log('💾 Resumable with incremental saving');
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
      // Continue with fresh start
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

  // Fetch stock data with retries
  async fetchStockData(symbol, retryCount = 0) {
    return new Promise((resolve) => {
      const url = `https://www.screener.in/company/${symbol}/consolidated/`;
      
      const options = {
        hostname: 'www.screener.in',
        path: `/company/${symbol}/consolidated/`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const fundamentals = this.extractFundamentals(data, symbol);
              resolve({ success: true, data: fundamentals });
            } catch (error) {
              console.error(`❌ Parse error for ${symbol}:`, error.message);
              if (retryCount < this.maxRetries) {
                console.log(`🔄 Retrying ${symbol} (${retryCount + 1}/${this.maxRetries})`);
                setTimeout(() => {
                  this.fetchStockData(symbol, retryCount + 1).then(resolve);
                }, 1000);
              } else {
                resolve({ success: false, error: error.message });
              }
            }
          } else {
            console.warn(`⚠️ HTTP ${res.statusCode} for ${symbol}`);
            if (retryCount < this.maxRetries && res.statusCode !== 404) {
              setTimeout(() => {
                this.fetchStockData(symbol, retryCount + 1).then(resolve);
              }, 2000);
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}` });
            }
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Network error for ${symbol}:`, error.message);
        if (retryCount < this.maxRetries) {
          setTimeout(() => {
            this.fetchStockData(symbol, retryCount + 1).then(resolve);
          }, 2000);
        } else {
          resolve({ success: false, error: error.message });
        }
      });

      req.on('timeout', () => {
        console.error(`❌ Timeout for ${symbol}`);
        req.destroy();
        if (retryCount < this.maxRetries) {
          setTimeout(() => {
            this.fetchStockData(symbol, retryCount + 1).then(resolve);
          }, 2000);
        } else {
          resolve({ success: false, error: 'Timeout' });
        }
      });

      req.end();
    });
  }

  // Extract fundamentals using comprehensive regex patterns
  extractFundamentals(html, symbol) {
    const fundamentals = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      source: 'screener.in',
      url: `https://www.screener.in/company/${symbol}/consolidated/`
    };

    // Extract all numbers from HTML
    const numberMatches = html.match(/<span class="number">([0-9,]+(?:\.[0-9]+)?)<\/span>/gi);
    
    if (numberMatches && numberMatches.length >= 1) {
      const marketCapValue = numberMatches[0].match(/([0-9,]+(?:\.[0-9]+)?)/);
      if (marketCapValue) {
        const capValue = parseFloat(marketCapValue[1].replace(/,/g, ''));
        fundamentals.marketCap = capValue;
        fundamentals.marketCapValue = capValue;
      }
    }

    if (numberMatches && numberMatches.length >= 2) {
      const priceValue = numberMatches[1].match(/([0-9,]+(?:\.[0-9]+)?)/);
      if (priceValue) {
        fundamentals.currentPrice = parseFloat(priceValue[1].replace(/,/g, ''));
      }
    }

    if (numberMatches && numberMatches.length >= 4) {
      const highValue = numberMatches[2].match(/([0-9,]+(?:\.[0-9]+)?)/);
      const lowValue = numberMatches[3].match(/([0-9,]+(?:\.[0-9]+)?)/);
      
      if (highValue) {
        fundamentals.week52High = parseFloat(highValue[1].replace(/,/g, ''));
      }
      if (lowValue) {
        fundamentals.week52Low = parseFloat(lowValue[1].replace(/,/g, ''));
      }
    }

    // Extract detailed financial metrics with improved patterns
    const metrics = {
      'Book Value': /Book Value[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
      'Dividend Yield': /Dividend Yield[^\d]*([0-9,]+(?:\.[0-9]+)?)%/gi,
      'Face Value': /Face Value[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
      'P/E Ratio': /P\/E[^\d]*([0-9,]+(?:\.[0-9]+)?)/gi,
      'ROE': /ROE[\s\S]{0,200}?([0-9,]+(?:\.[0-9]+)?)%/gi,
      'ROCE': /ROCE[\s\S]{0,200}?([0-9,]+(?:\.[0-9]+)?)%/gi,
      'Debt to Equity': /Debt to Equity[^\d]*([0-9,]+(?:\.[0-9]+)?)/gi,
      'Revenue Growth': /Revenue Growth[^\d\-]*([0-9,\-]+(?:\.[0-9]+)?)%/gi,
      'Profit Growth': /Profit Growth[^\d\-]*([0-9,\-]+(?:\.[0-9]+)?)%/gi
    };

    for (const [metric, pattern] of Object.entries(metrics)) {
      const match = html.match(pattern);
      if (match) {
        const value = match[0].match(/([0-9,\-]+(?:\.[0-9]+)?)/);
        if (value) {
          const numValue = parseFloat(value[1].replace(/,/g, ''));
          if (!isNaN(numValue)) {
            switch (metric) {
              case 'Book Value': fundamentals.bookValue = numValue; break;
              case 'Dividend Yield': fundamentals.dividendYield = numValue; break;
              case 'Face Value': fundamentals.faceValue = numValue; break;
              case 'P/E Ratio': fundamentals.peRatio = numValue; break;
              case 'ROE': fundamentals.roe = numValue; break;
              case 'ROCE': fundamentals.roce = numValue; break;
              case 'Debt to Equity': fundamentals.debtToEquity = numValue; break;
              case 'Revenue Growth': fundamentals.revenueGrowth = numValue; break;
              case 'Profit Growth': fundamentals.profitGrowth = numValue; break;
            }
          }
        }
      }
    }

    // Try alternative patterns for ROCE if not found
    if (!fundamentals.roce) {
      const roceAlternatives = [
        /Return on Capital Employed[\s\S]{0,200}?([0-9,]+(?:\.[0-9]+)?)%/gi,
        /Capital Employed[\s\S]{0,200}?([0-9,]+(?:\.[0-9]+)?)%/gi
      ];
      
      for (const pattern of roceAlternatives) {
        const match = html.match(pattern);
        if (match) {
          const value = match[0].match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (value) {
            const numValue = parseFloat(value[1].replace(/,/g, ''));
            if (!isNaN(numValue)) {
              fundamentals.roce = numValue;
              break;
            }
          }
        }
      }
    }

    // Calculate price change
    if (fundamentals.currentPrice && fundamentals.week52Low) {
      const change = fundamentals.currentPrice - fundamentals.week52Low;
      const changePercent = (change / fundamentals.week52Low) * 100;
      
      fundamentals.priceChange = parseFloat(change.toFixed(2));
      fundamentals.priceChangePercent = parseFloat(changePercent.toFixed(2));
    }

    return fundamentals;
  }

  // Process stocks in batches with resumability
  async processAllStocks() {
    console.log(`🚀 Starting robust data collection for ${STOCK_SYMBOLS.length} stocks`);
    
    // Load existing progress
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
      
      // Process batch concurrently
      const batchPromises = batch.map(async (symbol) => {
        this.processedCount++;
        console.log(`📈 Processing ${symbol} (${this.processedCount}/${STOCK_SYMBOLS.length})`);
        
        try {
          const result = await this.fetchStockData(symbol);
          
          if (result.success) {
            this.results.push(result.data);
            this.successCount++;
            console.log(`✅ ${symbol}: Success`);
          } else {
            this.errorCount++;
            console.log(`❌ ${symbol}: ${result.error}`);
          }
        } catch (error) {
          this.errorCount++;
          console.error(`💥 ${symbol}: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Save progress after each batch
      this.saveProgress();
      
      console.log(`📊 Batch completed: ${this.successCount} success, ${this.errorCount} errors`);
      
      // Longer delay between batches to be respectful
      if (i + this.batchSize < remainingStocks.length) {
        console.log('⏸️ Waiting 10 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Final save
    this.saveProgress();
    
    console.log(`\n🎯 COLLECTION COMPLETE!`);
    console.log(`✅ Successfully processed: ${this.successCount} stocks`);
    console.log(`❌ Failed: ${this.errorCount} stocks`);
    console.log(`📁 Total in dataset: ${this.results.length} stocks`);
    console.log(`💾 Data saved to: ${this.dataFile}`);
    
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
      estimatedTimeRemaining: this.getEstimatedTimeRemaining()
    };

    return progress;
  }

  getEstimatedTimeRemaining() {
    const remaining = STOCK_SYMBOLS.length - this.processedCount;
    const avgTimePerStock = (this.delayBetweenRequests + 1000) / 1000; // seconds
    const estimatedSeconds = remaining * avgTimePerStock;
    
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new RobustDataCollector();
  collector.processAllStocks()
    .then(results => {
      console.log(`🏁 Process completed with ${results.length} results`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}

module.exports = RobustDataCollector;