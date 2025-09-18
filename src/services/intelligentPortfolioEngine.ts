/**
 * Intelligent Portfolio Engine
 * Advanced portfolio allocation with data-driven stock recommendations
 */

import StockScoringEngine from './stockScoringEngine';
import StockDatabaseService from './stockDatabaseService';
import StockDataFetcher from './stockDataFetcher';
import { 
  AllocationRequest, 
  PortfolioRecommendation, 
  StockRecommendation,
  StockDocument
} from './stockDataModels';

interface AllocationStrategy {
  name: string;
  description: string;
  allocations: {
    largeCap: number;
    midCap: number;
    smallCap: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturnRange: string;
  bestFor: string;
}

class IntelligentPortfolioEngine {
  
  /**
   * Get predefined allocation strategies
   */
  static getAllocationStrategies(): {
    conservative: AllocationStrategy;
    balanced: AllocationStrategy;
    aggressive: AllocationStrategy;
  } {
    return {
      conservative: {
        name: 'Conservative',
        description: 'Focus on capital preservation with steady returns',
        allocations: { largeCap: 60, midCap: 30, smallCap: 10 },
        riskLevel: 'LOW',
        expectedReturnRange: '8-12% annually',
        bestFor: 'Risk-averse investors, those nearing retirement'
      },
      balanced: {
        name: 'Balanced',
        description: 'Balanced growth with manageable risk',
        allocations: { largeCap: 50, midCap: 30, smallCap: 20 },
        riskLevel: 'MEDIUM',
        expectedReturnRange: '10-15% annually',
        bestFor: 'Most investors seeking growth with stability'
      },
      aggressive: {
        name: 'Aggressive',
        description: 'Maximum growth potential with higher risk',
        allocations: { largeCap: 30, midCap: 40, smallCap: 30 },
        riskLevel: 'HIGH',
        expectedReturnRange: '12-20% annually',
        bestFor: 'Young investors, high risk tolerance, long-term wealth building'
      }
    };
  }

