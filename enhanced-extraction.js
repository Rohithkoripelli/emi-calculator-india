/**
 * Enhanced and accurate extraction implementation
 */

const https = require('https');
const cheerio = require('cheerio');

async function performAccurateWebScraping(url, stockSymbol, extractionPrompt) {
  try {
    console.log(`📊 Starting accurate web scraping for ${stockSymbol}...`);
    
    // Fetch HTML
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            console.log(`✅ Successfully fetched HTML for ${stockSymbol} (${data.length} characters)`);
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      }).on('error', reject);
    });
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    console.log(`🔍 Parsing HTML with accurate extraction methods...`);
    
    // Initialize result object
    const financialData = {
      companyName: stockSymbol,
      sector: 'Unknown',
      industry: 'Unknown',
      extractionMethod: 'accurate_server_scraping',
      lastUpdated: new Date().toISOString()
    };
    
    // Extract company name
    const pageTitle = $('title').text() || $('h1').first().text() || '';
    if (pageTitle) {
      const cleanTitle = pageTitle
        .replace(/Share Price.*|Stock Price.*|Screener.*|NSE.*|BSE.*/i, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();
      if (cleanTitle && cleanTitle !== stockSymbol) {
        financialData.companyName = cleanTitle;
      }
    }
    
    console.log(`📊 Extracting comprehensive financial data for ${stockSymbol}...`);
    
    // COMPREHENSIVE PATTERN-BASED EXTRACTION
    const pageText = $.text();
    
    // Enhanced Basic Metrics Extraction with more precise patterns
    const patterns = {
      marketCap: /Market Cap[^\d]*₹\s*([\d,]+(?:\.\d+)?)\s*(Cr|Crore)/i,
      currentPrice: /Current Price[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
      pe: /P\/E[^\d]*([\d,]+(?:\.\d+)?)/i,
      roe: /ROE[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      roce: /ROCE[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      bookValue: /Book Value[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
      dividendYield: /Dividend Yield[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      faceValue: /Face Value[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = pageText.match(pattern);
      if (match) {
        if (key === 'marketCap') {
          financialData[key] = `₹${match[1]} ${match[2]}`;
        } else {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(value)) {
            financialData[key] = value;
          }
        }
      }
    }
    
    // ACCURATE EPS EXTRACTION
    console.log(`📈 Extracting EPS with high accuracy...`);
    
    // Look for EPS specifically in the right context (TTM EPS)
    const epsPatterns = [
      /EPS\s*(?:\(TTM\))?\s*₹?\s*([\d,]+(?:\.\d+)?)/i,
      /Earnings Per Share.*?₹?\s*([\d,]+(?:\.\d+)?)/i,
      /EPS.*?₹?\s*([\d,]+(?:\.\d+)?)/i
    ];
    
    for (const pattern of epsPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const epsValue = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(epsValue) && epsValue > 0 && epsValue < 1000) { // Reasonable EPS range
          financialData.eps = epsValue;
          console.log(`✅ Found accurate EPS: ${epsValue}`);
          break;
        }
      }
    }
    
    // QUARTERLY RESULTS EXTRACTION (with JavaScript limitation handling)
    console.log(`📈 Extracting quarterly results (Note: may be limited due to JS loading)...`);
    
    // Since quarterly data is JavaScript-loaded, we'll note this limitation
    const quarterlyResults = [];
    
    // Try to find any quarterly data in the static HTML
    const currentYear = new Date().getFullYear();
    const quarters = ['Mar', 'Jun', 'Sep', 'Dec'];
    
    const foundQuarterData = false; // Most likely won't find it in static HTML
    
    if (!foundQuarterData) {
      console.log(`⚠️ Quarterly results require JavaScript loading - not available in static HTML scraping`);
      financialData.quarterlyDataNote = 'Quarterly results require JavaScript loading and are not available via static HTML scraping';
    }
    
    // ACCURATE SHAREHOLDING PATTERN EXTRACTION
    console.log(`👥 Extracting shareholding pattern with high accuracy...`);
    
    const shareholdingPattern = [];
    
    // Based on our debug, look specifically in tables 9 and 10 for shareholding data
    $('table').each((tableIndex, table) => {
      const tableText = $(table).text().toLowerCase();
      
      // Look for tables that contain shareholding data (promoter, fii, dii, public)
      if (tableText.includes('promoter') && tableText.includes('fii') && tableText.includes('dii')) {
        console.log(`📊 Found shareholding table ${tableIndex}`);
        
        $(table).find('tr').each((rowIndex, row) => {
          const rowText = $(row).text().toLowerCase();
          const cells = $(row).find('td, th');
          
          // Extract data for each category, taking the LAST cell (most recent data)
          if (rowText.includes('promoter')) {
            const lastCell = cells.last().text().trim();
            const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
            if (percentMatch) {
              const percentage = parseFloat(percentMatch[1]);
              if (!isNaN(percentage)) {
                shareholdingPattern.push({ category: 'Promoters', percentage });
                console.log(`✅ Promoters: ${percentage}%`);
              }
            }
          }
          
          if (rowText.includes('fii')) {
            const lastCell = cells.last().text().trim();
            const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
            if (percentMatch) {
              const percentage = parseFloat(percentMatch[1]);
              if (!isNaN(percentage)) {
                shareholdingPattern.push({ category: 'FII', percentage });
                console.log(`✅ FII: ${percentage}%`);
              }
            }
          }
          
          if (rowText.includes('dii')) {
            const lastCell = cells.last().text().trim();
            const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
            if (percentMatch) {
              const percentage = parseFloat(percentMatch[1]);
              if (!isNaN(percentage)) {
                shareholdingPattern.push({ category: 'DII', percentage });
                console.log(`✅ DII: ${percentage}%`);
              }
            }
          }
          
          if (rowText.includes('public')) {
            const lastCell = cells.last().text().trim();
            const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
            if (percentMatch) {
              const percentage = parseFloat(percentMatch[1]);
              if (!isNaN(percentage)) {
                shareholdingPattern.push({ category: 'Public', percentage });
                console.log(`✅ Public: ${percentage}%`);
              }
            }
          }
        });
      }
    });
    
    if (shareholdingPattern.length > 0) {
      financialData.shareholdingPattern = shareholdingPattern;
      console.log(`✅ Extracted ${shareholdingPattern.length} shareholding categories accurately`);
    }
    
    console.log(`🎯 Accurate extraction complete for ${stockSymbol}`);
    return financialData;
    
  } catch (error) {
    console.error(`❌ Accurate web scraping failed for ${stockSymbol}:`, error);
    throw error;
  }
}

// Test the enhanced extraction with SUZLON
async function testAccurateExtraction() {
  console.log('🧪 Testing ACCURATE extraction with SUZLON...\n');
  
  try {
    const url = 'https://www.screener.in/company/SUZLON/consolidated/';
    const result = await performAccurateWebScraping(url, 'SUZLON', 'Extract accurate financial data');
    
    console.log('\n📊 ACCURATE EXTRACTION RESULTS:');
    console.log('===============================================');
    console.log(JSON.stringify(result, null, 2));
    console.log('===============================================');
    
    // Compare with expected values
    console.log('\n🎯 ACCURACY CHECK:');
    console.log('=====================================');
    const expected = {
      marketCap: "₹76,723 Cr",
      currentPrice: 56.4,
      eps: 0.49,  // This should be much more accurate now
      pe: 36.6,
      roe: 41.3,
      roce: 32.4,
      bookValue: 4.51,
      faceValue: 2,
      shareholdingPattern: [
        {"category": "Promoters", "percentage": 11.75},
        {"category": "FII", "percentage": 23.02},
        {"category": "DII", "percentage": 10.17},
        {"category": "Public", "percentage": 55.07}
      ]
    };
    
    // Check accuracy
    console.log(`📊 Market Cap: ${result.marketCap} (Expected: ${expected.marketCap}) ${result.marketCap === expected.marketCap ? '✅' : '❌'}`);
    console.log(`💵 Current Price: ${result.currentPrice} (Expected: ${expected.currentPrice}) ${result.currentPrice === expected.currentPrice ? '✅' : '❌'}`);
    console.log(`📈 EPS: ${result.eps} (Expected: ${expected.eps}) ${Math.abs(result.eps - expected.eps) < 0.1 ? '✅' : '❌'}`);
    console.log(`📊 P/E: ${result.pe} (Expected: ${expected.pe}) ${result.pe === expected.pe ? '✅' : '❌'}`);
    console.log(`💪 ROE: ${result.roe} (Expected: ${expected.roe}) ${result.roe === expected.roe ? '✅' : '❌'}`);
    
    // Check shareholding accuracy
    if (result.shareholdingPattern) {
      console.log(`\n👥 Shareholding Pattern Accuracy:`);
      result.shareholdingPattern.forEach(item => {
        const expectedItem = expected.shareholdingPattern.find(e => e.category === item.category);
        if (expectedItem) {
          const isAccurate = Math.abs(item.percentage - expectedItem.percentage) < 0.1;
          console.log(`   ${item.category}: ${item.percentage}% (Expected: ${expectedItem.percentage}%) ${isAccurate ? '✅' : '❌'}`);
        }
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Accurate extraction test failed:', error);
    return null;
  }
}

// Run the test
testAccurateExtraction();