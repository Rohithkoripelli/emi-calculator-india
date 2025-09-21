/**
 * STOCK SCORING AND RECOMMENDATION ENGINE
 * Comprehensive scoring model based on financial metrics
 * Market cap categorization and portfolio allocation recommendations
 */

const fs = require('fs');

class StockScoringEngine {
  constructor() {
    this.dataFile = '/tmp/stock_data.json'; // Fallback for compatibility
    this.stocks = [];
    this.mongoService = require('./mongodb-service') ? new (require('./mongodb-service'))() : null;
    this.marketCapCategories = {
      LARGE_CAP: 20000, // > 20,000 crores
      MID_CAP: 5000     // 5,000 - 20,000 crores
      // SMALL_CAP: < 5,000 crores
    };
    
    // Scoring weights for different metrics
    this.scoringWeights = {
      peRatio: 0.15,        // 15% - Lower is better
      roe: 0.20,            // 20% - Higher is better (if available)
      roce: 0.20,           // 20% - Higher is better (if available)
      debtToEquity: 0.10,   // 10% - Lower is better
      revenueGrowth: 0.15,  // 15% - Higher is better
      profitMargins: 0.20   // 20% - Higher is better (replacing profit growth)
    };
    
    console.log('🎯 Stock Scoring Engine initialized');
    console.log('📊 Scoring weights configured');
    console.log('🏷️ Market cap categories: Large (>20k Cr), Mid (5k-20k Cr), Small (<5k Cr)');
    console.log('💾 MongoDB integration:', this.mongoService ? 'enabled' : 'disabled (fallback to files)');
  }

  // Load stock data from MongoDB or fallback to file
  async loadStockData() {
    try {
      // Try MongoDB first
      if (this.mongoService) {
        console.log('📊 Loading stock data from MongoDB...');
        const mongoResult = await this.mongoService.getStockData();
        if (mongoResult.success && mongoResult.data.length > 0) {
          this.stocks = mongoResult.data;
          console.log(`✅ Loaded ${this.stocks.length} stocks from MongoDB`);
          return this.stocks;
        } else {
          console.log('⚠️ MongoDB data unavailable, falling back to file...');
        }
      }
      
      // Fallback to file-based data
      if (!fs.existsSync(this.dataFile)) {
        throw new Error('Stock data not found in MongoDB or file. Run data collection first.');
      }
      
      this.stocks = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      console.log(`📊 Loaded ${this.stocks.length} stocks from file (fallback)`);
      return this.stocks;
    } catch (error) {
      console.error('❌ Error loading stock data:', error.message);
      throw error;
    }
  }

  // Get market cap category for a single stock
  getMarketCapCategory(marketCapCrores) {
    if (!marketCapCrores || marketCapCrores <= 0) {
      return 'other';
    }

    if (marketCapCrores > this.marketCapCategories.LARGE_CAP) {
      return 'large-cap';
    } else if (marketCapCrores > this.marketCapCategories.MID_CAP) {
      return 'mid-cap';
    } else {
      return 'small-cap';
    }
  }

  // Categorize stocks by market cap
  categorizeByMarketCap(stocks) {
    const categories = {
      largeCap: [],
      midCap: [],
      smallCap: []
    };

    stocks.forEach(stock => {
      if (!stock.marketCapCrores || stock.marketCapCrores <= 0) {
        return; // Skip stocks without valid market cap
      }

      if (stock.marketCapCrores > this.marketCapCategories.LARGE_CAP) {
        stock.category = 'Large Cap';
        categories.largeCap.push(stock);
      } else if (stock.marketCapCrores > this.marketCapCategories.MID_CAP) {
        stock.category = 'Mid Cap';
        categories.midCap.push(stock);
      } else {
        stock.category = 'Small Cap';
        categories.smallCap.push(stock);
      }
    });

    console.log(`🏷️ Categorization complete:`);
    console.log(`   📈 Large Cap: ${categories.largeCap.length} stocks`);
    console.log(`   📊 Mid Cap: ${categories.midCap.length} stocks`);
    console.log(`   📉 Small Cap: ${categories.smallCap.length} stocks`);

    return categories;
  }

