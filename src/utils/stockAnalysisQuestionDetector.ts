/**
 * Utility to detect stock analysis queries that should trigger questionnaire
 */

export interface StockAnalysisQuery {
  needsQuestionnaire: boolean;
  stockSymbol?: string;
  stockName?: string;
  confidence: number;
  reasoning: string;
  queryType: 'BUY_SELL_ADVICE' | 'STOCK_ANALYSIS' | 'SPECIFIC_QUERY' | 'OTHER';
}

/**
 * Patterns that indicate buy/sell recommendation queries requiring questionnaire
 */
const BUY_SELL_PATTERNS = [
  // Direct buy/sell questions
  /(?:should|shall|can)\s+(?:i|we)\s+(?:buy|purchase|sell|hold)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Investment decision questions
  /(?:is|are)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(?:stock|share|shares)?\s+(?:a\s+)?(?:good|bad|worth|safe)\s+(?:buy|investment|purchase)/i,
  
  // Advice seeking patterns
  /(?:what|how)\s+(?:do\s+you\s+think|are\s+your\s+thoughts)\s+(?:about|on)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Recommendation patterns
  /(?:recommend|suggest|advice)\s+(?:me\s+)?(?:about\s+)?([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Investment worth patterns
  /(?:is|are)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(?:stock|share|shares)?\s+(?:worth|good\s+for)\s+(?:investing|investment|buying)/i,
  
  // Time-based decision patterns
  /(?:right\s+time|good\s+time|best\s+time)\s+to\s+(?:buy|sell|invest\s+in)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i
];

/**
 * Patterns for general stock analysis (also needs questionnaire but different focus)
 */
const ANALYSIS_PATTERNS = [
  // Analysis requests
  /(?:analyze|analysis|review|evaluate)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Opinion requests
  /(?:opinion|thoughts|view)\s+on\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Prediction patterns
  /(?:future|outlook|prediction|forecast)\s+(?:of|for)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i
];

/**
 * Patterns that indicate specific queries (less likely to need questionnaire)
 */
const SPECIFIC_QUERY_PATTERNS = [
  // Price queries
  /(?:price|cost|value)\s+of\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:stock|share|shares)?/i,
  
  // Financial metrics queries
  /(?:pe\s+ratio|eps|dividend|market\s+cap|revenue)\s+(?:of|for)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
  
  // Company info queries
  /(?:what|who)\s+(?:is|are)\s+([A-Z]{2,10}|[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s*(?:company)?/i
];

/**
 * Extract stock symbol/name from query
 */
function extractStockInfo(query: string, match: RegExpMatchArray): { symbol?: string; name?: string } {
  if (!match || !match[1]) return {};
  
  const extracted = match[1].trim().toUpperCase();
  
  // If it looks like a stock symbol (2-10 uppercase letters)
  if (/^[A-Z]{2,10}$/.test(extracted)) {
    return { symbol: extracted };
  }
  
  // Otherwise treat as company name
  return { 
    name: match[1].trim(),
    symbol: undefined // Will be resolved later by fuzzy matching
  };
}

/**
 * Determine confidence level based on pattern match and query characteristics
 */
function calculateConfidence(
  query: string, 
  queryType: StockAnalysisQuery['queryType'],
  hasStockInfo: boolean
): number {
  let confidence = 50;
  
  // Base confidence by query type
  switch (queryType) {
    case 'BUY_SELL_ADVICE':
      confidence = 85;
      break;
    case 'STOCK_ANALYSIS':
      confidence = 75;
      break;
    case 'SPECIFIC_QUERY':
      confidence = 40;
      break;
    default:
      confidence = 30;
  }
  
  // Boost confidence if we found stock information
  if (hasStockInfo) confidence += 15;
  
  // Boost confidence for decision-making keywords
  const decisionKeywords = ['should', 'buy', 'sell', 'invest', 'recommend', 'advice', 'good', 'bad', 'worth'];
  const hasDecisionKeywords = decisionKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  if (hasDecisionKeywords) confidence += 10;
  
  // Reduce confidence for informational keywords
  const informationalKeywords = ['what', 'price', 'cost', 'value', 'who', 'when', 'where'];
  const hasInformationalKeywords = informationalKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  if (hasInformationalKeywords && queryType !== 'BUY_SELL_ADVICE') confidence -= 15;
  
  return Math.min(Math.max(confidence, 0), 95);
}

/**
 * Main function to detect if a stock analysis query needs questionnaire
 */
export function detectStockAnalysisQuery(query: string): StockAnalysisQuery {
  const cleanQuery = query.trim();
  
  // Check for buy/sell advice patterns (highest priority)
  for (const pattern of BUY_SELL_PATTERNS) {
    const match = cleanQuery.match(pattern);
    if (match) {
      const stockInfo = extractStockInfo(cleanQuery, match);
      const confidence = calculateConfidence(cleanQuery, 'BUY_SELL_ADVICE', !!stockInfo.symbol || !!stockInfo.name);
      
      return {
        needsQuestionnaire: confidence >= 65,
        stockSymbol: stockInfo.symbol,
        stockName: stockInfo.name,
        confidence,
        queryType: 'BUY_SELL_ADVICE',
        reasoning: `Detected buy/sell recommendation query. User needs personalized advice based on investment profile.`
      };
    }
  }
  
  // Check for analysis patterns
  for (const pattern of ANALYSIS_PATTERNS) {
    const match = cleanQuery.match(pattern);
    if (match) {
      const stockInfo = extractStockInfo(cleanQuery, match);
      const confidence = calculateConfidence(cleanQuery, 'STOCK_ANALYSIS', !!stockInfo.symbol || !!stockInfo.name);
      
      return {
        needsQuestionnaire: confidence >= 60,
        stockSymbol: stockInfo.symbol,
        stockName: stockInfo.name,
        confidence,
        queryType: 'STOCK_ANALYSIS',
        reasoning: `Detected stock analysis query. Personalized context will improve analysis quality.`
      };
    }
  }
  
  // Check for specific queries (lower priority for questionnaire)
  for (const pattern of SPECIFIC_QUERY_PATTERNS) {
    const match = cleanQuery.match(pattern);
    if (match) {
      const stockInfo = extractStockInfo(cleanQuery, match);
      const confidence = calculateConfidence(cleanQuery, 'SPECIFIC_QUERY', !!stockInfo.symbol || !!stockInfo.name);
      
      return {
        needsQuestionnaire: false, // Specific queries typically don't need questionnaire
        stockSymbol: stockInfo.symbol,
        stockName: stockInfo.name,
        confidence,
        queryType: 'SPECIFIC_QUERY',
        reasoning: `Detected specific query. Direct analysis without questionnaire is appropriate.`
      };
    }
  }
  
  // Default case - no clear stock analysis pattern detected
  return {
    needsQuestionnaire: false,
    confidence: 20,
    queryType: 'OTHER',
    reasoning: `No clear stock analysis pattern detected. Regular processing recommended.`
  };
}

/**
 * Helper function to create a comprehensive reasoning message
 */
export function getDetailedReasoning(result: StockAnalysisQuery): string {
  const { queryType, confidence, needsQuestionnaire, stockSymbol, stockName } = result;
  
  let reasoning = `Query Type: ${queryType}\n`;
  reasoning += `Confidence: ${confidence}%\n`;
  reasoning += `Needs Questionnaire: ${needsQuestionnaire ? 'Yes' : 'No'}\n`;
  
  if (stockSymbol) reasoning += `Stock Symbol: ${stockSymbol}\n`;
  if (stockName) reasoning += `Stock Name: ${stockName}\n`;
  
  reasoning += `\nReasoning: ${result.reasoning}`;
  
  return reasoning;
}

/**
 * Test cases for validation
 */
export const EXAMPLE_QUERIES = {
  BUY_SELL_ADVICE: [
    "Should I buy Reliance stock?",
    "Is TCS a good buy right now?",
    "Can I sell my HDFC Bank shares?",
    "Is it the right time to invest in Infosys?",
    "What do you think about buying Wipro shares?",
    "Should I hold or sell my SBI position?"
  ],
  STOCK_ANALYSIS: [
    "Analyze ICICI Bank stock for me",
    "Give me your analysis on Maruti Suzuki",
    "What's your opinion on Bajaj Finance?",
    "Review Tata Motors stock",
    "Future outlook for Asian Paints"
  ],
  SPECIFIC_QUERIES: [
    "What's the current price of Reliance?",
    "PE ratio of TCS",
    "What is HDFC Bank's market cap?",
    "Who is the CEO of Infosys?",
    "When does Wipro announce earnings?"
  ]
};

/**
 * Test the detector with example queries
 */
export function testStockAnalysisDetector() {
  console.log('🧪 Testing Stock Analysis Query Detector\n');
  
  Object.entries(EXAMPLE_QUERIES).forEach(([category, queries]) => {
    console.log(`\n--- ${category} ---`);
    queries.forEach(query => {
      const result = detectStockAnalysisQuery(query);
      console.log(`Query: "${query}"`);
      console.log(`Result: ${result.needsQuestionnaire ? '✅ QUESTIONNAIRE' : '❌ DIRECT'} (${result.confidence}%)`);
      console.log(`Type: ${result.queryType}`);
      if (result.stockSymbol || result.stockName) {
        console.log(`Stock: ${result.stockSymbol || result.stockName}`);
      }
      console.log(`Reasoning: ${result.reasoning}\n`);
    });
  });
}