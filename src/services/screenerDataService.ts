/**
 * Screener.in Data Service - Extract comprehensive financial metrics
 * Dynamically constructs URLs and scrapes financial data from Screener.in
 */

interface ScreenerFinancialMetrics {
  // Basic metrics
  marketCap?: string;
  currentPrice?: number;
  bookValue?: number;
  dividendYield?: number;
  faceValue?: number;
  
  // Profitability ratios
  eps?: number;
  pe?: number;
  roe?: number;
  roce?: number;
  
  // Growth metrics
  revenueGrowth?: number;
  profitGrowth?: number;
  
  // Financial health
  debtToEquity?: number;
  currentRatio?: number;
  
  // Other metrics
  pbv?: number; // Price to Book Value
  evEbitda?: number;
  
  // Metadata
  companyName?: string;
  sector?: string;
  industry?: string;
  lastUpdated?: string;
}

export class ScreenerDataService {
  private static readonly BASE_URL = 'https://www.screener.in/company';
  
  /**
   * Build dynamic URL for Screener.in based on stock symbol
   */
  private static buildScreenerUrl(stockSymbol: string): string {
    const url = `${this.BASE_URL}/${stockSymbol}/consolidated/`;
    console.log(`📊 Built Screener URL for ${stockSymbol}: ${url}`);
    return url;
  }

  /**
   * Extract financial metrics from Screener.in page
   */
  static async getFinancialMetrics(stockSymbol: string): Promise<ScreenerFinancialMetrics | null> {
    try {
      console.log(`💰 Fetching financial data from Screener.in for ${stockSymbol}...`);
      
      const url = this.buildScreenerUrl(stockSymbol);
      
      // Use WebFetch to get and parse the Screener.in page
      const prompt = `
        Extract comprehensive financial metrics from this Screener.in page for stock ${stockSymbol}.
        
        Look for and extract these specific financial metrics:
        
        BASIC METRICS:
        - Market Cap (₹ Cr)
        - Current Price (₹)
        - Book Value (₹)
        - Dividend Yield (%)
        - Face Value (₹)
        
        PROFITABILITY RATIOS:
        - EPS (Earnings Per Share) in ₹
        - P/E Ratio
        - ROE (Return on Equity) %
        - ROCE (Return on Capital Employed) %
        
        GROWTH METRICS:
        - Revenue Growth % (YoY or 3-year CAGR)
        - Profit Growth % (YoY or 3-year CAGR)
        
        FINANCIAL HEALTH:
        - Debt to Equity Ratio
        - Current Ratio
        
        OTHER RATIOS:
        - P/BV (Price to Book Value)
        - EV/EBITDA
        
        COMPANY INFO:
        - Company Name
        - Sector
        - Industry
        
        Return ONLY a JSON object with the extracted values. Use null for any metrics not found.
        Format numbers without currency symbols or percentage signs (just the numeric value).
        
        Example format:
        {
          "marketCap": "₹7,758 Cr",
          "currentPrice": 631.25,
          "eps": 24.5,
          "pe": 25.8,
          "roe": 15.2,
          "roce": 12.8,
          "bookValue": 245.6,
          "dividendYield": 1.2,
          "revenueGrowth": 18.5,
          "profitGrowth": 22.3,
          "companyName": "Vimta Labs Limited",
          "sector": "Healthcare",
          "industry": "Testing Services"
        }
      `;
      
      const { WebFetch } = await import('../utils/webSearchUtil');
      const extractedData = await WebFetch(url, prompt);
      
      console.log(`📊 Raw Screener data for ${stockSymbol}:`, extractedData);
      
      // Try to parse the extracted data as JSON
      let financialMetrics: ScreenerFinancialMetrics = {};
      
      try {
        // Look for JSON in the response
        const jsonMatch = extractedData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          financialMetrics = JSON.parse(jsonMatch[0]);
          console.log(`✅ Successfully parsed Screener data for ${stockSymbol}:`, financialMetrics);
        } else {
          console.log(`⚠️ No JSON found in Screener response for ${stockSymbol}`);
          // Try to extract key metrics manually from text
          financialMetrics = this.parseTextualData(extractedData, stockSymbol);
        }
      } catch (parseError) {
        console.log(`⚠️ Failed to parse JSON, attempting text extraction for ${stockSymbol}`);
        financialMetrics = this.parseTextualData(extractedData, stockSymbol);
      }
      
      // Add metadata
      financialMetrics.lastUpdated = new Date().toISOString();
      
      if (Object.keys(financialMetrics).length > 1) { // More than just lastUpdated
        console.log(`✅ Successfully extracted ${Object.keys(financialMetrics).length - 1} financial metrics for ${stockSymbol}`);
        return financialMetrics;
      } else {
        console.log(`❌ No financial metrics extracted for ${stockSymbol}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching Screener data for ${stockSymbol}:`, error);
      return null;
    }
  }
  
