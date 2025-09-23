/**
 * Stock Scoring Engine
 * Advanced weighted scoring model for ranking stocks based on fundamental metrics
 */

import { StockDocument, ScoringWeights, DEFAULT_SCORING_WEIGHTS } from './stockDataModels';
import StockDatabaseService from './stockDatabaseService';

interface NormalizedMetrics {
  peRatio: number;        // Normalized and inverted (lower is better)
  roe: number;           // Normalized (higher is better)
  roce: number;          // Normalized (higher is better)
  debtToEquity: number;  // Normalized and inverted (lower is better)
  revenueGrowth: number; // Normalized (higher is better)
  profitGrowth: number;  // Normalized (higher is better)
  dividendYield: number; // Normalized (higher is better)
  currentRatio: number;  // Normalized with optimal range (around 2 is ideal)
}

interface ScoreBreakdown {
  totalScore: number;
  componentScores: {
    peRatio: number;
    roe: number;
    roce: number;
    debtToEquity: number;
    revenueGrowth: number;
    profitGrowth: number;
    dividendYield: number;
    currentRatio: number;
  };
  weights: ScoringWeights;
  missingMetrics: string[];
}

class StockScoringEngine {
  private static scoringWeights: ScoringWeights = DEFAULT_SCORING_WEIGHTS;
  
  /**
   * Update scoring weights
   */
  static updateScoringWeights(weights: Partial<ScoringWeights>): void {
    this.scoringWeights = { ...this.scoringWeights, ...weights };
    console.log(`📊 Updated scoring weights:`, this.scoringWeights);
  }

