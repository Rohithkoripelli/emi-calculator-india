/**
 * Portfolio Allocation Service
 * Creates structured investment recommendations with proper formatting and allocation tables
 */

import { StockQuote } from './growwApiService';
import { TrendingStock } from './newsSearchService';

interface PortfolioStock {
  stock: string;
  sector: string;
  suggested_allocation: string;
  rationale: string;
  current_price: number;
  market_cap: 'Large Cap' | 'Mid Cap' | 'Small Cap';
}

interface AllocationTable {
  stock: string;
  sector: string;
  amount: string;
  reasoning: string;
}

interface SIPStrategy {
  month: string;
  stocks_to_buy: string[];
  amount_per_stock: string;
  total_allocation: string;
}

interface StructuredPortfolioResponse {
  executive_summary: {
    investment_amount: string;
    investment_type: string;
    strategy_overview: string;
    expected_timeline: string;
  };
  market_analysis: {
    current_sentiment: string;
    trending_sectors: string[];
    market_highlights: string[];
  };
  recommended_allocation: {
    large_cap_stocks: PortfolioStock[];
    mid_cap_stocks: PortfolioStock[];
    small_cap_stocks: PortfolioStock[];
  };
  allocation_table: AllocationTable[];
  investment_strategy: {
    strategy_type: string;
    key_benefits: string[];
    risk_level: string;
    suggested_approach: string[];
  };
  sip_strategy: SIPStrategy[];
  risk_management: {
    diversification_approach: string;
    stop_loss_strategy: string;
    portfolio_review: string;
    risk_mitigation: string[];
  };
  tax_considerations: {
    investment_type: string;
    tax_benefits: string[];
    holding_strategy: string;
  };
  next_steps: {
    immediate_actions: string[];
    platform_suggestions: string[];
    monitoring_approach: string[];
  };
  disclaimer: string;
}

export class PortfolioAllocationService {
  
  /**
   * Create structured portfolio response similar to ChatGPT example
   */
  static createStructuredResponse(
    investmentAmount: number,
    frequency: 'LUMP_SUM' | 'SIP' | 'RECURRING',
    stockQuotes: StockQuote[],
    trendingStocks: TrendingStock[],
    marketSentiment: 'BULLISH' | 'BEARISH' | 'MIXED'
  ): StructuredPortfolioResponse {
    
    console.log(`📋 Creating structured portfolio response for ₹${investmentAmount}...`);
    
    // Categorize stocks by market cap
    const categorizedStocks = this.categorizeStocksByMarketCap(stockQuotes, trendingStocks);
    
    // Create allocation based on investment amount
    const allocation = this.createAllocation(investmentAmount, categorizedStocks);
    
    // Generate SIP strategy if applicable
    const sipStrategy = frequency === 'SIP' ? 
      this.createSIPStrategy(investmentAmount, categorizedStocks) : [];
    
    const response: StructuredPortfolioResponse = {
      executive_summary: {
        investment_amount: `₹${this.formatCurrency(investmentAmount)}`,
        investment_type: frequency === 'SIP' ? 'Systematic Investment Plan (SIP)' : 'Lump Sum Investment',
        strategy_overview: this.generateStrategyOverview(investmentAmount, frequency, marketSentiment),
        expected_timeline: frequency === 'SIP' ? '12-24 months for portfolio building' : '18-36 months for wealth creation'
      },
      
      market_analysis: {
        current_sentiment: this.formatMarketSentiment(marketSentiment),
        trending_sectors: this.extractTrendingSectors(trendingStocks),
        market_highlights: this.generateMarketHighlights(trendingStocks, marketSentiment)
      },
      
      recommended_allocation: {
        large_cap_stocks: categorizedStocks.largeCap.map(stock => this.createPortfolioStock(stock, 'Large Cap')),
        mid_cap_stocks: categorizedStocks.midCap.map(stock => this.createPortfolioStock(stock, 'Mid Cap')),
        small_cap_stocks: categorizedStocks.smallCap.map(stock => this.createPortfolioStock(stock, 'Small Cap'))
      },
      
      allocation_table: allocation,
      
      investment_strategy: {
        strategy_type: this.determineStrategyType(investmentAmount, frequency),
        key_benefits: this.generateKeyBenefits(frequency, marketSentiment),
        risk_level: this.determineRiskLevel(investmentAmount, frequency),
        suggested_approach: this.generateSuggestedApproach(frequency, investmentAmount)
      },
      
      sip_strategy: sipStrategy,
      
      risk_management: {
        diversification_approach: this.generateDiversificationApproach(categorizedStocks),
        stop_loss_strategy: this.generateStopLossStrategy(investmentAmount),
        portfolio_review: frequency === 'SIP' ? 'Monthly review with quarterly rebalancing' : 'Quarterly review with semi-annual rebalancing',
        risk_mitigation: this.generateRiskMitigation(marketSentiment, investmentAmount)
      },
      
      tax_considerations: {
        investment_type: 'Equity Investment',
        tax_benefits: this.generateTaxBenefits(),
        holding_strategy: 'Hold for more than 1 year to qualify for Long Term Capital Gains (LTCG) tax benefits'
      },
      
      next_steps: {
        immediate_actions: this.generateImmediateActions(frequency),
        platform_suggestions: this.generatePlatformSuggestions(),
        monitoring_approach: this.generateMonitoringApproach(frequency)
      },
      
      disclaimer: this.generateDisclaimer()
    };
    
    console.log(`✅ Structured portfolio response created with ${allocation.length} stock recommendations`);
    return response;
  }