  /**
   * Parse textual data when JSON parsing fails
   */
  private static parseTextualData(text: string, stockSymbol: string): ScreenerFinancialMetrics {
    console.log(`🔍 Attempting text parsing for ${stockSymbol}...`);
    
    const metrics: ScreenerFinancialMetrics = {};
    
    // Common patterns for extracting metrics from text
    const patterns = {
      eps: /(?:eps|earnings per share).*?₹?\s*(\d+(?:\.\d+)?)/i,
      pe: /(?:p\/e|pe ratio|price.*earnings).*?(\d+(?:\.\d+)?)/i,
      roe: /(?:roe|return on equity).*?(\d+(?:\.\d+)?)%?/i,
      roce: /(?:roce|return on capital).*?(\d+(?:\.\d+)?)%?/i,
      bookValue: /(?:book value).*?₹?\s*(\d+(?:\.\d+)?)/i,
      dividendYield: /(?:dividend yield).*?(\d+(?:\.\d+)?)%?/i,
      marketCap: /(?:market cap).*?(₹[\d,]+\s*(?:cr|crore))/i,
      currentPrice: /(?:current price|price).*?₹?\s*(\d+(?:\.\d+)?)/i
    };
    
    // Extract metrics using patterns
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'marketCap') {
          (metrics as any)[key] = match[1];
        } else {
          const value = parseFloat(match[1]);
          if (!isNaN(value)) {
            (metrics as any)[key] = value;
            console.log(`📊 Extracted ${key}: ${value} for ${stockSymbol}`);
          }
        }
      }
    }
    
    return metrics;
  }
  
  /**
   * Format financial metrics for display
   */
  static formatMetricsForDisplay(metrics: ScreenerFinancialMetrics): string[] {
    const displayMetrics: string[] = [];
    
    if (metrics.eps !== undefined) {
      displayMetrics.push(`EPS (earnings per share) stands at ₹${metrics.eps}. This indicates the company's profit allocation per share`);
    }
    
    if (metrics.roe !== undefined) {
      displayMetrics.push(`Company has maintained a Return on Equity of ${metrics.roe}%, indicating management's ability to generate profits from equity`);
    }
    
    if (metrics.pe !== undefined) {
      displayMetrics.push(`Stock is trading at a P/E ratio of ${metrics.pe}, indicating the valuation relative to earnings`);
    }
    
    if (metrics.roce !== undefined) {
      displayMetrics.push(`Return on Capital Employed is ${metrics.roce}%, showing efficiency in capital utilization`);
    }
    
    if (metrics.bookValue !== undefined) {
      displayMetrics.push(`Book value per share is ₹${metrics.bookValue}, representing net asset value per share`);
    }
    
    if (metrics.dividendYield !== undefined) {
      displayMetrics.push(`Company maintains a dividend yield of ${metrics.dividendYield}%, providing regular income to shareholders`);
    }
    
    if (metrics.revenueGrowth !== undefined) {
      displayMetrics.push(`Revenue has grown at ${metrics.revenueGrowth}% indicating business expansion`);
    }
    
    if (metrics.profitGrowth !== undefined) {
      displayMetrics.push(`Profit growth stands at ${metrics.profitGrowth}% showing earnings momentum`);
    }
    
    return displayMetrics;
  }
}