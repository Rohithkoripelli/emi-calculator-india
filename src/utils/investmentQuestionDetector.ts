/**
 * Utility to detect generic investment questions that should trigger the questionnaire
 */

export interface GenericInvestmentQuery {
  isGeneric: boolean;
  confidence: number;
  extractedAmount?: number;
  extractedTimeframe?: string;
  reasoning: string;
}

/**
 * Patterns that indicate generic investment questions requiring questionnaire
 */
const GENERIC_INVESTMENT_PATTERNS = [
  // Amount + generic investment questions
  /(?:invest|investment|investing)\s+(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)\s+(?:in|into)?\s*(?:stock|share|equity|market)/i,
  
  // Monthly investment patterns
  /(?:monthly|every month|each month)\s+(?:invest|investment|sip)\s+(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)/i,
  
  // Time-based investment queries
  /(?:invest|investment)\s+(?:for|over)\s+(?:next|coming)?\s*(?:\d+\s*(?:months?|years?))/i,
  
  // Generic "what stocks to buy" patterns
  /(?:what|which|where)\s+(?:stocks?|shares?|companies?)\s+(?:should|to|can)\s+(?:i|we)\s+(?:buy|invest|purchase)/i,
  
  // Portfolio allocation questions
  /(?:how|where)\s+(?:should|to|can)\s+(?:i|we)\s+(?:allocate|invest|distribute)\s+(?:my|our)?\s*(?:money|funds|capital)/i,
  
  // Best investment questions
  /(?:best|good|top)\s+(?:stocks?|shares?|investment|companies?)\s+(?:to|for)\s+(?:buy|invest)/i,
  
  // Amount-based investment questions
  /(?:have|got|with)\s+(?:[\d,]+k?|[\d,]+\s*(?:thousand|lakh|crore)|₹[\d,]+)\s+(?:to|for)?\s*(?:invest|investment)/i,
  
  // SIP and systematic investment questions
  /(?:sip|systematic|regular)\s+(?:investment|investing)/i,
  
  // Short/long term investment questions
  /(?:short|long)\s*(?:term|period)?\s+(?:investment|investing|stocks?)/i
];

/**
 * Patterns that indicate specific stock queries (should NOT trigger questionnaire)
 */
const SPECIFIC_STOCK_PATTERNS = [
  // Specific company names or symbols
  /(?:reliance|tcs|infosys|hdfc|icici|sbi|wipro|hcl|bajaj|maruti)/i,
  
  // Stock symbols
  /(?:[A-Z]{2,10})\s+(?:stock|share|analysis)/i,
  
  // "Should I buy [specific stock]" patterns
  /should\s+(?:i|we)\s+buy\s+(?:[A-Z]{2,10}|[a-z]+\s+[a-z]+)\s*(?:stock|share)?$/i,
  
  // Analysis requests for specific stocks
  /(?:analyze|analysis|review)\s+(?:[A-Z]{2,10}|[a-z]+\s+[a-z]+)/i
];

/**
 * Extract amount from investment query
 */
export function extractInvestmentAmount(query: string): number | undefined {
  const patterns = [
    // Rupee symbols
    /₹\s*([\d,]+)(?:k|000)?/i,
    
    // Numbers with currency words
    /([\d,]+)\s*(?:thousand|lakh|crore)/i,
    
    // Numbers with k suffix
    /([\d,]+)k/i,
    
    // Plain numbers followed by investment keywords
    /(?:invest|investment|sip)\s+(?:of\s+)?([\d,]+)/i,
    
    // Numbers at start of investment queries
    /^([\d,]+)\s+(?:rupees?|rs\.?|₹)?\s*(?:invest|investment|sip|monthly)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      
      // Handle units
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
 * Extract timeframe from investment query
 */
export function extractTimeframe(query: string): string | undefined {
  const patterns = [
    /(?:for|over|next|coming)\s+(\d+\s*(?:months?|years?))/i,
    /(?:short|long)\s*(?:term|period)/i,
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
 * Main function to detect if a query is a generic investment question
 */
export function detectGenericInvestmentQuery(query: string): GenericInvestmentQuery {
  const cleanQuery = query.toLowerCase().trim();
  
  // First check if it's a specific stock query (should NOT trigger questionnaire)
  for (const pattern of SPECIFIC_STOCK_PATTERNS) {
    if (pattern.test(query)) {
      return {
        isGeneric: false,
        confidence: 90,
        reasoning: `Detected specific stock analysis query: "${query.substring(0, 50)}..."`
      };
    }
  }
  
  // Check for generic investment patterns
  let matchCount = 0;
  let highestConfidence = 0;
  let matchedPatterns: string[] = [];
  
  for (const pattern of GENERIC_INVESTMENT_PATTERNS) {
    if (pattern.test(query)) {
      matchCount++;
      highestConfidence = Math.max(highestConfidence, 80);
      matchedPatterns.push(pattern.toString());
    }
  }
  
  // Extract additional information
  const extractedAmount = extractInvestmentAmount(query);
  const extractedTimeframe = extractTimeframe(query);
  
  // Boost confidence if we found amount or timeframe
  if (extractedAmount) highestConfidence += 10;
  if (extractedTimeframe) highestConfidence += 10;
  
  // Additional keyword checks for confidence boosting
  const investmentKeywords = ['invest', 'investment', 'stock market', 'portfolio', 'sip', 'mutual fund', 'equity'];
  const questionKeywords = ['what', 'which', 'where', 'how', 'should', 'best', 'recommend'];
  
  const hasInvestmentKeywords = investmentKeywords.some(keyword => cleanQuery.includes(keyword));
  const hasQuestionKeywords = questionKeywords.some(keyword => cleanQuery.includes(keyword));
  
  if (hasInvestmentKeywords && hasQuestionKeywords) {
    highestConfidence += 15;
  }
  
  // Determine if it's generic based on patterns and confidence
  const isGeneric = matchCount > 0 && highestConfidence >= 70;
  
  return {
    isGeneric,
    confidence: Math.min(highestConfidence, 95),
    extractedAmount,
    extractedTimeframe,
    reasoning: isGeneric 
      ? `Detected generic investment question with ${matchCount} pattern matches. Keywords suggest user needs personalized investment advice.`
      : `Query appears to be specific or doesn't match generic investment patterns. Confidence: ${highestConfidence}%`
  };
}

/**
 * Helper function to create example queries for testing
 */
export const EXAMPLE_GENERIC_QUERIES = [
  "I want to invest 10K in stock market from Sep 1st. Every month I want to invest 10K, So in short term for next 3 months, what stocks should I buy?",
  "Where should I invest 50000 rupees?",
  "I have 1 lakh to invest in stocks, what should I do?",
  "Monthly SIP of 10000, which stocks are good?",
  "Best stocks to buy for long term investment",
  "I want to invest in stock market, need recommendations",
  "What are some good investment options for 2 lakh rupees?",
  "Short term investment options for next 6 months"
];

/**
 * Helper function for testing the detector
 */
export function testInvestmentDetector() {
  console.log('🧪 Testing Generic Investment Query Detector');
  
  EXAMPLE_GENERIC_QUERIES.forEach(query => {
    const result = detectGenericInvestmentQuery(query);
    console.log(`Query: "${query.substring(0, 60)}..."`);
    console.log(`Result: ${result.isGeneric ? '✅ GENERIC' : '❌ SPECIFIC'} (${result.confidence}%)`);
    console.log(`Amount: ${result.extractedAmount || 'Not found'}`);
    console.log(`Timeframe: ${result.extractedTimeframe || 'Not found'}`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log('---');
  });
}