/**
 * Test script to verify our new dynamic web scraping implementation
 * This simulates what happens when your app calls the API
 */

const https = require('https');
const cheerio = require('cheerio');

// Helper function to extract numerical data from table row
function extractRowData(row) {
  const data = [];
  if (!row || row.length === 0) return data;
  
  row.find('td, th').each((index, cell) => {
    const cellText = cheerio.load(cell).text().trim();
    // Extract numbers from cell text
    const numMatch = cellText.match(/([\d,]+(?:\.\d+)?)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1].replace(/,/g, ''));
      if (!isNaN(num)) {
        data.push(num);
      }
    }
  });
  
  return data;
}

// Import our web scraping function
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
      }).on('error', reject);
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
    
    // BASIC METRICS EXTRACTION
    console.log(`📊 Extracting basic metrics for ${stockSymbol}...`);
    const pageText = $.text();
    
    // Market Cap
    const marketCapMatch = pageText.match(/Market Cap[^\d]*₹\s*([\d,]+(?:\.\d+)?)\s*(Cr|Crore)/i);
    if (marketCapMatch) {
      financialData.marketCap = `₹${marketCapMatch[1]} ${marketCapMatch[2]}`;
    }
    
    // Current Price
    const priceMatch = pageText.match(/Current Price[^\d]*₹\s*([\d,]+(?:\.\d+)?)/i);
    if (priceMatch) {
      financialData.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // EPS
    const epsMatch = pageText.match(/EPS[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i);
    if (epsMatch) {
      financialData.eps = parseFloat(epsMatch[1].replace(/,/g, ''));
    }
    
    // P/E
    const peMatch = pageText.match(/P\/E[^\d]*([\d,]+(?:\.\d+)?)/i);
    if (peMatch) {
      financialData.pe = parseFloat(peMatch[1].replace(/,/g, ''));
    }
    
    // ROE
    const roeMatch = pageText.match(/ROE[^\d]*([\d,]+(?:\.\d+)?)%?/i);
    if (roeMatch) {
      financialData.roe = parseFloat(roeMatch[1].replace(/,/g, ''));
    }
    
    // QUARTERLY RESULTS EXTRACTION
    console.log(`📈 Extracting quarterly results for ${stockSymbol}...`);
    
    // Debug: Search for quarterly data in full page text
    console.log(`🔍 Searching for quarterly data in page text...`);
    const fullPageText = pageText.toLowerCase();
    
    const hasQuarterly = fullPageText.includes('quarterly');
    const hasResults = fullPageText.includes('results');
    const hasSales = fullPageText.includes('sales');
    const hasProfit = fullPageText.includes('profit');
    const hasMarQuarter = fullPageText.includes('mar 20') || fullPageText.includes('jun 20') || fullPageText.includes('sep 20') || fullPageText.includes('dec 20');
    
    console.log(`📊 Page contains: quarterly=${hasQuarterly}, results=${hasResults}, sales=${hasSales}, profit=${hasProfit}, quarters=${hasMarQuarter}`);
    
    // Look for quarterly data patterns in the full text
    const quarterPatterns = [
      /mar\s+202[4-5]/gi,
      /jun\s+202[4-5]/gi,
      /sep\s+202[4-5]/gi,
      /dec\s+202[4-5]/gi
    ];
    
    const foundQuarters = [];
    quarterPatterns.forEach(pattern => {
      const matches = pageText.match(pattern);
      if (matches) {
        foundQuarters.push(...matches);
      }
    });
    
    console.log(`📅 Found quarter mentions:`, foundQuarters.slice(0, 10));
    
    // Try to extract quarterly data from structured divs/sections
    const quarterlyResults = [];
    
    // Search for data in div structures or JSON-like patterns  
    const jsonPattern = /\{[^{}]*(?:revenue|sales|profit)[^{}]*\}/gi;
    const jsonMatches = pageText.match(jsonPattern);
    if (jsonMatches) {
      console.log(`📊 Found JSON-like patterns:`, jsonMatches.slice(0, 3));
    }
    
    // Try alternative table search with broader criteria
    let foundQuarterlyTable = false;
    
    $('table, div[class*="table"], section').each((i, element) => {
      const elementText = $(element).text().toLowerCase();
      const elementHtml = $(element).html();
      
      // Look for any element containing financial quarter data  
      if ((elementText.includes('mar 20') && elementText.includes('jun 20')) ||
          (elementText.includes('sales') && elementText.includes('profit') && elementText.includes('202'))) {
        console.log(`📊 Found quarterly results element for ${stockSymbol}`);
        foundQuarterlyTable = true;
        
        // Debug: log the table structure
        console.log(`🔍 Table ${i} contains quarterly data`);
        
        // Get all table rows
        const rows = $(table).find('tr');
        const headers = [];
        let salesRow = null;
        let profitRow = null;
        let epsRow = null;
        
        // Find headers and data rows
        rows.each((rowIndex, row) => {
          const rowText = $(row).text().toLowerCase().trim();
          const cells = $(row).find('th, td');
          
          // Check if this is a header row (contains quarters like "Mar 2024")
          if (rowIndex === 0 || cells.first().text().toLowerCase().includes('particular')) {
            cells.each((cellIndex, cell) => {
              const cellText = $(cell).text().trim();
              if (cellText.match(/\w{3}\s+\d{4}/) || cellText.match(/\d{4}/)) {
                headers.push(cellText);
              }
            });
          }
          
          // Find Sales/Revenue row
          if ((rowText.includes('sales') || rowText.includes('revenue')) && !rowText.includes('cost')) {
            salesRow = row;
            console.log(`💰 Found sales row: "${rowText.substring(0, 50)}..."`);
          }
          
          // Find Net Profit row
          if (rowText.includes('net profit')) {
            profitRow = row;
            console.log(`📊 Found profit row: "${rowText.substring(0, 50)}..."`);
          }
          
          // Find EPS row
          if (rowText.includes('eps') && (rowText.includes('rs') || rowText.includes('₹'))) {
            epsRow = row;
            console.log(`📈 Found EPS row: "${rowText.substring(0, 50)}..."`);
          }
        });
        
        // Extract last 4 quarters
        const last4Headers = headers.slice(-4);
        console.log(`📅 Last 4 quarter headers:`, last4Headers);
        
        if (last4Headers.length >= 4) {
          // Extract data from each row
          const salesData = extractRowData($(salesRow));
          const profitData = extractRowData($(profitRow));
          const epsData = extractRowData($(epsRow));
          
          console.log(`💰 Sales data:`, salesData.slice(-4));
          console.log(`📊 Profit data:`, profitData.slice(-4));
          console.log(`📈 EPS data:`, epsData.slice(-4));
          
          // Build quarterly results (latest first)
          for (let i = 3; i >= 0; i--) {
            const quarterIndex = last4Headers.length - 1 - i;
            quarterlyResults.push({
              quarter: last4Headers[quarterIndex] || `Q${4-i}`,
              revenue: salesData[salesData.length - 4 + i] || 0,
              profit: profitData[profitData.length - 4 + i] || 0,
              eps: epsData[epsData.length - 4 + i] || 0
            });
          }
        }
        
        return false; // Stop after finding first quarterly table
      }
    });
    
    if (!foundQuarterlyTable) {
      console.log(`⚠️ No quarterly results table found for ${stockSymbol}`);
    } else {
      financialData.quarterlyResults = quarterlyResults;
      console.log(`✅ Extracted ${quarterlyResults.length} quarters of data`);
    }
    
    // SHAREHOLDING PATTERN EXTRACTION
    console.log(`👥 Extracting shareholding pattern for ${stockSymbol}...`);
    
    const shareholdingPattern = [];
    let foundShareholdingTable = false;
    
    $('table').each((i, table) => {
      const tableText = $(table).text().toLowerCase();
      
      if (tableText.includes('shareholding') && tableText.includes('pattern')) {
        console.log(`📊 Found shareholding pattern table for ${stockSymbol}`);
        foundShareholdingTable = true;
        
        $(table).find('tr').each((rowIndex, row) => {
          const rowText = $(row).text().toLowerCase().trim();
          const cells = $(row).find('td, th');
          
          // Look for shareholding categories
          const categories = ['promoter', 'fii', 'dii', 'public', 'government'];
          
          categories.forEach(category => {
            if (rowText.includes(category)) {
              console.log(`👤 Found ${category} row: "${rowText.substring(0, 50)}..."`);
              
              // Get all cell values from this row
              const cellValues = [];
              cells.each((cellIndex, cell) => {
                cellValues.push($(cell).text().trim());
              });
              
              // Get the last cell (most recent percentage)
              const lastCell = cellValues[cellValues.length - 1];
              const percentMatch = lastCell.match(/([\d,]+(?:\.\d+)?)%?/);
              
              if (percentMatch) {
                const percentage = parseFloat(percentMatch[1].replace(/,/g, ''));
                if (!isNaN(percentage)) {
                  shareholdingPattern.push({
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    percentage: percentage
                  });
                  console.log(`✅ ${category}: ${percentage}%`);
                }
              }
            }
          });
        });
        
        return false; // Stop after finding first shareholding table
      }
    });
    
    if (!foundShareholdingTable) {
      console.log(`⚠️ No shareholding pattern table found for ${stockSymbol}`);
    } else {
      financialData.shareholdingPattern = shareholdingPattern;
      console.log(`✅ Extracted ${shareholdingPattern.length} shareholding categories`);
    }
    
    console.log(`🎯 Extraction complete for ${stockSymbol}:`, financialData);
    return financialData;
    
  } catch (error) {
    console.error(`❌ Real web scraping failed for ${stockSymbol}:`, error);
    throw error;
  }
}

// Test with TATAMOTORS
async function testTataMotors() {
  console.log('🧪 Testing TATAMOTORS with our new implementation...\n');
  
  try {
    const url = 'https://www.screener.in/company/TATAMOTORS/consolidated/';
    const result = await performRealWebScraping(url, 'TATAMOTORS', 'test prompt');
    
    console.log('\n📊 ACTUAL DATA FROM YOUR NEW IMPLEMENTATION:');
    console.log('===============================================');
    console.log(JSON.stringify(result, null, 2));
    console.log('===============================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTataMotors();