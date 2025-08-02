import { WebSearchResult } from './stockAnalysisApi';

// Google Custom Search API configuration
const GOOGLE_CUSTOM_SEARCH_API = 'https://www.googleapis.com/customsearch/v1';

export class GoogleSearchApiService {
  
  /**
   * Search for stock-related news and insights using Google Custom Search API
   */
  static async searchStockInsights(
    symbol: string, 
    companyName: string
  ): Promise<WebSearchResult[]> {
    console.log(`🔍 Searching Google for insights on ${companyName} (${symbol})`);
    
    try {
      // Check if API credentials are available
      const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        console.error('❌ Google Search API credentials not configured');
        return this.getFallbackInsights(symbol, companyName);
      }

      // Enhanced search queries for comprehensive stock analysis
      const searchQueries = [
        `${companyName} stock price live NSE BSE current rate`,
        `${symbol} stock price today real time market data`,
        `${companyName} share price current trading volume`,
        `${symbol} analyst recommendation target price buy sell ${new Date().getFullYear()}`,
        `${companyName} quarterly results earnings news latest`,
        `${symbol} technical analysis chart price movement`,
        `${companyName} fundamental analysis financial performance`,
        `${symbol} dividend yield pe ratio market cap data`
      ];

      const allResults: WebSearchResult[] = [];

      // Execute searches sequentially to avoid rate limiting
      for (const query of searchQueries) {
        try {
          console.log(`🔍 Google Search: ${query}`);
          
          const searchUrl = `${GOOGLE_CUSTOM_SEARCH_API}?` + new URLSearchParams({
            key: apiKey,
            cx: searchEngineId,
            q: query,
            num: '5', // 5 results per query
            sort: 'date', // Sort by date for recent results
            safe: 'medium',
            lr: 'lang_en', // English language results
            gl: 'in', // Geographic location: India
            cr: 'countryIN' // Country restrict to India
          });

          const response = await fetch(searchUrl);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.warn(`⚠️ Google Search API error:`, errorData);
            continue; // Try next query
          }

          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const searchResults = this.parseGoogleSearchResults(data.items, symbol, companyName);
            allResults.push(...searchResults);
            console.log(`✅ Found ${searchResults.length} results for: ${query}`);
          }

          // Add delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.warn(`⚠️ Search failed for query: ${query}`, error);
          continue;
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.removeDuplicateResults(allResults);
      const sortedResults = this.sortByRelevance(uniqueResults, symbol, companyName);
      
      console.log(`📊 Total unique Google results: ${uniqueResults.length}`);
      return sortedResults.slice(0, 15); // Return top 15 results
      
    } catch (error) {
      console.error('❌ Google Search API failed:', error);
      return this.getFallbackInsights(symbol, companyName);
    }
  }

  /**
   * Parse Google Custom Search API results
   */
  private static parseGoogleSearchResults(
    items: any[], 
    symbol: string, 
    companyName: string
  ): WebSearchResult[] {
    return items.map(item => {
      // Extract publication date from various sources
      let publishedDate = new Date().toISOString(); // Default to current date
      
      // Try to extract date from structured data
      if (item.pagemap?.metatags?.[0]) {
        const metaTags = item.pagemap.metatags[0];
        const dateFields = [
          'article:published_time',
          'article:modified_time',
          'publisheddate',
          'pubdate',
          'date',
          'og:updated_time',
          'last-modified'
        ];
        
        for (const field of dateFields) {
          if (metaTags[field]) {
            const parsedDate = new Date(metaTags[field]);
            if (!isNaN(parsedDate.getTime())) {
              publishedDate = parsedDate.toISOString();
              break;
            }
          }
        }
      }

      // Determine source from URL
      const source = this.extractSourceFromUrl(item.link);
      
      return {
        title: item.title || 'Financial News',
        url: item.link || '#',
        snippet: item.snippet || 'Latest financial news and analysis',
        publishedDate: publishedDate,
        source: source
      };
    });
  }

  /**
   * Extract source name from URL
   */
  private static extractSourceFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      const sourceMap: Record<string, string> = {
        'moneycontrol.com': 'MoneyControl',
        'economictimes.indiatimes.com': 'Economic Times',
        'business-standard.com': 'Business Standard',
        'livemint.com': 'LiveMint',
        'zeebiz.com': 'Zee Business',
        'finance.yahoo.com': 'Yahoo Finance',
        'investing.com': 'Investing.com',
        'marketwatch.com': 'MarketWatch',
        'bloomberg.com': 'Bloomberg',
        'reuters.com': 'Reuters',
        'cnbc.com': 'CNBC',
        'financialexpress.com': 'Financial Express',
        'thehindubusinessline.com': 'Hindu Business Line'
      };

      // Check for exact domain matches
      for (const [domainKey, sourceName] of Object.entries(sourceMap)) {
        if (domain.includes(domainKey)) {
          return sourceName;
        }
      }

      // Extract main domain name if no match found
      const domainParts = domain.split('.');
      const mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domain;
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      
    } catch (error) {
      return 'Financial News';
    }
  }

  /**
   * Remove duplicate search results
   */
  private static removeDuplicateResults(results: WebSearchResult[]): WebSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.title.toLowerCase().trim() + result.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort results by relevance to the stock query
   */
  private static sortByRelevance(results: WebSearchResult[], symbol: string, companyName: string): WebSearchResult[] {
    return results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, symbol, companyName);
      const bScore = this.calculateRelevanceScore(b, symbol, companyName);
      return bScore - aScore; // Higher score first
    });
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevanceScore(result: WebSearchResult, symbol: string, companyName: string): number {
    let score = 0;
    const text = (result.title + ' ' + result.snippet).toLowerCase();
    
    // Higher score for exact matches
    if (text.includes(symbol.toLowerCase())) score += 15;
    if (text.includes(companyName.toLowerCase())) score += 15;
    
    // Score for financial keywords
    const financialKeywords = [
      'stock', 'share', 'price', 'target', 'buy', 'sell', 'analysis', 'recommendation', 
      'earnings', 'revenue', 'profit', 'quarterly', 'results', 'market', 'trading',
      'analyst', 'rating', 'upgrade', 'downgrade', 'outlook', 'forecast'
    ];
    
    financialKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 3;
    });
    
    // Score for trusted financial sources
    const trustedSources = [
      'moneycontrol', 'economic times', 'livemint', 'business standard', 
      'yahoo finance', 'bloomberg', 'reuters', 'zee business'
    ];
    
    trustedSources.forEach(source => {
      if (result.source.toLowerCase().includes(source) || result.url.toLowerCase().includes(source.replace(' ', ''))) {
        score += 10;
      }
    });
    
    // Bonus for recent articles
    if (result.publishedDate) {
      const daysSincePublished = (Date.now() - new Date(result.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 7) score += 8; // Recent articles get bonus
      if (daysSincePublished < 1) score += 12; // Today's articles get extra bonus
      if (daysSincePublished < 0.5) score += 15; // Very recent articles get maximum bonus
    }
    
    return score;
  }

  /**
   * Provide fallback insights when Google Search fails
   */
  private static getFallbackInsights(symbol: string, companyName: string): WebSearchResult[] {
    return [
      {
        title: `${companyName} Stock Analysis - Check Financial Portals`,
        url: `https://www.moneycontrol.com/india/stockpricequote/${symbol.toLowerCase()}`,
        snippet: 'Google Search API is temporarily unavailable. Please check MoneyControl, Economic Times, or other financial news sources for the latest updates on this stock.',
        source: 'MoneyControl (Fallback)',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${symbol} Latest News - Economic Times`,
        url: `https://economictimes.indiatimes.com/markets/stocks/stock-quotes?ticker=${symbol}`,
        snippet: 'For the most current analysis and news, visit Economic Times for comprehensive stock market coverage and expert insights.',
        source: 'Economic Times (Fallback)',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${companyName} Financial Performance - LiveMint`,
        url: `https://www.livemint.com/market/stock-market-news`,
        snippet: 'Get detailed financial analysis, quarterly results, and market outlook from LiveMint\'s expert financial journalists.',
        source: 'LiveMint (Fallback)',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${symbol} Research Reports - Business Standard`,
        url: `https://www.business-standard.com/markets/capital-market-news`,
        snippet: 'Access comprehensive research reports and analyst recommendations from Business Standard\'s market experts.',
        source: 'Business Standard (Fallback)',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${companyName} Investment Guide`,
        url: '#',
        snippet: 'Consider checking brokerage research reports and analyst recommendations from major financial institutions for comprehensive analysis.',
        source: 'Investment Guidelines',
        publishedDate: new Date().toISOString()
      }
    ];
  }

  /**
   * Test Google Custom Search API connectivity
   */
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    hasApiKey: boolean;
    hasSearchEngineId: boolean;
  }> {
    const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
    
    const result = {
      success: false,
      message: '',
      hasApiKey: !!apiKey,
      hasSearchEngineId: !!searchEngineId
    };

    if (!apiKey) {
      result.message = 'Google Search API key not configured';
      return result;
    }

    if (!searchEngineId) {
      result.message = 'Google Search Engine ID not configured';
      return result;
    }

    try {
      const testUrl = `${GOOGLE_CUSTOM_SEARCH_API}?` + new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: 'test search',
        num: '1'
      });

      const response = await fetch(testUrl);
      
      if (response.ok) {
        result.success = true;
        result.message = 'Google Custom Search API connection successful';
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        result.message = `Google API Error: ${errorData.error?.message || 'Unknown error'}`;
      }
    } catch (error) {
      result.message = `Connection failed: ${error}`;
    }

    return result;
  }

  /**
   * Get API usage information
   */
  static getApiInfo(): {
    name: string;
    dailyLimit: string;
    costPerQuery: string;
    documentation: string;
  } {
    return {
      name: 'Google Custom Search API',
      dailyLimit: '100 queries/day (free tier)',
      costPerQuery: '$5 per 1000 additional queries',
      documentation: 'https://developers.google.com/custom-search/v1/introduction'
    };
  }
}