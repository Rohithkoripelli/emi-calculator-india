/**
 * Debug SUZLON HTML structure to understand why our extraction is wrong
 */

const https = require('https');
const cheerio = require('cheerio');

async function debugSuzlonStructure() {
  try {
    console.log('🔍 Debugging SUZLON HTML structure...\n');
    
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
    
    console.log('📊 ANALYZING TABLE STRUCTURES:\n');
    
    // Find all tables and analyze their content
    $('table').each((i, table) => {
      const tableText = $(table).text();
      const firstRow = $(table).find('tr').first().text();
      
      console.log(`🔍 TABLE ${i}:`);
      console.log(`First row: "${firstRow.substring(0, 100)}..."`);
      
      // Check if this could be quarterly results
      if (tableText.toLowerCase().includes('mar 2') && tableText.toLowerCase().includes('revenue')) {
        console.log(`📈 POTENTIAL QUARTERLY TABLE ${i}:`);
        
        // Extract all rows
        $(table).find('tr').each((rowIndex, row) => {
          const rowText = $(row).text().trim();
          if (rowText.includes('Sales') || rowText.includes('Net Profit') || rowText.includes('EPS')) {
            console.log(`   Row ${rowIndex}: "${rowText}"`);
            
            // Show individual cells
            $(row).find('td, th').each((cellIndex, cell) => {
              const cellText = $(cell).text().trim();
              console.log(`      Cell ${cellIndex}: "${cellText}"`);
            });
          }
        });
        console.log('');
      }
      
      // Check if this could be shareholding pattern
      if (tableText.toLowerCase().includes('promoter') && tableText.toLowerCase().includes('%')) {
        console.log(`👥 POTENTIAL SHAREHOLDING TABLE ${i}:`);
        
        $(table).find('tr').each((rowIndex, row) => {
          const rowText = $(row).text().trim().toLowerCase();
          if (rowText.includes('promoter') || rowText.includes('fii') || rowText.includes('dii') || rowText.includes('public')) {
            console.log(`   Row ${rowIndex}: "${$(row).text().trim()}"`);
            
            // Show individual cells
            $(row).find('td, th').each((cellIndex, cell) => {
              const cellText = $(cell).text().trim();
              console.log(`      Cell ${cellIndex}: "${cellText}"`);
            });
          }
        });
        console.log('');
      }
    });
    
    console.log('📝 ANALYZING PAGE STRUCTURE FOR EPS:\n');
    
    // Look for EPS specifically
    const pageText = $.text();
    const epsMatches = pageText.match(/EPS[^₹\d]*₹?\s*([\d,]+(?:\.\d+)?)/gi);
    console.log('EPS patterns found:', epsMatches);
    
    // Look for specific sections
    console.log('\n🔍 SEARCHING FOR SPECIFIC SECTIONS:\n');
    
    // Find sections with quarterly data
    $('section, div, article').each((i, element) => {
      const elementText = $(element).text();
      if (elementText.includes('Mar 2025') && elementText.includes('3790')) {
        console.log(`📈 Found correct quarterly data in element ${i}:`);
        console.log(`Type: ${element.tagName}`);
        console.log(`Class: ${$(element).attr('class')}`);
        console.log(`ID: ${$(element).attr('id')}`);
        console.log(`Text sample: "${elementText.substring(0, 200)}..."`);
        console.log('');
      }
    });
    
    // Find sections with shareholding data
    $('section, div, article').each((i, element) => {
      const elementText = $(element).text();
      if (elementText.includes('11.75') && elementText.includes('Promoter')) {
        console.log(`👥 Found correct shareholding data in element ${i}:`);
        console.log(`Type: ${element.tagName}`);
        console.log(`Class: ${$(element).attr('class')}`);
        console.log(`ID: ${$(element).attr('id')}`);
        console.log(`Text sample: "${elementText.substring(0, 200)}..."`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSuzlonStructure();