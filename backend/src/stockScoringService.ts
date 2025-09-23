/**
 * Production-Grade Stock Scoring Service
 * Implements the exact scoring algorithm with specified weights and normalization
 */

import StockDatabaseService from './stockDatabaseService';

interface ScoringMetrics {
  peRatio: number | null;
  roe: number | null;
  roce: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
}

interface NormalizedMetrics {
  peRatio: number; // Inverse normalized (lower is better)
  roe: number; // Direct normalized (higher is better)
  roce: number; // Direct normalized (higher is better)
  debtToEquity: number; // Inverse normalized (lower is better)
  revenueGrowth: number; // Direct normalized (higher is better)
  profitGrowth: number; // Direct normalized (higher is better)
}

interface ScoringWeights {
  peRatio: number; // 15%
  roe: number; // 20%
  roce: number; // 20%
  debtToEquity: number; // 10%
  revenueGrowth: number; // 15%
  profitGrowth: number; // 20%
}

interface StockScore {
  symbol: string;
  totalScore: number;
  normalizedMetrics: NormalizedMetrics;
  contributionBreakdown: {
    peRatio: number;
    roe: number;
    roce: number;
    debtToEquity: number;
    revenueGrowth: number;
    profitGrowth: number;
  };
  marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  rank?: number;
}

interface MarketStats {
  peRatio: { min: number; max: number; mean: number; std: number };
  roe: { min: number; max: number; mean: number; std: number };
  roce: { min: number; max: number; mean: number; std: number };
  debtToEquity: { min: number; max: number; mean: number; std: number };
  revenueGrowth: { min: number; max: number; mean: number; std: number };
  profitGrowth: { min: number; max: number; mean: number; std: number };
}

export class StockScoringService {
  private static readonly SCORING_WEIGHTS: ScoringWeights = {
    peRatio: 0.15, // 15% - Lower is better (inverse)
    roe: 0.20, // 20% - Higher is better
    roce: 0.20, // 20% - Higher is better
    debtToEquity: 0.10, // 10% - Lower is better (inverse)
    revenueGrowth: 0.15, // 15% - Higher is better
    profitGrowth: 0.20 // 20% - Higher is better
  };

  /**
   * Calculate scores for all stocks in the database
   */
  static async calculateAllStockScores(): Promise<void> {
    console.log('🎯 Starting production-grade stock scoring calculation...');
    console.log('📊 Fetching all stocks with fundamental data...');

    // Get all stocks with fundamental data
    const allStocks = await StockDatabaseService.getAllStocksWithFundamentals();
    
    if (allStocks.length === 0) {
      console.log('❌ No stocks found with fundamental data');
      return;
    }

    console.log(`✅ Found ${allStocks.length} stocks with fundamental data`);

    // Extract metrics and calculate market statistics
    const allMetrics = this.extractMetricsFromStocks(allStocks);
    const marketStats = this.calculateMarketStatistics(allMetrics);

    console.log('📈 Market Statistics:');
    console.log(`   PE Ratio: ${marketStats.peRatio.min.toFixed(1)} - ${marketStats.peRatio.max.toFixed(1)} (avg: ${marketStats.peRatio.mean.toFixed(1)})`);
    console.log(`   ROE: ${marketStats.roe.min.toFixed(1)}% - ${marketStats.roe.max.toFixed(1)}% (avg: ${marketStats.roe.mean.toFixed(1)}%)`);
    console.log(`   ROCE: ${marketStats.roce.min.toFixed(1)}% - ${marketStats.roce.max.toFixed(1)}% (avg: ${marketStats.roce.mean.toFixed(1)}%)`);

    // Calculate scores for each stock
    const stockScores: StockScore[] = [];
    
    for (const stock of allStocks) {
      const metrics = this.extractMetricsFromStock(stock);
      if (this.hasValidMetrics(metrics)) {
        const normalizedMetrics = this.normalizeMetrics(metrics, marketStats);
        const score = this.calculateScore(stock._id, normalizedMetrics);
        stockScores.push(score);
      }
    }

    console.log(`✅ Calculated scores for ${stockScores.length} stocks`);

    // Rank stocks and update database
    await this.rankAndUpdateStocks(stockScores);

    console.log('🎉 Stock scoring calculation completed successfully');
  }

