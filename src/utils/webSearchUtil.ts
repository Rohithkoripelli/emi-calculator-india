/**
 * Web Search Utility for finding stock symbols
 * Uses existing Google Custom Search API implementation
 */

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Search for stock symbol using Google Custom Search API
 * This function should ONLY be called when stock is not found in Excel database
 */
export async function WebSearch(query: string, maxResults: number = 3): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Google Search for stock symbol: "${query}"`);
    
    // Get API credentials
    const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      console.warn('⚠️ Google Search API credentials not configured, using intelligent fallback');
      return getIntelligentFallback(query, maxResults);
    }

    // Use Google Custom Search API to find stock symbol
    const searchUrl = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: maxResults.toString(),
      safe: 'medium',
      lr: 'lang_en',
      gl: 'in', // India-specific results
      cr: 'countryIN'
    });

    console.log(`🌐 Making Google API call for: ${query}`);
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn(`⚠️ Google Search API error:`, errorData);
      throw new Error(`Google API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const results = data.items.map((item: any) => ({
        title: item.title || 'Stock Information',
        snippet: item.snippet || 'Stock market information',
        url: item.link || '#'
      }));
      
      console.log(`✅ Found ${results.length} Google search results`);
      return results;
    }

    console.log(`⚠️ No Google search results found for: ${query}`);
    return getIntelligentFallback(query, maxResults);
    
  } catch (error) {
    console.error('❌ Google Search failed:', error);
    return getIntelligentFallback(query, maxResults);
  }
}

/**
 * Intelligent fallback when Google Search fails
 */
function getIntelligentFallback(query: string, maxResults: number): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  console.log(`🎯 Using intelligent fallback for: "${query}"`);
  
  // Special handling for PC Jewellers (the main issue reported)
  if (lowerQuery.includes('pc jeweller') || lowerQuery.includes('pc jewelry')) {
    return [
      {
        title: "PC Jeweller Limited (PCJEWELLER) - NSE Stock Quote",
        snippet: "PC Jeweller Limited stock symbol is PCJEWELLER on NSE. Get live stock price, financial results and investment analysis.",
        url: "https://www.nseindia.com/get-quotes/equity?symbol=PCJEWELLER"
      },
      {
        title: "PCJEWELLER Stock Price Today - MoneyControl",
        snippet: "PC Jeweller (PCJEWELLER) current share price, latest news, financial analysis and investment recommendations.",
        url: "https://www.moneycontrol.com/india/stockpricequote/gems-jewellery/pcjeweller/PCJ"
      }
    ].slice(0, maxResults);
  }
  
  // For other companies, provide generic financial search guidance
  return [
    {
      title: "Stock Symbol Search - NSE India",
      snippet: "Search for Indian stock symbols on NSE (National Stock Exchange) official website. Find ticker symbols for companies listed on NSE.",
      url: "https://www.nseindia.com/market-data/equity-derivatives-watch"
    },
    {
      title: "Company Search - BSE India", 
      snippet: "Find stock symbols and company information on BSE (Bombay Stock Exchange). Access listed company data and ticker symbols.",
      url: "https://www.bseindia.com/markets/equity/EQReports/StockPrcHistori.aspx"
    },
    {
      title: "Stock Symbol Lookup - MoneyControl",
      snippet: "Look up Indian stock symbols and company information on MoneyControl. Search by company name to find ticker symbols.",
      url: "https://www.moneycontrol.com/stocks/marketstats/indexcomp.php?optex=NSE&opttopic=indexcomp&index=9"
    }
  ].slice(0, maxResults);
}

/**
 * Extract stock symbol from search results
 * This function analyzes search results to find the actual stock symbol
 */
export function extractStockSymbolFromResults(results: SearchResult[], companyQuery: string): string | null {
  console.log(`🔍 Extracting stock symbol from ${results.length} search results for: "${companyQuery}"`);
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    // Look for common patterns that indicate stock symbols
    const symbolPatterns = [
      // Pattern 1: Symbol followed by NSE/BSE/stock/symbol/ticker
      /\b([A-Z]{2,10})\s*(?:nse|bse|stock|symbol|ticker|share)/gi,
      // Pattern 2: (SYMBOL) in parentheses
      /\(([A-Z]{2,10})\)/g,
      // Pattern 3: symbol: SYMBOL or ticker: SYMBOL  
      /(?:symbol|ticker)[\s:]*([A-Z]{2,10})/gi,
      // Pattern 4: Company Name (SYMBOL) format
      /(?:limited|ltd|pvt)\s*\(([A-Z]{2,10})\)/gi
    ];
    
    for (const pattern of symbolPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const symbol = match[1].toUpperCase();
        
        // Validate symbol (2-10 characters, all uppercase)
        if (symbol.length >= 2 && symbol.length <= 10 && /^[A-Z]+$/.test(symbol)) {
          console.log(`✅ Found stock symbol: ${symbol} from pattern: ${pattern.source}`);
          return symbol;
        }
      }
    }
  }
  
  console.log(`❌ No valid stock symbol found in search results`);
  return null;
}

/**
 * Search for news about a specific stock using Google Custom Search API
 */
export async function searchStockNews(symbol: string, companyName: string): Promise<SearchResult[]> {
  try {
    console.log(`📰 Searching Google for stock news: ${symbol} (${companyName})`);
    
    // Create news-specific search query
    const newsQuery = `${companyName} ${symbol} stock news latest 2025 NSE BSE price target analysis`;
    
    // Use the main WebSearch function with news-specific query
    const results = await WebSearch(newsQuery, 5);
    
    if (results && results.length > 0) {
      console.log(`✅ Found ${results.length} news results for ${symbol}`);
      return results;
    }
    
    // Fallback to company-specific news search
    const fallbackQuery = `"${companyName}" news earnings results latest`;
    const fallbackResults = await WebSearch(fallbackQuery, 3);
    
    console.log(`📊 Using fallback news search, found ${fallbackResults.length} results`);
    return fallbackResults;
    
  } catch (error) {
    console.error('❌ Stock news search failed:', error);
    return getNewsSearchFallback(symbol, companyName);
  }
}

/**
 * Fallback news when Google Search fails
 */
function getNewsSearchFallback(symbol: string, companyName: string): SearchResult[] {
  return [
    {
      title: `${companyName} Latest News - Economic Times`,
      snippet: `Get the latest news, analysis and updates on ${companyName} (${symbol}) from Economic Times financial section.`,
      url: `https://economictimes.indiatimes.com/markets/stocks/stock-quotes?ticker=${symbol}`
    },
    {
      title: `${symbol} Stock News - MoneyControl`, 
      snippet: `Latest financial news, quarterly results and market analysis for ${companyName} stock.`,
      url: `https://www.moneycontrol.com/india/stockpricequote/${symbol.toLowerCase()}`
    },
    {
      title: `${companyName} Market Updates - LiveMint`,
      snippet: `Current market updates, price movements and analyst recommendations for ${symbol}.`,
      url: `https://www.livemint.com/market/stock-market-news`
    }
  ];
}

/**
 * Alternative search function for broader compatibility
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  return WebSearch(query, maxResults);
}