  /**
   * Format the response for display similar to ChatGPT example
   */
  static formatResponseForDisplay(response: StructuredPortfolioResponse): string {
    let output = '';
    
    // Executive Summary
    output += `## 📊 Investment Recommendation for ${response.executive_summary.investment_amount}\n\n`;
    output += `**Investment Type:** ${response.executive_summary.investment_type}\n`;
    output += `**Strategy:** ${response.executive_summary.strategy_overview}\n`;
    output += `**Timeline:** ${response.executive_summary.expected_timeline}\n\n`;
    
    // Market Analysis
    output += `## 🎯 Current Market Analysis\n\n`;
    output += `**Market Sentiment:** ${response.market_analysis.current_sentiment}\n`;
    output += `**Trending Sectors:** ${response.market_analysis.trending_sectors.join(', ')}\n\n`;
    
    response.market_analysis.market_highlights.forEach((highlight, index) => {
      output += `${index + 1}. ${highlight}\n`;
    });
    output += '\n';
    
    // Recommended Allocation Table
    output += `## 💼 Suggested Portfolio Allocation\n\n`;
    output += `| Stock | Sector | Amount | Reasoning |\n`;
    output += `|-------|--------|--------|----------|\n`;
    
    response.allocation_table.forEach(allocation => {
      output += `| ${allocation.stock} | ${allocation.sector} | ${allocation.amount} | ${allocation.reasoning} |\n`;
    });
    output += '\n';
    
    // Large Cap Recommendations
    if (response.recommended_allocation.large_cap_stocks.length > 0) {
      output += `### 🏢 Large Cap Stocks (Stability Focus)\n\n`;
      response.recommended_allocation.large_cap_stocks.forEach((stock, index) => {
        output += `**${index + 1}. ${stock.stock}** - ${stock.sector}\n`;
        output += `- **Current Price:** ₹${stock.current_price}\n`;
        output += `- **Allocation:** ${stock.suggested_allocation}\n`;
        output += `- **Rationale:** ${stock.rationale}\n\n`;
      });
    }
    
    // Mid Cap Recommendations
    if (response.recommended_allocation.mid_cap_stocks.length > 0) {
      output += `### 🚀 Mid Cap Stocks (Growth Focus)\n\n`;
      response.recommended_allocation.mid_cap_stocks.forEach((stock, index) => {
        output += `**${index + 1}. ${stock.stock}** - ${stock.sector}\n`;
        output += `- **Current Price:** ₹${stock.current_price}\n`;
        output += `- **Allocation:** ${stock.suggested_allocation}\n`;
        output += `- **Rationale:** ${stock.rationale}\n\n`;
      });
    }
    
    // Small Cap Recommendations
    if (response.recommended_allocation.small_cap_stocks.length > 0) {
      output += `### 💎 Small Cap Stocks (High Growth Potential)\n\n`;
      response.recommended_allocation.small_cap_stocks.forEach((stock, index) => {
        output += `**${index + 1}. ${stock.stock}** - ${stock.sector}\n`;
        output += `- **Current Price:** ₹${stock.current_price}\n`;
        output += `- **Allocation:** ${stock.suggested_allocation}\n`;
        output += `- **Rationale:** ${stock.rationale}\n\n`;
      });
    }
    
    // Investment Strategy
    output += `## 📈 Investment Strategy\n\n`;
    output += `**Strategy Type:** ${response.investment_strategy.strategy_type}\n`;
    output += `**Risk Level:** ${response.investment_strategy.risk_level}\n\n`;
    
    output += `### Key Benefits:\n`;
    response.investment_strategy.key_benefits.forEach((benefit, index) => {
      output += `${index + 1}. ${benefit}\n`;
    });
    output += '\n';
    
    output += `### Suggested Approach:\n`;
    response.investment_strategy.suggested_approach.forEach((approach, index) => {
      output += `${index + 1}. ${approach}\n`;
    });
    output += '\n';
    
    // SIP Strategy (if applicable)
    if (response.sip_strategy.length > 0) {
      output += `## 📅 SIP Implementation Strategy\n\n`;
      response.sip_strategy.forEach((strategy, index) => {
        output += `**${strategy.month}:**\n`;
        output += `- Stocks: ${strategy.stocks_to_buy.join(', ')}\n`;
        output += `- Amount per stock: ${strategy.amount_per_stock}\n`;
        output += `- Total: ${strategy.total_allocation}\n\n`;
      });
    }
    
    // Risk Management
    output += `## ⚠️ Risk Management\n\n`;
    output += `**Diversification:** ${response.risk_management.diversification_approach}\n`;
    output += `**Stop Loss:** ${response.risk_management.stop_loss_strategy}\n`;
    output += `**Review Frequency:** ${response.risk_management.portfolio_review}\n\n`;
    
    output += `### Risk Mitigation Strategies:\n`;
    response.risk_management.risk_mitigation.forEach((mitigation, index) => {
      output += `${index + 1}. ${mitigation}\n`;
    });
    output += '\n';
    
    // Tax Considerations
    output += `## 💰 Tax Implications\n\n`;
    output += `**Investment Type:** ${response.tax_considerations.investment_type}\n`;
    output += `**Holding Strategy:** ${response.tax_considerations.holding_strategy}\n\n`;
    
    output += `### Tax Benefits:\n`;
    response.tax_considerations.tax_benefits.forEach((benefit, index) => {
      output += `${index + 1}. ${benefit}\n`;
    });
    output += '\n';
    
    // Next Steps
    output += `## 🎯 Next Steps\n\n`;
    output += `### Immediate Actions:\n`;
    response.next_steps.immediate_actions.forEach((action, index) => {
      output += `${index + 1}. ${action}\n`;
    });
    output += '\n';
    
    output += `### Recommended Platforms:\n`;
    response.next_steps.platform_suggestions.forEach((platform, index) => {
      output += `${index + 1}. ${platform}\n`;
    });
    output += '\n';
    
    output += `### Monitoring Approach:\n`;
    response.next_steps.monitoring_approach.forEach((approach, index) => {
      output += `${index + 1}. ${approach}\n`;
    });
    output += '\n';
    
    // Disclaimer
    output += `## ⚠️ Important Disclaimer\n\n`;
    output += response.disclaimer;
    
    return output;
  }