  /**
   * Normalize a metric value using z-score normalization
   */
  private static normalizeMetric(
    value: number, 
    values: number[], 
    invert: boolean = false,
    optimalRange?: { min: number; max: number }
  ): number {
    if (values.length === 0) return 0;
    
    // Remove outliers (values beyond 3 standard deviations)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    const filteredValues = values.filter(v => Math.abs(v - mean) <= 3 * stdDev);
    
    if (filteredValues.length === 0) return 0;
    
    const filteredMean = filteredValues.reduce((sum, v) => sum + v, 0) / filteredValues.length;
    const filteredStdDev = Math.sqrt(filteredValues.reduce((sum, v) => sum + Math.pow(v - filteredMean, 2), 0) / filteredValues.length);
    
    if (filteredStdDev === 0) return 0.5; // All values are the same
    
    // Z-score normalization
    let normalized = (value - filteredMean) / filteredStdDev;
    
    // Convert to 0-1 scale using sigmoid function
    normalized = 1 / (1 + Math.exp(-normalized));
    
    // Handle optimal range metrics (like current ratio)
    if (optimalRange) {
      if (value >= optimalRange.min && value <= optimalRange.max) {
        normalized = Math.max(normalized, 0.7); // Boost score if in optimal range
      }
    }
    
    // Invert if lower values are better (like P/E ratio, debt-to-equity)
    if (invert) {
      normalized = 1 - normalized;
    }
    
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Normalize metrics for a collection of stocks
   */
  private static normalizeMetricsForStocks(stocks: StockDocument[]): Map<string, NormalizedMetrics> {
    const normalizedMap = new Map<string, NormalizedMetrics>();
    
    // Extract all metric values for normalization
    const metrics = {
      peRatio: stocks.map(s => s.fundamentals.peRatio).filter(v => v !== undefined && v > 0 && v < 100) as number[],
      roe: stocks.map(s => s.fundamentals.roe).filter(v => v !== undefined && v > -50 && v < 100) as number[],
      roce: stocks.map(s => s.fundamentals.roce).filter(v => v !== undefined && v > -50 && v < 100) as number[],
      debtToEquity: stocks.map(s => s.fundamentals.debtToEquity).filter(v => v !== undefined && v >= 0 && v < 10) as number[],
      revenueGrowth: stocks.map(s => s.fundamentals.revenueGrowth).filter(v => v !== undefined && v > -100 && v < 200) as number[],
      profitGrowth: stocks.map(s => s.fundamentals.profitGrowth).filter(v => v !== undefined && v > -100 && v < 200) as number[],
      dividendYield: stocks.map(s => s.fundamentals.dividendYield).filter(v => v !== undefined && v >= 0 && v < 20) as number[],
      currentRatio: stocks.map(s => s.fundamentals.currentRatio).filter(v => v !== undefined && v > 0 && v < 10) as number[]
    };
    
    // Normalize each stock's metrics
    for (const stock of stocks) {
      const f = stock.fundamentals;
      
      normalizedMap.set(stock._id, {
        peRatio: f.peRatio !== undefined ? 
          this.normalizeMetric(f.peRatio, metrics.peRatio, true) : 0,
        roe: f.roe !== undefined ? 
          this.normalizeMetric(f.roe, metrics.roe, false) : 0,
        roce: f.roce !== undefined ? 
          this.normalizeMetric(f.roce, metrics.roce, false) : 0,
        debtToEquity: f.debtToEquity !== undefined ? 
          this.normalizeMetric(f.debtToEquity, metrics.debtToEquity, true) : 0,
        revenueGrowth: f.revenueGrowth !== undefined ? 
          this.normalizeMetric(f.revenueGrowth, metrics.revenueGrowth, false) : 0,
        profitGrowth: f.profitGrowth !== undefined ? 
          this.normalizeMetric(f.profitGrowth, metrics.profitGrowth, false) : 0,
        dividendYield: f.dividendYield !== undefined ? 
          this.normalizeMetric(f.dividendYield, metrics.dividendYield, false) : 0,
        currentRatio: f.currentRatio !== undefined ? 
          this.normalizeMetric(f.currentRatio, metrics.currentRatio, false, { min: 1.5, max: 3.0 }) : 0
      });
    }
    
    return normalizedMap;
  }

  /**
   * Calculate quality score for a single stock
   */
  static calculateStockScore(stock: StockDocument, normalizedMetrics?: NormalizedMetrics): ScoreBreakdown {
    const f = stock.fundamentals;
    const missingMetrics: string[] = [];
    
    // Use provided normalized metrics or calculate individual ones
    let normalized: NormalizedMetrics;
    if (normalizedMetrics) {
      normalized = normalizedMetrics;
    } else {
      // Individual normalization (less accurate than group normalization)
      normalized = {
        peRatio: f.peRatio !== undefined ? Math.max(0, 1 - (f.peRatio / 50)) : 0,
        roe: f.roe !== undefined ? Math.max(0, Math.min(1, f.roe / 30)) : 0,
        roce: f.roce !== undefined ? Math.max(0, Math.min(1, f.roce / 30)) : 0,
        debtToEquity: f.debtToEquity !== undefined ? Math.max(0, 1 - (f.debtToEquity / 2)) : 0,
        revenueGrowth: f.revenueGrowth !== undefined ? Math.max(0, Math.min(1, (f.revenueGrowth + 10) / 40)) : 0,
        profitGrowth: f.profitGrowth !== undefined ? Math.max(0, Math.min(1, (f.profitGrowth + 10) / 40)) : 0,
        dividendYield: f.dividendYield !== undefined ? Math.max(0, Math.min(1, f.dividendYield / 8)) : 0,
        currentRatio: f.currentRatio !== undefined ? Math.max(0, 1 - Math.abs(2 - f.currentRatio) / 2) : 0
      };
    }
    
    // Track missing metrics
    if (f.peRatio === undefined) missingMetrics.push('PE Ratio');
    if (f.roe === undefined) missingMetrics.push('ROE');
    if (f.roce === undefined) missingMetrics.push('ROCE');
    if (f.debtToEquity === undefined) missingMetrics.push('Debt-to-Equity');
    if (f.revenueGrowth === undefined) missingMetrics.push('Revenue Growth');
    if (f.profitGrowth === undefined) missingMetrics.push('Profit Growth');
    if (f.dividendYield === undefined) missingMetrics.push('Dividend Yield');
    if (f.currentRatio === undefined) missingMetrics.push('Current Ratio');
    
    // Calculate component scores
    const componentScores = {
      peRatio: normalized.peRatio * this.scoringWeights.peRatio,
      roe: normalized.roe * this.scoringWeights.roe,
      roce: normalized.roce * this.scoringWeights.roce,
      debtToEquity: normalized.debtToEquity * this.scoringWeights.debtToEquity,
      revenueGrowth: normalized.revenueGrowth * this.scoringWeights.revenueGrowth,
      profitGrowth: normalized.profitGrowth * this.scoringWeights.profitGrowth,
      dividendYield: normalized.dividendYield * this.scoringWeights.dividendYield,
      currentRatio: normalized.currentRatio * this.scoringWeights.currentRatio
    };
    
    // Calculate total score
    const totalScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0);
    
    // Apply penalty for missing metrics
    const missingPenalty = missingMetrics.length * 0.05; // 5% penalty per missing metric
    const adjustedScore = Math.max(0, totalScore - missingPenalty);
    
    return {
      totalScore: adjustedScore,
      componentScores,
      weights: this.scoringWeights,
      missingMetrics
    };
  }

