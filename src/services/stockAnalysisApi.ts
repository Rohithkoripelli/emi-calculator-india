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
    'shriram finance': 'SHRIRAMFIN'
  };

  /**
   * Parse stock symbol from user query
   */
  static parseStockSymbol(query: string): string | null {
    const cleanQuery = query.toLowerCase().trim();
    
    // Direct symbol lookup
    if (this.INDIAN_STOCK_SYMBOLS[cleanQuery]) {
      return this.INDIAN_STOCK_SYMBOLS[cleanQuery];
    }
    
    // Check if query contains stock-related keywords
    const stockKeywords = ['stock', 'share', 'equity', 'buy', 'sell', 'invest', 'price', 'analysis'];
    const hasStockKeyword = stockKeywords.some(keyword => cleanQuery.includes(keyword));
    
    if (hasStockKeyword) {
      // Extract potential stock name from query
      for (const [name, symbol] of Object.entries(this.INDIAN_STOCK_SYMBOLS)) {
        if (cleanQuery.includes(name)) {
          return symbol;
        }
      }
      
      // Look for uppercase patterns that might be stock symbols
      const symbolMatch = query.match(/\b[A-Z]{2,10}\b/);
      if (symbolMatch) {
        return symbolMatch[0];
      }
    }
    
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
   * Generate AI-powered stock recommendation
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
      'BAJAJFINSV': 'Financial Services'
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
      'BAJAJFINSV': 'Financial Services'
    };
    
    return industryMap[symbol] || 'Other';
  }

  /**
   * Complete stock analysis pipeline
   */
  static async analyzeStock(userQuery: string): Promise<StockAnalysisResult | null> {
    try {
      // Parse stock symbol from query
      const symbol = this.parseStockSymbol(userQuery);
      if (!symbol) {
        return null;
      }

      console.log(`🔍 Analyzing stock: ${symbol}`);

      // Fetch stock data
      const stockData = await this.fetchStockData(symbol);
      if (!stockData) {
        throw new Error(`Could not fetch data for ${symbol}`);
      }

      // Search for web insights
      const webInsights = await this.searchStockInsights(symbol, stockData.companyName);

      // Generate recommendation
      const recommendation = await this.generateRecommendation(stockData, webInsights);

      return {
        stockData,
        webInsights,
        recommendation,
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This analysis is for educational purposes only and not financial advice.',
          'Past performance does not guarantee future results.',
          'Please consult with a qualified financial advisor before making investment decisions.',
          'Stock markets are subject to risks and volatility.',
          'Consider your risk tolerance and investment objectives carefully.'
        ]
      };
    } catch (error) {
      console.error('Error in stock analysis:', error);
      return null;
    }
  }
}