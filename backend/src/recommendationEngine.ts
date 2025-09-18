/**
 * Production-Grade Stock Recommendation Engine
 * Implements the exact allocation logic specified by the user
 */

import StockDatabaseService from './stockDatabaseService';

interface AllocationInput {
  totalAmount: number;
  largeCapPercent: number; // e.g., 30 for 30%
  midCapPercent: number;   // e.g., 40 for 40%
  smallCapPercent: number; // e.g., 30 for 30%
}

interface StockAllocation {
  stock: string;
  companyName: string;
  allocation: number; // Amount in rupees
  qty: number;        // Number of shares
  currentPrice: number;
  qualityScore: number;
  sector: string;
}

interface RecommendationResult {
  totalAmount: number;
  allocations: {
    LargeCap: StockAllocation[];
    MidCap: StockAllocation[];
    SmallCap: StockAllocation[];
  };
  summary: {
    largeCapAllocated: number;
    midCapAllocated: number;
    smallCapAllocated: number;
    totalAllocated: number;
    remainingAmount: number;
    stocksSelected: number;
  };
  performanceMetrics: {
    avgLargeCapScore: number;
    avgMidCapScore: number;
    avgSmallCapScore: number;
    overallAvgScore: number;
  };
}

export class RecommendationEngine {
  /**
   * Generate stock recommendations based on user allocation preferences
   */
  static async generateRecommendations(input: AllocationInput): Promise<RecommendationResult> {
    console.log('🎯 Generating intelligent stock recommendations...');
    console.log(`💰 Total Amount: ₹${input.totalAmount.toLocaleString()}`);
    console.log(`📊 Allocation: ${input.largeCapPercent}% Large, ${input.midCapPercent}% Mid, ${input.smallCapPercent}% Small`);

    // Validate input
    this.validateInput(input);

    // Calculate allocation amounts
    const largeCapAmount = Math.floor((input.totalAmount * input.largeCapPercent) / 100);
    const midCapAmount = Math.floor((input.totalAmount * input.midCapPercent) / 100);
    const smallCapAmount = Math.floor((input.totalAmount * input.smallCapPercent) / 100);

    console.log(`💵 Amounts: Large ₹${largeCapAmount.toLocaleString()}, Mid ₹${midCapAmount.toLocaleString()}, Small ₹${smallCapAmount.toLocaleString()}`);

    // Get top stocks from each category
    const topLargeCap = await this.getTopStocksForAllocation('LARGE_CAP', 5);
    const topMidCap = await this.getTopStocksForAllocation('MID_CAP', 5);
    const topSmallCap = await this.getTopStocksForAllocation('SMALL_CAP', 5);

    console.log(`📈 Found: ${topLargeCap.length} Large Cap, ${topMidCap.length} Mid Cap, ${topSmallCap.length} Small Cap stocks`);

    // Generate allocations for each category
    const largeCapAllocations = this.allocateAmountToStocks(topLargeCap, largeCapAmount, 'LARGE_CAP');
    const midCapAllocations = this.allocateAmountToStocks(topMidCap, midCapAmount, 'MID_CAP');
    const smallCapAllocations = this.allocateAmountToStocks(topSmallCap, smallCapAmount, 'SMALL_CAP');

    // Calculate summary and metrics
    const summary = this.calculateSummary(largeCapAllocations, midCapAllocations, smallCapAllocations, input.totalAmount);
    const performanceMetrics = this.calculatePerformanceMetrics(largeCapAllocations, midCapAllocations, smallCapAllocations);

    const result: RecommendationResult = {
      totalAmount: input.totalAmount,
      allocations: {
        LargeCap: largeCapAllocations,
        MidCap: midCapAllocations,
        SmallCap: smallCapAllocations
      },
      summary,
      performanceMetrics
    };

    this.logRecommendationResults(result);
    return result;
  }

  /**
   * Validate input parameters
   */
  private static validateInput(input: AllocationInput): void {
    if (input.totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }

    const totalPercent = input.largeCapPercent + input.midCapPercent + input.smallCapPercent;
    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new Error(`Allocation percentages must sum to 100%. Current sum: ${totalPercent}%`);
    }

