/**
 * Stock Recommendation Service
 * Integrates with Railway-hosted stock scoring and recommendation API
 */

interface MarketCapAllocation {
  largeCap: number;
  midCap: number; 
  smallCap: number;
}

interface StockRecommendation {
  symbol: string;
  companyName: string;
  currentPrice: number;
  marketCapCrores: number;
  stockScore: number;
  // Support both legacy and new API formats
  allocation?: number;
  quantity?: number;
  // New Railway API format
  amount?: number;
  shares?: number;
  scoreMetrics?: {
    peRatio?: number;
    roe?: number;
    roce?: number;
    debtToEquity?: number;
    revenueGrowth?: number;
    profitMargins?: number;
  };
}

interface RecommendationResponse {
  totalAmount: number;
  allocation: MarketCapAllocation;
  // Support both legacy nested format and new flat format
  recommendations?: {
    largeCap: StockRecommendation[];
    midCap: StockRecommendation[];
    smallCap: StockRecommendation[];
  };
  // New flat format (Railway API)
  largeCap?: StockRecommendation[];
  midCap?: StockRecommendation[];
  smallCap?: StockRecommendation[];
  summary: {
    totalStocks: number;
    largeCapAmount: number;
    midCapAmount: number;
    smallCapAmount: number;
  };
}

interface TopStocksResponse {
  category: string;
  limit: number;
  stocks: Array<{
    symbol: string;
    companyName: string;
    category: string;
    currentPrice: number;
    marketCapCrores: number;
    stockScore: number;
    scoreMetrics: any;
    recommendationKey?: string;
  }>;
}

interface ScoringMethodology {
  methodology: string;
  weights: {
    peRatio: string;
    roe: string;
    roce: string;
    debtToEquity: string;
    revenueGrowth: string;
    profitMargins: string;
  };
  categories: {
    largeCap: string;
    midCap: string;
    smallCap: string;
  };
  endpoints: {
    [key: string]: string;
  };
}

export class StockRecommendationService {
  private static readonly BASE_URL = 'https://striking-fulfillment-production.up.railway.app';
  
  /**
   * Parse market cap allocation from query text
   */
  static parseMarketCapAllocation(query: string): MarketCapAllocation | null {
    // Look for patterns like "30/40/30", "30-40-30", "30 40 30", etc.
    const patterns = [
      /(\d+)[\/\-\s]+(\d+)[\/\-\s]+(\d+)/,
      /(\d+)%?\s*(?:large|big),?\s*(\d+)%?\s*(?:mid|medium),?\s*(\d+)%?\s*(?:small|little)/i,
      /large[:\s]*(\d+)%?.*mid[:\s]*(\d+)%?.*small[:\s]*(\d+)%?/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const [, large, mid, small] = match;
        const largeCap = parseInt(large);
        const midCap = parseInt(mid);
        const smallCap = parseInt(small);
        
        // Validate that percentages add up to 100 (or close to it)
        const total = largeCap + midCap + smallCap;
        if (total >= 90 && total <= 110) {
          return { largeCap, midCap, smallCap };
        }
      }
    }

    // Look for "split" keyword with numbers
    if (query.toLowerCase().includes('split')) {
      const numbers = query.match(/\d+/g);
      if (numbers && numbers.length >= 3) {
        const largeCap = parseInt(numbers[0]);
        const midCap = parseInt(numbers[1]); 
        const smallCap = parseInt(numbers[2]);
        const total = largeCap + midCap + smallCap;
        
        if (total >= 90 && total <= 110) {
          return { largeCap, midCap, smallCap };
        }
      }
    }

