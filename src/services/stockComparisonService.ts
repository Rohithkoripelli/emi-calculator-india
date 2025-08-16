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

      // Determine top pick - prioritize recommendation action first, then score
      const topStock = comparisonStocks.reduce((best, current) => {
        // Priority order: BUY > HOLD > SELL
        const bestAction = best.recommendation;
        const currentAction = current.recommendation;
        
        if (currentAction === 'BUY' && bestAction !== 'BUY') return current;
        if (currentAction === 'HOLD' && bestAction === 'SELL') return current;
        if (currentAction === bestAction) {
          // Same recommendation level, use score as tiebreaker
          return current.score > best.score ? current : best;
        }
        return best;
      });

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

      const systemPrompt = `You are an expert stock analyst comparing multiple stocks for investment decisions. Provide clear, actionable analysis.

Stock Data: ${JSON.stringify(stockData, null, 2)}

CRITICAL ANALYSIS REQUIREMENTS:
1. If any stock has "BUY" recommendation, it should be preferred over "HOLD" stocks
2. Consider both technical and fundamental factors
3. Account for sector dynamics and market conditions
4. Provide clear, non-contradictory reasoning

Provide analysis in this JSON format:
{
  "summary": "Clear 2-3 sentence overview explaining which stock is better and why",
  "recommendation_reasoning": "Specific reasons why the recommended stock is the best choice right now",
  "confidence": 85,
  "key_differences": ["Most important differentiating factors between these stocks"],
  "market_outlook": "Current market view and timing considerations for these investments"
}

Focus on:
- Current recommendation actions (BUY vs HOLD vs SELL)
- Risk-adjusted returns and valuation
- Technical momentum and chart patterns
- Sector leadership and competitive positioning
- Entry timing and risk management`;

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
      else if (analysis.technical_analysis.trend === 'SIDEWAYS') score += 8;
      
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
   * Format comparison for display with proper HTML tables and clear structure
   */
  static formatComparisonResponse(comparison: StockComparison): string {
    const topStock = comparison.stocks.find(s => s.symbol === comparison.recommendation.topPick)!;
    const allBuyRecommendations = comparison.stocks.filter(s => s.recommendation === 'BUY');
    
    let response = `# 📊 Stock Comparison Analysis\n\n`;
    
    // Clear recommendation section
    response += `## 🎯 Investment Recommendation\n\n`;
    
    if (allBuyRecommendations.length > 0) {
      response += `**Action: BUY ${topStock.symbol}**\n\n`;
      response += `**Key Reasoning:**\n`;
      response += `• ${topStock.name} has a **${topStock.recommendation}** rating with strong fundamentals\n`;
      response += `• Superior risk-return profile in current market conditions\n`;
      response += `• Technical indicators support the investment thesis\n\n`;
    } else {
      response += `**Action: HOLD positions or WAIT for better entry points**\n\n`;
      response += `**Key Reasoning:**\n`;
      response += `• Current valuations don't present compelling buy opportunities\n`;
      response += `• Market conditions suggest a cautious approach\n`;
      response += `• Consider dollar-cost averaging if investing for long term\n\n`;
    }
    
    response += `**Confidence Level:** ${comparison.recommendation.confidence}%\n`;
    response += `**Risk Assessment:** ${comparison.recommendation.riskLevel}\n\n`;

    // Detailed comparison table
    response += `## 📈 Detailed Stock Comparison\n\n`;
    response += `<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
<thead style="background-color: #f8f9fa;">
<tr>
<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Metric</th>`;
    
    comparison.stocks.forEach(stock => {
      response += `<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">${stock.symbol}</th>`;
    });
    response += `</tr>
</thead>
<tbody>`;

    // Company names row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Company</td>`;
    comparison.stocks.forEach(stock => {
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stock.name}</td>`;
    });
    response += `</tr>`;

    // Current price row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Current Price</td>`;
    comparison.stocks.forEach(stock => {
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">₹${stock.currentPrice.toLocaleString('en-IN')}</td>`;
    });
    response += `</tr>`;

    // Day change row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Day Change</td>`;
    comparison.stocks.forEach(stock => {
      const changeColor = stock.dayChangePercent >= 0 ? 'color: green;' : 'color: red;';
      const changeSign = stock.dayChangePercent >= 0 ? '+' : '';
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; ${changeColor}">${changeSign}${stock.dayChangePercent.toFixed(2)}%</td>`;
    });
    response += `</tr>`;

    // Sector row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sector</td>`;
    comparison.stocks.forEach(stock => {
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stock.sector}</td>`;
    });
    response += `</tr>`;

    // Market cap row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Market Cap</td>`;
    comparison.stocks.forEach(stock => {
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${stock.marketCap}</td>`;
    });
    response += `</tr>`;

    // Recommendation row (most important)
    response += `<tr style="background-color: #f0f8ff;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Our Recommendation</td>`;
    comparison.stocks.forEach(stock => {
      let recommendationStyle = '';
      if (stock.recommendation === 'BUY') recommendationStyle = 'background-color: #d4edda; color: #155724; font-weight: bold;';
      else if (stock.recommendation === 'HOLD') recommendationStyle = 'background-color: #fff3cd; color: #856404; font-weight: bold;';
      else recommendationStyle = 'background-color: #f8d7da; color: #721c24; font-weight: bold;';
      
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; ${recommendationStyle}">${stock.recommendation}</td>`;
    });
    response += `</tr>`;

    // Score row
    response += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Investment Score</td>`;
    comparison.stocks.forEach(stock => {
      response += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${stock.score}/100</td>`;
    });
    response += `</tr>`;

    response += `</tbody></table>\n\n`;

    // Individual analysis for each stock
    response += `## 🔍 Individual Stock Analysis\n\n`;
    
    comparison.stocks.forEach((stock, index) => {
      response += `### ${index + 1}. ${stock.name} (${stock.symbol})\n\n`;
      
      response += `**Investment Rating:** `;
      if (stock.recommendation === 'BUY') {
        response += `🟢 **${stock.recommendation}** - Strong investment opportunity\n`;
      } else if (stock.recommendation === 'HOLD') {
        response += `🟡 **${stock.recommendation}** - Maintain current position\n`;
      } else {
        response += `🔴 **${stock.recommendation}** - Consider reducing exposure\n`;
      }
      
      response += `**Price Action:** ₹${stock.currentPrice.toLocaleString('en-IN')} `;
      response += `(${stock.dayChangePercent >= 0 ? '+' : ''}${stock.dayChangePercent.toFixed(2)}% today)\n`;
      response += `**Sector:** ${stock.sector} | **Investment Score:** ${stock.score}/100\n\n`;
      
      if (stock.strengths.length > 0) {
        response += `**✅ Key Strengths:**\n`;
        stock.strengths.forEach(strength => {
          response += `• ${strength}\n`;
        });
        response += '\n';
      }
      
      if (stock.weaknesses.length > 0) {
        response += `**⚠️ Risk Factors:**\n`;
        stock.weaknesses.forEach(weakness => {
          response += `• ${weakness}\n`;
        });
        response += '\n';
      }
    });

    // Final recommendation summary
    response += `## 💡 Final Investment Advice\n\n`;
    
    if (allBuyRecommendations.length > 0) {
      response += `**Recommended Action:** Start building a position in **${topStock.symbol}**\n\n`;
      response += `**Investment Strategy:**\n`;
      response += `• Consider a phased approach (invest 50% now, 50% on any dips)\n`;
      response += `• Set a stop-loss at 8-10% below entry price\n`;
      response += `• Review position after quarterly results\n`;
      response += `• Target holding period: 6-12 months minimum\n\n`;
    } else {
      response += `**Recommended Action:** Wait for better opportunities or HOLD existing positions\n\n`;
      response += `**Current Strategy:**\n`;
      response += `• Market conditions don't favor new investments in these stocks\n`;
      response += `• Consider systematic investment plans (SIP) for long-term goals\n`;
      response += `• Monitor for price corrections or fundamental improvements\n`;
      response += `• Keep cash ready for better entry points\n\n`;
    }

    // Disclaimer
    response += `## ⚠️ Important Disclaimer\n\n`;
    response += `This analysis is based on real-time market data, technical indicators, and fundamental analysis. It's intended for educational purposes only and should not be considered as personal financial advice. `;
    response += `Please consult with a qualified financial advisor and conduct your own research before making any investment decisions. `;
    response += `Past performance does not guarantee future results, and all investments carry risk of loss.`;

    return response;
  }
}