  /**
   * Score and rank stocks in a category
   */
  static async scoreAndRankStocks(category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP'): Promise<{
    stocks: Array<StockDocument & { scoreBreakdown: ScoreBreakdown }>;
    categoryStats: {
      totalStocks: number;
      avgScore: number;
      medianScore: number;
      topScore: number;
      validMetrics: {
        peRatio: number;
        roe: number;
        roce: number;
        debtToEquity: number;
        revenueGrowth: number;
        profitGrowth: number;
        dividendYield: number;
        currentRatio: number;
      };
    };
  }> {
    console.log(`📊 Scoring and ranking ${category} stocks...`);
    
    // Get stocks in category
    const stocks = await StockDatabaseService.getStocksByCategory(category);
    
    if (stocks.length === 0) {
      console.warn(`⚠️ No stocks found in ${category} category`);
      return {
        stocks: [],
        categoryStats: {
          totalStocks: 0,
          avgScore: 0,
          medianScore: 0,
          topScore: 0,
          validMetrics: {
            peRatio: 0, roe: 0, roce: 0, debtToEquity: 0,
            revenueGrowth: 0, profitGrowth: 0, dividendYield: 0, currentRatio: 0
          }
        }
      };
    }
    
    // Normalize metrics across all stocks in category
    const normalizedMetrics = this.normalizeMetricsForStocks(stocks);
    
    // Score each stock
    const scoredStocks = stocks.map(stock => {
      const normalizedForStock = normalizedMetrics.get(stock._id);
      const scoreBreakdown = this.calculateStockScore(stock, normalizedForStock);
      
      // Update stock's quality score in database
      stock.qualityScore = scoreBreakdown.totalScore;
      
      return {
        ...stock,
        scoreBreakdown
      };
    });
    
    // Sort by score (highest first)
    scoredStocks.sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);
    
    // Calculate category statistics
    const scores = scoredStocks.map(s => s.scoreBreakdown.totalScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
    const topScore = scores.length > 0 ? scores[0] : 0;
    
    // Count valid metrics
    const validMetrics = {
      peRatio: stocks.filter(s => s.fundamentals.peRatio !== undefined).length,
      roe: stocks.filter(s => s.fundamentals.roe !== undefined).length,
      roce: stocks.filter(s => s.fundamentals.roce !== undefined).length,
      debtToEquity: stocks.filter(s => s.fundamentals.debtToEquity !== undefined).length,
      revenueGrowth: stocks.filter(s => s.fundamentals.revenueGrowth !== undefined).length,
      profitGrowth: stocks.filter(s => s.fundamentals.profitGrowth !== undefined).length,
      dividendYield: stocks.filter(s => s.fundamentals.dividendYield !== undefined).length,
      currentRatio: stocks.filter(s => s.fundamentals.currentRatio !== undefined).length
    };
    
    console.log(`✅ Scored ${stocks.length} ${category} stocks. Avg score: ${avgScore.toFixed(3)}, Top score: ${topScore.toFixed(3)}`);
    
    return {
      stocks: scoredStocks,
      categoryStats: {
        totalStocks: stocks.length,
        avgScore,
        medianScore,
        topScore,
        validMetrics
      }
    };
  }

