/**
 * Test SUZLON to validate our enhanced implementation accuracy
 */

const https = require('https');
const cheerio = require('cheerio');

// Use our exact API implementation
async function performRealWebScraping(url, stockSymbol, extractionPrompt) {
  try {
    console.log(`📊 Starting real web scraping for ${stockSymbol}...`);
    
    // Fetch HTML with realistic browser headers
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
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
            console.error(`❌ HTTP ${response.statusCode} for ${stockSymbol}`);
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      }).on('error', (error) => {
        console.error(`❌ Request failed for ${stockSymbol}:`, error);
        reject(error);
      });
    });
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    console.log(`🔍 Parsing HTML for comprehensive data extraction...`);
    
    // Initialize result object
    const financialData = {
      companyName: stockSymbol,
      sector: 'Unknown',
      industry: 'Unknown',
      extractionMethod: 'real_server_scraping',
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
    
    // Enhanced Basic Metrics Extraction
    const patterns = {
      marketCap: /Market Cap[^\d]*₹\s*([\d,]+(?:\.\d+)?)\s*(Cr|Crore)/i,
      currentPrice: /Current Price[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
      eps: /EPS[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i,
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
    
    // QUARTERLY RESULTS EXTRACTION  
    console.log(`📈 Extracting quarterly results for ${stockSymbol}...`);
    
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const quarters = ['Mar', 'Jun', 'Sep', 'Dec'];
    const quarterlyResults = [];
    
    // Build quarter patterns for last 8 quarters
    const quarterPatterns = [];
    [currentYear, lastYear].forEach(year => {
      quarters.forEach(quarter => {
        quarterPatterns.push(`${quarter} ${year}`);
      });
    });
    
    // Look for the most recent 4 quarters that appear in the text
    const foundQuarters = [];
    quarterPatterns.reverse().forEach(quarterPattern => {
      if (pageText.includes(quarterPattern) && foundQuarters.length < 4) {
        foundQuarters.push(quarterPattern);
      }
    });
    
    // For each found quarter, try to extract revenue, profit, and EPS from nearby text
    foundQuarters.forEach((quarter, index) => {
      // Look for numbers near this quarter mention
      const quarterIndex = pageText.indexOf(quarter);
      if (quarterIndex !== -1) {
        // Get text around the quarter (±500 characters)
        const contextText = pageText.substring(
          Math.max(0, quarterIndex - 500),
          Math.min(pageText.length, quarterIndex + 500)
        );
        
        // Extract numbers that could be revenue/profit/EPS
        const numbers = contextText.match(/[\d,]+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 3) {
          const numericValues = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n));
          
          // Use heuristics to assign revenue (largest), profit (medium), EPS (smallest usually)
          numericValues.sort((a, b) => b - a);
          
          quarterlyResults.push({
            quarter: quarter,
            revenue: numericValues[0] || 0,
            profit: numericValues[1] || 0,
            eps: numericValues[numericValues.length - 1] || 0
          });
        }
      }
    });
    
    if (quarterlyResults.length > 0) {
      financialData.quarterlyResults = quarterlyResults;
      console.log(`✅ Extracted ${quarterlyResults.length} quarters of data`);
    }
    
    // SHAREHOLDING PATTERN EXTRACTION
    console.log(`👥 Extracting shareholding pattern for ${stockSymbol}...`);
    
    const shareholdingCategories = ['Promoter', 'FII', 'DII', 'Public', 'Government'];
    const shareholdingPattern = [];
    
    shareholdingCategories.forEach(category => {
      // Look for patterns like "Promoters 45.23%" or similar
      const categoryPattern = new RegExp(`${category}[^\\d]*(\\d+(?:\\.\\d+)?)%?`, 'i');
      const match = pageText.match(categoryPattern);
      
      if (match) {
        const percentage = parseFloat(match[1]);
        if (!isNaN(percentage) && percentage <= 100) {
          shareholdingPattern.push({
            category: category,
            percentage: percentage
          });
        }
      }
    });
    
    if (shareholdingPattern.length > 0) {
      financialData.shareholdingPattern = shareholdingPattern;
      console.log(`✅ Extracted ${shareholdingPattern.length} shareholding categories`);
    }
    
    console.log(`🎯 Extraction complete for ${stockSymbol}. Found ${Object.keys(financialData).length} data points`);
    return financialData;
    
  } catch (error) {
    console.error(`❌ Real web scraping failed for ${stockSymbol}:`, error);
    throw error;
  }
}

