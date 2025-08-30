import { StockAnalysisPreferences } from '../components/ai/StockAnalysisQuestionnaire';
import { StockAnalysisReport } from './investmentAnalysisService';

export interface PersonalizedStockRecommendation {
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  targetPrice?: number;
  stopLoss?: number;
  reasoning: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  actionPlan: {
    immediate: string[];
    longTerm: string[];
  };
  personalizedInsights: string[];
}

export interface PersonalizedAnalysisContext {
  investmentPeriod: 'short-term' | 'long-term';
  currentHolding: 'yes' | 'no';
  riskTolerance: 'low' | 'medium' | 'high';
  stockSymbol: string;
  stockName: string;
}

/**
 * Service for generating personalized stock recommendations based on user profile
 */
export class PersonalizedStockAnalysisService {
  
  /**
   * Generate personalized recommendation based on user preferences and stock analysis
   */
  static generatePersonalizedRecommendation(
    stockAnalysis: StockAnalysisReport,
    preferences: StockAnalysisPreferences
  ): PersonalizedStockRecommendation {
    console.log('🎯 Generating personalized stock recommendation for:', preferences.stockSymbol);
    console.log('📊 User profile:', preferences);
    
    const context: PersonalizedAnalysisContext = {
      investmentPeriod: preferences.investmentPeriod as 'short-term' | 'long-term',
      currentHolding: preferences.currentHolding as 'yes' | 'no',
      riskTolerance: preferences.riskTolerance as 'low' | 'medium' | 'high',
      stockSymbol: preferences.stockSymbol,
      stockName: preferences.stockName
    };
    
    // Analyze based on different factors
    const fundamentalScore = this.analyzeFundamentals(stockAnalysis, context);
    const technicalScore = this.analyzeTechnicals(stockAnalysis, context);
    const riskScore = this.analyzeRisk(stockAnalysis, context);
    const personalizedScore = this.analyzePersonalizedFactors(stockAnalysis, context);
    
    // Calculate overall recommendation
    const overallScore = this.calculateOverallScore(
      fundamentalScore, 
      technicalScore, 
      riskScore, 
      personalizedScore,
      context
    );
    
    // Force decisive recommendations - avoid HOLD bias completely
    let adjustedScore = overallScore;
    
    // Push scores away from the narrow HOLD range (49-50)
    if (overallScore >= 49 && overallScore <= 50) {
      // If exactly in HOLD range, push to BUY or SELL based on slight bias
      if (overallScore >= 49.5) {
        adjustedScore = 51; // Push to BUY
      } else {
        adjustedScore = 48; // Push to SELL  
      }
    }
    
    const recommendation = this.getRecommendationFromScore(adjustedScore);
    console.log(`🎯 Score: ${overallScore} → Adjusted: ${adjustedScore} → Recommendation: ${recommendation}`);
    const confidence = this.calculateConfidence(overallScore, context);
    
    // Generate reasoning and insights
    const reasoning = this.generateReasoning(
      stockAnalysis, 
      context, 
      fundamentalScore, 
      technicalScore, 
      riskScore
    );
    
    const riskAssessment = this.generateRiskAssessment(stockAnalysis, context);
    const actionPlan = this.generateActionPlan(recommendation, context, stockAnalysis);
    const personalizedInsights = this.generatePersonalizedInsights(stockAnalysis, context);
    
    // Calculate target price and stop loss
    const targetPrice = this.calculateTargetPrice(stockAnalysis, recommendation, context);
    const stopLoss = this.calculateStopLoss(stockAnalysis, recommendation, context);
    
    return {
      recommendation,
      confidence,
      targetPrice,
      stopLoss,
      reasoning,
      riskAssessment,
      actionPlan,
      personalizedInsights
    };
  }
  