  /**
   * Get top N stocks from each category
   */
  static async getTopStocksByCategory(topN: number = 5): Promise<{
    largeCap: Array<StockDocument & { scoreBreakdown: ScoreBreakdown }>;
    midCap: Array<StockDocument & { scoreBreakdown: ScoreBreakdown }>;
    smallCap: Array<StockDocument & { scoreBreakdown: ScoreBreakdown }>;
    summary: {
      totalAnalyzed: number;
      averageScores: {
        largeCap: number;
        midCap: number;
        smallCap: number;
      };
    };
  }> {
    console.log(`🏆 Getting top ${topN} stocks from each category...`);
    
    // Score all categories
    const [largeCapResult, midCapResult, smallCapResult] = await Promise.all([
      this.scoreAndRankStocks('LARGE_CAP'),
      this.scoreAndRankStocks('MID_CAP'),
      this.scoreAndRankStocks('SMALL_CAP')
    ]);
    
    const result = {
      largeCap: largeCapResult.stocks.slice(0, topN),
      midCap: midCapResult.stocks.slice(0, topN),
      smallCap: smallCapResult.stocks.slice(0, topN),
      summary: {
        totalAnalyzed: largeCapResult.stocks.length + midCapResult.stocks.length + smallCapResult.stocks.length,
        averageScores: {
          largeCap: largeCapResult.categoryStats.avgScore,
          midCap: midCapResult.categoryStats.avgScore,
          smallCap: smallCapResult.categoryStats.avgScore
        }
      }
    };
    
    console.log(`✅ Top stocks retrieved: ${result.largeCap.length} Large, ${result.midCap.length} Mid, ${result.smallCap.length} Small`);
    console.log(`📊 Category averages: Large=${result.summary.averageScores.largeCap.toFixed(3)}, Mid=${result.summary.averageScores.midCap.toFixed(3)}, Small=${result.summary.averageScores.smallCap.toFixed(3)}`);
    
    return result;
  }

  /**
   * Explain score calculation for a stock
   */
  static explainScore(scoreBreakdown: ScoreBreakdown): string {
    const explanations: string[] = [];
    
    explanations.push(`Total Quality Score: ${(scoreBreakdown.totalScore * 100).toFixed(1)}%`);
    
    if (scoreBreakdown.componentScores.peRatio > 0) {
      explanations.push(`• P/E Ratio contributes ${(scoreBreakdown.componentScores.peRatio * 100).toFixed(1)}% (${scoreBreakdown.weights.peRatio * 100}% weight)`);
    }
    
    if (scoreBreakdown.componentScores.roe > 0) {
      explanations.push(`• ROE contributes ${(scoreBreakdown.componentScores.roe * 100).toFixed(1)}% (${scoreBreakdown.weights.roe * 100}% weight)`);
    }
    
    if (scoreBreakdown.componentScores.roce > 0) {
      explanations.push(`• ROCE contributes ${(scoreBreakdown.componentScores.roce * 100).toFixed(1)}% (${scoreBreakdown.weights.roce * 100}% weight)`);
    }
    
    if (scoreBreakdown.componentScores.debtToEquity > 0) {
      explanations.push(`• Debt-to-Equity contributes ${(scoreBreakdown.componentScores.debtToEquity * 100).toFixed(1)}% (${scoreBreakdown.weights.debtToEquity * 100}% weight)`);
    }
    
    if (scoreBreakdown.componentScores.revenueGrowth > 0) {
      explanations.push(`• Revenue Growth contributes ${(scoreBreakdown.componentScores.revenueGrowth * 100).toFixed(1)}% (${scoreBreakdown.weights.revenueGrowth * 100}% weight)`);
    }
    
    if (scoreBreakdown.componentScores.profitGrowth > 0) {
      explanations.push(`• Profit Growth contributes ${(scoreBreakdown.componentScores.profitGrowth * 100).toFixed(1)}% (${scoreBreakdown.weights.profitGrowth * 100}% weight)`);
    }
    
    if (scoreBreakdown.missingMetrics.length > 0) {
      explanations.push(`⚠️ Missing metrics: ${scoreBreakdown.missingMetrics.join(', ')} (${scoreBreakdown.missingMetrics.length * 5}% penalty applied)`);
    }
    
    return explanations.join('\n');
  }
}

export default StockScoringEngine;