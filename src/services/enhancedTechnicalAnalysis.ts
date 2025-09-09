/**
 * Enhanced Technical Analysis Service
 * Uses real historical candle data and GPT-4o for accurate technical analysis
 */

import { GrowwApiService, HistoricalCandle } from './growwApiService';

interface EnhancedTechnicalAnalysis {
  support: number;
  resistance: number;
  volatility: number;
  targetPrice: number | null;
  stopLoss: number | null;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  rsi: number;
  sma20: number;
  sma50: number;
  confidence: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string[];
}

interface GPTAnalysisResult {
  support: number;
  resistance: number;
  volatility: number;
  targetPrice: number | null;
  stopLoss: number | null;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  confidence: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string[];
  keyInsights: string[];
}

export class EnhancedTechnicalAnalysisService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Perform comprehensive technical analysis using real historical data and AI
   */
  static async analyzeStock(
    symbol: string, 
    currentPrice: number, 
    comprehensiveData?: {
      screenerData?: any;
      quote?: any;
      newsSentiment?: any;
      webResearch?: any;
      userPreferences?: {
        investmentPeriod: 'short-term' | 'long-term';
        currentHolding: 'yes' | 'no';
        riskTolerance: 'low' | 'medium' | 'high';
        stockSymbol: string;
        stockName: string;
      };
    }
  ): Promise<EnhancedTechnicalAnalysis> {
    try {
      console.log(`🔍 Starting enhanced technical analysis for ${symbol} at ₹${currentPrice}`);

      // Get 90 days of historical data for comprehensive analysis
      const historicalData = await GrowwApiService.getHistoricalData(symbol, 90);
      
      if (!historicalData || historicalData.length < 20) {
        console.warn(`⚠️ Insufficient data for ${symbol}, using fallback analysis`);
        return this.fallbackAnalysis(symbol, currentPrice);
      }

      console.log(`📊 Retrieved ${historicalData.length} candles for analysis`);

      // Calculate basic technical indicators from real data
      const basicMetrics = this.calculateBasicMetrics(historicalData, currentPrice);
      
      // Use GPT-4o for intelligent technical analysis with comprehensive data
      const aiAnalysis = await this.getGPTAnalysis(symbol, historicalData, currentPrice, basicMetrics, comprehensiveData);
      
      return {
        support: aiAnalysis.support,
        resistance: aiAnalysis.resistance,
        volatility: aiAnalysis.volatility,
        targetPrice: aiAnalysis.targetPrice,
        stopLoss: aiAnalysis.stopLoss,
        trend: aiAnalysis.trend,
        rsi: basicMetrics.rsi,
        sma20: basicMetrics.sma20,
        sma50: basicMetrics.sma50,
        confidence: aiAnalysis.confidence,
        recommendation: aiAnalysis.recommendation,
        reasoning: aiAnalysis.reasoning
      };

    } catch (error) {
      console.error(`❌ Error in enhanced technical analysis for ${symbol}:`, error);
      return this.fallbackAnalysis(symbol, currentPrice);
    }
  }

  /**
   * Calculate basic technical metrics from historical data
   */
  private static calculateBasicMetrics(candles: HistoricalCandle[], currentPrice: number) {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // Calculate Simple Moving Averages
    const sma20 = closes.length >= 20 ? 
      closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : currentPrice;
    const sma50 = closes.length >= 50 ? 
      closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : currentPrice;

    // Calculate RSI (14-period)
    const rsi = this.calculateRSI(closes, 14);

    // Calculate real volatility from price changes
    const dailyReturns = closes.slice(1).map((price, i) => 
      Math.log(price / closes[i]) * 100
    );
    const volatility = this.calculateStandardDeviation(dailyReturns);

    // Find preliminary support/resistance levels
    const recentHigh = Math.max(...highs.slice(-30));
    const recentLow = Math.min(...lows.slice(-30));
    
    // Calculate average volume
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    return {
      sma20,
      sma50,
      rsi,
      volatility,
      recentHigh,
      recentLow,
      avgVolume,
      priceData: {
        closes: closes.slice(-30), // Last 30 days for AI analysis
        highs: highs.slice(-30),
        lows: lows.slice(-30),
        volumes: volumes.slice(-30)
      }
    };
  }

  /**
   * Use GPT-4o to analyze historical data and provide accurate technical analysis
   */
  private static async getGPTAnalysis(
    symbol: string, 
    historicalData: HistoricalCandle[], 
    currentPrice: number,
    basicMetrics: any,
    comprehensiveData?: {
      screenerData?: any;
      quote?: any;
      newsSentiment?: any;
      webResearch?: any;
      userPreferences?: {
        investmentPeriod: 'short-term' | 'long-term';
        currentHolding: 'yes' | 'no';
        riskTolerance: 'low' | 'medium' | 'high';
        stockSymbol: string;
        stockName: string;
      };
    }
  ): Promise<GPTAnalysisResult> {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ OpenAI API key not available, using algorithmic analysis');
        return this.algorithmicAnalysis(symbol, historicalData, currentPrice, basicMetrics);
      }

      // Prepare data for AI analysis
      const recentCandles = historicalData.slice(-30); // Last 30 days
      const priceData = recentCandles.map(c => ({
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }));

      // Build comprehensive prompt with all available data
      let fundamentalData = '';
      if (comprehensiveData?.screenerData) {
        const sd = comprehensiveData.screenerData;
        fundamentalData = `
FUNDAMENTAL ANALYSIS DATA (from Screener.in):
- Market Cap: ${sd.marketCap || 'N/A'}
- P/E Ratio: ${sd.pe || 'N/A'} (Industry benchmark: 15-25)
- EPS: ₹${sd.eps || 'N/A'}
- ROE: ${sd.roe || 'N/A'}% (Good if >15%)
- ROCE: ${sd.roce || 'N/A'}% (Good if >12%)
- Book Value: ₹${sd.bookValue || 'N/A'}
- Dividend Yield: ${sd.dividendYield || 'N/A'}%
- Revenue Growth: ${sd.revenueGrowth || 'N/A'}%
- Profit Growth: ${sd.profitGrowth || 'N/A'}%
- Debt/Equity: ${sd.debtToEquity || 'N/A'} (Lower is better)
- Current Ratio: ${sd.currentRatio || 'N/A'} (Should be >1.5)
- Sector: ${sd.sector || 'N/A'}
- Industry: ${sd.industry || 'N/A'}`;
      }

      let newsData = '';
      if (comprehensiveData?.newsSentiment) {
        const ns = comprehensiveData.newsSentiment;
        newsData = `
NEWS SENTIMENT ANALYSIS:
- Overall Sentiment: ${ns.overall_sentiment}
- Sentiment Score: ${ns.sentiment_score}/100
- Key News Articles: ${ns.key_news?.length || 0} articles analyzed
- Recent News Summary: ${ns.key_news?.slice(0, 3).map((n: any) => `"${n.title}" (${n.sentiment})`).join(', ') || 'No recent news'}`;
      }

      let marketData = '';
      if (comprehensiveData?.quote) {
        const q = comprehensiveData.quote;
        marketData = `
REAL-TIME MARKET DATA:
- Day High: ₹${q.dayHigh || 'N/A'}
- Day Low: ₹${q.dayLow || 'N/A'}
- Volume: ${q.volume?.toLocaleString() || 'N/A'}
- 52W High: ₹${q.high52Week || 'N/A'}
- 52W Low: ₹${q.low52Week || 'N/A'}`;
      }

      // Build conditional sections for the prompt
      let fundamentalAnalysis = '';
      if (comprehensiveData?.screenerData) {
        const sd = comprehensiveData.screenerData;
        const peStatus = sd.pe ? (sd.pe < 15 ? '✅ UNDERVALUED' : sd.pe > 30 ? '🚩 OVERVALUED' : '⚖️ FAIR VALUE') : 'No Data';
        fundamentalAnalysis = `
   📊 VALUATION ANALYSIS:
   - P/E Ratio Check: ${peStatus}
   - Growth Quality: Revenue growth (${sd.revenueGrowth || 'N/A'}%) + Profit growth (${sd.profitGrowth || 'N/A'}%)
   - Management Efficiency: ROE ${sd.roe || 'N/A'}% (>15% is excellent)
   - Capital Utilization: ROCE ${sd.roce || 'N/A'}% (>12% is good)
   - Financial Health: Debt/Equity ${sd.debtToEquity || 'N/A'} + Current Ratio ${sd.currentRatio || 'N/A'}
   - Income Component: Dividend Yield ${sd.dividendYield || 'N/A'}%
   
   🎯 FUNDAMENTAL VERDICT REQUIRED:
   - Is the company fundamentally STRONG/AVERAGE/WEAK?
   - Is the current valuation CHEAP/FAIR/EXPENSIVE?
   - Are growth prospects PROMISING/MODERATE/CONCERNING?`;
      } else {
        fundamentalAnalysis = `
   ⚠️ NO FUNDAMENTAL DATA AVAILABLE - RELY MORE HEAVILY ON TECHNICAL + SENTIMENT`;
      }

      let sentimentAnalysis = '';
      if (comprehensiveData?.newsSentiment) {
        const ns = comprehensiveData.newsSentiment;
        sentimentAnalysis = `
   📰 NEWS SENTIMENT: ${ns.overall_sentiment} (Score: ${ns.sentiment_score}/100)
   📊 Recent Articles: ${ns.key_news?.length || 0} analyzed
   
   🎯 SENTIMENT IMPACT:
   - POSITIVE sentiment (>60) = Supportive for BUY
   - NEUTRAL sentiment (40-60) = No strong bias
   - NEGATIVE sentiment (<40) = Cautionary for SELL`;
      } else {
        sentimentAnalysis = `
   ⚠️ NO SENTIMENT DATA AVAILABLE - PROCEED WITH CAUTION`;
      }

      // Build user context analysis
      let userContext = '';
      if (comprehensiveData?.userPreferences) {
        const up = comprehensiveData.userPreferences;
        const isHolder = up.currentHolding === 'yes';
        userContext = `

=== 👤 USER INVESTMENT CONTEXT ===
- Current Position: ${isHolder ? 'EXISTING STOCKHOLDER' : 'NEW INVESTOR (No current holdings)'}
- Investment Horizon: ${up.investmentPeriod.toUpperCase().replace('-', ' ')} (${up.investmentPeriod === 'short-term' ? '< 1 year' : '> 1 year'})
- Risk Tolerance: ${up.riskTolerance.toUpperCase()} risk appetite
- Stock: ${up.stockName} (${up.stockSymbol})

🚨 CRITICAL RECOMMENDATION LOGIC:
${isHolder ? `
⚠️ USER OWNS THE STOCK - Can recommend BUY (add more), HOLD, or SELL
- BUY = Add to existing position if fundamentals/technicals are strong
- HOLD = Keep existing position, wait for better entry/exit
- SELL = Exit position if fundamentals/technicals are weak or overvalued` : `
⚠️ USER DOES NOT OWN THE STOCK - Can ONLY recommend BUY or HOLD, NEVER SELL
- BUY = Good opportunity to enter a new position  
- HOLD = Wait for better entry point, not compelling enough to buy now
- SELL = INVALID RECOMMENDATION (cannot sell what you don't own!)`}

Risk Tolerance Impact:
- ${up.riskTolerance === 'low' ? 'Conservative investor - prefer stable, dividend-paying stocks with strong fundamentals' : up.riskTolerance === 'medium' ? 'Balanced investor - mix of growth and stability, moderate volatility acceptable' : 'Aggressive investor - growth-focused, higher volatility acceptable for higher returns'}

Time Horizon Impact:
- ${up.investmentPeriod === 'short-term' ? 'Short-term focus - prioritize technical analysis, momentum, near-term catalysts' : 'Long-term focus - prioritize fundamental analysis, business quality, competitive advantages'}`;
      } else {
        userContext = `

=== 👤 USER INVESTMENT CONTEXT ===
⚠️ NO USER CONTEXT AVAILABLE - ASSUMING NEW INVESTOR
- Will provide general recommendation without specific user context
- Cannot recommend SELL without knowing user's current position`;
      }

      const systemPrompt = `You are a COMPREHENSIVE INVESTMENT ANALYST with 20+ years of experience combining technical, fundamental, and sentiment analysis for Indian stock markets. 

**CRITICAL MISSION**: Provide a HOLISTIC investment recommendation that considers ALL available data - not just price charts. You have access to real fundamental metrics, news sentiment, and technical indicators.

**STOCK BEING ANALYZED**: ${symbol}
**CURRENT PRICE**: ₹${currentPrice}

=== TECHNICAL INDICATORS ===
- SMA20: ₹${basicMetrics.sma20.toFixed(2)}
- SMA50: ₹${basicMetrics.sma50.toFixed(2)}
- RSI: ${basicMetrics.rsi.toFixed(1)}
- Recent High: ₹${basicMetrics.recentHigh}
- Recent Low: ₹${basicMetrics.recentLow}

HISTORICAL PRICE DATA (Last 30 days):
${JSON.stringify(priceData, null, 2)}

=== FUNDAMENTAL ANALYSIS ===${fundamentalData}

=== NEWS & SENTIMENT ===${newsData}

=== MARKET METRICS ===${marketData}${userContext}

**COMPREHENSIVE ANALYSIS FRAMEWORK**:

🔍 **HOLISTIC INVESTMENT DECISION**: Your recommendation must weigh ALL THREE PILLARS:

**1. FUNDAMENTAL ANALYSIS WEIGHT (40%)**:${fundamentalAnalysis}

**2. TECHNICAL ANALYSIS WEIGHT (35%)**:
   📈 PRICE ACTION & MOMENTUM:
   - Support/Resistance: Use ACTUAL price levels from historical data
   - Trend Direction: Current vs SMA20 (${currentPrice > basicMetrics.sma20 ? 'BULLISH' : 'BEARISH'}) vs SMA50 (${currentPrice > basicMetrics.sma50 ? 'BULLISH' : 'BEARISH'})
   - RSI Momentum: ${basicMetrics.rsi.toFixed(1)} (${basicMetrics.rsi > 70 ? '🚩 OVERBOUGHT' : basicMetrics.rsi < 30 ? '💎 OVERSOLD' : '⚖️ NEUTRAL'})
   - Volatility Assessment: Calculate from price data
   
   🎯 TECHNICAL RULES:
   - Support MUST be below ₹${currentPrice} (range: ₹${(currentPrice * 0.85).toFixed(0)}-₹${(currentPrice * 0.97).toFixed(0)})
   - Resistance MUST be above ₹${currentPrice} (range: ₹${(currentPrice * 1.03).toFixed(0)}-₹${(currentPrice * 1.18).toFixed(0)})

**3. SENTIMENT ANALYSIS WEIGHT (25%)**:${sentimentAnalysis}

**🎯 FINAL RECOMMENDATION LOGIC** (MUST consider user context):
${comprehensiveData?.userPreferences?.currentHolding === 'yes' ? `
🏠 **EXISTING STOCKHOLDER** - Can recommend BUY/HOLD/SELL:
- **BUY** (add more): Strong fundamentals + bullish technicals + positive sentiment + user risk tolerance supports it
- **HOLD**: Mixed signals OR approaching key levels OR wait for better entry/exit point
- **SELL**: Weak fundamentals + bearish technicals + negative sentiment + profit-taking opportunity` : `
🆕 **NEW INVESTOR** - Can ONLY recommend BUY/HOLD (NEVER SELL):
- **BUY**: Good entry opportunity with favorable fundamentals/technicals/sentiment matching user's risk/timeline  
- **HOLD**: Not compelling enough to enter OR wait for better entry point OR risk doesn't match user profile
- **SELL**: ❌ STRICTLY FORBIDDEN (user doesn't own the stock!)`}

⚠️ **USER RISK TOLERANCE CHECK**:
- Current user tolerance: ${comprehensiveData?.userPreferences?.riskTolerance || 'UNKNOWN'}
- Stock volatility vs user risk must align for BUY recommendation

**CRITICAL RSI WARNING SYSTEM**:
- RSI ${basicMetrics.rsi.toFixed(1)}: ${basicMetrics.rsi > 70 ? '🚩 OVERBOUGHT - High correction risk ahead!' : basicMetrics.rsi < 30 ? '💎 OVERSOLD - Potential bounce opportunity!' : '⚖️ Normal momentum range'}

Provide ONLY accurate values derived from the actual data. No generic or placeholder numbers.

**MANDATORY COMPREHENSIVE ANALYSIS REQUIRED:**

🎯 Your reasoning MUST explain the weighting across all pillars INCLUDING user context:
1. **Fundamental Factor**: What do the P/E, ROE, growth rates tell us?
2. **Technical Factor**: What do price action, RSI, support/resistance indicate?
3. **Sentiment Factor**: How does news sentiment influence the decision?
4. **User Context Factor**: How does current holdings status affect the recommendation?
5. **Risk Alignment**: Does stock volatility match user's risk tolerance?
6. **Time Horizon**: Does analysis match user's investment period?

Return response in this exact JSON format:
{
  "support": number (actual support level from historical data),
  "resistance": number (actual resistance level from historical data), 
  "volatility": number (calculated percentage from price movements),
  "targetPrice": number or null (next key resistance or measured move),
  "stopLoss": number or null (below support with safety buffer),
  "trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
  "confidence": number (0-100, weighted across all three analysis pillars),
  "recommendation": "BUY" | "SELL" | "HOLD",
  "reasoning": [
    "Fundamental factor: [P/E, ROE, growth analysis]",
    "Technical factor: [RSI, trend, support/resistance analysis]", 
    "Sentiment factor: [news impact and market sentiment]",
    "User context factor: [current holdings impact and recommendation logic]",
    "Risk alignment: [stock volatility vs user risk tolerance]",
    "Time horizon: [analysis fit with user investment period]"
  ],
  "keyInsights": [
    "Valuation insight: [cheap/fair/expensive with specific metrics]",
    "Momentum insight: [bullish/bearish momentum with RSI/trend data]",
    "News insight: [sentiment impact on stock prospects]"
  ]
}`;

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this technical data for ${symbol} and provide accurate support, resistance, volatility, target price, and stop loss based on the actual historical price data provided.` }
          ],
          max_tokens: 800,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`GPT API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content) as GPTAnalysisResult;

      console.log(`✅ GPT-4o analysis complete for ${symbol}:`, {
        support: analysis.support,
        resistance: analysis.resistance,
        volatility: analysis.volatility,
        recommendation: analysis.recommendation
      });

      // CRITICAL VALIDATION: Ensure support/resistance make logical sense
      const validatedAnalysis = this.validateAnalysis(analysis, currentPrice, symbol);
      return validatedAnalysis;

    } catch (error) {
      console.error('❌ Error in GPT analysis:', error);
      return this.algorithmicAnalysis(symbol, historicalData, currentPrice, basicMetrics);
    }
  }

  /**
   * Algorithmic fallback analysis using real data
   */
  private static algorithmicAnalysis(
    symbol: string,
    historicalData: HistoricalCandle[],
    currentPrice: number,
    basicMetrics: any
  ): Promise<GPTAnalysisResult> {
    const { sma20, sma50, rsi, volatility, recentHigh, recentLow } = basicMetrics;

    // Calculate support and resistance from actual data
    const support = this.findRealSupport(historicalData, currentPrice);
    const resistance = this.findRealResistance(historicalData, currentPrice);

    // Calculate realistic target and stop loss
    const targetPrice = this.calculateRealisticTarget(currentPrice, resistance, volatility);
    const stopLoss = this.calculateRealisticStopLoss(currentPrice, support, volatility);

    // Determine trend from real data
    const trend = this.determineTrend(currentPrice, sma20, sma50, rsi);

    // Generate recommendation
    const recommendation = this.generateRecommendation(currentPrice, support, resistance, rsi, trend);

    const algorithmicResult = {
      support,
      resistance,
      volatility,
      targetPrice,
      stopLoss,
      trend,
      confidence: 75,
      recommendation,
      reasoning: this.generateReasoning(trend, rsi, currentPrice, sma20, support, resistance, recommendation),
      keyInsights: [`Real volatility: ${volatility.toFixed(1)}%`, `Key levels: Support ₹${support}, Resistance ₹${resistance}`]
    };

    // Apply the same validation to algorithmic results
    const validatedResult = this.validateAnalysis(algorithmicResult, currentPrice, symbol);
    return Promise.resolve(validatedResult);
  }

  private static findRealSupport(candles: HistoricalCandle[], currentPrice: number): number {
    const lows = candles.map(c => c.low);
    
    // Find pivot lows (lows that are lower than surrounding candles)
    const pivotLows: number[] = [];
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] <= lows[i-1] && lows[i] <= lows[i-2] && 
          lows[i] <= lows[i+1] && lows[i] <= lows[i+2]) {
        pivotLows.push(lows[i]);
      }
    }

    // Find the most relevant support (highest pivot low below current price)
    const validSupports = pivotLows.filter(low => low < currentPrice * 0.98);
    const support = validSupports.length > 0 ? 
      Math.max(...validSupports) : 
      Math.min(...lows.slice(-20)) * 0.98;

    return Math.round(support * 100) / 100;
  }

  private static findRealResistance(candles: HistoricalCandle[], currentPrice: number): number {
    const highs = candles.map(c => c.high);
    
    // Find pivot highs
    const pivotHighs: number[] = [];
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] >= highs[i-1] && highs[i] >= highs[i-2] && 
          highs[i] >= highs[i+1] && highs[i] >= highs[i+2]) {
        pivotHighs.push(highs[i]);
      }
    }

    // Find the most relevant resistance (lowest pivot high above current price)
    const validResistances = pivotHighs.filter(high => high > currentPrice * 1.02);
    const resistance = validResistances.length > 0 ? 
      Math.min(...validResistances) : 
      Math.max(...highs.slice(-20)) * 1.02;

    return Math.round(resistance * 100) / 100;
  }

  private static calculateRealisticTarget(currentPrice: number, resistance: number, volatility: number): number {
    if (resistance > currentPrice) {
      return Math.round(resistance * 100) / 100;
    }
    
    // Use volatility-based target
    const targetMultiplier = Math.max(1.08, 1 + (volatility / 100) * 2);
    return Math.round(currentPrice * targetMultiplier * 100) / 100;
  }

  private static calculateRealisticStopLoss(currentPrice: number, support: number, volatility: number): number {
    if (support < currentPrice) {
      // 3% buffer below support to account for noise
      return Math.round(support * 0.97 * 100) / 100;
    }
    
    // Use volatility-based stop loss
    const stopMultiplier = Math.max(0.92, 1 - (volatility / 100) * 1.5);
    return Math.round(currentPrice * stopMultiplier * 100) / 100;
  }

  private static determineTrend(currentPrice: number, sma20: number, sma50: number, rsi: number): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (currentPrice > sma20 && sma20 > sma50 && rsi > 50) return 'BULLISH';
    if (currentPrice < sma20 && sma20 < sma50 && rsi < 50) return 'BEARISH';
    return 'SIDEWAYS';
  }

  private static generateRecommendation(
    currentPrice: number, 
    support: number, 
    resistance: number, 
    rsi: number, 
    trend: string
  ): 'BUY' | 'SELL' | 'HOLD' {
    // Strong bullish conditions - clear BUY signal
    if (trend === 'BULLISH' && rsi < 65 && currentPrice < resistance * 0.92) {
      return 'BUY';
    }
    
    // Strong bearish conditions - clear SELL signal  
    if (trend === 'BEARISH' && rsi > 35 && currentPrice > support * 1.08) {
      return 'SELL';
    }
    
    // Additional BUY conditions - oversold bounce opportunity
    if (rsi < 35 && currentPrice > support * 1.03) {
      return 'BUY';
    }
    
    // Additional SELL conditions - overbought correction
    if (rsi > 65 && currentPrice < resistance * 0.97) {
      return 'SELL';
    }
    
    // HOLD conditions - specific wait and watch scenarios
    const priceRange = (resistance - support) / support * 100;
    const midPoint = (support + resistance) / 2;
    const priceFromMid = Math.abs(currentPrice - midPoint) / midPoint * 100;
    
    // HOLD when price is in middle of range with neutral momentum
    if (priceFromMid < 8 && rsi >= 40 && rsi <= 60 && trend === 'SIDEWAYS') {
      return 'HOLD';
    }
    
    // HOLD when approaching key resistance in uptrend (wait for breakout)
    if (trend === 'BULLISH' && currentPrice >= resistance * 0.95 && rsi < 75) {
      return 'HOLD';
    }
    
    // HOLD when approaching key support in downtrend (wait for breakdown/bounce)
    if (trend === 'BEARISH' && currentPrice <= support * 1.05 && rsi > 25) {
      return 'HOLD';
    }
    
    // HOLD when RSI is in neutral zone with mixed signals
    if (rsi >= 35 && rsi <= 65 && trend === 'SIDEWAYS') {
      return 'HOLD';
    }
    
    // Default to BUY/SELL based on trend if not in specific HOLD conditions
    if (trend === 'BULLISH') return 'BUY';
    if (trend === 'BEARISH') return 'SELL';
    
    return 'HOLD';
  }

  private static generateReasoning(trend: string, rsi: number, currentPrice: number, sma20: number, support: number, resistance: number, recommendation: string): string[] {
    const baseReasons = [
      `Trend analysis shows ${trend.toLowerCase()} momentum`,
      `RSI at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions`,
      `Price ${currentPrice > sma20 ? 'above' : 'below'} key moving average (₹${sma20.toFixed(2)})`
    ];
    
    // Add specific reasoning for HOLD recommendations
    if (recommendation === 'HOLD') {
      const midPoint = (support + resistance) / 2;
      const priceFromMid = Math.abs(currentPrice - midPoint) / midPoint * 100;
      
      if (currentPrice >= resistance * 0.95 && trend === 'BULLISH') {
        baseReasons.push(`Approaching resistance at ₹${resistance.toFixed(2)} - wait for breakout confirmation`);
      } else if (currentPrice <= support * 1.05 && trend === 'BEARISH') {
        baseReasons.push(`Near support at ₹${support.toFixed(2)} - wait for bounce or breakdown`);
      } else if (priceFromMid < 8 && rsi >= 40 && rsi <= 60) {
        baseReasons.push(`Price in neutral zone with balanced momentum - suitable for wait and watch`);
      } else if (rsi >= 35 && rsi <= 65 && trend === 'SIDEWAYS') {
        baseReasons.push(`Sideways trend with neutral RSI suggests consolidation phase`);
      } else {
        baseReasons.push(`Mixed technical signals warrant cautious approach`);
      }
    }
    
    return baseReasons;
  }

  /**
   * Calculate RSI from price data
   */
  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate standard deviation for volatility
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 1.0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * CRITICAL: Validate analysis results to ensure they make logical sense
   */
  private static validateAnalysis(analysis: GPTAnalysisResult, currentPrice: number, symbol: string): GPTAnalysisResult {
    let support = analysis.support;
    let resistance = analysis.resistance;
    let needsFix = false;

    console.log(`🔍 Validating analysis for ${symbol}: Current ₹${currentPrice}, Support ₹${support}, Resistance ₹${resistance}`);

    // VALIDATION 1: Support must be below current price
    if (support >= currentPrice) {
      console.warn(`❌ Invalid support ₹${support} >= current price ₹${currentPrice}, fixing...`);
      support = currentPrice * 0.85; // 15% below current price
      needsFix = true;
    }

    // VALIDATION 2: Resistance must be above current price
    if (resistance <= currentPrice) {
      console.warn(`❌ Invalid resistance ₹${resistance} <= current price ₹${currentPrice}, fixing...`);
      resistance = currentPrice * 1.15; // 15% above current price
      needsFix = true;
    }

    // VALIDATION 3: Support should be within reasonable range (5-25% below)
    const supportDistance = ((currentPrice - support) / currentPrice) * 100;
    if (supportDistance > 25 || supportDistance < 2) {
      console.warn(`❌ Support too far from current price (${supportDistance.toFixed(1)}%), adjusting...`);
      support = currentPrice * 0.92; // 8% below current price
      needsFix = true;
    }

    // VALIDATION 4: Resistance should be within reasonable range (5-25% above)
    const resistanceDistance = ((resistance - currentPrice) / currentPrice) * 100;
    if (resistanceDistance > 25 || resistanceDistance < 2) {
      console.warn(`❌ Resistance too far from current price (${resistanceDistance.toFixed(1)}%), adjusting...`);
      resistance = currentPrice * 1.12; // 12% above current price
      needsFix = true;
    }

    // VALIDATION 5: Volatility should be reasonable (0.5% to 10%)
    let volatility = analysis.volatility;
    if (volatility < 0.5 || volatility > 10) {
      console.warn(`❌ Invalid volatility ${volatility}%, adjusting...`);
      volatility = Math.max(0.8, Math.min(5.0, volatility));
      needsFix = true;
    }

    if (needsFix) {
      console.log(`✅ Fixed analysis for ${symbol}: Support ₹${support.toFixed(2)}, Resistance ₹${resistance.toFixed(2)}, Volatility ${volatility.toFixed(1)}%`);
      
      // Update target price and stop loss based on corrected levels
      const targetPrice = resistance * 0.98; // Just below resistance
      const stopLoss = support * 1.02; // Just above support

      return {
        ...analysis,
        support: Math.round(support * 100) / 100,
        resistance: Math.round(resistance * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        targetPrice: Math.round(targetPrice * 100) / 100,
        stopLoss: Math.round(stopLoss * 100) / 100,
        reasoning: [
          ...analysis.reasoning,
          `Analysis validated and adjusted for accuracy`
        ]
      };
    }

    console.log(`✅ Analysis validation passed for ${symbol}`);
    return analysis;
  }

  /**
   * Fallback analysis for when data is insufficient
   */
  private static fallbackAnalysis(symbol: string, currentPrice: number): EnhancedTechnicalAnalysis {
    console.log(`⚠️ Using fallback analysis for ${symbol}`);
    
    return {
      support: Math.round(currentPrice * 0.92 * 100) / 100,
      resistance: Math.round(currentPrice * 1.08 * 100) / 100,
      volatility: 1.5,
      targetPrice: Math.round(currentPrice * 1.10 * 100) / 100,
      stopLoss: Math.round(currentPrice * 0.90 * 100) / 100,
      trend: 'SIDEWAYS',
      rsi: 50,
      sma20: currentPrice,
      sma50: currentPrice,
      confidence: 40,
      recommendation: 'HOLD',
      reasoning: ['Insufficient historical data for detailed analysis', 'Conservative approach recommended', 'Monitor for more data points']
    };
  }
}