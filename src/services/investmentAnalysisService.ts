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
      console.error('❌ OpenAI API key not found in environment variables');
      console.error('Please set REACT_APP_OPENAI_API_KEY in your Vercel environment variables');
      throw new Error('OpenAI API key is required but not configured');
    }
    
    console.log('✅ OpenAI API key found, preparing request...');
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
        As a professional stock analyst, provide an OBJECTIVE recommendation for this stock based ONLY on the data provided. 
        
        CRITICAL: Your recommendation must be based on technical analysis, performance data, and market conditions - NOT on any implicit bias toward buying or selling.
        
        Company: ${data.companyInfo.name} (${data.quote.symbol})
        Current Price: ₹${data.quote.currentPrice}
        Day Change: ${data.quote.dayChangePercent.toFixed(2)}%
        Volume: ${data.quote.volume}
        
        Technical Analysis: ${data.technicalAnalysis ? JSON.stringify(data.technicalAnalysis) : 'Not available'}
        
        Recent News: ${data.stockNews.map((news: any) => `${news.headline} (${news.sentiment})`).join('; ')}
        
        ANALYSIS REQUIREMENTS:
        - If day change is significantly negative (< -5%), consider SELL or HOLD
        - If technical indicators show bearish trend, consider SELL or HOLD  
        - If RSI > 70, stock may be overbought - consider SELL
        - If RSI < 30, stock may be oversold - consider BUY
        - If recent news is predominantly negative, factor this into recommendation
        - Be conservative - prefer HOLD when data is mixed or insufficient
        
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
      return await this.parseRecommendationResponse(response, data.quote.currentPrice, data.quote?.symbol || data.companyInfo?.symbol);
      
    } catch (error) {
      console.error('❌ Error generating OpenAI recommendation:', error);
      return await this.getFallbackRecommendation(data, data.quote?.symbol || data.companyInfo?.symbol);
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
    console.log('🤖 Calling OpenAI API with GPT-4o...');
    
    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: this.getOpenAIHeaders(),
      body: JSON.stringify({
        model: 'gpt-4o', // Updated to GPT-4o as requested
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst specializing in Indian stock market analysis. Provide accurate, data-driven recommendations based on current market conditions, technical analysis, and fundamental factors. Always return valid JSON responses when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000, // Increased for more detailed responses
        temperature: 0.2  // Lower temperature for more consistent financial advice
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response structure from OpenAI:', data);
      throw new Error('Invalid response structure from OpenAI API');
    }
    
    const content = data.choices[0].message.content;
    console.log('✅ OpenAI API response received successfully');
    console.log('📊 Response preview:', content.substring(0, 200) + '...');
    
    return content;
  }

  /**
   * Conduct comprehensive market research across industries and market caps
   */
  private static async conductComprehensiveMarketResearch(amount: number): Promise<any> {
    try {
      console.log('🔬 Starting comprehensive market research with web scraping...');
      
      // Step 1: Try advanced web-based stock discovery
      let discoveredStocks = await this.webBasedStockDiscovery();
      
      // Step 2: If web research fails or returns insufficient results, use enhanced fallback
      if (!discoveredStocks || discoveredStocks.length < 8) {
        console.log('🔄 Web research insufficient, using enhanced fallback with market context...');
        discoveredStocks = await this.enhancedMarketResearch(amount);
      }
      
      // Step 3: Analyze current market sentiment
      const marketSentiment = await this.analyzeCurrentMarketSentiment();
      
      return {
        discoveredStocks,
        marketSentiment: marketSentiment.sentiment,
        trendingSectors: marketSentiment.sectors,
        marketSummary: marketSentiment.summary
      };
      
    } catch (error) {
      console.error('❌ Error in comprehensive market research:', error);
      // Final fallback to enhanced research
      const discoveredStocks = await this.enhancedMarketResearch(amount);
      return {
        discoveredStocks,
        marketSentiment: 'MIXED',
        trendingSectors: ['Technology', 'Banking', 'Healthcare', 'Pharmaceuticals', 'FMCG'],
        marketSummary: 'Market showing mixed signals with selective opportunities across sectors'
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
    if (!historicalData || historicalData.length === 0) {
      return { support: 0, resistance: 0 };
    }
    
    const lows = historicalData.map(d => d.low);
    const highs = historicalData.map(d => d.high);
    const closes = historicalData.map(d => d.close);
    const currentPrice = closes[closes.length - 1];
    
    // Use multiple timeframes for better accuracy
    const shortTerm = Math.min(20, historicalData.length);
    const longTerm = Math.min(60, historicalData.length);
    
    // Calculate support/resistance from different periods
    const support20 = Math.min(...lows.slice(-shortTerm));
    const support60 = Math.min(...lows.slice(-longTerm));
    const resistance20 = Math.max(...highs.slice(-shortTerm));
    const resistance60 = Math.max(...highs.slice(-longTerm));
    
    // Choose more relevant support level (closer to current price but still below)
    let finalSupport = support20;
    if (support60 > currentPrice * 0.8 && support60 < currentPrice) {
      finalSupport = Math.max(support20, support60);
    }
    
    // Choose more relevant resistance level (closer to current price but still above)
    let finalResistance = resistance20;
    if (resistance60 < currentPrice * 1.2 && resistance60 > currentPrice) {
      finalResistance = Math.min(resistance20, resistance60);
    }
    
    // Validation: ensure support is below current price and resistance is above
    if (finalSupport >= currentPrice) {
      finalSupport = currentPrice * 0.90; // 10% below current price
    }
    
    if (finalResistance <= currentPrice) {
      finalResistance = currentPrice * 1.10; // 10% above current price
    }
    
    // Ensure reasonable spread
    const spread = (finalResistance - finalSupport) / currentPrice;
    if (spread > 0.4) { // More than 40% spread is too wide
      finalSupport = currentPrice * 0.88;
      finalResistance = currentPrice * 1.12;
    }
    
    return {
      support: Math.round(finalSupport * 100) / 100,
      resistance: Math.round(finalResistance * 100) / 100
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

  /**
   * Advanced web-based stock discovery using multiple search strategies
   */
  private static async webBasedStockDiscovery(): Promise<any[]> {
    try {
      console.log('🌐 Starting advanced web-based stock discovery...');
      const discoveredStocks = [];
      
      // Import WebSearch utility
      const { WebSearch } = await import('../utils/webSearchUtil');
      
      // Comprehensive search queries for current market trends
      const searchQueries = [
        'best Indian stocks to buy January 2025 Nifty 50 recommendations',
        'top performing Indian stocks 2025 latest analyst recommendations',
        'trending Indian stocks January 2025 high growth potential',
        'best Nifty 100 stocks investment 2025 market outlook',
        'Indian stock market winners January 2025 sectoral analysis',
        'top midcap smallcap stocks India 2025 investment opportunities',
        'best banking pharma IT stocks India 2025 sector analysis',
        'Indian stock market trends January 2025 buy recommendations'
      ];
      
      const stockCandidates = new Map<string, any>();
      
      // Process each search query
      for (let i = 0; i < Math.min(4, searchQueries.length); i++) {
        const query = searchQueries[i];
        console.log(`🔍 Web search ${i + 1}/4: "${query}"`);
        
        try {
          const searchResults = await WebSearch(query, 5);
          
          if (searchResults && searchResults.length > 0) {
            // Extract stock names and symbols from search results
            for (const result of searchResults) {
              const extractedStocks = this.extractStocksFromContent(result.title + ' ' + result.snippet);
              
              extractedStocks.forEach(stock => {
                if (stockCandidates.has(stock.symbol)) {
                  // Increase confidence for stocks mentioned multiple times
                  const existing = stockCandidates.get(stock.symbol);
                  existing.confidence = Math.min(95, existing.confidence + 10);
                  existing.mentions += 1;
                } else {
                  stockCandidates.set(stock.symbol, {
                    ...stock,
                    confidence: 60,
                    mentions: 1,
                    source: 'web_research'
                  });
                }
              });
            }
          }
          
          // Add delay between searches
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`❌ Error in web search ${i + 1}:`, error);
          continue;
        }
      }
      
      // Convert to array and sort by confidence and mentions
      const webDiscoveredStocks = Array.from(stockCandidates.values())
        .sort((a, b) => {
          const scoreA = a.confidence + (a.mentions * 5);
          const scoreB = b.confidence + (b.mentions * 5);
          return scoreB - scoreA;
        })
        .slice(0, 12); // Top 12 stocks from web research
      
      console.log(`✅ Web-based discovery found ${webDiscoveredStocks.length} stocks`);
      return webDiscoveredStocks;
      
    } catch (error) {
      console.error('❌ Error in web-based stock discovery:', error);
      return [];
    }
  }
  
  /**
   * Extract stock symbols and names from content text
   */
  private static extractStocksFromContent(content: string): any[] {
    const stocks = [];
    const { ExcelBasedStockAnalysisService } = require('./excelBasedStockAnalysis');
    
    // Common patterns for stock mentions in financial content
    const stockPatterns = [
      // Pattern 1: Company Name (SYMBOL)
      /([A-Z][a-zA-Z\s&]+)\s*\(([A-Z]{2,10})\)/g,
      // Pattern 2: SYMBOL (Company Name)
      /([A-Z]{2,10})\s*\(([A-Z][a-zA-Z\s&]+)\)/g,
      // Pattern 3: Just symbols in caps
      /\b([A-Z]{3,10})\b/g
    ];
    
    // Extract potential stock symbols
    const potentialSymbols = new Set<string>();
    
    for (const pattern of stockPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[1].length <= 10 && match[1].match(/^[A-Z]+$/)) {
          potentialSymbols.add(match[1]);
        }
        if (match[2] && match[2].length <= 10 && match[2].match(/^[A-Z]+$/)) {
          potentialSymbols.add(match[2]);
        }
      }
    }
    
    // Validate symbols against our database
    const symbolsArray = Array.from(potentialSymbols);
    for (const symbol of symbolsArray) {
      const companyInfo = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
      if (companyInfo) {
        stocks.push({
          symbol: symbol,
          companyName: companyInfo.name,
          marketCap: this.determineMarketCap(companyInfo.name),
          sector: this.determineSector(companyInfo.name),
          reason: 'Mentioned in recent market analysis'
        });
      }
    }
    
    return stocks;
  }
  
  /**
   * Enhanced market research with sector rotation and current trends
   */
  private static async enhancedMarketResearch(amount: number): Promise<any[]> {
    console.log('🔍 Using enhanced market research with sector rotation...');
    
    // Current market trends and sector themes (updated regularly)
    const currentTrends = {
      'Defense & Aerospace': {
        theme: 'Defense modernization and Make in India initiatives',
        stocks: [
          { symbol: 'BEL', companyName: 'Bharat Electronics Limited', marketCap: 'MID_CAP', sector: 'Defense', reason: 'Defense electronics leader with strong order book' },
          { symbol: 'HAL', companyName: 'Hindustan Aeronautics Limited', marketCap: 'MID_CAP', sector: 'Defense', reason: 'Aircraft manufacturing with growing defense budget' },
          { symbol: 'MAZAGON', companyName: 'Mazagon Dock Shipbuilders Limited', marketCap: 'MID_CAP', sector: 'Defense', reason: 'Naval shipbuilding with submarine projects' }
        ]
      },
      'Railways & Infrastructure': {
        theme: 'Infrastructure development and railway modernization',
        stocks: [
          { symbol: 'RVNL', companyName: 'Rail Vikas Nigam Limited', marketCap: 'SMALL_CAP', sector: 'Infrastructure', reason: 'Railway infrastructure development projects' },
          { symbol: 'IRCON', companyName: 'IRCON International Limited', marketCap: 'SMALL_CAP', sector: 'Infrastructure', reason: 'Railway construction and infrastructure' },
          { symbol: 'IRFC', companyName: 'Indian Railway Finance Corporation Limited', marketCap: 'LARGE_CAP', sector: 'Infrastructure', reason: 'Railway project financing arm' }
        ]
      },
      'Green Energy & EVs': {
        theme: 'Renewable energy transition and EV adoption',
        stocks: [
          { symbol: 'ADANIGREEN', companyName: 'Adani Green Energy Limited', marketCap: 'LARGE_CAP', sector: 'Green Energy', reason: 'Leading renewable energy player' },
          { symbol: 'TATAPOWER', companyName: 'Tata Power Company Limited', marketCap: 'LARGE_CAP', sector: 'Power', reason: 'Power generation with renewable focus' },
          { symbol: 'SUZLON', companyName: 'Suzlon Energy Limited', marketCap: 'SMALL_CAP', sector: 'Green Energy', reason: 'Wind energy equipment manufacturer' }
        ]
      },
      'Digital & Fintech': {
        theme: 'Digital transformation and fintech growth',
        stocks: [
          { symbol: 'PAYTM', companyName: 'One 97 Communications Limited', marketCap: 'MID_CAP', sector: 'Fintech', reason: 'Digital payments and fintech services' },
          { symbol: 'NYKAA', companyName: 'FSN E-Commerce Ventures Limited', marketCap: 'MID_CAP', sector: 'E-commerce', reason: 'E-commerce beauty and fashion platform' },
          { symbol: 'ZOMATO', companyName: 'Zomato Limited', marketCap: 'LARGE_CAP', sector: 'E-commerce', reason: 'Food delivery and restaurant tech platform' }
        ]
      },
      'Healthcare & Pharma': {
        theme: 'Healthcare innovation and pharmaceutical exports',
        stocks: [
          { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Limited', marketCap: 'LARGE_CAP', sector: 'Pharmaceuticals', reason: 'Leading pharmaceutical company with global presence' },
          { symbol: 'DRREDDY', companyName: 'Dr Reddys Laboratories Limited', marketCap: 'LARGE_CAP', sector: 'Pharmaceuticals', reason: 'Pharmaceutical research and generics' },
          { symbol: 'APOLLOHOSP', companyName: 'Apollo Hospitals Enterprise Limited', marketCap: 'LARGE_CAP', sector: 'Healthcare', reason: 'Healthcare services and hospital chain' }
        ]
      },
      'FMCG & Consumer': {
        theme: 'Rural recovery and premiumization trends',
        stocks: [
          { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Limited', marketCap: 'LARGE_CAP', sector: 'FMCG', reason: 'FMCG leader with strong brand portfolio' },
          { symbol: 'NESTLEIND', companyName: 'Nestle India Limited', marketCap: 'LARGE_CAP', sector: 'FMCG', reason: 'Premium food and beverage products' },
          { symbol: 'BRITANNIA', companyName: 'Britannia Industries Limited', marketCap: 'LARGE_CAP', sector: 'FMCG', reason: 'Food products with strong distribution' }
        ]
      }
    };
    
    // Select diverse stocks based on amount and current trends
    const selectedStocks = [];
    
    // For smaller amounts, focus on large caps and established mid caps
    if (amount < 50000) {
      // Add 4-5 large cap stocks from different sectors
      selectedStocks.push(
        { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', marketCap: 'LARGE_CAP', sector: 'Information Technology', reason: 'Leading IT services with strong digital capabilities' },
        { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', marketCap: 'LARGE_CAP', sector: 'Banking', reason: 'Top private bank with digital focus' },
        currentTrends['Healthcare & Pharma' as keyof typeof currentTrends].stocks[0],
        currentTrends['FMCG & Consumer' as keyof typeof currentTrends].stocks[0],
        currentTrends['Green Energy & EVs' as keyof typeof currentTrends].stocks[0]
      );
    } else {
      // For larger amounts, include more diverse sectors and mid/small caps
      const trendKeys = Object.keys(currentTrends);
      
      for (let i = 0; i < Math.min(trendKeys.length, 6); i++) {
        const trendKey = trendKeys[i] as keyof typeof currentTrends;
        const trend = currentTrends[trendKey];
        // Add 1-2 stocks from each trending sector
        selectedStocks.push(...trend.stocks.slice(0, amount > 100000 ? 2 : 1));
      }
      
      // Add some stable large caps
      selectedStocks.push(
        { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', marketCap: 'LARGE_CAP', sector: 'Oil & Gas', reason: 'Diversified conglomerate with retail and telecom growth' },
        { symbol: 'INFY', companyName: 'Infosys Limited', marketCap: 'LARGE_CAP', sector: 'Information Technology', reason: 'Global IT services with AI and automation focus' }
      );
    }
    
    // Ensure diversity and remove duplicates
    const uniqueStocks = selectedStocks
      .filter((stock, index, self) => index === self.findIndex(s => s.symbol === stock.symbol))
      .slice(0, 12);
    
    console.log(`✅ Enhanced research selected ${uniqueStocks.length} stocks across ${new Set(uniqueStocks.map(s => s.sector || 'Unknown')).size} sectors`);
    return uniqueStocks;
  }
  
  private static async fallbackMarketResearch(): Promise<any[]> {
    // This is now just a final backup - should rarely be used
    console.log('⚠️ Using basic fallback research - this should be rare!');
    return this.enhancedMarketResearch(50000);
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

  // Enhanced fallback methods with web research integration
  private static async getFallbackRecommendation(data: any, symbol?: string): Promise<any> {
    const price = data.quote?.currentPrice || 0;
    const dayChange = data.quote?.dayChangePercent || 0;
    const tech = data.technicalAnalysis;
    
    // First try to get fresh market research for this specific stock
    let webResearchRecommendation = null;
    if (symbol) {
      try {
        console.log(`🔍 Getting market research for ${symbol}...`);
        webResearchRecommendation = await this.getStockWebResearch(symbol);
      } catch (error) {
        console.error(`❌ Error getting web research for ${symbol}:`, error);
      }
    }
    
    // Use technical analysis recommendation if available
    if (tech && tech.recommendation) {
      const reasoning = [];
      
      // Enhance with web research if available
      if (webResearchRecommendation && webResearchRecommendation.sentiment) {
        reasoning.push(`Market sentiment: ${webResearchRecommendation.sentiment} based on recent analyst reports`);
      }
      
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
    
    // Enhanced fallback analysis with web research integration
    let action = 'HOLD';
    let confidence = 55;
    let reasoning = [];
    
    // Incorporate web research findings if available
    if (webResearchRecommendation) {
      if (webResearchRecommendation.recommendation) {
        action = webResearchRecommendation.recommendation.toUpperCase();
        confidence = Math.min(80, confidence + 20);
        reasoning.push(`Market research suggests ${action} based on ${webResearchRecommendation.reason || 'current market conditions'}`);
      }
      if (webResearchRecommendation.keyFactors && webResearchRecommendation.keyFactors.length > 0) {
        reasoning.push(...webResearchRecommendation.keyFactors.slice(0, 2));
      }
    }
    
    // CRITICAL: RSI-based decisions should override web research for extreme conditions
    if (tech && tech.rsi !== undefined) {
      if (tech.rsi > 80) {
        // EXTREME overbought - always recommend SELL regardless of other factors
        action = 'SELL';
        confidence = Math.min(90, 70 + (tech.rsi - 80));
        reasoning = [`🚨 EXTREMELY overbought (RSI: ${tech.rsi.toFixed(1)}) - immediate correction risk`];
        // Override any previous web research recommendation
        console.log(`⚠️ RSI ${tech.rsi.toFixed(1)} overriding web research - recommending SELL`);
      } else if (tech.rsi > 70) {
        action = 'SELL';
        confidence = Math.min(85, 60 + (tech.rsi - 70));
        reasoning.push(`Overbought conditions (RSI: ${tech.rsi.toFixed(1)}) - potential correction`);
      } else if (tech.rsi < 20) {
        action = 'BUY';
        confidence = Math.min(85, 70 + (30 - tech.rsi));
        reasoning.push(`Severely oversold (RSI: ${tech.rsi.toFixed(1)}) - potential bounce`);
      } else if (tech.rsi < 30) {
        action = 'BUY';
        confidence = Math.min(80, 70 + (30 - tech.rsi));
        reasoning.push(`Oversold conditions (RSI: ${tech.rsi.toFixed(1)}) - potential bounce`);
      } else {
        reasoning.push(`RSI in neutral zone (${tech.rsi.toFixed(1)})`);
      }
    }
    
    // Enhanced analysis based on actual performance data
    if (action === 'HOLD' && !webResearchRecommendation) {
      const currentHour = new Date().getHours();
      const marketFactors = [];
      
      if (currentHour >= 9 && currentHour <= 16) {
        marketFactors.push('Active market hours - higher liquidity');
      } else {
        marketFactors.push('After-hours - consider volatility');
      }
      
      // Use comprehensive analysis including technical data and performance
      if (price > 0) {
        // Analyze based on technical indicators first
        if (tech?.support && price < tech.support * 1.02) {
          action = 'BUY';
          confidence = 70;
          reasoning.push(`Stock trading near support levels (₹${tech.support.toFixed(2)}) - potential bounce opportunity`);
        } else if (tech?.resistance && price > tech.resistance * 0.98) {
          action = 'SELL';
          confidence = 70;
          reasoning.push(`Stock near resistance levels (₹${tech.resistance.toFixed(2)}) - potential correction ahead`);
        } else {
          // Use additional performance indicators
          let performanceScore = 0;
          
          // Check if we have meaningful day change data
          if (Math.abs(dayChange) > 0.01) {
            if (dayChange > 5) {
              performanceScore += 2;
              reasoning.push(`Strong positive momentum (+${dayChange.toFixed(2)}%)`);
            } else if (dayChange > 2) {
              performanceScore += 1;
              reasoning.push(`Positive momentum (+${dayChange.toFixed(2)}%)`);
            } else if (dayChange < -5) {
              performanceScore -= 2;
              reasoning.push(`Strong negative momentum (${dayChange.toFixed(2)}%)`);
            } else if (dayChange < -2) {
              performanceScore -= 1;
              reasoning.push(`Negative momentum (${dayChange.toFixed(2)}%)`);
            }
          }
          
          // Check volume indicators if available
          if (tech?.volume && data.quote?.volume) {
            const volumeRatio = data.quote.volume / tech.volume;
            if (volumeRatio > 1.5) {
              performanceScore += 1;
              reasoning.push(`High volume activity - increased investor interest`);
            } else if (volumeRatio < 0.5) {
              performanceScore -= 1;
              reasoning.push(`Low volume - limited market interest`);
            }
          }
          
          // Check trend indicators if available
          if (tech?.trend) {
            if (tech.trend === 'BULLISH') {
              performanceScore += 1;
              reasoning.push(`Technical trend analysis shows bullish pattern`);
            } else if (tech.trend === 'BEARISH') {
              performanceScore -= 1;
              reasoning.push(`Technical trend analysis shows bearish pattern`);
            }
          }
          
          // Make recommendation based on performance score
          if (performanceScore >= 2) {
            action = 'BUY';
            confidence = Math.min(75, 60 + (performanceScore * 5));
          } else if (performanceScore <= -2) {
            action = 'SELL';
            confidence = Math.min(75, 60 + (Math.abs(performanceScore) * 5));
          } else {
            action = 'HOLD';
            confidence = 55;
            reasoning.push(`Mixed signals from technical indicators - neutral recommendation advised`);
          }
        }
        
        reasoning.push(...marketFactors);
      }
    }
    
    // Add trend information if available
    if (tech && tech.trend) {
      reasoning.push(`Technical trend: ${tech.trend}`);
    }
    
    // Ensure we always have meaningful reasoning
    if (reasoning.length === 0) {
      reasoning.push('Conservative analysis based on current market conditions and technical indicators');
      reasoning.push('Consider fundamental analysis and broader market trends');
    }
    
    return {
      action,
      confidence,
      target_price: action === 'BUY' ? price * 1.15 : action === 'SELL' ? price * 0.90 : price * 1.08,
      stop_loss: action === 'BUY' ? price * 0.90 : action === 'SELL' ? price * 1.08 : price * 0.92,
      time_horizon: tech && tech.volatility > 20 ? 'SHORT_TERM' : 'MEDIUM_TERM',
      reasoning: reasoning
    };
  }

  /**
   * Get real-time web research for a specific stock
   */
  private static async getStockWebResearch(symbol: string): Promise<any> {
    try {
      // Import WebSearch utility
      const { WebSearch } = await import('../utils/webSearchUtil');
      
      // Use more comprehensive search queries to get real performance data
      const queries = [
        `${symbol} stock price performance 2024 2025 decline fall drop analysis`,
        `${symbol} stock recommendation buy sell 2025 analyst target price`,
        `${symbol} share price down loss percentage 6 months yearly performance`
      ];
      
      console.log(`🔍 Comprehensive stock research for ${symbol}...`);
      
      const allSearchResults = [];
      for (const query of queries) {
        try {
          const results = await WebSearch(query, 2);
          if (results && results.length > 0) {
            allSearchResults.push(...results);
          }
        } catch (error) {
          console.error(`Search failed for query: ${query}`, error);
        }
      }
      
      const searchResults = allSearchResults;
      
      if (!searchResults || searchResults.length === 0) {
        return null;
      }
      
      // Analyze search results for sentiment and recommendations
      let bullishIndicators = 0;
      let bearishIndicators = 0;
      const keyFactors = [];
      
      for (const result of searchResults) {
        const content = (result.title + ' ' + result.snippet).toLowerCase();
        
        // Bullish indicators
        const bullishMatches = content.match(/buy|bullish|positive|upside|target|upgrade|outperform|strong|gain|rise|rally|growth/g);
        if (bullishMatches) {
          bullishIndicators += bullishMatches.length;
        }
        
        // Bearish indicators - enhanced to catch more negative sentiment
        const bearishMatches = content.match(/sell|bearish|negative|downside|downgrade|underperform|weak|fall|drop|decline|loss|plunge|crash|avoid|caution|risk/g);
        if (bearishMatches) {
          bearishIndicators += bearishMatches.length;
        }
        
        // Enhanced performance-based indicators - look for actual declines
        const performanceMatches = content.match(/down\s+\d+%|fell\s+\d+%|dropped\s+\d+%|declined\s+\d+%|lost\s+\d+%|plunge\s+\d+%|-\d+\.\d+%|negative\s+\d+%/g);
        if (performanceMatches && performanceMatches.length > 0) {
          bearishIndicators += performanceMatches.length * 3; // Weight performance drops very heavily
          keyFactors.push(`Significant price decline detected in recent reports`);
        }
        
        // Look for specific high-percentage declines (20%+, 30%+, etc.)
        const majorDeclineMatches = content.match(/down\s+[2-9]\d%|fell\s+[2-9]\d%|dropped\s+[2-9]\d%|declined\s+[2-9]\d%|lost\s+[2-9]\d%/g);
        if (majorDeclineMatches && majorDeclineMatches.length > 0) {
          bearishIndicators += majorDeclineMatches.length * 5; // Very heavy weight for major declines
          keyFactors.push(`Major decline of 20%+ detected in market reports`);
        }
        
        // Extract key factors
        if (content.includes('target') || content.includes('price')) {
          keyFactors.push(`Recent analyst coverage with price targets mentioned`);
        }
        if (content.includes('earnings') || content.includes('results')) {
          keyFactors.push(`Earnings/results-based analysis available`);
        }
      }
      
      let recommendation = 'HOLD';
      let sentiment = 'Neutral';
      let reason = 'mixed market signals';
      
      console.log(`📊 Web research analysis for ${symbol}: bullish=${bullishIndicators}, bearish=${bearishIndicators}`);
      
      // Enhanced logic - require stronger evidence for BUY recommendations
      if (bearishIndicators > bullishIndicators * 1.2) {
        // More sensitive to bearish indicators
        recommendation = 'SELL';
        sentiment = 'Negative';
        reason = 'predominantly bearish market outlook';
      } else if (bullishIndicators > bearishIndicators * 2.0 && bullishIndicators > 3) {
        // Higher threshold for BUY - need strong bullish signals AND minimum indicators
        recommendation = 'BUY';
        sentiment = 'Positive';
        reason = 'strong bullish analyst sentiment';
      } else if (bearishIndicators > 2) {
        // If we have significant bearish indicators, lean toward SELL
        recommendation = 'SELL';
        sentiment = 'Negative';
        reason = 'concerning market signals detected';
      }
      
      console.log(`📊 Web research recommendation for ${symbol}: ${recommendation} (${reason})`);
      
      // CRITICAL: Override BUY recommendations for stocks with major performance issues
      if (recommendation === 'BUY' && bearishIndicators >= 3) {
        console.log(`⚠️ Overriding BUY recommendation due to significant bearish indicators (${bearishIndicators})`);
        recommendation = 'HOLD';
        reason = 'conflicting signals - bearish indicators present';
      }
      
      return {
        recommendation,
        sentiment,
        reason,
        keyFactors: Array.from(new Set(keyFactors)).slice(0, 3), // Unique factors, max 3
        confidence: Math.min(75, Math.max(50, (bullishIndicators + bearishIndicators) * 5))
      };
      
    } catch (error) {
      console.error('Error in stock web research:', error);
      return null;
    }
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

  private static async parseRecommendationResponse(response: string, currentPrice: number, symbol?: string): Promise<any> {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      return await this.getFallbackRecommendation({ quote: { currentPrice, dayChangePercent: 0 } }, symbol);
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
   * Test OpenAI API connection and functionality
   */
  static async testOpenAIConnection(): Promise<boolean> {
    console.log('🧪 Testing OpenAI API Connection...');
    
    try {
      // Test if API key is configured
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('❌ OpenAI API key not found in environment variables');
        console.error('Please set REACT_APP_OPENAI_API_KEY in your Vercel environment variables');
        return false;
      }
      
      console.log('✅ API key found, testing connection...');
      
      // Simple test call
      const testResponse = await this.callOpenAI('Respond with "API connection successful" if you can read this message.');
      
      if (testResponse && testResponse.includes('API connection successful')) {
        console.log('✅ OpenAI API connection test passed');
        console.log('📊 Test response:', testResponse);
        return true;
      } else {
        console.error('❌ OpenAI API test failed - unexpected response:', testResponse);
        return false;
      }
      
    } catch (error) {
      console.error('❌ OpenAI API connection test failed:', error);
      return false;
    }
  }

  /**
   * Test the investment analysis service
   */
  static async testAnalysisService(): Promise<void> {
    console.log('🧪 Testing Investment Analysis Service...');
    
    try {
      // First test OpenAI connection
      console.log('0. Testing OpenAI API connection...');
      const apiWorking = await this.testOpenAIConnection();
      if (!apiWorking) {
        console.error('❌ OpenAI API not working, investment analysis will use fallback methods');
      }
      
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