/**
 * Intelligent Investment Intent Detection Service
 * Detects all types of investment-related queries using advanced pattern matching and ML-style scoring
 */

export interface InvestmentIntent {
  isInvestmentQuery: boolean;
  confidence: number;
  intentType: 'PORTFOLIO_RECOMMENDATION' | 'STOCK_ANALYSIS' | 'MARKET_RESEARCH' | 'GENERAL_ADVICE' | 'OTHER';
  extractedParams: {
    amount?: number;
    timeHorizon?: string;
    riskLevel?: string;
    marketCapPreference?: {
      largeCap?: number;
      midCap?: number;
      smallCap?: number;
    };
    sectors?: string[];
    specificStocks?: string[];
  };
  reasoning: string[];
  recommendationStrategy: 'RAILWAY_API' | 'QUESTIONNAIRE' | 'SPECIFIC_ANALYSIS' | 'GENERAL_GUIDANCE';
}

/**
 * Investment Intent Patterns - Comprehensive detection
 */
const INVESTMENT_INTENT_PATTERNS = {
  
  // Portfolio Recommendation Patterns (should use Railway API)
  PORTFOLIO_RECOMMENDATION: [
    // Amount-based investment requests
    /(?:invest|investment|investing)\s+(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)/i,
    /(?:have|got|with)\s+(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)\s+(?:to|for)?\s*(?:invest|investment)/i,
    /(?:budget|amount)\s+(?:of\s+)?(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)/i,
    
    // Portfolio allocation requests
    /(?:recommend|suggest|advise)\s+(?:stocks?|shares?|investment|portfolio)/i,
    /(?:what|which|where)\s+(?:stocks?|shares?|companies?)\s+(?:should|to|can)\s+(?:i|we)\s+(?:buy|invest|purchase)/i,
    /(?:best|good|top)\s+(?:stocks?|shares?|investment|companies?)\s+(?:to|for)\s+(?:buy|invest)/i,
    
    // Market cap allocation (highest priority)
    /(?:large\s*cap|mid\s*cap|small\s*cap|largecap|midcap|smallcap)/i,
    /(?:allocation|allocate|distribute|split|diversif)/i,
    /(\d+)[\/\-\s]+(\d+)[\/\-\s]+(\d+)/,
    /30\/40\/30|30.*40.*30|large.*mid.*small.*cap/i,
    
    // Portfolio construction
    /(?:build|create|construct)\s+(?:portfolio|investment)/i,
    /(?:portfolio\s*mix|asset\s*allocation)/i,
    /(?:how|where)\s+(?:should|to|can)\s+(?:i|we)\s+(?:allocate|invest|distribute)/i,
    
    // Investment goals and strategies
    /(?:investment|investing)\s+(?:strategy|plan|goal)/i,
    /(?:wealth|money)\s+(?:creation|building|growth)/i,
    /(?:financial\s*planning|retirement\s*planning)/i,
  ],

  // Specific Stock Analysis (should use specific analysis)
  STOCK_ANALYSIS: [
    // Named companies
    /(?:reliance|tcs|infosys|hdfc|icici|sbi|wipro|hcl|bajaj|maruti|adani|tata|birla)/i,
    
    // Stock symbols
    /\b[A-Z]{2,10}\b\s+(?:stock|share|analysis|price|target)/i,
    
    // Specific analysis requests
    /(?:analyze|analysis|review|evaluate)\s+(?:[A-Z]{2,10}|[a-z]+\s+[a-z]+)/i,
    /should\s+(?:i|we)\s+buy\s+(?:[A-Z]{2,10}|[a-z]+\s+[a-z]+)/i,
    /(?:price\s*target|target\s*price|fair\s*value)\s+(?:for|of)\s+/i,
  ],

  // Market Research Queries (should use Railway API for trending stocks)
  MARKET_RESEARCH: [
    /(?:trending|hot|popular|rising)\s+(?:stocks?|shares?)/i,
    /(?:market\s*outlook|market\s*analysis|market\s*trends)/i,
    /(?:sector\s*analysis|sector\s*performance)/i,
    /(?:nifty|sensex|index)\s+(?:stocks?|analysis|outlook)/i,
    /(?:upcoming|future|promising)\s+(?:stocks?|companies?|sectors?)/i,
  ],

  // General Investment Advice (should use questionnaire or general guidance)
  GENERAL_ADVICE: [
    /(?:how\s+to\s+invest|investment\s+advice|investment\s+tips)/i,
    /(?:beginner|new\s+to)\s+(?:investing|stock\s+market)/i,
    /(?:learn|understand)\s+(?:investing|stock\s+market|trading)/i,
    /(?:risk\s+management|investment\s+risk)/i,
    /(?:sip|systematic\s+investment\s+plan)/i,
  ]
};

