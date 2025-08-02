/**
 * Vercel Serverless Function for Enhanced Stock Data Search
 * JavaScript-based with comprehensive error handling
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol, companyName } = req.method === 'POST' ? req.body : req.query;

    if (!symbol) {
      return res.status(400).json({ 
        error: 'Symbol is required',
        example: { symbol: 'TCS', companyName: 'Tata Consultancy Services' }
      });
    }

    console.log(`🔍 Enhanced search for ${symbol} (${companyName})`);

    // Step 1: Try multiple data gathering approaches
    const results = await Promise.allSettled([
      searchGoogleForStockData(symbol, companyName),
      searchFinancialAPIs(symbol),
      searchDirectFinancialSites(symbol, companyName)
    ]);

    // Step 2: Consolidate results
    const consolidatedData = consolidateSearchResults(results, symbol, companyName);

    // Step 3: Enhance with web insights
    const webInsights = await searchStockInsights(symbol, companyName);

    const response = {
      ...consolidatedData,
      webInsights,
      searchMethod: 'enhanced_vercel_serverless',
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Enhanced search completed for ${symbol}`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('Enhanced search error:', error);
    return res.status(500).json({
      error: 'Enhanced search failed',
      message: error.message,
      fallback: 'Try direct Google search or financial news sites'
    });
  }
}

/**
 * Search Google Custom Search API for stock data
 */
async function searchGoogleForStockData(symbol, companyName) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error('Google API credentials not configured');
  }

  const queries = [
    `${companyName} ${symbol} stock price live NSE BSE`,
    `${symbol} current share price today`,
    `${companyName} stock quote real time`
  ];

  const allResults = [];

  for (const query of queries) {
    try {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?` + 
        new URLSearchParams({
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: 5,
          gl: 'in',
          lr: 'lang_en'
        });

      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.items) {
          for (const item of data.items) {
            const extractedData = extractPriceFromSearchResult(item, symbol);
            if (extractedData) {
              allResults.push({
                ...extractedData,
                source: extractSourceFromUrl(item.link),
                url: item.link,
                title: item.title
              });
            }
          }
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn(`Google search failed for query: ${query}`, error);
    }
  }

  return allResults;
}

/**
 * Search financial APIs for stock data
 */
async function searchFinancialAPIs(symbol) {
  const results = [];

  // Try multiple API endpoints
  const apiEndpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.BO`,
    `https://api.worldtradingdata.com/api/v1/stock?symbol=${symbol}.NSE&api_token=demo`
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StockAnalyzer/1.0)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const extractedData = extractDataFromAPI(data, symbol);
        
        if (extractedData) {
          results.push({
            ...extractedData,
            source: 'Financial API',
            apiEndpoint: endpoint
          });
        }
      }
    } catch (error) {
      console.warn(`API endpoint failed: ${endpoint}`, error);
    }
  }

  return results;
}

/**
 * Search direct financial sites with CORS proxy
 */
async function searchDirectFinancialSites(symbol, companyName) {
  const results = [];
  
  const sites = [
    {
      url: `https://www.moneycontrol.com/india/stockpricequote/${symbol.toLowerCase()}`,
      name: 'MoneyControl'
    },
    {
      url: `https://finance.yahoo.com/quote/${symbol}.NS`,
      name: 'Yahoo Finance'
    }
  ];

  for (const site of sites) {
    try {
      // Use CORS proxy for client-side access
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(site.url)}`;
      
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const data = await response.json();
        const extractedData = extractPriceFromHTML(data.contents, symbol);
        
        if (extractedData) {
          results.push({
            ...extractedData,
            source: site.name,
            url: site.url
          });
        }
      }
    } catch (error) {
      console.warn(`Direct site access failed: ${site.name}`, error);
    }
  }

  return results;
}

/**
 * Extract price data from Google search results
 */
function extractPriceFromSearchResult(item, symbol) {
  const text = `${item.title} ${item.snippet}`.toLowerCase();
  
  // Look for price patterns
  const pricePatterns = [
    /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
    /rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
    /price[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees/gi
  ];

  for (const pattern of pricePatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      
      if (price >= 1 && price <= 100000) {
        // Look for percentage change
        const changeMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
        const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;
        
        return {
          currentPrice: price,
          changePercent: changePercent,
          change: (price * changePercent) / 100,
          extractionMethod: 'search_result_text'
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract data from financial API responses
 */
function extractDataFromAPI(data, symbol) {
  try {
    // Yahoo Finance API structure
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (meta && meta.regularMarketPrice) {
        return {
          currentPrice: meta.regularMarketPrice,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          change: meta.regularMarketPrice - meta.previousClose,
          dayHigh: meta.regularMarketDayHigh || 0,
          dayLow: meta.regularMarketDayLow || 0,
          volume: meta.regularMarketVolume || 0,
          extractionMethod: 'yahoo_finance_api'
        };
      }
    }
    
    // Generic API structure
    if (data.price || data.last_price || data.regularMarketPrice) {
      const price = data.price || data.last_price || data.regularMarketPrice;
      return {
        currentPrice: price,
        changePercent: data.change_percent || data.changePercent || 0,
        change: data.change || 0,
        extractionMethod: 'generic_api'
      };
    }
    
  } catch (error) {
    console.warn('API data extraction failed:', error);
  }
  
  return null;
}

/**
 * Extract price from HTML content
 */
function extractPriceFromHTML(htmlContent, symbol) {
  if (!htmlContent) return null;
  
  const text = htmlContent.toLowerCase();
  
  // Multiple price extraction patterns
  const patterns = [
    /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
    /"price"[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/g,
    /current[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
    /last[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/g
  ];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      
      if (price >= 1 && price <= 100000) {
        // Extract change percentage
        const changeMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
        const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;
        
        return {
          currentPrice: price,
          changePercent: changePercent,
          change: (price * changePercent) / 100,
          extractionMethod: 'html_scraping'
        };
      }
    }
  }
  
  return null;
}

/**
 * Search for stock insights and news
 */
async function searchStockInsights(symbol, companyName) {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return getFallbackInsights(symbol, companyName);
    }

    const query = `${companyName} ${symbol} stock news analysis latest`;
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?` + 
      new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: 10,
        gl: 'in',
        lr: 'lang_en'
      });

    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items) {
        return data.items.map(item => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          source: extractSourceFromUrl(item.link),
          publishedDate: extractDateFromItem(item)
        }));
      }
    }
    
    return getFallbackInsights(symbol, companyName);
    
  } catch (error) {
    console.error('Stock insights search failed:', error);
    return getFallbackInsights(symbol, companyName);
  }
}