  // Helper methods
  private static categorizeStocksByMarketCap(stockQuotes: StockQuote[], trendingStocks: TrendingStock[]) {
    const largeCap: any[] = [];
    const midCap: any[] = [];
    const smallCap: any[] = [];
    
    stockQuotes.forEach(quote => {
      const trendingStock = trendingStocks.find(ts => ts.symbol === quote.symbol);
      const marketCapCategory = trendingStock?.marketCap || this.determineMarketCapFromPrice(quote.currentPrice);
      
      const stockData = {
        ...quote,
        marketCapCategory,
        reason: trendingStock?.reason || 'Strong market performance'
      };
      
      if (marketCapCategory === 'LARGE_CAP') {
        largeCap.push(stockData);
      } else if (marketCapCategory === 'MID_CAP') {
        midCap.push(stockData);
      } else {
        smallCap.push(stockData);
      }
    });
    
    return {
      largeCap: largeCap.slice(0, 4), // Top 4 large cap
      midCap: midCap.slice(0, 3),     // Top 3 mid cap
      smallCap: smallCap.slice(0, 2)  // Top 2 small cap
    };
  }

  private static createAllocation(investmentAmount: number, categorizedStocks: any): AllocationTable[] {
    const allocation: AllocationTable[] = [];
    
    // Define allocation percentages
    const largeCapPercent = 0.50; // 50%
    const midCapPercent = 0.30;   // 30%
    const smallCapPercent = 0.20; // 20%
    
    const largeCapAmount = investmentAmount * largeCapPercent;
    const midCapAmount = investmentAmount * midCapPercent;
    const smallCapAmount = investmentAmount * smallCapPercent;
    
    // Large Cap Allocation
    if (categorizedStocks.largeCap.length > 0) {
      const perLargeCapStock = largeCapAmount / categorizedStocks.largeCap.length;
      categorizedStocks.largeCap.forEach((stock: any) => {
        allocation.push({
          stock: `${stock.companyName} (${stock.symbol})`,
          sector: this.determineSector(stock.companyName),
          amount: `₹${this.formatCurrency(perLargeCapStock)}`,
          reasoning: this.generateStockReasoning(stock, 'Large Cap')
        });
      });
    }
    
    // Mid Cap Allocation
    if (categorizedStocks.midCap.length > 0) {
      const perMidCapStock = midCapAmount / categorizedStocks.midCap.length;
      categorizedStocks.midCap.forEach((stock: any) => {
        allocation.push({
          stock: `${stock.companyName} (${stock.symbol})`,
          sector: this.determineSector(stock.companyName),
          amount: `₹${this.formatCurrency(perMidCapStock)}`,
          reasoning: this.generateStockReasoning(stock, 'Mid Cap')
        });
      });
    }
    
    // Small Cap Allocation
    if (categorizedStocks.smallCap.length > 0) {
      const perSmallCapStock = smallCapAmount / categorizedStocks.smallCap.length;
      categorizedStocks.smallCap.forEach((stock: any) => {
        allocation.push({
          stock: `${stock.companyName} (${stock.symbol})`,
          sector: this.determineSector(stock.companyName),
          amount: `₹${this.formatCurrency(perSmallCapStock)}`,
          reasoning: this.generateStockReasoning(stock, 'Small Cap')
        });
      });
    }
    
    return allocation;
  }