  /**
   * Analyze fundamental factors with personalized weighting
   */
  private static analyzeFundamentals(
    analysis: StockAnalysisReport, 
    context: PersonalizedAnalysisContext
  ): number {
    let score = 40; // Lower starting point to allow more variation
    
    // PE Ratio analysis - weighted by risk tolerance with stronger signals
    if (analysis.screenerData?.pe) {
      const pe = parseFloat(analysis.screenerData.pe);
      if (context.riskTolerance === 'low') {
        // Conservative investors prefer lower PE
        if (pe < 15) score += 30;  // Increased signal strength
        else if (pe < 25) score += 15;
        else if (pe > 40) score -= 25; // Stronger negative signal
      } else if (context.riskTolerance === 'high') {
        // Aggressive investors focus on growth over valuation - especially for short-term momentum
        if (pe < 10) score += 15; // Might be undervalued
        else if (pe < 30) score += 30; // Stronger positive signal
        else if (pe < 80) score += 15; // Accept higher PE for growth
        else if (pe < 150) score += 5;  // Very high PE but acceptable for momentum plays
        else score -= 10; // Extremely high PE - still risky
      } else { // medium risk tolerance
        if (pe < 20) score += 20;
        else if (pe < 30) score += 10;
        else if (pe > 35) score -= 15;
      }
    }
    
    // ROE analysis - stronger signals for profitability
    if (analysis.screenerData?.roe) {
      const roe = parseFloat(analysis.screenerData.roe);
      if (roe > 25) score += 25;  // Excellent ROE
      else if (roe > 20) score += 20;
      else if (roe > 15) score += 10;
      else if (roe > 10) score += 5;
      else if (roe < 5) score -= 20;  // Poor profitability
      else score -= 10;
    }
    
    // Debt analysis - more important for risk-averse investors
    if (analysis.screenerData?.debtToEquity) {
      const debt = parseFloat(analysis.screenerData.debtToEquity);
      const debtWeight = context.riskTolerance === 'low' ? 15 : 10;
      
      if (debt < 0.3) score += debtWeight;
      else if (debt < 0.6) score += debtWeight / 2;
      else if (debt > 1.0) score -= debtWeight;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Analyze technical factors based on investment period
   */
  private static analyzeTechnicals(
    analysis: StockAnalysisReport, 
    context: PersonalizedAnalysisContext
  ): number {
    let score = 40; // Lower starting point for more range
    
    // Technical analysis is much more important for short-term high-risk investors
    const technicalWeight = context.investmentPeriod === 'short-term' ? 
      (context.riskTolerance === 'high' ? 2.0 : 1.5) : 0.8;
    
    // Check for 30-day performance momentum first - this is crucial for momentum stocks
    if (analysis.technical_analysis?.priceChange30Days) {
      const momentum30Day = analysis.technical_analysis.priceChange30Days;
      if (momentum30Day > 40) score += 50 * technicalWeight;  // Exceptional momentum
      else if (momentum30Day > 25) score += 35 * technicalWeight;
      else if (momentum30Day > 15) score += 25 * technicalWeight;
      else if (momentum30Day > 5) score += 15 * technicalWeight;
      else if (momentum30Day < -15) score -= 25 * technicalWeight;
    }
    
    // Moving averages and daily momentum
    if (analysis.stock_info?.current_price) {
      const currentPrice = analysis.stock_info.current_price;
      
      // Simple trend analysis (this would ideally use real technical indicators)
      if (analysis.stock_info.day_change_percent) {
        const dayChange = analysis.stock_info.day_change_percent;
        
        if (context.investmentPeriod === 'short-term') {
          // Short-term: Recent momentum is crucial - very strong signals
          if (dayChange > 8) score += 40 * technicalWeight;  // Exceptional momentum
          else if (dayChange > 5) score += 30 * technicalWeight;
          else if (dayChange > 3) score += 25 * technicalWeight;
          else if (dayChange > 1) score += 15 * technicalWeight;
          else if (dayChange > 0) score += 8 * technicalWeight;
          else if (dayChange < -5) score -= 25 * technicalWeight;
          else if (dayChange < -3) score -= 15 * technicalWeight;
        } else {
          // Long-term: Focus on sustained trends, not daily volatility
          if (dayChange > 8) score += 10 * technicalWeight;  // Strong move might indicate trend
          else if (dayChange < -8) score -= 8 * technicalWeight;
          // Ignore smaller daily moves for long-term
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Analyze risk factors based on user risk tolerance
   */
  private static analyzeRisk(
    analysis: StockAnalysisReport, 
    context: PersonalizedAnalysisContext
  ): number {
    let score = 40; // Lower starting point for more dynamic scoring
    
    // Volatility assessment (simplified)
    if (analysis.stock_info?.day_change_percent) {
      const dayChange = Math.abs(analysis.stock_info.day_change_percent);
      
      if (context.riskTolerance === 'low') {
        if (dayChange > 5) score -= 20;
        else if (dayChange > 3) score -= 10;
        else if (dayChange < 1) score += 10;
      } else if (context.riskTolerance === 'high') {
        // High-risk investors might see volatility as opportunity
        if (dayChange > 3) score += 5;
      }
    }
    
    // Company size factor
    if (analysis.screenerData?.marketCap) {
      const marketCap = analysis.screenerData.marketCap;
      
      if (context.riskTolerance === 'low') {
        // Prefer large caps
        if (marketCap.includes('₹') && (marketCap.includes('Lakh Cr') || marketCap.includes(',000 Cr'))) {
          score += 15; // Large cap
        }
      } else if (context.riskTolerance === 'high') {
        // May prefer smaller caps for growth
        if (marketCap.includes('₹') && !marketCap.includes('Lakh Cr')) {
          score += 5; // Smaller cap potential
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Analyze personalized factors based on holding status
   */
  private static analyzePersonalizedFactors(
    analysis: StockAnalysisReport, 
    context: PersonalizedAnalysisContext
  ): number {
    let score = 40; // Lower starting point for more variation
    
    // Adjust based on current holding status and risk profile
    if (context.currentHolding === 'yes') {
      // For existing holders, bias slightly towards hold/buy more
      score += 5;
      
      // If fundamentals are strong, encourage holding
      if (analysis.screenerData?.roe && parseFloat(analysis.screenerData.roe) > 15) {
        score += 8;
      }
    } else {
      // For new investors - different approach based on risk tolerance
      if (context.riskTolerance === 'high') {
        // High-risk investors can take advantage of momentum even with high valuations
        if (analysis.technical_analysis?.priceChange30Days && analysis.technical_analysis.priceChange30Days > 30) {
          score += 20; // Boost for exceptional momentum
        }
        if (analysis.stock_info?.day_change_percent && analysis.stock_info.day_change_percent > 5) {
          score += 10; // Additional boost for strong daily performance
        }
      } else {
        // Be cautious about high PE for conservative new entry
        if (analysis.screenerData?.pe && parseFloat(analysis.screenerData.pe) > 30) {
          score -= 5;
        }
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate overall score with personalized weighting
   */
  private static calculateOverallScore(
    fundamental: number,
    technical: number,
    risk: number,
    personalized: number,
    context: PersonalizedAnalysisContext
  ): number {
    let weights = {
      fundamental: 0.4,
      technical: 0.2,
      risk: 0.2,
      personalized: 0.2
    };
    
    // Adjust weights based on investment period
    if (context.investmentPeriod === 'long-term') {
      weights.fundamental = 0.5;
      weights.technical = 0.15;
      weights.risk = 0.2;
      weights.personalized = 0.15;
    } else {
      // For short-term, prioritize technical analysis over fundamentals
      weights.fundamental = 0.25;
      weights.technical = 0.45;  // Increased technical weight
      weights.risk = 0.15;
      weights.personalized = 0.15;
    }
    
    // Adjust weights based on risk tolerance
    if (context.riskTolerance === 'low') {
      weights.risk = 0.3;
      weights.fundamental = 0.4;
      weights.technical = 0.15;
      weights.personalized = 0.15;
    } else if (context.riskTolerance === 'high') {
      // High-risk investors care more about momentum than fundamentals
      weights.fundamental = 0.2;
      weights.technical = 0.5;   // Prioritize technical signals
      weights.risk = 0.15;
      weights.personalized = 0.15;
    }
    
    const overallScore = 
      fundamental * weights.fundamental +
      technical * weights.technical +
      risk * weights.risk +
      personalized * weights.personalized;
    
    return Math.round(overallScore);
  }
  
  /**
   * Convert numerical score to recommendation - Almost eliminate HOLD completely
   */
  private static getRecommendationFromScore(score: number): PersonalizedStockRecommendation['recommendation'] {
    if (score >= 65) return 'STRONG_BUY';
    if (score >= 51) return 'BUY';
    if (score >= 49 && score <= 50) return 'HOLD';  // Only 2-point range - extremely rare
    if (score >= 30) return 'SELL';
    return 'STRONG_SELL';
  }
  
  /**
   * Calculate confidence based on data availability and score
   */
  private static calculateConfidence(score: number, context: PersonalizedAnalysisContext): number {
    let confidence = 70; // Base confidence
    
    // Boost confidence if we have clear signals
    if (score > 75 || score < 25) confidence += 15;
    
    // Reduce confidence for edge cases
    if (score >= 35 && score <= 65) confidence -= 10;
    
    return Math.max(60, Math.min(95, confidence));
  }
  
  /**
   * Generate detailed reasoning based on analysis
   */
  private static generateReasoning(
    analysis: StockAnalysisReport,
    context: PersonalizedAnalysisContext,
    fundamentalScore: number,
    technicalScore: number,
    riskScore: number
  ): string[] {
    const reasoning: string[] = [];
    
    // Fundamental reasoning
    if (fundamentalScore > 65) {
      reasoning.push(`Strong fundamentals with solid financial metrics suit your ${context.riskTolerance}-risk profile`);
    } else if (fundamentalScore < 35) {
      reasoning.push(`Weak fundamentals pose risks that may not align with your ${context.riskTolerance}-risk tolerance`);
    }
    
    // Technical reasoning
    if (context.investmentPeriod === 'short-term') {
      if (technicalScore > 60) {
        reasoning.push(`Technical indicators show positive momentum suitable for short-term investment horizon`);
      } else if (technicalScore < 40) {
        reasoning.push(`Technical weakness suggests caution for your short-term investment timeline`);
      }
    }
    
    // Holding status reasoning
    if (context.currentHolding === 'yes') {
      reasoning.push(`As an existing holder, consider your current position size and averaging strategy`);
    } else {
      reasoning.push(`For new entry, timing and entry price are crucial factors to consider`);
    }
    
    // Risk-specific reasoning
    if (context.riskTolerance === 'low' && riskScore < 50) {
      reasoning.push(`Current volatility levels may be higher than comfortable for conservative investors`);
    }
    
    return reasoning;
  }
  
  /**
   * Generate risk assessment
   */
  private static generateRiskAssessment(
    analysis: StockAnalysisReport,
    context: PersonalizedAnalysisContext
  ): PersonalizedStockRecommendation['riskAssessment'] {
    const factors: string[] = [];
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    
    // Assess based on volatility
    if (analysis.stock_info?.day_change_percent) {
      const dayChange = Math.abs(analysis.stock_info.day_change_percent);
      if (dayChange > 4) {
        factors.push(`High daily volatility (${dayChange.toFixed(1)}%)`);
        level = 'HIGH';
      } else if (dayChange < 1) {
        factors.push(`Low daily volatility (${dayChange.toFixed(1)}%)`);
        level = 'LOW';
      }
    }
    
    // Assess based on PE ratio
    if (analysis.screenerData?.pe) {
      const pe = parseFloat(analysis.screenerData.pe);
      if (pe > 40) {
        factors.push(`High valuation (PE: ${pe})`);
        level = 'HIGH';
      } else if (pe < 15) {
        factors.push(`Conservative valuation (PE: ${pe})`);
      }
    }
    
    // Debt assessment
    if (analysis.screenerData?.debtToEquity) {
      const debt = parseFloat(analysis.screenerData.debtToEquity);
      if (debt > 1.0) {
        factors.push(`High debt levels (D/E: ${debt})`);
        level = 'HIGH';
      }
    }
    
    return { level, factors };
  }
  
  /**
   * Generate actionable plan
   */
  private static generateActionPlan(
    recommendation: PersonalizedStockRecommendation['recommendation'],
    context: PersonalizedAnalysisContext,
    analysis: StockAnalysisReport
  ): PersonalizedStockRecommendation['actionPlan'] {
    const immediate: string[] = [];
    const longTerm: string[] = [];
    
    const currentPrice = analysis.stock_info?.current_price || 0;
    
    switch (recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        if (context.currentHolding === 'no') {
          immediate.push(`Consider initiating position at current levels around ₹${currentPrice}`);
          if (context.investmentPeriod === 'short-term') {
            immediate.push(`Set target profit level at 15-25% for short-term gains`);
          }
        } else {
          immediate.push(`Consider adding to existing position if within risk limits`);
        }
        longTerm.push(`Monitor quarterly results and sector developments`);
        break;
        
      case 'HOLD':
        if (context.currentHolding === 'yes') {
          immediate.push(`Maintain current position and avoid panic selling`);
          immediate.push(`Review position size to ensure it aligns with portfolio allocation`);
        } else {
          immediate.push(`Wait for better entry opportunity or more favorable market conditions`);
        }
        longTerm.push(`Re-evaluate position based on next quarter's performance`);
        break;
        
      case 'SELL':
      case 'STRONG_SELL':
        if (context.currentHolding === 'yes') {
          immediate.push(`Consider reducing position size or complete exit`);
          immediate.push(`Review exit strategy to minimize tax implications`);
        }
        immediate.push(`Avoid new investments until fundamentals improve`);
        break;
    }
    
    return { immediate, longTerm };
  }
  
  /**
   * Generate personalized insights
   */
  private static generatePersonalizedInsights(
    analysis: StockAnalysisReport,
    context: PersonalizedAnalysisContext
  ): string[] {
    const insights: string[] = [];
    
    // Risk tolerance insights
    if (context.riskTolerance === 'low') {
      insights.push(`As a conservative investor, focus on dividend yield and debt levels`);
      insights.push(`Consider position sizing - limit single stock exposure to 5-8% of portfolio`);
    } else if (context.riskTolerance === 'high') {
      insights.push(`Your high risk tolerance allows for larger position sizes and growth focus`);
      insights.push(`Consider using volatility as an opportunity for strategic entries`);
    }
    
    // Time horizon insights
    if (context.investmentPeriod === 'short-term') {
      insights.push(`For short-term trades, focus on technical levels and market sentiment`);
      insights.push(`Set clear profit targets and stop-losses before entering`);
    } else {
      insights.push(`Long-term focus allows you to ride out short-term volatility`);
      insights.push(`Focus on business fundamentals rather than daily price movements`);
    }
    
    // Holding status insights
    if (context.currentHolding === 'yes') {
      insights.push(`Review your average cost and consider tax implications of any actions`);
      insights.push(`Avoid emotional decisions - stick to your original investment thesis`);
    } else {
      insights.push(`As a new investment, ensure this fits your overall portfolio strategy`);
      insights.push(`Consider starting with a smaller position and averaging in over time`);
    }
    
    return insights;
  }
  
  /**
   * Calculate target price based on analysis and user profile
   */
  private static calculateTargetPrice(
    analysis: StockAnalysisReport,
    recommendation: PersonalizedStockRecommendation['recommendation'],
    context: PersonalizedAnalysisContext
  ): number | undefined {
    const currentPrice = analysis.stock_info?.current_price;
    if (!currentPrice) return undefined;
    
    let targetMultiplier = 1.0;
    
    switch (recommendation) {
      case 'STRONG_BUY':
        targetMultiplier = context.investmentPeriod === 'long-term' ? 1.3 : 1.2;
        break;
      case 'BUY':
        targetMultiplier = context.investmentPeriod === 'long-term' ? 1.2 : 1.15;
        break;
      case 'HOLD':
        targetMultiplier = 1.1;
        break;
      default:
        return undefined;
    }
    
    return Math.round(currentPrice * targetMultiplier);
  }
  
  /**
   * Calculate stop loss based on risk tolerance
   */
  private static calculateStopLoss(
    analysis: StockAnalysisReport,
    recommendation: PersonalizedStockRecommendation['recommendation'],
    context: PersonalizedAnalysisContext
  ): number | undefined {
    const currentPrice = analysis.stock_info?.current_price;
    if (!currentPrice || recommendation === 'SELL' || recommendation === 'STRONG_SELL') {
      return undefined;
    }
    
    let stopLossMultiplier = 0.9; // Default 10% stop loss
    
    // Adjust based on risk tolerance
    if (context.riskTolerance === 'low') {
      stopLossMultiplier = 0.95; // 5% stop loss for conservative investors
    } else if (context.riskTolerance === 'high') {
      stopLossMultiplier = 0.85; // 15% stop loss for aggressive investors
    }
    
    // Adjust based on investment period
    if (context.investmentPeriod === 'long-term') {
      stopLossMultiplier -= 0.05; // Wider stops for long-term
    }
    
    return Math.round(currentPrice * stopLossMultiplier);
  }
  
  /**
   * Format personalized recommendation for display
   */
  static formatPersonalizedRecommendation(
    personalizedRec: PersonalizedStockRecommendation,
    context: PersonalizedAnalysisContext,
    originalAnalysis: StockAnalysisReport
  ): string {
    const stock = originalAnalysis.stock_info;
    const tech = originalAnalysis.technical_analysis;
    const risk = originalAnalysis.risk_analysis;
    
    // Use personalized recommendation instead of original
    const personalizedRecommendation = {
      action: personalizedRec.recommendation,
      confidence: personalizedRec.confidence,
      time_horizon: context.investmentPeriod === 'short-term' ? 'SHORT_TERM' : 'LONG_TERM',
      target_price: personalizedRec.targetPrice,
      stop_loss: personalizedRec.stopLoss,
      reasoning: personalizedRec.reasoning
    };
    
    let response = `# 📊 ${stock.company_name} (${stock.symbol}) Analysis\n\n`;
    
    // Current Price and Change
    response += `## 💰 Current Market Data\n`;
    response += `**Current Price:** ₹${stock.current_price}\n`;
    response += `**Day Change:** ${stock.day_change >= 0 ? '+' : ''}₹${stock.day_change.toFixed(2)} (${stock.day_change_percent >= 0 ? '+' : ''}${stock.day_change_percent.toFixed(2)}%)\n`;
    response += `**Sector:** ${stock.sector} | **Market Cap:** ${stock.market_cap}\n\n`;
    
    // Add personalized profile section
    response += `## 👤 Your Investment Profile\n`;
    response += `**Investment Period:** ${context.investmentPeriod === 'short-term' ? 'Short-term (1-12 months)' : 'Long-term (1+ years)'}\n`;
    response += `**Current Holding:** ${context.currentHolding === 'yes' ? 'Yes - You own this stock' : 'No - New investment consideration'}\n`;
    response += `**Risk Tolerance:** ${context.riskTolerance.charAt(0).toUpperCase() + context.riskTolerance.slice(1)} Risk\n\n`;
    
    // Personalized Recommendation
    response += `## 🎯 Personalized Recommendation\n`;
    response += `**Action:** ${personalizedRecommendation.action} (${personalizedRecommendation.confidence}% confidence)\n`;
    response += `**Time Horizon:** ${personalizedRecommendation.time_horizon.replace('_', ' ')}\n`;
    
    if (personalizedRecommendation.target_price) {
      response += `**Target Price:** ₹${personalizedRecommendation.target_price.toFixed(2)}\n`;
    }
    if (personalizedRecommendation.stop_loss) {
      response += `**Stop Loss:** ₹${personalizedRecommendation.stop_loss.toFixed(2)}\n`;
    }
    response += '\n';
    
    // Enhanced Reasoning with personalized insights
    response += `### 📝 Key Reasoning:\n`;
    personalizedRec.reasoning.forEach((reason, index) => {
      response += `${index + 1}. ${reason}\n`;
    });
    response += '\n';
    
    // Add personalized insights as Key Analysis
    if (personalizedRec.personalizedInsights.length > 0) {
      response += `## 🎯 Key Personalized Analysis\n`;
      personalizedRec.personalizedInsights.forEach((insight, index) => {
        response += `• ${insight}\n`;
      });
      response += '\n';
    }
    
    // Technical Analysis (original format)
    if (tech) {
      response += `## 📈 Technical Analysis\n`;
      response += `**Trend:** ${tech.trend} | **RSI:** ${tech.rsi.toFixed(1)}\n`;
      response += `**Support:** ₹${tech.support} | **Resistance:** ₹${tech.resistance}\n`;
      response += `**30-Day Performance:** ${tech.priceChange30Days >= 0 ? '+' : ''}${tech.priceChange30Days.toFixed(1)}%\n`;
      response += `**Volatility:** ${tech.volatility.toFixed(1)}%\n\n`;
    }
    
    // Personalized Risk Assessment
    response += `## ⚠️ Personalized Risk Assessment\n`;
    response += `**Risk Level:** ${personalizedRec.riskAssessment.level}\n`;
    response += `**Key Risks for Your Profile:**\n`;
    personalizedRec.riskAssessment.factors.forEach((riskFactor, index) => {
      response += `• ${riskFactor}\n`;
    });
    response += '\n';
    
    // Action Plan
    if (personalizedRec.actionPlan.immediate.length > 0) {
      response += `## 📋 Personalized Action Plan\n`;
      response += `**Immediate Actions:**\n`;
      personalizedRec.actionPlan.immediate.forEach((action, index) => {
        response += `• ${action}\n`;
      });
      
      if (personalizedRec.actionPlan.longTerm.length > 0) {
        response += `\n**Long-term Considerations:**\n`;
        personalizedRec.actionPlan.longTerm.forEach((action, index) => {
          response += `• ${action}\n`;
        });
      }
      response += '\n';
    }
    
    // Add news sentiment and web research (original format)
    if (originalAnalysis.news_sentiment.key_news.length > 0 || (originalAnalysis.web_research && originalAnalysis.web_research.search_results.length > 0)) {
      if (originalAnalysis.news_sentiment.key_news.length > 0) {
        response += `## 📰 Recent News Sentiment: ${originalAnalysis.news_sentiment.overall_sentiment}\n`;
        originalAnalysis.news_sentiment.key_news.slice(0, 3).forEach((news, index) => {
          response += `${index + 1}. **${news.sentiment}**: ${news.headline}\n`;
        });
        response += '\n';
      }
      
      if (originalAnalysis.web_research && originalAnalysis.web_research.search_results.length > 0) {
        response += `## 🌐 Market Research Sources\n`;
        response += `Based on comprehensive web research using ${originalAnalysis.web_research.search_queries.length} search queries:\n\n`;
      }
    }
    
    response += `\n---\n*This analysis is personalized for your investment profile: ${context.investmentPeriod} investor with ${context.riskTolerance} risk tolerance.*`;
    
    return response;
  }
}