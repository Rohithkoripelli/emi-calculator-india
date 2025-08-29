import { InvestmentPreferences } from '../components/ai/InvestmentQuestionnaire';
import { GrowwApiService } from './growwApiService';

export interface SectorStock {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  targetPrice?: number;
  allocationPercentage: number; // Percentage allocation in portfolio
  investmentAmount: number; // Actual rupees to invest in this stock
  sharesToBuy: number; // Number of shares to buy (can be fractional for SIP)
}

export interface TailoredRecommendation {
  totalAmount: number;
  investmentHorizon: string;
  frequency: string;
  selectedSectors: string[];
  portfolioAllocation: SectorStock[];
  investmentStrategy: string;
  riskProfile: 'LOW' | 'MODERATE' | 'HIGH';
  monthlyInvestment?: number;
  expectedReturns: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  recommendations: string[];
}

/**
 * Sector-wise stock recommendations based on current market analysis
 */
const SECTOR_STOCKS = {
  banking: [
    { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', weight: 30 },
    { symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited', weight: 25 },
    { symbol: 'AXISBANK', companyName: 'Axis Bank Limited', weight: 20 },
    { symbol: 'SBIN', companyName: 'State Bank of India', weight: 15 },
    { symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank', weight: 10 }
  ],
  it: [
    { symbol: 'TCS', companyName: 'Tata Consultancy Services', weight: 35 },
    { symbol: 'INFY', companyName: 'Infosys Limited', weight: 25 },
    { symbol: 'WIPRO', companyName: 'Wipro Limited', weight: 20 },
    { symbol: 'HCLTECH', companyName: 'HCL Technologies', weight: 20 }
  ],
  pharmaceuticals: [
    { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries', weight: 35 },
    { symbol: 'DRREDDY', companyName: 'Dr. Reddy\'s Laboratories', weight: 30 },
    { symbol: 'CIPLA', companyName: 'Cipla Limited', weight: 25 },
    { symbol: 'AUROPHARMA', companyName: 'Aurobindo Pharma Limited', weight: 10 }
  ],
  fmcg: [
    { symbol: 'HINDUNILVR', companyName: 'Hindustan Unilever Limited', weight: 40 },
    { symbol: 'NESTLEIND', companyName: 'Nestle India Limited', weight: 30 },
    { symbol: 'ITC', companyName: 'ITC Limited', weight: 20 },
    { symbol: 'BRITANNIA', companyName: 'Britannia Industries', weight: 10 }
  ],
  energy: [
    { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', weight: 50 },
    { symbol: 'ONGC', companyName: 'Oil & Natural Gas Corporation', weight: 25 },
    { symbol: 'IOC', companyName: 'Indian Oil Corporation', weight: 15 },
    { symbol: 'BPCL', companyName: 'Bharat Petroleum Corporation', weight: 10 }
  ],
  automobile: [
    { symbol: 'MARUTI', companyName: 'Maruti Suzuki India Limited', weight: 35 },
    { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', weight: 25 },
    { symbol: 'M&M', companyName: 'Mahindra & Mahindra Limited', weight: 20 },
    { symbol: 'BAJAJ-AUTO', companyName: 'Bajaj Auto Limited', weight: 20 }
  ],
  defence: [
    { symbol: 'HAL', companyName: 'Hindustan Aeronautics Limited', weight: 35 },
    { symbol: 'BEL', companyName: 'Bharat Electronics Limited', weight: 30 },
    { symbol: 'COCHINSHIP', companyName: 'Cochin Shipyard Limited', weight: 25 },
    { symbol: 'BEML', companyName: 'BEML Limited', weight: 10 }
  ],
  psu: [
    { symbol: 'NTPC', companyName: 'NTPC Limited', weight: 30 },
    { symbol: 'COALINDIA', companyName: 'Coal India Limited', weight: 25 },
    { symbol: 'SAIL', companyName: 'Steel Authority of India', weight: 20 },
    { symbol: 'BHEL', companyName: 'Bharat Heavy Electricals', weight: 25 }
  ],
  infrastructure: [
    { symbol: 'LT', companyName: 'Larsen & Toubro Limited', weight: 40 },
    { symbol: 'ULTRACEMCO', companyName: 'UltraTech Cement Limited', weight: 30 },
    { symbol: 'ADANIPORTS', companyName: 'Adani Ports & SEZ Limited', weight: 20 },
    { symbol: 'GRASIM', companyName: 'Grasim Industries Limited', weight: 10 }
  ],
  telecom: [
    { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Limited', weight: 60 },
    { symbol: 'IDEA', companyName: 'Vodafone Idea Limited', weight: 25 },
    { symbol: 'RJIO', companyName: 'Reliance Jio (Reliance Industries)', weight: 15 }
  ]
};

/**
 * Generate tailored investment recommendations based on user preferences
 */
export class TailoredInvestmentService {
  /**
   * Create personalized investment recommendations
   */
  static async generateTailoredRecommendation(
    preferences: InvestmentPreferences,
    originalQuery: string
  ): Promise<TailoredRecommendation> {
    console.log('🎯 Generating tailored investment recommendation:', preferences);

    // Determine risk profile based on investment horizon and preferences
    const riskProfile = this.determineRiskProfile(preferences);
    
    // Generate portfolio allocation
    const portfolioAllocation = await this.generatePortfolioAllocation(preferences, riskProfile);
    
    // Calculate expected returns
    const expectedReturns = this.calculateExpectedReturns(preferences.amount, riskProfile);
    
    // Generate investment strategy
    const investmentStrategy = this.generateInvestmentStrategy(preferences, riskProfile);
    
    // Generate specific recommendations
    const recommendations = this.generateRecommendations(preferences, riskProfile, portfolioAllocation);
    
    // Calculate monthly investment if SIP
    const monthlyInvestment = preferences.frequency === 'monthly' 
      ? preferences.amount 
      : preferences.frequency === 'quarterly' 
      ? preferences.amount 
      : undefined;

    return {
      totalAmount: preferences.amount,
      investmentHorizon: preferences.investmentHorizon,
      frequency: preferences.frequency,
      selectedSectors: preferences.preferredSectors,
      portfolioAllocation,
      investmentStrategy,
      riskProfile,
      monthlyInvestment,
      expectedReturns,
      recommendations
    };
  }

  /**
   * Determine risk profile based on investment horizon and sectors
   */
  private static determineRiskProfile(preferences: InvestmentPreferences): 'LOW' | 'MODERATE' | 'HIGH' {
    let riskScore = 0;
    
    // Horizon-based risk
    if (preferences.investmentHorizon === 'short-term') {
      riskScore += 1; // Lower risk for short term
    } else {
      riskScore += 3; // Higher risk acceptable for long term
    }
    
    // Sector-based risk
    const highRiskSectors = ['defence', 'psu', 'energy'];
    const moderateRiskSectors = ['automobile', 'infrastructure', 'telecom'];
    const lowRiskSectors = ['banking', 'it', 'fmcg', 'pharmaceuticals'];
    
    preferences.preferredSectors.forEach(sector => {
      if (highRiskSectors.includes(sector)) riskScore += 2;
      else if (moderateRiskSectors.includes(sector)) riskScore += 1;
      else if (lowRiskSectors.includes(sector)) riskScore += 0;
    });
    
    // Determine final risk profile
    if (riskScore <= 2) return 'LOW';
    if (riskScore <= 5) return 'MODERATE';
    return 'HIGH';
  }

  /**
   * Generate portfolio allocation based on selected sectors with real stock prices
   */
  private static async generatePortfolioAllocation(
    preferences: InvestmentPreferences,
    riskProfile: 'LOW' | 'MODERATE' | 'HIGH'
  ): Promise<SectorStock[]> {
    console.log(`🎯 Generating portfolio allocation for ₹${preferences.amount.toLocaleString('en-IN')}`);
    
    const allocation: SectorStock[] = [];
    const totalSectors = preferences.preferredSectors.length;
    
    if (totalSectors === 0) {
      throw new Error('No sectors selected for investment');
    }
    
    // Equal distribution across sectors initially
    const sectorAllocationPercentage = 100 / totalSectors;
    
    for (const sectorId of preferences.preferredSectors) {
      const sectorStocks = SECTOR_STOCKS[sectorId as keyof typeof SECTOR_STOCKS];
      
      if (sectorStocks && sectorStocks.length > 0) {
        // Select stocks from each sector based on risk profile
        const stocksToSelect = riskProfile === 'HIGH' ? Math.min(3, sectorStocks.length) : 
                              riskProfile === 'MODERATE' ? Math.min(2, sectorStocks.length) : 1;
        
        const selectedStocks = sectorStocks.slice(0, stocksToSelect);
        const sectorAmount = (preferences.amount * sectorAllocationPercentage) / 100;
        
        // Get real stock prices for selected stocks
        for (let i = 0; i < selectedStocks.length; i++) {
          const stock = selectedStocks[i];
          
          try {
            console.log(`💰 Fetching price for ${stock.symbol}...`);
            
            // Get real-time stock price
            const stockQuote = await GrowwApiService.getRealTimeQuote(stock.symbol);
            const currentPrice = stockQuote?.currentPrice || this.getEstimatedPrice(stock.symbol);
            
            if (!currentPrice || currentPrice <= 0) {
              console.warn(`⚠️ Invalid price for ${stock.symbol}, skipping`);
              continue;
            }
            
            // Calculate allocation within this sector based on stock weight
            const stockWeightInSector = stock.weight / 100;
            const stockAmount = sectorAmount * stockWeightInSector;
            const stockPercentage = (stockAmount / preferences.amount) * 100;
            
            // Calculate how many shares can be bought
            const sharesToBuy = preferences.frequency === 'lump-sum' 
              ? Math.floor(stockAmount / currentPrice) // Whole shares for lump sum
              : stockAmount / currentPrice; // Fractional shares allowed for SIP
            
            // Minimum investment check - at least ₹500 per stock or 0.1 shares
            if (stockAmount >= 500 && sharesToBuy >= 0.1) {
              allocation.push({
                symbol: stock.symbol,
                companyName: stock.companyName,
                sector: sectorId,
                currentPrice: Math.round(currentPrice * 100) / 100,
                recommendation: 'BUY',
                allocationPercentage: Math.round(stockPercentage * 100) / 100,
                investmentAmount: Math.round(stockAmount),
                sharesToBuy: Math.round(sharesToBuy * 1000) / 1000 // Round to 3 decimal places
              });
              
              console.log(`✅ Added ${stock.symbol}: ₹${Math.round(stockAmount)} (${Math.round(stockPercentage * 100) / 100}%) - ${Math.round(sharesToBuy * 1000) / 1000} shares at ₹${currentPrice}`);
            } else {
              console.log(`⚠️ Skipping ${stock.symbol}: Amount too small (₹${Math.round(stockAmount)}) or price too high (₹${currentPrice})`);
            }
            
            // Add small delay to avoid API rate limits
            await this.delay(200);
            
          } catch (error) {
            console.error(`❌ Error fetching price for ${stock.symbol}:`, error);
            // Continue with next stock
          }
        }
      }
    }
    
    if (allocation.length === 0) {
      throw new Error(`Unable to create portfolio allocation. Investment amount of ₹${preferences.amount.toLocaleString('en-IN')} may be too small for selected stocks.`);
    }
    
    // Recalculate percentages to ensure they sum close to 100%
    const totalInvestment = allocation.reduce((sum, stock) => sum + stock.investmentAmount, 0);
    const utilizationPercentage = (totalInvestment / preferences.amount) * 100;
    
    console.log(`📊 Portfolio utilization: ₹${totalInvestment.toLocaleString('en-IN')} (${Math.round(utilizationPercentage)}%) of ₹${preferences.amount.toLocaleString('en-IN')}`);
    
    // Recalculate percentages based on actual allocation
    allocation.forEach(stock => {
      stock.allocationPercentage = Math.round(((stock.investmentAmount / totalInvestment) * 100) * 100) / 100;
    });
    
    // Sort by investment amount (highest first)
    allocation.sort((a, b) => b.investmentAmount - a.investmentAmount);
    
    return allocation;
  }
  
  /**
   * Get estimated stock price as fallback
   */
  private static getEstimatedPrice(symbol: string): number {
    // Fallback estimated prices for major stocks (approximate values)
    const estimatedPrices: Record<string, number> = {
      'HDFCBANK': 1600, 'ICICIBANK': 1200, 'AXISBANK': 1100, 'SBIN': 800,
      'TCS': 4000, 'INFY': 1800, 'WIPRO': 550, 'HCLTECH': 1500,
      'RELIANCE': 2800, 'ONGC': 250, 'IOC': 150, 'BPCL': 350,
      'MARUTI': 11000, 'TATAMOTORS': 900, 'M&M': 2800, 'BAJAJ-AUTO': 9000,
      'SUNPHARMA': 1700, 'DRREDDY': 6500, 'CIPLA': 1600, 'AUROPHARMA': 1200,
      'HINDUNILVR': 2400, 'NESTLEIND': 27000, 'ITC': 450, 'BRITANNIA': 5500,
      'HAL': 4200, 'BEL': 300, 'COCHINSHIP': 1800, 'BEML': 2500,
      'NTPC': 350, 'COALINDIA': 400, 'SAIL': 120, 'BHEL': 180,
      'LT': 3500, 'ULTRACEMCO': 11000, 'ADANIPORTS': 1200, 'GRASIM': 2600,
      'BHARTIARTL': 1600, 'IDEA': 12, 'RJIO': 2800
    };
    
    return estimatedPrices[symbol] || 1000; // Default fallback price
  }
  
  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate expected returns based on risk profile
   */
  private static calculateExpectedReturns(
    amount: number,
    riskProfile: 'LOW' | 'MODERATE' | 'HIGH'
  ): { conservative: number; moderate: number; aggressive: number } {
    const returnRates = {
      LOW: { conservative: 0.08, moderate: 0.10, aggressive: 0.12 },
      MODERATE: { conservative: 0.10, moderate: 0.12, aggressive: 0.15 },
      HIGH: { conservative: 0.12, moderate: 0.15, aggressive: 0.20 }
    };
    
    const rates = returnRates[riskProfile];
    
    return {
      conservative: Math.round(amount * rates.conservative),
      moderate: Math.round(amount * rates.moderate),
      aggressive: Math.round(amount * rates.aggressive)
    };
  }

  /**
   * Generate investment strategy description
   */
  private static generateInvestmentStrategy(
    preferences: InvestmentPreferences,
    riskProfile: 'LOW' | 'MODERATE' | 'HIGH'
  ): string {
    const horizon = preferences.investmentHorizon === 'short-term' ? 'short-term' : 'long-term';
    const frequency = preferences.frequency === 'monthly' ? 'monthly SIP' : 
                     preferences.frequency === 'quarterly' ? 'quarterly investments' : 
                     'lump sum investment';

    const strategies = {
      LOW: `Conservative ${horizon} strategy focusing on stable, dividend-paying stocks with consistent performance. ${frequency} approach helps in rupee cost averaging and reduces market volatility impact.`,
      
      MODERATE: `Balanced ${horizon} strategy combining growth and value stocks across selected sectors. ${frequency} investment allows you to benefit from market cycles while maintaining steady portfolio growth.`,
      
      HIGH: `Aggressive ${horizon} growth strategy targeting high-potential stocks in emerging sectors. ${frequency} approach enables you to capitalize on market opportunities while diversifying across multiple high-growth companies.`
    };

    return strategies[riskProfile];
  }

  /**
   * Generate specific recommendations based on preferences
   */
  private static generateRecommendations(
    preferences: InvestmentPreferences,
    riskProfile: 'LOW' | 'MODERATE' | 'HIGH',
    portfolioAllocation: SectorStock[]
  ): string[] {
    const recommendations: string[] = [];

    // Horizon-specific recommendations
    if (preferences.investmentHorizon === 'short-term') {
      recommendations.push('Focus on liquid stocks with strong fundamentals for easy exit within 3-12 months');
      recommendations.push('Consider maintaining 20-30% allocation in stable large-cap stocks');
      recommendations.push('Monitor market conditions closely and be prepared to book profits');
    } else {
      recommendations.push('Take advantage of market dips to accumulate quality stocks at lower prices');
      recommendations.push('Consider increasing allocation gradually if markets show weakness');
      recommendations.push('Focus on companies with strong business models and competitive advantages');
    }

    // Frequency-specific recommendations
    if (preferences.frequency === 'monthly') {
      recommendations.push('Set up automatic SIP to ensure disciplined investing without timing the market');
      recommendations.push('Review and rebalance your portfolio every quarter');
    } else if (preferences.frequency === 'quarterly') {
      recommendations.push('Time your quarterly investments around earnings seasons for better entry points');
      recommendations.push('Monitor sector rotation and adjust allocation accordingly');
    } else {
      recommendations.push('Consider staggering your lump sum investment over 2-3 months to reduce timing risk');
      recommendations.push('Keep 10-15% cash reserve for opportunistic investments');
    }

    // Risk-specific recommendations
    if (riskProfile === 'HIGH') {
      recommendations.push('Diversify across 8-12 stocks to balance risk while maintaining growth potential');
      recommendations.push('Consider booking partial profits when stocks reach 20-25% gains');
    } else if (riskProfile === 'MODERATE') {
      recommendations.push('Maintain 60-70% allocation in large-cap stocks for stability');
      recommendations.push('Review portfolio performance monthly and rebalance quarterly');
    } else {
      recommendations.push('Focus on dividend-yielding stocks to generate regular income');
      recommendations.push('Avoid speculative stocks and stick to established market leaders');
    }

    // Sector-specific recommendations
    const sectorAdvice: Record<string, string> = {
      banking: 'Banking sector offers stability; focus on private banks with strong digital presence',
      it: 'IT sector benefits from digital transformation; consider companies with strong US presence',
      pharmaceuticals: 'Pharma sector offers defensive growth; focus on companies with strong R&D pipeline',
      defence: 'Defence sector has government backing; monitor order book and execution capabilities',
      energy: 'Energy sector is cyclical; consider companies with renewable energy exposure'
    };

    preferences.preferredSectors.forEach(sector => {
      if (sectorAdvice[sector]) {
        recommendations.push(sectorAdvice[sector]);
      }
    });

    return recommendations.slice(0, 8); // Limit to 8 key recommendations
  }

  /**
   * Format tailored recommendation for display
   */
  static formatTailoredRecommendation(recommendation: TailoredRecommendation): string {
    const { 
      totalAmount, 
      investmentHorizon, 
      frequency, 
      selectedSectors,
      portfolioAllocation, 
      investmentStrategy,
      riskProfile,
      expectedReturns,
      recommendations 
    } = recommendation;

    const formattedAmount = `₹${totalAmount.toLocaleString('en-IN')}`;
    const monthlyAmount = recommendation.monthlyInvestment 
      ? `₹${recommendation.monthlyInvestment.toLocaleString('en-IN')}` 
      : null;

    return `# 🎯 Personalized Investment Recommendation

## 💰 Investment Summary
- **Amount**: ${formattedAmount}${monthlyAmount ? ` (${monthlyAmount} ${frequency})` : ''}
- **Time Horizon**: ${investmentHorizon === 'short-term' ? 'Short-term (3-12 months)' : 'Long-term (12+ months)'}
- **Risk Profile**: ${riskProfile}
- **Investment Style**: ${frequency === 'monthly' ? 'Monthly SIP' : frequency === 'quarterly' ? 'Quarterly Investment' : 'Lump Sum'}

## 📊 Recommended Portfolio Allocation

${portfolioAllocation.map(stock => 
  `**${stock.companyName}** (${stock.symbol})\n- **Investment Amount**: ₹${stock.investmentAmount.toLocaleString('en-IN')} (${stock.allocationPercentage}%)\n- **Current Price**: ₹${stock.currentPrice.toLocaleString('en-IN')}\n- **Shares to Buy**: ${stock.sharesToBuy} ${frequency === 'lump-sum' ? '(whole shares)' : '(fractional shares allowed for SIP)'}\n- **Sector**: ${stock.sector.charAt(0).toUpperCase() + stock.sector.slice(1)}\n- **Recommendation**: ${stock.recommendation}`
).join('\n\n')}

### 💹 **Portfolio Summary**
- **Total Investment**: ₹${portfolioAllocation.reduce((sum, stock) => sum + stock.investmentAmount, 0).toLocaleString('en-IN')}
- **Portfolio Utilization**: ${Math.round((portfolioAllocation.reduce((sum, stock) => sum + stock.investmentAmount, 0) / totalAmount) * 100)}%
- **Number of Stocks**: ${portfolioAllocation.length}
- **Diversification**: ${selectedSectors.length} sectors covered

## 🎲 Investment Strategy
${investmentStrategy}

## 📈 Expected Returns (Annual)
- **Conservative Estimate**: ₹${expectedReturns.conservative.toLocaleString('en-IN')} (${Math.round((expectedReturns.conservative/totalAmount)*100)}% returns)
- **Moderate Estimate**: ₹${expectedReturns.moderate.toLocaleString('en-IN')} (${Math.round((expectedReturns.moderate/totalAmount)*100)}% returns)
- **Aggressive Estimate**: ₹${expectedReturns.aggressive.toLocaleString('en-IN')} (${Math.round((expectedReturns.aggressive/totalAmount)*100)}% returns)

## 💡 Key Recommendations

${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n\n')}

## ⚠️ Important Disclaimers
- Past performance does not guarantee future results
- Stock prices are subject to market risks and volatility  
- Diversify your investments and avoid putting all money in one stock
- Review and rebalance your portfolio regularly
- Consider consulting a financial advisor for personalized advice

*This recommendation is based on your preferences and current market analysis. Please conduct your own research before making investment decisions.*`;
  }
}