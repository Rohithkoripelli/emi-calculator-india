/**
 * Intelligent Investment Intent Detection Service
 * Detects all types of investment-related queries using advanced pattern matching and ML-style scoring
 */

export interface InvestmentIntent {
  isInvestmentQuery: boolean;
  confidence: number;
  intentType: 'PORTFOLIO_RECOMMENDATION' | 'STOCK_ANALYSIS' | 'MARKET_RESEARCH' | 'GENERAL_ADVICE' | 'ORDER_PLACEMENT' | 'OTHER';
  extractedParams: {
    amount?: number;
    timeHorizon?: string;
    riskLevel?: string;
    marketCapPreference?: {
      largeCap?: number;
      midCap?: number;
      smallCap?: number;
    };
    marketCapCategory?: 'all' | 'large' | 'mid' | 'small'; // For top stocks queries
    sectors?: string[];
    specificStocks?: string[];
    orderParams?: {  // 🆕 NEW: Order placement parameters
      action: 'BUY' | 'SELL';
      symbol: string;
      quantity: number;
      orderType?: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
      price?: number;
      triggerPrice?: number;
    };
  };
  reasoning: string[];
  recommendationStrategy: 'RAILWAY_API' | 'TOP_STOCKS' | 'ORDER_PLACEMENT' | 'QUESTIONNAIRE' | 'SPECIFIC_ANALYSIS' | 'GENERAL_GUIDANCE';
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

  // Market Research Queries (should use TOP_STOCKS for trending/top stocks)
  MARKET_RESEARCH: [
    /(?:trending|hot|popular|rising|top|best)\s+(?:stocks?|shares?)/i,
    /(?:give|show|suggest|recommend)\s+(?:me\s+)?(?:some\s+)?(?:trending|top|best|good)\s+(?:stocks?|shares?)/i,
    /(?:what|which)\s+(?:are\s+)?(?:the\s+)?(?:trending|top|best)\s+(?:stocks?|shares?)/i,
    /(?:market\s*outlook|market\s*analysis|market\s*trends)/i,
    /(?:sector\s*analysis|sector\s*performance)/i,
    /(?:nifty|sensex|index)\s+(?:stocks?|analysis|outlook)/i,
    /(?:upcoming|future|promising)\s+(?:stocks?|companies?|sectors?)/i,
    /(?:top|best|leading)\s+(?:large|mid|small)\s*cap\s+(?:stocks?|companies?)/i,
    /(?:invest|investment)\s+in\s+(?:large|mid|small)\s*cap\s+(?:stocks?|companies?)/i,
  ],

  // General Investment Advice (should use questionnaire or general guidance)
  GENERAL_ADVICE: [
    /(?:how\s+to\s+invest|investment\s+advice|investment\s+tips)/i,
    /(?:beginner|new\s+to)\s+(?:investing|stock\s+market)/i,
    /(?:learn|understand)\s+(?:investing|stock\s+market|trading)/i,
    /(?:risk\s+management|investment\s+risk)/i,
    /(?:sip|systematic\s+investment\s+plan)/i,
  ],

