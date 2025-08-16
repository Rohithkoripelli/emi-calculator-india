/**
 * Intelligent Intent Analysis Service
 * Uses AI to understand user intent before routing to appropriate handlers
 */

export interface QueryIntent {
  type: 'SINGLE_STOCK_ANALYSIS' | 'STOCK_COMPARISON' | 'INVESTMENT_RECOMMENDATION' | 'PORTFOLIO_ALLOCATION' | 'GENERIC_FINANCIAL' | 'LOAN_ANALYSIS';
  confidence: number;
  entities: {
    stocks?: string[];
    amount?: number;
    frequency?: 'LUMP_SUM' | 'SIP' | 'RECURRING';
    timeHorizon?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    riskTolerance?: 'LOW' | 'MODERATE' | 'HIGH';
  };
  reasoning: string;
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

      const systemPrompt = `You are an expert financial query analyzer. Your job is to understand the user's intent and extract relevant entities from their financial questions.

INTENT TYPES:
1. SINGLE_STOCK_ANALYSIS - User wants analysis of one specific stock
2. STOCK_COMPARISON - User wants to compare 2 or more stocks
3. INVESTMENT_RECOMMENDATION - User wants investment advice with specific amount
4. PORTFOLIO_ALLOCATION - User wants portfolio suggestions or allocation advice
5. GENERIC_FINANCIAL - General financial questions (tax, loans, planning)
6. LOAN_ANALYSIS - Specific loan/EMI related questions

ENTITY EXTRACTION:
- stocks: Array of stock names/symbols mentioned (normalize to common names like "HDFC BANK", "SBI", "RELIANCE")
- amount: Investment amount if mentioned
- frequency: Investment pattern (LUMP_SUM, SIP, RECURRING)
- timeHorizon: SHORT_TERM (<1 year), MEDIUM_TERM (1-3 years), LONG_TERM (>3 years)
- riskTolerance: LOW, MODERATE, HIGH

IMPORTANT RULES:
- For stock comparisons, extract ALL stock names mentioned
- Be strict about amounts - only extract if clearly stated
- Provide confidence score (0-100) based on clarity of intent
- Give clear reasoning for your classification

Return ONLY a JSON object with this structure:
{
  "type": "INTENT_TYPE",
  "confidence": 85,
  "entities": {
    "stocks": ["STOCK1", "STOCK2"],
    "amount": 50000,
    "frequency": "LUMP_SUM"
  },
  "reasoning": "Clear explanation of why this intent was chosen"
}`;

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
   * Fallback rule-based analysis when AI is not available
   */
  private static fallbackAnalysis(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    console.log(`🔄 Using fallback analysis for: "${query}"`);

    // Check for stock comparison patterns
    const comparisonKeywords = ['compare', 'vs', 'versus', 'between', 'which is better', 'should i choose'];
    const hasComparison = comparisonKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Extract potential stock names (simplified)
    const stockPatterns = [
      'hdfc', 'sbi', 'reliance', 'tcs', 'infosys', 'icici', 'kotak', 'axis',
      'wipro', 'hcl', 'bajaj', 'maruti', 'asian paints', 'nestle', 'itc'
    ];
    
    const foundStocks: string[] = [];
    stockPatterns.forEach(pattern => {
      if (lowerQuery.includes(pattern)) {
        if (pattern === 'hdfc') foundStocks.push('HDFC BANK');
        else if (pattern === 'sbi') foundStocks.push('SBI');
        else foundStocks.push(pattern.toUpperCase());
      }
    });

    // Check for investment amount
    const amountMatch = query.match(/(\d+(?:,\d+)*)\s*(?:k|thousand|lakh|lakhs|crore|crores|rupees|rs|₹)?/i);
    let amount: number | undefined;
    if (amountMatch) {
      const numericValue = parseInt(amountMatch[1].replace(/,/g, ''));
      const unit = amountMatch[0].toLowerCase();
      if (unit.includes('k') || unit.includes('thousand')) {
        amount = numericValue * 1000;
      } else if (unit.includes('lakh')) {
        amount = numericValue * 100000;
      } else if (unit.includes('crore')) {
        amount = numericValue * 10000000;
      } else if (numericValue >= 1000) {
        amount = numericValue;
      }
    }

    // Determine intent
    if (hasComparison && foundStocks.length >= 2) {
      return {
        type: 'STOCK_COMPARISON',
        confidence: 80,
        entities: { stocks: foundStocks },
        reasoning: 'Detected comparison keywords with multiple stocks mentioned'
      };
    } else if (foundStocks.length === 1) {
      return {
        type: 'SINGLE_STOCK_ANALYSIS',
        confidence: 75,
        entities: { stocks: foundStocks },
        reasoning: 'Single stock mentioned without comparison context'
      };
    } else if (amount && (lowerQuery.includes('invest') || lowerQuery.includes('portfolio'))) {
      return {
        type: 'INVESTMENT_RECOMMENDATION',
        confidence: 70,
        entities: { amount },
        reasoning: 'Investment amount mentioned with investment keywords'
      };
    } else if (lowerQuery.includes('loan') || lowerQuery.includes('emi') || lowerQuery.includes('prepay')) {
      return {
        type: 'LOAN_ANALYSIS',
        confidence: 75,
        entities: {},
        reasoning: 'Loan/EMI related keywords detected'
      };
    } else {
      return {
        type: 'GENERIC_FINANCIAL',
        confidence: 60,
        entities: {},
        reasoning: 'General financial query without specific categorization'
      };
    }
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