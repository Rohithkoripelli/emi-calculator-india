/**
 * Web Scraping Service - Interface with Python BeautifulSoup backend
 */

export interface ScrapedStockData {
  symbol: string;
  company_name: string;
  current_price: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  last_updated: string;
  sources: string[];
  data_quality: 'low' | 'medium' | 'high';
}

export class WebScrapingService {
  private static readonly VERCEL_API_BASE = process.env.REACT_APP_VERCEL_API_URL || '';
  private static readonly PYTHON_API_BASE = process.env.REACT_APP_PYTHON_SCRAPER_URL || 'http://localhost:5000';
  
  /**
   * Scrape stock data using Python BeautifulSoup backend
   */
  static async scrapeStockData(symbol: string, companyName: string): Promise<ScrapedStockData | null> {
    try {
      console.log(`🐍 Requesting Python scraper for ${symbol} (${companyName})`);
      
      const response = await fetch(`${this.PYTHON_API_BASE}/api/scrape-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          company_name: companyName
        }),
        timeout: 30000 // 30 second timeout for scraping
      });

      if (!response.ok) {
        throw new Error(`Python scraper API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`✅ Python scraper returned data for ${symbol}:`, data);
      return data as ScrapedStockData;

    } catch (error) {
      console.error(`❌ Python scraping failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Check if Python scraper service is available
   */
  static async checkScraperHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PYTHON_API_BASE}/api/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Python scraper service not available:', error);
      return false;
    }
  }

  /**
   * Fallback scraping using JavaScript (limited capabilities)
   */
  static async fallbackJavaScriptScraping(symbol: string, companyName: string): Promise<Partial<ScrapedStockData> | null> {
    console.log(`📱 Attempting JavaScript fallback scraping for ${symbol}`);
    
    try {
      // Use a CORS proxy to scrape financial data
      const corsProxy = 'https://api.allorigins.win/get?url=';
      const targetUrl = encodeURIComponent(`https://finance.yahoo.com/quote/${symbol}.NS`);
      
      const response = await fetch(`${corsProxy}${targetUrl}`);
      
      if (!response.ok) {
        throw new Error(`CORS proxy error: ${response.status}`);
      }

      const data = await response.json();
      const htmlContent = data.contents;
      
      // Parse HTML content (limited without BeautifulSoup)
      const priceMatch = htmlContent.match(/data-symbol="[^"]*"[^>]*>([0-9,]+\.?[0-9]*)</);
      const changeMatch = htmlContent.match(/\(([+-]?[0-9]+\.?[0-9]*)%\)/);
      
      const result: Partial<ScrapedStockData> = {
        symbol: symbol,
        company_name: companyName,
        sources: ['Yahoo Finance (Fallback)'],
        data_quality: 'low',
        last_updated: new Date().toISOString()
      };

      if (priceMatch) {
        result.current_price = parseFloat(priceMatch[1].replace(',', ''));
      }

      if (changeMatch) {
        result.change_percent = parseFloat(changeMatch[1]);
      }

      console.log(`📱 JavaScript fallback result for ${symbol}:`, result);
      return result.current_price ? result : null;

    } catch (error) {
      console.error(`❌ JavaScript fallback scraping failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Comprehensive scraping with Vercel serverless and fallback strategy
   */
  static async comprehensiveScraping(symbol: string, companyName: string): Promise<ScrapedStockData | null> {
    console.log(`🔧 Starting comprehensive scraping for ${symbol}`);
    
    // Step 1: Try Vercel serverless enhanced search (primary)
    let scrapedData = await this.vercelEnhancedSearch(symbol, companyName);
    
    if (scrapedData && scrapedData.current_price > 0) {
      console.log(`✅ Vercel enhanced search successful for ${symbol}`);
      return scrapedData;
    }

    // Step 2: Try Vercel Python scraper
    scrapedData = await this.vercelPythonScraper(symbol, companyName);
    
    if (scrapedData && scrapedData.current_price > 0) {
      console.log(`✅ Vercel Python scraper successful for ${symbol}`);
      return scrapedData;
    }

    // Step 3: Try standalone Python scraper (local development)
    scrapedData = await this.scrapeStockData(symbol, companyName);
    
    if (scrapedData && scrapedData.current_price > 0) {
      console.log(`✅ Standalone Python scraper successful for ${symbol}`);
      return scrapedData;
    }

    // Step 4: Fallback to JavaScript scraping (limited)
    console.log(`🔄 Trying JavaScript fallback for ${symbol}`);
    const fallbackData = await this.fallbackJavaScriptScraping(symbol, companyName);
    
    if (fallbackData && fallbackData.current_price && fallbackData.current_price > 0) {
      console.log(`✅ JavaScript fallback successful for ${symbol}`);
      return {
        symbol: symbol,
        company_name: companyName,
        current_price: fallbackData.current_price,
        change_percent: fallbackData.change_percent || 0,
        day_high: 0,
        day_low: 0,
        volume: 0,
        last_updated: new Date().toISOString(),
        sources: fallbackData.sources || ['Fallback'],
        data_quality: 'low'
      };
    }

    // Step 5: No data available
    console.log(`❌ All scraping methods failed for ${symbol}`);
    return null;
  }

  /**
   * Use Vercel serverless enhanced search API
   */
  static async vercelEnhancedSearch(symbol: string, companyName: string): Promise<ScrapedStockData | null> {
    try {
      console.log(`🚀 Vercel enhanced search for ${symbol} (${companyName})`);
      
      const apiUrl = this.VERCEL_API_BASE ? 
        `${this.VERCEL_API_BASE}/api/enhanced-stock-search` : 
        '/api/enhanced-stock-search';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          companyName: companyName
        }),
      });

      if (!response.ok) {
        throw new Error(`Vercel enhanced search error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Map Vercel response to ScrapedStockData format
      if (data.currentPrice > 0) {
        console.log(`✅ Vercel enhanced search returned data for ${symbol}:`, data);
        return {
          symbol: data.symbol,
          company_name: data.companyName,
          current_price: data.currentPrice,
          change_percent: data.changePercent || 0,
          day_high: data.dayHigh || 0,
          day_low: data.dayLow || 0,
          volume: data.volume || 0,
          last_updated: data.lastUpdated || new Date().toISOString(),
          sources: data.sources || ['Vercel Enhanced Search'],
          data_quality: data.dataQuality || 'medium'
        };
      }

      return null;

    } catch (error) {
      console.error(`❌ Vercel enhanced search failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Use Vercel Python scraper API
   */
  static async vercelPythonScraper(symbol: string, companyName: string): Promise<ScrapedStockData | null> {
    try {
      console.log(`🐍 Vercel Python scraper for ${symbol} (${companyName})`);
      
      const apiUrl = this.VERCEL_API_BASE ? 
        `${this.VERCEL_API_BASE}/api/scrape-stock` : 
        '/api/scrape-stock';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol,
          company_name: companyName
        }),
      });

      if (!response.ok) {
        throw new Error(`Vercel Python scraper error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`✅ Vercel Python scraper returned data for ${symbol}:`, data);
      return data as ScrapedStockData;

    } catch (error) {
      console.error(`❌ Vercel Python scraper failed for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Enhanced price extraction using multiple patterns
   */
  static extractPriceFromText(text: string): number | null {
    // Multiple price patterns for Indian stocks
    const pricePatterns = [
      /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
      /rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /price[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /current[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees/gi,
      /ltp[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi
    ];

    for (const pattern of pricePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        
        // Validate price range for Indian stocks
        if (price >= 0.01 && price <= 500000) {
          return price;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract percentage change from text
   */
  static extractChangePercentFromText(text: string): number | null {
    const changePatterns = [
      /([+-]?\d+(?:\.\d+)?)\s*%/g,
      /\(([+-]?\d+(?:\.\d+)?)%\)/g,
      /change[:\s]*([+-]?\d+(?:\.\d+)?)\s*%/gi
    ];

    for (const pattern of changePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const change = parseFloat(match[1]);
        
        // Validate reasonable change range
        if (change >= -50 && change <= 50) {
          return change;
        }
      }
    }
    
    return null;
  }
}