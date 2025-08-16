/**
 * Stock Comparison Service
 * Handles comparing multiple stocks and providing comparative analysis
 */

import { GrowwApiService, StockQuote } from './growwApiService';
import { InvestmentAnalysisService, StockAnalysisReport } from './investmentAnalysisService';

export interface StockComparison {
  stocks: ComparisonStock[];
  recommendation: {
    topPick: string;
    reasoning: string[];
    confidence: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  };
  comparison_metrics: {
    metric: string;
    values: { symbol: string; value: number | string; rank: number }[];
  }[];
  summary: string;
}

export interface ComparisonStock {
  symbol: string;
  name: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  marketCap: string;
  sector: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export class StockComparisonService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Compare multiple stocks and provide detailed analysis
   */
  static async compareStocks(stockSymbols: string[]): Promise<StockComparison> {
    try {
      console.log(`📊 Starting comparison for stocks: ${stockSymbols.join(', ')}`);

      if (stockSymbols.length < 2) {
        throw new Error('At least 2 stocks required for comparison');
      }

      // Get detailed analysis for each stock
      const stockAnalyses = await Promise.all(
        stockSymbols.map(symbol => InvestmentAnalysisService.analyzeStock(symbol))
      );

      // Filter out null results
      const validAnalyses = stockAnalyses.filter(analysis => analysis !== null) as StockAnalysisReport[];

      if (validAnalyses.length < 2) {
        throw new Error('Could not analyze enough stocks for comparison');
      }

      // Convert to comparison format
      const comparisonStocks: ComparisonStock[] = validAnalyses.map(analysis => ({
        symbol: analysis.stock_info.symbol,
        name: analysis.stock_info.company_name,
        currentPrice: analysis.stock_info.current_price,
        dayChange: analysis.stock_info.day_change,
        dayChangePercent: analysis.stock_info.day_change_percent,
        marketCap: analysis.stock_info.market_cap,
        sector: analysis.stock_info.sector,
        recommendation: analysis.recommendation.action as 'BUY' | 'HOLD' | 'SELL',
        score: this.calculateStockScore(analysis),
        strengths: analysis.recommendation.reasoning.slice(0, 3),
        weaknesses: analysis.risk_analysis.key_risks.slice(0, 2)
      }));

      // Generate AI-powered comparison analysis
      const comparisonAnalysis = await this.generateComparisonAnalysis(validAnalyses);

      // Create comparison metrics
      const comparisonMetrics = this.createComparisonMetrics(comparisonStocks);

      // Determine top pick
      const topStock = comparisonStocks.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      return {
        stocks: comparisonStocks,
        recommendation: {
          topPick: topStock.symbol,
          reasoning: [
            `${topStock.name} scores highest with a score of ${topStock.score}/100`,
            ...topStock.strengths.slice(0, 2),
            comparisonAnalysis.recommendation_reasoning
          ],
          confidence: comparisonAnalysis.confidence,
          riskLevel: this.determineOverallRisk(comparisonStocks)
        },
        comparison_metrics: comparisonMetrics,
        summary: comparisonAnalysis.summary
      };

    } catch (error) {
      console.error('❌ Error in stock comparison:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered comparison analysis
   */
  private static async generateComparisonAnalysis(analyses: StockAnalysisReport[]): Promise<any> {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return this.fallbackComparison(analyses);
      }

      const stockData = analyses.map(analysis => ({
        symbol: analysis.stock_info.symbol,
        name: analysis.stock_info.company_name,
        sector: analysis.stock_info.sector,
        price: analysis.stock_info.current_price,
        change: analysis.stock_info.day_change_percent,
        recommendation: analysis.recommendation.action,
        confidence: analysis.recommendation.confidence,
        reasoning: analysis.recommendation.reasoning.slice(0, 3),
        risks: analysis.risk_analysis.key_risks.slice(0, 2),
        technicals: analysis.technical_analysis ? {
          trend: analysis.technical_analysis.trend,
          rsi: analysis.technical_analysis.rsi,
          volatility: analysis.technical_analysis.volatility
        } : null
      }));

      const systemPrompt = `You are an expert stock analyst comparing multiple stocks. Provide a comprehensive comparison analysis.

Stock Data: ${JSON.stringify(stockData, null, 2)}

Provide analysis in this JSON format:
{
  "summary": "2-3 sentence overview of the comparison",
  "recommendation_reasoning": "Why the top pick is best among these options",
  "confidence": 85,
  "key_differences": ["Key differentiating factors between stocks"],
  "market_outlook": "Overall market view for these stocks"
}

Focus on:
- Relative valuation and growth prospects
- Sector positioning and competitive advantages
- Risk-return profiles
- Near-term vs long-term outlook
- Which stock offers best value at current levels`;

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analyze and compare these stocks' }
          ],
          max_tokens: 800,
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        return this.fallbackComparison(analyses);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (error) {
      console.error('❌ Error in AI comparison analysis:', error);
      return this.fallbackComparison(analyses);
    }
  }

  /**
   * Fallback comparison when AI is not available
   */
  private static fallbackComparison(analyses: StockAnalysisReport[]): any {
    const topStock = analyses.reduce((best, current) => 
      this.calculateStockScore(current) > this.calculateStockScore(best) ? current : best
    );

    return {
      summary: `Comparison of ${analyses.length} stocks shows varying risk-return profiles across different sectors.`,
      recommendation_reasoning: `${topStock.stock_info.company_name} shows strong fundamentals and positive technical indicators.`,
      confidence: 75,
      key_differences: ['Different sector exposures', 'Varying growth trajectories', 'Different risk profiles'],
      market_outlook: 'Mixed outlook with sector-specific opportunities'
    };
  }

  /**
   * Calculate overall stock score
   */
  private static calculateStockScore(analysis: StockAnalysisReport): number {
    let score = 50; // Base score

    // Recommendation weight (40 points max)
    if (analysis.recommendation.action === 'BUY') score += 40;
    else if (analysis.recommendation.action === 'HOLD') score += 20;
    else score += 0;

    // Confidence weight (20 points max)
    score += (analysis.recommendation.confidence * 0.2);

    // Technical analysis weight (20 points max)
    if (analysis.technical_analysis) {
      if (analysis.technical_analysis.trend === 'BULLISH') score += 15;
      else if (analysis.technical_analysis.trend === 'NEUTRAL') score += 8;
      
      // RSI consideration
      if (analysis.technical_analysis.rsi > 30 && analysis.technical_analysis.rsi < 70) {
        score += 5; // Healthy RSI range
      }
    }

    // Risk adjustment (10 points max)
    const riskLevel = analysis.risk_analysis.risk_level;
    if (riskLevel === 'LOW') score += 10;
    else if (riskLevel === 'MODERATE') score += 5;

    // Performance weight (10 points max)
    if (analysis.stock_info.day_change_percent > 2) score += 10;
    else if (analysis.stock_info.day_change_percent > 0) score += 5;

    return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
  }

  /**
   * Create comparison metrics table
   */
  private static createComparisonMetrics(stocks: ComparisonStock[]): any[] {
    const metrics = [
      {
        metric: 'Current Price (₹)',
        values: stocks.map((stock, index) => ({
          symbol: stock.symbol,
          value: stock.currentPrice,
          rank: index + 1
        }))
      },
      {
        metric: 'Day Change (%)',
        values: stocks.map((stock, index) => ({
          symbol: stock.symbol,
          value: stock.dayChangePercent.toFixed(2),
          rank: index + 1
        }))
      },
      {
        metric: 'Recommendation',
        values: stocks.map((stock, index) => ({
          symbol: stock.symbol,
          value: stock.recommendation,
          rank: index + 1
        }))
      },
      {
        metric: 'Overall Score',
        values: stocks.map((stock, index) => ({
          symbol: stock.symbol,
          value: stock.score,
          rank: index + 1
        })).sort((a, b) => b.value - a.value).map((item, index) => ({ ...item, rank: index + 1 }))
      }
    ];

    return metrics;
  }

  /**
   * Determine overall risk level
   */
  private static determineOverallRisk(stocks: ComparisonStock[]): 'LOW' | 'MODERATE' | 'HIGH' {
    const avgVolatility = stocks.reduce((sum, stock) => sum + stock.score, 0) / stocks.length;
    
    if (avgVolatility > 75) return 'LOW';
    else if (avgVolatility > 50) return 'MODERATE';
    else return 'HIGH';
  }

  /**
   * Format comparison for display
   */
  static formatComparisonResponse(comparison: StockComparison): string {
    let response = `# 🔄 Stock Comparison Analysis\n\n`;
    
    // Summary
    response += `## 📋 Comparison Summary\n`;
    response += `${comparison.summary}\n\n`;

    // Top Recommendation
    response += `## 🎯 Top Recommendation: ${comparison.recommendation.topPick}\n`;
    response += `**Confidence:** ${comparison.recommendation.confidence}%\n`;
    response += `**Risk Level:** ${comparison.recommendation.riskLevel}\n\n`;
    response += `**Why ${comparison.recommendation.topPick}:**\n`;
    comparison.recommendation.reasoning.forEach((reason, index) => {
      response += `${index + 1}. ${reason}\n`;
    });
    response += '\n';

    // Individual Stock Details
    response += `## 📊 Individual Stock Analysis\n\n`;
    comparison.stocks.forEach((stock, index) => {
      response += `### ${index + 1}. ${stock.name} (${stock.symbol})\n`;
      response += `- **Current Price:** ₹${stock.currentPrice}\n`;
      response += `- **Day Change:** ${stock.dayChange >= 0 ? '+' : ''}₹${stock.dayChange.toFixed(2)} (${stock.dayChangePercent >= 0 ? '+' : ''}${stock.dayChangePercent.toFixed(2)}%)\n`;
      response += `- **Sector:** ${stock.sector}\n`;
      response += `- **Recommendation:** ${stock.recommendation}\n`;
      response += `- **Score:** ${stock.score}/100\n`;
      
      if (stock.strengths.length > 0) {
        response += `- **Strengths:** ${stock.strengths.join(', ')}\n`;
      }
      if (stock.weaknesses.length > 0) {
        response += `- **Risks:** ${stock.weaknesses.join(', ')}\n`;
      }
      response += '\n';
    });

    // Comparison Table
    response += `## 📈 Key Metrics Comparison\n\n`;
    comparison.comparison_metrics.forEach(metric => {
      response += `**${metric.metric}:**\n`;
      metric.values.forEach(value => {
        response += `- ${value.symbol}: ${value.value}\n`;
      });
      response += '\n';
    });

    // Disclaimer
    response += `## ⚠️ Disclaimer\n`;
    response += `This comparison is based on real-time market data, technical indicators, and AI analysis. It's for educational purposes only and not financial advice. Please consult with a qualified financial advisor and do your own research before making investment decisions.`;

    return response;
  }
}