  /**
   * Extract metrics from all stocks for statistical analysis
   */
  private static extractMetricsFromStocks(stocks: any[]): ScoringMetrics[] {
    return stocks.map(stock => this.extractMetricsFromStock(stock))
                .filter(metrics => this.hasValidMetrics(metrics));
  }

  /**
   * Extract scoring metrics from a single stock
   */
  private static extractMetricsFromStock(stock: any): ScoringMetrics {
    const fundamentals = stock.fundamentals || {};
    
    return {
      peRatio: fundamentals.peRatio || null,
      roe: fundamentals.roe || null,
      roce: fundamentals.roce || null,
      debtToEquity: fundamentals.debtToEquity || null,
      revenueGrowth: fundamentals.revenueGrowth || null,
      profitGrowth: fundamentals.profitGrowth || null
    };
  }

  /**
   * Check if stock has valid metrics for scoring
   */
  private static hasValidMetrics(metrics: ScoringMetrics): boolean {
    return metrics.peRatio !== null && 
           metrics.roe !== null && 
           metrics.roce !== null &&
           metrics.debtToEquity !== null &&
           metrics.revenueGrowth !== null &&
           metrics.profitGrowth !== null;
  }

  /**
   * Calculate market-wide statistics for normalization
   */
  private static calculateMarketStatistics(allMetrics: ScoringMetrics[]): MarketStats {
    const stats: MarketStats = {
      peRatio: this.calculateStats(allMetrics.map(m => m.peRatio!)),
      roe: this.calculateStats(allMetrics.map(m => m.roe!)),
      roce: this.calculateStats(allMetrics.map(m => m.roce!)),
      debtToEquity: this.calculateStats(allMetrics.map(m => m.debtToEquity!)),
      revenueGrowth: this.calculateStats(allMetrics.map(m => m.revenueGrowth!)),
      profitGrowth: this.calculateStats(allMetrics.map(m => m.profitGrowth!))
    };

    return stats;
  }

  /**
   * Calculate min, max, mean, and standard deviation for a metric
   */
  private static calculateStats(values: number[]): { min: number; max: number; mean: number; std: number } {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return { min, max, mean, std };
  }

  /**
   * Normalize metrics using z-score normalization (handles outliers better than min-max)
   */
  private static normalizeMetrics(metrics: ScoringMetrics, marketStats: MarketStats): NormalizedMetrics {
    // Z-score normalization: (value - mean) / std
    // Convert to 0-1 scale using sigmoid function for better distribution
    
    const zScores = {
      peRatio: (metrics.peRatio! - marketStats.peRatio.mean) / marketStats.peRatio.std,
      roe: (metrics.roe! - marketStats.roe.mean) / marketStats.roe.std,
      roce: (metrics.roce! - marketStats.roce.mean) / marketStats.roce.std,
      debtToEquity: (metrics.debtToEquity! - marketStats.debtToEquity.mean) / marketStats.debtToEquity.std,
      revenueGrowth: (metrics.revenueGrowth! - marketStats.revenueGrowth.mean) / marketStats.revenueGrowth.std,
      profitGrowth: (metrics.profitGrowth! - marketStats.profitGrowth.mean) / marketStats.profitGrowth.std
    };

    // Convert z-scores to 0-1 scale using sigmoid function
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

    return {
      peRatio: 1 - sigmoid(zScores.peRatio), // Inverse for PE (lower is better)
      roe: sigmoid(zScores.roe), // Direct for ROE (higher is better)
      roce: sigmoid(zScores.roce), // Direct for ROCE (higher is better)
      debtToEquity: 1 - sigmoid(zScores.debtToEquity), // Inverse for debt (lower is better)
      revenueGrowth: sigmoid(zScores.revenueGrowth), // Direct for growth (higher is better)
      profitGrowth: sigmoid(zScores.profitGrowth) // Direct for growth (higher is better)
    };
  }

