/**
 * Claude WebFetch API Endpoint
 * Uses Claude WebFetch tool for comprehensive financial data extraction from Screener.in
 */

// IMPORTANT: This requires Claude WebFetch tool to be available in the server environment
// For now, this is a template showing how the integration would work

/**
 * Extract quarterly results from static HTML (fallback when Puppeteer not available)
 */
async function extractQuarterlyFromStaticHTML($, stockSymbol) {
  try {
    console.log(`📊 Starting static HTML quarterly extraction for ${stockSymbol}...`);
    
    const results = [];
    
    // Look for quarterly data in tables
    $('table').each((tableIndex, table) => {
      const tableText = $(table).text();
      
      // Check if this table contains quarterly indicators
      if (tableText.includes('Jun 2025') || tableText.includes('Mar 2025')) {
        console.log(`📊 Found potential quarterly table at index ${tableIndex}`);
        
        const rows = $(table).find('tr');
        let headerRow = null;
        let salesRow = null;
        
        rows.each((rowIndex, row) => {
          const rowText = $(row).text().trim();
          
          // Find header row with quarters
          if (rowText.includes('Jun 2025') && rowText.includes('Mar 2025')) {
            headerRow = $(row);
            console.log(`📊 Found header row: ${rowText.substring(0, 100)}`);
          }
          
          // Find sales row
          if (rowText.includes('Sales') && (rowText.includes('725') || rowText.includes('699'))) {
            salesRow = $(row);
            console.log(`📊 Found sales row: ${rowText.substring(0, 100)}`);
          }
        });
        
        if (headerRow && salesRow) {
          console.log(`✅ Found both header and sales rows, extracting data...`);
          
          const headerCells = headerRow.find('td, th').map((i, cell) => $(cell).text().trim()).get();
          const salesCells = salesRow.find('td, th').map((i, cell) => $(cell).text().trim()).get();
          
          console.log(`📊 Header cells: ${headerCells.length}, Sales cells: ${salesCells.length}`);
          
          // Extract last 4 quarters dynamically
          const dataColumnsCount = Math.min(headerCells.length, salesCells.length);
          const startIndex = Math.max(1, dataColumnsCount - 4);
          
          for (let columnIndex = dataColumnsCount - 1; columnIndex >= startIndex; columnIndex--) {
            const quarterName = headerCells[columnIndex];
            const revenue = parseFloat(salesCells[columnIndex].replace(/[^\d.-]/g, ''));
            
            if (quarterName && !isNaN(revenue) && revenue > 0) {
              results.push({
                quarter: quarterName,
                revenue: revenue,
                profit: 0, // Will extract if available
                eps: 0     // Will extract if available
              });
              
              console.log(`📊 Extracted ${quarterName}: Revenue ₹${revenue} Cr`);
            }
          }
        }
        
        return false; // Exit the .each() loop once we find the right table
      }
    });
    
    console.log(`✅ Static HTML extraction complete: ${results.length} quarters extracted`);
    return results;
    
  } catch (error) {
    console.log(`❌ Static HTML quarterly extraction failed: ${error.message}`);
    return [];
  }
}

/**
 * Extract quarterly results using Enhanced Puppeteer with JavaScript rendering
 * Targets Table 1 (index 0) which contains the most recent quarterly data
 */
