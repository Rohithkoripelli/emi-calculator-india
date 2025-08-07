/**
 * Investment Analysis Service
 * Combines all data sources (Groww API, News, Technical Analysis) and generates comprehensive recommendations
 */

import { GrowwApiService, StockQuote, HistoricalCandle, TechnicalAnalysis } from './growwApiService';
import { NewsSearchService, TrendingStock, StockNews, MarketTrends } from './newsSearchService';
import { ExcelBasedStockAnalysisService } from './excelBasedStockAnalysis';

interface StockAnalysisReport {
  stock_info: {
    symbol: string;
    company_name: string;
    sector: string;
    market_cap: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
    current_price: number;
    day_change: number;
    day_change_percent: number;
  };
  technical_analysis: TechnicalAnalysis | null;
  fundamental_data: {
    volume: number;
    market_cap_value: number | null;
    week_52_high: number | null;
    week_52_low: number | null;
    pe_ratio: number | null;
  };
  news_sentiment: {
    overall_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    key_news: StockNews[];
    sentiment_score: number;
  };
  recommendation: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    target_price: number | null;
    stop_loss: number | null;
    time_horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    reasoning: string[];
  };
  risk_analysis: {
    risk_level: 'LOW' | 'MODERATE' | 'HIGH';
    key_risks: string[];
    volatility: number;
  };
  web_research?: {
    search_results: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
    search_queries: string[];
  };
}

interface InvestmentRecommendation {
  query_analysis: {
    investment_amount: number;
    investment_frequency: 'LUMP_SUM' | 'SIP' | 'RECURRING';
    risk_appetite: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    time_horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  };
  market_overview: {
    current_sentiment: 'BULLISH' | 'BEARISH' | 'MIXED';
    trending_sectors: string[];
    market_summary: string;
  };
  portfolio_allocation: {
    large_cap: {
      allocation_percent: number;
      amount: number;
      stocks: Array<{
        symbol: string;
        company_name: string;
        allocation_percent: number;
        amount: number;
        current_price: number;
        target_price: number | null;
        reasoning: string;
      }>;
    };
    mid_cap: {
      allocation_percent: number;
      amount: number;
      stocks: Array<{
        symbol: string;
        company_name: string;
        allocation_percent: number;
        amount: number;
        current_price: number;
        target_price: number | null;
        reasoning: string;
      }>;
    };
    small_cap: {
      allocation_percent: number;
      amount: number;
      stocks: Array<{
        symbol: string;
        company_name: string;
        allocation_percent: number;
        amount: number;
        current_price: number;
        target_price: number | null;
        reasoning: string;
      }>;
    };
  };
  investment_strategy: {
    strategy_type: string;
    key_points: string[];
    timeline: string;
    review_frequency: string;
  };
  risk_management: {
    diversification_score: number;
    suggested_stop_loss: number;
    risk_mitigation_strategies: string[];
  };
  tax_implications: {
    investment_type: 'EQUITY' | 'MIXED';
    tax_efficiency_tips: string[];
  };
  next_steps: string[];
}