/**
 * Financial Keywords with weights for confidence scoring
 */
const FINANCIAL_KEYWORDS = {
  high: ['invest', 'investment', 'portfolio', 'stocks', 'shares', 'equity', 'allocation', 'diversification'], // weight: 3
  medium: ['money', 'funds', 'capital', 'wealth', 'financial', 'market', 'trading', 'buy', 'sell'], // weight: 2
  low: ['amount', 'budget', 'plan', 'strategy', 'goal', 'advice', 'tip', 'help'] // weight: 1
};

/**
 * Question Keywords indicating information seeking
 */
const QUESTION_KEYWORDS = ['what', 'which', 'where', 'how', 'should', 'recommend', 'suggest', 'advise', 'best', 'good', 'top'];

export class IntelligentInvestmentDetector {
  
  /**
   * Main function to detect investment intent with high accuracy
   */
  static detectInvestmentIntent(query: string): InvestmentIntent {
    const cleanQuery = query.toLowerCase().trim();
    const reasoning: string[] = [];
    let confidence = 0;
    let intentType: InvestmentIntent['intentType'] = 'OTHER';
    let recommendationStrategy: InvestmentIntent['recommendationStrategy'] = 'GENERAL_GUIDANCE';
    
    // Step 1: Check for specific investment patterns
    const patternMatches = this.checkPatternMatches(query, reasoning);
    confidence += patternMatches.confidence;
    intentType = patternMatches.intentType;
    
    // Step 2: Keyword analysis with weighted scoring
    const keywordScore = this.analyzeKeywords(cleanQuery, reasoning);
    confidence += keywordScore;
    
    // Step 3: Question pattern analysis
    const questionScore = this.analyzeQuestionPatterns(cleanQuery, reasoning);
    confidence += questionScore;
    
    // Step 4: Extract parameters
    const extractedParams = this.extractParameters(query, reasoning);
    
    // Step 5: Boost confidence based on extracted parameters
    if (extractedParams.amount) {
      confidence += 15;
      reasoning.push(`Found investment amount: ₹${extractedParams.amount.toLocaleString()}`);
    }
    
    if (extractedParams.marketCapPreference) {
      confidence += 20;
      reasoning.push('Detected market cap allocation preferences');
    }
    
    // Step 6: Determine recommendation strategy
    recommendationStrategy = this.determineRecommendationStrategy(intentType, extractedParams, confidence);
    
    // Step 7: Final confidence normalization (0-100)
    confidence = Math.min(95, Math.max(0, confidence));
    
    // Step 8: Determine if it's an investment query
    const isInvestmentQuery = confidence >= 60 && intentType !== 'OTHER';
    
    // Debug logging
    console.log(`🔍 Intent Detection Debug:`, {
      query: query.substring(0, 100),
      intentType,
      confidence,
      recommendationStrategy,
      extractedParams,
      isInvestmentQuery
    });
    
    if (isInvestmentQuery) {
      reasoning.push(`High confidence investment query (${confidence}%) - using ${recommendationStrategy} strategy`);
    }
    
    return {
      isInvestmentQuery,
      confidence,
      intentType,
      extractedParams,
      reasoning,
      recommendationStrategy
    };
  }
  
