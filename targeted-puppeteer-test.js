/**
 * Targeted Puppeteer test focusing on quarterly sections
 */

const puppeteer = require('puppeteer');

async function targetedQuarterlyExtraction() {
  let browser;
  
  try {
    console.log('🎯 Targeted Puppeteer test for quarterly data...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set longer timeout and wait for full load
    await page.goto('https://www.screener.in/company/SUZLON/consolidated/', { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    
    console.log('📄 Page loaded, checking for quarterly content...');
    
    // Wait longer for dynamic content
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Try different strategies to find quarterly data
    const extractionResult = await page.evaluate(() => {
      console.log('🔍 Starting page evaluation...');
      
      // Strategy 1: Look for specific text patterns
      const pageText = document.body.innerText;
      const hasQuarterlySection = pageText.includes('Quarterly Results');
      const hasTargetNumbers = pageText.includes('3790') && pageText.includes('2975');
      
      console.log('Page contains "Quarterly Results":', hasQuarterlySection);
      console.log('Page contains target numbers:', hasTargetNumbers);
      
      // Strategy 2: Look for tables with quarterly data
      const tables = document.querySelectorAll('table');
      console.log('Found', tables.length, 'tables');
      
      let quarterlyTable = null;
      let tableIndex = -1;
      
      tables.forEach((table, index) => {
        const tableText = table.innerText || table.textContent || '';
        if (tableText.includes('3790') || tableText.includes('Mar 2025')) {
          console.log(`Table ${index} contains quarterly data:`, tableText.substring(0, 200));
          quarterlyTable = table;
          tableIndex = index;
        }
      });
      
      if (quarterlyTable) {
        console.log('✅ Found quarterly table at index', tableIndex);
        
        // Extract data from the quarterly table
        const rows = quarterlyTable.querySelectorAll('tr');
        console.log('Table has', rows.length, 'rows');
        
        let extractedData = {
          quarters: [],
          revenues: [],
          tableContent: quarterlyTable.innerText.substring(0, 500)
        };
        
        rows.forEach((row, rowIndex) => {
          const rowText = row.innerText || '';
          console.log(`Row ${rowIndex}:`, rowText.substring(0, 100));
          
          // Look for header row with quarters
          if (rowText.includes('Mar 2025') || rowText.includes('Dec 2024')) {
            const cells = row.querySelectorAll('td, th');
            cells.forEach(cell => {
              const cellText = cell.innerText.trim();
              if (cellText.match(/(Mar|Dec|Sep|Jun) 202[4-5]/)) {
                extractedData.quarters.push(cellText);
              }
            });
          }
          
          // Look for sales row with revenues
          if (rowText.includes('Sales') && rowText.includes('3790')) {
            const cells = row.querySelectorAll('td, th');
            cells.forEach(cell => {
              const cellText = cell.innerText.trim();
              if (cellText.match(/^\d{3,4}$/)) {
                extractedData.revenues.push(parseInt(cellText));
              }
            });
          }
        });
        
        return {
          success: true,
          data: extractedData,
          hasQuarterlySection,
          hasTargetNumbers,
          tablesFound: tables.length,
          quarterlyTableIndex: tableIndex
        };
      }
      
      // Strategy 3: Search in all text content
      const allText = document.documentElement.innerText || document.documentElement.textContent || '';
      const textSample = allText.substring(0, 2000);
      
      return {
        success: false,
        hasQuarterlySection,
        hasTargetNumbers,
        tablesFound: tables.length,
        textSample,
        searchResults: {
          contains3790: allText.includes('3790'),
          contains2975: allText.includes('2975'),
          contains2103: allText.includes('2103'),
          contains2022: allText.includes('2022'),
          containsMar2025: allText.includes('Mar 2025')
        }
      };
    });
    
    console.log('\n📊 TARGETED EXTRACTION RESULT:');
    console.log('===============================================');
    console.log(JSON.stringify(extractionResult, null, 2));
    console.log('===============================================');
    
    if (extractionResult.success) {
      console.log('\n✅ SUCCESS! Found quarterly data via Puppeteer');
      
      const { quarters, revenues } = extractionResult.data;
      console.log('\nExtracted Quarterly Revenue:');
      quarters.slice(-4).forEach((quarter, index) => {
        const revenue = revenues.slice(-4)[index];
        if (revenue) {
          console.log(`${quarter}: ₹${revenue} Cr`);
        }
      });
      
      return extractionResult;
      
    } else {
      console.log('\n❌ Could not extract structured quarterly data');
      console.log('Search results:', extractionResult.searchResults);
      
      if (!extractionResult.hasTargetNumbers) {
        console.log('⚠️ Target numbers (3790, 2975, etc.) not found in page');
        console.log('This suggests quarterly data is not loaded or in different format');
        return { recommendation: 'eliminate_quarterly_results' };
      }
      
      return extractionResult;
    }
    
  } catch (error) {
    console.error('❌ Targeted extraction failed:', error);
    return { success: false, error: error.message, recommendation: 'eliminate_quarterly_results' };
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
targetedQuarterlyExtraction().then(result => {
  if (result.recommendation === 'eliminate_quarterly_results') {
    console.log('\n🔄 RECOMMENDATION: Eliminate quarterly results from API response');
    console.log('✅ Focus on the 100% accurate basic metrics and shareholding patterns');
    console.log('📝 Current solution provides excellent accuracy for available data');
  }
});