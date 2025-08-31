/**
 * Test SUZLON data extraction directly using our extraction function
 */

const https = require('https');
const cheerio = require('cheerio');

// Copy the exact extraction function from our API
async function performRealWebScraping(url, stockSymbol, extractionPrompt) {
  try {
    console.log(`📊 Starting real web scraping for ${stockSymbol}...`);
    
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
            console.log(`✅ HTML fetched for ${stockSymbol} (${data.length} chars)`);
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      }).on('error', reject);
    });
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    
    // Initialize result
    const financialData = {
      companyName: stockSymbol,
      extractionMethod: 'direct_test_scraping',
      lastUpdated: new Date().toISOString()
    };
    
    // Extract company name
    const pageTitle = $('title').text() || '';
    if (pageTitle) {
      const cleanTitle = pageTitle
        .replace(/Share Price.*|Stock Price.*|Screener.*|NSE.*|BSE.*/i, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();
      if (cleanTitle && cleanTitle !== stockSymbol) {
        financialData.companyName = cleanTitle;
      }
    }
    
    console.log(`📊 Extracting financial data for ${stockSymbol}...`);
    
    const pageText = $.text();
    
    // BASIC METRICS - High accuracy patterns
    const basicPatterns = {
      marketCap: /Market Cap[^\d]*₹\s*([\d,]+(?:\.\d+)?)\s*(Cr|Crore)/i,
      currentPrice: /Current Price[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
      pe: /P\/E[^\d]*([\d,]+(?:\.\d+)?)/i,
      roe: /ROE[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      roce: /ROCE[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      bookValue: /Book Value[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
      dividendYield: /Dividend Yield[^\d]*([\d,]+(?:\.\d+)?)%?/i,
      faceValue: /Face Value[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i
    };
    
    for (const [key, pattern] of Object.entries(basicPatterns)) {
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
    
    // IMPROVED EPS EXTRACTION - Multiple methods for accuracy
    console.log(`📈 Extracting EPS with multiple methods...`);
    
    let epsValue = null;
    
    // Method 1: Look for TTM EPS specifically
    const ttmEpsMatch = pageText.match(/EPS\s*\(TTM\)[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i);
    if (ttmEpsMatch) {
      const eps = parseFloat(ttmEpsMatch[1].replace(/,/g, ''));
      if (!isNaN(eps) && eps >= 0 && eps < 100) {
        epsValue = eps;
        console.log(`✅ Found TTM EPS: ${eps}`);
      }
    }
    
    // Method 2: If TTM not found, look for recent quarterly EPS
    if (!epsValue) {
      const epsPatterns = [
        /EPS in Rs[^\d]*([\d,]+(?:\.\d+)?)/i,
        /Earnings Per Share[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i
      ];
      
      for (const pattern of epsPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          const eps = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(eps) && eps >= -50 && eps < 100) {
            epsValue = eps;
            console.log(`✅ Found EPS via pattern: ${eps}`);
            break;
          }
        }
      }
    }
    
    if (epsValue !== null) {
      financialData.eps = epsValue;
    }
    
    // ACCURATE SHAREHOLDING PATTERN EXTRACTION
    console.log(`👥 Extracting shareholding pattern accurately...`);
    
    const shareholdingPattern = [];
    const seenCategories = new Set();
    
    // Look for tables with shareholding data
    $('table').each((tableIndex, table) => {
      const tableText = $(table).text().toLowerCase();
      
      // Identify shareholding tables
      if (tableText.includes('promoter') && tableText.includes('fii') && tableText.includes('dii')) {
        
        $(table).find('tr').each((rowIndex, row) => {
          const rowText = $(row).text().toLowerCase();
          const cells = $(row).find('td, th');
          
          // Define categories to look for
          const categories = [
            { name: 'promoter', display: 'Promoters' },
            { name: 'fii', display: 'FII' },
            { name: 'dii', display: 'DII' },
            { name: 'public', display: 'Public' }
          ];
          
          categories.forEach(category => {
            if (rowText.includes(category.name) && !seenCategories.has(category.display)) {
              const lastCell = cells.last().text().trim();
              const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
              
              if (percentMatch) {
                const percentage = parseFloat(percentMatch[1]);
                if (!isNaN(percentage) && percentage > 0 && percentage <= 100) {
                  shareholdingPattern.push({
                    category: category.display,
                    percentage: percentage
                  });
                  seenCategories.add(category.display);
                  console.log(`✅ ${category.display}: ${percentage}%`);
                }
              }
            }
          });
        });
      }
    });
    
    if (shareholdingPattern.length > 0) {
      financialData.shareholdingPattern = shareholdingPattern;
      console.log(`✅ Extracted ${shareholdingPattern.length} shareholding categories (no duplicates)`);
    }
    
    console.log(`🎯 Direct extraction complete for ${stockSymbol}`);
    return financialData;
    
  } catch (error) {
    console.error(`❌ Direct extraction failed for ${stockSymbol}:`, error);
    throw error;
  }
}

async function testSuzlonDirect() {
  try {
    console.log('🧪 Testing SUZLON data extraction directly...\n');
    
    const result = await performRealWebScraping('https://www.screener.in/company/SUZLON/consolidated/', 'SUZLON', 'Test extraction');
    
    console.log('\n📊 SUZLON DIRECT EXTRACTION RESULTS:');
    console.log('===============================================');
    console.log(JSON.stringify(result, null, 2));
    console.log('===============================================');
    
    console.log('\n🎯 SUZLON Financial Metrics Summary:');
    console.log('=====================================');
    console.log(`Company Name: ${result.companyName || 'N/A'}`);
    console.log(`Market Cap: ${result.marketCap || 'N/A'}`);
    console.log(`Current Price: ₹${result.currentPrice || 'N/A'}`);
    console.log(`EPS: ₹${result.eps || 'N/A'}`);
    console.log(`P/E Ratio: ${result.pe || 'N/A'}`);
    console.log(`ROE: ${result.roe || 'N/A'}%`);
    console.log(`ROCE: ${result.roce || 'N/A'}%`);
    console.log(`Book Value: ₹${result.bookValue || 'N/A'}`);
    console.log(`Dividend Yield: ${result.dividendYield || 'N/A'}%`);
    console.log(`Face Value: ₹${result.faceValue || 'N/A'}`);
    
    if (result.shareholdingPattern) {
      console.log('\n👥 Shareholding Pattern:');
      result.shareholdingPattern.forEach(holding => {
        console.log(`  ${holding.category}: ${holding.percentage}%`);
      });
    }
    
    // Validate accuracy
    console.log('\n🎯 ACCURACY VALIDATION:');
    console.log('=====================================');
    
    const expectedValues = {
      marketCap: "₹76,723 Cr",
      currentPrice: 56.4,
      pe: 36.6,
      roe: 41.3,
      roce: 32.4,
      bookValue: 4.51,
      faceValue: 2,
      shareholding: {
        'Promoters': 11.75,
        'FII': 23.02,
        'DII': 10.17,
        'Public': 55.07
      }
    };
    
    const checks = [
      { key: 'marketCap', actual: result.marketCap, expected: expectedValues.marketCap },
      { key: 'currentPrice', actual: result.currentPrice, expected: expectedValues.currentPrice },
      { key: 'pe', actual: result.pe, expected: expectedValues.pe },
      { key: 'roe', actual: result.roe, expected: expectedValues.roe },
      { key: 'roce', actual: result.roce, expected: expectedValues.roce },
      { key: 'bookValue', actual: result.bookValue, expected: expectedValues.bookValue },
      { key: 'faceValue', actual: result.faceValue, expected: expectedValues.faceValue }
    ];
    
    let accurateCount = 0;
    checks.forEach(check => {
      if (check.actual !== undefined) {
        let isMatch = false;
        if (typeof check.expected === 'string') {
          isMatch = check.actual === check.expected;
        } else {
          isMatch = Math.abs(parseFloat(check.actual) - parseFloat(check.expected)) < 0.01;
        }
        console.log(`${check.key}: ${check.actual} (Expected: ${check.expected}) ${isMatch ? '✅' : '❌'}`);
        if (isMatch) accurateCount++;
      } else {
        console.log(`${check.key}: NOT EXTRACTED ❌ (Expected: ${check.expected})`);
      }
    });
    
    // Check shareholding accuracy
    let shareholdingAccurate = 0;
    if (result.shareholdingPattern) {
      console.log('\nShareholding Pattern Accuracy:');
      result.shareholdingPattern.forEach(actual => {
        const expected = expectedValues.shareholding[actual.category];
        if (expected) {
          const isAccurate = Math.abs(actual.percentage - expected) < 0.01;
          console.log(`  ${actual.category}: ${actual.percentage}% (Expected: ${expected}%) ${isAccurate ? '✅' : '❌'}`);
          if (isAccurate) shareholdingAccurate++;
        }
      });
    } else {
      console.log('Shareholding Pattern: NOT EXTRACTED ❌');
    }
    
    console.log(`\n🏆 OVERALL ACCURACY: ${accurateCount}/7 basic metrics, ${shareholdingAccurate}/4 shareholding categories`);
    
    if (accurateCount >= 6 && shareholdingAccurate >= 4) {
      console.log('🚀 EXCELLENT: Data extraction is highly accurate for OpenAI analysis!');
    } else if (accurateCount >= 4) {
      console.log('⚠️ GOOD: Most data extracted correctly, minor improvements needed');
    } else {
      console.log('❌ POOR: Significant extraction issues need to be resolved');
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
  }
}

// Run the test
testSuzlonDirect();