  /**
   * Calculate final weighted score
   */
  private static calculateScore(symbol: string, normalizedMetrics: NormalizedMetrics): StockScore {
    const weights = this.SCORING_WEIGHTS;
    
    const contributionBreakdown = {
      peRatio: normalizedMetrics.peRatio * weights.peRatio,
      roe: normalizedMetrics.roe * weights.roe,
      roce: normalizedMetrics.roce * weights.roce,
      debtToEquity: normalizedMetrics.debtToEquity * weights.debtToEquity,
      revenueGrowth: normalizedMetrics.revenueGrowth * weights.revenueGrowth,
      profitGrowth: normalizedMetrics.profitGrowth * weights.profitGrowth
    };

    const totalScore = Object.values(contributionBreakdown).reduce((sum, contribution) => sum + contribution, 0);

    return {
      symbol,
      totalScore,
      normalizedMetrics,
      contributionBreakdown,
      marketCapCategory: 'SMALL_CAP' // Will be updated later with proper market cap calculation
    };
  }

  /**
   * Rank stocks and update database with scores and market cap categories
   */
  private static async rankAndUpdateStocks(stockScores: StockScore[]): Promise<void> {
    console.log('📊 Ranking stocks and updating database...');

    // Sort by total score (highest first)
    stockScores.sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranks
    stockScores.forEach((score, index) => {
      score.rank = index + 1;
    });

    // Update database with scores and market cap categories
    const updatePromises = stockScores.map(async (score) => {
      try {
        // Get current stock data to determine market cap category
        const stock = await StockDatabaseService.getStock(score.symbol);
        if (stock) {
          const marketCapCategory = this.determineMarketCapCategory(stock);
          
          // Update stock with new score and market cap category
          await StockDatabaseService.updateStockScore(score.symbol, {
            qualityScore: score.totalScore,
            scoreBreakdown: score.contributionBreakdown,
            marketCapCategory: marketCapCategory,
            rank: score.rank,
            lastScoreUpdate: new Date()
          });
        }
      } catch (error) {
        console.error(`❌ Error updating score for ${score.symbol}:`, error);
      }
    });

    await Promise.all(updatePromises);

    // Log top performers
    console.log('\n🏆 TOP 10 HIGHEST SCORING STOCKS:');
    stockScores.slice(0, 10).forEach((score, index) => {
      console.log(`${index + 1}. ${score.symbol}: ${score.totalScore.toFixed(4)} (${this.getMarketCapCategoryFromStock(score.symbol)})`);
    });

    console.log(`✅ Updated ${stockScores.length} stocks with calculated scores and market cap categories`);
  }

  /**
   * Determine market cap category based on market cap
   * Large Cap: > ₹20,000 Cr
   * Mid Cap: ₹5,000 - ₹20,000 Cr  
   * Small Cap: < ₹5,000 Cr
   */
  private static determineMarketCapCategory(stock: any): 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' {
    const marketCapStr = stock.fundamentals?.marketCap;
    
    if (!marketCapStr) return 'SMALL_CAP';

    // Parse market cap string (e.g., "₹15.2 L Cr" or "₹1,234 Cr")
    const marketCapCrores = this.parseMarketCapToCrores(marketCapStr);
    
    if (marketCapCrores > 20000) {
      return 'LARGE_CAP';
    } else if (marketCapCrores >= 5000) {
      return 'MID_CAP';
    } else {
      return 'SMALL_CAP';
    }
  }

  /**
   * Parse market cap string to crores
   */
  private static parseMarketCapToCrores(marketCapStr: string): number {
    if (!marketCapStr) return 0;

    // Remove currency symbols and clean string
    const cleaned = marketCapStr.replace(/[₹,]/g, '').trim().toUpperCase();
    
    // Match patterns like "15.2 L CR" or "1234 CR"
    const match = cleaned.match(/([\d.]+)\s*([A-Z]*)\s*CR/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    // Convert to crores
    if (unit.includes('L')) {
      return value * 100000; // Lakh crores to crores
    } else {
      return value; // Already in crores
    }
  }

  /**
   * Helper method to get market cap category for logging
   */
  private static async getMarketCapCategoryFromStock(symbol: string): Promise<string> {
    try {
      const stock = await StockDatabaseService.getStock(symbol);
      return stock?.marketCapCategory || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get top stocks by market cap category
   */
  static async getTopStocksByCategory(
    category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP',
    limit: number = 10
  ): Promise<any[]> {
    return await StockDatabaseService.getTopStocksByCategory(category, limit);
  }

  /**
   * Get scoring statistics for analysis
   */
  static async getScoringStatistics(): Promise<any> {
    const stats = await StockDatabaseService.getScoringStatistics();
    return stats;
  }
}

export default StockScoringService;