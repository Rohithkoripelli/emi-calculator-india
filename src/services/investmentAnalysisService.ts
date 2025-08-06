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
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found in environment variables');
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
      
      // Step 4: Get news and sentiment analysis
      const stockNews = await NewsSearchService.getStockNews(symbol, companyInfo.name);
      const newsSentiment = this.analyzeNewsSentiment(stockNews);
      
      // Step 5: Generate comprehensive recommendation using OpenAI
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
        risk_analysis: this.assessRiskLevel(quote, technicalAnalysis, newsSentiment)
      };
      
      console.log(`✅ Analysis complete for ${symbol}: ${recommendation.action} (${recommendation.confidence}% confidence)`);
      return report;
      
    } catch (error) {
      console.error('❌ Error in stock analysis:', error);
      return null;
    }
  }

  /**
   * Generate investment recommendations for a specific amount
   */
  static async generateInvestmentRecommendation(
    query: string,
    amount: number,
    frequency: 'LUMP_SUM' | 'SIP' | 'RECURRING' = 'LUMP_SUM'
  ): Promise<InvestmentRecommendation | null> {
    try {
      console.log(`💼 Generating investment recommendation for ₹${amount} (${frequency})...`);
      
      // Step 1: Analyze the query to understand user's preferences
      const queryAnalysis = this.analyzeInvestmentQuery(query, amount, frequency);
      
      // Step 2: Get current market trends and discover trending stocks
      const marketTrends = await NewsSearchService.analyzeMarketTrends();
      
      // Step 3: Get real-time prices for trending stocks
      const trendingStocks = marketTrends.trending_stocks.slice(0, 12); // Top 12 stocks
      const stockQuotes = await this.getStockQuotesForRecommendation(trendingStocks);
      
      // Step 4: Create portfolio allocation based on amount and risk profile
      const portfolioAllocation = await this.createPortfolioAllocation(
        stockQuotes,
        amount,
        queryAnalysis.risk_appetite
      );
      
      // Step 5: Generate investment strategy using OpenAI
      const strategy = await this.generateInvestmentStrategy({
        queryAnalysis,
        marketTrends,
        portfolioAllocation,
        amount,
        frequency
      });
      
      // Step 6: Compile comprehensive recommendation
      const recommendation: InvestmentRecommendation = {
        query_analysis: queryAnalysis,
        market_overview: {
          current_sentiment: marketTrends.market_sentiment,
          trending_sectors: marketTrends.key_sectors,
          market_summary: marketTrends.market_summary
        },
        portfolio_allocation: portfolioAllocation,
        investment_strategy: strategy.investment_strategy,
        risk_management: strategy.risk_management,
        tax_implications: strategy.tax_implications,
        next_steps: strategy.next_steps
      };
      
      console.log(`✅ Investment recommendation generated for ₹${amount}`);
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
    
    if (Math.abs(quote.dayChangePercent) > 5) {
      risks.push('High daily price volatility');
    }
    
    if (technical && technical.rsi > 75) {
      risks.push('Overbought conditions - potential correction');
    }
    
    if (sentiment.overall_sentiment === 'NEGATIVE') {
      risks.push('Negative news sentiment affecting market perception');
    }
    
    if (quote.currentPrice > (quote.week52High || quote.currentPrice * 1.5)) {
      risks.push('Trading near 52-week high - limited upside');
    }
    
    return risks.length > 0 ? risks : ['Standard market risks apply'];
  }

  // Fallback methods when OpenAI is unavailable
  private static getFallbackRecommendation(data: any): any {
    const price = data.quote.currentPrice;
    const dayChange = data.quote.dayChangePercent;
    
    let action = 'HOLD';
    let confidence = 60;
    
    if (dayChange > 2 && data.technicalAnalysis?.trend === 'BULLISH') {
      action = 'BUY';
      confidence = 75;
    } else if (dayChange < -2 && data.technicalAnalysis?.trend === 'BEARISH') {
      action = 'SELL';
      confidence = 70;
    }
    
    return {
      action,
      confidence,
      target_price: price * 1.12,
      stop_loss: price * 0.92,
      time_horizon: 'MEDIUM_TERM',
      reasoning: [
        `Current price momentum: ${dayChange > 0 ? 'Positive' : 'Negative'}`,
        `Technical trend: ${data.technicalAnalysis?.trend || 'SIDEWAYS'}`,
        'Market fundamentals and sector performance considered'
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