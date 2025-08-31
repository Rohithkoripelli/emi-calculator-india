/**
 * Debug Enhanced Puppeteer quarterly extraction
 */

const puppeteer = require('puppeteer');

async function debugQuarterlyExtraction(url, stockSymbol) {
  let browser;
  
  try {
    console.log(`🚀 Starting DEBUG quarterly extraction for ${stockSymbol}...`);
    
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
    
    console.log(`📊 Navigating to ${url}...`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('table', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`🔍 DEBUG: Extracting ALL table information...`);
    
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
            contains3790: tableText.includes('3790'),
            contains2975: tableText.includes('2975'),
            firstRowText: rows.length > 0 ? rows[0].innerText.substring(0, 100) : '',
            salesRowFound: false,
            headerRowFound: false,
            rows: []
          };
          
          // Debug each row
          rows.forEach((row, rowIndex) => {
            const rowText = row.innerText.trim();
            const cellCount = row.querySelectorAll('td, th').length;
            
            const rowInfo = {
              index: rowIndex,
              text: rowText.substring(0, 200),
              cellCount: cellCount,
              containsSales: rowText.includes('Sales'),
              containsMar2025: rowText.includes('Mar 2025'),
              containsJun2025: rowText.includes('Jun 2025'),
              contains3790: rowText.includes('3790'),
              contains2975: rowText.includes('2975')
            };
            
            // Check if this is likely the header row
            if (rowText.includes('Jun 2025') || 
                (rowText.includes('Mar 2025') && rowText.includes('Dec 2024'))) {
              tableInfo.headerRowFound = true;
              rowInfo.isHeaderRow = true;
            }
            
            // Check if this is likely the sales row
            if (rowText.includes('Sales') && 
                (rowText.includes('3790') || rowText.includes('2975'))) {
              tableInfo.salesRowFound = true;
              rowInfo.isSalesRow = true;
            }
            
            tableInfo.rows.push(rowInfo);
          });
          
          debug.tables.push(tableInfo);
        });
        
        return debug;
        
      } catch (error) {
        debug.error = error.message;
        return debug;
      }
    });
    
    console.log(`\n📊 DEBUG RESULTS FOR ${stockSymbol}:`);
    console.log(`===============================================`);
    console.log(`Total tables found: ${debugInfo.tableCount}`);
    
    debugInfo.tables.forEach((table, index) => {
      console.log(`\nTable ${index}:`);
      console.log(`- Rows: ${table.rowCount}, Text length: ${table.textLength}`);
      console.log(`- Contains Sales: ${table.containsSales}`);
      console.log(`- Contains 2025: ${table.contains2025}`);
      console.log(`- Contains Mar 2025: ${table.containsMar2025}`);
      console.log(`- Contains Jun 2025: ${table.containsJun2025}`);
      console.log(`- Contains 3790: ${table.contains3790}`);
      console.log(`- Contains 2975: ${table.contains2975}`);
      console.log(`- Header row found: ${table.headerRowFound}`);
      console.log(`- Sales row found: ${table.salesRowFound}`);
      
      if (table.headerRowFound || table.salesRowFound) {
        console.log(`\n  🎯 POTENTIAL QUARTERLY TABLE! Analyzing rows:`);
        
        table.rows.forEach(row => {
          if (row.isHeaderRow || row.isSalesRow || row.containsSales) {
            console.log(`    Row ${row.index} (${row.cellCount} cells): "${row.text}"`);
            if (row.isHeaderRow) console.log(`      ✅ HEADER ROW`);
            if (row.isSalesRow) console.log(`      ✅ SALES ROW`);
          }
        });
      }
    });
    
    return debugInfo;
    
  } catch (error) {
    console.error(`❌ Debug extraction failed for ${stockSymbol}:`, error);
    return null;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test with SUZLON
debugQuarterlyExtraction('https://www.screener.in/company/SUZLON/consolidated/', 'SUZLON')
  .then(result => {
    console.log('\n🎯 DEBUG COMPLETE!');
  });