  // Normalize metric values using min-max normalization
  normalizeMetrics(stocks, metrics) {
    const normalized = {};

    metrics.forEach(metric => {
      const values = stocks
        .map(stock => stock[metric])
        .filter(val => val !== null && val !== undefined && !isNaN(val));
      
      if (values.length === 0) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      if (range === 0) return; // All values are the same

      normalized[metric] = { min, max, range };
    });

    return normalized;
  }

  // Calculate normalized score for a metric
  getNormalizedScore(value, metric, normalization, inverse = false) {
    if (value === null || value === undefined || isNaN(value)) {
      return 0; // Return 0 for missing values
    }

    const { min, max, range } = normalization[metric];
    if (!range || range === 0) return 0.5; // Neutral score if no variation

    let score = (value - min) / range;
    
    // Inverse normalization for metrics where lower is better
    if (inverse) {
      score = 1 - score;
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  // Calculate simplified individual stock score (without normalization)
  calculateStockScore(stock) {
    let totalScore = 0;
    let totalWeight = 0;
    let metricCount = 0;

    // PE Ratio scoring (lower is better) - use heuristic ranges
    if (stock.peRatio && stock.peRatio > 0) {
      let peScore = 0;
      if (stock.peRatio <= 15) peScore = 1.0;          // Excellent
      else if (stock.peRatio <= 20) peScore = 0.8;     // Very Good
      else if (stock.peRatio <= 25) peScore = 0.6;     // Good
      else if (stock.peRatio <= 35) peScore = 0.4;     // Fair
      else if (stock.peRatio <= 50) peScore = 0.2;     // Poor
      else peScore = 0.1;                              // Very Poor
      
      totalScore += peScore * this.scoringWeights.peRatio;
      totalWeight += this.scoringWeights.peRatio;
      metricCount++;
    }

    // ROE scoring (higher is better) - use alternative if not available
    let roeValue = stock.roe || stock.returnOnEquity;
    if (roeValue && roeValue > 0) {
      let roeScore = 0;
      if (roeValue >= 25) roeScore = 1.0;              // Excellent
      else if (roeValue >= 20) roeScore = 0.8;         // Very Good
      else if (roeValue >= 15) roeScore = 0.6;         // Good
      else if (roeValue >= 10) roeScore = 0.4;         // Fair
      else if (roeValue >= 5) roeScore = 0.2;          // Poor
      else roeScore = 0.1;                             // Very Poor
      
      totalScore += roeScore * this.scoringWeights.roe;
      totalWeight += this.scoringWeights.roe;
      metricCount++;
    }

    // ROCE scoring (higher is better) - use alternative if not available
    let roceValue = stock.roce || stock.returnOnCapitalEmployed;
    if (roceValue && roceValue > 0) {
      let roceScore = 0;
      if (roceValue >= 25) roceScore = 1.0;            // Excellent
      else if (roceValue >= 20) roceScore = 0.8;       // Very Good
      else if (roceValue >= 15) roceScore = 0.6;       // Good
      else if (roceValue >= 10) roceScore = 0.4;       // Fair
      else if (roceValue >= 5) roceScore = 0.2;        // Poor
      else roceScore = 0.1;                            // Very Poor
      
      totalScore += roceScore * this.scoringWeights.roce;
      totalWeight += this.scoringWeights.roce;
      metricCount++;
    }

    // Debt to Equity scoring (lower is better)
    if (stock.debtToEquity && stock.debtToEquity >= 0) {
      let deScore = 0;
      if (stock.debtToEquity <= 0.3) deScore = 1.0;    // Excellent
      else if (stock.debtToEquity <= 0.5) deScore = 0.8; // Very Good
      else if (stock.debtToEquity <= 1.0) deScore = 0.6; // Good
      else if (stock.debtToEquity <= 2.0) deScore = 0.4; // Fair
      else if (stock.debtToEquity <= 3.0) deScore = 0.2; // Poor
      else deScore = 0.1;                               // Very Poor
      
      totalScore += deScore * this.scoringWeights.debtToEquity;
      totalWeight += this.scoringWeights.debtToEquity;
      metricCount++;
    }

    // Revenue Growth scoring (higher is better)
    if (stock.revenueGrowth && !isNaN(stock.revenueGrowth)) {
      let rgScore = 0;
      if (stock.revenueGrowth >= 0.3) rgScore = 1.0;    // Excellent (>30%)
      else if (stock.revenueGrowth >= 0.2) rgScore = 0.8; // Very Good (20-30%)
      else if (stock.revenueGrowth >= 0.1) rgScore = 0.6; // Good (10-20%)
      else if (stock.revenueGrowth >= 0.05) rgScore = 0.4; // Fair (5-10%)
      else if (stock.revenueGrowth >= 0) rgScore = 0.2;   // Poor (0-5%)
      else rgScore = 0.1;                                 // Very Poor (negative)
      
      totalScore += rgScore * this.scoringWeights.revenueGrowth;
      totalWeight += this.scoringWeights.revenueGrowth;
      metricCount++;
    }

    // Profit Margins scoring (higher is better)
    if (stock.profitMargins && !isNaN(stock.profitMargins)) {
      let pmScore = 0;
      if (stock.profitMargins >= 0.25) pmScore = 1.0;   // Excellent (>25%)
      else if (stock.profitMargins >= 0.2) pmScore = 0.8; // Very Good (20-25%)
      else if (stock.profitMargins >= 0.15) pmScore = 0.6; // Good (15-20%)
      else if (stock.profitMargins >= 0.1) pmScore = 0.4; // Fair (10-15%)
      else if (stock.profitMargins >= 0.05) pmScore = 0.2; // Poor (5-10%)
      else pmScore = 0.1;                                 // Very Poor (<5%)
      
      totalScore += pmScore * this.scoringWeights.profitMargins;
      totalWeight += this.scoringWeights.profitMargins;
      metricCount++;
    }

    // Calculate final score (0-100 scale)
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
  }

  // Calculate comprehensive stock score with normalization (for bulk analysis)
  calculateStockScoreWithNormalization(stock, normalization) {
    let totalScore = 0;
    let totalWeight = 0;

    // PE Ratio (lower is better)
    if (stock.peRatio && normalization.peRatio) {
      const score = this.getNormalizedScore(stock.peRatio, 'peRatio', normalization, true);
      totalScore += score * this.scoringWeights.peRatio;
      totalWeight += this.scoringWeights.peRatio;
    }

    // ROE (higher is better) - Use alternative if not available
    let roeValue = stock.roe || stock.returnOnEquity;
    if (roeValue && normalization.roe) {
      const score = this.getNormalizedScore(roeValue, 'roe', normalization, false);
      totalScore += score * this.scoringWeights.roe;
      totalWeight += this.scoringWeights.roe;
    }

    // ROCE (higher is better) - Use alternative if not available
    let roceValue = stock.roce || stock.returnOnCapitalEmployed;
    if (roceValue && normalization.roce) {
      const score = this.getNormalizedScore(roceValue, 'roce', normalization, false);
      totalScore += score * this.scoringWeights.roce;
      totalWeight += this.scoringWeights.roce;
    }

    // Debt to Equity (lower is better)
    if (stock.debtToEquity && normalization.debtToEquity) {
      const score = this.getNormalizedScore(stock.debtToEquity, 'debtToEquity', normalization, true);
      totalScore += score * this.scoringWeights.debtToEquity;
      totalWeight += this.scoringWeights.debtToEquity;
    }

    // Revenue Growth (higher is better)
    if (stock.revenueGrowth && normalization.revenueGrowth) {
      const score = this.getNormalizedScore(stock.revenueGrowth, 'revenueGrowth', normalization, false);
      totalScore += score * this.scoringWeights.revenueGrowth;
      totalWeight += this.scoringWeights.revenueGrowth;
    }

    // Profit Margins (higher is better)
    if (stock.profitMargins && normalization.profitMargins) {
      const score = this.getNormalizedScore(stock.profitMargins, 'profitMargins', normalization, false);
      totalScore += score * this.scoringWeights.profitMargins;
      totalWeight += this.scoringWeights.profitMargins;
    }

    // Calculate final normalized score
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
      weightCoverage: totalWeight,
      metrics: {
        peRatio: stock.peRatio,
        roe: roeValue,
        roce: roceValue,
        debtToEquity: stock.debtToEquity,
        revenueGrowth: stock.revenueGrowth,
        profitMargins: stock.profitMargins
      }
    };
  }

  // Score all stocks and categorize them
  async scoreAllStocks() {
    const stocks = await this.loadStockData();
    
    // Filter stocks with valid data
    const validStocks = stocks.filter(stock => 
      stock.marketCapCrores && 
      stock.marketCapCrores > 0 &&
      stock.currentPrice &&
      stock.currentPrice > 0
    );

    console.log(`📊 Processing ${validStocks.length} stocks with valid data`);

    // Normalize metrics across all stocks
    const metrics = ['peRatio', 'roe', 'roce', 'debtToEquity', 'revenueGrowth', 'profitMargins'];
    const normalization = this.normalizeMetrics(validStocks, metrics);

    // Calculate scores for all stocks
    const scoredStocks = validStocks.map(stock => {
      const scoring = this.calculateStockScoreWithNormalization(stock, normalization);
      return {
        ...stock,
        stockScore: scoring.score,
        scoreMetrics: scoring.metrics,
        weightCoverage: scoring.weightCoverage
      };
    });

    // Categorize by market cap
    const categories = this.categorizeByMarketCap(scoredStocks);

    // Sort each category by score
    categories.largeCap.sort((a, b) => b.stockScore - a.stockScore);
    categories.midCap.sort((a, b) => b.stockScore - a.stockScore);
    categories.smallCap.sort((a, b) => b.stockScore - a.stockScore);

    console.log('🎯 Stock scoring completed');
    console.log(`📈 Top Large Cap: ${categories.largeCap[0]?.symbol} (${categories.largeCap[0]?.stockScore})`);
    console.log(`📊 Top Mid Cap: ${categories.midCap[0]?.symbol} (${categories.midCap[0]?.stockScore})`);
    console.log(`📉 Top Small Cap: ${categories.smallCap[0]?.symbol} (${categories.smallCap[0]?.stockScore})`);

    return categories;
  }

  // Generate portfolio recommendations
  async generateRecommendations(amount, allocation, topN = 3) {
    const categories = await this.scoreAllStocks();
    
    const recommendations = {
      totalAmount: amount,
      allocation: allocation,
      recommendations: {
        largeCap: [],
        midCap: [],
        smallCap: []
      },
      summary: {
        totalStocks: 0,
        largeCapAmount: 0,
        midCapAmount: 0,
        smallCapAmount: 0
      }
    };

    // Calculate allocation amounts
    const largeCapAmount = amount * (allocation.largeCap / 100);
    const midCapAmount = amount * (allocation.midCap / 100);
    const smallCapAmount = amount * (allocation.smallCap / 100);

    recommendations.summary.largeCapAmount = largeCapAmount;
    recommendations.summary.midCapAmount = midCapAmount;
    recommendations.summary.smallCapAmount = smallCapAmount;

    // Generate recommendations for each category
    this.generateCategoryRecommendations(categories.largeCap, largeCapAmount, topN, recommendations.recommendations.largeCap);
    this.generateCategoryRecommendations(categories.midCap, midCapAmount, topN, recommendations.recommendations.midCap);
    this.generateCategoryRecommendations(categories.smallCap, smallCapAmount, topN, recommendations.recommendations.smallCap);

    recommendations.summary.totalStocks = 
      recommendations.recommendations.largeCap.length +
      recommendations.recommendations.midCap.length +
      recommendations.recommendations.smallCap.length;

    return recommendations;
  }

  // Generate recommendations for a specific category
  generateCategoryRecommendations(stocks, amount, topN, recommendations) {
    if (!stocks || stocks.length === 0 || amount <= 0) return;

    const topStocks = stocks.slice(0, Math.min(topN, stocks.length));
    const amountPerStock = amount / topStocks.length;

    topStocks.forEach(stock => {
      const qty = Math.floor(amountPerStock / stock.currentPrice);
      const allocation = qty * stock.currentPrice;

      if (qty > 0) {
        recommendations.push({
          symbol: stock.symbol,
          companyName: stock.companyName || stock.symbol,
          currentPrice: stock.currentPrice,
          marketCapCrores: stock.marketCapCrores,
          stockScore: stock.stockScore,
          allocation: Math.round(allocation),
          quantity: qty,
          scoreMetrics: stock.scoreMetrics
        });
      }
    });
  }

  // Get top performing stocks by category
  async getTopStocks(category = 'all', limit = 10) {
    const categories = await this.scoreAllStocks();
    
    let stocks = [];
    if (category === 'large' || category === 'largeCap') {
      stocks = categories.largeCap;
    } else if (category === 'mid' || category === 'midCap') {
      stocks = categories.midCap;
    } else if (category === 'small' || category === 'smallCap') {
      stocks = categories.smallCap;
    } else {
      stocks = [...categories.largeCap, ...categories.midCap, ...categories.smallCap]
        .sort((a, b) => b.stockScore - a.stockScore);
    }

    return stocks.slice(0, limit).map(stock => ({
      symbol: stock.symbol,
      companyName: stock.companyName || stock.symbol,
      category: stock.category,
      currentPrice: stock.currentPrice,
      marketCapCrores: stock.marketCapCrores,
      stockScore: stock.stockScore,
      scoreMetrics: stock.scoreMetrics,
      recommendationKey: stock.recommendationKey
    }));
  }
}

// Export the class for use in other modules
module.exports = StockScoringEngine;

// Run scoring if called directly
if (require.main === module) {
  const engine = new StockScoringEngine();
  
  async function runTest() {
    try {
      // Example usage
      console.log('\n🎯 STOCK SCORING ENGINE TEST (MongoDB Integration)\n');
      
      // Get top stocks by category
      console.log('📈 Top 5 Large Cap Stocks:');
      const topLarge = await engine.getTopStocks('large', 5);
      topLarge.forEach((stock, i) => {
        console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
      });
      
      console.log('\n📊 Top 5 Mid Cap Stocks:');
      const topMid = await engine.getTopStocks('mid', 5);
      topMid.forEach((stock, i) => {
        console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
      });
      
      console.log('\n📉 Top 5 Small Cap Stocks:');
      const topSmall = await engine.getTopStocks('small', 5);
      topSmall.forEach((stock, i) => {
        console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
      });
      
      // Example portfolio recommendation
      console.log('\n💼 PORTFOLIO RECOMMENDATION EXAMPLE (MongoDB Data)\n');
      const recommendations = await engine.generateRecommendations(10000, {
        largeCap: 30,
        midCap: 40, 
        smallCap: 30
      });
      
      console.log('Portfolio Allocation for ₹10,000:');
      console.log(`Large Cap (30%): ₹${recommendations.summary.largeCapAmount}`);
      console.log(`Mid Cap (40%): ₹${recommendations.summary.midCapAmount}`);
      console.log(`Small Cap (30%): ₹${recommendations.summary.smallCapAmount}`);
      
      console.log('\nRecommended Stocks:');
      console.log(JSON.stringify(recommendations, null, 2));
      
    } catch (error) {
      console.error('❌ Error running scoring engine:', error.message);
      process.exit(1);
    }
  }
  
  runTest();
}