  /**
   * Check pattern matches and determine intent type
   */
  private static checkPatternMatches(query: string, reasoning: string[]): { confidence: number; intentType: InvestmentIntent['intentType'] } {
    let confidence = 0;
    let intentType: InvestmentIntent['intentType'] = 'OTHER';
    let matchedPatterns: { type: string; confidence: number }[] = [];
    
    // Check Portfolio Recommendation patterns (highest priority for allocation requests)
    for (const pattern of INVESTMENT_INTENT_PATTERNS.PORTFOLIO_RECOMMENDATION) {
      if (pattern.test(query)) {
        matchedPatterns.push({ type: 'PORTFOLIO_RECOMMENDATION', confidence: 25 });
        reasoning.push(`Matched portfolio recommendation pattern`);
        break; // Only count one pattern match per category
      }
    }
    
    // Check Stock Analysis patterns
    for (const pattern of INVESTMENT_INTENT_PATTERNS.STOCK_ANALYSIS) {
      if (pattern.test(query)) {
        matchedPatterns.push({ type: 'STOCK_ANALYSIS', confidence: 20 });
        reasoning.push(`Matched specific stock analysis pattern`);
        break;
      }
    }
    
    // Check Market Research patterns
    for (const pattern of INVESTMENT_INTENT_PATTERNS.MARKET_RESEARCH) {
      if (pattern.test(query)) {
        matchedPatterns.push({ type: 'MARKET_RESEARCH', confidence: 15 });
        reasoning.push(`Matched market research pattern`);
        break;
      }
    }
    
    // Check General Advice patterns
    for (const pattern of INVESTMENT_INTENT_PATTERNS.GENERAL_ADVICE) {
      if (pattern.test(query)) {
        matchedPatterns.push({ type: 'GENERAL_ADVICE', confidence: 10 });
        reasoning.push(`Matched general investment advice pattern`);
        break;
      }
    }
    
    // Prioritize portfolio recommendation if allocation keywords are present
    const hasAllocationKeywords = /(?:allocation|allocate|split|diversif|portfolio|30\/40\/30|large.*cap.*mid.*cap.*small.*cap)/i.test(query);
    if (hasAllocationKeywords) {
      // Boost portfolio recommendation confidence
      const portfolioMatch = matchedPatterns.find(m => m.type === 'PORTFOLIO_RECOMMENDATION');
      if (portfolioMatch) {
        portfolioMatch.confidence += 20;
        reasoning.push('Strong allocation keywords detected - prioritizing portfolio recommendation');
      } else {
        matchedPatterns.push({ type: 'PORTFOLIO_RECOMMENDATION', confidence: 30 });
        reasoning.push('Allocation keywords detected - inferring portfolio recommendation intent');
      }
    }
    
    // Select the highest confidence intent type
    if (matchedPatterns.length > 0) {
      const bestMatch = matchedPatterns.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      intentType = bestMatch.type as InvestmentIntent['intentType'];
      confidence = bestMatch.confidence;
    }
    
    return { confidence, intentType };
  }
  
  /**
   * Analyze keywords with weighted scoring
   */
  private static analyzeKeywords(query: string, reasoning: string[]): number {
    let score = 0;
    const foundKeywords: string[] = [];
    
    // High-weight keywords
    for (const keyword of FINANCIAL_KEYWORDS.high) {
      if (query.includes(keyword)) {
        score += 3;
        foundKeywords.push(keyword);
      }
    }
    
    // Medium-weight keywords
    for (const keyword of FINANCIAL_KEYWORDS.medium) {
      if (query.includes(keyword)) {
        score += 2;
        foundKeywords.push(keyword);
      }
    }
    
    // Low-weight keywords
    for (const keyword of FINANCIAL_KEYWORDS.low) {
      if (query.includes(keyword)) {
        score += 1;
        foundKeywords.push(keyword);
      }
    }
    
    if (foundKeywords.length > 0) {
      reasoning.push(`Found ${foundKeywords.length} financial keywords: ${foundKeywords.slice(0, 5).join(', ')}`);
    }
    
    return Math.min(25, score); // Cap keyword score at 25
  }
  
