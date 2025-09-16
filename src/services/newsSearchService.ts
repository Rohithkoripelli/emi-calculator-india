/**
 * News Search Service
 * Handles dynamic stock discovery, news search, and trending stocks analysis
 */

interface TrendingStock {
  symbol: string;
  companyName: string;
  marketCap: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  sector: string;
  reason: string;
  confidence: number;
}

interface StockNews {
  headline: string;
  summary: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  source: string;
  publishedAt: string;
  relevanceScore: number;
  url: string;
}

interface MarketTrends {
  trending_stocks: TrendingStock[];
  market_sentiment: 'BULLISH' | 'BEARISH' | 'MIXED';
  key_sectors: string[];
  market_summary: string;
}

export class NewsSearchService {
  private static readonly SECTORS_MAP: Record<string, string> = {
    'IT': 'Information Technology',
    'Banking': 'Banking & Finance',
    'Pharma': 'Pharmaceuticals',
    'Auto': 'Automobile',
    'FMCG': 'Consumer Goods',
    'Telecom': 'Telecommunications',
    'Energy': 'Oil & Gas',
    'Infrastructure': 'Infrastructure & Construction',
    'Metals': 'Metals & Mining',
    'Textiles': 'Textiles',
    'Chemicals': 'Chemicals',
    'Cement': 'Cement',
    'Power': 'Power & Utilities',
    'Realty': 'Real Estate'
  };

