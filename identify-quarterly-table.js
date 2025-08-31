/**
 * Script to identify the exact table number for quarterly results on screener.in
 */

const https = require('https');
const cheerio = require('cheerio');

async function identifyQuarterlyTable(url) {
  try {
    console.log('🔍 Identifying quarterly results table position...\n');
    
    // Fetch HTML
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    const $ = cheerio.load(html);
    
    console.log('📊 ANALYZING ALL TABLES ON THE PAGE:');
    console.log('=====================================\n');
    
    let quarterlyTableIndex = -1;
    let quarterlyTableFound = false;
    
    $('table').each((index, table) => {
      const tableText = $(table).text();
      const tableHtml = $(table).html();
      
      // Check if this table contains quarterly data indicators
      const hasQuarterlyIndicators = 
        tableText.includes('Sales') && 
        (tableText.includes('Mar') || tableText.includes('Dec') || tableText.includes('Sep')) &&
        (tableText.includes('2024') || tableText.includes('2025'));
        
      const hasNetProfit = tableText.includes('Net Profit') || tableText.includes('Profit After Tax');
      const hasEPS = tableText.includes('EPS');
      
      console.log(`Table ${index + 1} (0-indexed: ${index}):`);
      console.log(`- Length: ${tableText.length} characters`);
      console.log(`- Contains Sales: ${tableText.includes('Sales')}`);
      console.log(`- Contains quarters (Mar/Dec/Sep): ${tableText.includes('Mar') || tableText.includes('Dec') || tableText.includes('Sep')}`);
      console.log(`- Contains years (2024/2025): ${tableText.includes('2024') || tableText.includes('2025')}`);
      console.log(`- Contains Net Profit: ${hasNetProfit}`);
      console.log(`- Contains EPS: ${hasEPS}`);
      console.log(`- Has quarterly indicators: ${hasQuarterlyIndicators}`);
      
      // Show a sample of the table content
      const tableSample = tableText.substring(0, 200).replace(/\s+/g, ' ').trim();
      console.log(`- Sample content: "${tableSample}..."`);
      
      if (hasQuarterlyIndicators && (hasNetProfit || hasEPS)) {
        console.log(`🎯 POTENTIAL QUARTERLY TABLE FOUND! Table ${index + 1} (0-indexed: ${index})`);
        quarterlyTableIndex = index;
        quarterlyTableFound = true;
        
        // Extract more details about this table
        const rows = $(table).find('tr');
        console.log(`   - Number of rows: ${rows.length}`);
        
        rows.each((rowIndex, row) => {
          const rowText = $(row).text().replace(/\s+/g, ' ').trim();
          if (rowText.includes('Sales') || rowText.includes('Net Profit') || rowText.includes('EPS')) {
            console.log(`   - Row ${rowIndex}: "${rowText}"`);
          }
        });
      }
      
      console.log(''); // Empty line for readability
    });
    
    console.log('=====================================');
    if (quarterlyTableFound) {
      console.log(`✅ QUARTERLY RESULTS TABLE IDENTIFIED:`);
      console.log(`   Table Number: ${quarterlyTableIndex + 1} (human readable)`);
      console.log(`   Array Index: ${quarterlyTableIndex} (for code)`);
      console.log(`   CSS Selector: table:nth-of-type(${quarterlyTableIndex + 1})`);
      console.log(`   jQuery/Cheerio: $('table').eq(${quarterlyTableIndex})`);
    } else {
      console.log(`❌ NO QUARTERLY RESULTS TABLE FOUND`);
      console.log(`   This might mean:`);
      console.log(`   - Data is loaded dynamically via JavaScript`);
      console.log(`   - Table structure is different than expected`);
      console.log(`   - Need to use Puppeteer for JavaScript rendering`);
    }
    
    return {
      found: quarterlyTableFound,
      tableIndex: quarterlyTableIndex,
      tableNumber: quarterlyTableIndex + 1
    };
    
  } catch (error) {
    console.error('❌ Error identifying quarterly table:', error);
    return null;
  }
}

// Test with SUZLON
identifyQuarterlyTable('https://www.screener.in/company/SUZLON/consolidated/')
  .then(result => {
    console.log('\n🎯 FINAL RESULT:');
    console.log(JSON.stringify(result, null, 2));
  });