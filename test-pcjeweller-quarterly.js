/**
 * Test quarterly extraction specifically for PCJEWELLER
 */

const puppeteer = require('puppeteer');

async function testPCJEWELLERQuarterly() {
  let browser;
  
  try {
    console.log(`🚀 Testing PCJEWELLER quarterly extraction...`);
    
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
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://www.screener.in/company/PCJEWELLER/consolidated/';
    console.log(`📊 Navigating to ${url}...`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('table', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`🔍 DEBUG: Analyzing PCJEWELLER table structure...`);
    
    const debugInfo = await page.evaluate(() => {
      const debug = {
        tableCount: 0,
        tables: []
      };
      
      try {
        const tables = document.querySelectorAll('table');
        debug.tableCount = tables.length;
        
        tables.forEach((table, index) => {
          const tableText = table.innerText;
          const rows = table.querySelectorAll('tr');
          
          const tableInfo = {
            index: index,
            rowCount: rows.length,
            textLength: tableText.length,
            containsSales: tableText.includes('Sales'),
            contains2025: tableText.includes('2025'),
            contains2024: tableText.includes('2024'),
            containsMar2025: tableText.includes('Mar 2025'),
            containsJun2025: tableText.includes('Jun 2025'),
            headerRowFound: false,
            salesRowFound: false,
            firstFewRows: []
          };
          
          // Analyze first few rows
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const row = rows[i];
            const rowText = row.innerText.trim();
            const cellCount = row.querySelectorAll('td, th').length;
            
            tableInfo.firstFewRows.push({
              index: i,
              text: rowText.substring(0, 150),
              cellCount: cellCount,
              containsSales: rowText.includes('Sales')
            });
            
            // Check for quarterly indicators
            if (rowText.includes('Jun 2025') || 
                (rowText.includes('Mar 2025') && rowText.includes('Dec 2024'))) {
              tableInfo.headerRowFound = true;
            }
            
            if (rowText.includes('Sales +') || 
                (rowText.includes('Sales') && rowText.length > 50)) {
              tableInfo.salesRowFound = true;
            }
          }
          
          debug.tables.push(tableInfo);
        });
        
        return debug;
        
      } catch (error) {
        debug.error = error.message;
        return debug;
      }
    });
    
    console.log(`\n📊 PCJEWELLER TABLE ANALYSIS:`);
    console.log(`===============================================`);
    console.log(`Total tables found: ${debugInfo.tableCount}`);
    
    debugInfo.tables.forEach((table, index) => {
      console.log(`\nTable ${index}:`);
      console.log(`- Rows: ${table.rowCount}, Text length: ${table.textLength}`);
      console.log(`- Contains Sales: ${table.containsSales}`);
      console.log(`- Contains 2025: ${table.contains2025}`);
      console.log(`- Contains 2024: ${table.contains2024}`);
      console.log(`- Header row found: ${table.headerRowFound}`);
      console.log(`- Sales row found: ${table.salesRowFound}`);
      
      console.log(`\n  First few rows:`);
      table.firstFewRows.forEach(row => {
        console.log(`    Row ${row.index} (${row.cellCount} cells): "${row.text}"`);
      });
      
      if (table.headerRowFound || table.salesRowFound) {
        console.log(`  🎯 POTENTIAL QUARTERLY TABLE!`);
      }
    });
    
    return debugInfo;
    
  } catch (error) {
    console.error(`❌ PCJEWELLER test failed:`, error);
    return null;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test with PCJEWELLER
testPCJEWELLERQuarterly()
  .then(result => {
    console.log('\n🎯 PCJEWELLER DEBUG COMPLETE!');
  });