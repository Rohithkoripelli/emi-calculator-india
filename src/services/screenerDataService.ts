/**
 * Screener.in Data Service - Extract comprehensive financial metrics
 * Dynamically constructs URLs and scrapes financial data from Screener.in
 */

export interface QuarterlyResult {
  quarter: string;
  revenue: number;
  profit: number;
  eps: number;
  percentageChange?: number;
}

export interface ShareholdingPattern {
  category: string;
  percentage: number;
  shares?: number;
}

export interface ScreenerFinancialMetrics {
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
  
  // New additions
  quarterlyResults?: QuarterlyResult[];
  shareholdingPattern?: ShareholdingPattern[];
  
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
        IMPORTANT: Analyze the COMPLETE Screener.in page for stock ${stockSymbol} from TOP to BOTTOM.
        This is a long page with multiple sections - you MUST scroll through ALL content to find the data.
        
        Extract comprehensive financial metrics from the ENTIRE page:
        
        BASIC METRICS (Located in TOP section):
        - Market Cap (₹ Cr)
        - Current Price (₹)
        - Book Value (₹)
        - Dividend Yield (%)
        - Face Value (₹)
        
        PROFITABILITY RATIOS (Located in TOP section):
        - EPS (Earnings Per Share) in ₹
        - P/E Ratio
        - ROE (Return on Equity) %
        - ROCE (Return on Capital Employed) %
        
        FINANCIAL HEALTH (Located in TOP section):
        - Debt to Equity Ratio
        - Current Ratio
        
        OTHER RATIOS (Located in TOP section):
        - P/BV (Price to Book Value)
        - EV/EBITDA
        
        QUARTERLY RESULTS (CRITICAL - Located in MIDDLE section of page):
        Scroll down to the MIDDLE section to find the "Quarterly Results" table.
        From this table, extract data from the LAST 4 COLUMNS only (most recent quarters):
        
        IMPORTANT TABLE EXTRACTION RULES:
        1. Find the "Sales" row - extract values from LAST 4 COLUMNS and label as "revenue"
        2. Find the "Net Profit" row - extract values from LAST 4 COLUMNS and label as "profit"  
        3. Find the "EPS in Rs" row - extract values from LAST 4 COLUMNS and label as "eps"
        4. Quarter names are in the column headers of those LAST 4 COLUMNS
        
        CRITICAL COLUMN ORDER: The LAST column is the LATEST/MOST RECENT quarter.
        - Last column (rightmost) = Latest quarter (e.g., Jun 2025)
        - 2nd last column = Previous quarter (e.g., Mar 2025) 
        - 3rd last column = Quarter before that (e.g., Dec 2024)
        - 4th last column = Oldest of the 4 quarters (e.g., Sep 2024)
        
        Return quarters in LATEST-TO-OLDEST order (most recent first):
        - Quarter names from the last 4 column headers (latest first)
        - Sales/Revenue values from "Sales" row, last 4 columns (in ₹ Cr)
        - Net Profit values from "Net Profit" row, last 4 columns (in ₹ Cr)
        - EPS values from "EPS in Rs" row, last 4 columns (in ₹)
        
        SHAREHOLDING PATTERN (CRITICAL - Located at the BOTTOM section of page):
        Continue scrolling to the BOTTOM of the page to find the "Shareholding Pattern" table.
        
        IMPORTANT TABLE EXTRACTION RULES:
        1. Find the "Shareholding Pattern" table
        2. Extract data from the LAST COLUMN ONLY (most recent data)
        3. Get ALL row names and their corresponding values from that last column
        4. Include ALL categories shown in the table rows (Promoters, FII, DII, Public, Government, Others, etc.)
        
        Extract exactly like this structure:
        - Category name from each row label
        - Percentage value from the LAST COLUMN only for each row
        
        IMPORTANT: You MUST scroll through the ENTIRE page content to find all sections.
        - TOP section: Basic metrics, ratios
        - MIDDLE section: Quarterly results 
        - BOTTOM section: Shareholding pattern
        
        If you cannot find quarterly results or shareholding data, return null for these fields.
        The quarterly results and shareholding arrays are MANDATORY if the data exists on the page.
        
        COMPANY INFO:
        - Company Name
        - Sector
        - Industry
        
        Return ONLY a JSON object with the extracted values. Use null for any metrics not found.
        Format numbers without currency symbols or percentage signs (just the numeric value).
        
        CRITICAL: If you find quarterly results or shareholding data, you MUST include them as arrays.
        Do NOT return null for these if the data exists on the page.
        
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
          "quarterlyResults": [
            {"quarter": "Mar 2024", "revenue": 1250.5, "profit": 235.8, "eps": 12.4},
            {"quarter": "Dec 2023", "revenue": 1180.2, "profit": 210.3, "eps": 11.1},
            {"quarter": "Sep 2023", "revenue": 1095.7, "profit": 198.5, "eps": 10.5},
            {"quarter": "Jun 2023", "revenue": 1020.3, "profit": 185.2, "eps": 9.8}
          ],
          "shareholdingPattern": [
            {"category": "Promoters", "percentage": 52.5},
            {"category": "FII", "percentage": 18.3},
            {"category": "DII", "percentage": 12.7},
            {"category": "Public", "percentage": 16.5}
          ],
          "companyName": "Vimta Labs Limited",
          "sector": "Healthcare",
          "industry": "Testing Services"
        }
      `;
      
      const { WebFetch } = await import('../utils/webSearchUtil');
      const extractedData = await WebFetch(url, prompt);
      
      console.log(`📊 Raw Screener data for ${stockSymbol}:`, extractedData);
      
      // Debug: Check if the response contains quarterly table indicators
      const hasQuarterlyData = extractedData.includes('quarterly') || extractedData.includes('Quarter') || 
                              extractedData.includes('Mar 2024') || extractedData.includes('Dec 2023');
      const hasShareholdingData = extractedData.includes('Promoter') || extractedData.includes('FII') || 
                                 extractedData.includes('shareholding') || extractedData.includes('Shareholding');
      console.log(`🔍 Quarterly data indicators found: ${hasQuarterlyData}`);
      console.log(`🔍 Shareholding data indicators found: ${hasShareholdingData}`);
      
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
    
    // Revenue and profit growth removed as requested
    
    return displayMetrics;
  }
  
  /**
   * Format quarterly results for table display
   */
  static formatQuarterlyResultsTable(quarterlyResults: QuarterlyResult[]): string {
    if (!quarterlyResults || quarterlyResults.length === 0) {
      return '';
    }
    
    let table = `
## 📊 Quarterly Results (Last 4 Quarters)

| Quarter | Revenue (₹ Cr) | Profit (₹ Cr) | EPS (₹) |
|---------|---------------|---------------|---------|`;
    
    quarterlyResults.forEach(quarter => {
      table += `\n| ${quarter.quarter} | ${quarter.revenue.toFixed(2)} | ${quarter.profit.toFixed(2)} | ${quarter.eps.toFixed(2)} |`;
    });
    
    return table + '\n';
  }
  
  /**
   * Format shareholding pattern for table display
   */
  static formatShareholdingPatternTable(shareholdingPattern: ShareholdingPattern[]): string {
    if (!shareholdingPattern || shareholdingPattern.length === 0) {
      return '';
    }
    
    let table = `
## 👥 Shareholding Pattern

| Category | Percentage |
|----------|------------|`;
    
    shareholdingPattern.forEach(holder => {
      table += `\n| ${holder.category} | ${holder.percentage.toFixed(2)}% |`;
    });
    
    return table + '\n';
  }
}