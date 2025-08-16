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

    // Mobile-responsive comparison section
    response += `## 📈 Detailed Stock Comparison\n\n`;
    
    // Mobile-first: Card layout for small screens
    response += `<div style="display: block;">`;
    
    // Desktop table (hidden on mobile)
    response += `<div style="display: none;" class="desktop-table">
<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 14px;">
<thead style="background-color: #f8f9fa;">
<tr>
<th style="padding: 8px; text-align: left; border: 1px solid #ddd; min-width: 120px;">Metric</th>`;
    
    comparison.stocks.forEach(stock => {
      response += `<th style="padding: 8px; text-align: center; border: 1px solid #ddd; min-width: 120px;">${stock.symbol}</th>`;
    });
    response += `</tr>
</thead>
<tbody>`;

    // Table rows for desktop
    const tableRows = [
      { label: 'Company', values: comparison.stocks.map(s => s.name) },
      { label: 'Current Price', values: comparison.stocks.map(s => `₹${s.currentPrice.toLocaleString('en-IN')}`) },
      { 
        label: 'Day Change', 
        values: comparison.stocks.map(s => ({
          value: `${s.dayChangePercent >= 0 ? '+' : ''}${s.dayChangePercent.toFixed(2)}%`,
          style: s.dayChangePercent >= 0 ? 'color: #28a745;' : 'color: #dc3545;'
        }))
      },
      { label: 'Sector', values: comparison.stocks.map(s => s.sector) },
      { label: 'Market Cap', values: comparison.stocks.map(s => s.marketCap) },
      { 
        label: 'Our Recommendation', 
        values: comparison.stocks.map(s => ({
          value: s.recommendation,
          style: s.recommendation === 'BUY' ? 'background-color: #d4edda; color: #155724; font-weight: bold;' :
                 s.recommendation === 'HOLD' ? 'background-color: #fff3cd; color: #856404; font-weight: bold;' :
                 'background-color: #f8d7da; color: #721c24; font-weight: bold;'
        }))
      },
      { label: 'Investment Score', values: comparison.stocks.map(s => `${s.score}/100`) }
    ];

    tableRows.forEach(row => {
      response += `<tr><td style="padding: 6px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">${row.label}</td>`;
      row.values.forEach(value => {
        if (typeof value === 'object' && value.style) {
          response += `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; ${value.style}">${value.value}</td>`;
        } else {
          response += `<td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${value}</td>`;
        }
      });
      response += `</tr>`;
    });

    response += `</tbody></table>
</div>`;

    // Mobile card layout
    response += `<div class="mobile-cards" style="display: block;">`;
    
    comparison.stocks.forEach((stock, index) => {
      const changeColor = stock.dayChangePercent >= 0 ? '#28a745' : '#dc3545';
      const changeSign = stock.dayChangePercent >= 0 ? '+' : '';
      let recommendationBg = '#6c757d';
      let recommendationColor = 'white';
      
      if (stock.recommendation === 'BUY') {
        recommendationBg = '#28a745';
        recommendationColor = 'white';
      } else if (stock.recommendation === 'HOLD') {
        recommendationBg = '#ffc107';
        recommendationColor = '#212529';
      } else if (stock.recommendation === 'SELL') {
        recommendationBg = '#dc3545';
        recommendationColor = 'white';
      }

      response += `
<div style="
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <h4 style="margin: 0; color: #212529; font-size: 16px; font-weight: bold;">${stock.symbol}</h4>
    <span style="
      background: ${recommendationBg};
      color: ${recommendationColor};
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    ">${stock.recommendation}</span>
  </div>
  
  <div style="margin-bottom: 8px;">
    <span style="color: #6c757d; font-size: 14px;">${stock.name}</span>
  </div>
  
  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
    <span style="font-weight: 600; font-size: 18px;">₹${stock.currentPrice.toLocaleString('en-IN')}</span>
    <span style="color: ${changeColor}; font-weight: 600; font-size: 14px;">${changeSign}${stock.dayChangePercent.toFixed(2)}%</span>
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: #6c757d;">
    <div><strong>Sector:</strong> ${stock.sector}</div>
    <div><strong>Score:</strong> ${stock.score}/100</div>
    <div style="grid-column: 1 / -1;"><strong>Market Cap:</strong> ${stock.marketCap}</div>
  </div>
</div>`;
    });
    
    response += `</div>`;
    response += `</div>`;

    // Add responsive CSS
    response += `
<style>
@media (min-width: 768px) {
  .desktop-table { display: block !important; }
  .mobile-cards { display: none !important; }
}
@media (max-width: 767px) {
  .desktop-table { display: none !important; }
  .mobile-cards { display: block !important; }
}
</style>

`;

    // Individual analysis for each stock - optimized for mobile
    response += `## 🔍 Individual Stock Analysis\n\n`;
    
    comparison.stocks.forEach((stock, index) => {
      // Mobile-friendly stock analysis cards
      const ratingIcon = stock.recommendation === 'BUY' ? '🟢' : stock.recommendation === 'HOLD' ? '🟡' : '🔴';
      const ratingText = stock.recommendation === 'BUY' ? 'Strong Buy Opportunity' : 
                        stock.recommendation === 'HOLD' ? 'Hold Current Position' : 'Consider Reducing Exposure';
      
      response += `
<div style="
  background: #ffffff;
  border: 2px solid ${stock.recommendation === 'BUY' ? '#28a745' : stock.recommendation === 'HOLD' ? '#ffc107' : '#dc3545'};
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <h3 style="margin: 0; color: #212529; font-size: 18px; font-weight: bold; flex: 1; min-width: 200px;">${index + 1}. ${stock.name}</h3>
    <span style="font-size: 14px; color: #6c757d; margin-top: 4px;">(${stock.symbol})</span>
  </div>
  
  <div style="display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
    <span style="font-size: 16px; margin-right: 8px;">${ratingIcon}</span>
    <strong style="color: ${stock.recommendation === 'BUY' ? '#28a745' : stock.recommendation === 'HOLD' ? '#f57c00' : '#dc3545'}; font-size: 16px;">
      ${stock.recommendation}
    </strong>
    <span style="color: #6c757d; margin-left: 8px; font-size: 14px;">- ${ratingText}</span>
  </div>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; padding: 12px; background-color: #f8f9fa; border-radius: 8px;">
    <div>
      <strong style="color: #495057; font-size: 14px;">Current Price</strong><br>
      <span style="font-size: 18px; font-weight: bold; color: #212529;">₹${stock.currentPrice.toLocaleString('en-IN')}</span>
    </div>
    <div>
      <strong style="color: #495057; font-size: 14px;">Day Change</strong><br>
      <span style="font-size: 16px; font-weight: bold; color: ${stock.dayChangePercent >= 0 ? '#28a745' : '#dc3545'};">
        ${stock.dayChangePercent >= 0 ? '+' : ''}${stock.dayChangePercent.toFixed(2)}%
      </span>
    </div>
    <div>
      <strong style="color: #495057; font-size: 14px;">Sector</strong><br>
      <span style="font-size: 14px; color: #212529;">${stock.sector}</span>
    </div>
    <div>
      <strong style="color: #495057; font-size: 14px;">Investment Score</strong><br>
      <span style="font-size: 16px; font-weight: bold; color: #212529;">${stock.score}/100</span>
    </div>
  </div>`;

      if (stock.strengths.length > 0) {
        response += `
  <div style="margin-bottom: 12px;">
    <h4 style="color: #28a745; font-size: 14px; margin: 0 0 8px 0; display: flex; align-items: center;">
      <span style="margin-right: 6px;">✅</span> Key Strengths
    </h4>
    <ul style="margin: 0; padding-left: 16px; color: #495057; font-size: 13px; line-height: 1.5;">`;
        stock.strengths.forEach(strength => {
          response += `<li style="margin-bottom: 4px;">${strength}</li>`;
        });
        response += `</ul>
  </div>`;
      }
      
      if (stock.weaknesses.length > 0) {
        response += `
  <div>
    <h4 style="color: #dc3545; font-size: 14px; margin: 0 0 8px 0; display: flex; align-items: center;">
      <span style="margin-right: 6px;">⚠️</span> Risk Factors
    </h4>
    <ul style="margin: 0; padding-left: 16px; color: #495057; font-size: 13px; line-height: 1.5;">`;
        stock.weaknesses.forEach(weakness => {
          response += `<li style="margin-bottom: 4px;">${weakness}</li>`;
        });
        response += `</ul>
  </div>`;
      }
      
      response += `</div>\n\n`;
    });

    // Final recommendation summary - mobile optimized
    response += `## 💡 Final Investment Advice\n\n`;
    
    if (allBuyRecommendations.length > 0) {
      response += `
<div style="
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 2px solid #28a745;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
">
  <h3 style="color: #155724; margin: 0 0 12px 0; font-size: 18px; display: flex; align-items: center;">
    <span style="margin-right: 8px;">🎯</span> Recommended Action
  </h3>
  <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #155724;">
    Start building a position in <strong>${topStock.symbol}</strong>
  </p>
  
  <h4 style="color: #155724; margin: 16px 0 8px 0; font-size: 16px;">📋 Investment Strategy:</h4>
  <div style="display: grid; gap: 8px; font-size: 14px; color: #155724;">
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">1.</span>
      <span>Consider a phased approach (invest 50% now, 50% on any dips)</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">2.</span>
      <span>Set a stop-loss at 8-10% below entry price</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">3.</span>
      <span>Review position after quarterly results</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">4.</span>
      <span>Target holding period: 6-12 months minimum</span>
    </div>
  </div>
</div>`;
    } else {
      response += `
<div style="
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
">
  <h3 style="color: #856404; margin: 0 0 12px 0; font-size: 18px; display: flex; align-items: center;">
    <span style="margin-right: 8px;">⏳</span> Recommended Action
  </h3>
  <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #856404;">
    Wait for better opportunities or HOLD existing positions
  </p>
  
  <h4 style="color: #856404; margin: 16px 0 8px 0; font-size: 16px;">📋 Current Strategy:</h4>
  <div style="display: grid; gap: 8px; font-size: 14px; color: #856404;">
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">1.</span>
      <span>Market conditions don't favor new investments in these stocks</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">2.</span>
      <span>Consider systematic investment plans (SIP) for long-term goals</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">3.</span>
      <span>Monitor for price corrections or fundamental improvements</span>
    </div>
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-weight: bold;">4.</span>
      <span>Keep cash ready for better entry points</span>
    </div>
  </div>
</div>`;
    }

    // Disclaimer
    response += `## ⚠️ Important Disclaimer\n\n`;
    response += `This analysis is based on real-time market data, technical indicators, and fundamental analysis. It's intended for educational purposes only and should not be considered as personal financial advice. `;
    response += `Please consult with a qualified financial advisor and conduct your own research before making any investment decisions. `;
    response += `Past performance does not guarantee future results, and all investments carry risk of loss.`;

    return response;
  }
}