/**
 * Screener.in Data Extraction API
 * Serverless function to scrape financial metrics from Screener.in
 */

const https = require('https');
const cheerio = require('cheerio');

// Add CORS headers for frontend access
function addCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Extract financial metrics from Screener.in HTML
function extractFinancialMetrics(html, stockSymbol) {
  try {
    const $ = cheerio.load(html);
    const metrics = {};
    
    console.log(`🔍 Extracting financial metrics for ${stockSymbol}...`);
    
    // Extract company name
    const companyName = $('h1').first().text().trim();
    if (companyName) {
      metrics.companyName = companyName;
      console.log(`📍 Found company name: ${companyName}`);
    }
    
    // Skip current price extraction - use Groww API for real-time pricing
    // Screener.in may have delayed price data
    
    // Extract market cap
    const marketCapElement = $('span:contains("Market Cap"), td:contains("Market Cap"), li:contains("Market Cap")');
    marketCapElement.each((i, el) => {
      const text = $(el).parent().text() || $(el).next().text() || $(el).text();
      const marketCapMatch = text.match(/₹?\s*([0-9,]+(?:\.[0-9]+)?)\s*(Cr|Crores?|cr)/i);
      if (marketCapMatch && !metrics.marketCap) {
        metrics.marketCap = `₹${marketCapMatch[1]} ${marketCapMatch[2]}`;
      }
    });
    
    // Extract financial ratios from tables and key-value pairs
    const extractMetricFromText = (text, label) => {
      const patterns = [
        new RegExp(`${label}[\\s\\n]*:?[\\s\\n]*₹?\\s*([0-9,]+(?:\\.[0-9]+)?)`, 'i'),
        new RegExp(`${label}[\\s\\S]*?([0-9,]+(?:\\.[0-9]+)?)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
      }
      return null;
    };
    
    const extractPercentageFromText = (text, label) => {
      const pattern = new RegExp(`${label}[\\s\\S]*?([+-]?[0-9,]+(?:\\.[0-9]+)?)\\s*%`, 'i');
      const match = text.match(pattern);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    };
    
    // Get all text content for pattern matching
    const pageText = $.root().text();
    
    // Extract key financial metrics
    const metricsToExtract = {
      eps: ['eps', 'earnings per share'],
      pe: ['pe ratio', 'p/e ratio', 'price earnings'],
      roe: ['roe', 'return on equity'],
      roce: ['roce', 'return on capital employed'],
      bookValue: ['book value', 'bv per share'],
      dividendYield: ['dividend yield'],
      debtToEquity: ['debt to equity', 'd/e ratio'],
      currentRatio: ['current ratio'],
      pbv: ['p/bv', 'price to book'],
      evEbitda: ['ev/ebitda', 'ev ebitda'],
      faceValue: ['face value']
    };
    
    // Extract percentage-based metrics
    const percentageMetrics = {
      roe: ['roe', 'return on equity'],
      roce: ['roce', 'return on capital employed'],
      dividendYield: ['dividend yield'],
      revenueGrowth: ['revenue growth', 'sales growth', 'turnover growth'],
      profitGrowth: ['profit growth', 'net profit growth', 'pat growth']
    };
    
    // Extract specific metrics using the patterns we found
    
    // Extract EPS (Earnings Per Share)
    const epsMatches = pageText.match(/EPS[^\d]*([0-9,.]+)/gi);
    if (epsMatches && epsMatches.length > 0) {
      // Usually the latest EPS is what we want
      const epsValue = parseFloat(epsMatches[epsMatches.length - 1].match(/([0-9,.]+)/)[1].replace(/,/g, ''));
      if (!isNaN(epsValue)) {
        metrics.eps = epsValue;
        console.log(`📊 Found EPS: ${epsValue}`);
      }
    }
    
    // Extract P/E Ratio
    const peMatches = pageText.match(/P\/E[^\d]*([0-9,.]+)/gi);
    if (peMatches && peMatches.length > 0) {
      const peValue = parseFloat(peMatches[0].match(/([0-9,.]+)/)[1].replace(/,/g, ''));
      if (!isNaN(peValue)) {
        metrics.pe = peValue;
        console.log(`📊 Found P/E: ${peValue}`);
      }
    }
    
    // Extract ROE (Return on Equity)
    const roeMatches = pageText.match(/ROE[^\d]*([0-9,.]+)/gi);
    if (roeMatches && roeMatches.length > 0) {
      const roeValue = parseFloat(roeMatches[0].match(/([0-9,.]+)/)[1].replace(/,/g, ''));
      if (!isNaN(roeValue)) {
        metrics.roe = roeValue;
        console.log(`📊 Found ROE: ${roeValue}%`);
      }
    }
    
    // Extract growth metrics from tables
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      
      // Look for Revenue/Sales Growth
      $table.find('tr').each((rowIndex, row) => {
        const $row = $(row);
        const cells = $row.find('td').map((i, cell) => $(cell).text().trim()).get();
        
        if (cells.length >= 2 && cells[0] && (cells[0].toLowerCase().includes('sales growth') || cells[0].toLowerCase().includes('revenue growth'))) {
          // Get the latest growth rate (usually the last meaningful value)
          for (let i = cells.length - 1; i >= 1; i--) {
            const growthMatch = cells[i].match(/([+-]?[0-9,.]+)%/);
            if (growthMatch && !metrics.revenueGrowth) {
              metrics.revenueGrowth = parseFloat(growthMatch[1].replace(/,/g, ''));
              console.log(`📊 Found Revenue Growth: ${metrics.revenueGrowth}%`);
              break;
            }
          }
        }
        
        // Look for Profit Growth
        if (cells.length >= 2 && cells[0] && cells[0].toLowerCase().includes('profit growth')) {
          for (let i = cells.length - 1; i >= 1; i--) {
            const growthMatch = cells[i].match(/([+-]?[0-9,.]+)%/);
            if (growthMatch && !metrics.profitGrowth) {
              metrics.profitGrowth = parseFloat(growthMatch[1].replace(/,/g, ''));
              console.log(`📊 Found Profit Growth: ${metrics.profitGrowth}%`);
              break;
            }
          }
        }
      });
    });
    
    // Extract additional financial metrics from page text patterns
    const metricsPatterns = {
      roce: /ROCE[^\d]*([0-9,.]+)/gi,
      bookValue: /Book Value[^\d]*([0-9,.]+)/gi,
      dividendYield: /Dividend Yield[^\d]*([0-9,.]+)/gi,
      debtToEquity: /Debt.*Equity[^\d]*([0-9,.]+)/gi,
      currentRatio: /Current Ratio[^\d]*([0-9,.]+)/gi,
      pbv: /P\/BV[^\d]*([0-9,.]+)/gi,
      evEbitda: /EV.*EBITDA[^\d]*([0-9,.]+)/gi
    };
    
    Object.entries(metricsPatterns).forEach(([key, pattern]) => {
      if (!metrics[key]) {
        const matches = pageText.match(pattern);
        if (matches && matches.length > 0) {
          const value = parseFloat(matches[0].match(/([0-9,.]+)/)[1].replace(/,/g, ''));
          if (!isNaN(value)) {
            metrics[key] = value;
            console.log(`📊 Found ${key}: ${value}`);
          }
        }
      }
    });
    
    // Additional table parsing for any missed metrics
    $('table tr, .row, .metric-row').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td, th, .metric-label, .metric-value, span, div');
      
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().toLowerCase();
        const value = $(cells[1]).text().trim();
        
        // EPS (Earnings Per Share)
        if ((label.includes('eps') || label.includes('earnings per share')) && !metrics.eps) {
          const epsMatch = value.match(/₹?\s*([0-9,]+(?:\.[0-9]+)?)/);
          if (epsMatch) {
            metrics.eps = parseFloat(epsMatch[1].replace(/,/g, ''));
            console.log(`📊 Table found EPS: ${metrics.eps}`);
          }
        }
        
        // P/E Ratio
        if ((label.includes('pe') || label.includes('p/e') || label.includes('price earnings')) && !metrics.pe) {
          const peMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (peMatch) {
            metrics.pe = parseFloat(peMatch[1].replace(/,/g, ''));
          }
        }
        
        // ROE (Return on Equity)
        if ((label.includes('roe') || label.includes('return on equity')) && !metrics.roe) {
          const roeMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)\s*%?/);
          if (roeMatch) {
            metrics.roe = parseFloat(roeMatch[1].replace(/,/g, ''));
          }
        }
        
        // ROCE (Return on Capital Employed)
        if ((label.includes('roce') || label.includes('return on capital')) && !metrics.roce) {
          const roceMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)\s*%?/);
          if (roceMatch) {
            metrics.roce = parseFloat(roceMatch[1].replace(/,/g, ''));
          }
        }
        
        // Book Value
        if (label.includes('book value') && !metrics.bookValue) {
          const bookValueMatch = value.match(/₹?\s*([0-9,]+(?:\.[0-9]+)?)/);
          if (bookValueMatch) {
            metrics.bookValue = parseFloat(bookValueMatch[1].replace(/,/g, ''));
          }
        }
        
        // Dividend Yield
        if (label.includes('dividend yield') && !metrics.dividendYield) {
          const dividendMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)\s*%?/);
          if (dividendMatch) {
            metrics.dividendYield = parseFloat(dividendMatch[1].replace(/,/g, ''));
          }
        }
        
        // Debt to Equity
        if ((label.includes('debt to equity') || label.includes('d/e')) && !metrics.debtToEquity) {
          const debtMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (debtMatch) {
            metrics.debtToEquity = parseFloat(debtMatch[1].replace(/,/g, ''));
          }
        }
        
        // Current Ratio
        if (label.includes('current ratio') && !metrics.currentRatio) {
          const currentRatioMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (currentRatioMatch) {
            metrics.currentRatio = parseFloat(currentRatioMatch[1].replace(/,/g, ''));
          }
        }
        
        // P/BV (Price to Book Value)
        if ((label.includes('p/bv') || label.includes('price to book')) && !metrics.pbv) {
          const pbvMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (pbvMatch) {
            metrics.pbv = parseFloat(pbvMatch[1].replace(/,/g, ''));
          }
        }
        
        // EV/EBITDA
        if (label.includes('ev/ebitda') && !metrics.evEbitda) {
          const evMatch = value.match(/([0-9,]+(?:\.[0-9]+)?)/);
          if (evMatch) {
            metrics.evEbitda = parseFloat(evMatch[1].replace(/,/g, ''));
          }
        }
        
        // Face Value
        if (label.includes('face value') && !metrics.faceValue) {
          const faceValueMatch = value.match(/₹?\s*([0-9,]+(?:\.[0-9]+)?)/);
          if (faceValueMatch) {
            metrics.faceValue = parseFloat(faceValueMatch[1].replace(/,/g, ''));
          }
        }
      }
    });
    
    // Look for growth metrics in percentage format
    $('*:contains("%")').each((i, el) => {
      const text = $(el).text();
      const parent = $(el).parent().text() || $(el).prev().text();
      
      // Revenue Growth
      if ((parent.toLowerCase().includes('revenue') || parent.toLowerCase().includes('sales')) && 
          parent.toLowerCase().includes('growth') && !metrics.revenueGrowth) {
        const growthMatch = text.match(/([+-]?[0-9,]+(?:\.[0-9]+)?)\s*%/);
        if (growthMatch) {
          metrics.revenueGrowth = parseFloat(growthMatch[1].replace(/,/g, ''));
        }
      }
      
      // Profit Growth
      if ((parent.toLowerCase().includes('profit') || parent.toLowerCase().includes('net')) && 
          parent.toLowerCase().includes('growth') && !metrics.profitGrowth) {
        const growthMatch = text.match(/([+-]?[0-9,]+(?:\.[0-9]+)?)\s*%/);
        if (growthMatch) {
          metrics.profitGrowth = parseFloat(growthMatch[1].replace(/,/g, ''));
        }
      }
    });
    
    // Extract sector and industry from breadcrumbs or page content
    $('.breadcrumb a, .sector-link, .industry-link').each((i, el) => {
      const linkText = $(el).text().trim();
      if (linkText && linkText !== stockSymbol && linkText !== companyName) {
        if (!metrics.sector && linkText.length < 30) {
          metrics.sector = linkText;
        } else if (!metrics.industry && linkText.length < 50) {
          metrics.industry = linkText;
        }
      }
    });
    
    // Add metadata
    metrics.lastUpdated = new Date().toISOString();
    
    console.log(`✅ Extracted ${Object.keys(metrics).length} metrics for ${stockSymbol}:`, metrics);
    return metrics;
    
  } catch (error) {
    console.error(`❌ Error extracting metrics for ${stockSymbol}:`, error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

// Fetch HTML content from Screener.in
function fetchScreenerData(stockSymbol) {
  return new Promise((resolve, reject) => {
    const url = `https://www.screener.in/company/${stockSymbol}/consolidated/`;
    
    console.log(`🌐 Fetching data from: ${url}`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    };
    
    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          console.log(`✅ Successfully fetched data for ${stockSymbol} (${data.length} bytes)`);
          resolve(data);
        } else {
          console.error(`❌ HTTP Error ${response.statusCode} for ${stockSymbol}`);
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Network error for ${stockSymbol}:`, error);
      reject(error);
    });
  });
}

// Main serverless function handler
module.exports = async (req, res) => {
  addCORSHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    const { stockSymbol } = req.body;
    
    if (!stockSymbol) {
      return res.status(400).json({ 
        error: 'Missing stockSymbol parameter',
        example: { stockSymbol: 'VIMTALABS' }
      });
    }
    
    console.log(`📊 Starting Screener.in data extraction for: ${stockSymbol}`);
    
    // Fetch HTML content from Screener.in
    const html = await fetchScreenerData(stockSymbol);
    
    // Extract financial metrics from HTML
    const metrics = extractFinancialMetrics(html, stockSymbol);
    
    // Return extracted data
    res.status(200).json({
      success: true,
      stockSymbol: stockSymbol,
      url: `https://www.screener.in/company/${stockSymbol}/consolidated/`,
      metrics: metrics,
      extractedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to extract Screener.in data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};