  /**
   * Analyze question patterns
   */
  private static analyzeQuestionPatterns(query: string, reasoning: string[]): number {
    let score = 0;
    const foundQuestions: string[] = [];
    
    for (const keyword of QUESTION_KEYWORDS) {
      if (query.includes(keyword)) {
        score += 2;
        foundQuestions.push(keyword);
      }
    }
    
    if (foundQuestions.length > 0) {
      reasoning.push(`Question patterns found: ${foundQuestions.slice(0, 3).join(', ')}`);
    }
    
    return Math.min(10, score); // Cap question score at 10
  }
  
  /**
   * Extract investment parameters from query
   */
  private static extractParameters(query: string, reasoning: string[]): InvestmentIntent['extractedParams'] {
    const params: InvestmentIntent['extractedParams'] = {};
    
    // Extract amount
    params.amount = this.extractAmount(query);
    
    // Extract market cap preferences
    params.marketCapPreference = this.extractMarketCapAllocation(query);
    
    // Extract time horizon
    params.timeHorizon = this.extractTimeHorizon(query);
    
    // Extract risk level
    params.riskLevel = this.extractRiskLevel(query);
    
    // Extract specific stocks
    params.specificStocks = this.extractSpecificStocks(query);
    
    // Extract sectors
    params.sectors = this.extractSectors(query);
    
    return params;
  }
  