    return null;
  }

  /**
   * Extract investment amount from query
   */
  static extractAmount(query: string): number | null {
    const patterns = [
      /₹\s*([\d,]+)(?:k|000)?/i,
      /([\d,]+)\s*(?:thousand|lakh|crore)/i,
      /([\d,]+)k/i,
      /(?:invest|investment|budget|amount)\s+(?:of\s+)?([\d,]+)/i,
      /^([\d,]+)\s+(?:rupees?|rs\.?|₹)?\s*(?:invest|investment|budget|split)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        
        if (query.toLowerCase().includes('lakh')) {
          amount *= 100000;
        } else if (query.toLowerCase().includes('crore')) {
          amount *= 10000000;
        } else if (query.toLowerCase().includes('thousand') || query.toLowerCase().includes('k')) {
          amount *= 1000;
        }
        
        return amount;
      }
    }
    
    return null;
  }

  /**
   * Check if query is requesting market cap allocation
   */
  static isMarketCapAllocationQuery(query: string): boolean {
    const keywords = [
      'split', 'allocation', 'allocate', 'distribute',
      'large cap', 'mid cap', 'small cap',
      'largecap', 'midcap', 'smallcap',
      'diversif', 'portfolio mix'
    ];

    const lowerQuery = query.toLowerCase();
    return keywords.some(keyword => lowerQuery.includes(keyword)) ||
           this.parseMarketCapAllocation(query) !== null;
  }

  /**
   * Get stock recommendations from Railway API
   */
  static async getRecommendations(
    amount: number,
    allocation: MarketCapAllocation,
    topN: number = 3
  ): Promise<RecommendationResponse> {
    try {
      const url = `${this.BASE_URL}/recommend?amount=${amount}&largeCap=${allocation.largeCap}&midCap=${allocation.midCap}&smallCap=${allocation.smallCap}&topN=${topN}`;
      
      console.log(`🎯 Calling Railway stock recommendation API: ${url}`);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMI-Calculator-App/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Railway API response received:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error calling Railway recommendation API:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out - Railway API is taking too long to respond');
        }
        throw new Error(`Failed to get stock recommendations: ${error.message}`);
      }
      
      throw new Error('Failed to get stock recommendations: Unknown error');
    }
  }

  /**
   * Get top stocks by category
   */
  static async getTopStocks(
    category: 'all' | 'large' | 'mid' | 'small' = 'all',
    limit: number = 10
  ): Promise<TopStocksResponse> {
    try {
      const url = `${this.BASE_URL}/top-stocks?category=${category}&limit=${limit}`;
      
      console.log(`📈 Calling Railway top stocks API: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMI-Calculator-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Railway top stocks API response received:`, data);
      
      return data;
    } catch (error) {
      console.error('❌ Error calling Railway top stocks API:', error);
      throw new Error(`Failed to get top stocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get scoring methodology information
   */
  static async getScoringInfo(): Promise<ScoringMethodology> {
    try {
      const url = `${this.BASE_URL}/scoring-info`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMI-Calculator-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error calling Railway scoring info API:', error);
      throw new Error(`Failed to get scoring info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive investment recommendation using Railway API
   */
  static async generateMarketCapRecommendation(
    query: string,
    amount?: number,
    allocation?: MarketCapAllocation
  ): Promise<string> {
    try {
      // Extract amount if not provided
      const finalAmount = amount || this.extractAmount(query) || 10000;
      
      // Extract allocation if not provided
      const finalAllocation = allocation || this.parseMarketCapAllocation(query) || {
        largeCap: 30,
        midCap: 40,
        smallCap: 30
      };

      console.log(`🎯 Generating market cap recommendation for ₹${finalAmount} with allocation:`, finalAllocation);

      // Get recommendations from Railway API
      const recommendations = await this.getRecommendations(finalAmount, finalAllocation);
      
      // Format response for UI
      const formattedResponse = this.formatRecommendationResponse(recommendations, query);
      
      return formattedResponse;
    } catch (error) {
      console.error('❌ Error generating market cap recommendation:', error);
      throw error;
    }
  }

  /**
   * Format recommendation response for UI display (public method)
   */
  static formatRecommendationResponse(
    recommendations: RecommendationResponse,
    originalQuery: string
  ): string {
    // Handle both legacy and new API response formats
    const recs = recommendations.recommendations || {
      largeCap: recommendations.largeCap || [],
      midCap: recommendations.midCap || [],
      smallCap: recommendations.smallCap || []
    };
    const { totalAmount, allocation, summary } = recommendations;

    let response = `# 💼 Smart Portfolio Recommendation\n\n`;
    response += `**Investment Amount:** ₹${totalAmount.toLocaleString()}\n`;
    response += `**Allocation Strategy:** ${allocation.largeCap}% Large Cap, ${allocation.midCap}% Mid Cap, ${allocation.smallCap}% Small Cap\n\n`;

    response += `## 📊 Portfolio Allocation\n\n`;

    // Large Cap section
    if (recs.largeCap.length > 0) {
      response += `### 🏢 Large Cap Stocks (₹${summary.largeCapAmount.toLocaleString()})\n`;
      recs.largeCap.forEach((stock, index) => {
        response += `**${index + 1}. ${stock.companyName} (${stock.symbol})**\n`;
        response += `- **Price:** ₹${stock.currentPrice.toLocaleString()}\n`;
        response += `- **Quantity:** ${stock.shares || stock.quantity || 0} shares\n`;
        response += `- **Allocation:** ₹${(stock.amount || stock.allocation || 0).toLocaleString()}\n`;
        response += `- **Quality Score:** ${stock.stockScore}/1.0\n`;
        if (stock.scoreMetrics && stock.scoreMetrics.peRatio) {
          response += `- **PE Ratio:** ${stock.scoreMetrics.peRatio.toFixed(1)}\n`;
        }
        if (stock.scoreMetrics && stock.scoreMetrics.roe) {
          response += `- **ROE:** ${stock.scoreMetrics.roe.toFixed(1)}%\n`;
        }
        response += `\n`;
      });
    }

    // Mid Cap section
    if (recs.midCap.length > 0) {
      response += `### 🏭 Mid Cap Stocks (₹${summary.midCapAmount.toLocaleString()})\n`;
      recs.midCap.forEach((stock, index) => {
        response += `**${index + 1}. ${stock.companyName} (${stock.symbol})**\n`;
        response += `- **Price:** ₹${stock.currentPrice.toLocaleString()}\n`;
        response += `- **Quantity:** ${stock.shares || stock.quantity || 0} shares\n`;
        response += `- **Allocation:** ₹${(stock.amount || stock.allocation || 0).toLocaleString()}\n`;
        response += `- **Quality Score:** ${stock.stockScore}/1.0\n`;
        if (stock.scoreMetrics && stock.scoreMetrics.peRatio) {
          response += `- **PE Ratio:** ${stock.scoreMetrics.peRatio.toFixed(1)}\n`;
        }
        if (stock.scoreMetrics && stock.scoreMetrics.roe) {
          response += `- **ROE:** ${stock.scoreMetrics.roe.toFixed(1)}%\n`;
        }
        response += `\n`;
      });
    }

    // Small Cap section
    if (recs.smallCap.length > 0) {
      response += `### 🚀 Small Cap Stocks (₹${summary.smallCapAmount.toLocaleString()})\n`;
      recs.smallCap.forEach((stock, index) => {
        response += `**${index + 1}. ${stock.companyName} (${stock.symbol})**\n`;
        response += `- **Price:** ₹${stock.currentPrice.toLocaleString()}\n`;
        response += `- **Quantity:** ${stock.shares || stock.quantity || 0} shares\n`;
        response += `- **Allocation:** ₹${(stock.amount || stock.allocation || 0).toLocaleString()}\n`;
        response += `- **Quality Score:** ${stock.stockScore}/1.0\n`;
        if (stock.scoreMetrics && stock.scoreMetrics.peRatio) {
          response += `- **PE Ratio:** ${stock.scoreMetrics.peRatio.toFixed(1)}\n`;
        }
        if (stock.scoreMetrics && stock.scoreMetrics.roe) {
          response += `- **ROE:** ${stock.scoreMetrics.roe.toFixed(1)}%\n`;
        }
        response += `\n`;
      });
    }

    response += `## 🎯 Portfolio Summary\n\n`;
    response += `- **Total Stocks:** ${summary.totalStocks}\n`;
    response += `- **Market Cap Distribution:** Diversified across ${recs.largeCap.length} large cap, ${recs.midCap.length} mid cap, and ${recs.smallCap.length} small cap stocks\n`;
    response += `- **Scoring Methodology:** AI-powered analysis using PE Ratio, ROE, ROCE, Debt-to-Equity, Revenue Growth, and Profit Margins\n`;
    response += `- **Data Source:** Real-time Yahoo Finance data covering 1800+ Indian stocks\n\n`;

    response += `## ⚠️ Important Notes\n\n`;
    response += `- This recommendation is based on quantitative analysis of financial metrics\n`;
    response += `- Past performance does not guarantee future results\n`;
    response += `- Consider your risk tolerance and investment goals\n`;
    response += `- Consult with a financial advisor for personalized advice\n`;

    return response;
  }
}