  /**
   * Generate portfolio recommendation based on allocation request
   */
  static async generateRecommendation(request: AllocationRequest): Promise<PortfolioRecommendation> {
    console.log(`💼 Generating portfolio recommendation for ₹${request.totalAmount.toLocaleString('en-IN')}...`);
    
    // Validate allocation percentages
    const totalPercentage = request.allocations.largeCap + request.allocations.midCap + request.allocations.smallCap;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Allocation percentages must sum to 100%. Current sum: ${totalPercentage}%`);
    }
    
    // Calculate target amounts for each category
    const targetAmounts = {
      largeCap: (request.totalAmount * request.allocations.largeCap) / 100,
      midCap: (request.totalAmount * request.allocations.midCap) / 100,
      smallCap: (request.totalAmount * request.allocations.smallCap) / 100
    };
    
    console.log(`🎯 Target allocations: Large=₹${targetAmounts.largeCap.toLocaleString('en-IN')}, Mid=₹${targetAmounts.midCap.toLocaleString('en-IN')}, Small=₹${targetAmounts.smallCap.toLocaleString('en-IN')}`);
    
    // Get top stocks from each category
    const topStocks = await StockScoringEngine.getTopStocksByCategory(request.maxStocksPerCategory + 2);
    
    // Generate recommendations for each category
    const largeCap = await this.allocateStocksInCategory(
      topStocks.largeCap,
      targetAmounts.largeCap,
      request.maxStocksPerCategory,
      'LARGE_CAP'
    );
    
    const midCap = await this.allocateStocksInCategory(
      topStocks.midCap,
      targetAmounts.midCap,
      request.maxStocksPerCategory,
      'MID_CAP'
    );
    
    const smallCap = await this.allocateStocksInCategory(
      topStocks.smallCap,
      targetAmounts.smallCap,
      request.maxStocksPerCategory,
      'SMALL_CAP'
    );
    
    // Calculate totals
    const allocatedAmount = largeCap.allocatedAmount + midCap.allocatedAmount + smallCap.allocatedAmount;
    const unallocatedAmount = request.totalAmount - allocatedAmount;
    const totalStocks = largeCap.stocks.length + midCap.stocks.length + smallCap.stocks.length;
    
    // Calculate average score
    const allStocks = [...largeCap.stocks, ...midCap.stocks, ...smallCap.stocks];
    const avgScore = allStocks.length > 0 ? 
      allStocks.reduce((sum, stock) => sum + stock.score, 0) / allStocks.length : 0;
    
    // Determine risk level and expected return
    const riskLevel = this.determineRiskLevel(request.allocations);
    const expectedReturn = this.estimateExpectedReturn(request.allocations, avgScore);
    
    const recommendation: PortfolioRecommendation = {
      totalAmount: request.totalAmount,
      allocatedAmount,
      unallocatedAmount,
      categories: {
        largeCap,
        midCap,
        smallCap
      },
      summary: {
        totalStocks,
        avgScore,
        riskLevel,
        expectedReturn
      },
      generatedAt: new Date()
    };
    
    console.log(`✅ Portfolio recommendation generated: ${totalStocks} stocks, ₹${allocatedAmount.toLocaleString('en-IN')} allocated, avg score ${(avgScore * 100).toFixed(1)}%`);
    
    return recommendation;
  }

  /**
   * Allocate stocks within a specific category
   */
  private static async allocateStocksInCategory(
    topStocks: Array<StockDocument & { scoreBreakdown: any }>,
    targetAmount: number,
    maxStocks: number,
    category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP'
  ): Promise<{
    targetAmount: number;
    allocatedAmount: number;
    stocks: StockRecommendation[];
  }> {
    const stocks: StockRecommendation[] = [];
    let allocatedAmount = 0;
    
    if (topStocks.length === 0 || targetAmount <= 0) {
      return { targetAmount, allocatedAmount: 0, stocks: [] };
    }
    
    // Sort stocks by score (should already be sorted, but ensuring)
    const sortedStocks = topStocks.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    
    // Calculate equal allocation per stock (with some weighting by score)
    const baseAllocation = targetAmount / Math.min(maxStocks, sortedStocks.length);
    
    for (let i = 0; i < Math.min(maxStocks, sortedStocks.length); i++) {
      const stock = sortedStocks[i];
      
      // Skip stocks with missing critical data
      if (!stock.price || stock.price <= 0) {
        console.warn(`⚠️ Skipping ${stock._id}: Invalid price data`);
        continue;
      }
      
      // Score-weighted allocation (higher scores get slightly more allocation)
      const scoreWeight = 0.8 + 0.4 * (stock.qualityScore || 0); // 0.8 to 1.2 multiplier
      const allocation = Math.floor(baseAllocation * scoreWeight);
      
      // Calculate quantity (whole shares only)
      const quantity = Math.floor(allocation / stock.price);
      const actualAllocation = quantity * stock.price;
      
      if (quantity > 0) {
        stocks.push({
          symbol: stock._id,
          name: stock.name,
          sector: stock.sector,
          price: stock.price,
          allocation: actualAllocation,
          quantity,
          score: stock.qualityScore || 0,
          reasoning: this.generateReasoning(stock, category),
          fundamentals: {
            peRatio: stock.fundamentals.peRatio,
            roe: stock.fundamentals.roe,
            roce: stock.fundamentals.roce,
            marketCap: stock.fundamentals.marketCap
          }
        });
        
        allocatedAmount += actualAllocation;
      }
    }
    
    console.log(`📊 ${category}: ${stocks.length} stocks, ₹${allocatedAmount.toLocaleString('en-IN')} allocated of ₹${targetAmount.toLocaleString('en-IN')} target`);
    
    return {
      targetAmount,
      allocatedAmount,
      stocks
    };
  }

  /**
   * Generate reasoning for stock recommendation
   */
  private static generateReasoning(stock: StockDocument & { scoreBreakdown?: any }, category: string): string {
    const reasons: string[] = [];
    const f = stock.fundamentals;
    
    // Quality score
    const scorePercent = ((stock.qualityScore || 0) * 100).toFixed(1);
    reasons.push(`Quality score of ${scorePercent}% indicates strong fundamentals`);
    
    // Specific metric highlights
    if (f.roe && f.roe > 15) {
      reasons.push(`Strong ROE of ${f.roe.toFixed(1)}% shows efficient management`);
    }
    
    if (f.roce && f.roce > 15) {
      reasons.push(`Good ROCE of ${f.roce.toFixed(1)}% indicates effective capital utilization`);
    }
    
    if (f.peRatio && f.peRatio < 25) {
      reasons.push(`Reasonable valuation with P/E ratio of ${f.peRatio.toFixed(1)}`);
    }
    
    if (f.debtToEquity !== undefined && f.debtToEquity < 0.5) {
      reasons.push(`Low debt-to-equity ratio of ${f.debtToEquity.toFixed(2)} indicates financial stability`);
    }
    
    if (f.revenueGrowth && f.revenueGrowth > 10) {
      reasons.push(`Revenue growth of ${f.revenueGrowth.toFixed(1)}% shows business expansion`);
    }
    
    if (f.dividendYield && f.dividendYield > 1) {
      reasons.push(`Dividend yield of ${f.dividendYield.toFixed(1)}% provides regular income`);
    }
    
    // Category-specific reasons
    if (category === 'LARGE_CAP') {
      reasons.push('Large-cap stability with established market presence');
    } else if (category === 'MID_CAP') {
      reasons.push('Mid-cap growth potential with balanced risk-return profile');
    } else {
      reasons.push('Small-cap high growth potential for long-term wealth creation');
    }
    
    return reasons.join('. ') + '.';
  }

  /**
   * Determine overall risk level based on allocation
   */
  private static determineRiskLevel(allocations: { largeCap: number; midCap: number; smallCap: number }): string {
    if (allocations.largeCap >= 60) return 'LOW';
    if (allocations.smallCap >= 30) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Estimate expected return based on allocation and stock quality
   */
  private static estimateExpectedReturn(
    allocations: { largeCap: number; midCap: number; smallCap: number },
    avgScore: number
  ): string {
    // Base returns by category (annual %)
    const baseReturns = {
      largeCap: 10,   // 10% base for large cap
      midCap: 13,     // 13% base for mid cap
      smallCap: 16    // 16% base for small cap
    };
    
    // Calculate weighted average return
    const weightedReturn = (
      (allocations.largeCap / 100) * baseReturns.largeCap +
      (allocations.midCap / 100) * baseReturns.midCap +
      (allocations.smallCap / 100) * baseReturns.smallCap
    );
    
    // Adjust based on stock quality (score)
    const qualityAdjustment = (avgScore - 0.5) * 4; // -2% to +2% adjustment
    const adjustedReturn = weightedReturn + qualityAdjustment;
    
    const minReturn = Math.max(6, adjustedReturn - 2);
    const maxReturn = adjustedReturn + 3;
    
    return `${minReturn.toFixed(0)}-${maxReturn.toFixed(0)}% annually`;
  }

  /**
   * Generate portfolio recommendation with predefined strategy
   */
  static async generateRecommendationWithStrategy(
    totalAmount: number,
    strategy: 'conservative' | 'balanced' | 'aggressive',
    maxStocksPerCategory: number = 4
  ): Promise<PortfolioRecommendation> {
    const strategies = this.getAllocationStrategies();
    const selectedStrategy = strategies[strategy];
    
    const request: AllocationRequest = {
      totalAmount,
      allocations: selectedStrategy.allocations,
      maxStocksPerCategory,
      riskTolerance: selectedStrategy.riskLevel
    };
    
    return this.generateRecommendation(request);
  }

  /**
   * Generate multiple strategy recommendations for comparison
   */
  static async generateMultipleStrategies(
    totalAmount: number,
    maxStocksPerCategory: number = 4
  ): Promise<{
    conservative: PortfolioRecommendation;
    balanced: PortfolioRecommendation;
    aggressive: PortfolioRecommendation;
    comparison: {
      strategies: Array<{
        name: string;
        allocation: string;
        riskLevel: string;
        expectedReturn: string;
        totalStocks: number;
        avgScore: number;
      }>;
    };
  }> {
    console.log(`🎯 Generating multiple portfolio strategies for ₹${totalAmount.toLocaleString('en-IN')}...`);
    
    // Generate all three strategies in parallel
    const [conservative, balanced, aggressive] = await Promise.all([
      this.generateRecommendationWithStrategy(totalAmount, 'conservative', maxStocksPerCategory),
      this.generateRecommendationWithStrategy(totalAmount, 'balanced', maxStocksPerCategory),
      this.generateRecommendationWithStrategy(totalAmount, 'aggressive', maxStocksPerCategory)
    ]);
    
    const strategies = this.getAllocationStrategies();
    
    const comparison = {
      strategies: [
        {
          name: strategies.conservative.name,
          allocation: `${strategies.conservative.allocations.largeCap}%-${strategies.conservative.allocations.midCap}%-${strategies.conservative.allocations.smallCap}%`,
          riskLevel: strategies.conservative.riskLevel,
          expectedReturn: conservative.summary.expectedReturn,
          totalStocks: conservative.summary.totalStocks,
          avgScore: conservative.summary.avgScore
        },
        {
          name: strategies.balanced.name,
          allocation: `${strategies.balanced.allocations.largeCap}%-${strategies.balanced.allocations.midCap}%-${strategies.balanced.allocations.smallCap}%`,
          riskLevel: strategies.balanced.riskLevel,
          expectedReturn: balanced.summary.expectedReturn,
          totalStocks: balanced.summary.totalStocks,
          avgScore: balanced.summary.avgScore
        },
        {
          name: strategies.aggressive.name,
          allocation: `${strategies.aggressive.allocations.largeCap}%-${strategies.aggressive.allocations.midCap}%-${strategies.aggressive.allocations.smallCap}%`,
          riskLevel: strategies.aggressive.riskLevel,
          expectedReturn: aggressive.summary.expectedReturn,
          totalStocks: aggressive.summary.totalStocks,
          avgScore: aggressive.summary.avgScore
        }
      ]
    };
    
    console.log(`✅ Generated ${comparison.strategies.length} portfolio strategies with avg scores: C=${(conservative.summary.avgScore * 100).toFixed(1)}%, B=${(balanced.summary.avgScore * 100).toFixed(1)}%, A=${(aggressive.summary.avgScore * 100).toFixed(1)}%`);
    
    return {
      conservative,
      balanced,
      aggressive,
      comparison
    };
  }

  /**
   * Ensure database is updated before generating recommendations
   */
  static async ensureDataFreshness(): Promise<void> {
    console.log(`🔄 Ensuring data freshness for portfolio recommendations...`);
    
    const stats = await StockDatabaseService.getStats();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    // Check if we need updates
    const needsPriceUpdate = !stats.lastUpdate || (now.getTime() - stats.lastUpdate.getTime()) > oneHour;
    const needsFundamentalUpdate = stats.stocksWithFundamentals < 50; // Minimum threshold
    
    if (needsPriceUpdate || needsFundamentalUpdate) {
      console.log(`📊 Database status: ${stats.stocksWithPrices} with prices, ${stats.stocksWithFundamentals} with fundamentals`);
      
      if (needsFundamentalUpdate) {
        // Initialize with essential stocks if we don't have enough data
        await StockDataFetcher.initializeEssentialStocks();
      } else if (needsPriceUpdate) {
        // Just update prices
        const stocksNeedingPrices = await StockDatabaseService.getStocksNeedingPriceUpdate();
        if (stocksNeedingPrices.length > 0) {
          await StockDataFetcher.bulkUpdatePrices(stocksNeedingPrices.slice(0, 50)); // Limit to 50 for quick update
        }
      }
    } else {
      console.log(`✅ Data is fresh: ${stats.stocksWithPrices} stocks with prices, ${stats.stocksWithFundamentals} with fundamentals`);
    }
  }
}

export default IntelligentPortfolioEngine;