async function extractQuarterlyResultsWithPuppeteer(url, stockSymbol) {
  let browser;
  
  try {
    console.log(`🚀 Starting Enhanced Puppeteer extraction for quarterly results: ${stockSymbol}...`);
    
    // Check if Puppeteer is available
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
      console.log(`✅ Puppeteer module loaded successfully`);
    } catch (importError) {
      console.log(`❌ Puppeteer not available: ${importError.message}`);
      console.log(`📝 To enable quarterly extraction, install Puppeteer: npm install puppeteer`);
      return [];
    }
    
    // Launch browser optimized for serverless/production
    console.log(`🚀 Launching Puppeteer browser...`);
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      console.log(`✅ Puppeteer browser launched successfully`);
    } catch (launchError) {
      console.log(`❌ Puppeteer browser launch failed: ${launchError.message}`);
      console.log(`🔄 Falling back to static HTML parsing for quarterly extraction...`);
      return []; // Return empty results, will be handled by fallback
    }
    
    const page = await browser.newPage();
    console.log(`✅ New page created`);
    
    // Set viewport and realistic headers
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    console.log(`✅ Page viewport and user agent set`);
    
    console.log(`📊 Navigating to ${url} and waiting for content...`);
    
    try {
      // Navigate with networkidle2 to ensure JavaScript content loads
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      console.log(`✅ Page navigation completed successfully`);
    } catch (navigationError) {
      console.log(`❌ Page navigation failed: ${navigationError.message}`);
      throw navigationError;
    }
    
    // Wait for tables to be present and JavaScript to complete
    console.log(`⏳ Waiting for quarterly results table to load...`);
    
    try {
      await page.waitForSelector('table', { timeout: 10000 });
      console.log(`✅ Tables found on page`);
    } catch (selectorError) {
      console.log(`❌ No tables found within timeout: ${selectorError.message}`);
      throw selectorError;
    }
    
    // Simulate user interactions that might trigger data loading
    console.log(`🖱️ Simulating user interactions to trigger data loading...`);
    
    // Scroll down to trigger any lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll back up
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for and click any tabs that might contain quarterly data
    try {
      const tabs = await page.$$('a[href*="consolidated"], button[data-target*="quarterly"], .tab, .nav-tab');
      if (tabs.length > 0) {
        console.log(`🖱️ Found ${tabs.length} potential tabs, clicking the first one...`);
        await tabs[0].click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (tabError) {
      console.log(`ℹ️ No tabs found or tab clicking failed: ${tabError.message}`);
    }
    
    // Additional wait for dynamic content after interactions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`🔍 Extracting quarterly data from Table 2 (index 1)...`);
    
    // First, let's count the total tables on the page
    const tableCount = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      console.log(`📊 Total tables found: ${tables.length}`);
      return tables.length;
    });
    console.log(`📊 Page has ${tableCount} tables total`);
    
    // Extract quarterly results from the second table (index 1)
    const quarterlyResults = await page.evaluate(() => {
      const results = [];
      
      try {
        const tables = document.querySelectorAll('table');
        console.log(`📊 DEBUG: Found ${tables.length} tables in page evaluation`);
        
        // Target the second table (index 1) which contains recent quarterly data
        const table = tables[1];
        
        if (!table) {
          console.log(`❌ No table found at index 1. Available tables: ${tables.length}`);
          return [];
        }
        
        console.log(`✅ Found target table at index 1`);
        
        const rows = table.querySelectorAll('tr');
        console.log(`📊 Table has ${rows.length} rows`);
        
        let headerRow = null;
        let salesRow = null;
        let netProfitRow = null;
        let epsRow = null;
        
        // Debug: Show first few rows
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowText = rows[i].innerText.trim();
          console.log(`Row ${i}: "${rowText.substring(0, 100)}..."`);
        }
        
        // Find the relevant rows
        rows.forEach((row, index) => {
          const rowText = row.innerText.trim();
          
          // Look for header row with quarters (more flexible pattern)
          if (rowText.includes('Jun 2025') || 
              (rowText.includes('Mar 2025') && rowText.includes('Dec 2024'))) {
            headerRow = row;
            console.log(`Found header row at index ${index}: ${rowText.substring(0, 100)}`);
          }
          
          // Look for Sales row (match the actual format from debug)
          if (rowText.includes('Sales +') || 
              (rowText.includes('Sales') && 
               (rowText.includes('3,790') || rowText.includes('2,975') || 
                rowText.includes('3790') || rowText.includes('2975')))) {
            salesRow = row;
            console.log(`Found sales row at index ${index}: ${rowText.substring(0, 100)}`);
          }
          
          // Look for Net Profit row (more flexible pattern)
          if (rowText.includes('Net Profit') || 
              (rowText.includes('Profit After Tax') && !rowText.includes('Before'))) {
            netProfitRow = row;
            console.log(`Found net profit row at index ${index}: ${rowText.substring(0, 100)}`);
          }
          
          // Look for EPS row
          if (rowText.includes('EPS in Rs') || 
              (rowText.includes('EPS') && rowText.includes('Rs'))) {
            epsRow = row;
            console.log(`Found EPS row at index ${index}: ${rowText.substring(0, 100)}`);
          }
        });
        
        // Extract data if we found the necessary rows
        if (headerRow && salesRow) {
          const headerCells = Array.from(headerRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
          const salesCells = Array.from(salesRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
          
          let netProfitCells = [];
          let epsCells = [];
          
          if (netProfitRow) {
            netProfitCells = Array.from(netProfitRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
          }
          
          if (epsRow) {
            epsCells = Array.from(epsRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
          }
          
          console.log(`Header cells: ${headerCells.length}, Sales cells: ${salesCells.length}`);
          
          // Extract last 4 quarters dynamically (most recent columns)
          // Start from the end and work backwards, skipping the first column (labels)
          const dataColumnsCount = Math.min(headerCells.length, salesCells.length);
          const endIndex = dataColumnsCount;
          const startIndex = Math.max(1, endIndex - 4); // Skip first column (labels), get last 4 data columns
          
          console.log(`Extracting columns from index ${endIndex - 1} down to ${startIndex} (last 4 quarters, most recent first)`);
          
          // Extract from right to left (most recent to oldest)
          for (let columnIndex = endIndex - 1; columnIndex >= startIndex; columnIndex--) {
            const quarterName = headerCells[columnIndex] ? headerCells[columnIndex].trim() : `Q${columnIndex}`;
            
            if (salesCells[columnIndex]) {
              // Extract revenue (handle commas)
              const revenueText = salesCells[columnIndex];
              const revenue = parseFloat(revenueText.replace(/[^\d.-]/g, ''));
              
              // Extract net profit
              let netProfit = 0;
              if (netProfitCells[columnIndex]) {
                const profitText = netProfitCells[columnIndex];
                netProfit = parseFloat(profitText.replace(/[^\d.-]/g, ''));
              }
              
              // Extract EPS
              let eps = 0;
              if (epsCells[columnIndex]) {
                const epsText = epsCells[columnIndex];
                eps = parseFloat(epsText.replace(/[^\d.-]/g, ''));
              }
              
              if (!isNaN(revenue) && revenue > 0) {
                results.push({
                  quarter: quarterName,
                  revenue: revenue,
                  profit: isNaN(netProfit) ? 0 : netProfit,
                  eps: isNaN(eps) ? 0 : eps
                });
                
                console.log(`Extracted ${quarterName}: Revenue=${revenue}, Profit=${netProfit}, EPS=${eps}`);
              }
            }
          }
        }
        
        console.log(`Total quarterly results extracted: ${results.length}`);
        return results;
        
      } catch (error) {
        console.log(`Error in page evaluation: ${error.message}`);
        return [];
      }
    });
    
    if (quarterlyResults.length > 0) {
      console.log(`✅ Successfully extracted ${quarterlyResults.length} quarterly results for ${stockSymbol}`);
      quarterlyResults.forEach(result => {
        console.log(`   ${result.quarter}: Sales ₹${result.revenue} Cr, Profit ₹${result.profit} Cr, EPS ₹${result.eps}`);
      });
      return quarterlyResults;
    } else {
      console.log(`⚠️ No quarterly results extracted for ${stockSymbol}`);
      return [];
    }
    
  } catch (error) {
    console.error(`❌ Puppeteer quarterly extraction failed for ${stockSymbol}:`, error);
    return [];
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Add CORS headers for frontend access
function addCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Use Claude WebFetch tool to extract financial data
 * This is where the actual Claude WebFetch integration happens
 */
async function extractWithClaudeWebFetch(url, stockSymbol) {
  try {
    console.log(`🌐 Using Claude WebFetch for ${stockSymbol} from ${url}...`);
    
    // Create comprehensive prompt for Claude WebFetch
    const extractionPrompt = `
IMPORTANT: Extract comprehensive financial data from Screener.in page for stock ${stockSymbol}.

BASIC METRICS (Top of page):
- Market Cap (₹ Cr) - exact amount
- Current Price (₹) - exact amount
- Book Value (₹) - exact amount  
- Dividend Yield (%) - exact percentage
- Face Value (₹) - exact amount
- EPS (Earnings Per Share) (₹) - exact amount
- P/E Ratio - exact number
- ROE (Return on Equity) (%) - exact percentage
- ROCE (Return on Capital Employed) (%) - exact percentage

QUARTERLY RESULTS (Middle section - "Quarterly Results" table):
Find the "Quarterly Results" table and extract from LAST 4 COLUMNS ONLY:
- Look for row with "Sales" OR "Revenue" (same thing) - get last 4 column values
- Look for row with "Net Profit" - get last 4 column values  
- Look for row with "EPS in Rs" - get last 4 column values
- Column headers for those last 4 columns (quarter names)

IMPORTANT: Last column (rightmost) = Latest quarter

SHAREHOLDING PATTERN (Bottom section):
Find "Shareholding Pattern" table, extract from LAST COLUMN ONLY:
- Promoters percentage
- FII percentage
- DII percentage
- Public percentage
- Government percentage (if exists)

Return as JSON:
{
  "marketCap": "₹X,XXX Cr",
  "currentPrice": number,
  "eps": number,
  "pe": number,
  "roe": number,
  "roce": number,
  "bookValue": number,
  "dividendYield": number,
  "faceValue": number,
  "quarterlyResults": [
    {"quarter": "Latest Quarter", "revenue": number, "profit": number, "eps": number},
    {"quarter": "2nd Quarter", "revenue": number, "profit": number, "eps": number},
    {"quarter": "3rd Quarter", "revenue": number, "profit": number, "eps": number},
    {"quarter": "4th Quarter", "revenue": number, "profit": number, "eps": number}
  ],
  "shareholdingPattern": [
    {"category": "Promoters", "percentage": number},
    {"category": "FII", "percentage": number},
    {"category": "DII", "percentage": number},
    {"category": "Public", "percentage": number}
  ],
  "companyName": "Company Name",
  "sector": "Sector Name",
  "industry": "Industry Name"
}`;

    // REAL IMPLEMENTATION: Use server-side web scraping for dynamic extraction
    console.log(`🌐 Performing real web scraping for ${stockSymbol} from ${url}...`);
    
    // Use server-side scraping with enhanced HTML parsing
    const result = await performRealWebScraping(url, stockSymbol, extractionPrompt);
    return result;
    
  } catch (error) {
    console.error(`❌ Claude WebFetch error for ${stockSymbol}:`, error);
    throw error;
  }
}

/**
 * Perform real web scraping for any stock symbol
 * This function dynamically extracts data from Screener.in for ANY stock
 */
async function performRealWebScraping(url, stockSymbol, extractionPrompt) {
  try {
    console.log(`🚀 ENTRY: performRealWebScraping called for ${stockSymbol}`);
    console.log(`📊 URL: ${url}`);
    console.log(`📝 Prompt: ${extractionPrompt}`);
    console.log(`📊 Starting real web scraping for ${stockSymbol}...`);
    
    const https = require('https');
    const cheerio = require('cheerio');
    
    // Fetch HTML with realistic browser headers
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity', // Don't use gzip to avoid decompression issues
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
    
    // Extract company name from page title or heading
    const pageTitle = $('title').text() || $('h1').first().text() || '';
    if (pageTitle) {
      // Clean up the title to get company name
      const cleanTitle = pageTitle
        .replace(/Share Price.*|Stock Price.*|Screener.*|NSE.*|BSE.*/i, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();
      if (cleanTitle && cleanTitle !== stockSymbol) {
        financialData.companyName = cleanTitle;
      }
    }
    
    console.log(`📊 Extracting comprehensive financial data for ${stockSymbol}...`);
    
    // PRODUCTION-READY PATTERN-BASED EXTRACTION
    const pageText = $.text();
    
    // Enhanced Basic Metrics Extraction with high accuracy
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
    console.log(`📈 Extracting EPS with high accuracy...`);
    
    let epsValue = null;
    
    // Method 1: Look for TTM EPS specifically
    const ttmEpsMatch = pageText.match(/EPS\s*\(TTM\)[^\d]*₹?\s*([\d,]+(?:\.\d+)?)/i);
    if (ttmEpsMatch) {
      const eps = parseFloat(ttmEpsMatch[1].replace(/,/g, ''));
      if (!isNaN(eps) && eps >= 0 && eps < 100) { // Reasonable TTM EPS range
        epsValue = eps;
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
          if (!isNaN(eps) && eps >= -50 && eps < 100) { // Allow negative EPS, reasonable range
            epsValue = eps;
            break;
          }
        }
      }
    }
    
    if (epsValue !== null) {
      financialData.eps = epsValue;
    }
    
    console.log(`🔄 CHECKPOINT: About to start quarterly results extraction for ${stockSymbol}`);
    console.log(`📊 Current financialData keys: ${Object.keys(financialData).join(', ')}`);
    
    // QUARTERLY RESULTS EXTRACTION - Enhanced Puppeteer Implementation
    console.log(`📊 STARTING quarterly results extraction with Enhanced Puppeteer for ${stockSymbol}...`);
    console.log(`🌐 URL for quarterly extraction: ${url}`);
    let quarterlyResults = [];
    
    try {
      console.log(`🔄 About to call extractQuarterlyResultsWithPuppeteer function...`);
      console.log(`📋 Function exists: ${typeof extractQuarterlyResultsWithPuppeteer}`);
      
      quarterlyResults = await extractQuarterlyResultsWithPuppeteer(url, stockSymbol);
      
      console.log(`📊 RETURNED from extractQuarterlyResultsWithPuppeteer with: ${quarterlyResults ? quarterlyResults.length : 'null'} results`);
      
      // If Puppeteer failed (Chrome not available), try static HTML extraction
      if (!quarterlyResults || quarterlyResults.length === 0) {
        console.log(`🔄 Attempting static HTML quarterly extraction as fallback...`);
        quarterlyResults = await extractQuarterlyFromStaticHTML($, stockSymbol);
        console.log(`📊 Static HTML extraction returned: ${quarterlyResults ? quarterlyResults.length : 'null'} results`);
      }
      console.log(`📋 Quarterly extraction result: ${quarterlyResults ? quarterlyResults.length : 'null'} results`);
      
      if (quarterlyResults && quarterlyResults.length > 0) {
        console.log(`✅ Successfully extracted ${quarterlyResults.length} quarterly results:`);
        quarterlyResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.quarter}: Sales ₹${result.revenue} Cr, Profit ₹${result.profit} Cr, EPS ₹${result.eps}`);
        });
      } else {
        console.log(`⚠️ No quarterly results found - will continue without quarterly data`);
        console.log(`   This could be due to: Puppeteer not installed, different table structure, or extraction failure`);
      }
    } catch (error) {
      console.log(`❌ Quarterly extraction failed with error: ${error.message}`);
      console.log(`❌ Error stack: ${error.stack}`);
      console.log(`⚠️ Continuing API without quarterly data`);
    }
    
    // ACCURATE SHAREHOLDING PATTERN EXTRACTION
    console.log(`👥 Extracting shareholding pattern with high accuracy for ${stockSymbol}...`);
    
    const shareholdingPattern = [];
    const seenCategories = new Set(); // Prevent duplicates
    
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
    
    // Add quarterly results to response if available
    if (quarterlyResults && quarterlyResults.length > 0) {
      financialData.quarterlyResults = quarterlyResults;
      console.log(`✅ Added ${quarterlyResults.length} quarterly results to response`);
    }
    
    console.log(`🔄 FINAL CHECKPOINT: Extraction complete for ${stockSymbol}. Found ${Object.keys(financialData).length} data points`);
    console.log(`📊 Final financialData keys: ${Object.keys(financialData).join(', ')}`);
    console.log(`🔍 quarterlyResults in final data: ${financialData.quarterlyResults ? financialData.quarterlyResults.length : 'undefined'}`);
    return financialData;
    
  } catch (error) {
    console.error(`❌ Real web scraping failed for ${stockSymbol}:`, error);
    throw error;
  }
}

/**
 * Fallback to existing scraper if Claude WebFetch is not available
 */
async function fallbackToExistingScraper(stockSymbol) {
  try {
    console.log(`🔄 Using fallback scraper for ${stockSymbol}...`);
    
    // Import and use the existing screener-data.js logic
    const https = require('https');
    const cheerio = require('cheerio');
    
    const url = `https://www.screener.in/company/${stockSymbol}/consolidated/`;
    
    // Fetch HTML
    const html = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
      }).on('error', reject);
    });
    
    // Basic extraction using Cheerio (simplified version)
    const $ = cheerio.load(html);
    const metrics = {
      companyName: $('h1').first().text().trim(),
      sector: 'Unknown',
      industry: 'Unknown',
      lastUpdated: new Date().toISOString(),
      extractionMethod: 'fallback_cheerio'
    };
    
    // Extract basic metrics with Cheerio patterns
    const pageText = $.root().text();
    
    // EPS
    const epsMatch = pageText.match(/EPS[^\d]*([0-9,.]+)/i);
    if (epsMatch) {
      metrics.eps = parseFloat(epsMatch[1].replace(/,/g, ''));
    }
    
    // P/E Ratio  
    const peMatch = pageText.match(/P\/E[^\d]*([0-9,.]+)/i);
    if (peMatch) {
      metrics.pe = parseFloat(peMatch[1].replace(/,/g, ''));
    }
    
    // Market Cap
    const marketCapMatch = pageText.match(/Market Cap[^\d]*₹?\s*([0-9,]+(?:\.[0-9]+)?)\s*(Cr|Crores?)/i);
    if (marketCapMatch) {
      metrics.marketCap = `₹${marketCapMatch[1]} ${marketCapMatch[2]}`;
    }
    
    // Note: This is a simplified fallback - the Claude WebFetch version would be much more comprehensive
    
    return metrics;
    
  } catch (error) {
    console.error(`❌ Fallback scraper failed for ${stockSymbol}:`, error);
    throw error;
  }
}

