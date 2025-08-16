/**
 * Intelligent Intent Analysis Service
 * Uses AI to understand user intent before routing to appropriate handlers
 */

export interface QueryIntent {
  type: 'SINGLE_STOCK_ANALYSIS' | 'STOCK_COMPARISON' | 'MARKET_NEWS_ANALYSIS' | 'SECTOR_ANALYSIS' | 'INVESTMENT_RECOMMENDATION' | 'PORTFOLIO_ALLOCATION' | 'LOAN_ANALYSIS' | 'TAX_PLANNING' | 'FINANCIAL_PLANNING' | 'CALCULATOR_REQUEST' | 'GENERIC_FINANCIAL';
  confidence: number;
  entities: {
    stocks?: string[];
    sectors?: string[];
    amount?: number;
    frequency?: 'LUMP_SUM' | 'SIP' | 'RECURRING';
    timeHorizon?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    riskTolerance?: 'LOW' | 'MODERATE' | 'HIGH';
    loanType?: 'HOME' | 'CAR' | 'PERSONAL';
    taxSection?: string;
    calculatorType?: string;
    newsKeywords?: string[];
  };
  reasoning: string;
  suggestedActions?: string[];
}

export class IntentAnalysisService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Analyze user query intent using AI
   */
  static async analyzeIntent(query: string): Promise<QueryIntent> {
    try {
      console.log(`🧠 Analyzing intent for query: "${query}"`);

      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ AI API key not found, falling back to rule-based analysis');
        return this.fallbackAnalysis(query);
      }

      const systemPrompt = `You are an expert financial AI assistant that analyzes user queries to understand their exact intent. Your goal is to classify financial questions intelligently without relying on keyword matching.

COMPREHENSIVE INTENT TYPES:

1. SINGLE_STOCK_ANALYSIS - Analysis of one specific stock/company
   Examples: "How is Reliance doing?", "Should I buy TCS?", "What's the price of HDFC Bank?"

2. STOCK_COMPARISON - Comparing multiple stocks/companies
   Examples: "HDFC vs SBI which is better?", "Compare Infosys and TCS", "Between Reliance and Adani, which should I pick?"

3. MARKET_NEWS_ANALYSIS - General market trends, news, sentiment
   Examples: "How is the market today?", "What's happening in Nifty?", "Market outlook for next month"

4. SECTOR_ANALYSIS - Analysis of specific sectors/industries
   Examples: "How is banking sector performing?", "IT sector outlook", "Auto stocks analysis"

5. INVESTMENT_RECOMMENDATION - Seeking investment advice, often with amounts
   Examples: "Where to invest 1 lakh?", "Best stocks for long term", "Investment options for 25 year old"

6. PORTFOLIO_ALLOCATION - Portfolio construction, diversification, asset allocation
   Examples: "How to diversify my portfolio?", "Asset allocation for retirement", "Portfolio rebalancing advice"

7. LOAN_ANALYSIS - Loan calculations, EMI, prepayments, refinancing
   Examples: "Home loan EMI calculation", "Should I prepay my loan?", "Car loan vs personal loan"

8. TAX_PLANNING - Tax-related questions, deductions, strategies
   Examples: "How to save tax?", "LTCG tax on stocks", "Section 80C investments"

9. FINANCIAL_PLANNING - General financial planning, goals, life events
   Examples: "Financial planning for marriage", "Retirement corpus calculation", "Emergency fund advice"

10. CALCULATOR_REQUEST - Specific calculator or tool requests
    Examples: "SIP calculator", "Capital gains calculator", "Show me EMI calculator"

11. GENERIC_FINANCIAL - General financial education, concepts, definitions
    Examples: "What is SIP?", "Difference between stocks and bonds", "How compound interest works"

ENTITY EXTRACTION GUIDELINES:
- stocks: Extract ALL stock/company names mentioned (normalize: "HDFC Bank" → "HDFC BANK", "SBI" → "SBI")
- sectors: Banking, IT, Auto, Pharma, Energy, FMCG, etc.
- amount: Extract only if explicitly mentioned with numbers
- frequency: LUMP_SUM (one-time), SIP (monthly), RECURRING (regular intervals)
- timeHorizon: SHORT_TERM (<1 year), MEDIUM_TERM (1-3 years), LONG_TERM (>3 years)
- riskTolerance: LOW (conservative), MODERATE (balanced), HIGH (aggressive)
- loanType: HOME, CAR, PERSONAL
- taxSection: 80C, 80D, 24B, etc.
- calculatorType: EMI, SIP, Capital Gains, etc.
- newsKeywords: Market events, economic terms mentioned
- suggestedActions: What the user should do next based on their query

CRITICAL INSTRUCTIONS:
- Analyze the ENTIRE query context, not just keywords
- Consider user's underlying financial goal and situation
- Distinguish between analysis requests vs comparison requests vs advice requests
- Be conservative with confidence scores - only high confidence for very clear intents
- Always provide clear reasoning for your classification
- If multiple intents are possible, choose the most specific one

Return ONLY a valid JSON object:
{
  "type": "INTENT_TYPE",
  "confidence": 85,
  "entities": {
    "stocks": ["STOCK1", "STOCK2"],
    "amount": 50000,
    "frequency": "LUMP_SUM",
    "timeHorizon": "LONG_TERM"
  },
  "reasoning": "Detailed explanation of why this specific intent was chosen",
  "suggestedActions": ["Specific action 1", "Specific action 2"]
}`;

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 500,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        console.error(`❌ Intent analysis API error: ${response.status}`);
        return this.fallbackAnalysis(query);
      }

      const data = await response.json();
      const intentResult = JSON.parse(data.choices[0].message.content);

      console.log(`✅ Intent analysis result:`, intentResult);
      return intentResult as QueryIntent;

    } catch (error) {
      console.error('❌ Error in intent analysis:', error);
      return this.fallbackAnalysis(query);
    }
  }

  /**
   * Simple fallback when AI is not available - minimal classification
   */
  private static fallbackAnalysis(query: string): QueryIntent {
    console.log(`🔄 AI unavailable, using minimal fallback for: "${query}"`);
    
    return {
      type: 'GENERIC_FINANCIAL',
      confidence: 30,
      entities: {},
      reasoning: 'AI analysis unavailable - requires manual routing or user clarification',
      suggestedActions: [
        'Please rephrase your question for better understanding',
        'Try asking about specific topics like stocks, loans, or investments',
        'Use our specialized calculators for specific calculations'
      ]
    };
  }

  /**
   * Normalize stock names to match our database
   */
  static normalizeStockName(stockName: string): string {
    const normalizations: Record<string, string> = {
      'HDFC BANK': 'HDFCBANK',
      'SBI': 'SBIN',
      'STATE BANK OF INDIA': 'SBIN',
      'RELIANCE': 'RELIANCE',
      'TCS': 'TCS',
      'INFOSYS': 'INFY',
      'ICICI BANK': 'ICICIBANK',
      'KOTAK BANK': 'KOTAKBANK',
      'AXIS BANK': 'AXISBANK',
      'WIPRO': 'WIPRO',
      'HCL': 'HCLTECH',
      'BAJAJ FINANCE': 'BAJFINANCE',
      'MARUTI': 'MARUTI',
      'ASIAN PAINTS': 'ASIANPAINT',
      'NESTLE': 'NESTLEIND',
      'ITC': 'ITC'
    };

    return normalizations[stockName.toUpperCase()] || stockName;
  }
}