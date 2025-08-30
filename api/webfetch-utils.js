/**
 * Server-side WebFetch utility that simulates calling a web scraping service
 * Since Node.js server environments can't directly access Claude tools,
 * this provides a bridge to call external scraping services or APIs
 */

/**
 * WebFetch function that calls external web scraping services
 * This is the server-side implementation for financial data extraction
 */
async function WebFetch(url, prompt) {
  try {
    console.log(`🌐 Server-side WebFetch called for URL: ${url}`);
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    
    // Extract stock symbol from URL
    const stockMatch = url.match(/company\/([^\/]+)/);
    const stockSymbol = stockMatch ? stockMatch[1] : 'UNKNOWN';
    
    console.log(`📊 Extracting data for stock: ${stockSymbol}`);
    
    // Use fetch to get the HTML content first
    const https = require('https');
    const cheerio = require('cheerio');
    
    // Fetch HTML from Screener.in
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        
        // Handle gzipped content
        let stream = response;
        if (response.headers['content-encoding'] === 'gzip') {
          const zlib = require('zlib');
          stream = response.pipe(zlib.createGunzip());
        }
        
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => {
          if (response.statusCode === 200) {
            console.log(`✅ Successfully fetched HTML for ${stockSymbol} (${data.length} characters)`);
            resolve(data);
          } else {
            console.error(`❌ HTTP ${response.statusCode} for ${stockSymbol}`);
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      }).on('error', (error) => {
        console.error(`❌ Request failed for ${stockSymbol}:`, error);
        reject(error);
      });
    });
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(html);
    console.log(`🔍 Parsing HTML content for ${stockSymbol}...`);
    
    // Extract comprehensive financial data
    const financialData = {
      companyName: stockSymbol,
      sector: 'Unknown',
      industry: 'Unknown',
      extractionMethod: 'server_cheerio_parsing',
      lastUpdated: new Date().toISOString()
    };
    
    // Get company name from title or h1
    const title = $('title').text() || $('h1').first().text();
    if (title) {
      const cleanTitle = title.replace(/Share Price.*|Stock Price.*|Screener.*/i, '').trim();
      if (cleanTitle) {
        financialData.companyName = cleanTitle;
      }
    }
    
    // Extract basic metrics from the page text
    const pageText = $.text().toLowerCase();
    
    // Market Cap
    const marketCapPattern = /market cap[^\d]*₹?\s*([\d,]+(?:\.\d+)?)\s*(cr|crore)/i;
    const marketCapMatch = html.match(marketCapPattern);
    if (marketCapMatch) {
      financialData.marketCap = `₹${marketCapMatch[1]} ${marketCapMatch[2]}`;
    }
    
    // Current Price 
    const pricePattern = /current price[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i;
    const priceMatch = html.match(pricePattern);
    if (priceMatch) {
      financialData.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // EPS
    const epsPattern = /eps[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i;
    const epsMatch = html.match(epsPattern);
    if (epsMatch) {
      financialData.eps = parseFloat(epsMatch[1].replace(/,/g, ''));
    }
    
    // P/E Ratio
    const pePattern = /p\/e[^\d]*([\d,]+(?:\.\d+)?)/i;
    const peMatch = html.match(pePattern);
    if (peMatch) {
      financialData.pe = parseFloat(peMatch[1].replace(/,/g, ''));
    }
    
    // ROE
    const roePattern = /roe[^\d]*([\d,]+(?:\.\d+)?)%?/i;
    const roeMatch = html.match(roePattern);
    if (roeMatch) {
      financialData.roe = parseFloat(roeMatch[1].replace(/,/g, ''));
    }
    
    // ROCE
    const rocePattern = /roce[^\d]*([\d,]+(?:\.\d+)?)%?/i;
    const roceMatch = html.match(rocePattern);
    if (roceMatch) {
      financialData.roce = parseFloat(roceMatch[1].replace(/,/g, ''));
    }
    
    // Book Value
    const bookValuePattern = /book value[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i;
    const bookValueMatch = html.match(bookValuePattern);
    if (bookValueMatch) {
      financialData.bookValue = parseFloat(bookValueMatch[1].replace(/,/g, ''));
    }
    
    // Dividend Yield
    const dividendPattern = /dividend yield[^\d]*([\d,]+(?:\.\d+)?)%?/i;
    const dividendMatch = html.match(dividendPattern);
    if (dividendMatch) {
      financialData.dividendYield = parseFloat(dividendMatch[1].replace(/,/g, ''));
    }
    
    console.log(`📊 Extracted metrics for ${stockSymbol}:`, Object.keys(financialData));
    
    // Return as JSON string to match expected format
    return JSON.stringify(financialData, null, 2);
    
  } catch (error) {
    console.error(`❌ Server-side WebFetch error for ${url}:`, error);
    throw error;
  }
}

module.exports = {
  WebFetch
};