  // 🆕 Order Placement Patterns (should use ORDER_PLACEMENT strategy)
  ORDER_PLACEMENT: [
    // HIGHEST PRIORITY: "Buy 2 BHEL stocks" format (quantity then symbol then stocks/shares)
    /(?:buy|purchase|order|get)\s+(\d+)\s+([A-Z]{2,10}|[a-z]+)\s+(?:shares?|stocks?)/i,

    // "Buy 2 stocks of BHEL" format (quantity then stocks/shares then symbol)
    /(?:buy|purchase|order)\s+(\d+)\s+(?:shares?|stocks?)\s+(?:of\s+)?([A-Z]{2,10}|[a-z]+)/i,

    // "Buy BHEL stock" format (no quantity specified)
    /(?:buy|purchase|get|order)\s+([A-Z]{2,10}|[a-z]+)\s+(?:stock|share)/i,

    // "Place buy order for BHEL"
    /(?:place|execute)\s+(?:a\s+)?(?:buy|sell)\s+order\s+(?:for\s+)?([A-Z]{2,10}|[a-z]+)/i,

    // "I want to buy 5 shares of TCS"
    /(?:i\s+want\s+to\s+buy|want\s+to\s+buy)\s+(\d+)?\s*(?:shares?\s+of\s+)?([A-Z]{2,10}|[a-z]+)/i,

    // "Buy 10 Reliance" or "Order 5 TCS"
    /(?:order|buy|purchase)\s+(\d+)\s+([A-Z]{2,10}|[a-z]+)/i,

    // Sell patterns - "Sell 20 BHEL shares"
    /(?:sell|exit|square\s+off)\s+(\d+)?\s*([A-Z]{2,10}|[a-z]+)?\s*(?:shares?\s+of\s+)?([A-Z]{2,10}|[a-z]+)?/i,

    // Market/Limit order patterns
    /(?:place|execute)\s+(?:a\s+)?(?:market|limit)\s+order/i,
    /(?:buy|sell)\s+(?:at\s+)?(?:market|limit)/i,

    // Price-based patterns - "Buy TCS at 3500"
    /(?:buy|purchase)\s+([A-Z]{2,10}|[a-z]+)\s+at\s+₹?\s*([\d,]+)/i,
    /(?:buy|purchase)\s+([A-Z]{2,10}|[a-z]+)\s+(?:for|@)\s+₹?\s*([\d,]+)/i,
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

    if (extractedParams.marketCapCategory) {
      confidence += 15;
      reasoning.push(`Detected market cap category preference: ${extractedParams.marketCapCategory}`);
    }

    // 🆕 Boost confidence for order placement
    if (extractedParams.orderParams) {
      confidence += 25;
      reasoning.push(`Detected order placement: ${extractedParams.orderParams.action} ${extractedParams.orderParams.quantity} shares of ${extractedParams.orderParams.symbol}`);
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

    // 🛡️ CRITICAL: Check if this is a QUESTION about buying/selling vs an actual ORDER command
    const isQuestion = /^(?:should|can|could|would|may|is|are|will|shall|do|does)\s+(?:i|you|we|it)/i.test(query) || // "Should I buy..."
                       /\b(?:should|can|could|would)\s+(?:i|you|we)\s+(?:buy|sell|invest)/i.test(query) || // "...should I buy..."
                       /\?/.test(query) || // Contains question mark
                       /\b(?:is\s+it|good\s+(?:time|idea)|right\s+time|worth|recommend|suggest|analysis|analyze|opinion|thoughts)\b/i.test(query); // Analysis keywords

    if (isQuestion) {
      reasoning.push(`Question detected - routing to analysis, not order placement`);
    }

    // 🆕 Check Order Placement patterns FIRST (highest priority for buy/sell orders)
    // BUT ONLY if this is NOT a question
    if (!isQuestion) {
      for (const pattern of INVESTMENT_INTENT_PATTERNS.ORDER_PLACEMENT) {
        if (pattern.test(query)) {
          matchedPatterns.push({ type: 'ORDER_PLACEMENT', confidence: 40 });
          reasoning.push(`Matched order placement pattern - buy/sell command detected`);
          break;
        }
      }
    }

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
      
      // Type-safe assignment
      const validIntentTypes: InvestmentIntent['intentType'][] = [
        'PORTFOLIO_RECOMMENDATION', 'STOCK_ANALYSIS', 'MARKET_RESEARCH', 'GENERAL_ADVICE', 'ORDER_PLACEMENT', 'OTHER'
      ];
      
      if (validIntentTypes.includes(bestMatch.type as InvestmentIntent['intentType'])) {
        intentType = bestMatch.type as InvestmentIntent['intentType'];
      }
      
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

    // Extract market cap category (for top stocks queries)
    params.marketCapCategory = this.extractMarketCapCategory(query);

    // Extract time horizon
    params.timeHorizon = this.extractTimeHorizon(query);

    // Extract risk level
    params.riskLevel = this.extractRiskLevel(query);

    // Extract specific stocks
    params.specificStocks = this.extractSpecificStocks(query);

    // Extract sectors
    params.sectors = this.extractSectors(query);

    // 🆕 Extract order parameters
    params.orderParams = this.extractOrderParams(query);

    return params;
  }

  /**
   * 🆕 Extract order placement parameters from query
   */
  private static extractOrderParams(query: string): { action: 'BUY' | 'SELL'; symbol: string; quantity: number; orderType?: 'MARKET' | 'LIMIT'; price?: number } | undefined {
    const lowerQuery = query.toLowerCase();

    // Determine action (BUY or SELL)
    let action: 'BUY' | 'SELL' = 'BUY'; // Default to BUY
    if (/\b(sell|exit|square\s+off)\b/i.test(query)) {
      action = 'SELL';
    }

    // Extract symbol - try multiple patterns
    let symbol: string | undefined;

    // Pattern 1: "buy 2 BHEL stocks" (quantity then symbol then stocks/shares)
    const symbolPattern1 = /(?:buy|purchase|order|get)\s+(\d+)\s+([A-Z]{2,10}|[a-z]+)\s+(?:shares?|stocks?)/i;
    const match1 = query.match(symbolPattern1);
    if (match1 && match1[2]) {
      symbol = match1[2].toUpperCase();
    }

    // Pattern 2: "buy 10 shares of TCS" (quantity then shares then symbol)
    if (!symbol) {
      const symbolPattern2 = /(?:buy|purchase|sell|order)\s+(?:\d+\s+)?(?:shares?\s+of\s+)?([A-Z]{2,10}|[a-z]+)/i;
      const match2 = query.match(symbolPattern2);
      if (match2 && match2[1]) {
        symbol = match2[1].toUpperCase();
      }
    }

    // Pattern 3: "buy TCS stock" (symbol then stock/share)
    if (!symbol) {
      const symbolPattern3 = /(?:buy|purchase|order|get)\s+([A-Z]{2,10}|[a-z]+)\s+(?:stock|share)/i;
      const match3 = query.match(symbolPattern3);
      if (match3 && match3[1]) {
        symbol = match3[1].toUpperCase();
      }
    }

    // Pattern 4: "place order for TCS"
    if (!symbol) {
      const symbolPattern4 = /(?:order|place)\s+(?:for\s+)?([A-Z]{2,10}|[a-z]+)/i;
      const match4 = query.match(symbolPattern4);
      if (match4 && match4[1]) {
        symbol = match4[1].toUpperCase();
      }
    }

    // Pattern 5: "I want to buy TCS"
    if (!symbol) {
      const symbolPattern5 = /want\s+to\s+(?:buy|purchase)\s+([A-Z]{2,10}|[a-z]+)/i;
      const match5 = query.match(symbolPattern5);
      if (match5 && match5[1]) {
        symbol = match5[1].toUpperCase();
      }
    }

    // Extract quantity
    let quantity = 1; // Default to 1 share
    const qtyPattern1 = /(\d+)\s+(?:shares?|stocks?)/i;
    const qtyMatch1 = query.match(qtyPattern1);
    if (qtyMatch1 && qtyMatch1[1]) {
      quantity = parseInt(qtyMatch1[1]);
    } else {
      // Try pattern: "buy 10 TCS"
      const qtyPattern2 = /(?:buy|purchase|sell|order)\s+(\d+)\s+\w+/i;
      const qtyMatch2 = query.match(qtyPattern2);
      if (qtyMatch2 && qtyMatch2[1]) {
        quantity = parseInt(qtyMatch2[1]);
      }
    }

    // Extract order type
    let orderType: 'MARKET' | 'LIMIT' | undefined;
    if (/\bmarket\s+order\b/i.test(query) || (/\bmarket\b/i.test(query) && /\border\b/i.test(query))) {
      orderType = 'MARKET';
    } else if (/\blimit\s+order\b/i.test(query) || (/\blimit\b/i.test(query) && /\border\b/i.test(query))) {
      orderType = 'LIMIT';
    } else if (/\bat\s+(?:market|current\s+price)\b/i.test(query)) {
      orderType = 'MARKET';
    } else if (/\bat\s+₹?\s*[\d,]+/i.test(query)) {
      orderType = 'LIMIT';
    }

    // Extract price (for limit orders)
    let price: number | undefined;
    const pricePattern1 = /(?:at|@|price|for)\s*₹?\s*([\d,]+)/i;
    const priceMatch = query.match(pricePattern1);
    if (priceMatch && priceMatch[1]) {
      price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!orderType) orderType = 'LIMIT'; // If price specified, assume LIMIT order
    }

    // Only return if we found a symbol
    if (!symbol) {
      return undefined;
    }

    // Filter out common words that might be mistaken for symbols
    const commonWords = ['STOCK', 'SHARE', 'MARKET', 'ORDER', 'PRICE', 'LIMIT', 'AT', 'FOR', 'THE', 'A', 'AN', 'IN', 'TO', 'OF', 'AND', 'OR'];
    if (commonWords.includes(symbol)) {
      return undefined;
    }

    return {
      action,
      symbol,
      quantity,
      ...(orderType && { orderType }),
      ...(price && { price })
    };
  }
  
