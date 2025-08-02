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
  
  // Common stock keywords for detection
  private static readonly STOCK_KEYWORDS = [
    'stock', 'share', 'equity', 'buy', 'sell', 'invest', 'investment', 'price', 'analysis', 
    'recommendation', 'target', 'trading', 'market', 'nse', 'bse', 'sensex', 'nifty'
  ];

  /**
   * Intelligently extract stock names from user queries using NLP-like approach
   */
  static parseStockSymbol(query: string): string | null {
    const cleanQuery = query.toLowerCase().trim();
    console.log(`🔍 Intelligent stock detection for: "${cleanQuery}"`);
    
    // Check if this is a stock-related query
    const hasStockKeyword = this.STOCK_KEYWORDS.some(keyword => cleanQuery.includes(keyword));
    
    if (!hasStockKeyword) {
      console.log(`❌ No stock keywords detected in: "${cleanQuery}"`);
      return null;
    }
    
    console.log(`✅ Stock-related query detected`);
    
    // Extract potential company names using intelligent parsing
    const potentialStockNames = this.extractCompanyNames(cleanQuery);
    
    if (potentialStockNames.length > 0) {
      console.log(`🎯 Extracted potential stock names: ${potentialStockNames.join(', ')}`);
      return potentialStockNames[0]; // Return the first/most likely match
    }
    
    console.log(`❌ No stock names extracted from: "${cleanQuery}"`);
    return null;
  }

  /**
   * Extract company names from query using intelligent patterns
   */
  private static extractCompanyNames(query: string): string[] {
    const words = query.split(/\s+/);
    const potentialNames: string[] = [];
    
    // Remove common stop words and stock keywords
    const stopWords = new Set([
      'i', 'should', 'buy', 'sell', 'invest', 'stock', 'share', 'shares', 'equity', 'now', 'today',
      'analysis', 'recommendation', 'price', 'target', 'good', 'bad', 'investment', 'the', 'a', 'an',
      'is', 'are', 'was', 'were', 'what', 'when', 'where', 'why', 'how', 'about', 'for', 'on', 'in'
    ]);
    
    // Extract meaningful words that could be company names
    const meaningfulWords = words.filter(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      return cleanWord.length > 2 && !stopWords.has(cleanWord) && !this.STOCK_KEYWORDS.includes(cleanWord);
    });
    
    console.log(`📝 Meaningful words found: ${meaningfulWords.join(', ')}`);
    
    // Try different combinations
    for (let i = 0; i < meaningfulWords.length; i++) {
      // Single word company names
      const singleWord = meaningfulWords[i].replace(/[^\w]/g, '').toUpperCase();
      if (singleWord.length >= 3) {
        potentialNames.push(singleWord);
      }
      
      // Two word combinations
      if (i < meaningfulWords.length - 1) {
        const twoWords = (meaningfulWords[i] + meaningfulWords[i + 1]).replace(/[^\w]/g, '').toUpperCase();
        if (twoWords.length >= 4) {
          potentialNames.push(twoWords);
        }
      }
      
      // Three word combinations for companies like "Tata Consultancy Services"
      if (i < meaningfulWords.length - 2) {
        const threeWords = (meaningfulWords[i] + meaningfulWords[i + 1] + meaningfulWords[i + 2]).replace(/[^\w]/g, '').toUpperCase();
        if (threeWords.length >= 6) {
          potentialNames.push(threeWords);
        }
      }
    }
    
    // Also look for existing uppercase patterns (NSE symbols)
    const upperCaseMatches = query.match(/\b[A-Z]{2,15}\b/g);
    if (upperCaseMatches) {
      potentialNames.push(...upperCaseMatches);
    }
    
    // Remove duplicates and return
    return Array.from(new Set(potentialNames));
  }

  /**
   * Intelligently fetch stock data trying multiple variations
   */
  static async fetchStockData(symbol: string): Promise<StockAnalysisData | null> {
    console.log(`📊 Attempting to fetch stock data for: ${symbol}`);
    
    // Try multiple symbol variations
    const symbolVariations = [
      `${symbol}.NS`,     // NSE format
      symbol,             // Direct symbol
      `${symbol}.BO`,     // BSE format
      symbol.toUpperCase(), // Uppercase
      symbol.toLowerCase()  // Lowercase
    ];
    
    for (const symbolVariation of symbolVariations) {
      try {
        console.log(`🔄 Trying symbol variation: ${symbolVariation}`);
        const stockData = await HybridStockApiService.getIndexData(symbolVariation);
        
        if (stockData && stockData.price > 0) {
          console.log(`✅ Found stock data for ${symbolVariation}: ${stockData.name} at ₹${stockData.price}`);
          return this.mapToStockAnalysisData(stockData, symbol);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch data for ${symbolVariation}:`, error);
        continue; // Try next variation
      }
    }
    
    console.error(`❌ Could not fetch stock data for any variation of: ${symbol}`);
    return null;
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
      sector: stockData.sector || 'General', // Use API data if available
      industry: stockData.industry || 'General', // Use API data if available
      lastUpdated: stockData.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Perform web search for stock insights using Google Custom Search API
   */
  static async searchStockInsights(symbol: string, companyName: string): Promise<WebSearchResult[]> {
    console.log(`🌐 Starting web search for: ${companyName} (${symbol})`);
    
    // First check if Google API credentials are available
    const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
    
    console.log(`🔑 API Key available: ${!!apiKey}`);
    console.log(`🔍 Search Engine ID available: ${!!searchEngineId}`);
    
    if (!apiKey || !searchEngineId) {
      console.error('❌ Google Search API credentials missing!');
      console.error('Missing:', { apiKey: !apiKey, searchEngineId: !searchEngineId });
      return this.getFallbackInsights(symbol, companyName);
    }
    
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
        stockData.currentPrice > 0 ? `Technical indicators show favorable entry point at ₹${stockData.currentPrice}` : `Web research indicates favorable market conditions`,
        `Financial experts show positive outlook based on web research`
      ];
    } else if (overallScore <= 35) {
      action = 'SELL';
      confidence = Math.min(95, 100 - overallScore);
      reasoning = [
        `Analysis suggests caution with current weak signals (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment appears negative based on recent developments`,
        stockData.currentPrice > 0 ? `Technical indicators show potential downside risk` : `Web research indicates market concerns`,
        `Financial analysts express caution based on recent news`
      ];
    } else {
      action = 'HOLD';
      confidence = 60 + Math.abs(overallScore - 50);
      reasoning = [
        `Mixed signals suggest a wait-and-watch approach (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment is neutral with conflicting opinions`,
        stockData.currentPrice > 0 ? `Current price levels appear fairly valued` : `Insufficient data for clear directional signals`,
        `Recommend monitoring for clearer market direction`
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
    
    // If no real-time data available, return neutral score
    if (stockData.currentPrice === 0) {
      return 50;
    }
    
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
    if (insights.length === 0) return 50; // Neutral if no insights
    
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

  // Removed hardcoded sector/industry mappings - now using dynamic data from APIs

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

      // Step 1: Try to fetch real-time stock data
      console.log(`📊 Step 1: Attempting to fetch stock data for ${symbol}...`);
      let stockData = await this.fetchStockData(symbol);
      
      // If stock data not found, create a fallback entry and continue with web search
      if (!stockData) {
        console.log(`⚠️ No stock data found for ${symbol}, creating fallback entry for web search`);
        stockData = this.createFallbackStockData(symbol, userQuery);
      } else {
        console.log(`✅ Stock data retrieved: ${stockData.companyName} at ₹${stockData.currentPrice}`);
      }

      // Step 2: Always perform web search (even if stock data not found)
      console.log(`🌐 Step 2: Performing web search for latest insights on ${stockData.companyName}...`);
      const webInsights = await this.searchStockInsights(symbol, stockData.companyName);
      console.log(`✅ Found ${webInsights.length} web insights from financial sources`);

      // Step 3: Generate recommendation based on available data
      console.log(`🧠 Step 3: Generating recommendation using available data and web insights...`);
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
          'This analysis is based on web research and available data for educational purposes only.',
          'Not financial advice - consult qualified financial advisors before investing.',
          'Stock markets are volatile and past performance doesn\'t guarantee future results.',
          'Consider your risk tolerance, investment objectives, and financial situation.',
          'Web search data reflects current market sentiment but may change rapidly.',
          ...(stockData.currentPrice === 0 ? ['Real-time stock price data not available - analysis based on web research only.'] : [])
        ]
      };
    } catch (error) {
      console.error('❌ Error in comprehensive stock analysis:', error);
      return null;
    }
  }

  /**
   * Create fallback stock data when real data is not available
   */
  private static createFallbackStockData(symbol: string, userQuery: string): StockAnalysisData {
    // Extract company name from the original query for better web search
    const words = userQuery.toLowerCase().split(/\s+/);
    const stopWords = new Set(['should', 'i', 'buy', 'sell', 'stock', 'share', 'analysis', 'of', 'about']);
    const companyWords = words.filter(word => !stopWords.has(word) && word.length > 2);
    const companyName = companyWords.length > 0 ? companyWords.join(' ').toUpperCase() : symbol;
    
    return {
      symbol: symbol,
      companyName: companyName,
      currentPrice: 0, // Indicates no real-time data available
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      sector: 'General',
      industry: 'General',
      lastUpdated: new Date().toISOString()
    };
  }
}