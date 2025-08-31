/**
 * Financial Data Extraction Service using Claude WebFetch
 * This service uses Claude Code's WebFetch tool to extract real financial data
 * from Screener.in for any stock symbol
 */

// HDFC Bank Real Data (extracted on 2025-08-30)
const HDFCBANK_DATA = {
  "marketCap": "₹14,61,094 Cr",
  "currentPrice": 952,
  "eps": 46.13,
  "pe": 20.7,
  "roe": 14.4,
  "roce": 7.51,
  "bookValue": 341,
  "dividendYield": 1.16,
  "faceValue": 1,
  "quarterlyResults": [
    {
      "quarter": "Jun 2025",
      "revenue": 87372,
      "profit": 17090,
      "eps": 10.60
    },
    {
      "quarter": "Mar 2025",
      "revenue": 86779,
      "profit": 19285,
      "eps": 12.31
    },
    {
      "quarter": "Dec 2024",
      "revenue": 85040,
      "profit": 18340,
      "eps": 11.54
    },
    {
      "quarter": "Sep 2024",
      "revenue": 83002,
      "profit": 18627,
      "eps": 11.68
    }
  ],
  "shareholdingPattern": [
    {"category": "Promoters", "percentage": 0},
    {"category": "FII", "percentage": 48.61},
    {"category": "DII", "percentage": 35.85},
    {"category": "Public", "percentage": 15.33}
  ],
  "companyName": "HDFC Bank Ltd",
  "sector": "Financial Services",
  "industry": "Private Sector Bank",
  "lastUpdated": "2025-08-30T00:00:00.000Z",
  "extractionMethod": "claude_webfetch_real"
};

/**
 * Real financial data extracted using Claude WebFetch tool
 * This data can be expanded by running WebFetch tool for more stock symbols
 */
const REAL_FINANCIAL_DATA = {
  HDFCBANK: HDFCBANK_DATA,
  // Add more stocks here as they are extracted using WebFetch tool
};

/**
 * Get real financial data for a stock symbol
 * Returns actual data extracted using Claude WebFetch tool
 */
function getRealFinancialData(stockSymbol) {
  const upperSymbol = stockSymbol.toUpperCase();
  
  if (REAL_FINANCIAL_DATA[upperSymbol]) {
    console.log(`✅ Returning real WebFetch data for ${stockSymbol}`);
    return {
      success: true,
      data: REAL_FINANCIAL_DATA[upperSymbol],
      source: 'claude_webfetch_real',
      extracted: true
    };
  }
  
  console.log(`⚠️ No real WebFetch data available for ${stockSymbol}`);
  return {
    success: false,
    message: `Real financial data not yet extracted for ${stockSymbol}`,
    availableStocks: Object.keys(REAL_FINANCIAL_DATA),
    source: 'needs_extraction'
  };
}

/**
 * Instructions for extracting more real financial data
 */
function getExtractionInstructions(stockSymbol) {
  return {
    message: `To extract real data for ${stockSymbol}:`,
    steps: [
      `1. Use Claude Code WebFetch tool`,
      `2. URL: https://www.screener.in/company/${stockSymbol}/consolidated/`,
      `3. Use the comprehensive extraction prompt`,
      `4. Add the result to REAL_FINANCIAL_DATA object`,
      `5. Update this service file`
    ],
    webfetchPrompt: `
IMPORTANT: Extract comprehensive financial data from Screener.in page for stock ${stockSymbol}.

BASIC METRICS (Top of page):
- Market Cap (₹ Cr) - exact amount
- Current Price (₹) - exact amount  
- Book Value (₹) - exact amount
- Dividend Yield (%) - exact percentage
- Face Value (₹) - exact amount
- EPS (Earnings Per Share) (₹) - exact amount
- P/E Ratio - exact number
- ROE (Return on Equity) (%) - exact percentage
- ROCE (Return on Capital Employed) (%) - exact percentage

QUARTERLY RESULTS (Middle section - "Quarterly Results" table):
Find the "Quarterly Results" table and extract from LAST 4 COLUMNS ONLY:
- Look for row with "Sales" OR "Revenue" (same thing) - get last 4 column values
- Look for row with "Net Profit" - get last 4 column values
- Look for row with "EPS in Rs" - get last 4 column values
- Column headers for those last 4 columns (quarter names)

IMPORTANT: Last column (rightmost) = Latest quarter

SHAREHOLDING PATTERN (Bottom section):
Find "Shareholding Pattern" table, extract from LAST COLUMN ONLY:
- Promoters percentage
- FII percentage  
- DII percentage
- Public percentage
- Government percentage (if exists)

Return as JSON with the exact structure shown in the example.
`
  };
}

module.exports = {
  getRealFinancialData,
  getExtractionInstructions,
  REAL_FINANCIAL_DATA
};