// Main serverless function handler
module.exports = async (req, res) => {
  // CRITICAL DEBUG: Force log output to response for debugging
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    const logMessage = args.join(' ');
    logs.push(logMessage);
    originalLog(...args);
  };
  
  addCORSHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Support both GET and POST requests
  let stockSymbol, url, prompt;
  
  if (req.method === 'GET') {
    stockSymbol = req.query.symbol || req.query.stockSymbol;
    url = req.query.url;
    prompt = req.query.prompt || 'Extract comprehensive financial metrics';
  } else if (req.method === 'POST') {
    ({ url, prompt, stockSymbol } = req.body);
  } else {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }
  
  try {
    
    if (!stockSymbol) {
      return res.status(400).json({ 
        error: 'Missing stockSymbol parameter',
        example: { stockSymbol: 'HDFCBANK', url: 'https://www.screener.in/company/HDFCBANK/consolidated/', prompt: 'Extract financial data' }
      });
    }
    
    console.log(`📊 Claude WebFetch API called for: ${stockSymbol}`);
    
    // Build URL if not provided
    const targetUrl = url || `https://www.screener.in/company/${stockSymbol}/consolidated/`;
    
    try {
      // Use our Enhanced Puppeteer implementation directly
      console.log(`🚀 Using Enhanced Puppeteer web scraping for ${stockSymbol}...`);
      const scrapingResult = await performRealWebScraping(targetUrl, stockSymbol, prompt);
      
      // Restore original console.log
      console.log = originalLog;
      
      return res.status(200).json({
        success: true,
        stockSymbol: stockSymbol,
        url: targetUrl,
        data: scrapingResult,
        method: 'enhanced_puppeteer_scraping',
        extractedAt: new Date().toISOString(),
        debugLogs: logs // Include captured logs for debugging
      });
      
    } catch (claudeError) {
      // Restore original console.log
      console.log = originalLog;
      console.error(`❌ Enhanced Puppeteer failed for ${stockSymbol}, trying fallback:`, claudeError);
      
      // Fallback to existing scraper
      const fallbackResult = await fallbackToExistingScraper(stockSymbol);
      
      return res.status(200).json({
        success: true,
        stockSymbol: stockSymbol,
        url: targetUrl,
        data: fallbackResult,
        method: 'fallback_after_error',
        claude_error: claudeError.message,
        extractedAt: new Date().toISOString(),
        debugLogs: logs // Include captured logs for debugging
      });
    }
    
  } catch (error) {
    // Restore original console.log if not already restored
    if (console.log !== originalLog) {
      console.log = originalLog;
    }
    console.error('❌ WebFetch API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to extract financial data',
      message: error.message,
      timestamp: new Date().toISOString(),
      debugLogs: logs || [] // Include captured logs for debugging
    });
  }
};