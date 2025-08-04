/**
 * Generate comprehensive stock database for the main application
 */

const { COMPREHENSIVE_INDIAN_STOCKS } = require('./comprehensive-stock-database.js');

function generateStockDatabaseCode() {
  const entries = Object.entries(COMPREHENSIVE_INDIAN_STOCKS);
  
  // Sort entries for better organization
  entries.sort((a, b) => a[1].localeCompare(b[1]));
  
  // Format as TypeScript code
  let code = `  // Comprehensive Indian stock symbols database (${entries.length} entries)\n`;
  code += `  // Auto-generated from comprehensive database\n`;
  code += `  private static readonly INDIAN_STOCKS = {\n`;
  
  entries.forEach(([key, symbol], index) => {
    code += `    '${key}': '${symbol}'`;
    if (index < entries.length - 1) {
      code += ',';
    }
    code += '\n';
  });
  
  code += `  };\n`;
  
  return code;
}

function generateStats() {
  const totalEntries = Object.keys(COMPREHENSIVE_INDIAN_STOCKS).length;
  const uniqueSymbols = new Set(Object.values(COMPREHENSIVE_INDIAN_STOCKS));
  
  console.log(`📊 Database Statistics:`);
  console.log(`   Total entries: ${totalEntries}`);
  console.log(`   Unique symbols: ${uniqueSymbols.size}`);
  console.log(`   Average variations per symbol: ${(totalEntries / uniqueSymbols.size).toFixed(1)}`);
  
  // Count by symbol frequency
  const symbolCounts = {};
  Object.values(COMPREHENSIVE_INDIAN_STOCKS).forEach(symbol => {
    symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
  });
  
  const topSymbols = Object.entries(symbolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`\n🔝 Top 10 symbols with most variations:`);
  topSymbols.forEach(([symbol, count]) => {
    console.log(`   ${symbol}: ${count} variations`);
  });
  
  return {
    totalEntries,
    uniqueSymbols: uniqueSymbols.size,
    topSymbols
  };
}

function saveToFile() {
  const code = generateStockDatabaseCode();
  const fs = require('fs');
  const path = require('path');
  
  const outputFile = path.join(__dirname, 'generated-stock-database.ts');
  fs.writeFileSync(outputFile, code);
  
  console.log(`\n💾 Generated stock database code saved to: ${outputFile}`);
  console.log(`\n📋 Copy the generated code and replace the INDIAN_STOCKS object in stockAnalysisApi.ts`);
  
  return outputFile;
}

// Run the generation
console.log('🚀 Generating comprehensive stock database...');
generateStats();
saveToFile();

// Also provide sample test cases
console.log(`\n🧪 Sample test cases for validation:`);
const testCases = [
  'Can I buy swiggy shares now?',
  'HDFC bank stock analysis',
  'Tata Consultancy Services investment',
  'Reliance Industries share price',
  'Should I invest in Zomato?',
  'Nykaa stock recommendation',
  'Apollo hospitals share analysis',
  'Bajaj Finance stock review'
];

testCases.forEach(testCase => {
  const words = testCase.toLowerCase().split(/\s+/);
  const found = words.find(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    return COMPREHENSIVE_INDIAN_STOCKS[cleanWord];
  });
  
  if (found) {
    const cleanFound = found.replace(/[^\w]/g, '');
    console.log(`   "${testCase}" -> Should find: ${COMPREHENSIVE_INDIAN_STOCKS[cleanFound]}`);
  } else {
    console.log(`   "${testCase}" -> Manual check needed`);
  }
});

module.exports = {
  generateStockDatabaseCode,
  generateStats,
  COMPREHENSIVE_INDIAN_STOCKS
};