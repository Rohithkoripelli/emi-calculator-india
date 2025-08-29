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
    
    const recommendation = this.getRecommendationFromScore(overallScore);
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
    let score = 50; // Neutral starting point
    
    // PE Ratio analysis - weighted by risk tolerance
    if (analysis.screenerData?.pe) {
      const pe = parseFloat(analysis.screenerData.pe);
      if (context.riskTolerance === 'low') {
        // Conservative investors prefer lower PE
        if (pe < 15) score += 20;
        else if (pe < 25) score += 10;
        else if (pe > 40) score -= 15;
      } else if (context.riskTolerance === 'high') {
        // Aggressive investors may accept higher PE for growth
        if (pe < 10) score += 5; // Might be undervalued
        else if (pe < 30) score += 15;
        else if (pe < 50) score += 5;
      }
    }
    
    // ROE analysis
    if (analysis.screenerData?.roe) {
      const roe = parseFloat(analysis.screenerData.roe);
      if (roe > 20) score += 15;
      else if (roe > 15) score += 10;
      else if (roe < 10) score -= 10;
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
    let score = 50;
    
    // Technical analysis is more important for short-term investors
    const technicalWeight = context.investmentPeriod === 'short-term' ? 1.5 : 0.8;
    
    // Moving averages
    if (analysis.stock_info?.current_price) {
      const currentPrice = analysis.stock_info.current_price;
      
      // Simple trend analysis (this would ideally use real technical indicators)
      if (analysis.stock_info.day_change_percent) {
        const dayChange = analysis.stock_info.day_change_percent;
        
        if (context.investmentPeriod === 'short-term') {
          // Short-term: Recent momentum is important
          if (dayChange > 2) score += 15 * technicalWeight;
          else if (dayChange > 0) score += 8 * technicalWeight;
          else if (dayChange < -3) score -= 12 * technicalWeight;
        } else {
          // Long-term: Don't overreact to daily changes
          if (dayChange > 5) score += 5 * technicalWeight;
          else if (dayChange < -5) score -= 3 * technicalWeight;
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
    let score = 50;
    
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
    let score = 50;
    
    // Adjust based on current holding status
    if (context.currentHolding === 'yes') {
      // For existing holders, bias slightly towards hold/buy more
      score += 5;
      
      // If fundamentals are strong, encourage holding
      if (analysis.screenerData?.roe && parseFloat(analysis.screenerData.roe) > 15) {
        score += 8;
      }
    } else {
      // For new investors, be more selective
      if (analysis.screenerData?.pe && parseFloat(analysis.screenerData.pe) > 30) {
        score -= 5; // Be cautious about high PE for new entry
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
      weights.fundamental = 0.3;
      weights.technical = 0.35;
      weights.risk = 0.2;
      weights.personalized = 0.15;
    }
    
    // Adjust weights based on risk tolerance
    if (context.riskTolerance === 'low') {
      weights.risk = 0.3;
      weights.fundamental = 0.4;
      weights.technical = 0.15;
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
   * Convert numerical score to recommendation
   */
  private static getRecommendationFromScore(score: number): PersonalizedStockRecommendation['recommendation'] {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 65) return 'BUY';
    if (score >= 40) return 'HOLD';
    if (score >= 25) return 'SELL';
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
    const { recommendation, confidence, targetPrice, stopLoss, reasoning, riskAssessment, actionPlan, personalizedInsights } = personalizedRec;
    
    const currentPrice = originalAnalysis.stock_info?.current_price || 0;
    const recommendationEmoji = {
      'STRONG_BUY': '🚀',
      'BUY': '✅',
      'HOLD': '⏸️',
      'SELL': '⚠️',
      'STRONG_SELL': '🛑'
    }[recommendation];
    
    return `# ${recommendationEmoji} Personalized Investment Recommendation

## 🎯 **${recommendation}** - ${confidence}% Confidence

### 📊 **Your Investment Profile**
- **Investment Period**: ${context.investmentPeriod === 'short-term' ? 'Short-term (1-12 months)' : 'Long-term (1+ years)'}
- **Current Holding**: ${context.currentHolding === 'yes' ? 'Yes - You own this stock' : 'No - New investment consideration'}
- **Risk Tolerance**: ${context.riskTolerance.charAt(0).toUpperCase() + context.riskTolerance.slice(1)} Risk

### 💰 **Price Targets & Risk Management**
- **Current Price**: ₹${currentPrice.toLocaleString('en-IN')}
${targetPrice ? `- **Target Price**: ₹${targetPrice.toLocaleString('en-IN')} (${Math.round(((targetPrice - currentPrice) / currentPrice) * 100)}% upside)` : ''}
${stopLoss ? `- **Stop Loss**: ₹${stopLoss.toLocaleString('en-IN')} (${Math.round(((currentPrice - stopLoss) / currentPrice) * 100)}% downside protection)` : ''}

### 🧠 **Personalized Analysis**
${reasoning.map(reason => `• ${reason}`).join('\n')}

### ⚖️ **Risk Assessment: ${riskAssessment.level} RISK**
${riskAssessment.factors.map(factor => `• ${factor}`).join('\n')}

### 📋 **Action Plan**

#### **Immediate Actions**
${actionPlan.immediate.map(action => `• ${action}`).join('\n')}

#### **Long-term Strategy**
${actionPlan.longTerm.map(action => `• ${action}`).join('\n')}

### 💡 **Personalized Insights for You**
${personalizedInsights.map(insight => `• ${insight}`).join('\n')}

### ⚠️ **Important Disclaimers**
- This recommendation is personalized based on your stated preferences
- Consider your complete financial situation before making investment decisions
- Stock markets are subject to risks; past performance doesn't guarantee future results
- Consider consulting with a financial advisor for comprehensive portfolio advice
- Review and update your investment thesis regularly based on changing circumstances

*This analysis is tailored specifically for your investment profile: ${context.riskTolerance} risk tolerance, ${context.investmentPeriod} investment horizon, ${context.currentHolding === 'yes' ? 'existing holder' : 'potential new investor'}.*`;
  }
}