  /**
   * Extract investment amount from query
   */
  private static extractAmount(query: string): number | undefined {
    const patterns = [
      /₹\s*([\d,]+)(?:k|000)?/i,
      /([\d,]+)\s*(?:thousand|lakh|crore)/i,
      /([\d,]+)k/i,
      /(?:invest|investment|budget|amount)\s+(?:of\s+)?([\d,]+)/i,
      /^([\d,]+)\s+(?:rupees?|rs\.?|₹)?\s*(?:invest|investment|budget)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        
        if (query.toLowerCase().includes('lakh')) {
          amount *= 100000;
        } else if (query.toLowerCase().includes('crore')) {
          amount *= 10000000;
        } else if (query.toLowerCase().includes('thousand') || query.toLowerCase().includes('k')) {
          amount *= 1000;
        }
        
        return amount;
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract market cap allocation percentages
   */
  private static extractMarketCapAllocation(query: string): { largeCap?: number; midCap?: number; smallCap?: number } | undefined {
    const patterns = [
      /(\d+)[\/\-\s]+(\d+)[\/\-\s]+(\d+)/,
      /(\d+)%?\s*(?:large|big),?\s*(\d+)%?\s*(?:mid|medium),?\s*(\d+)%?\s*(?:small|little)/i,
      /large[:\s]*(\d+)%?.*mid[:\s]*(\d+)%?.*small[:\s]*(\d+)%?/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const [, large, mid, small] = match;
        const largeCap = parseInt(large);
        const midCap = parseInt(mid);
        const smallCap = parseInt(small);
        
        const total = largeCap + midCap + smallCap;
        if (total >= 90 && total <= 110) {
          return { largeCap, midCap, smallCap };
        }
      }
    }

    return undefined;
  }
  
  /**
   * Extract time horizon
   */
  private static extractTimeHorizon(query: string): string | undefined {
    const patterns = [
      /(?:for|over|next|coming)\s+(\d+\s*(?:months?|years?))/i,
      /(short|long)\s*(?:term|period)/i,
      /(\d+)\s*(?:month|year)s?\s+(?:investment|plan)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract risk level
   */
  private static extractRiskLevel(query: string): string | undefined {
    if (/(?:conservative|safe|low\s*risk|capital\s*protection)/i.test(query)) {
      return 'conservative';
    } else if (/(?:aggressive|high\s*risk|growth|speculative)/i.test(query)) {
      return 'aggressive';
    } else if (/(?:moderate|balanced|medium\s*risk)/i.test(query)) {
      return 'moderate';
    }
    
    return undefined;
  }
  
  /**
   * Extract specific stock mentions
   */
  private static extractSpecificStocks(query: string): string[] {
    const stockNames = ['RELIANCE', 'TCS', 'INFOSYS', 'HDFC', 'ICICI', 'SBI', 'WIPRO', 'HCL', 'BAJAJ', 'MARUTI', 'ADANI', 'TATA'];
    const found: string[] = [];
    
    for (const stock of stockNames) {
      if (new RegExp(stock, 'i').test(query)) {
        found.push(stock);
      }
    }
    
    // Also check for stock symbols
    const symbolMatch = query.match(/\b[A-Z]{2,10}\b/g);
    if (symbolMatch) {
      found.push(...symbolMatch);
    }
    
    return found;
  }
  
  /**
   * Extract sector mentions
   */
  private static extractSectors(query: string): string[] {
    const sectors = ['IT', 'banking', 'pharma', 'auto', 'energy', 'FMCG', 'telecom', 'infrastructure', 'metals', 'realty'];
    const found: string[] = [];
    
    for (const sector of sectors) {
      if (new RegExp(sector, 'i').test(query)) {
        found.push(sector);
      }
    }
    
    return found;
  }
  
  /**
   * Determine the best recommendation strategy based on intent and parameters
   */
  private static determineRecommendationStrategy(
    intentType: InvestmentIntent['intentType'],
    params: InvestmentIntent['extractedParams'],
    confidence: number
  ): InvestmentIntent['recommendationStrategy'] {
    
    // If specific stocks mentioned, use specific analysis
    if (intentType === 'STOCK_ANALYSIS' && params.specificStocks && params.specificStocks.length > 0) {
      return 'SPECIFIC_ANALYSIS';
    }
    
    // PRIORITY: Portfolio recommendation with investment intent -> Railway API
    if (intentType === 'PORTFOLIO_RECOMMENDATION') {
      return 'RAILWAY_API';
    }
    
    // Market research queries -> Railway API  
    if (intentType === 'MARKET_RESEARCH') {
      return 'RAILWAY_API';
    }
    
    // Investment queries with amount should use Railway API
    if (params.amount && params.amount > 0) {
      return 'RAILWAY_API';
    }
    
    // Investment queries with market cap allocation should use Railway API
    if (params.marketCapPreference) {
      return 'RAILWAY_API';
    }
    
    // High confidence investment queries should use Railway API
    if (confidence >= 80 && (intentType === 'PORTFOLIO_RECOMMENDATION' || intentType === 'MARKET_RESEARCH' || 
                             intentType === 'STOCK_ANALYSIS' || intentType === 'GENERAL_ADVICE')) {
      return 'RAILWAY_API';
    }
    
    // If general advice or low confidence, use questionnaire
    if (intentType === 'GENERAL_ADVICE' || confidence < 70) {
      return 'QUESTIONNAIRE';
    }
    
    // Medium confidence investment queries -> Railway API
    if (confidence >= 70) {
      return 'RAILWAY_API';
    }
    
    return 'GENERAL_GUIDANCE';
  }
  
  /**
   * Test the detector with example queries
   */
  static test() {
    const testQueries = [
      "recommend stocks for 10,000 rupees with 30/40/30 split in large, mid, small cap",
      "I have 50000 to invest in stock market",
      "what are the best stocks to buy right now?",
      "should I buy Reliance stock?",
      "investment advice for beginner",
      "trending stocks in IT sector",
      "how to invest 1 lakh rupees for long term?",
      "analyze TCS stock price target",
      "monthly SIP of 5000 which stocks are good",
      "portfolio allocation strategy"
    ];
    
    console.log('🧪 Testing Intelligent Investment Detector\n');
    
    testQueries.forEach(query => {
      const result = this.detectInvestmentIntent(query);
      console.log(`Query: "${query}"`);
      console.log(`Result: ${result.isInvestmentQuery ? '✅ INVESTMENT' : '❌ NOT INVESTMENT'} (${result.confidence}%)`);
      console.log(`Intent: ${result.intentType} | Strategy: ${result.recommendationStrategy}`);
      console.log(`Amount: ${result.extractedParams.amount || 'Not found'}`);
      console.log(`Market Cap: ${JSON.stringify(result.extractedParams.marketCapPreference) || 'Not found'}`);
      console.log(`Reasoning: ${result.reasoning.join('; ')}`);
      console.log('---\n');
    });
  }
}