  private static createPortfolioStock(stock: any, marketCap: 'Large Cap' | 'Mid Cap' | 'Small Cap'): PortfolioStock {
    return {
      stock: `${stock.companyName} (${stock.symbol})`,
      sector: this.determineSector(stock.companyName),
      suggested_allocation: this.calculateAllocationPercent(marketCap),
      rationale: stock.reason || this.generateGenericRationale(marketCap),
      current_price: stock.currentPrice,
      market_cap: marketCap
    };
  }

  private static createSIPStrategy(investmentAmount: number, categorizedStocks: any): SIPStrategy[] {
    const strategy: SIPStrategy[] = [];
    const monthlyAmount = investmentAmount;
    const totalStocks = categorizedStocks.largeCap.length + categorizedStocks.midCap.length + categorizedStocks.smallCap.length;
    
    if (totalStocks === 0) return strategy;
    
    const amountPerStock = monthlyAmount / Math.min(totalStocks, 3); // Max 3 stocks per month
    
    // Create 3 month strategy
    for (let month = 1; month <= 3; month++) {
      const monthStocks: string[] = [];
      
      if (month === 1 && categorizedStocks.largeCap.length > 0) {
        monthStocks.push(`${categorizedStocks.largeCap[0].companyName} (${categorizedStocks.largeCap[0].symbol})`);
        if (categorizedStocks.midCap.length > 0) {
          monthStocks.push(`${categorizedStocks.midCap[0].companyName} (${categorizedStocks.midCap[0].symbol})`);
        }
      } else if (month === 2) {
        if (categorizedStocks.largeCap.length > 1) {
          monthStocks.push(`${categorizedStocks.largeCap[1].companyName} (${categorizedStocks.largeCap[1].symbol})`);
        }
        if (categorizedStocks.smallCap.length > 0) {
          monthStocks.push(`${categorizedStocks.smallCap[0].companyName} (${categorizedStocks.smallCap[0].symbol})`);
        }
      } else if (month === 3) {
        if (categorizedStocks.midCap.length > 1) {
          monthStocks.push(`${categorizedStocks.midCap[1].companyName} (${categorizedStocks.midCap[1].symbol})`);
        }
        if (categorizedStocks.largeCap.length > 2) {
          monthStocks.push(`${categorizedStocks.largeCap[2].companyName} (${categorizedStocks.largeCap[2].symbol})`);
        }
      }
      
      if (monthStocks.length > 0) {
        strategy.push({
          month: `Month ${month}`,
          stocks_to_buy: monthStocks,
          amount_per_stock: `₹${this.formatCurrency(amountPerStock)}`,
          total_allocation: `₹${this.formatCurrency(monthlyAmount)}`
        });
      }
    }
    
    return strategy;
  }