  /**
   * Extract market cap category for top stocks queries
   */
  private static extractMarketCapCategory(query: string): 'all' | 'large' | 'mid' | 'small' | undefined {
    const lowerQuery = query.toLowerCase();

    // Check for specific market cap mentions
    if (lowerQuery.includes('large cap') || lowerQuery.includes('largecap') || lowerQuery.includes('blue chip')) {
      return 'large';
    }

    if (lowerQuery.includes('mid cap') || lowerQuery.includes('midcap')) {
      return 'mid';
    }

    if (lowerQuery.includes('small cap') || lowerQuery.includes('smallcap')) {
      return 'small';
    }

    // If it's a general trending/top stocks query without specific category
    if (/(?:trending|hot|popular|rising|top|best)\s+(?:stocks?|shares?)/i.test(query)) {
      return 'all';
    }

    return undefined;
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

    // 🆕 HIGHEST PRIORITY: Order placement intent -> ORDER_PLACEMENT
    if (intentType === 'ORDER_PLACEMENT' && params.orderParams) {
      return 'ORDER_PLACEMENT';
    }

    // If order params detected but intent type is different, still use ORDER_PLACEMENT
    if (params.orderParams && params.orderParams.symbol && params.orderParams.quantity) {
      return 'ORDER_PLACEMENT';
    }

    // If specific stocks mentioned, use specific analysis
    if (intentType === 'STOCK_ANALYSIS' && params.specificStocks && params.specificStocks.length > 0) {
      return 'SPECIFIC_ANALYSIS';
    }

    // PRIORITY 2: Market research with category preference (trending/top stocks) -> TOP_STOCKS
    if (intentType === 'MARKET_RESEARCH' && params.marketCapCategory) {
      return 'TOP_STOCKS';
    }

    // PRIORITY 3: "I want to invest in Large Cap" without amount -> TOP_STOCKS
    if (params.marketCapCategory && !params.amount && !params.marketCapPreference) {
      return 'TOP_STOCKS';
    }

    // PRIORITY 4: Portfolio recommendation with investment intent -> Railway API
    if (intentType === 'PORTFOLIO_RECOMMENDATION') {
      return 'RAILWAY_API';
    }

    // Market research queries without category -> Railway API
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
    if (confidence >= 80 && (intentType === 'STOCK_ANALYSIS' || intentType === 'GENERAL_ADVICE' || intentType === 'OTHER')) {
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