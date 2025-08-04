/**
 * Read and process the comprehensive company list from Excel file
 * Create smart matching logic based on actual company names and symbols
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class ExcelCompanyProcessor {
  constructor() {
    this.companies = [];
    this.companyMap = new Map();
    this.symbolToCompany = new Map();
    this.searchIndex = new Map(); // For fast searching
  }

  readExcelFile() {
    try {
      const filePath = path.join(__dirname, '..', 'Average MCAP_July2024ToDecember 2024.xlsx');
      console.log(`📖 Reading Excel file: ${filePath}`);
      
      // Read the workbook
      const workbook = XLSX.readFile(filePath);
      console.log(`📊 Available sheets: ${workbook.SheetNames.join(', ')}`);
      
      // Get the first sheet (or specify sheet name if needed)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      console.log(`📈 Found ${data.length} rows of data`);
      
      // Analyze the first few rows to understand structure
      console.log('\n🔍 Analyzing data structure...');
      if (data.length > 0) {
        console.log('📋 Column names:', Object.keys(data[0]));
        console.log('📝 Sample row:', data[0]);
        
        if (data.length > 1) {
          console.log('📝 Second row:', data[1]);
        }
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Error reading Excel file:', error.message);
      return [];
    }
  }

  processCompanyData(rawData) {
    console.log('\n🔄 Processing company data...');
    
    // Try to identify symbol and company name columns
    const sampleRow = rawData[0];
    const columns = Object.keys(sampleRow);
    
    // Common column names for symbols and company names
    const symbolColumns = ['symbol', 'Symbol', 'SYMBOL', 'Code', 'code', 'Stock Code', 'Ticker'];
    const nameColumns = ['name', 'Name', 'NAME', 'Company Name', 'Company', 'company', 'Security Name'];
    
    let symbolColumn = null;
    let nameColumn = null;
    
    // Find symbol column
    for (const col of symbolColumns) {
      if (columns.includes(col)) {
        symbolColumn = col;
        break;
      }
    }
    
    // Find name column
    for (const col of nameColumns) {
      if (columns.includes(col)) {
        nameColumn = col;
        break;
      }
    }
    
    // If not found, try to guess based on content
    if (!symbolColumn || !nameColumn) {
      console.log('🔍 Column names not standard, analyzing content...');
      
      // Analyze first few rows to guess columns
      const firstRow = rawData[0];
      for (const [key, value] of Object.entries(firstRow)) {
        const strValue = String(value).trim();
        
        // Symbol column likely has short uppercase codes
        if (!symbolColumn && strValue.length <= 10 && /^[A-Z0-9&-]+$/.test(strValue)) {
          symbolColumn = key;
          console.log(`🎯 Guessed symbol column: "${key}" (sample: "${strValue}")`);
        }
        
        // Name column likely has longer descriptive text
        if (!nameColumn && strValue.length > 10 && /[a-z]/.test(strValue)) {
          nameColumn = key;
          console.log(`🎯 Guessed name column: "${key}" (sample: "${strValue}")`);
        }
      }
    }
    
    console.log(`📊 Using columns - Symbol: "${symbolColumn}", Name: "${nameColumn}"`);
    
    if (!symbolColumn || !nameColumn) {
      console.error('❌ Could not identify symbol and name columns');
      console.log('Available columns:', columns);
      return [];
    }
    
    // Process each row
    const processed = [];
    let validCount = 0;
    
    rawData.forEach((row, index) => {
      const symbol = String(row[symbolColumn] || '').trim().toUpperCase();
      const name = String(row[nameColumn] || '').trim();
      
      if (symbol && name && symbol !== 'SYMBOL' && name !== 'NAME') {
        // Clean up the company name
        const cleanName = this.cleanCompanyName(name);
        
        const company = {
          symbol: symbol,
          name: name,
          cleanName: cleanName,
          searchTerms: this.generateSearchTerms(name, symbol)
        };
        
        processed.push(company);
        validCount++;
        
        // Store in maps for fast lookup
        this.symbolToCompany.set(symbol, company);
        this.companyMap.set(cleanName.toLowerCase(), company);
        
        // Add to search index
        company.searchTerms.forEach(term => {
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, []);
          }
          this.searchIndex.get(term).push(company);
        });
      }
    });
    
    console.log(`✅ Processed ${validCount} valid companies out of ${rawData.length} rows`);
    this.companies = processed;
    return processed;
  }

  cleanCompanyName(name) {
    return name
      .toLowerCase()
      .replace(/\s+ltd\.?$/i, '')
      .replace(/\s+limited$/i, '')
      .replace(/\s+pvt\.?$/i, '')
      .replace(/\s+private$/i, '')
      .replace(/\s+inc\.?$/i, '')
      .replace(/\s+corporation$/i, '')
      .replace(/\s+corp\.?$/i, '')
      .replace(/\s+company$/i, '')
      .replace(/\s+co\.?$/i, '')
      .replace(/&/g, 'and')
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateSearchTerms(name, symbol) {
    const terms = new Set();
    
    // Add symbol
    terms.add(symbol.toLowerCase());
    
    // Add full name
    terms.add(name.toLowerCase());
    
    // Add cleaned name
    const cleanName = this.cleanCompanyName(name);
    terms.add(cleanName);
    
    // Add individual words (for partial matching)
    const words = cleanName.split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => terms.add(word));
    
    // Add without spaces
    terms.add(cleanName.replace(/\s+/g, ''));
    
    // Special handling for common company patterns
    if (cleanName.includes('bank')) {
      terms.add(cleanName.replace('bank', '').trim());
    }
    
    if (cleanName.includes('industries')) {
      terms.add(cleanName.replace('industries', '').trim());
    }
    
    if (cleanName.includes('limited')) {
      terms.add(cleanName.replace('limited', '').trim());
    }
    
    // Special cases for well-known companies
    if (symbol === 'LT' || cleanName.includes('larsen') || cleanName.includes('toubro')) {
      terms.add('l&t');
      terms.add('larsen');
      terms.add('toubro');
      terms.add('larsen toubro');
      terms.add('larsen and toubro');
    }
    
    if (symbol === 'HDFCBANK' || cleanName.includes('hdfc bank')) {
      terms.add('hdfc');
      terms.add('hdfc bank');
      terms.add('housing development finance');
    }
    
    if (symbol === 'ICICIBANK' || cleanName.includes('icici bank')) {
      terms.add('icici');
      terms.add('icici bank');
    }
    
    if (symbol === 'TCS' || cleanName.includes('tata consultancy')) {
      terms.add('tcs');
      terms.add('tata consultancy');
      terms.add('tata consultancy services');
    }
    
    if (symbol === 'INFY' || cleanName.includes('infosys')) {
      terms.add('infy');
      terms.add('infosys');
    }
    
    if (symbol === 'RELIANCE' || cleanName.includes('reliance industries')) {
      terms.add('reliance');
      terms.add('ril');
      terms.add('reliance industries');
      terms.add('jio');
      terms.add('reliance jio');
    }
    
    // Add common abbreviations and variations
    if (cleanName.includes('&')) {
      // Handle companies with & in name
      const withAnd = cleanName.replace(/&/g, 'and');
      terms.add(withAnd);
      
      const withoutAnd = cleanName.replace(/\s*&\s*/g, '');
      terms.add(withoutAnd);
    }
    
    // Add acronyms for multi-word companies
    if (words.length >= 2) {
      const acronym = words.map(word => word[0]).join('').toLowerCase();
      if (acronym.length >= 2 && acronym.length <= 6) {
        terms.add(acronym);
      }
    }
    
    // Add brand names for well-known companies
    if (cleanName.includes('hindustan unilever')) {
      terms.add('hul');
      terms.add('unilever');
    }
    
    if (cleanName.includes('state bank of india')) {
      terms.add('sbi');
      terms.add('state bank');
    }
    
    if (cleanName.includes('bharti airtel')) {
      terms.add('airtel');
      terms.add('bharti');
    }
    
    return Array.from(terms);
  }

  createSmartMatcher() {
    console.log('\n🧠 Creating smart matching logic...');
    
    // Enhanced stop words list
    const stopWords = new Set([
      'i', 'should', 'buy', 'sell', 'invest', 'stock', 'share', 'shares', 'equity', 'now', 'today',
      'analysis', 'recommendation', 'price', 'target', 'good', 'bad', 'investment', 'the', 'a', 'an',
      'is', 'are', 'was', 'were', 'what', 'when', 'where', 'why', 'how', 'about', 'for', 'on', 'in',
      'can', 'could', 'will', 'would', 'shall', 'may', 'might', 'do', 'does', 'did', 'have', 'has', 'had',
      'be', 'been', 'being', 'to', 'at', 'by', 'from', 'with', 'into', 'during', 'before', 'after',
      'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
      'vs', 'versus', 'or', 'and', 'but', 'if', 'worth', 'better', 'best', 'worst', 'compare', 'comparison'
    ]);

    const matcher = {
      findBestMatch: (query) => {
        const cleanQuery = query.toLowerCase().trim();
        console.log(`🔍 Searching for: "${cleanQuery}"`);
        
        // Step 1: Remove stop words and extract meaningful terms
        const words = cleanQuery.split(/\s+/);
        const meaningfulWords = words.filter(word => {
          const cleanWord = word.replace(/[^\w]/g, '');
          return cleanWord.length > 2 && !stopWords.has(cleanWord);
        });
        
        console.log(`📝 Meaningful words: ${meaningfulWords.join(', ')}`);
        
        if (meaningfulWords.length === 0) {
          return null;
        }
        
        // Step 2: Direct symbol lookup
        for (const word of meaningfulWords) {
          const upperWord = word.toUpperCase();
          if (this.symbolToCompany.has(upperWord)) {
            console.log(`✅ Direct symbol match: ${upperWord}`);
            return this.symbolToCompany.get(upperWord);
          }
        }
        
        // Step 3: Search index lookup (exact matches)
        const candidates = new Map(); // symbol -> score
        
        for (const word of meaningfulWords) {
          const lowerWord = word.toLowerCase();
          if (this.searchIndex.has(lowerWord)) {
            this.searchIndex.get(lowerWord).forEach(company => {
              const current = candidates.get(company.symbol) || 0;
              candidates.set(company.symbol, current + 10); // Exact word match
            });
          }
        }
        
        // Step 4: Partial matching
        const queryStr = meaningfulWords.join(' ').toLowerCase();
        
        this.companies.forEach(company => {
          if (candidates.has(company.symbol)) return; // Already scored
          
          let score = 0;
          
          // Check if company name contains any meaningful word
          for (const word of meaningfulWords) {
            if (company.cleanName.includes(word.toLowerCase())) {
              score += 5;
            }
            if (company.name.toLowerCase().includes(word.toLowerCase())) {
              score += 3;
            }
          }
          
          // Check if query contains company words
          const companyWords = company.cleanName.split(/\s+/);
          for (const companyWord of companyWords) {
            if (companyWord.length > 2 && queryStr.includes(companyWord)) {
              score += 7;
            }
          }
          
          if (score > 0) {
            candidates.set(company.symbol, score);
          }
        });
        
        // Step 5: Find best match
        if (candidates.size === 0) {
          console.log('❌ No matches found');
          return null;
        }
        
        // Sort by score
        const sorted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]);
        const bestMatch = this.symbolToCompany.get(sorted[0][0]);
        
        console.log(`🎯 Best match: ${bestMatch.name} (${bestMatch.symbol}) - Score: ${sorted[0][1]}`);
        
        // Show top 3 matches for debugging
        if (sorted.length > 1) {
          console.log('🔝 Top matches:');
          sorted.slice(0, 3).forEach((entry, index) => {
            const company = this.symbolToCompany.get(entry[0]);
            console.log(`   ${index + 1}. ${company.name} (${company.symbol}) - Score: ${entry[1]}`);
          });
        }
        
        return bestMatch;
      }
    };
    
    return matcher;
  }

  generateUpdatedStockAnalysisCode() {
    console.log('\n📝 Generating updated stock analysis code...');
    
    // Create a mapping for the INDIAN_STOCKS object
    const stockMapping = {};
    
    this.companies.forEach(company => {
      // Add all search terms pointing to the symbol
      company.searchTerms.forEach(term => {
        if (term.length > 1) { // Skip single characters
          stockMapping[term] = company.symbol;
        }
      });
    });
    
    // Generate TypeScript code
    let code = `  // Comprehensive Indian stock database loaded from Excel (${this.companies.length} companies)\n`;
    code += `  // Auto-generated from: Average MCAP_July2024ToDecember 2024.xlsx\n`;
    code += `  private static readonly EXCEL_COMPANIES = ${JSON.stringify(this.companies, null, 2)};\n\n`;
    
    code += `  // Smart matching index for fast lookups\n`;
    code += `  private static readonly COMPANY_SEARCH_INDEX = new Map([\n`;
    
    // Add search index entries
    for (const [term, companies] of this.searchIndex.entries()) {
      if (term.length > 1) {
        const symbols = companies.map(c => c.symbol);
        code += `    ['${term}', ${JSON.stringify(symbols)}],\n`;
      }
    }
    
    code += `  ]);\n\n`;
    
    code += `  // Symbol to company mapping\n`;
    code += `  private static readonly SYMBOL_TO_COMPANY = new Map([\n`;
    
    this.companies.forEach(company => {
      code += `    ['${company.symbol}', ${JSON.stringify(company)}],\n`;
    });
    
    code += `  ]);\n`;
    
    return code;
  }

  saveResults() {
    console.log('\n💾 Saving results...');
    
    // Save processed companies as JSON
    const companiesFile = path.join(__dirname, 'excel-companies.json');
    fs.writeFileSync(companiesFile, JSON.stringify(this.companies, null, 2));
    console.log(`📄 Saved ${this.companies.length} companies to: ${companiesFile}`);
    
    // Save search index
    const searchIndexFile = path.join(__dirname, 'search-index.json');
    const indexData = Object.fromEntries(this.searchIndex);
    fs.writeFileSync(searchIndexFile, JSON.stringify(indexData, null, 2));
    console.log(`🔍 Saved search index to: ${searchIndexFile}`);
    
    // Save generated code
    const codeFile = path.join(__dirname, 'excel-based-stock-code.ts');
    const generatedCode = this.generateUpdatedStockAnalysisCode();
    fs.writeFileSync(codeFile, generatedCode);
    console.log(`📝 Saved generated code to: ${codeFile}`);
    
    // Save statistics
    const stats = {
      totalCompanies: this.companies.length,
      uniqueSymbols: this.symbolToCompany.size,
      searchTerms: this.searchIndex.size,
      averageTermsPerCompany: (this.searchIndex.size / this.companies.length).toFixed(2),
      generatedAt: new Date().toISOString()
    };
    
    const statsFile = path.join(__dirname, 'excel-processing-stats.json');
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`📊 Saved statistics to: ${statsFile}`);
    
    return stats;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Excel company processing...');
  
  const processor = new ExcelCompanyProcessor();
  
  // Read Excel file
  const rawData = processor.readExcelFile();
  if (rawData.length === 0) {
    console.error('❌ No data found in Excel file');
    return;
  }
  
  // Process company data
  const companies = processor.processCompanyData(rawData);
  if (companies.length === 0) {
    console.error('❌ No valid companies processed');
    return;
  }
  
  // Create smart matcher
  const matcher = processor.createSmartMatcher();
  
  // Test the matcher
  console.log('\n🧪 Testing smart matcher...');
  const testQueries = [
    'Can I buy swiggy shares now?',
    'HDFC bank stock analysis',
    'Reliance Industries share price',
    'TCS vs Infosys comparison',
    'Zomato stock worth buying?',
    'Nykaa IPO investment',
    'Asian Paints vs Berger',
    'L&T construction'
  ];
  
  testQueries.forEach(query => {
    const result = matcher.findBestMatch(query);
    if (result) {
      console.log(`✅ "${query}" → ${result.name} (${result.symbol})`);
    } else {
      console.log(`❌ "${query}" → No match found`);
    }
    console.log('');
  });
  
  // Save results
  const stats = processor.saveResults();
  
  console.log('\n🎉 Processing completed successfully!');
  console.log(`📊 Statistics:`);
  console.log(`   📈 Total companies: ${stats.totalCompanies}`);
  console.log(`   🔢 Unique symbols: ${stats.uniqueSymbols}`);
  console.log(`   🔍 Search terms: ${stats.searchTerms}`);
  console.log(`   📊 Avg terms per company: ${stats.averageTermsPerCompany}`);
}

// Export for use in other scripts
module.exports = { ExcelCompanyProcessor };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}