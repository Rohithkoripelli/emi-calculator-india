/**
 * Groww API Service
 * Handles real-time stock data and historical analysis using Groww's API
 */

interface GrowwQuoteResponse {
  status: string;
  payload: {
    average_price: number | null;
    bid_quantity: number | null;
    bid_price: number | null;
    day_change: number;
    day_change_perc: number;
    upper_circuit_limit: number;
    lower_circuit_limit: number;
    ohlc: {
      open: number;
      high: number;
      low: number;
      close: number;
    };
    depth: {
      buy: Array<{ price: number; quantity: number }>;
      sell: Array<{ price: number; quantity: number }>;
    };
    last_price: number;
    market_cap: number | null;
    total_buy_quantity: number;
    total_sell_quantity: number;
    volume: number;
    week_52_high: number | null;
    week_52_low: number | null;
    last_trade_time: number;
  };
}

interface GrowwHistoricalResponse {
  status: string;
  payload: {
    candles: Array<[number, number, number, number, number, number]>; // [timestamp, open, high, low, close, volume]
    start_time: string;
    end_time: string;
    interval_in_minutes: number;
  };
}

interface StockQuote {
  symbol: string;
  companyName: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  volume: number;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  upperCircuit: number;
  lowerCircuit: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  lastTradeTime: number;
  buyDepth: Array<{ price: number; quantity: number }>;
  sellDepth: Array<{ price: number; quantity: number }>;
}

interface HistoricalCandle {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalAnalysis {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  support: number;
  resistance: number;
  sma20: number;
  sma50: number;
  rsi: number;
  volatility: number;
  priceChange30Days: number;
  volumeAverage: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}

export class GrowwApiService {
  private static readonly BASE_URL = 'https://api.groww.in';
  private static readonly HEADERS = {
    'Accept': 'application/json',
    'X-API-VERSION': '1.0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  private static getAuthHeaders(): Record<string, string> {
    const accessToken = process.env.GROWW_ACCESS_TOKEN || process.env.NEXT_PUBLIC_GROWW_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('⚠️ GROWW_ACCESS_TOKEN not found in environment variables');
      return this.HEADERS;
    }
    
    return {
      ...this.HEADERS,
      'Authorization': `Bearer ${accessToken}`
    };
  }

