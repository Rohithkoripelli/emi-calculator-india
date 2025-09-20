/**
 * RAILWAY-COMPATIBLE DATA FETCHER 
 * Simplified version that works around Node.js compatibility issues
 * Uses only built-in Node.js modules (no external dependencies)
 */

const https = require('https');
const fs = require('fs');

// Import the complete stock universe
const STOCK_SYMBOLS = require('./complete-stock-universe');

class RailwayDataFetcher {
  constructor() {
    this.processedCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.results = [];
    console.log('🔥 Railway Data Fetcher initialized');
    console.log('📊 Using pure Node.js regex parsing (no external deps)');
    console.log('❌ NO MOCK DATA - Only real market data');
  }

  // Fetch stock data from Screener.in using only built-in Node.js https
  async fetchFromScreener(symbol) {
    return new Promise((resolve, reject) => {
      const url = `https://www.screener.in/company/${symbol}/`;
      
      const options = {
        hostname: 'www.screener.in',
        path: `/company/${symbol}/`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
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
              console.error(`❌ Screener: Parse error for ${symbol}:`, error.message);
              resolve({ success: false, error: error.message });
            }
          } else {
            console.warn(`⚠️ Screener: HTTP ${res.statusCode} for ${symbol}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Screener: Network error for ${symbol}:`, error.message);
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        console.error(`❌ Screener: Timeout for ${symbol}`);
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      req.end();
    });
  }

  // Extract fundamentals from Screener.in HTML using pure regex
  extractFundamentals(html, symbol) {
    console.log(`🔍 Extracting COMPLETE data for ${symbol} from Screener.in...`);
    
    const fundamentals = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      source: 'screener.in'
    };

    // Extract Current Price
    const pricePatterns = [
      /Current Price[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
      /Price[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi
    ];
    
    for (const pattern of pricePatterns) {
      const priceMatch = html.match(pattern);
      if (priceMatch) {
        const priceValue = priceMatch[0].match(/([0-9,]+(?:\.[0-9]+)?)/);
        if (priceValue) {
          fundamentals.currentPrice = parseFloat(priceValue[1].replace(/,/g, ''));
          console.log(`💰 Found Current Price: ₹${fundamentals.currentPrice}`);
          break;
        }
      }
    }

    // Extract financial metrics using multiple selectors
    const metrics = {
      'Book Value': /Book Value[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
      'Dividend Yield': /Dividend Yield[^\d]*([0-9,]+(?:\.[0-9]+)?)%/gi,
      'Face Value': /Face Value[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
      'P/E Ratio': /P\/E[^\d]*([0-9,]+(?:\.[0-9]+)?)/gi,
      'ROE': /ROE[^\d]*([0-9,]+(?:\.[0-9]+)?)%/gi,
      'ROCE': /ROCE[^\d]*([0-9,]+(?:\.[0-9]+)?)%/gi,
      'Market Cap': /Market Cap[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)\s*Cr/gi
    };

    for (const [metric, pattern] of Object.entries(metrics)) {
      const match = html.match(pattern);
      if (match) {
        const value = match[0].match(/([0-9,]+(?:\.[0-9]+)?)/);
        if (value) {
          const numValue = parseFloat(value[1].replace(/,/g, ''));
          switch (metric) {
            case 'Book Value':
              fundamentals.bookValue = numValue;
              console.log(`📚 Found Book Value: ₹${numValue}`);
              break;
            case 'Dividend Yield':
              fundamentals.dividendYield = numValue;
              console.log(`💎 Found Dividend Yield: ${numValue}%`);
              break;
            case 'Face Value':
              fundamentals.faceValue = numValue;
              console.log(`🎭 Found Face Value: ₹${numValue}`);
              break;
            case 'P/E Ratio':
              fundamentals.peRatio = numValue;
              console.log(`📊 Found P/E Ratio: ${numValue}`);
              break;
            case 'ROE':
              fundamentals.roe = numValue;
              console.log(`📊 Found ROE: ${numValue}%`);
              break;
            case 'ROCE':
              fundamentals.roce = numValue;
              console.log(`📊 Found ROCE: ${numValue}%`);
              break;
            case 'Market Cap':
              fundamentals.marketCap = numValue;
              console.log(`💰 Found Market Cap: ₹${numValue} Cr`);
              break;
          }
        }
      }
    }

    return fundamentals;
  }

  // Process all stocks
  async processAllStocks() {
    console.log(`🚀 Starting REAL data population for ${STOCK_SYMBOLS.length}+ stocks`);
    console.log('⏱️ Rate limit: 1 stock per 5 seconds (safe for Screener.in)');
    
    for (let i = 0; i < STOCK_SYMBOLS.length; i++) { // Process ALL 2600+ stocks
      const symbol = STOCK_SYMBOLS[i];
      this.processedCount++;
      
      console.log(`📊 Processing ${symbol} (${this.processedCount}/${Math.min(STOCK_SYMBOLS.length, 50)})`);
      
      try {
        const result = await this.fetchFromScreener(symbol);
        
        if (result.success) {
          this.results.push(result.data);
          this.successCount++;
          console.log(`✅ Success: ${symbol} - Real data extracted`);
        } else {
          this.errorCount++;
          console.warn(`⚠️ Skipped: ${symbol} - ${result.error}`);
        }
        
        if (this.processedCount % 10 === 0) {
          console.log(`🔄 Progress: ${this.processedCount}/${Math.min(STOCK_SYMBOLS.length, 50)} (${Math.round(this.processedCount/Math.min(STOCK_SYMBOLS.length, 50)*100)}%)`);
          console.log(`   ✅ Success: ${this.successCount} | ❌ Failed: ${this.errorCount}`);
        }
        
        // Rate limiting - 5 second delay between requests
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        this.errorCount++;
        console.error(`💥 Error processing ${symbol}:`, error.message);
      }
    }
    
    // Save results to file
    const outputFile = '/tmp/stock_data.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Successfully processed: ${this.successCount} stocks`);
    console.log(`❌ Failed: ${this.errorCount} stocks`);
    console.log(`💾 Results saved to: ${outputFile}`);
    console.log(`🎯 Real data extraction completed!`);
    
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new RailwayDataFetcher();
  fetcher.processAllStocks()
    .then(results => {
      console.log(`🏁 Process completed with ${results.length} results`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}

module.exports = RailwayDataFetcher;