  // Utility methods
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
  }

  private static determineMarketCapFromPrice(price: number): 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' {
    if (price > 2000) return 'LARGE_CAP';
    if (price > 500) return 'MID_CAP';
    return 'SMALL_CAP';
  }

  private static determineSector(companyName: string): string {
    const sectors = {
      'Banking & Finance': ['hdfc', 'icici', 'sbi', 'kotak', 'axis', 'bank'],
      'Information Technology': ['tcs', 'infosys', 'wipro', 'tech mahindra', 'hcl tech'],
      'Automobile': ['maruti', 'tata motors', 'mahindra', 'bajaj', 'hero motocorp'],
      'Pharmaceuticals': ['sun pharma', 'cipla', 'lupin', 'biocon', 'dr reddy'],
      'Energy & Power': ['reliance', 'ongc', 'coal india', 'power grid', 'ntpc'],
      'FMCG': ['hindustan unilever', 'itc', 'nestle', 'britannia', 'godrej'],
      'Telecommunications': ['bharti airtel', 'vodafone idea', 'jio']
    };
    
    const lowerName = companyName.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(sectors)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return sector;
      }
    }
    
    return 'Diversified';
  }

  private static generateStockReasoning(stock: any, marketCap: string): string {
    const reasonings: Record<string, string[]> = {
      'Large Cap': [
        'Stable dividend yield and consistent performance',
        'Strong fundamentals and market leadership',
        'Lower volatility with steady growth potential'
      ],
      'Mid Cap': [
        'Strong growth trajectory with expanding market share',
        'Good balance of growth potential and stability',
        'Benefiting from sector tailwinds and expansion'
      ],
      'Small Cap': [
        'High growth potential with emerging market opportunities',
        'Innovative business model with scalable operations',
        'Early stage growth with significant upside potential'
      ]
    };
    
    const options = reasonings[marketCap] || reasonings['Mid Cap'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private static calculateAllocationPercent(marketCap: 'Large Cap' | 'Mid Cap' | 'Small Cap'): string {
    const allocations = {
      'Large Cap': '20-25%',
      'Mid Cap': '15-20%',
      'Small Cap': '8-12%'
    };
    
    return allocations[marketCap];
  }

  private static generateGenericRationale(marketCap: 'Large Cap' | 'Mid Cap' | 'Small Cap'): string {
    const rationales = {
      'Large Cap': 'Established market leader with strong fundamentals',
      'Mid Cap': 'Growth-oriented company with expanding market presence',
      'Small Cap': 'High growth potential with innovative business approach'
    };
    
    return rationales[marketCap];
  }

  private static generateStrategyOverview(amount: number, frequency: string, sentiment: string): string {
    const amountStr = amount < 50000 ? 'conservative diversified approach' : 'balanced growth strategy';
    const sentimentStr = sentiment === 'BULLISH' ? 'taking advantage of positive market momentum' : 'focusing on fundamentally strong stocks';
    
    return `${amountStr} ${sentimentStr} across market cap segments`;
  }

  private static formatMarketSentiment(sentiment: string): string {
    const sentiments: Record<string, string> = {
      'BULLISH': '📈 Bullish - Positive market momentum with growth opportunities',
      'BEARISH': '📉 Bearish - Cautious approach recommended with defensive positioning',
      'MIXED': '📊 Mixed - Selective stock picking with balanced risk approach'
    };
    
    return sentiments[sentiment] || sentiments['MIXED'];
  }

  private static extractTrendingSectors(trendingStocks: TrendingStock[]): string[] {
    const sectors = new Set(trendingStocks.map(stock => stock.sector));
    return Array.from(sectors).slice(0, 5);
  }

  private static generateMarketHighlights(trendingStocks: TrendingStock[], sentiment: string): string[] {
    const highlights = [];
    
    if (sentiment === 'BULLISH') {
      highlights.push('Strong sectoral rotation driving momentum');
      highlights.push('Institutional buying supporting market levels');
    } else if (sentiment === 'BEARISH') {
      highlights.push('Market consolidation phase with selective opportunities');
      highlights.push('Focus on quality stocks with strong fundamentals');
    } else {
      highlights.push('Mixed signals requiring careful stock selection');
      highlights.push('Earnings growth driving individual stock performance');
    }
    
    highlights.push(`${trendingStocks.length} stocks showing strong momentum across sectors`);
    
    return highlights;
  }

  private static determineStrategyType(amount: number, frequency: string): string {
    if (frequency === 'SIP') {
      return amount < 10000 ? 'Conservative SIP Strategy' : 'Aggressive SIP Growth Strategy';
    } else {
      return amount < 50000 ? 'Focused Value Strategy' : 'Diversified Growth Strategy';
    }
  }

  private static generateKeyBenefits(frequency: string, sentiment: string): string[] {
    const benefits = [];
    
    if (frequency === 'SIP') {
      benefits.push('Rupee cost averaging reduces volatility impact');
      benefits.push('Disciplined investment approach builds long-term wealth');
      benefits.push('Lower entry barrier with gradual portfolio building');
    } else {
      benefits.push('Immediate market exposure to capitalize on opportunities');
      benefits.push('Full diversification from day one');
      benefits.push('Flexibility to time market entries');
    }
    
    if (sentiment === 'BULLISH') {
      benefits.push('Positioned to benefit from positive market momentum');
    }
    
    return benefits;
  }

  private static determineRiskLevel(amount: number, frequency: string): string {
    if (amount < 25000 && frequency === 'SIP') return 'Moderate Risk';
    if (amount > 100000) return 'Moderate to High Risk';
    return 'Moderate Risk';
  }

  private static generateSuggestedApproach(frequency: string, amount: number): string[] {
    const approaches = [];
    
    if (frequency === 'SIP') {
      approaches.push('Start with 2-3 stocks in first month, gradually add more');
      approaches.push('Focus on large-cap stocks initially for stability');
      approaches.push('Add mid and small-cap exposure after 2-3 months');
    } else {
      approaches.push('Invest across all market cap segments simultaneously');
      approaches.push('Maintain 50-60% in large-cap for stability');
      approaches.push('Monitor and rebalance quarterly');
    }
    
    approaches.push('Set stop-loss levels at 8-10% below entry price');
    approaches.push('Review portfolio performance monthly');
    
    return approaches;
  }

  private static generateDiversificationApproach(categorizedStocks: any): string {
    const totalStocks = categorizedStocks.largeCap.length + categorizedStocks.midCap.length + categorizedStocks.smallCap.length;
    return `${totalStocks}-stock diversification across ${new Set([...categorizedStocks.largeCap, ...categorizedStocks.midCap, ...categorizedStocks.smallCap].map(stock => this.determineSector(stock.companyName))).size} sectors`;
  }

  private static generateStopLossStrategy(amount: number): string {
    if (amount < 50000) {
      return '8-10% stop-loss with trailing stop as profits grow';
    } else {
      return '10-12% stop-loss with sector-wise risk management';
    }
  }

  private static generateRiskMitigation(sentiment: string, amount: number): string[] {
    const mitigations = [
      'Diversification across market cap and sectors',
      'Position sizing to limit single stock exposure',
      'Regular portfolio review and rebalancing'
    ];
    
    if (sentiment === 'BEARISH') {
      mitigations.push('Increased cash position for buying opportunities');
      mitigations.push('Focus on defensive sectors during market stress');
    }
    
    if (amount > 100000) {
      mitigations.push('Staggered entry over 2-3 sessions to average price');
    }
    
    return mitigations;
  }

  private static generateTaxBenefits(): string[] {
    return [
      'LTCG tax exemption up to ₹1 lakh per financial year',
      'No tax on dividends received from stocks',
      'Tax loss harvesting opportunities for portfolio optimization',
      'Indexation benefits not applicable but lower LTCG rate of 10%'
    ];
  }

  private static generateImmediateActions(frequency: string): string[] {
    const actions = [
      'Open Demat and Trading account with a reliable broker',
      'Complete KYC and bank account linking',
      'Set up fund transfer methods (UPI/Net Banking)'
    ];
    
    if (frequency === 'SIP') {
      actions.push('Set up SIP mandates for automated investments');
      actions.push('Schedule monthly investment dates');
    } else {
      actions.push('Plan entry timing over 1-2 sessions');
      actions.push('Prepare watchlist and price targets');
    }
    
    return actions;
  }

  private static generatePlatformSuggestions(): string[] {
    return [
      'Zerodha - Low brokerage with good research tools',
      'Groww - User-friendly interface ideal for beginners',
      'Upstox - Competitive pricing with advanced features',
      'Angel One - Comprehensive research and advisory services'
    ];
  }

  private static generateMonitoringApproach(frequency: string): string[] {
    const approaches = [
      'Track portfolio performance using mobile apps',
      'Set price alerts for major movements',
      'Follow quarterly earnings and annual reports'
    ];
    
    if (frequency === 'SIP') {
      approaches.push('Monthly SIP execution review');
      approaches.push('Quarterly portfolio rebalancing assessment');
    } else {
      approaches.push('Weekly performance review');
      approaches.push('Monthly rebalancing consideration');
    }
    
    return approaches;
  }

  private static generateDisclaimer(): string {
    return `This is an AI-generated investment recommendation for educational purposes only. Stock investments are subject to market risks, and past performance does not guarantee future returns. Please consult with a qualified financial advisor before making investment decisions. Consider your risk appetite, financial goals, and investment horizon. The recommendations are based on current market data and trends, which can change rapidly. Always do your own research and due diligence before investing.`;
  }
}

// Export types
export type { StructuredPortfolioResponse, PortfolioStock, AllocationTable, SIPStrategy };