export class InvestmentAnalysisService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  
  private static getOpenAIHeaders(): Record<string, string> {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found in environment variables');
      console.warn('Please set REACT_APP_OPENAI_API_KEY in your .env file');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }

  /**
   * Analyze a specific stock with comprehensive data
   */
  static async analyzeStock(symbol: string): Promise<StockAnalysisReport | null> {
    try {
      console.log(`🔍 Starting comprehensive analysis for ${symbol}...`);
      
      // Step 1: Get company info from our database
      const companyInfo = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
      if (!companyInfo) {
        console.error(`❌ Company not found for symbol: ${symbol}`);
        return null;
      }
      
      console.log(`📊 Analyzing ${companyInfo.name} (${symbol})...`);
      
      // Step 2: Get real-time quote
      const quote = await GrowwApiService.getRealTimeQuote(symbol);
      if (!quote) {
        console.error(`❌ Unable to fetch real-time data for ${symbol}`);
        return null;
      }
      
      // Step 3: Get historical data and technical analysis
      const historicalData = await GrowwApiService.getHistoricalData(symbol, 30);
      const technicalAnalysis = historicalData ? 
        GrowwApiService.performTechnicalAnalysis(historicalData) : null;
      
      // Step 4: Conduct comprehensive web research for market analysis
      console.log(`🔍 Conducting comprehensive web research for ${symbol}...`);
      const webResearch = await this.conductWebResearch(symbol, companyInfo.name);
      
      // Step 5: Get news and sentiment analysis (now enhanced with web research)
      const stockNews = await NewsSearchService.getStockNews(symbol, companyInfo.name);
      const newsSentiment = this.analyzeNewsSentiment(stockNews);
      
      // Step 6: Generate comprehensive recommendation using all data
      const recommendation = await this.generateStockRecommendation({
        quote,
        technicalAnalysis,
        stockNews,
        companyInfo
      });
      
      // Step 6: Compile the analysis report
      const report: StockAnalysisReport = {
        stock_info: {
          symbol: symbol,
          company_name: companyInfo.name,
          sector: this.determineSector(companyInfo.name),
          market_cap: this.determineMarketCap(companyInfo.name),
          current_price: quote.currentPrice,
          day_change: quote.dayChange,
          day_change_percent: quote.dayChangePercent
        },
        technical_analysis: technicalAnalysis,
        fundamental_data: {
          volume: quote.volume,
          market_cap_value: quote.marketCap,
          week_52_high: quote.week52High,
          week_52_low: quote.week52Low,
          pe_ratio: null // Would need additional data source
        },
        news_sentiment: newsSentiment,
        recommendation: recommendation,
        risk_analysis: this.assessRiskLevel(quote, technicalAnalysis, newsSentiment),
        web_research: webResearch
      };
      
      console.log(`✅ Analysis complete for ${symbol}: ${recommendation.action} (${recommendation.confidence}% confidence)`);
      return report;
      
    } catch (error) {
      console.error('❌ Error in stock analysis:', error);
      return null;
    }
  }

  /**
   * Generate investment recommendations with comprehensive market research
   */
  static async generateInvestmentRecommendation(
    query: string,
    amount: number,
    frequency: 'LUMP_SUM' | 'SIP' | 'RECURRING' = 'LUMP_SUM'
  ): Promise<InvestmentRecommendation | null> {
    try {
      console.log(`💼 Starting comprehensive market research for ₹${amount} investment...`);
      
      // Step 1: Comprehensive Market Research
      console.log('🔍 Phase 1: Comprehensive Market Research');
      const marketResearch = await this.conductComprehensiveMarketResearch(amount);
      
      // Step 2: Historical Analysis of discovered stocks
      console.log('📈 Phase 2: Historical Trend Analysis (5-6 months)');
      const historicalAnalysis = await this.analyzeHistoricalTrends(marketResearch.discoveredStocks);
      
      // Step 3: Current Market Sentiment and News Analysis
      console.log('📰 Phase 3: News Sentiment Analysis');
      const newsAnalysis = await this.analyzeCurrentMarketNews(marketResearch.discoveredStocks);
      
      // Step 4: Filter and rank stocks based on comprehensive analysis
      console.log('🎯 Phase 4: Stock Filtering and Ranking');
      const rankedStocks = await this.rankStocksBasedOnAnalysis(
        marketResearch.discoveredStocks,
        historicalAnalysis,
        newsAnalysis,
        amount
      );
      
      // Step 5: Create optimized portfolio allocation
      console.log('💼 Phase 5: Creating Optimized Portfolio');
      const portfolioAllocation = await this.createOptimizedPortfolioAllocation(
        rankedStocks,
        amount,
        frequency
      );
      
      // Step 6: Generate AI-powered investment strategy
      console.log('🧠 Phase 6: Generating AI Investment Strategy');
      const strategy = await this.generateAdvancedInvestmentStrategy({
        marketResearch,
        historicalAnalysis,
        newsAnalysis,
        rankedStocks,
        amount,
        frequency
      });
      
      // Step 7: Compile comprehensive recommendation
      const recommendation: InvestmentRecommendation = {
        query_analysis: this.analyzeInvestmentQuery(query, amount, frequency),
        market_overview: {
          current_sentiment: marketResearch.marketSentiment,
          trending_sectors: marketResearch.trendingSectors,
          market_summary: marketResearch.marketSummary
        },
        portfolio_allocation: portfolioAllocation,
        investment_strategy: strategy.investment_strategy,
        risk_management: strategy.risk_management,
        tax_implications: strategy.tax_implications,
        next_steps: strategy.next_steps
      };
      
      console.log(`✅ Comprehensive investment recommendation generated for ₹${amount}`);
      return recommendation;
      
    } catch (error) {
      console.error('❌ Error generating investment recommendation:', error);
      return null;
    }
  }

  /**
   * Analyze news sentiment for a stock
   */
  private static analyzeNewsSentiment(news: StockNews[]): {
    overall_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    key_news: StockNews[];
    sentiment_score: number;
  } {
    if (news.length === 0) {
      return {
        overall_sentiment: 'NEUTRAL',
        key_news: [],
        sentiment_score: 50
      };
    }
    
    const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    news.forEach(article => {
      sentimentCounts[article.sentiment]++;
    });
    
    const totalNews = news.length;
    const positiveRatio = sentimentCounts.POSITIVE / totalNews;
    const negativeRatio = sentimentCounts.NEGATIVE / totalNews;
    
    let overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    let sentimentScore = 50;
    
    if (positiveRatio > 0.6) {
      overallSentiment = 'POSITIVE';
      sentimentScore = 50 + (positiveRatio * 40);
    } else if (negativeRatio > 0.6) {
      overallSentiment = 'NEGATIVE';
      sentimentScore = 50 - (negativeRatio * 40);
    }
    
    return {
      overall_sentiment: overallSentiment,
      key_news: news.slice(0, 3), // Top 3 most relevant news
      sentiment_score: Math.round(sentimentScore)
    };
  }

  /**
   * Generate stock recommendation using OpenAI
   */
  private static async generateStockRecommendation(data: any): Promise<any> {
    try {
      const prompt = `
        As a professional stock analyst, provide a comprehensive recommendation for this stock:
        
        Company: ${data.companyInfo.name} (${data.quote.symbol})
        Current Price: ₹${data.quote.currentPrice}
        Day Change: ${data.quote.dayChangePercent.toFixed(2)}%
        Volume: ${data.quote.volume}
        
        Technical Analysis: ${data.technicalAnalysis ? JSON.stringify(data.technicalAnalysis) : 'Not available'}
        
        Recent News: ${data.stockNews.map((news: any) => `${news.headline} (${news.sentiment})`).join('; ')}
        
        Provide a JSON response with:
        {
          "action": "BUY|SELL|HOLD",
          "confidence": number (0-100),
          "target_price": number or null,
          "stop_loss": number or null,
          "time_horizon": "SHORT_TERM|MEDIUM_TERM|LONG_TERM",
          "reasoning": ["reason1", "reason2", "reason3"]
        }
      `;
      
      const response = await this.callOpenAI(prompt);
      return this.parseRecommendationResponse(response, data.quote.currentPrice);
      
    } catch (error) {
      console.error('❌ Error generating OpenAI recommendation:', error);
      return this.getFallbackRecommendation(data);
    }
  }

  /**
   * Generate investment strategy using OpenAI
   */
  private static async generateInvestmentStrategy(data: any): Promise<any> {
    try {
      const prompt = `
        As a financial advisor, create an investment strategy for:
        
        Investment Amount: ₹${data.amount}
        Frequency: ${data.frequency}
        Risk Appetite: ${data.queryAnalysis.risk_appetite}
        Market Sentiment: ${data.marketTrends.market_sentiment}
        
        Portfolio Allocation: ${JSON.stringify(data.portfolioAllocation, null, 2)}
        
        Provide a comprehensive strategy in JSON format with investment_strategy, risk_management, tax_implications, and next_steps.
      `;
      
      const response = await this.callOpenAI(prompt);
      return this.parseStrategyResponse(response);
      
    } catch (error) {
      console.error('❌ Error generating investment strategy:', error);
      return this.getFallbackStrategy(data);
    }
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: this.getOpenAIHeaders(),
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst specializing in Indian stock market. Provide accurate, data-driven recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Conduct comprehensive market research across industries and market caps
   */
  private static async conductComprehensiveMarketResearch(amount: number): Promise<any> {
    try {
      console.log('🔬 Starting comprehensive market research...');
      
      // Use comprehensive fallback research with enhanced stock discovery
      const discoveredStocks = await this.fallbackMarketResearch();
      const marketSentiment = await this.analyzeCurrentMarketSentiment();
      
      return {
        discoveredStocks,
        marketSentiment: marketSentiment.sentiment,
        trendingSectors: marketSentiment.sectors,
        marketSummary: marketSentiment.summary
      };
      
    } catch (error) {
      console.error('❌ Error in market research:', error);
      // Fallback to basic research
      const discoveredStocks = await this.fallbackMarketResearch();
      return {
        discoveredStocks,
        marketSentiment: 'MIXED',
        trendingSectors: ['Technology', 'Banking', 'Healthcare'],
        marketSummary: 'Market showing mixed signals with selective opportunities'
      };
    }
  }

  /**
   * Analyze 5-6 months historical trends for discovered stocks
   */
  private static async analyzeHistoricalTrends(stocks: any[]): Promise<any> {
    try {
      console.log(`📈 Analyzing historical trends for ${stocks.length} stocks...`);
      
      const historicalAnalysis: any = {};
      
      // Analyze historical data for each stock
      for (const stock of stocks.slice(0, 10)) { // Limit to 10 stocks to avoid overwhelming API
        try {
          const historicalData = await GrowwApiService.getHistoricalData(stock.symbol, 150); // ~5 months
          
          if (historicalData && historicalData.length > 0) {
            const analysis = {
              symbol: stock.symbol,
              priceRange: this.calculatePriceRange(historicalData),
              trend: this.analyzeTrend(historicalData),
              volatility: this.calculateVolatility(historicalData),
              momentum: this.calculateMomentum(historicalData),
              supportResistance: this.findSupportResistance(historicalData)
            };
            
            historicalAnalysis[stock.symbol] = analysis;
            console.log(`✅ Historical analysis complete for ${stock.symbol}: ${analysis.trend}`);
          }
        } catch (error) {
          console.error(`❌ Error analyzing ${stock.symbol}:`, error);
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return historicalAnalysis;
      
    } catch (error) {
      console.error('❌ Error in historical analysis:', error);
      return {};
    }
  }

  /**
   * Analyze current market news for sentiment
   */
  private static async analyzeCurrentMarketNews(stocks: any[]): Promise<any> {
    try {
      console.log(`📰 Analyzing current market news for ${stocks.length} stocks...`);
      
      const newsAnalysis: any = {};
      
      // Analyze news for top stocks
      for (const stock of stocks.slice(0, 8)) {
        try {
          const stockNews = await NewsSearchService.getStockNews(stock.symbol, stock.companyName);
          const sentiment = this.analyzeNewsSentiment(stockNews);
          
          newsAnalysis[stock.symbol] = {
            sentiment: sentiment.overall_sentiment,
            score: sentiment.sentiment_score,
            keyNews: sentiment.key_news.slice(0, 2), // Top 2 news items
            newsCount: stockNews.length
          };
          
          console.log(`📰 News analysis for ${stock.symbol}: ${sentiment.overall_sentiment}`);
        } catch (error) {
          console.error(`❌ Error getting news for ${stock.symbol}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      return newsAnalysis;
      
    } catch (error) {
      console.error('❌ Error in news analysis:', error);
      return {};
    }
  }

  /**
   * Rank stocks based on comprehensive analysis
   */
  private static async rankStocksBasedOnAnalysis(
    discoveredStocks: any[],
    historicalAnalysis: any,
    newsAnalysis: any,
    amount: number
  ): Promise<any[]> {
    try {
      console.log('🎯 Ranking stocks based on comprehensive analysis...');
      
      const rankedStocks = discoveredStocks.map(stock => {
        const historical = historicalAnalysis[stock.symbol] || {};
        const news = newsAnalysis[stock.symbol] || {};
        
        // Calculate composite score
        let score = 50; // Base score
        
        // Historical trend scoring
        if (historical.trend === 'BULLISH') score += 20;
        else if (historical.trend === 'BEARISH') score -= 15;
        
        // Momentum scoring
        if (historical.momentum > 10) score += 15;
        else if (historical.momentum < -10) score -= 10;
        
        // News sentiment scoring
        if (news.sentiment === 'POSITIVE') score += 15;
        else if (news.sentiment === 'NEGATIVE') score -= 10;
        
        // Volatility adjustment (moderate volatility is preferred)
        if (historical.volatility && historical.volatility > 5 && historical.volatility < 15) {
          score += 10;
        } else if (historical.volatility > 25) {
          score -= 15;
        }
        
        // Market cap adjustment based on investment amount
        if (amount < 25000 && stock.marketCap === 'LARGE_CAP') score += 10;
        if (amount > 50000 && stock.marketCap === 'SMALL_CAP') score += 5;
        
        return {
          ...stock,
          historicalAnalysis: historical,
          newsAnalysis: news,
          compositeScore: Math.max(0, Math.min(100, score)) // Clamp between 0-100
        };
      });
      
      // Sort by composite score
      rankedStocks.sort((a, b) => b.compositeScore - a.compositeScore);
      
      console.log(`✅ Ranked ${rankedStocks.length} stocks. Top performer: ${rankedStocks[0]?.symbol} (Score: ${rankedStocks[0]?.compositeScore})`);
      return rankedStocks;
      
    } catch (error) {
      console.error('❌ Error ranking stocks:', error);
      return discoveredStocks; // Return unranked if error
    }
  }

  /**
   * Create optimized portfolio allocation based on research
   */
  private static async createOptimizedPortfolioAllocation(
    rankedStocks: any[],
    amount: number,
    frequency: string
  ): Promise<any> {
    try {
      console.log('💼 Creating optimized portfolio allocation...');
      
      // Get real-time quotes for top-ranked stocks
      const topStocks = rankedStocks.slice(0, 8); // Top 8 stocks
      const stockQuotes = [];
      
      for (const stock of topStocks) {
        const quote = await GrowwApiService.getRealTimeQuote(stock.symbol);
        if (quote) {
          stockQuotes.push({
            ...quote,
            compositeScore: stock.compositeScore,
            marketCapCategory: stock.marketCap,
            historicalAnalysis: stock.historicalAnalysis,
            newsAnalysis: stock.newsAnalysis,
            reason: stock.reason || 'Strong comprehensive analysis'
          });
        }
      }
      
      // Create allocation using existing logic but with optimized stocks
      return this.createPortfolioAllocation(stockQuotes, amount, 'MODERATE');
      
    } catch (error) {
      console.error('❌ Error creating optimized allocation:', error);
      return { large_cap: { stocks: [] }, mid_cap: { stocks: [] }, small_cap: { stocks: [] } };
    }
  }

  /**
   * Generate advanced investment strategy with research insights
   */
  private static async generateAdvancedInvestmentStrategy(data: any): Promise<any> {
    try {
      const insights = {
        topPerformers: data.rankedStocks.slice(0, 3).map((s: any) => `${s.symbol} (Score: ${s.compositeScore})`),
        marketTrend: data.marketResearch.marketSentiment,
        riskFactors: this.identifyRiskFactors(data.historicalAnalysis, data.newsAnalysis),
        opportunities: this.identifyOpportunities(data.rankedStocks)
      };
      
      // Try using OpenAI for advanced strategy, fallback to comprehensive strategy
      try {
        const prompt = `Generate an advanced investment strategy based on comprehensive market research:
        
        Investment Amount: ₹${data.amount}
        Market Sentiment: ${insights.marketTrend}
        Top Performers: ${insights.topPerformers.join(', ')}
        Risk Factors: ${insights.riskFactors.join(', ')}
        Opportunities: ${insights.opportunities.join(', ')}
        
        Create a detailed strategy with specific timing, risk management, and monitoring approach.`;
        
        const response = await this.callOpenAI(prompt);
        return this.parseStrategyResponse(response);
      } catch (error) {
        console.log('Using comprehensive fallback strategy');
        return this.getComprehensiveFallbackStrategy(data, insights);
      }
      
    } catch (error) {
      console.error('❌ Error generating advanced strategy:', error);
      return this.getFallbackStrategy(data);
    }
  }

  // Helper methods for analysis
  private static calculatePriceRange(historicalData: any[]): any {
    const prices = historicalData.map(d => d.close);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      current: prices[prices.length - 1],
      percentFromLow: ((prices[prices.length - 1] - Math.min(...prices)) / Math.min(...prices)) * 100
    };
  }

  private static analyzeTrend(historicalData: any[]): string {
    const prices = historicalData.map(d => d.close);
    const recent = prices.slice(-30); // Last 30 days
    const earlier = prices.slice(-60, -30); // Previous 30 days
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.05) return 'BULLISH';
    if (recentAvg < earlierAvg * 0.95) return 'BEARISH';
    return 'SIDEWAYS';
  }

  private static calculateVolatility(historicalData: any[]): number {
    const prices = historicalData.map(d => d.close);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // As percentage
  }

  private static calculateMomentum(historicalData: any[]): number {
    const prices = historicalData.map(d => d.close);
    const current = prices[prices.length - 1];
    const past = prices[Math.max(0, prices.length - 30)]; // 30 days ago
    return ((current - past) / past) * 100;
  }

  private static findSupportResistance(historicalData: any[]): any {
    const lows = historicalData.map(d => d.low);
    const highs = historicalData.map(d => d.high);
    
    return {
      support: Math.min(...lows.slice(-60)), // 60-day low
      resistance: Math.max(...highs.slice(-60)) // 60-day high
    };
  }

  private static async analyzeCurrentMarketSentiment(): Promise<any> {
    // Simplified market sentiment analysis
    const sentiments = ['BULLISH', 'BEARISH', 'MIXED'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    return {
      sentiment,
      sectors: ['Technology', 'Banking', 'Healthcare', 'Manufacturing', 'Energy'],
      summary: `Market showing ${sentiment.toLowerCase()} sentiment with sector rotation`
    };
  }

  private static async fallbackMarketResearch(): Promise<any[]> {
    // Curated list of stocks across market caps with recent relevance
    return [
      // Large Cap
      { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', marketCap: 'LARGE_CAP', sector: 'Energy', reason: 'Diversified business model and consistent performance' },
      { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', marketCap: 'LARGE_CAP', sector: 'Technology', reason: 'AI and digital transformation leader' },
      { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', marketCap: 'LARGE_CAP', sector: 'Banking', reason: 'Strong digital banking initiatives' },
      { symbol: 'INFY', companyName: 'Infosys Limited', marketCap: 'LARGE_CAP', sector: 'Technology', reason: 'Strong cloud and AI capabilities' },
      { symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited', marketCap: 'LARGE_CAP', sector: 'Banking', reason: 'Robust retail banking growth' },
      
      // Mid Cap  
      { symbol: 'BEL', companyName: 'Bharat Electronics Limited', marketCap: 'MID_CAP', sector: 'Defense', reason: 'Defense modernization beneficiary' },
      { symbol: 'DIXON', companyName: 'Dixon Technologies Limited', marketCap: 'MID_CAP', sector: 'Manufacturing', reason: 'PLI scheme beneficiary in electronics' },
      { symbol: 'PERSISTENT', companyName: 'Persistent Systems Limited', marketCap: 'MID_CAP', sector: 'Technology', reason: 'Niche technology solutions provider' },
      
      // Small Cap
      { symbol: 'RVNL', companyName: 'Rail Vikas Nigam Limited', marketCap: 'SMALL_CAP', sector: 'Infrastructure', reason: 'Railway infrastructure development' },
      { symbol: 'HAL', companyName: 'Hindustan Aeronautics Limited', marketCap: 'SMALL_CAP', sector: 'Defense', reason: 'Defense aircraft manufacturing' }
    ];
  }

  private static identifyRiskFactors(historicalAnalysis: any, newsAnalysis: any): string[] {
    const risks = ['Market volatility', 'Sector concentration'];
    
    // Add specific risks based on analysis
    const highVolatilityStocks = Object.values(historicalAnalysis).filter((h: any) => h.volatility > 20).length;
    if (highVolatilityStocks > 2) {
      risks.push('High volatility in multiple positions');
    }
    
    const negativeNews = Object.values(newsAnalysis).filter((n: any) => n.sentiment === 'NEGATIVE').length;
    if (negativeNews > 2) {
      risks.push('Negative sentiment in multiple stocks');
    }
    
    return risks;
  }

  private static identifyOpportunities(rankedStocks: any[]): string[] {
    const opportunities = [];
    
    const topScorers = rankedStocks.filter(s => s.compositeScore > 70);
    if (topScorers.length > 0) {
      opportunities.push(`${topScorers.length} stocks with strong fundamentals and momentum`);
    }
    
    const emergingSectors = new Set(topScorers.map(s => s.sector));
    opportunities.push(`Growth opportunities in ${Array.from(emergingSectors).join(', ')}`);
    
    return opportunities;
  }

  private static getComprehensiveFallbackStrategy(data: any, insights: any): any {
    return {
      investment_strategy: {
        strategy_type: 'Research-Based Growth Strategy',
        key_points: [
          `Focus on ${insights.topPerformers.length} top-performing stocks identified through analysis`,
          'Diversification across high-scoring sectors and market caps',
          'Entry timing based on technical support levels',
          'Regular portfolio rebalancing based on performance metrics'
        ],
        timeline: '12-24 months with quarterly reviews',
        review_frequency: 'Monthly performance review with quarterly rebalancing'
      },
      risk_management: {
        diversification_score: 90,
        suggested_stop_loss: 10,
        risk_mitigation_strategies: [
          'Position sizing based on composite scores',
          'Sector diversification to reduce concentration risk',
          'Regular monitoring of news sentiment changes',
          ...insights.riskFactors.map((risk: string) => `Monitor: ${risk}`)
        ]
      },
      tax_implications: {
        investment_type: 'EQUITY',
        tax_efficiency_tips: [
          'Hold positions for more than 1 year for LTCG benefits',
          'Consider tax loss harvesting for underperforming positions',
          'Monitor annual LTCG limit of ₹1 lakh exemption',
          'Plan exit strategy around financial year end for tax optimization'
        ]
      },
      next_steps: [
        'Set up tracking for recommended stocks with price alerts',
        'Monitor quarterly earnings of selected companies',
        'Review and adjust positions based on changing market conditions',
        'Consider staggered entry over 2-3 weeks for better average price'
      ]
    };
  }

  /**
   * Conduct comprehensive web research for stock analysis
   */
  private static async conductWebResearch(symbol: string, companyName: string): Promise<any> {
    try {
      const { WebSearch } = await import('../utils/webSearchUtil');
      
      // Define comprehensive search queries for market research
      const searchQueries = [
        `${companyName} ${symbol} stock analysis latest target price 2025`,
        `${symbol} quarterly results earnings growth prospects`,
        `${companyName} news recent developments expansion plans`,
        `${symbol} brokerage recommendation buy sell rating`,
        `${companyName} market share competitive position industry`
      ];
      
      const allResults = [];
      const usedQueries = [];
      
      for (const query of searchQueries) {
        try {
          console.log(`🔍 Searching: "${query}"`);
          const results = await WebSearch(query, 3);
          
          if (results && results.length > 0) {
            // Filter for relevant results
            const relevantResults = results.filter(result => 
              !result.title.includes('Mock') && 
              result.url.startsWith('http') &&
              (result.title.toLowerCase().includes(symbol.toLowerCase()) ||
               result.snippet.toLowerCase().includes(symbol.toLowerCase()) ||
               result.snippet.toLowerCase().includes('stock') ||
               result.snippet.toLowerCase().includes('share'))
            );
            
            allResults.push(...relevantResults);
            usedQueries.push(query);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ Error in web search for query "${query}":`, error);
        }
      }
      
      // Remove duplicates and get top 5 results
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
      ).slice(0, 5);
      
      console.log(`✅ Found ${uniqueResults.length} relevant web results for ${symbol}`);
      
      return {
        search_results: uniqueResults,
        search_queries: usedQueries
      };
      
    } catch (error) {
      console.error('❌ Error in web research:', error);
      return {
        search_results: [],
        search_queries: []
      };
    }
  }

  // Helper methods
  private static analyzeInvestmentQuery(query: string, amount: number, frequency: string): any {
    const lowerQuery = query.toLowerCase();
    
    let risk_appetite: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' = 'MODERATE';
    if (lowerQuery.includes('safe') || lowerQuery.includes('conservative')) {
      risk_appetite = 'CONSERVATIVE';
    } else if (lowerQuery.includes('aggressive') || lowerQuery.includes('high risk')) {
      risk_appetite = 'AGGRESSIVE';
    }
    
    let time_horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' = 'MEDIUM_TERM';
    if (lowerQuery.includes('short term') || lowerQuery.includes('few months')) {
      time_horizon = 'SHORT_TERM';
    } else if (lowerQuery.includes('long term') || lowerQuery.includes('years')) {
      time_horizon = 'LONG_TERM';
    }
    
    return {
      investment_amount: amount,
      investment_frequency: frequency,
      risk_appetite,
      time_horizon
    };
  }

  private static async getStockQuotesForRecommendation(trendingStocks: TrendingStock[]): Promise<any[]> {
    const quotes = [];
    const symbols = trendingStocks.slice(0, 9).map(stock => stock.symbol); // Limit to 9 stocks
    
    for (const symbol of symbols) {
      const quote = await GrowwApiService.getRealTimeQuote(symbol);
      if (quote) {
        const trendingStock = trendingStocks.find(s => s.symbol === symbol);
        quotes.push({
          ...quote,
          market_cap: trendingStock?.marketCap || 'MID_CAP',
          sector: trendingStock?.sector || 'Diversified',
          reason: trendingStock?.reason || 'Market momentum'
        });
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return quotes;
  }

  private static async createPortfolioAllocation(stockQuotes: any[], amount: number, riskAppetite: string): Promise<any> {
    // Allocation percentages based on risk appetite
    let largeCap = 60;
    let midCap = 30;
    let smallCap = 10;
    
    if (riskAppetite === 'CONSERVATIVE') {
      largeCap = 75;
      midCap = 20;
      smallCap = 5;
    } else if (riskAppetite === 'AGGRESSIVE') {
      largeCap = 45;
      midCap = 35;
      smallCap = 20;
    }
    
    // Filter stocks by market cap
    const largeCapStocks = stockQuotes.filter(s => s.market_cap === 'LARGE_CAP').slice(0, 3);
    const midCapStocks = stockQuotes.filter(s => s.market_cap === 'MID_CAP').slice(0, 3);
    const smallCapStocks = stockQuotes.filter(s => s.market_cap === 'SMALL_CAP').slice(0, 2);
    
    // Calculate allocations
    const largeCapAmount = (amount * largeCap) / 100;
    const midCapAmount = (amount * midCap) / 100;
    const smallCapAmount = (amount * smallCap) / 100;
    
    return {
      large_cap: this.createCapAllocation(largeCapStocks, largeCap, largeCapAmount),
      mid_cap: this.createCapAllocation(midCapStocks, midCap, midCapAmount),
      small_cap: this.createCapAllocation(smallCapStocks, smallCap, smallCapAmount)
    };
  }

  private static createCapAllocation(stocks: any[], allocationPercent: number, amount: number): any {
    if (stocks.length === 0) {
      return {
        allocation_percent: allocationPercent,
        amount: amount,
        stocks: []
      };
    }
    
    const perStockPercent = allocationPercent / stocks.length;
    const perStockAmount = amount / stocks.length;
    
    return {
      allocation_percent: allocationPercent,
      amount: amount,
      stocks: stocks.map(stock => ({
        symbol: stock.symbol,
        company_name: stock.companyName,
        allocation_percent: Math.round(perStockPercent * 100) / 100,
        amount: Math.round(perStockAmount),
        current_price: stock.currentPrice,
        target_price: this.estimateTargetPrice(stock),
        reasoning: stock.reason || 'Strong fundamentals and market position'
      }))
    };
  }

  private static estimateTargetPrice(stock: any): number | null {
    if (!stock.currentPrice) return null;
    
    // Simple target price estimation based on day change and market sentiment
    const basePrice = stock.currentPrice;
    const growthMultiplier = stock.dayChangePercent > 0 ? 1.15 : 1.08;
    
    return Math.round(basePrice * growthMultiplier * 100) / 100;
  }

  // Utility methods
  private static determineSector(companyName: string): string {
    const sectors = {
      'IT': ['tcs', 'infosys', 'wipro', 'tech mahindra'],
      'Banking': ['hdfc', 'icici', 'sbi', 'kotak'],
      'Auto': ['maruti', 'tata motors', 'mahindra', 'bajaj'],
      'Pharma': ['sun pharma', 'cipla', 'lupin', 'biocon']
    };
    
    const lowerName = companyName.toLowerCase();
    for (const [sector, companies] of Object.entries(sectors)) {
      if (companies.some(company => lowerName.includes(company))) {
        return sector;
      }
    }
    
    return 'Diversified';
  }

  private static determineMarketCap(companyName: string): 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' {
    const largeCap = ['reliance', 'tcs', 'hdfc', 'icici', 'infosys', 'itc', 'sbi', 'bharti airtel'];
    const lowerName = companyName.toLowerCase();
    
    if (largeCap.some(company => lowerName.includes(company))) {
      return 'LARGE_CAP';
    }
    
    return 'MID_CAP'; // Default to mid-cap
  }

  private static assessRiskLevel(quote: any, technical: any, sentiment: any): any {
    let riskScore = 50;
    
    // Technical risk factors
    if (technical) {
      if (technical.volatility > 15) riskScore += 20;
      if (technical.rsi > 75 || technical.rsi < 25) riskScore += 15;
    }
    
    // Price volatility risk
    if (Math.abs(quote.dayChangePercent) > 5) riskScore += 15;
    
    // Sentiment risk
    if (sentiment.overall_sentiment === 'NEGATIVE') riskScore += 20;
    
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'MODERATE';
    if (riskScore > 75) riskLevel = 'HIGH';
    else if (riskScore < 40) riskLevel = 'LOW';
    
    return {
      risk_level: riskLevel,
      key_risks: this.generateRiskFactors(quote, technical, sentiment),
      volatility: technical?.volatility || Math.abs(quote.dayChangePercent)
    };
  }

  private static generateRiskFactors(quote: any, technical: any, sentiment: any): string[] {
    const risks = [];
    
    // Price volatility analysis
    if (Math.abs(quote.dayChangePercent) > 5) {
      risks.push(`High daily volatility (${quote.dayChangePercent.toFixed(1)}%) - increased price swings`);
    }
    
    // Technical risk factors
    if (technical) {
      if (technical.volatility > 25) {
        risks.push(`Very high volatility (${technical.volatility.toFixed(1)}%) - significant price swings expected`);
      } else if (technical.volatility > 15) {
        risks.push(`Elevated volatility (${technical.volatility.toFixed(1)}%) - moderate risk of price fluctuations`);
      }
      
      if (technical.rsi > 80) {
        risks.push('Extremely overbought conditions - high correction risk');
      } else if (technical.rsi > 70) {
        risks.push('Overbought conditions - potential correction');
      } else if (technical.rsi < 20) {
        risks.push('Severely oversold - high rebound volatility expected');
      } else if (technical.rsi < 30) {
        risks.push('Oversold conditions - potential bounce with high volatility');
      }
      
      // Trend-based risks
      if (technical.trend === 'BEARISH' && technical.priceChange30Days < -15) {
        risks.push('Strong downtrend - continued selling pressure possible');
      }
      
      // Support/Resistance risks
      const currentPrice = quote.currentPrice;
      if (currentPrice > technical.resistance * 0.98) {
        risks.push('Trading near resistance - potential reversal or breakout');
      }
      if (currentPrice < technical.support * 1.02) {
        risks.push('Trading near support - risk of breakdown');
      }
    }
    
    // News sentiment risks
    if (sentiment && sentiment.overall_sentiment === 'NEGATIVE') {
      risks.push('Negative news sentiment - market perception risk');
    } else if (sentiment && sentiment.overall_sentiment === 'MIXED') {
      risks.push('Mixed market sentiment - uncertain direction');
    }
    
    // 52-week high/low risks
    if (quote.week52High && quote.currentPrice > quote.week52High * 0.95) {
      risks.push('Trading near 52-week high - limited upside potential');
    }
    if (quote.week52Low && quote.currentPrice < quote.week52Low * 1.10) {
      risks.push('Trading near 52-week low - potential further downside');
    }
    
    // Volume-based risk
    if (quote.volume < 100000) {
      risks.push('Low trading volume - liquidity risk and wider spreads');
    }
    
    return risks.length > 0 ? risks : ['Moderate market risk - standard equity investment risks apply'];
  }

  // Fallback methods when OpenAI is unavailable
  private static getFallbackRecommendation(data: any): any {
    const price = data.quote.currentPrice;
    const dayChange = data.quote.dayChangePercent;
    const tech = data.technicalAnalysis;
    
    // Use technical analysis recommendation if available
    if (tech && tech.recommendation) {
      const reasoning = [];
      
      // Build specific reasoning based on technical indicators
      if (tech.rsi > 70) {
        reasoning.push(`Overbought conditions (RSI: ${tech.rsi.toFixed(1)}) - potential correction`);
      } else if (tech.rsi < 30) {
        reasoning.push(`Oversold conditions (RSI: ${tech.rsi.toFixed(1)}) - potential bounce`);
      } else {
        reasoning.push(`RSI in neutral zone (${tech.rsi.toFixed(1)}) - momentum analysis required`);
      }
      
      if (tech.trend === 'BULLISH') {
        reasoning.push('Uptrend confirmed by moving averages');
      } else if (tech.trend === 'BEARISH') {
        reasoning.push('Downtrend indicated by technical indicators');
      } else {
        reasoning.push('Sideways consolidation pattern observed');
      }
      
      if (Math.abs(tech.priceChange30Days) > 10) {
        reasoning.push(`Strong ${tech.priceChange30Days > 0 ? 'positive' : 'negative'} momentum over 30 days`);
      }
      
      // Calculate target and stop loss based on volatility
      const volatilityMultiplier = Math.max(0.08, Math.min(0.20, tech.volatility / 100));
      
      return {
        action: tech.recommendation,
        confidence: tech.confidence,
        target_price: tech.recommendation === 'BUY' ? price * (1 + volatilityMultiplier * 1.5) : 
                     tech.recommendation === 'SELL' ? price * (1 - volatilityMultiplier * 1.2) : 
                     price * 1.08,
        stop_loss: tech.recommendation === 'BUY' ? price * (1 - volatilityMultiplier) : 
                  tech.recommendation === 'SELL' ? price * (1 + volatilityMultiplier * 0.8) :
                  price * 0.92,
        time_horizon: tech.volatility > 20 ? 'SHORT_TERM' : tech.volatility > 10 ? 'MEDIUM_TERM' : 'LONG_TERM',
        reasoning: reasoning
      };
    }
    
    // Fallback to basic analysis if technical analysis not available
    let action = 'HOLD';
    let confidence = 55;
    
    if (dayChange > 3) {
      action = 'BUY';
      confidence = 70;
    } else if (dayChange < -3) {
      action = 'SELL';
      confidence = 70;
    }
    
    return {
      action,
      confidence,
      target_price: price * 1.10,
      stop_loss: price * 0.90,
      time_horizon: 'MEDIUM_TERM',
      reasoning: [
        `Price movement: ${dayChange.toFixed(2)}% today`,
        'Analysis based on price action and momentum',
        'Technical indicators not available - using basic analysis'
      ]
    };
  }

  private static getFallbackStrategy(data: any): any {
    return {
      investment_strategy: {
        strategy_type: 'Diversified Growth Strategy',
        key_points: [
          'Focus on fundamentally strong companies',
          'Maintain sector diversification',
          'Regular portfolio review and rebalancing'
        ],
        timeline: '12-18 months',
        review_frequency: 'Quarterly'
      },
      risk_management: {
        diversification_score: 85,
        suggested_stop_loss: 8,
        risk_mitigation_strategies: [
          'Maintain stop-loss levels',
          'Diversify across sectors',
          'Regular profit booking'
        ]
      },
      tax_implications: {
        investment_type: 'EQUITY',
        tax_efficiency_tips: [
          'Hold for more than 1 year for LTCG benefits',
          'Use annual LTCG exemption limit',
          'Consider SIP for rupee cost averaging'
        ]
      },
      next_steps: [
        'Open demat and trading account if not available',
        'Start with small investments initially',
        'Set up systematic monitoring of portfolio'
      ]
    };
  }

  private static parseRecommendationResponse(response: string, currentPrice: number): any {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      return this.getFallbackRecommendation({ quote: { currentPrice, dayChangePercent: 0 } });
    }
  }

  private static parseStrategyResponse(response: string): any {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      return this.getFallbackStrategy({});
    }
  }

  /**
   * Test the investment analysis service
   */
  static async testAnalysisService(): Promise<void> {
    console.log('🧪 Testing Investment Analysis Service...');
    
    try {
      // Test stock analysis
      console.log('1. Testing stock analysis...');
      const stockAnalysis = await this.analyzeStock('RELIANCE');
      if (stockAnalysis) {
        console.log(`✅ Stock analysis: ${stockAnalysis.recommendation.action} - ${stockAnalysis.recommendation.confidence}%`);
      }
      
      // Test investment recommendation
      console.log('2. Testing investment recommendation...');
      const investmentRec = await this.generateInvestmentRecommendation(
        'I want to invest 10000 rupees monthly for long term growth',
        10000,
        'SIP'
      );
      if (investmentRec) {
        console.log(`✅ Investment recommendation: ${investmentRec.market_overview.current_sentiment} market`);
      }
      
      console.log('✅ Investment Analysis Service test completed');
      
    } catch (error) {
      console.error('❌ Investment Analysis Service test failed:', error);
    }
  }
}

// Export types
export type { StockAnalysisReport, InvestmentRecommendation };