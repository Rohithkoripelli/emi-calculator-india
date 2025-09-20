/**
 * STOCK SCORING AND RECOMMENDATION ENGINE
 * Comprehensive scoring model based on financial metrics
 * Market cap categorization and portfolio allocation recommendations
 */

const fs = require('fs');

class StockScoringEngine {
  constructor() {
    this.dataFile = '/tmp/stock_data.json';
    this.stocks = [];
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
  }

  // Load stock data from Yahoo Finance collection
  loadStockData() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        throw new Error('Stock data file not found. Run data collection first.');
      }
      
      this.stocks = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      console.log(`📊 Loaded ${this.stocks.length} stocks for analysis`);
      return this.stocks;
    } catch (error) {
      console.error('❌ Error loading stock data:', error.message);
      throw error;
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

  // Calculate comprehensive stock score
  calculateStockScore(stock, normalization) {
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
  scoreAllStocks() {
    const stocks = this.loadStockData();
    
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
      const scoring = this.calculateStockScore(stock, normalization);
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
  generateRecommendations(amount, allocation, topN = 3) {
    const categories = this.scoreAllStocks();
    
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
  getTopStocks(category = 'all', limit = 10) {
    const categories = this.scoreAllStocks();
    
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
  
  try {
    // Example usage
    console.log('\n🎯 STOCK SCORING ENGINE TEST\n');
    
    // Get top stocks by category
    console.log('📈 Top 5 Large Cap Stocks:');
    const topLarge = engine.getTopStocks('large', 5);
    topLarge.forEach((stock, i) => {
      console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
    });
    
    console.log('\n📊 Top 5 Mid Cap Stocks:');
    const topMid = engine.getTopStocks('mid', 5);
    topMid.forEach((stock, i) => {
      console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
    });
    
    console.log('\n📉 Top 5 Small Cap Stocks:');
    const topSmall = engine.getTopStocks('small', 5);
    topSmall.forEach((stock, i) => {
      console.log(`${i+1}. ${stock.symbol} - Score: ${stock.stockScore} - Price: ₹${stock.currentPrice}`);
    });
    
    // Example portfolio recommendation
    console.log('\n💼 PORTFOLIO RECOMMENDATION EXAMPLE\n');
    const recommendations = engine.generateRecommendations(10000, {
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