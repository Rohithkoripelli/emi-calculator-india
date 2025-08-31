/**
 * Test Puppeteer-based extraction for JavaScript-rendered quarterly data
 */

const puppeteer = require('puppeteer');

async function extractQuarterlyDataWithPuppeteer(url, stockSymbol) {
  let browser;
  
  try {
    console.log(`🚀 Starting Puppeteer extraction for ${stockSymbol}...`);
    
    // Launch browser with minimal resources
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`📊 Navigating to ${url}...`);
    
    // Navigate and wait for network idle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log(`⏳ Waiting for JavaScript content to load...`);
    
    // Wait for potential quarterly data to load (give it extra time)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to find quarterly data sections that might be loaded by JavaScript
    console.log(`🔍 Searching for quarterly data...`);
    
    const quarterlyData = await page.evaluate(() => {
      const results = {
        foundQuarterlyNumbers: [],
        quarterlyTables: [],
        allText: document.body.innerText
      };
      
      // Look for the specific revenue numbers we know should be there
      const targetNumbers = ['3790', '2975', '2103', '2022'];
      targetNumbers.forEach(number => {
        if (document.body.innerText.includes(number)) {
          results.foundQuarterlyNumbers.push(number);
          
          // Find context around this number
          const text = document.body.innerText;
          const index = text.indexOf(number);
          if (index !== -1) {
            const context = text.substring(index - 100, index + 200);
            results.quarterlyTables.push({
              number: number,
              context: context
            });
          }
        }
      });
      
      // Also check for quarterly patterns
      const quarterPatterns = ['Mar 2025', 'Dec 2024', 'Sep 2024', 'Jun 2024'];
      quarterPatterns.forEach(pattern => {
        if (document.body.innerText.includes(pattern)) {
          console.log(`Found quarter pattern: ${pattern}`);
        }
      });
      
      // Look specifically in tables for quarterly data
      const tables = document.querySelectorAll('table');
      tables.forEach((table, index) => {
        const tableText = table.innerText;
        if (tableText.includes('Mar 2025') && (tableText.includes('3790') || tableText.includes('Sales'))) {
          results.quarterlyTables.push({
            tableIndex: index,
            tableText: tableText.substring(0, 500) // First 500 chars
          });
        }
      });
      
      return results;
    });
    
    console.log(`📊 Puppeteer extraction results for ${stockSymbol}:`);
    console.log(`Found quarterly numbers: ${quarterlyData.foundQuarterlyNumbers}`);
    console.log(`Found ${quarterlyData.quarterlyTables.length} potential quarterly tables`);
    
    if (quarterlyData.foundQuarterlyNumbers.length > 0) {
      console.log(`✅ SUCCESS! Found quarterly data with JavaScript rendering:`);
      quarterlyData.quarterlyTables.forEach((table, index) => {
        console.log(`\nTable/Context ${index}:`);
        console.log(table.context || table.tableText);
      });
      
      // If we found the numbers, try to extract structured data
      const structuredData = await page.evaluate(() => {
        const quarterlyResults = [];
        
        // Look for the specific quarterly table
        const tables = document.querySelectorAll('table');
        
        for (let table of tables) {
          const tableText = table.innerText;
          if (tableText.includes('Mar 2025') && tableText.includes('3790')) {
            
            const rows = table.querySelectorAll('tr');
            let headerRow = null;
            let salesRow = null;
            let profitRow = null;
            let epsRow = null;
            
            // Find header row and data rows
            rows.forEach(row => {
              const rowText = row.innerText;
              
              if (rowText.includes('Mar 2025') && rowText.includes('Dec 2024')) {
                headerRow = row;
              }
              if (rowText.includes('Sales') && rowText.includes('3790')) {
                salesRow = row;
              }
              if (rowText.includes('Net Profit') || (rowText.includes('Profit') && rowText.includes('After Tax'))) {
                profitRow = row;
              }
              if (rowText.includes('EPS in Rs')) {
                epsRow = row;
              }
            });
            
            if (headerRow && salesRow) {
              const headerCells = Array.from(headerRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
              const salesCells = Array.from(salesRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
              
              // Find the last 4 quarters (most recent)
              const recentQuarters = [];
              const recentRevenues = [];
              
              // Look for Mar 2025, Dec 2024, Sep 2024, Jun 2024
              const targetQuarters = ['Mar 2025', 'Dec 2024', 'Sep 2024', 'Jun 2024'];
              
              targetQuarters.forEach(targetQuarter => {
                const quarterIndex = headerCells.findIndex(cell => cell.includes(targetQuarter));
                if (quarterIndex !== -1 && salesCells[quarterIndex]) {
                  const revenue = salesCells[quarterIndex].replace(/[^\d]/g, '');
                  if (revenue && !isNaN(parseInt(revenue))) {
                    recentQuarters.push(targetQuarter);
                    recentRevenues.push(parseInt(revenue));
                  }
                }
              });
              
              if (recentQuarters.length >= 4) {
                quarterlyResults.push({
                  metric: 'Revenue',
                  quarters: recentQuarters,
                  values: recentRevenues,
                  unit: 'Cr'
                });
              }
              
              // Also try to extract profit data
              if (profitRow) {
                const profitCells = Array.from(profitRow.querySelectorAll('td, th')).map(cell => cell.innerText.trim());
                const profits = [];
                
                targetQuarters.forEach(targetQuarter => {
                  const quarterIndex = headerCells.findIndex(cell => cell.includes(targetQuarter));
                  if (quarterIndex !== -1 && profitCells[quarterIndex]) {
                    const profit = profitCells[quarterIndex].replace(/[^\d.-]/g, '');
                    if (profit && !isNaN(parseFloat(profit))) {
                      profits.push(parseFloat(profit));
                    }
                  }
                });
                
                if (profits.length >= 4) {
                  quarterlyResults.push({
                    metric: 'Net Profit',
                    quarters: recentQuarters,
                    values: profits,
                    unit: 'Cr'
                  });
                }
              }
            }
            break; // Found the right table
          }
        }
        
        return quarterlyResults;
      });
      
      return {
        success: true,
        method: 'puppeteer_javascript_rendering',
        data: {
          foundNumbers: quarterlyData.foundQuarterlyNumbers,
          quarterlyResults: structuredData,
          extractedAt: new Date().toISOString()
        }
      };
      
    } else {
      console.log(`❌ Even with JavaScript rendering, quarterly data not found`);
      console.log(`Page text sample: ${quarterlyData.allText.substring(0, 500)}...`);
      
      return {
        success: false,
        method: 'puppeteer_javascript_rendering',
        error: 'Quarterly data not available even with JavaScript rendering',
        note: 'Data may be loaded via API calls or require user interaction'
      };
    }
    
  } catch (error) {
    console.error(`❌ Puppeteer extraction failed for ${stockSymbol}:`, error);
    return {
      success: false,
      method: 'puppeteer_javascript_rendering',
      error: error.message
    };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test with SUZLON
async function testPuppeteerExtraction() {
  console.log('🧪 Testing Puppeteer extraction for quarterly data...\n');
  
  const result = await extractQuarterlyDataWithPuppeteer(
    'https://www.screener.in/company/SUZLON/consolidated/',
    'SUZLON'
  );
  
  console.log('\n📊 PUPPETEER EXTRACTION FINAL RESULT:');
  console.log('===============================================');
  console.log(JSON.stringify(result, null, 2));
  console.log('===============================================');
  
  if (result.success) {
    console.log('\n🚀 SUCCESS: Quarterly data can be extracted with Puppeteer!');
    console.log('✅ Ready to integrate into production API');
  } else {
    console.log('\n❌ FAILED: Quarterly data still not accessible');
    console.log('⚠️ Will eliminate quarterly results from API response');
  }
}

// Run the test
testPuppeteerExtraction();