    if (input.largeCapPercent < 0 || input.midCapPercent < 0 || input.smallCapPercent < 0) {
      throw new Error('All allocation percentages must be non-negative');
    }
  }

  /**
   * Get top stocks for allocation from a specific market cap category
   */
  private static async getTopStocksForAllocation(
    category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP',
    limit: number
  ): Promise<any[]> {
    const stocks = await StockDatabaseService.getTopStocksByCategory(category, limit);
    
    // Filter stocks that have valid prices
    return stocks.filter(stock => 
      stock.price > 0 && 
      stock.qualityScore > 0 &&
      stock.fundamentals?.peRatio &&
      stock.fundamentals?.roe
    );
  }

  /**
   * Allocate amount to stocks with intelligent distribution
   */
  private static allocateAmountToStocks(
    stocks: any[],
    totalAmount: number,
    category: string
  ): StockAllocation[] {
    if (stocks.length === 0 || totalAmount <= 0) {
      console.log(`⚠️ No stocks available for ${category} or zero allocation amount`);
      return [];
    }

    const allocations: StockAllocation[] = [];
    
    // Use top 3-5 stocks as specified by user
    const selectedStocks = stocks.slice(0, Math.min(5, stocks.length));
    
    if (selectedStocks.length === 0) {
      return [];
    }

    // Calculate allocation per stock (equal distribution for simplicity, can be weighted by score later)
    const baseAmountPerStock = Math.floor(totalAmount / selectedStocks.length);
    let remainingAmount = totalAmount;

    for (let i = 0; i < selectedStocks.length; i++) {
      const stock = selectedStocks[i];
      const stockPrice = stock.price;
      
      // For the last stock, allocate all remaining amount
      const allocationAmount = (i === selectedStocks.length - 1) ? remainingAmount : baseAmountPerStock;
      
      // Calculate quantity (number of shares)
      const quantity = Math.floor(allocationAmount / stockPrice);
      const actualAllocation = quantity * stockPrice;

      if (quantity > 0) {
        allocations.push({
          stock: stock._id,
          companyName: stock.name || `${stock._id} Limited`,
          allocation: actualAllocation,
          qty: quantity,
          currentPrice: stockPrice,
          qualityScore: stock.qualityScore,
          sector: stock.sector || 'Unknown'
        });

        remainingAmount -= actualAllocation;
      }
    }

    console.log(`✅ ${category}: Allocated ₹${totalAmount - remainingAmount} across ${allocations.length} stocks`);
    return allocations;
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummary(
    largeCapAllocations: StockAllocation[],
    midCapAllocations: StockAllocation[],
    smallCapAllocations: StockAllocation[]
  , totalAmount: number) {
    const largeCapAllocated = largeCapAllocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
    const midCapAllocated = midCapAllocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
    const smallCapAllocated = smallCapAllocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
    const totalAllocated = largeCapAllocated + midCapAllocated + smallCapAllocated;
    const stocksSelected = largeCapAllocations.length + midCapAllocations.length + smallCapAllocations.length;

    return {
      largeCapAllocated,
      midCapAllocated,
      smallCapAllocated,
      totalAllocated,
      remainingAmount: totalAmount - totalAllocated,
      stocksSelected
    };
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(
    largeCapAllocations: StockAllocation[],
    midCapAllocations: StockAllocation[],
    smallCapAllocations: StockAllocation[]
  ) {
    const avgLargeCapScore = largeCapAllocations.length > 0 ? 
      largeCapAllocations.reduce((sum, alloc) => sum + alloc.qualityScore, 0) / largeCapAllocations.length : 0;
    
    const avgMidCapScore = midCapAllocations.length > 0 ?
      midCapAllocations.reduce((sum, alloc) => sum + alloc.qualityScore, 0) / midCapAllocations.length : 0;
    
    const avgSmallCapScore = smallCapAllocations.length > 0 ?
      smallCapAllocations.reduce((sum, alloc) => sum + alloc.qualityScore, 0) / smallCapAllocations.length : 0;

    const allAllocations = [...largeCapAllocations, ...midCapAllocations, ...smallCapAllocations];
    const overallAvgScore = allAllocations.length > 0 ?
      allAllocations.reduce((sum, alloc) => sum + alloc.qualityScore, 0) / allAllocations.length : 0;

    return {
      avgLargeCapScore,
      avgMidCapScore,
      avgSmallCapScore,
      overallAvgScore
    };
  }

  /**
   * Log recommendation results in the exact format specified by user
   */
  private static logRecommendationResults(result: RecommendationResult): void {
    console.log('\n🎉 RECOMMENDATION RESULTS');
    console.log('=' .repeat(60));

    // Large Cap
    if (result.allocations.LargeCap.length > 0) {
      console.log('\n📊 LARGE CAP ALLOCATIONS:');
      result.allocations.LargeCap.forEach(alloc => {
        console.log(`   ${alloc.stock}: ₹${alloc.allocation.toLocaleString()} (${alloc.qty} shares @ ₹${alloc.currentPrice}) - Score: ${alloc.qualityScore.toFixed(4)}`);
      });
    }

    // Mid Cap
    if (result.allocations.MidCap.length > 0) {
      console.log('\n📈 MID CAP ALLOCATIONS:');
      result.allocations.MidCap.forEach(alloc => {
        console.log(`   ${alloc.stock}: ₹${alloc.allocation.toLocaleString()} (${alloc.qty} shares @ ₹${alloc.currentPrice}) - Score: ${alloc.qualityScore.toFixed(4)}`);
      });
    }

    // Small Cap
    if (result.allocations.SmallCap.length > 0) {
      console.log('\n📉 SMALL CAP ALLOCATIONS:');
      result.allocations.SmallCap.forEach(alloc => {
        console.log(`   ${alloc.stock}: ₹${alloc.allocation.toLocaleString()} (${alloc.qty} shares @ ₹${alloc.currentPrice}) - Score: ${alloc.qualityScore.toFixed(4)}`);
      });
    }

    // Summary
    console.log('\n💰 ALLOCATION SUMMARY:');
    console.log(`   Large Cap: ₹${result.summary.largeCapAllocated.toLocaleString()}`);
    console.log(`   Mid Cap: ₹${result.summary.midCapAllocated.toLocaleString()}`);
    console.log(`   Small Cap: ₹${result.summary.smallCapAllocated.toLocaleString()}`);
    console.log(`   Total Allocated: ₹${result.summary.totalAllocated.toLocaleString()}`);
    console.log(`   Remaining: ₹${result.summary.remainingAmount.toLocaleString()}`);
    console.log(`   Stocks Selected: ${result.summary.stocksSelected}`);

    // Performance Metrics
    console.log('\n🏆 PERFORMANCE METRICS:');
    console.log(`   Avg Large Cap Score: ${result.performanceMetrics.avgLargeCapScore.toFixed(4)}`);
    console.log(`   Avg Mid Cap Score: ${result.performanceMetrics.avgMidCapScore.toFixed(4)}`);
    console.log(`   Avg Small Cap Score: ${result.performanceMetrics.avgSmallCapScore.toFixed(4)}`);
    console.log(`   Overall Avg Score: ${result.performanceMetrics.overallAvgScore.toFixed(4)}`);
  }

  /**
   * Get recommendations in the exact JSON format specified by user
   */
  static async getRecommendationsJSON(input: AllocationInput): Promise<any> {
    const result = await this.generateRecommendations(input);

    // Format exactly as specified in user requirements
    return {
      "LargeCap": result.allocations.LargeCap.map(alloc => ({
        "stock": alloc.stock,
        "allocation": alloc.allocation,
        "qty": alloc.qty
      })),
      "MidCap": result.allocations.MidCap.map(alloc => ({
        "stock": alloc.stock,
        "allocation": alloc.allocation,
        "qty": alloc.qty
      })),
      "SmallCap": result.allocations.SmallCap.map(alloc => ({
        "stock": alloc.stock,
        "allocation": alloc.allocation,
        "qty": alloc.qty
      }))
    };
  }

  /**
   * Generate recommendations for a standard portfolio (example: 30% Large, 40% Mid, 30% Small)
   */
  static async generateStandardRecommendations(totalAmount: number): Promise<RecommendationResult> {
    return await this.generateRecommendations({
      totalAmount,
      largeCapPercent: 30,
      midCapPercent: 40,
      smallCapPercent: 30
    });
  }

  /**
   * Generate conservative recommendations (higher large cap allocation)
   */
  static async generateConservativeRecommendations(totalAmount: number): Promise<RecommendationResult> {
    return await this.generateRecommendations({
      totalAmount,
      largeCapPercent: 60,
      midCapPercent: 30,
      smallCapPercent: 10
    });
  }

  /**
   * Generate aggressive recommendations (higher small cap allocation)
   */
  static async generateAggressiveRecommendations(totalAmount: number): Promise<RecommendationResult> {
    return await this.generateRecommendations({
      totalAmount,
      largeCapPercent: 20,
      midCapPercent: 30,
      smallCapPercent: 50
    });
  }
}

export default RecommendationEngine;