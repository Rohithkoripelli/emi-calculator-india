import { HybridStockApiService } from './hybridStockApi';
import { GoogleSearchApiService } from './googleSearchApi';
import { WebScrapingService, ScrapedStockData } from './webScrapingService';

export interface StockAnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  sector: string;
  industry: string;
  weeklyChange?: number;
  monthlyChange?: number;
  yearlyChange?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
}

export interface StockRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string[];
  targetPrice?: number;
  stopLoss?: number;
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

export interface StockAnalysisResult {
  stockData: StockAnalysisData;
  webInsights: WebSearchResult[];
  recommendation: StockRecommendation;
  analysisDate: string;
  disclaimers: string[];
}

export class StockAnalysisApiService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  // Enhanced stock keywords for better detection
  private static readonly STOCK_KEYWORDS = [
    'stock', 'share', 'shares', 'equity', 'buy', 'sell', 'invest', 'investment', 'price', 'analysis', 
    'recommendation', 'target', 'trading', 'market', 'nse', 'bse', 'sensex', 'nifty',
    'portfolio', 'holding', 'dividend', 'returns', 'profit', 'loss', 'company', 'sector',
    'industry', 'listing', 'ipo', 'earnings', 'quarterly', 'results', 'financial'
  ];

  // Enhanced Indian stock symbols database for better recognition
  private static readonly INDIAN_STOCKS = {
    // Major banks
    'hdfc': 'HDFCBANK', 'hdfc bank': 'HDFCBANK', 'hdfcbank': 'HDFCBANK',
    'icici': 'ICICIBANK', 'icici bank': 'ICICIBANK', 'icicibank': 'ICICIBANK',
    'sbi': 'SBIN', 'state bank': 'SBIN', 'state bank of india': 'SBIN',
    'axis': 'AXISBANK', 'axis bank': 'AXISBANK', 'axisbank': 'AXISBANK',
    'kotak': 'KOTAKBANK', 'kotak bank': 'KOTAKBANK', 'kotak mahindra': 'KOTAKBANK',
    
    // Major IT companies
    'tcs': 'TCS', 'tata consultancy': 'TCS', 'tata consultancy services': 'TCS',
    'infosys': 'INFY', 'infy': 'INFY',
    'wipro': 'WIPRO',
    'hcl': 'HCLTECH', 'hcl tech': 'HCLTECH', 'hcl technologies': 'HCLTECH',
    'tech mahindra': 'TECHM', 'techm': 'TECHM',
    
    // Tata Group companies
    'tata steel': 'TATASTEEL', 'tatasteel': 'TATASTEEL',
    'tata motors': 'TATAMOTORS', 'tatamotors': 'TATAMOTORS',
    'tata power': 'TATAPOWER', 'tatapower': 'TATAPOWER',
    'tata consumer': 'TATACONSUM', 'tataconsum': 'TATACONSUM',
    
    // Reliance group
    'reliance': 'RELIANCE', 'ril': 'RELIANCE', 'reliance industries': 'RELIANCE',
    'jio': 'RELIANCE', 'reliance jio': 'RELIANCE',
    
    // Other major stocks
    'bharti airtel': 'BHARTIARTL', 'airtel': 'BHARTIARTL', 'bhartiartl': 'BHARTIARTL',
    'asian paints': 'ASIANPAINT', 'asianpaint': 'ASIANPAINT',
    'nestle': 'NESTLEIND', 'nestle india': 'NESTLEIND',
    'hindustan unilever': 'HINDUNILVR', 'hul': 'HINDUNILVR', 'hindunilvr': 'HINDUNILVR',
    'itc': 'ITC',
    'larsen': 'LT', 'larsen toubro': 'LT', 'l&t': 'LT',
    'bajaj finance': 'BAJFINANCE', 'bajfinance': 'BAJFINANCE',
    'bajaj auto': 'BAJAJ-AUTO', 'bajajauto': 'BAJAJ-AUTO',
    'maruti': 'MARUTI', 'maruti suzuki': 'MARUTI',
    'mahindra': 'M&M', 'mahindra and mahindra': 'M&M',
    'hero motocorp': 'HEROMOTOCO', 'hero': 'HEROMOTOCO', 'heromotoco': 'HEROMOTOCO',
    'sun pharma': 'SUNPHARMA', 'sunpharma': 'SUNPHARMA',
    'dr reddy': 'DRREDDY', 'dr reddys': 'DRREDDY', 'drreddy': 'DRREDDY',
    'cipla': 'CIPLA',
    'coal india': 'COALINDIA', 'coalindia': 'COALINDIA',
    'ntpc': 'NTPC',
    'power grid': 'POWERGRID', 'powergrid': 'POWERGRID',
    'ongc': 'ONGC',
    'bpcl': 'BPCL',
    'ioc': 'IOC', 'indian oil': 'IOC',
    'ultratech': 'ULTRACEMCO', 'ultratech cement': 'ULTRACEMCO',
    'grasim': 'GRASIM',
    'adani': 'ADANIPORTS', 'adani ports': 'ADANIPORTS',
    'jsw steel': 'JSWSTEEL', 'jswsteel': 'JSWSTEEL'
  };

  /**
   * Enhanced intelligent stock symbol extraction using NLP patterns and Indian stock database
   */
  static parseStockSymbol(query: string): string | null {
    const cleanQuery = query.toLowerCase().trim();
    console.log(`🔍 Enhanced stock detection for: "${cleanQuery}"`);
    
    // Step 1: Check if this is a stock-related query
    const hasStockKeyword = this.STOCK_KEYWORDS.some(keyword => cleanQuery.includes(keyword));
    
    if (!hasStockKeyword) {
      console.log(`❌ No stock keywords detected in: "${cleanQuery}"`);
      return null;
    }
    
    console.log(`✅ Stock-related query detected`);
    
    // Step 2: First try to find exact matches in Indian stocks database
    const exactMatch = this.findExactStockMatch(cleanQuery);
    if (exactMatch) {
      console.log(`🎯 Found exact match in database: ${exactMatch}`);
      return exactMatch;
    }
    
    // Step 3: Try fuzzy matching for partial company names
    const fuzzyMatch = this.findFuzzyStockMatch(cleanQuery);
    if (fuzzyMatch) {
      console.log(`🎯 Found fuzzy match in database: ${fuzzyMatch}`);
      return fuzzyMatch;
    }
    
    // Step 4: Extract potential company names using intelligent parsing
    const potentialStockNames = this.extractCompanyNames(cleanQuery);
    
    if (potentialStockNames.length > 0) {
      console.log(`🎯 Extracted potential stock names: ${potentialStockNames.join(', ')}`);
      return potentialStockNames[0]; // Return the first/most likely match
    }
    
    console.log(`❌ No stock names extracted from: "${cleanQuery}"`);
    return null;
  }

  /**
   * Find exact matches in the Indian stocks database
   */
  private static findExactStockMatch(query: string): string | null {
    // Check for exact company name matches
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      if (query.includes(companyName)) {
        return symbol;
      }
    }
    
    // Check for direct symbol matches (e.g., "TCS", "RELIANCE")
    const words = query.split(/\s+/);
    for (const word of words) {
      const upperWord = word.toUpperCase();
      if (Object.values(this.INDIAN_STOCKS).includes(upperWord)) {
        return upperWord;
      }
    }
    
    return null;
  }

  /**
   * Find fuzzy matches for partial company names
   */
  private static findFuzzyStockMatch(query: string): string | null {
    // Look for whole word matches only (minimum 4 characters to avoid false positives)
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      if (companyName.length >= 4) {
        // Check for whole word boundaries to avoid substring false matches
        const wordPattern = new RegExp(`\\b${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordPattern.test(query)) {
          return symbol;
        }
      }
    }
    
    // Try word-by-word matching for multi-word company names
    const queryWords = query.toLowerCase().split(/\s+/);
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      const companyWords = companyName.toLowerCase().split(/\s+/);
      let matchCount = 0;
      
      for (const companyWord of companyWords) {
        // Only count exact word matches or very close matches (avoid substring matching)
        for (const queryWord of queryWords) {
          if (queryWord === companyWord || 
              (queryWord.length >= 4 && companyWord.length >= 4 && 
               (queryWord.startsWith(companyWord) || companyWord.startsWith(queryWord)))) {
            matchCount++;
            break; // Only count each company word once
          }
        }
      }
      
      // Require at least 2 matching words for multi-word companies, or all words for short companies
      const requiredMatches = companyWords.length >= 2 ? 2 : companyWords.length;
      if (matchCount >= requiredMatches) {
        return symbol;
      }
    }
    
    return null;
  }

  /**
   * Extract company names from query using intelligent patterns
   */
  private static extractCompanyNames(query: string): string[] {
    const words = query.split(/\s+/);
    const potentialNames: string[] = [];
    
    // Remove common stop words and stock keywords
    const stopWords = new Set([
      'i', 'should', 'buy', 'sell', 'invest', 'stock', 'share', 'shares', 'equity', 'now', 'today',
      'analysis', 'recommendation', 'price', 'target', 'good', 'bad', 'investment', 'the', 'a', 'an',
      'is', 'are', 'was', 'were', 'what', 'when', 'where', 'why', 'how', 'about', 'for', 'on', 'in'
    ]);
    
    // Extract meaningful words that could be company names
    const meaningfulWords = words.filter(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      return cleanWord.length > 2 && !stopWords.has(cleanWord) && !this.STOCK_KEYWORDS.includes(cleanWord);
    });
    
    console.log(`📝 Meaningful words found: ${meaningfulWords.join(', ')}`);
    
    // Try different combinations
    for (let i = 0; i < meaningfulWords.length; i++) {
      // Single word company names
      const singleWord = meaningfulWords[i].replace(/[^\w]/g, '').toUpperCase();
      if (singleWord.length >= 3) {
        potentialNames.push(singleWord);
      }
      
      // Two word combinations
      if (i < meaningfulWords.length - 1) {
        const twoWords = (meaningfulWords[i] + meaningfulWords[i + 1]).replace(/[^\w]/g, '').toUpperCase();
        if (twoWords.length >= 4) {
          potentialNames.push(twoWords);
        }
      }
      
      // Three word combinations for companies like "Tata Consultancy Services"
      if (i < meaningfulWords.length - 2) {
        const threeWords = (meaningfulWords[i] + meaningfulWords[i + 1] + meaningfulWords[i + 2]).replace(/[^\w]/g, '').toUpperCase();
        if (threeWords.length >= 6) {
          potentialNames.push(threeWords);
        }
      }
    }
    
    // Also look for existing uppercase patterns (NSE symbols)
    const upperCaseMatches = query.match(/\b[A-Z]{2,15}\b/g);
    if (upperCaseMatches) {
      potentialNames.push(...upperCaseMatches);
    }
    
    // Remove duplicates and return
    return Array.from(new Set(potentialNames));
  }

  /**
   * Enhanced stock data fetching with multiple data sources and web scraping
   */
  static async fetchStockData(symbol: string, companyName?: string): Promise<StockAnalysisData | null> {
    console.log(`📊 FAST stock data fetching for: ${symbol} (${companyName || 'Unknown'})`);
    
    // SPEED OPTIMIZATION: Try all sources in parallel with aggressive timeouts
    console.log(`⚡ PARALLEL approach: Trying all sources simultaneously with 5s timeout...`);
    
    try {
      // Start all methods in parallel with race condition
      const racePromises = [
        this.tryApiSourcesWithTimeout(symbol, 3000), // 3 second timeout
        WebScrapingService.vercelEnhancedSearch(symbol, companyName || symbol), // Skip comprehensive scraping
        this.createBasicFallbackData(symbol, companyName || symbol) // Always available fallback
      ];
      
      // Use Promise.allSettled to get fastest successful result
      const results = await Promise.allSettled(racePromises);
      
      // Return first successful result with actual data
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const value = result.value as any;
          
          // Check if it has valid price data
          if ((value.currentPrice && value.currentPrice > 0) || (value.current_price && value.current_price > 0)) {
            // Handle both formats
            if ('current_price' in value) {
              console.log(`✅ FAST SUCCESS: Web scraping data at ₹${value.current_price}`);
              return this.mapScrapedDataToAnalysisData(value);
            } else {
              console.log(`✅ FAST SUCCESS: API data at ₹${value.currentPrice}`);
              return value as StockAnalysisData;
            }
          }
        }
      }
      
      console.log(`⚠️ FAST FALLBACK: No real-time data, using basic structure for web analysis`);
      return this.createBasicFallbackData(symbol, companyName || symbol);
      
    } catch (error) {
      console.error('❌ FAST fetch failed:', error);
      return this.createBasicFallbackData(symbol, companyName || symbol);
    }
  }

  /**
   * Try API sources with aggressive timeout for speed
   */
  private static async tryApiSourcesWithTimeout(symbol: string, timeoutMs: number): Promise<StockAnalysisData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const apiData = await this.tryApiSources(symbol);
      clearTimeout(timeoutId);
      return apiData;
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`⚡ API sources timed out after ${timeoutMs}ms`);
      return null;
    }
  }

  /**
   * Create basic fallback data quickly
   */
  private static createBasicFallbackData(symbol: string, companyName: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: companyName || symbol,
      currentPrice: 0, // Will be updated from web search if found
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      sector: 'General',
      industry: 'General',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Try multiple API sources (existing implementation)
   */
  private static async tryApiSources(symbol: string): Promise<StockAnalysisData | null> {
    // SPEED OPTIMIZATION: Only try most common formats with timeouts
    const symbolVariations = [
      symbol,             // Direct symbol (most common)
      `${symbol}.NS`,     // NSE format (second most common)
    ];
    
    for (const symbolVariation of symbolVariations) {
      try {
        console.log(`⚡ FAST API check for: ${symbolVariation}`);
        
        // Add timeout to API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout per variation
        
        const stockData = await Promise.race([
          HybridStockApiService.getIndexData(symbolVariation),
          new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 2000))
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (stockData && stockData.price > 0) {
          console.log(`✅ FAST API success for ${symbolVariation}: ₹${stockData.price}`);
          return this.mapToStockAnalysisData(stockData, symbol);
        }
      } catch (error) {
        console.log(`⚡ API ${symbolVariation} failed quickly:`, error instanceof Error ? error.message : error);
        continue; // Try next variation
      }
    }
    
    console.log(`⚡ No API data found quickly for: ${symbol}`);
    return null;
  }

  /**
   * Map scraped data to analysis format
   */
  private static mapScrapedDataToAnalysisData(scrapedData: ScrapedStockData): StockAnalysisData {
    return {
      symbol: scrapedData.symbol,
      companyName: scrapedData.company_name,
      currentPrice: scrapedData.current_price,
      change: (scrapedData.current_price * scrapedData.change_percent) / 100,
      changePercent: scrapedData.change_percent,
      dayHigh: scrapedData.day_high || 0,
      dayLow: scrapedData.day_low || 0,
      volume: scrapedData.volume || 0,
      sector: 'General', // Will be enhanced with web search data
      industry: 'General', // Will be enhanced with web search data
      lastUpdated: scrapedData.last_updated
    };
  }

  /**
   * Map stock API data to analysis format
   */
  private static mapToStockAnalysisData(stockData: any, symbol: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: stockData.name || symbol,
      currentPrice: stockData.price || 0,
      change: stockData.change || 0,
      changePercent: stockData.changePercent || 0,
      dayHigh: stockData.dayHigh || 0,
      dayLow: stockData.dayLow || 0,
      volume: stockData.volume || 0,
      marketCap: stockData.marketCap,
      sector: stockData.sector || 'General', // Use API data if available
      industry: stockData.industry || 'General', // Use API data if available
      lastUpdated: stockData.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Perform web search for stock insights using Google Custom Search API
   */
  static async searchStockInsights(symbol: string, companyName: string): Promise<WebSearchResult[]> {
    console.log(`🌐 Starting web search for: ${companyName} (${symbol})`);
    
    // First check if Google API credentials are available
    const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
    
    console.log(`🔑 API Key available: ${!!apiKey}`);
    console.log(`🔍 Search Engine ID available: ${!!searchEngineId}`);
    
    if (!apiKey || !searchEngineId) {
      console.error('❌ Google Search API credentials missing!');
      console.error('Missing:', { apiKey: !apiKey, searchEngineId: !searchEngineId });
      return this.getFallbackInsights(symbol, companyName);
    }
    
    try {
      console.log(`🔍 Performing Google search for ${companyName} (${symbol})`);
      
      // Use Google Custom Search API exclusively
      const results = await GoogleSearchApiService.searchStockInsights(symbol, companyName);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} Google search results for ${symbol}`);
        return results;
      } else {
        console.warn(`⚠️ No Google search results found for ${symbol}, using fallback`);
        return this.getFallbackInsights(symbol, companyName);
      }
    } catch (error) {
      console.error('❌ Google search failed:', error);
      return this.getFallbackInsights(symbol, companyName);
    }
  }


  /**
   * Provide fallback insights when web search fails
   */
  private static getFallbackInsights(symbol: string, companyName: string): WebSearchResult[] {
    return [
      {
        title: `${companyName} Stock Analysis - Key Factors to Consider`,
        url: '#',
        snippet: 'Consider analyzing company fundamentals, recent quarterly results, industry trends, and market sentiment before making investment decisions.',
        source: 'Investment Guidelines',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${symbol} Technical Analysis Points`,
        url: '#',
        snippet: 'Review price charts, moving averages, volume trends, and support/resistance levels for technical insights.',
        source: 'Technical Analysis',
        publishedDate: new Date().toISOString()
      },
      {
        title: `Sector Analysis for ${companyName}`,
        url: '#',
        snippet: 'Evaluate sector performance, peer comparison, and industry-specific factors affecting the stock.',
        source: 'Sector Research',
        publishedDate: new Date().toISOString()
      }
    ];
  }

  /**
   * Generate AI-powered recommendation using OpenAI with structured prompts
   */
  static async generateEnhancedRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    userQuery: string
  ): Promise<StockRecommendation> {
    console.log(`🧠 Generating AI-powered analysis for ${stockData.companyName} using ${webInsights.length} web insights...`);

    // First calculate base scores
    const webSentimentScore = this.analyzeWebSentiment(webInsights);
    const technicalScore = this.calculateTechnicalScore(stockData);
    const fundamentalScore = this.calculateFundamentalScore(stockData);
    const newsImpactScore = this.calculateNewsImpact(webInsights);
    
    console.log(`📊 Base scores - Technical: ${technicalScore}, Sentiment: ${webSentimentScore}, Fundamental: ${fundamentalScore}, News: ${newsImpactScore}`);

    // Try AI-powered analysis first
    const aiRecommendation = await this.generateAIRecommendation(stockData, webInsights, userQuery);
    if (aiRecommendation) {
      console.log(`✅ AI-powered recommendation generated for ${stockData.companyName}`);
      return aiRecommendation;
    }

    // Fallback to enhanced algorithmic analysis
    console.log(`🔄 Using enhanced algorithmic fallback for ${stockData.companyName}`);
    return this.generateAlgorithmicRecommendation(stockData, webInsights, {
      technicalScore,
      webSentimentScore,
      fundamentalScore,
      newsImpactScore
    });
  }

  /**
   * Generate AI recommendation using OpenAI with structured prompts
   */
  private static async generateAIRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    userQuery: string
  ): Promise<StockRecommendation | null> {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        console.log('OpenAI API key not available for AI analysis');
        return null;
      }

      // Prepare structured data for AI
      const marketData = {
        symbol: stockData.symbol,
        companyName: stockData.companyName,
        currentPrice: stockData.currentPrice,
        changePercent: stockData.changePercent,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        volume: stockData.volume,
        sector: stockData.sector
      };

      const newsData = webInsights.slice(0, 5).map(insight => ({
        title: insight.title,
        snippet: insight.snippet,
        source: insight.source,
        date: insight.publishedDate
      }));

      const aiPrompt = `You are an expert Indian stock market analyst. Analyze the following stock data and provide a recommendation.

**STOCK DATA:**
${JSON.stringify(marketData, null, 2)}

**RECENT NEWS & ANALYSIS:**
${newsData.map(news => `- [${news.source}] ${news.title}: ${news.snippet}`).join('\n')}

**USER QUERY:** "${userQuery}"

**ANALYSIS REQUIREMENTS:**
1. Provide a clear BUY/SELL/HOLD recommendation
2. Give confidence level (0-100%)
3. Provide 4-6 key reasoning points
4. Suggest time horizon (SHORT_TERM/MEDIUM_TERM/LONG_TERM)
5. Calculate target price and stop loss if applicable

**RESPONSE FORMAT (JSON only):**
{
  "action": "BUY|SELL|HOLD",
  "confidence": 85,
  "reasoning": [
    "Technical analysis shows...",
    "Market sentiment indicates...",
    "Fundamental factors suggest...",
    "Recent news impact..."
  ],
  "timeHorizon": "MEDIUM_TERM",
  "targetPrice": 1250.50,
  "stopLoss": 1150.25,
  "analysis": "Brief overall analysis summary"
}

Consider Indian market conditions, NSE/BSE trading patterns, and sector-specific factors. Base your analysis on actual data provided.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Indian stock market analyst. Respond only with valid JSON format as requested.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (aiResponse) {
        try {
          const parsedResponse = JSON.parse(aiResponse);
          console.log(`🤖 AI recommendation parsed successfully for ${stockData.companyName}`);
          
          return {
            action: parsedResponse.action as 'BUY' | 'SELL' | 'HOLD',
            confidence: Math.min(95, Math.max(50, parsedResponse.confidence)),
            reasoning: parsedResponse.reasoning || ['AI analysis completed'],
            timeHorizon: parsedResponse.timeHorizon || 'MEDIUM_TERM',
            targetPrice: parsedResponse.targetPrice || undefined,
            stopLoss: parsedResponse.stopLoss || undefined
          };
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          return null;
        }
      }

      return null;

    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return null;
    }
  }

  /**
   * Enhanced algorithmic recommendation (fallback)
   */
  private static generateAlgorithmicRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    scores: { technicalScore: number; webSentimentScore: number; fundamentalScore: number; newsImpactScore: number }
  ): StockRecommendation {
    // Weighted scoring with emphasis on web insights
    const overallScore = (
      scores.technicalScore * 0.25 + 
      scores.webSentimentScore * 0.35 + 
      scores.fundamentalScore * 0.25 + 
      scores.newsImpactScore * 0.15
    );
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string[] = [];
    
    // Determine action based on enhanced scoring
    if (overallScore >= 75) {
      action = 'BUY';
      confidence = Math.min(95, overallScore);
      reasoning = [
        `Strong buy signals from comprehensive analysis (Score: ${overallScore.toFixed(1)}/100)`,
        `Current market sentiment is positive based on recent news and analysis`,
        stockData.currentPrice > 0 ? `Technical indicators show favorable entry point at ₹${stockData.currentPrice}` : `Web research indicates favorable market conditions`,
        `Financial experts show positive outlook based on web research`
      ];
    } else if (overallScore <= 35) {
      action = 'SELL';
      confidence = Math.min(95, 100 - overallScore);
      reasoning = [
        `Analysis suggests caution with current weak signals (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment appears negative based on recent developments`,
        stockData.currentPrice > 0 ? `Technical indicators show potential downside risk` : `Web research indicates market concerns`,
        `Financial analysts express caution based on recent news`
      ];
    } else {
      action = 'HOLD';
      confidence = 60 + Math.abs(overallScore - 50);
      reasoning = [
        `Mixed signals suggest a wait-and-watch approach (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment is neutral with conflicting opinions`,
        stockData.currentPrice > 0 ? `Current price levels appear fairly valued` : `Insufficient data for clear directional signals`,
        `Recommend monitoring for clearer market direction`
      ];
    }
    
    // Add specific insights from web search
    if (webInsights.length > 0) {
      const recentNews = webInsights.filter(insight => {
        if (!insight.publishedDate) return false;
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7;
      });
      
      if (recentNews.length > 0) {
        reasoning.push(`${recentNews.length} recent news articles analyzed for current market sentiment`);
      }
      
      // Add key insights from search results
      const keyTopics = this.extractKeyTopics(webInsights);
      if (keyTopics.length > 0) {
        reasoning.push(`Key market themes: ${keyTopics.join(', ')}`);
      }
    }
    
    // Add stock-specific insights
    if (stockData.changePercent > 5) {
      reasoning.push(`Stock showing strong momentum with +${stockData.changePercent.toFixed(2)}% gain`);
    } else if (stockData.changePercent < -5) {
      reasoning.push(`Stock under pressure with ${stockData.changePercent.toFixed(2)}% decline`);
    }
    
    if (stockData.volume > 0) {
      reasoning.push(`Active trading interest with significant volume`);
    }
    
    return {
      action,
      confidence,
      reasoning,
      timeHorizon: this.determineTimeHorizon(stockData, overallScore),
      targetPrice: this.calculateTargetPrice(stockData, action),
      stopLoss: this.calculateStopLoss(stockData, action)
    };
  }

  /**
   * Original recommendation function (kept for backward compatibility)
   */
  static async generateRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[]
  ): Promise<StockRecommendation> {
    try {
      // Analyze various factors to generate recommendation
      const technicalScore = this.calculateTechnicalScore(stockData);
      const sentimentScore = this.analyzeSentiment(webInsights);
      const fundamentalScore = this.calculateFundamentalScore(stockData);
      
      const overallScore = (technicalScore + sentimentScore + fundamentalScore) / 3;
      
      let action: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;
      let reasoning: string[] = [];
      
      if (overallScore >= 70) {
        action = 'BUY';
        confidence = Math.min(95, overallScore);
        reasoning = [
          'Strong technical indicators showing upward momentum',
          'Positive market sentiment from recent news and analysis',
          'Fundamental metrics appear favorable for growth'
        ];
      } else if (overallScore <= 30) {
        action = 'SELL';
        confidence = Math.min(95, 100 - overallScore);
        reasoning = [
          'Technical indicators suggest downward pressure',
          'Market sentiment appears cautious or negative',
          'Fundamental concerns may impact future performance'
        ];
      } else {
        action = 'HOLD';
        confidence = 60 + Math.abs(overallScore - 50);
        reasoning = [
          'Mixed signals from technical and fundamental analysis',
          'Current price levels may be fairly valued',
          'Consider waiting for clearer market direction'
        ];
      }
      
      // Add specific reasoning based on stock data
      if (stockData.changePercent > 5) {
        reasoning.push('Stock has shown strong recent gains (+' + stockData.changePercent.toFixed(2) + '%)');
      } else if (stockData.changePercent < -5) {
        reasoning.push('Stock has declined recently (' + stockData.changePercent.toFixed(2) + '%)');
      }
      
      if (stockData.volume > 0) {
        reasoning.push('Trading volume indicates active market interest');
      }
      
      return {
        action,
        confidence,
        reasoning,
        timeHorizon: this.determineTimeHorizon(stockData, overallScore),
        targetPrice: this.calculateTargetPrice(stockData, action),
        stopLoss: this.calculateStopLoss(stockData, action)
      };
    } catch (error) {
      console.error('Error generating recommendation:', error);
      
      // Fallback recommendation
      return {
        action: 'HOLD',
        confidence: 50,
        reasoning: [
          'Unable to perform complete analysis due to limited data',
          'Recommend consulting with financial advisor',
          'Consider your risk tolerance and investment goals'
        ],
        timeHorizon: 'MEDIUM_TERM'
      };
    }
  }

  /**
   * Calculate technical analysis score (0-100)
   */
  private static calculateTechnicalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // If no real-time data available, return neutral score
    if (stockData.currentPrice === 0) {
      return 50;
    }
    
    // Price momentum
    if (stockData.changePercent > 2) score += 20;
    else if (stockData.changePercent > 0) score += 10;
    else if (stockData.changePercent < -2) score -= 20;
    else if (stockData.changePercent < 0) score -= 10;
    
    // Price position relative to day range
    const dayRange = stockData.dayHigh - stockData.dayLow;
    if (dayRange > 0) {
      const pricePosition = (stockData.currentPrice - stockData.dayLow) / dayRange;
      if (pricePosition > 0.8) score += 15;
      else if (pricePosition > 0.6) score += 10;
      else if (pricePosition < 0.2) score -= 15;
      else if (pricePosition < 0.4) score -= 10;
    }
    
    // Volume analysis (higher volume generally indicates stronger moves)
    if (stockData.volume > 1000000) score += 10;
    else if (stockData.volume > 500000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enhanced web sentiment analysis using comprehensive keyword analysis
   */
  private static analyzeWebSentiment(insights: WebSearchResult[]): number {
    if (insights.length === 0) return 50; // Neutral if no insights
    
    let score = 50; // Neutral starting point
    
    const strongPositiveKeywords = [
      'strong buy', 'outperform', 'upgrade', 'target raised', 'bullish', 'positive outlook',
      'growth potential', 'strong results', 'beat estimates', 'expansion', 'record high'
    ];
    
    const positiveKeywords = [
      'buy', 'positive', 'growth', 'strong', 'good', 'increase', 'gain', 'profit',
      'revenue growth', 'market share', 'competitive advantage', 'dividend'
    ];
    
    const strongNegativeKeywords = [
      'strong sell', 'underperform', 'downgrade', 'target cut', 'bearish', 'negative outlook',
      'profit warning', 'loss', 'debt concerns', 'regulatory issues', 'scandal'
    ];
    
    const negativeKeywords = [
      'sell', 'negative', 'decline', 'weak', 'concern', 'risk', 'fall', 'drop',
      'competition', 'pressure', 'margin compression', 'volatility'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      // Strong signals get higher weight
      strongPositiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 8;
      });
      
      strongNegativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 8;
      });
      
      // Regular signals
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
      
      // Recency bonus - more recent articles get higher weight
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) score += 2; // Today's news
        if (daysSince < 7) score += 1; // This week's news
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate news impact score based on source credibility and recency
   */
  private static calculateNewsImpact(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const trustedSources = [
      'moneycontrol', 'economic times', 'livemint', 'business standard',
      'financial express', 'bloomberg', 'reuters', 'cnbc'
    ];
    
    insights.forEach(insight => {
      let articleWeight = 1;
      
      // Higher weight for trusted sources
      trustedSources.forEach(source => {
        if (insight.source.toLowerCase().includes(source)) {
          articleWeight = 2;
        }
      });
      
      // Recency factor
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) articleWeight *= 2; // Very recent
        if (daysSince < 7) articleWeight *= 1.5; // Recent
      }
      
      // Content analysis
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      if (text.includes('analyst') || text.includes('recommendation')) {
        score += 5 * articleWeight;
      }
      
      if (text.includes('earnings') || text.includes('results')) {
        score += 4 * articleWeight;
      }
      
      if (text.includes('target price') || text.includes('price target')) {
        score += 6 * articleWeight;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract key topics from web insights
   */
  private static extractKeyTopics(insights: WebSearchResult[]): string[] {
    const topics = new Set<string>();
    
    const topicKeywords = {
      'earnings': ['earnings', 'results', 'quarterly', 'annual'],
      'analyst recommendation': ['analyst', 'recommendation', 'rating', 'target'],
      'expansion': ['expansion', 'growth', 'new', 'launch'],
      'regulatory': ['regulatory', 'government', 'policy', 'approval'],
      'competition': ['competition', 'competitor', 'market share'],
      'financial performance': ['revenue', 'profit', 'margin', 'debt']
    };
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          topics.add(topic);
        }
      });
    });
    
    return Array.from(topics).slice(0, 3); // Return top 3 topics
  }

  /**
   * Analyze sentiment from web insights
   */
  private static analyzeSentiment(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const positiveKeywords = [
      'bullish', 'positive', 'growth', 'strong', 'outperform', 'upgrade', 'buy',
      'target', 'potential', 'recovery', 'momentum', 'breakout', 'support'
    ];
    
    const negativeKeywords = [
      'bearish', 'negative', 'decline', 'weak', 'underperform', 'downgrade', 'sell',
      'concern', 'risk', 'pressure', 'resistance', 'correction', 'caution'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate fundamental analysis score
   */
  private static calculateFundamentalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // Sector-based adjustments
    const growthSectors = ['Information Technology', 'Healthcare', 'Consumer Discretionary'];
    const defensiveSectors = ['Consumer Staples', 'Utilities', 'Telecommunications'];
    
    if (growthSectors.includes(stockData.sector)) {
      score += 10;
    } else if (defensiveSectors.includes(stockData.sector)) {
      score += 5;
    }
    
    // Market cap considerations (assuming larger companies are more stable)
    if (stockData.marketCap && stockData.marketCap > 1000000000) { // > 1000 Cr
      score += 10;
    } else if (stockData.marketCap && stockData.marketCap > 500000000) { // > 500 Cr
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine investment time horizon
   */
  private static determineTimeHorizon(stockData: StockAnalysisData, score: number): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
    if (Math.abs(stockData.changePercent) > 3 && score > 70) {
      return 'SHORT_TERM'; // High volatility with strong signal
    } else if (score > 60 || score < 40) {
      return 'MEDIUM_TERM'; // Clear directional bias
    } else {
      return 'LONG_TERM'; // Unclear signals, longer horizon recommended
    }
  }

  /**
   * Calculate target price based on recommendation
   */
  private static calculateTargetPrice(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 1.15; // 15% upside target
    } else if (action === 'SELL') {
      return stockData.currentPrice * 0.90; // 10% downside
    }
    return undefined; // No target for HOLD
  }

  /**
   * Calculate stop loss based on recommendation
   */
  private static calculateStopLoss(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 0.95; // 5% stop loss
    } else if (action === 'SELL') {
      return stockData.currentPrice * 1.05; // 5% stop loss on short
    }
    return undefined; // No stop loss for HOLD
  }

  // Removed hardcoded sector/industry mappings - now using dynamic data from APIs

  /**
   * Complete stock analysis pipeline with enhanced web search integration
   */
  static async analyzeStock(userQuery: string): Promise<StockAnalysisResult | null> {
    try {
      // Parse stock symbol from query
      const symbol = this.parseStockSymbol(userQuery);
      if (!symbol) {
        return null;
      }

      console.log(`🔍 Starting comprehensive analysis for: ${symbol}`);
      console.log(`📝 User query: "${userQuery}"`);

      // Step 1: Start both stock data fetching and web search in parallel for speed
      console.log(`📊 Step 1: Starting parallel data fetching for ${symbol}...`);
      
      // Extract company name from user query for better data fetching
      const extractedCompanyName = this.extractCompanyNameFromQuery(userQuery, symbol);
      
      // Run API data fetching and web search in parallel
      const [stockDataResult, webInsightsResult] = await Promise.allSettled([
        this.fetchStockData(symbol, extractedCompanyName),
        this.searchStockInsights(symbol, extractedCompanyName)
      ]);
      
      // Process stock data result
      let stockData: StockAnalysisData;
      if (stockDataResult.status === 'fulfilled' && stockDataResult.value) {
        stockData = stockDataResult.value;
        console.log(`✅ Enhanced stock data retrieved: ${stockData.companyName} at ₹${stockData.currentPrice}`);
      } else {
        console.log(`⚠️ No stock data found for ${symbol}, creating fallback entry for web search`);
        stockData = this.createFallbackStockData(symbol, extractedCompanyName);
      }
      
      // Process web insights result
      const webInsights = webInsightsResult.status === 'fulfilled' ? webInsightsResult.value : [];
      console.log(`🌐 Web search completed: ${webInsights.length} insights found`);
      console.log(`✅ Found ${webInsights.length} web insights from financial sources`);

      // SPEED OPTIMIZATION: Skip expensive price extraction from web search
      if (stockData.currentPrice === 0 && webInsights.length > 0) {
        console.log(`⚡ SPEED: Skipping price extraction to save time - proceeding with web-only analysis...`);
        // Use web insights directly for analysis without price extraction
      }

      // Step 3: Generate recommendation based on available data
      console.log(`🧠 Step 3: Generating recommendation using ${stockData.currentPrice > 0 ? 'extracted' : 'web-only'} data and insights...`);
      const recommendation = await this.generateEnhancedRecommendation(
        stockData, 
        webInsights, 
        userQuery
      );
      console.log(`✅ Generated ${recommendation.action} recommendation with ${recommendation.confidence}% confidence`);

      return {
        stockData,
        webInsights,
        recommendation,
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This analysis is based on web research and available data for educational purposes only.',
          'Not financial advice - consult qualified financial advisors before investing.',
          'Stock markets are volatile and past performance doesn\'t guarantee future results.',
          'Consider your risk tolerance, investment objectives, and financial situation.',
          'Web search data reflects current market sentiment but may change rapidly.',
          ...(stockData.currentPrice === 0 ? ['Real-time stock price data not available - analysis based on web research only.'] : [])
        ]
      };
    } catch (error) {
      console.error('❌ Error in comprehensive stock analysis:', error);
      return null;
    }
  }

  /**
   * Extract company name from user query
   */
  private static extractCompanyNameFromQuery(userQuery: string, symbol: string): string {
    // First check if symbol matches known companies
    const knownCompany = Object.entries(this.INDIAN_STOCKS).find(([name, sym]) => sym === symbol);
    if (knownCompany) {
      return knownCompany[0].split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    // Extract from query
    const words = userQuery.toLowerCase().split(/\s+/);
    const stopWords = new Set(['should', 'i', 'buy', 'sell', 'stock', 'share', 'shares', 'analysis', 'of', 'about', 'the', 'a', 'an']);
    const companyWords = words.filter(word => !stopWords.has(word) && word.length > 2 && !this.STOCK_KEYWORDS.includes(word));
    
    return companyWords.length > 0 ? 
      companyWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      symbol;
  }

  /**
   * Create fallback stock data when real data is not available
   */
  private static createFallbackStockData(symbol: string, companyName: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: companyName || symbol,
      currentPrice: 0, // Will be updated from web search if found
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      sector: 'General',
      industry: 'General',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * SIMPLIFIED: Direct web scraping from first Google result
   */
  private static async extractPriceFromWebSearch(webInsights: WebSearchResult[], stockData: StockAnalysisData): Promise<StockAnalysisData> {
    if (stockData.currentPrice > 0) {
      return stockData; // Already has real-time data
    }

    console.log(`💰 SIMPLIFIED APPROACH: Scraping price from first Google result...`);

    // Step 1: Do a direct Google search for the stock price
    const directPriceData = await this.directGoogleStockSearch(stockData.symbol, stockData.companyName);
    if (directPriceData) {
      console.log(`✅ DIRECT SCRAPING SUCCESS: ₹${directPriceData.currentPrice}`);
      return { ...stockData, ...directPriceData };
    }

    console.log(`⚠️ Direct scraping failed, using basic fallback`);
    return stockData;
  }

  /**
   * SIMPLE DIRECT APPROACH: Google search → First result → Extract price
   */
  private static async directGoogleStockSearch(symbol: string, companyName: string): Promise<Partial<StockAnalysisData> | null> {
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        console.error('❌ Google API credentials missing');
        return null;
      }

      // Simple search query - exactly what user would search
      const searchQuery = `${companyName} stock price today`;
      console.log(`🔍 Direct Google search: "${searchQuery}"`);
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: searchQuery,
        num: '3' // Get top 3 results
      });

      const response = await fetch(searchUrl);
      if (!response.ok) {
        console.error(`❌ Google search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.error(`❌ No search results found for: ${searchQuery}`);
        return null;
      }

      // Try each result until we find price data
      for (let i = 0; i < data.items.length; i++) {
        const result = data.items[i];
        console.log(`🔍 Trying result ${i + 1}: ${result.title}`);
        
        const extractedData = this.extractPriceFromSingleResult(result);
        if (extractedData && extractedData.currentPrice && extractedData.currentPrice > 0) {
          console.log(`✅ SUCCESS from result ${i + 1}: ₹${extractedData.currentPrice}`);
          return extractedData;
        }
      }

      console.log(`❌ No price data found in any of the ${data.items.length} results`);
      return null;

    } catch (error) {
      console.error('❌ Direct Google search error:', error);
      return null;
    }
  }

  /**
   * Extract price data from a single search result (title + snippet)
   */
  private static extractPriceFromSingleResult(result: any): Partial<StockAnalysisData> | null {
    try {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      console.log(`📄 Analyzing: "${text.substring(0, 100)}..."`);
      
      // Look for price patterns - be more aggressive in extraction
      const pricePatterns = [
        /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /price[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees/g
      ];

      for (const pattern of pricePatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const priceStr = match[1].replace(/,/g, '');
          const price = parseFloat(priceStr);
          
          // Be more lenient with price validation for Indian stocks
          if (price >= 1 && price <= 100000) {
            console.log(`💰 FOUND PRICE: ₹${price} using pattern: ${pattern.source}`);
            
            // Try to extract percentage change
            const changePattern = /([+-]?\d+(?:\.\d+)?)\s*%/;
            const changeMatch = text.match(changePattern);
            let changePercent = 0;
            
            if (changeMatch) {
              changePercent = parseFloat(changeMatch[1]);
              console.log(`📈 FOUND CHANGE: ${changePercent}%`);
            }

            // Try to extract day high/low
            let dayHigh = 0, dayLow = 0;
            
            const highMatch = text.match(/high[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
            if (highMatch) {
              dayHigh = parseFloat(highMatch[1].replace(/,/g, ''));
              console.log(`📊 FOUND HIGH: ₹${dayHigh}`);
            }
            
            const lowMatch = text.match(/low[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
            if (lowMatch) {
              dayLow = parseFloat(lowMatch[1].replace(/,/g, ''));
              console.log(`📊 FOUND LOW: ₹${dayLow}`);
            }

            return {
              currentPrice: price,
              changePercent: changePercent,
              change: (price * changePercent) / 100,
              dayHigh: dayHigh > 0 ? dayHigh : undefined,
              dayLow: dayLow > 0 ? dayLow : undefined,
              lastUpdated: new Date().toISOString()
            };
          }
        }
      }

      console.log(`❌ No valid price found in this result`);
      return null;
      
    } catch (error) {
      console.error('❌ Error extracting from single result:', error);
      return null;
    }
  }

  // Removed complex MoneyControl code - keeping it simple now

  /**
   * Test function to verify fuzzy matching fix
   */
  static testFuzzyMatching(): void {
    console.log('🧪 Testing fuzzy matching fix...');
    
    // Test cases that should NOT match to ICICI
    const testCases = [
      'eternal stock',
      'eternal',
      'internal company',
      'external factors'
    ];
    
    testCases.forEach(testCase => {
      const result = this.findFuzzyStockMatch(testCase);
      console.log(`Test: "${testCase}" -> ${result || 'No match'}`);
      
      if (testCase.includes('eternal') && result === 'ICICIBANK') {
        console.error(`❌ BUG: "${testCase}" incorrectly matched to ICICI!`);
      } else if (testCase.includes('eternal') && !result) {
        console.log(`✅ FIXED: "${testCase}" correctly returns no match`);
      }
    });
    
    // Test cases that SHOULD match
    const validCases = [
      'icici bank',
      'icici',
      'hdfc bank',
      'reliance',
      'tata consultancy services'
    ];
    
    validCases.forEach(testCase => {
      const result = this.findFuzzyStockMatch(testCase);
      console.log(`Valid test: "${testCase}" -> ${result || 'No match'}`);
    });
  }
}