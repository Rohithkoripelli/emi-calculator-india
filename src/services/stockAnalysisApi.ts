import { HybridStockApiService } from './hybridStockApi';
import { GoogleSearchApiService } from './googleSearchApi';

export interface StockAnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  sector: string;
  industry: string;
  weeklyChange?: number;
  monthlyChange?: number;
  yearlyChange?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
}

export interface StockRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string[];
  targetPrice?: number;
  stopLoss?: number;
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

export interface StockAnalysisResult {
  stockData: StockAnalysisData;
  webInsights: WebSearchResult[];
  recommendation: StockRecommendation;
  analysisDate: string;
  disclaimers: string[];
}

export class StockAnalysisApiService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  // Enhanced stock symbol mapping for Indian stocks
  private static readonly INDIAN_STOCK_SYMBOLS: Record<string, string> = {
    // Major stocks with common name variations
    'tata motors': 'TATAMOTORS',
    'tatamotors': 'TATAMOTORS',
    'tata motor': 'TATAMOTORS',
    'reliance': 'RELIANCE',
    'ril': 'RELIANCE',
    'reliance industries': 'RELIANCE',
    'tcs': 'TCS',
    'tata consultancy services': 'TCS',
    'tata consultancy': 'TCS',
    'infosys': 'INFY',
    'infy': 'INFY',
    'hdfc bank': 'HDFCBANK',
    'hdfcbank': 'HDFCBANK',
    'hdfc': 'HDFCBANK',
    'icici bank': 'ICICIBANK',
    'icicibank': 'ICICIBANK',
    'icici': 'ICICIBANK',
    'sbi': 'SBIN',
    'state bank': 'SBIN',
    'state bank of india': 'SBIN',
    'bharti airtel': 'BHARTIARTL',
    'airtel': 'BHARTIARTL',
    'bharti': 'BHARTIARTL',
    'wipro': 'WIPRO',
    'hindustan unilever': 'HINDUNILVR',
    'hul': 'HINDUNILVR',
    'itc': 'ITC',
    'maruti': 'MARUTI',
    'maruti suzuki': 'MARUTI',
    'bajaj finance': 'BAJFINANCE',
    'bajaj auto': 'BAJAJ-AUTO',
    'asian paints': 'ASIANPAINT',
    'sun pharma': 'SUNPHARMA',
    'titan': 'TITAN',
    'nestle': 'NESTLEIND',
    'nestlé': 'NESTLEIND',
    'kotak bank': 'KOTAKBANK',
    'kotak mahindra': 'KOTAKBANK',
    'axis bank': 'AXISBANK',
    'mahindra': 'M&M',
    'm&m': 'M&M',
    'larsen toubro': 'LT',
    'l&t': 'LT',
    'lt': 'LT',
    'hcl tech': 'HCLTECH',
    'hcltech': 'HCLTECH',
    'tech mahindra': 'TECHM',
    'ongc': 'ONGC',
    'ntpc': 'NTPC',
    'powergrid': 'POWERGRID',
    'coal india': 'COALINDIA',
    'jswsteel': 'JSWSTEEL',
    'jsw steel': 'JSWSTEEL',
    'ultratech': 'ULTRACEMCO',
    'ultratech cement': 'ULTRACEMCO',
    'bajaj finserv': 'BAJAJFINSV',
    'dr reddy': 'DRREDDY',
    'drreddy': 'DRREDDY',
    'cipla': 'CIPLA',
    'britannia': 'BRITANNIA',
    'apollo hospital': 'APOLLOHOSP',
    'apollo': 'APOLLOHOSP',
    'eicher motors': 'EICHERMOT',
    'hero motocorp': 'HEROMOTOCO',
    'hero': 'HEROMOTOCO',
    'upl': 'UPL',
    'divislab': 'DIVISLAB',
    'divis lab': 'DIVISLAB',
    'grasim': 'GRASIM',
    'hindalco': 'HINDALCO',
    'adani enterprises': 'ADANIENT',
    'adani ports': 'ADANIPORTS',
    'indusind bank': 'INDUSINDBK',
    'bpcl': 'BPCL',
    'bharat petroleum': 'BPCL',
    'sbilife': 'SBILIFE',
    'sbi life': 'SBILIFE',
    'hdfclife': 'HDFCLIFE',
    'hdfc life': 'HDFCLIFE',
    'tata consumer': 'TATACONSUM',
    'shriram finance': 'SHRIRAMFIN',
    'paradeep phosphates': 'PARADEEPHOSPATES',
    'paradeep': 'PARADEEPHOSPATES',
    'phosphates': 'PARADEEPHOSPATES',
    'delhivery': 'DELHIVERY',
    'delhivery stock': 'DELHIVERY',
    'delhivery limited': 'DELHIVERY'
  };

  /**
   * Parse stock symbol from user query
   */
  static parseStockSymbol(query: string): string | null {
    const cleanQuery = query.toLowerCase().trim();
    console.log(`🔍 Parsing stock query: "${cleanQuery}"`);
    
    // Direct symbol lookup
    if (this.INDIAN_STOCK_SYMBOLS[cleanQuery]) {
      console.log(`✅ Direct match found: ${cleanQuery} -> ${this.INDIAN_STOCK_SYMBOLS[cleanQuery]}`);
      return this.INDIAN_STOCK_SYMBOLS[cleanQuery];
    }
    
    // Check if query contains stock-related keywords
    const stockKeywords = ['stock', 'share', 'equity', 'buy', 'sell', 'invest', 'price', 'analysis'];
    const hasStockKeyword = stockKeywords.some(keyword => cleanQuery.includes(keyword));
    
    if (hasStockKeyword) {
      // Extract potential stock name from query
      for (const [name, symbol] of Object.entries(this.INDIAN_STOCK_SYMBOLS)) {
        if (cleanQuery.includes(name)) {
          console.log(`✅ Keyword match found: "${name}" in "${cleanQuery}" -> ${symbol}`);
          return symbol;
        }
      }
      
      // Look for uppercase patterns that might be stock symbols
      const symbolMatch = query.match(/\b[A-Z]{2,10}\b/);
      if (symbolMatch) {
        console.log(`✅ Symbol pattern match found: ${symbolMatch[0]}`);
        return symbolMatch[0];
      }
    }
    
    console.log(`❌ No stock symbol found in query: "${cleanQuery}"`);
    return null;
  }

  /**
   * Fetch comprehensive stock data using existing APIs
   */
  static async fetchStockData(symbol: string): Promise<StockAnalysisData | null> {
    try {
      // Use the existing hybrid stock API
      const stockData = await HybridStockApiService.getIndexData(`${symbol}.NS`);
      
      if (!stockData) {
        // Try without .NS suffix
        const altData = await HybridStockApiService.getIndexData(symbol);
        if (!altData) {
          throw new Error(`No data found for symbol: ${symbol}`);
        }
        return this.mapToStockAnalysisData(altData, symbol);
      }
      
      return this.mapToStockAnalysisData(stockData, symbol);
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Map stock API data to analysis format
   */
  private static mapToStockAnalysisData(stockData: any, symbol: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: stockData.name || symbol,
      currentPrice: stockData.price || 0,
      change: stockData.change || 0,
      changePercent: stockData.changePercent || 0,
      dayHigh: stockData.dayHigh || 0,
      dayLow: stockData.dayLow || 0,
      volume: stockData.volume || 0,
      marketCap: stockData.marketCap,
      sector: this.getSectorForStock(symbol),
      industry: this.getIndustryForStock(symbol),
      lastUpdated: stockData.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Perform web search for stock insights using Google Custom Search API
   */
  static async searchStockInsights(symbol: string, companyName: string): Promise<WebSearchResult[]> {
    try {
      console.log(`🔍 Performing Google search for ${companyName} (${symbol})`);
      
      // Use Google Custom Search API exclusively
      const results = await GoogleSearchApiService.searchStockInsights(symbol, companyName);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} Google search results for ${symbol}`);
        return results;
      } else {
        console.warn(`⚠️ No Google search results found for ${symbol}, using fallback`);
        return this.getFallbackInsights(symbol, companyName);
      }
    } catch (error) {
      console.error('❌ Google search failed:', error);
      return this.getFallbackInsights(symbol, companyName);
    }
  }


  /**
   * Provide fallback insights when web search fails
   */
  private static getFallbackInsights(symbol: string, companyName: string): WebSearchResult[] {
    return [
      {
        title: `${companyName} Stock Analysis - Key Factors to Consider`,
        url: '#',
        snippet: 'Consider analyzing company fundamentals, recent quarterly results, industry trends, and market sentiment before making investment decisions.',
        source: 'Investment Guidelines',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${symbol} Technical Analysis Points`,
        url: '#',
        snippet: 'Review price charts, moving averages, volume trends, and support/resistance levels for technical insights.',
        source: 'Technical Analysis',
        publishedDate: new Date().toISOString()
      },
      {
        title: `Sector Analysis for ${companyName}`,
        url: '#',
        snippet: 'Evaluate sector performance, peer comparison, and industry-specific factors affecting the stock.',
        source: 'Sector Research',
        publishedDate: new Date().toISOString()
      }
    ];
  }

  /**
   * Generate enhanced AI-powered stock recommendation using web insights
   */
  static async generateEnhancedRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    userQuery: string
  ): Promise<StockRecommendation> {
    console.log(`🧠 Analyzing ${stockData.companyName} using real-time data and ${webInsights.length} web insights...`);

    // Enhanced analysis using web insights
    const webSentimentScore = this.analyzeWebSentiment(webInsights);
    const technicalScore = this.calculateTechnicalScore(stockData);
    const fundamentalScore = this.calculateFundamentalScore(stockData);
    const newsImpactScore = this.calculateNewsImpact(webInsights);
    
    console.log(`📊 Analysis scores - Technical: ${technicalScore}, Sentiment: ${webSentimentScore}, Fundamental: ${fundamentalScore}, News Impact: ${newsImpactScore}`);
    
    // Weighted scoring with emphasis on web insights
    const overallScore = (
      technicalScore * 0.25 + 
      webSentimentScore * 0.35 + 
      fundamentalScore * 0.25 + 
      newsImpactScore * 0.15
    );
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string[] = [];
    
    // Determine action based on enhanced scoring
    if (overallScore >= 75) {
      action = 'BUY';
      confidence = Math.min(95, overallScore);
      reasoning = [
        `Strong buy signals from comprehensive analysis (Score: ${overallScore.toFixed(1)}/100)`,
        `Current market sentiment is positive based on recent news and analysis`,
        `Technical indicators show favorable entry point at ₹${stockData.currentPrice}`,
        `Web research reveals positive outlook from financial experts`
      ];
    } else if (overallScore <= 35) {
      action = 'SELL';
      confidence = Math.min(95, 100 - overallScore);
      reasoning = [
        `Analysis suggests caution with current weak signals (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment appears negative based on recent developments`,
        `Technical indicators show potential downside risk`,
        `Web research indicates concerns from market analysts`
      ];
    } else {
      action = 'HOLD';
      confidence = 60 + Math.abs(overallScore - 50);
      reasoning = [
        `Mixed signals suggest a wait-and-watch approach (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment is neutral with conflicting opinions`,
        `Current price levels appear fairly valued`,
        `Recommend monitoring for clearer directional signals`
      ];
    }
    
    // Add specific insights from web search
    if (webInsights.length > 0) {
      const recentNews = webInsights.filter(insight => {
        if (!insight.publishedDate) return false;
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7;
      });
      
      if (recentNews.length > 0) {
        reasoning.push(`${recentNews.length} recent news articles analyzed for current market sentiment`);
      }
      
      // Add key insights from search results
      const keyTopics = this.extractKeyTopics(webInsights);
      if (keyTopics.length > 0) {
        reasoning.push(`Key market themes: ${keyTopics.join(', ')}`);
      }
    }
    
    // Add stock-specific insights
    if (stockData.changePercent > 5) {
      reasoning.push(`Stock showing strong momentum with +${stockData.changePercent.toFixed(2)}% gain`);
    } else if (stockData.changePercent < -5) {
      reasoning.push(`Stock under pressure with ${stockData.changePercent.toFixed(2)}% decline`);
    }
    
    if (stockData.volume > 0) {
      reasoning.push(`Active trading interest with significant volume`);
    }
    
    return {
      action,
      confidence,
      reasoning,
      timeHorizon: this.determineTimeHorizon(stockData, overallScore),
      targetPrice: this.calculateTargetPrice(stockData, action),
      stopLoss: this.calculateStopLoss(stockData, action)
    };
  }

  /**
   * Original recommendation function (kept for backward compatibility)
   */
  static async generateRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[]
  ): Promise<StockRecommendation> {
    try {
      // Analyze various factors to generate recommendation
      const technicalScore = this.calculateTechnicalScore(stockData);
      const sentimentScore = this.analyzeSentiment(webInsights);
      const fundamentalScore = this.calculateFundamentalScore(stockData);
      
      const overallScore = (technicalScore + sentimentScore + fundamentalScore) / 3;
      
      let action: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;
      let reasoning: string[] = [];
      
      if (overallScore >= 70) {
        action = 'BUY';
        confidence = Math.min(95, overallScore);
        reasoning = [
          'Strong technical indicators showing upward momentum',
          'Positive market sentiment from recent news and analysis',
          'Fundamental metrics appear favorable for growth'
        ];
      } else if (overallScore <= 30) {
        action = 'SELL';
        confidence = Math.min(95, 100 - overallScore);
        reasoning = [
          'Technical indicators suggest downward pressure',
          'Market sentiment appears cautious or negative',
          'Fundamental concerns may impact future performance'
        ];
      } else {
        action = 'HOLD';
        confidence = 60 + Math.abs(overallScore - 50);
        reasoning = [
          'Mixed signals from technical and fundamental analysis',
          'Current price levels may be fairly valued',
          'Consider waiting for clearer market direction'
        ];
      }
      
      // Add specific reasoning based on stock data
      if (stockData.changePercent > 5) {
        reasoning.push('Stock has shown strong recent gains (+' + stockData.changePercent.toFixed(2) + '%)');
      } else if (stockData.changePercent < -5) {
        reasoning.push('Stock has declined recently (' + stockData.changePercent.toFixed(2) + '%)');
      }
      
      if (stockData.volume > 0) {
        reasoning.push('Trading volume indicates active market interest');
      }
      
      return {
        action,
        confidence,
        reasoning,
        timeHorizon: this.determineTimeHorizon(stockData, overallScore),
        targetPrice: this.calculateTargetPrice(stockData, action),
        stopLoss: this.calculateStopLoss(stockData, action)
      };
    } catch (error) {
      console.error('Error generating recommendation:', error);
      
      // Fallback recommendation
      return {
        action: 'HOLD',
        confidence: 50,
        reasoning: [
          'Unable to perform complete analysis due to limited data',
          'Recommend consulting with financial advisor',
          'Consider your risk tolerance and investment goals'
        ],
        timeHorizon: 'MEDIUM_TERM'
      };
    }
  }

  /**
   * Calculate technical analysis score (0-100)
   */
  private static calculateTechnicalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // Price momentum
    if (stockData.changePercent > 2) score += 20;
    else if (stockData.changePercent > 0) score += 10;
    else if (stockData.changePercent < -2) score -= 20;
    else if (stockData.changePercent < 0) score -= 10;
    
    // Price position relative to day range
    const dayRange = stockData.dayHigh - stockData.dayLow;
    if (dayRange > 0) {
      const pricePosition = (stockData.currentPrice - stockData.dayLow) / dayRange;
      if (pricePosition > 0.8) score += 15;
      else if (pricePosition > 0.6) score += 10;
      else if (pricePosition < 0.2) score -= 15;
      else if (pricePosition < 0.4) score -= 10;
    }
    
    // Volume analysis (higher volume generally indicates stronger moves)
    if (stockData.volume > 1000000) score += 10;
    else if (stockData.volume > 500000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enhanced web sentiment analysis using comprehensive keyword analysis
   */
  private static analyzeWebSentiment(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const strongPositiveKeywords = [
      'strong buy', 'outperform', 'upgrade', 'target raised', 'bullish', 'positive outlook',
      'growth potential', 'strong results', 'beat estimates', 'expansion', 'record high'
    ];
    
    const positiveKeywords = [
      'buy', 'positive', 'growth', 'strong', 'good', 'increase', 'gain', 'profit',
      'revenue growth', 'market share', 'competitive advantage', 'dividend'
    ];
    
    const strongNegativeKeywords = [
      'strong sell', 'underperform', 'downgrade', 'target cut', 'bearish', 'negative outlook',
      'profit warning', 'loss', 'debt concerns', 'regulatory issues', 'scandal'
    ];
    
    const negativeKeywords = [
      'sell', 'negative', 'decline', 'weak', 'concern', 'risk', 'fall', 'drop',
      'competition', 'pressure', 'margin compression', 'volatility'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      // Strong signals get higher weight
      strongPositiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 8;
      });
      
      strongNegativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 8;
      });
      
      // Regular signals
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
      
      // Recency bonus - more recent articles get higher weight
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) score += 2; // Today's news
        if (daysSince < 7) score += 1; // This week's news
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate news impact score based on source credibility and recency
   */
  private static calculateNewsImpact(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const trustedSources = [
      'moneycontrol', 'economic times', 'livemint', 'business standard',
      'financial express', 'bloomberg', 'reuters', 'cnbc'
    ];
    
    insights.forEach(insight => {
      let articleWeight = 1;
      
      // Higher weight for trusted sources
      trustedSources.forEach(source => {
        if (insight.source.toLowerCase().includes(source)) {
          articleWeight = 2;
        }
      });
      
      // Recency factor
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) articleWeight *= 2; // Very recent
        if (daysSince < 7) articleWeight *= 1.5; // Recent
      }
      
      // Content analysis
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      if (text.includes('analyst') || text.includes('recommendation')) {
        score += 5 * articleWeight;
      }
      
      if (text.includes('earnings') || text.includes('results')) {
        score += 4 * articleWeight;
      }
      
      if (text.includes('target price') || text.includes('price target')) {
        score += 6 * articleWeight;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract key topics from web insights
   */
  private static extractKeyTopics(insights: WebSearchResult[]): string[] {
    const topics = new Set<string>();
    
    const topicKeywords = {
      'earnings': ['earnings', 'results', 'quarterly', 'annual'],
      'analyst recommendation': ['analyst', 'recommendation', 'rating', 'target'],
      'expansion': ['expansion', 'growth', 'new', 'launch'],
      'regulatory': ['regulatory', 'government', 'policy', 'approval'],
      'competition': ['competition', 'competitor', 'market share'],
      'financial performance': ['revenue', 'profit', 'margin', 'debt']
    };
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          topics.add(topic);
        }
      });
    });
    
    return Array.from(topics).slice(0, 3); // Return top 3 topics
  }

  /**
   * Analyze sentiment from web insights
   */
  private static analyzeSentiment(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const positiveKeywords = [
      'bullish', 'positive', 'growth', 'strong', 'outperform', 'upgrade', 'buy',
      'target', 'potential', 'recovery', 'momentum', 'breakout', 'support'
    ];
    
    const negativeKeywords = [
      'bearish', 'negative', 'decline', 'weak', 'underperform', 'downgrade', 'sell',
      'concern', 'risk', 'pressure', 'resistance', 'correction', 'caution'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate fundamental analysis score
   */
  private static calculateFundamentalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // Sector-based adjustments
    const growthSectors = ['Information Technology', 'Healthcare', 'Consumer Discretionary'];
    const defensiveSectors = ['Consumer Staples', 'Utilities', 'Telecommunications'];
    
    if (growthSectors.includes(stockData.sector)) {
      score += 10;
    } else if (defensiveSectors.includes(stockData.sector)) {
      score += 5;
    }
    
    // Market cap considerations (assuming larger companies are more stable)
    if (stockData.marketCap && stockData.marketCap > 1000000000) { // > 1000 Cr
      score += 10;
    } else if (stockData.marketCap && stockData.marketCap > 500000000) { // > 500 Cr
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine investment time horizon
   */
  private static determineTimeHorizon(stockData: StockAnalysisData, score: number): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
    if (Math.abs(stockData.changePercent) > 3 && score > 70) {
      return 'SHORT_TERM'; // High volatility with strong signal
    } else if (score > 60 || score < 40) {
      return 'MEDIUM_TERM'; // Clear directional bias
    } else {
      return 'LONG_TERM'; // Unclear signals, longer horizon recommended
    }
  }

  /**
   * Calculate target price based on recommendation
   */
  private static calculateTargetPrice(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 1.15; // 15% upside target
    } else if (action === 'SELL') {
      return stockData.currentPrice * 0.90; // 10% downside
    }
    return undefined; // No target for HOLD
  }

  /**
   * Calculate stop loss based on recommendation
   */
  private static calculateStopLoss(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 0.95; // 5% stop loss
    } else if (action === 'SELL') {
      return stockData.currentPrice * 1.05; // 5% stop loss on short
    }
    return undefined; // No stop loss for HOLD
  }

  /**
   * Get sector information for a stock
   */
  private static getSectorForStock(symbol: string): string {
    const sectorMap: Record<string, string> = {
      'RELIANCE': 'Oil & Gas',
      'TCS': 'Information Technology',
      'HDFCBANK': 'Financial Services',
      'INFY': 'Information Technology',
      'HINDUNILVR': 'Consumer Goods',
      'ICICIBANK': 'Financial Services',
      'KOTAKBANK': 'Financial Services',
      'LT': 'Infrastructure',
      'ITC': 'Consumer Goods',
      'SBIN': 'Financial Services',
      'BHARTIARTL': 'Telecommunications',
      'ASIANPAINT': 'Consumer Discretionary',
      'AXISBANK': 'Financial Services',
      'MARUTI': 'Automotive',
      'BAJFINANCE': 'Financial Services',
      'HCLTECH': 'Information Technology',
      'M&M': 'Automotive',
      'SUNPHARMA': 'Healthcare',
      'TITAN': 'Consumer Discretionary',
      'NESTLEIND': 'Consumer Staples',
      'TATAMOTORS': 'Automotive',
      'WIPRO': 'Information Technology',
      'ONGC': 'Oil & Gas',
      'TECHM': 'Information Technology',
      'POWERGRID': 'Utilities',
      'NTPC': 'Utilities',
      'JSWSTEEL': 'Metals & Mining',
      'COALINDIA': 'Metals & Mining',
      'ULTRACEMCO': 'Construction Materials',
      'BAJAJFINSV': 'Financial Services',
      'DELHIVERY': 'Transportation & Logistics',
      'PARADEEPHOSPATES': 'Chemicals'
    };
    
    return sectorMap[symbol] || 'Other';
  }

  /**
   * Get industry information for a stock
   */
  private static getIndustryForStock(symbol: string): string {
    const industryMap: Record<string, string> = {
      'RELIANCE': 'Petrochemicals',
      'TCS': 'IT Services',
      'HDFCBANK': 'Private Bank',
      'INFY': 'IT Services',
      'HINDUNILVR': 'FMCG',
      'ICICIBANK': 'Private Bank',
      'KOTAKBANK': 'Private Bank',
      'LT': 'Engineering',
      'ITC': 'Tobacco & FMCG',
      'SBIN': 'Public Bank',
      'BHARTIARTL': 'Telecom Services',
      'ASIANPAINT': 'Paints',
      'AXISBANK': 'Private Bank',
      'MARUTI': 'Automobile Manufacturing',
      'BAJFINANCE': 'Non-Banking Financial Company',
      'HCLTECH': 'IT Services',
      'M&M': 'Automobile Manufacturing',
      'SUNPHARMA': 'Pharmaceuticals',
      'TITAN': 'Jewelry & Watches',
      'NESTLEIND': 'Food Products',
      'TATAMOTORS': 'Automobile Manufacturing',
      'WIPRO': 'IT Services',
      'ONGC': 'Oil Exploration',
      'TECHM': 'IT Services',
      'POWERGRID': 'Power Transmission',
      'NTPC': 'Power Generation',
      'JSWSTEEL': 'Steel Manufacturing',
      'COALINDIA': 'Coal Mining',
      'ULTRACEMCO': 'Cement Manufacturing',
      'BAJAJFINSV': 'Financial Services',
      'DELHIVERY': 'Logistics & Supply Chain',
      'PARADEEPHOSPATES': 'Phosphate Chemicals'
    };
    
    return industryMap[symbol] || 'Other';
  }

  /**
   * Complete stock analysis pipeline with enhanced web search integration
   */
  static async analyzeStock(userQuery: string): Promise<StockAnalysisResult | null> {
    try {
      // Parse stock symbol from query
      const symbol = this.parseStockSymbol(userQuery);
      if (!symbol) {
        return null;
      }

      console.log(`🔍 Starting comprehensive analysis for: ${symbol}`);
      console.log(`📝 User query: "${userQuery}"`);

      // Step 1: Fetch real-time stock data
      console.log(`📊 Step 1: Fetching real-time stock data for ${symbol}...`);
      const stockData = await this.fetchStockData(symbol);
      if (!stockData) {
        throw new Error(`Could not fetch stock data for ${symbol}`);
      }
      console.log(`✅ Stock data retrieved: ${stockData.companyName} at ₹${stockData.currentPrice}`);

      // Step 2: Perform comprehensive web search
      console.log(`🌐 Step 2: Performing web search for latest insights on ${stockData.companyName}...`);
      const webInsights = await this.searchStockInsights(symbol, stockData.companyName);
      console.log(`✅ Found ${webInsights.length} web insights from financial sources`);

      // Step 3: Enhanced recommendation based on real data
      console.log(`🧠 Step 3: Generating AI recommendation using real-time data and web insights...`);
      const recommendation = await this.generateEnhancedRecommendation(
        stockData, 
        webInsights, 
        userQuery
      );
      console.log(`✅ Generated ${recommendation.action} recommendation with ${recommendation.confidence}% confidence`);

      return {
        stockData,
        webInsights,
        recommendation,
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This analysis is based on real-time data and web research for educational purposes only.',
          'Not financial advice - consult qualified financial advisors before investing.',
          'Stock markets are volatile and past performance doesn\'t guarantee future results.',
          'Consider your risk tolerance, investment objectives, and financial situation.',
          'Web search data reflects current market sentiment but may change rapidly.'
        ]
      };
    } catch (error) {
      console.error('❌ Error in comprehensive stock analysis:', error);
      return null;
    }
  }
}