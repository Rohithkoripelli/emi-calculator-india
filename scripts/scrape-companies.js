/**
 * Scrape all listed companies from screener.in
 * This script will fetch all 5040+ companies across 200+ pages
 */

const fs = require('fs');
const path = require('path');

class CompanyScraper {
  constructor() {
    this.baseUrl = 'https://www.screener.in/screens/357649/all-listed-companies/';
    this.companies = new Map(); // Use Map to avoid duplicates
    this.delay = 1000; // 1 second delay between requests to be respectful
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(pageNumber) {
    try {
      console.log(`📄 Fetching page ${pageNumber}...`);
      
      const url = `${this.baseUrl}?page=${pageNumber}`;
      
      // Use a CORS proxy since we're running this from Node.js
      const corsProxy = 'https://api.allorigins.win/get?url=';
      const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const html = data.contents;
      
      return this.parseCompaniesFromHTML(html);
      
    } catch (error) {
      console.error(`❌ Error fetching page ${pageNumber}:`, error.message);
      return [];
    }
  }

  parseCompaniesFromHTML(html) {
    const companies = [];
    const seenSymbols = new Set();
    
    try {
      // More comprehensive regex patterns to catch different HTML structures
      const patterns = [
        // Standard company links
        /<a[^>]*href="\/company\/([^\/]+)\/"[^>]*>([^<]+)<\/a>/g,
        // Links with additional attributes
        /<a[^>]*href="\/company\/([^\/]+)\/"[^>]*title="[^"]*">([^<]+)<\/a>/g,
        // Table cell variations
        /<td[^>]*><a[^>]*href="\/company\/([^\/]+)\/"[^>]*>([^<]+)<\/a><\/td>/g,
        // With whitespace variations
        /<a\s+[^>]*href\s*=\s*["']\/company\/([^\/]+)\/["'][^>]*>\s*([^<]+?)\s*<\/a>/g
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const symbol = match[1].toUpperCase().trim();
          const name = match[2].trim();
          
          // Skip if we've already seen this symbol
          if (seenSymbols.has(symbol)) {
            continue;
          }
          
          // Skip if name is too short or looks like a placeholder
          if (name.length < 2 || name === '...' || name === '-') {
            continue;
          }
          
          seenSymbols.add(symbol);
          
          // Clean up the name and create variations
          const cleanName = this.cleanCompanyName(name);
          
          companies.push({
            symbol: symbol,
            name: name,
            cleanName: cleanName
          });
        }
      });
      
      // Debug: Log first few matches to understand the structure
      if (companies.length > 0) {
        console.log(`   📝 Sample companies found: ${companies.slice(0, 3).map(c => `${c.name} (${c.symbol})`).join(', ')}`);
      }
      
    } catch (error) {
      console.error('❌ Error parsing HTML:', error.message);
    }
    
    return companies;
  }
  
  cleanCompanyName(name) {
    return name.toLowerCase()
      .replace(/\s+ltd\.?$/i, '')
      .replace(/\s+limited$/i, '')
      .replace(/\s+pvt\.?$/i, '')
      .replace(/\s+private$/i, '')
      .replace(/\s+inc\.?$/i, '')
      .replace(/\s+corporation$/i, '')
      .replace(/\s+corp\.?$/i, '')
      .replace(/\s+company$/i, '')
      .replace(/\s+co\.?$/i, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async scrapeAllCompanies() {
    console.log('🚀 Starting to scrape all listed companies from screener.in...');
    
    // Start with a small batch to test
    const maxPages = 202;
    let successfulPages = 0;
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const companies = await this.fetchPage(page);
        
        if (companies.length > 0) {
          // Add companies to our map (this automatically handles duplicates)
          companies.forEach(company => {
            this.companies.set(company.symbol, company);
          });
          
          console.log(`✅ Page ${page}: Found ${companies.length} companies (Total: ${this.companies.size})`);
          successfulPages++;
        } else {
          console.log(`⚠️ Page ${page}: No companies found`);
        }
        
        // Respectful delay between requests
        if (page < maxPages) {
          await this.delay(1000); // 1 second delay
        }
        
        // Save progress every 10 pages
        if (page % 10 === 0) {
          this.saveProgress();
        }
        
      } catch (error) {
        console.error(`❌ Failed to process page ${page}:`, error.message);
        // Continue with next page
      }
    }
    
    console.log(`🎉 Scraping completed! Processed ${successfulPages}/${maxPages} pages`);
    console.log(`📊 Total unique companies found: ${this.companies.size}`);
    
    return this.saveCompanies();
  }

  saveProgress() {
    const companiesArray = Array.from(this.companies.values());
    const progressFile = path.join(__dirname, 'scraping-progress.json');
    
    fs.writeFileSync(progressFile, JSON.stringify({
      totalCompanies: companiesArray.length,
      lastUpdated: new Date().toISOString(),
      companies: companiesArray.slice(0, 100) // Save first 100 as preview
    }, null, 2));
    
    console.log(`💾 Progress saved: ${companiesArray.length} companies`);
  }

  saveCompanies() {
    const companiesArray = Array.from(this.companies.values());
    
    // Generate the updated INDIAN_STOCKS object format
    const indianStocks = {};
    
    companiesArray.forEach(company => {
      const { symbol, name, cleanName } = company;
      
      // Add multiple variations for better matching
      indianStocks[cleanName] = symbol;
      
      // Add original name if different
      if (name.toLowerCase() !== cleanName) {
        indianStocks[name.toLowerCase()] = symbol;
      }
      
      // Add symbol itself for direct lookup
      indianStocks[symbol.toLowerCase()] = symbol;
      
      // Add common variations
      if (cleanName.includes(' ')) {
        // Add without spaces
        indianStocks[cleanName.replace(/\s+/g, '')] = symbol;
        
        // Add individual words for partial matching
        const words = cleanName.split(/\s+/);
        if (words.length === 2 && words[0].length > 2 && words[1].length > 2) {
          indianStocks[words[0]] = symbol;
        }
      }
    });
    
    // Save raw data
    const rawFile = path.join(__dirname, 'all-companies-raw.json');
    fs.writeFileSync(rawFile, JSON.stringify(companiesArray, null, 2));
    
    // Save formatted for our codebase
    const formattedFile = path.join(__dirname, 'indian-stocks-database.js');
    const jsContent = `// Auto-generated Indian stocks database
// Scraped from screener.in on ${new Date().toISOString()}
// Total companies: ${companiesArray.length}

export const INDIAN_STOCKS = ${JSON.stringify(indianStocks, null, 2)};

// Raw company data
export const ALL_COMPANIES = ${JSON.stringify(companiesArray, null, 2)};
`;
    
    fs.writeFileSync(formattedFile, jsContent);
    
    console.log(`💾 Saved ${companiesArray.length} companies to files:`);
    console.log(`   📄 Raw data: ${rawFile}`);
    console.log(`   📄 Formatted: ${formattedFile}`);
    
    return {
      totalCompanies: companiesArray.length,
      indianStocks: indianStocks,
      allCompanies: companiesArray
    };
  }
}

// Run the scraper
async function main() {
  const scraper = new CompanyScraper();
  
  try {
    const result = await scraper.scrapeAllCompanies();
    console.log('🎉 Scraping completed successfully!');
    console.log(`📊 Total companies: ${result.totalCompanies}`);
    console.log(`📊 Database entries: ${Object.keys(result.indianStocks).length}`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
  }
}

// Export for use in other scripts
module.exports = { CompanyScraper };

// Run if called directly
if (require.main === module) {
  main();
}