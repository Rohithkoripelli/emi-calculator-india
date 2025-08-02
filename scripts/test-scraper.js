/**
 * Test script to verify the scraping approach works
 * This will scrape just the first few pages to validate the approach
 */

const { CompanyScraper } = require('./scrape-companies.js');

class TestScraper extends CompanyScraper {
  async testScraping() {
    console.log('🧪 Testing scraper with first 3 pages...');
    
    for (let page = 1; page <= 3; page++) {
      try {
        const companies = await this.fetchPage(page);
        
        console.log(`\n📄 Page ${page} Results:`);
        console.log(`   Found ${companies.length} companies`);
        
        if (companies.length > 0) {
          // Show first few companies as examples
          companies.slice(0, 5).forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (${company.symbol})`);
            console.log(`      Clean: "${company.cleanName}"`);
          });
          
          // Add to our collection
          companies.forEach(company => {
            this.companies.set(company.symbol, company);
          });
        }
        
        // Small delay between requests
        if (page < 3) {
          await this.delay(2000);
        }
        
      } catch (error) {
        console.error(`❌ Page ${page} failed:`, error.message);
      }
    }
    
    console.log(`\n🎉 Test completed!`);
    console.log(`📊 Total unique companies found: ${this.companies.size}`);
    
    // Save test results
    if (this.companies.size > 0) {
      const result = this.saveCompanies();
      console.log(`💾 Test data saved with ${Object.keys(result.indianStocks).length} database entries`);
      
      // Show some example database entries
      console.log('\n📝 Sample database entries:');
      const entries = Object.entries(result.indianStocks).slice(0, 10);
      entries.forEach(([key, value]) => {
        console.log(`   "${key}": "${value}"`);
      });
    }
    
    return this.companies.size;
  }
}

async function runTest() {
  const testScraper = new TestScraper();
  
  try {
    const companiesFound = await testScraper.testScraping();
    
    if (companiesFound > 0) {
      console.log('\n✅ Test successful! The scraping approach works.');
      console.log('🚀 Ready to run the full scraping of all 200+ pages.');
      console.log('\n💡 To run full scraping: node scripts/scrape-companies.js');
    } else {
      console.log('\n❌ Test failed! No companies found. Check the scraping logic.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();