/**
 * Consolidate search results from multiple sources
 */
function consolidateSearchResults(results, symbol, companyName) {
  const validResults = results
    .filter(result => result.status === 'fulfilled' && result.value)
    .flatMap(result => result.value)
    .filter(item => item && item.currentPrice > 0);

  if (validResults.length === 0) {
    return {
      symbol: symbol,
      companyName: companyName,
      currentPrice: 0,
      changePercent: 0,
      change: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      lastUpdated: new Date().toISOString(),
      sources: [],
      dataQuality: 'no_data',
      message: 'No stock data found from any source'
    };
  }

  // Use median price for consensus
  const prices = validResults.map(r => r.currentPrice).sort((a, b) => a - b);
  const changes = validResults.map(r => r.changePercent).filter(c => c !== undefined);
  
  const consolidatedPrice = prices[Math.floor(prices.length / 2)];
  const consolidatedChange = changes.length > 0 ? 
    changes.sort((a, b) => a - b)[Math.floor(changes.length / 2)] : 0;

  return {
    symbol: symbol,
    companyName: companyName,
    currentPrice: consolidatedPrice,
    changePercent: consolidatedChange,
    change: (consolidatedPrice * consolidatedChange) / 100,
    dayHigh: Math.max(...validResults.map(r => r.dayHigh || 0)),
    dayLow: Math.min(...validResults.map(r => r.dayLow || consolidatedPrice)),
    volume: Math.max(...validResults.map(r => r.volume || 0)),
    lastUpdated: new Date().toISOString(),
    sources: [...new Set(validResults.map(r => r.source))],
    dataQuality: validResults.length >= 3 ? 'high' : validResults.length >= 2 ? 'medium' : 'low',
    rawResults: validResults.length
  };
}

/**
 * Extract source name from URL
 */
function extractSourceFromUrl(url) {
  const sourceMap = {
    'moneycontrol.com': 'MoneyControl',
    'finance.yahoo.com': 'Yahoo Finance',
    'economictimes.indiatimes.com': 'Economic Times',
    'livemint.com': 'LiveMint',
    'business-standard.com': 'Business Standard',
    'nseindia.com': 'NSE India'
  };

  for (const [domain, name] of Object.entries(sourceMap)) {
    if (url.includes(domain)) {
      return name;
    }
  }
  
  return 'Financial News';
}

/**
 * Extract date from search item
 */
function extractDateFromItem(item) {
  // Try to extract date from metadata
  if (item.pagemap && item.pagemap.metatags) {
    const metaTags = item.pagemap.metatags[0];
    const dateFields = [
      'article:published_time',
      'article:modified_time',
      'publisheddate',
      'date'
    ];
    
    for (const field of dateFields) {
      if (metaTags[field]) {
        return metaTags[field];
      }
    }
  }
  
  return new Date().toISOString();
}

/**
 * Fallback insights when search fails
 */
function getFallbackInsights(symbol, companyName) {
  return [
    {
      title: `${companyName} Stock Analysis - Financial News`,
      url: `https://www.moneycontrol.com/india/stockpricequote/${symbol.toLowerCase()}`,
      snippet: 'Check MoneyControl for the latest stock price, news, and analysis.',
      source: 'MoneyControl (Fallback)',
      publishedDate: new Date().toISOString()
    },
    {
      title: `${symbol} Latest Updates - Economic Times`,
      url: `https://economictimes.indiatimes.com/markets/stocks/stock-quotes?ticker=${symbol}`,
      snippet: 'Visit Economic Times for comprehensive market coverage and expert insights.',
      source: 'Economic Times (Fallback)',
      publishedDate: new Date().toISOString()
    }
  ];
}