// Test SUZLON and compare with actual Screener.in data
async function testSuzlon() {
  console.log('🧪 Testing SUZLON Data Accuracy...\n');
  
  try {
    const url = 'https://www.screener.in/company/SUZLON/consolidated/';
    const result = await performRealWebScraping(url, 'SUZLON', 'Extract all financial data');
    
    console.log('\n📊 OUR EXTRACTED DATA FOR SUZLON:');
    console.log('================================================');
    console.log(JSON.stringify(result, null, 2));
    console.log('================================================');
    
    // Format the results nicely
    console.log('\n🎯 SUZLON FINANCIAL DATA SUMMARY:');
    console.log('=====================================');
    console.log(`🏢 Company: ${result.companyName}`);
    console.log(`💰 Market Cap: ${result.marketCap || 'Not found'}`);
    console.log(`💵 Current Price: ₹${result.currentPrice || 'Not found'}`);
    console.log(`📈 EPS: ₹${result.eps || 'Not found'}`);
    console.log(`📊 P/E Ratio: ${result.pe || 'Not found'}`);
    console.log(`💪 ROE: ${result.roe || 'Not found'}%`);
    console.log(`⚡ ROCE: ${result.roce || 'Not found'}%`);
    console.log(`📖 Book Value: ₹${result.bookValue || 'Not found'}`);
    console.log(`💎 Dividend Yield: ${result.dividendYield || 'Not found'}%`);
    console.log(`🎫 Face Value: ₹${result.faceValue || 'Not found'}`);
    
    // Quarterly Results
    if (result.quarterlyResults && result.quarterlyResults.length > 0) {
      console.log('\n📈 QUARTERLY RESULTS:');
      console.log('| Quarter | Revenue (₹ Cr) | Profit (₹ Cr) | EPS (₹) |');
      console.log('|---------|---------------|---------------|---------|');
      result.quarterlyResults.forEach(q => {
        console.log(`| ${q.quarter} | ${q.revenue.toFixed(2)} | ${q.profit.toFixed(2)} | ${q.eps.toFixed(2)} |`);
      });
    }
    
    // Shareholding Pattern
    if (result.shareholdingPattern && result.shareholdingPattern.length > 0) {
      console.log('\n👥 SHAREHOLDING PATTERN:');
      console.log('| Category | Percentage |');
      console.log('|----------|------------|');
      result.shareholdingPattern.forEach(s => {
        console.log(`| ${s.category} | ${s.percentage.toFixed(2)}% |`);
      });
    }
    
    console.log('\n✅ VALIDATION CHECK:');
    console.log(`📊 Total Data Points: ${Object.keys(result).length}`);
    console.log(`📈 Quarterly Data: ${result.quarterlyResults?.length || 0} quarters`);
    console.log(`👥 Shareholding Data: ${result.shareholdingPattern?.length || 0} categories`);
    
    console.log('\n🔍 ACCURACY VALIDATION:');
    console.log('Please manually verify this data against:');
    console.log('https://www.screener.in/company/SUZLON/consolidated/');
    console.log('\nIf this data matches what you see on Screener.in, the implementation is ready!');
    
    return result;
    
  } catch (error) {
    console.error('❌ SUZLON test failed:', error);
    return null;
  }
}

// Run the test
testSuzlon();