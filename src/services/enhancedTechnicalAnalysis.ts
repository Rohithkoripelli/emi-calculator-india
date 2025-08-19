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
  static async analyzeStock(symbol: string, currentPrice: number): Promise<EnhancedTechnicalAnalysis> {
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
      
      // Use GPT-4o for intelligent technical analysis
      const aiAnalysis = await this.getGPTAnalysis(symbol, historicalData, currentPrice, basicMetrics);
      
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
    basicMetrics: any
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

      const systemPrompt = `You are a senior technical analyst with 15+ years of experience in Indian stock markets. Analyze the provided historical price data for ${symbol} with surgical precision.

CURRENT CONTEXT:
- Stock: ${symbol}
- Current Price: ₹${currentPrice}
- SMA20: ₹${basicMetrics.sma20.toFixed(2)}
- SMA50: ₹${basicMetrics.sma50.toFixed(2)}
- RSI: ${basicMetrics.rsi.toFixed(1)}
- Recent High: ₹${basicMetrics.recentHigh}
- Recent Low: ₹${basicMetrics.recentLow}

HISTORICAL DATA (Last 30 days):
${JSON.stringify(priceData, null, 2)}

ANALYSIS REQUIREMENTS:

1. **SUPPORT & RESISTANCE**: Identify key support and resistance levels using:
   - Recent pivot highs/lows that price has tested multiple times
   - Volume-confirmed levels where significant buying/selling occurred
   - Fibonacci retracements from recent swing high/low
   - Round number psychology levels
   Support MUST be below current price, Resistance MUST be above

2. **VOLATILITY**: Calculate accurate volatility using:
   - Daily returns standard deviation from the historical data
   - Average True Range (ATR) from high-low-close data
   - Express as percentage (e.g., 2.5% for moderate volatility)

3. **TARGET PRICE & STOP LOSS**: Based on technical levels:
   - Target: Next significant resistance level or measured move
   - Stop Loss: Below key support with 2-3% buffer for noise
   - Must be realistic and based on actual price action

4. **RECOMMENDATION**: BUY/SELL/HOLD based on:
   - Price position vs key moving averages
   - RSI momentum and divergences
   - Volume confirmation
   - Support/resistance proximity
   - Current trend strength

Provide ONLY accurate values derived from the actual data. No generic or placeholder numbers.

Return response in this exact JSON format:
{
  "support": number (actual support level from data),
  "resistance": number (actual resistance level from data), 
  "volatility": number (calculated from price data, as percentage),
  "targetPrice": number or null (realistic target based on resistance),
  "stopLoss": number or null (below support with buffer),
  "trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
  "confidence": number (0-100, based on signal strength),
  "recommendation": "BUY" | "SELL" | "HOLD",
  "reasoning": ["key reason 1", "key reason 2", "key reason 3"],
  "keyInsights": ["technical insight 1", "technical insight 2"]
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

      return analysis;

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

    return Promise.resolve({
      support,
      resistance,
      volatility,
      targetPrice,
      stopLoss,
      trend,
      confidence: 75,
      recommendation,
      reasoning: this.generateReasoning(trend, rsi, currentPrice, sma20),
      keyInsights: [`Real volatility: ${volatility.toFixed(1)}%`, `Key levels: Support ₹${support}, Resistance ₹${resistance}`]
    });
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
    if (trend === 'BULLISH' && rsi < 70 && currentPrice < resistance * 0.95) return 'BUY';
    if (trend === 'BEARISH' && rsi > 30 && currentPrice > support * 1.05) return 'SELL';
    return 'HOLD';
  }

  private static generateReasoning(trend: string, rsi: number, currentPrice: number, sma20: number): string[] {
    return [
      `Trend analysis shows ${trend.toLowerCase()} momentum`,
      `RSI at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions`,
      `Price ${currentPrice > sma20 ? 'above' : 'below'} key moving average (₹${sma20.toFixed(2)})`
    ];
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