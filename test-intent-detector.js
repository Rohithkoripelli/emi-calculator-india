/**
 * Test script to verify the IntelligentInvestmentDetector improvements
 * This tests if the detector correctly identifies top stocks and market cap queries
 */

// Import the detector - we'll use a simple require since it's compiled to JS
const { IntelligentInvestmentDetector } = require('./emi-calculator-app/src/services/intelligentInvestmentDetector.ts');

// Test queries that should trigger TOP_STOCKS strategy
const testQueries = [
  {
    query: "Give me some trending stocks to buy right now?",
    expected: "TOP_STOCKS",
    expectedCategory: "all"
  },
  {
    query: "I want to invest in Large Cap companies",
    expected: "TOP_STOCKS",
    expectedCategory: "large"
  },
  {
    query: "Show me best mid cap stocks",
    expected: "TOP_STOCKS",
    expectedCategory: "mid"
  },
  {
    query: "What are the top small cap stocks?",
    expected: "TOP_STOCKS",
    expectedCategory: "small"
  },
  {
    query: "I have 50000 to invest in stocks",
    expected: "RAILWAY_API",
    expectedCategory: undefined
  },
  {
    query: "Trending stocks in IT sector",
    expected: "TOP_STOCKS",
    expectedCategory: "all"
  }
];

console.log('🧪 Testing IntelligentInvestmentDetector for TOP_STOCKS queries\n');
console.log('='.repeat(80));
console.log('\n');

testQueries.forEach((test, index) => {
  console.log(`\n📝 Test ${index + 1}: "${test.query}"\n`);

  const result = IntelligentInvestmentDetector.detectInvestmentIntent(test.query);

  const strategyMatch = result.recommendationStrategy === test.expected;
  const categoryMatch = result.extractedParams.marketCapCategory === test.expectedCategory;

  console.log(`Strategy: ${result.recommendationStrategy} ${strategyMatch ? '✅' : '❌ (expected: ' + test.expected + ')'}`);
  console.log(`Category: ${result.extractedParams.marketCapCategory || 'none'} ${categoryMatch ? '✅' : '❌ (expected: ' + test.expectedCategory + ')'}`);
  console.log(`Intent Type: ${result.intentType}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Reasoning: ${result.reasoning.join(' | ')}`);
  console.log('-'.repeat(80));
});

console.log('\n\n✅ Test completed! Check results above.\n');