  /**
   * Get real-time stock quote
   */
  static async getRealTimeQuote(tradingSymbol: string, exchange: string = 'NSE', segment: string = 'CASH'): Promise<StockQuote | null> {
    try {
      console.log(`📊 Fetching real-time quote for ${tradingSymbol}...`);
      
      const url = `${this.BASE_URL}/v1/live-data/quote?exchange=${exchange}&segment=${segment}&trading_symbol=${tradingSymbol}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        console.error(`❌ Groww API error: ${response.status} - ${response.statusText}`);
        return null;
      }

      const data: GrowwQuoteResponse = await response.json();
      
      if (data.status !== 'SUCCESS' || !data.payload) {
        console.error('❌ Invalid response from Groww API:', data);
        return null;
      }

      const payload = data.payload;
      
      // Get company name from our internal database
      const { ExcelBasedStockAnalysisService } = await import('./excelBasedStockAnalysis');
      const companyInfo = ExcelBasedStockAnalysisService.getCompanyBySymbol(tradingSymbol);
      
      const quote: StockQuote = {
        symbol: tradingSymbol,
        companyName: companyInfo?.name || tradingSymbol,
        currentPrice: payload.last_price,
        dayChange: payload.day_change,
        dayChangePercent: payload.day_change_perc,
        dayHigh: payload.ohlc.high,
        dayLow: payload.ohlc.low,
        previousClose: payload.ohlc.close,
        volume: payload.volume,
        marketCap: payload.market_cap,
        week52High: payload.week_52_high,
        week52Low: payload.week_52_low,
        upperCircuit: payload.upper_circuit_limit,
        lowerCircuit: payload.lower_circuit_limit,
        totalBuyQuantity: payload.total_buy_quantity,
        totalSellQuantity: payload.total_sell_quantity,
        lastTradeTime: payload.last_trade_time,
        buyDepth: payload.depth.buy.slice(0, 5), // Top 5 buy orders
        sellDepth: payload.depth.sell.slice(0, 5) // Top 5 sell orders
      };

      console.log(`✅ Successfully fetched quote for ${tradingSymbol}: ₹${quote.currentPrice} (${quote.dayChangePercent.toFixed(2)}%)`);
      return quote;
      
    } catch (error) {
      console.error('❌ Error fetching real-time quote:', error);
      return null;
    }
  }

  /**
   * Get historical candle data for technical analysis
   */
  static async getHistoricalData(
    tradingSymbol: string, 
    days: number = 30, 
    exchange: string = 'NSE', 
    segment: string = 'CASH'
  ): Promise<HistoricalCandle[] | null> {
    try {
      console.log(`📈 Fetching ${days}-day historical data for ${tradingSymbol}...`);
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      // Format dates for API (YYYY-MM-DD HH:mm:ss)
      const formatDate = (date: Date) => {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      };
      
      const startTime = formatDate(startDate);
      const endTime = formatDate(endDate);
      
      const url = `${this.BASE_URL}/v1/historical/candle/range?exchange=${exchange}&segment=${segment}&trading_symbol=${tradingSymbol}&start_time=${startTime}&end_time=${endTime}&interval_in_minutes=3600`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        console.error(`❌ Groww Historical API error: ${response.status} - ${response.statusText}`);
        return null;
      }

      const data: GrowwHistoricalResponse = await response.json();
      
      if (data.status !== 'SUCCESS' || !data.payload?.candles) {
        console.error('❌ Invalid historical response from Groww API:', data);
        return null;
      }

      const candles: HistoricalCandle[] = data.payload.candles.map(candle => ({
        timestamp: candle[0],
        date: new Date(candle[0] * 1000).toISOString().split('T')[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

      console.log(`✅ Successfully fetched ${candles.length} candles for ${tradingSymbol}`);
      return candles;
      
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      return null;
    }
  }

  /**
   * Perform technical analysis on historical data
   */
  static performTechnicalAnalysis(candles: HistoricalCandle[]): TechnicalAnalysis | null {
    if (!candles || candles.length < 20) {
      console.log('❌ Insufficient data for technical analysis');
      return null;
    }

    try {
      console.log('🔍 Performing technical analysis...');
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      const currentPrice = prices[prices.length - 1];
      const oldestPrice = prices[0];
      
      // Calculate SMAs
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
      
      // Calculate RSI
      const rsi = this.calculateRSI(prices, 14);
      
      // Calculate support and resistance
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const resistance = Math.max(...highs.slice(-10)); // Resistance from last 10 sessions
      const support = Math.min(...lows.slice(-10)); // Support from last 10 sessions
      
      // Calculate volatility (standard deviation of price changes)
      const priceChanges = prices.slice(1).map((price, i) => ((price - prices[i]) / prices[i]) * 100);
      const volatility = this.calculateStandardDeviation(priceChanges);
      
      // Calculate 30-day price change
      const priceChange30Days = ((currentPrice - oldestPrice) / oldestPrice) * 100;
      
      // Average volume
      const volumeAverage = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      
      // Determine trend
      let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
      if (currentPrice > sma20 && sma20 > sma50 && priceChange30Days > 5) {
        trend = 'BULLISH';
      } else if (currentPrice < sma20 && sma20 < sma50 && priceChange30Days < -5) {
        trend = 'BEARISH';
      }
      
      // Generate recommendation
      let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 50;
      
      if (trend === 'BULLISH' && rsi < 70 && currentPrice > sma20) {
        recommendation = 'BUY';
        confidence = Math.min(85, 60 + Math.abs(priceChange30Days));
      } else if (trend === 'BEARISH' && rsi > 30 && currentPrice < sma20) {
        recommendation = 'SELL';
        confidence = Math.min(85, 60 + Math.abs(priceChange30Days));
      }
      
      const analysis: TechnicalAnalysis = {
        trend,
        support: Math.round(support * 100) / 100,
        resistance: Math.round(resistance * 100) / 100,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: Math.round(sma50 * 100) / 100,
        rsi: Math.round(rsi * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        priceChange30Days: Math.round(priceChange30Days * 100) / 100,
        volumeAverage: Math.round(volumeAverage),
        recommendation,
        confidence: Math.round(confidence)
      };
      
      console.log(`✅ Technical analysis complete: ${recommendation} (${confidence}% confidence)`);
      return analysis;
      
    } catch (error) {
      console.error('❌ Error in technical analysis:', error);
      return null;
    }
  }

  /**
   * Get multiple stock quotes in batch
   */
  static async getBatchQuotes(tradingSymbols: string[], exchange: string = 'NSE'): Promise<StockQuote[]> {
    console.log(`📊 Fetching batch quotes for ${tradingSymbols.length} stocks...`);
    
    const quotes: StockQuote[] = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limiting
    
    for (let i = 0; i < tradingSymbols.length; i += batchSize) {
      const batch = tradingSymbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => this.getRealTimeQuote(symbol, exchange));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        const validQuotes = batchResults.filter(quote => quote !== null) as StockQuote[];
        quotes.push(...validQuotes);
        
        // Add delay between batches
        if (i + batchSize < tradingSymbols.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${i / batchSize + 1}:`, error);
      }
    }
    
    console.log(`✅ Successfully fetched ${quotes.length} out of ${tradingSymbols.length} quotes`);
    return quotes;
  }

  // Helper methods for technical analysis
  private static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Neutral RSI if insufficient data
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Test the Groww API connection
   */
  static async testConnection(): Promise<boolean> {
    console.log('🧪 Testing Groww API connection...');
    
    // Test with a well-known stock
    const testQuote = await this.getRealTimeQuote('RELIANCE');
    
    if (testQuote) {
      console.log('✅ Groww API connection successful');
      console.log(`📊 Test quote: ${testQuote.companyName} - ₹${testQuote.currentPrice}`);
      return true;
    } else {
      console.log('❌ Groww API connection failed');
      return false;
    }
  }
}

// Export types for use in other modules
export type { StockQuote, HistoricalCandle, TechnicalAnalysis };