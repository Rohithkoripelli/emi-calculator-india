/**
 * Find where the quarterly revenue data (3790, 2975, 2103, 2022) is located in SUZLON HTML
 */

const https = require('https');
const cheerio = require('cheerio');

async function findQuarterlyData() {
  try {
    console.log('🔍 Searching for quarterly revenue data (3790, 2975, 2103, 2022)...\n');
    
    const url = 'https://www.screener.in/company/SUZLON/consolidated/';
    
    // Fetch HTML
    const html = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    const $ = cheerio.load(html);
    
    // Look for the specific numbers we know are correct: 3790, 2975, 2103, 2022
    const targetNumbers = ['3790', '2975', '2103', '2022'];
    
    console.log('🔍 Searching for quarterly revenue numbers in page...\n');
    
    targetNumbers.forEach(number => {
      console.log(`📊 Searching for ${number}:`);
      const pageText = $.text();
      if (pageText.includes(number)) {
        console.log(`✅ Found ${number} in page text`);
        
        // Find the context around this number
        const index = pageText.indexOf(number);
        const context = pageText.substring(index - 100, index + 100);
        console.log(`Context: "${context}"`);
        console.log('');
      } else {
        console.log(`❌ ${number} not found in page text`);
      }
    });
    
    console.log('🔍 Searching in table elements specifically...\n');
    
    // Look in tables for these numbers
    $('table').each((i, table) => {
      const tableText = $(table).text();
      
      targetNumbers.forEach(number => {
        if (tableText.includes(number)) {
          console.log(`📊 Found ${number} in TABLE ${i}:`);
          
          // Find the specific row containing this number
          $(table).find('tr').each((rowIndex, row) => {
            const rowText = $(row).text();
            if (rowText.includes(number)) {
              console.log(`   Row ${rowIndex}: "${rowText}"`);
              
              // Show all cells in this row
              $(row).find('td, th').each((cellIndex, cell) => {
                const cellText = $(cell).text().trim();
                if (cellText.includes(number) || cellIndex < 5) { // Show first 5 cells or cells with our number
                  console.log(`      Cell ${cellIndex}: "${cellText}"`);
                }
              });
            }
          });
          console.log('');
        }
      });
    });
    
    console.log('🔍 Searching in divs and sections...\n');
    
    // Look in divs/sections
    $('div, section').each((i, element) => {
      const elementText = $(element).text();
      
      if (elementText.includes('3790') && elementText.includes('Mar 2025')) {
        console.log(`📈 Found quarterly data in element ${i}:`);
        console.log(`Tag: ${element.tagName}`);
        console.log(`Class: ${$(element).attr('class')}`);
        console.log(`ID: ${$(element).attr('id')}`);
        
        // Look for table within this element
        $(element).find('table').each((tableIndex, table) => {
          console.log(`   Contains Table ${tableIndex}:`);
          $(table).find('tr').each((rowIndex, row) => {
            const rowText = $(row).text();
            if (rowText.includes('3790') || rowText.includes('Sales') || rowText.includes('Net Profit')) {
              console.log(`      Row ${rowIndex}: "${rowText.substring(0, 200)}"`);
            }
          });
        });
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

// Run the search
findQuarterlyData();