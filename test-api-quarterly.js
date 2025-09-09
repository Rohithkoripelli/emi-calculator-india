/**
 * Test the actual webfetch API with quarterly extraction
 */

const { performRealWebScraping } = require('./api/webfetch.js');

async function testAPIQuarterly() {
  console.log('🧪 Testing webfetch API with quarterly extraction...\n');
  
  const url = 'https://www.screener.in/company/PCJEWELLER/consolidated/';
  const stockSymbol = 'PCJEWELLER';
  const extractionPrompt = 'Extract comprehensive financial data including quarterly results';
  
  try {
    console.log(`🔄 Calling performRealWebScraping API for ${stockSymbol}...`);
    const result = await performRealWebScraping(url, stockSymbol, extractionPrompt);
    
    console.log(`\n📊 API RESULT FOR ${stockSymbol}:`);
    console.log('===============================================');
    
    if (result) {
      console.log(`✅ API call successful!`);
      console.log(`📈 Basic data: Company ${result.companyName}, Market Cap ${result.marketCap}`);
      
      if (result.quarterlyResults) {
        console.log(`\n🎯 QUARTERLY RESULTS FOUND:`);
        console.log(`   Count: ${result.quarterlyResults.length}`);
        result.quarterlyResults.forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.quarter}: Sales ₹${q.revenue} Cr, Profit ₹${q.profit} Cr, EPS ₹${q.eps}`);
        });
      } else {
        console.log(`\n❌ NO QUARTERLY RESULTS in response`);
        console.log(`   Available keys: ${Object.keys(result).join(', ')}`);
      }
      
      if (result.shareholdingPattern) {
        console.log(`\n📊 Shareholding Pattern: ${result.shareholdingPattern.length} categories`);
      }
      
    } else {
      console.log(`❌ API returned null/undefined`);
    }
    
  } catch (error) {
    console.error(`❌ API test failed:`, error);
  }
}

// Run the test
testAPIQuarterly();