  /**
   * Discover trending/best performing stocks through web search
   */
  static async discoverTrendingStocks(timeframe: 'recent' | '6months' | '1year' = 'recent'): Promise<TrendingStock[]> {
    try {
      console.log(`🔍 Discovering trending stocks for timeframe: ${timeframe}...`);
      
      const searchQueries = this.getTrendingStockQueries(timeframe);
      const discoveredStocks: Map<string, TrendingStock> = new Map();
      
      // Search for trending stocks from multiple angles
      for (const query of searchQueries) {
        console.log(`🔎 Searching: "${query}"`);
        
        try {
          const { WebSearch } = await import('../utils/webSearchUtil');
          const searchResults = await WebSearch(query);
          
          if (searchResults && searchResults.length > 0) {
            const extractedStocks = await this.extractStocksFromSearchResults(searchResults, query);
            
            // Merge results with confidence scoring
            extractedStocks.forEach(stock => {
              if (discoveredStocks.has(stock.symbol)) {
                // Increase confidence for stocks found in multiple searches
                const existing = discoveredStocks.get(stock.symbol)!;
                existing.confidence = Math.min(95, existing.confidence + 15);
              } else {
                discoveredStocks.set(stock.symbol, stock);
              }
            });
          }
          
          // Add delay between searches to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error searching "${query}":`, error);
          continue;
        }
      }
      
      // Convert to array and sort by confidence
      const trendingStocks = Array.from(discoveredStocks.values())
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 15); // Return top 15 stocks
      
      console.log(`✅ Discovered ${trendingStocks.length} trending stocks`);
      
      // If we found stocks, return them; otherwise use more targeted searches
      if (trendingStocks.length > 0) {
        return trendingStocks;
      } else {
        console.log(`⚠️ No trending stocks found via web search, trying targeted stock discovery...`);
        return await this.getTargetedStockDiscovery();
      }
      
    } catch (error) {
      console.error('❌ Error discovering trending stocks:', error);
      console.log(`🎯 Using targeted stock discovery due to discovery error...`);
      return await this.getTargetedStockDiscovery();
    }
  }

  /**
   * Targeted stock discovery using rate-limited searches for specific high-quality companies
   */
  private static async getTargetedStockDiscovery(): Promise<TrendingStock[]> {
    console.log(`🎯 Starting CONSERVATIVE targeted stock discovery with minimal API calls...`);
    
    // MUCH reduced targeted search queries - only essential ones to minimize API usage
    const targetedQueries = [
      // Only top 3 large cap searches  
      "TCS Tata Consultancy Services stock NSE latest",
      "HDFCBANK HDFC Bank stock analysis",
      "RELIANCE Industries stock price",
      
      // Only 1 mid cap search
      "CIPLA pharmaceutical stock NSE",
      
      // Only 1 small cap search  
      "TRENT retail stock NSE performance"
    ];
    
    const discoveredStocks: Map<string, TrendingStock> = new Map();
    
    // Use rate-limited searches for each targeted query
    for (const query of targetedQueries) {
      try {
        console.log(`🔍 Targeted search: "${query}"`);
        
        const { WebSearch } = await import('../utils/webSearchUtil');
        const searchResults = await WebSearch(query, 3); // Limit to 3 results per query
        
        if (searchResults && searchResults.length > 0) {
          const extractedStocks = await this.extractStocksFromSearchResults(searchResults, query);
          extractedStocks.forEach(stock => {
            const existing = discoveredStocks.get(stock.symbol);
            if (!existing || stock.confidence > existing.confidence) {
              discoveredStocks.set(stock.symbol, stock);
            }
          });
        }
        
        // Add LONGER delay between searches to be very conservative with API usage
        await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 seconds between searches
        
      } catch (error) {
        console.warn(`⚠️ Error in targeted search for "${query}":`, error);
        // Continue with other searches even if one fails
      }
    }
    
    // Convert to array and sort by confidence
    const targetedStocks = Array.from(discoveredStocks.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15); // Return top 15 stocks
    
    console.log(`✅ Targeted discovery found ${targetedStocks.length} quality stocks`);
    
    // If we still don't have enough stocks, use a minimal emergency set
    if (targetedStocks.length < 5) {
      console.log(`⚠️ Insufficient stocks from targeted discovery, using emergency minimal set...`);
      return this.getEmergencyMinimalStocks();
    }
    
    return targetedStocks;
  }
  
  /**
   * Emergency minimal stock set when all discovery methods fail
   */
  private static getEmergencyMinimalStocks(): TrendingStock[] {
    // Only return the absolute minimum required for basic functionality
    const emergencyStocks: TrendingStock[] = [
      { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', marketCap: 'LARGE_CAP', sector: 'Oil & Gas', reason: 'Market leader - emergency fallback', confidence: 80 },
      { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', marketCap: 'LARGE_CAP', sector: 'Information Technology', reason: 'IT services leader - emergency fallback', confidence: 79 },
      { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', marketCap: 'LARGE_CAP', sector: 'Banking', reason: 'Banking leader - emergency fallback', confidence: 78 },
      { symbol: 'CIPLA', companyName: 'Cipla Limited', marketCap: 'MID_CAP', sector: 'Pharmaceuticals', reason: 'Pharma leader - emergency fallback', confidence: 77 },
      { symbol: 'TRENT', companyName: 'Trent Limited', marketCap: 'SMALL_CAP', sector: 'Retail', reason: 'Retail growth - emergency fallback', confidence: 76 }
    ];
    
    console.log(`🚨 Using emergency minimal stock set: ${emergencyStocks.length} stocks`);
    return emergencyStocks;
  }

  /**
   * Search for specific stock news and analysis
   */
  static async getStockNews(symbol: string, companyName: string): Promise<StockNews[]> {
    try {
      console.log(`📰 Fetching news for ${symbol} (${companyName})...`);
      
      // Use the enhanced searchStockNews function for better results
      const { searchStockNews } = await import('../utils/webSearchUtil');
      const searchResults = await searchStockNews(symbol, companyName);
      
      if (searchResults && searchResults.length > 0) {
        const newsArticles = await this.extractNewsFromSearchResults(searchResults, symbol);
        
        // Sort by relevance and return
        const sortedNews = newsArticles
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5); // Top 5 most relevant news items
        
        console.log(`✅ Found ${sortedNews.length} relevant news articles for ${symbol}`);
        return sortedNews;
      }
      
      // Fallback to generic news if no specific results
      console.log(`⚠️ No specific news found for ${symbol}, using fallback`);
      return this.getFallbackNews(symbol, companyName);
      
    } catch (error) {
      console.error('❌ Error fetching stock news:', error);
      return this.getFallbackNews(symbol, companyName);
    }
  }

  /**
   * Provide fallback news when search is not available
   */
  private static getFallbackNews(symbol: string, companyName: string): StockNews[] {
    const currentDate = new Date().toISOString();
    
    return [
      {
        headline: `${companyName} Stock Analysis and Market Outlook`,
        summary: `Current market analysis for ${companyName} (${symbol}) suggests mixed sentiment with focus on fundamental performance and technical indicators.`,
        url: `#${symbol.toLowerCase()}-analysis`,
        publishedAt: currentDate,
        sentiment: 'NEUTRAL',
        relevanceScore: 75,
        source: 'Market Analysis'
      },
      {
        headline: `${symbol} Technical and Fundamental Review`,
        summary: `Comprehensive review of ${companyName} covering technical analysis, fundamental metrics, and future growth prospects based on current market conditions.`,
        url: `#${symbol.toLowerCase()}-review`,
        publishedAt: currentDate,
        sentiment: 'POSITIVE',
        relevanceScore: 70,
        source: 'Investment Research'
      }
    ];
  }

  /**
   * Analyze overall market trends and sentiment
   */
  static async analyzeMarketTrends(): Promise<MarketTrends> {
    try {
      console.log('📊 Analyzing current market trends...');
      
      const marketQueries = [
        'best performing indian stocks 2025 NSE BSE',
        'top sectoral gainers indian stock market today',
        'bullish bearish market sentiment india stocks',
        'large cap mid cap small cap best stocks 2025'
      ];
      
      const trendingStocks = await this.discoverTrendingStocks('recent');
      const sectorAnalysis = this.analyzeSectorDistribution(trendingStocks);
      
      // Determine market sentiment from trending stocks
      const positiveCount = trendingStocks.filter(stock => 
        stock.reason.toLowerCase().includes('gain') || 
        stock.reason.toLowerCase().includes('growth') ||
        stock.reason.toLowerCase().includes('bullish')
      ).length;
      
      const totalStocks = trendingStocks.length;
      let marketSentiment: 'BULLISH' | 'BEARISH' | 'MIXED' = 'MIXED';
      
      if (positiveCount / totalStocks > 0.7) {
        marketSentiment = 'BULLISH';
      } else if (positiveCount / totalStocks < 0.3) {
        marketSentiment = 'BEARISH';
      }
      
      const marketSummary = this.generateMarketSummary(trendingStocks, marketSentiment, sectorAnalysis);
      
      const trends: MarketTrends = {
        trending_stocks: trendingStocks,
        market_sentiment: marketSentiment,
        key_sectors: sectorAnalysis,
        market_summary: marketSummary
      };
      
      console.log(`✅ Market analysis complete: ${marketSentiment} sentiment with ${sectorAnalysis.length} active sectors`);
      return trends;
      
    } catch (error) {
      console.error('❌ Error analyzing market trends:', error);
      return {
        trending_stocks: [],
        market_sentiment: 'MIXED',
        key_sectors: [],
        market_summary: 'Unable to analyze market trends at the moment.'
      };
    }
  }

  /**
   * Get search queries for different timeframes
   */
  private static getTrendingStockQueries(timeframe: string): string[] {
    // DRASTICALLY reduced queries to prevent API overuse
    const baseQueries = [
      'best indian stocks NSE 2025' // Only 1 base query instead of 3
    ];
    
    switch (timeframe) {
      case '6months':
        return [
          'top indian stocks 6 months 2025' // Only 1 query per timeframe
        ];
      case '1year':
        return [
          'best indian stocks 2024 returns' // Only 1 query per timeframe
        ];
      default: // recent
        return baseQueries; // Use only the 1 base query
    }
  }

  /**
   * Extract stock information from search results
   */
  private static async extractStocksFromSearchResults(searchResults: any[], query: string): Promise<TrendingStock[]> {
    const stocks: TrendingStock[] = [];
    
    // Import our internal stock database
    const { ExcelBasedStockAnalysisService } = await import('./excelBasedStockAnalysis');
    
    for (const result of searchResults.slice(0, 5)) { // Process top 5 results
      try {
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        
        // Extract potential stock symbols and company names
        const stockSymbols = this.extractStockSymbols(content);
        const companyNames = this.extractCompanyNames(content);
        
        // Validate stocks using our internal database
        for (const symbol of stockSymbols) {
          const companyInfo = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
          if (companyInfo) {
            const marketCap = this.determineMarketCap(companyInfo.name, content);
            const sector = this.determineSector(companyInfo.name, content);
            const reason = this.extractStockReason(content, symbol, companyInfo.name);
            
            stocks.push({
              symbol: symbol,
              companyName: companyInfo.name,
              marketCap: marketCap,
              sector: sector,
              reason: reason,
              confidence: this.calculateStockConfidence(content, symbol, query)
            });
          }
        }
        
        // Also try to find stocks by company names mentioned
        for (const name of companyNames) {
          const companies = ExcelBasedStockAnalysisService.searchCompanies(name, 1);
          if (companies.length > 0) {
            const company = companies[0];
            const marketCap = this.determineMarketCap(company.name, content);
            const sector = this.determineSector(company.name, content);
            const reason = this.extractStockReason(content, company.symbol, company.name);
            
            stocks.push({
              symbol: company.symbol,
              companyName: company.name,
              marketCap: marketCap,
              sector: sector,
              reason: reason,
              confidence: this.calculateStockConfidence(content, company.symbol, query)
            });
          }
        }
        
      } catch (error) {
        console.error('❌ Error extracting stocks from result:', error);
        continue;
      }
    }
    
    // Remove duplicates and return unique stocks
    const uniqueStocks = stocks.filter((stock, index, self) => 
      index === self.findIndex(s => s.symbol === stock.symbol)
    );
    
    return uniqueStocks;
  }

  /**
   * Extract news from search results
   */
  private static async extractNewsFromSearchResults(searchResults: any[], symbol: string): Promise<StockNews[]> {
    const news: StockNews[] = [];
    
    for (const result of searchResults.slice(0, 3)) {
      try {
        const sentiment = this.analyzeSentiment(result.title + ' ' + result.snippet);
        const relevanceScore = this.calculateNewsRelevance(result, symbol);
        
        if (relevanceScore > 30) { // Only include relevant news
          news.push({
            headline: result.title,
            summary: result.snippet,
            sentiment: sentiment,
            source: this.extractSource(result.url),
            publishedAt: new Date().toISOString(), // Approximate
            relevanceScore: relevanceScore,
            url: result.url
          });
        }
      } catch (error) {
        console.error('❌ Error extracting news from result:', error);
        continue;
      }
    }
    
    return news;
  }

  // Helper methods
  private static extractStockSymbols(content: string): string[] {
    const symbolPattern = /\b[A-Z]{3,12}\b/g;
    const matches = content.toUpperCase().match(symbolPattern) || [];
    
    // Filter out common false positives
    const falsePositives = ['NSE', 'BSE', 'SEBI', 'RBI', 'FII', 'DII', 'IPO', 'CEO', 'CFO', 'USA', 'UK', 'UAE', 'GDP', 'CPI'];
    return matches.filter(symbol => !falsePositives.includes(symbol));
  }

  private static extractCompanyNames(content: string): string[] {
    // Look for company-like patterns (capitalized words, "Ltd", "Limited", etc.)
    const companyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Ltd|Limited|Corporation|Corp|Inc|Industries|Bank|Insurance|Motors|Steel|Power|Energy|Pharma|Pharmaceuticals)))/g;
    const matches = content.match(companyPattern) || [];
    return matches.map(name => name.trim());
  }

  private static determineMarketCap(companyName: string, content: string): 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' {
    const largeCap = ['reliance', 'tcs', 'hdfc', 'icici', 'infosys', 'bharti', 'sbi', 'itc', 'hindustan unilever', 'larsen'];
    const name = companyName.toLowerCase();
    
    if (largeCap.some(large => name.includes(large))) return 'LARGE_CAP';
    if (content.includes('small cap') || content.includes('smallcap')) return 'SMALL_CAP';
    if (content.includes('mid cap') || content.includes('midcap')) return 'MID_CAP';
    
    // Default classification based on common knowledge
    return largeCap.some(large => name.includes(large)) ? 'LARGE_CAP' : 'MID_CAP';
  }

  private static determineSector(companyName: string, content: string): string {
    const sectorKeywords = {
      'IT': ['software', 'technology', 'tech', 'IT'],
      'Banking': ['bank', 'banking', 'finance', 'financial'],
      'Pharma': ['pharma', 'pharmaceutical', 'drug', 'medicine'],
      'Auto': ['auto', 'automobile', 'car', 'motor', 'vehicle'],
      'Energy': ['oil', 'gas', 'energy', 'petroleum', 'power'],
      'Telecom': ['telecom', 'telecommunication', 'mobile', 'airtel']
    };
    
    const lowerContent = content.toLowerCase();
    const lowerName = companyName.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword) || lowerName.includes(keyword))) {
        return this.SECTORS_MAP[sector] || sector;
      }
    }
    
    return 'Diversified';
  }

  private static extractStockReason(content: string, symbol: string, companyName: string): string {
    const reasonKeywords = {
      'Strong earnings growth': ['earnings', 'profit', 'revenue', 'growth'],
      'Positive market sentiment': ['bullish', 'positive', 'optimistic', 'confident'],
      'Sector outperformance': ['outperform', 'leader', 'top performer'],
      'Recent developments': ['expansion', 'acquisition', 'new product', 'partnership']
    };
    
    const lowerContent = content.toLowerCase();
    
    for (const [reason, keywords] of Object.entries(reasonKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return reason;
      }
    }
    
    return 'Market momentum and investor interest';
  }

  private static calculateStockConfidence(content: string, symbol: string, query: string): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence for direct mentions
    if (content.includes(symbol.toLowerCase())) confidence += 20;
    
    // Increase confidence for performance indicators
    const performanceKeywords = ['gain', 'up', 'rise', 'bullish', 'target', 'buy'];
    const matchingKeywords = performanceKeywords.filter(keyword => content.includes(keyword)).length;
    confidence += matchingKeywords * 5;
    
    // Query relevance boost
    if (query.includes('best') || query.includes('top')) confidence += 10;
    
    return Math.min(95, confidence);
  }

  private static analyzeSentiment(text: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const positiveWords = ['gain', 'rise', 'up', 'bullish', 'positive', 'strong', 'growth', 'buy', 'outperform'];
    const negativeWords = ['fall', 'drop', 'down', 'bearish', 'negative', 'weak', 'decline', 'sell', 'underperform'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'POSITIVE';
    if (negativeCount > positiveCount) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private static calculateNewsRelevance(result: any, symbol: string): number {
    let relevance = 0;
    const content = `${result.title} ${result.snippet}`.toLowerCase();
    
    if (content.includes(symbol.toLowerCase())) relevance += 40;
    if (content.includes('stock') || content.includes('share')) relevance += 20;
    if (content.includes('analysis') || content.includes('recommendation')) relevance += 20;
    if (content.includes('price') || content.includes('target')) relevance += 15;
    
    return Math.min(100, relevance);
  }

  private static extractSource(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Unknown Source';
    }
  }

  private static deduplicateNews(news: StockNews[]): StockNews[] {
    const seen = new Set<string>();
    return news.filter(article => {
      const key = article.headline.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static analyzeSectorDistribution(stocks: TrendingStock[]): string[] {
    const sectorCounts: Record<string, number> = {};
    
    stocks.forEach(stock => {
      sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
    });
    
    return Object.entries(sectorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([sector]) => sector);
  }

  private static generateMarketSummary(stocks: TrendingStock[], sentiment: string, sectors: string[]): string {
    const stockCount = stocks.length;
    const topSectors = sectors.slice(0, 3).join(', ');
    
    return `Current market shows ${sentiment.toLowerCase()} sentiment with ${stockCount} trending stocks. ` +
           `Key active sectors include ${topSectors}. ` +
           `Market is driven by sectoral rotation and earnings momentum.`;
  }

  /**
   * Test the news search functionality
   */
  static async testNewsSearch(): Promise<void> {
    console.log('🧪 Testing News Search Service...');
    
    try {
      // Test trending stocks discovery
      console.log('1. Testing trending stocks discovery...');
      const trending = await this.discoverTrendingStocks('recent');
      console.log(`✅ Found ${trending.length} trending stocks`);
      
      if (trending.length > 0) {
        console.log(`📊 Sample: ${trending[0].companyName} (${trending[0].symbol}) - ${trending[0].reason}`);
      }
      
      // Test stock news search
      if (trending.length > 0) {
        console.log('2. Testing stock news search...');
        const news = await this.getStockNews(trending[0].symbol, trending[0].companyName);
        console.log(`✅ Found ${news.length} news articles`);
        
        if (news.length > 0) {
          console.log(`📰 Sample: ${news[0].headline} - ${news[0].sentiment}`);
        }
      }
      
      console.log('✅ News Search Service test completed');
      
    } catch (error) {
      console.error('❌ News Search Service test failed:', error);
    }
  }
}

// Export types
export type { TrendingStock, StockNews, MarketTrends };