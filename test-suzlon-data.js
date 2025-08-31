/**
 * Test SUZLON data extraction from our webfetch API
 */

async function testSuzlonData() {
  try {
    console.log('🧪 Testing SUZLON data extraction from webfetch API...\n');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/webfetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stockSymbol: 'SUZLON',
        url: 'https://www.screener.in/company/SUZLON/consolidated/',
        prompt: 'Extract comprehensive financial metrics from Screener.in'
      })
    });
    
    console.log(`📡 API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📊 SUZLON API Response:');
    console.log('===============================================');
    console.log(JSON.stringify(data, null, 2));
    console.log('===============================================');
    
    if (data.success && data.data) {
      const financialData = data.data;
      
      console.log('\n🎯 SUZLON Financial Metrics Summary:');
      console.log('=====================================');
      console.log(`Company Name: ${financialData.companyName || 'N/A'}`);
      console.log(`Market Cap: ${financialData.marketCap || 'N/A'}`);
      console.log(`Current Price: ₹${financialData.currentPrice || 'N/A'}`);
      console.log(`EPS: ₹${financialData.eps || 'N/A'}`);
      console.log(`P/E Ratio: ${financialData.pe || 'N/A'}`);
      console.log(`ROE: ${financialData.roe || 'N/A'}%`);
      console.log(`ROCE: ${financialData.roce || 'N/A'}%`);
      console.log(`Book Value: ₹${financialData.bookValue || 'N/A'}`);
      console.log(`Dividend Yield: ${financialData.dividendYield || 'N/A'}%`);
      console.log(`Face Value: ₹${financialData.faceValue || 'N/A'}`);
      
      if (financialData.shareholdingPattern) {
        console.log('\n👥 Shareholding Pattern:');
        financialData.shareholdingPattern.forEach(holding => {
          console.log(`  ${holding.category}: ${holding.percentage}%`);
        });
      }
      
      console.log(`\nExtraction Method: ${financialData.extractionMethod || 'N/A'}`);
      console.log(`Last Updated: ${financialData.lastUpdated || 'N/A'}`);
      
      // Validate accuracy against known values
      console.log('\n🎯 ACCURACY VALIDATION:');
      console.log('=====================================');
      const expectedValues = {
        marketCap: "₹76,723 Cr",
        currentPrice: 56.4,
        pe: 36.6,
        roe: 41.3,
        roce: 32.4,
        bookValue: 4.51,
        faceValue: 2,
        shareholding: {
          'Promoters': 11.75,
          'FII': 23.02,
          'DII': 10.17,
          'Public': 55.07
        }
      };
      
      // Check basic metrics
      const checks = [
        { key: 'marketCap', actual: financialData.marketCap, expected: expectedValues.marketCap },
        { key: 'currentPrice', actual: financialData.currentPrice, expected: expectedValues.currentPrice },
        { key: 'pe', actual: financialData.pe, expected: expectedValues.pe },
        { key: 'roe', actual: financialData.roe, expected: expectedValues.roe },
        { key: 'roce', actual: financialData.roce, expected: expectedValues.roce },
        { key: 'bookValue', actual: financialData.bookValue, expected: expectedValues.bookValue },
        { key: 'faceValue', actual: financialData.faceValue, expected: expectedValues.faceValue }
      ];
      
      checks.forEach(check => {
        if (check.actual !== undefined) {
          let isMatch = false;
          if (typeof check.expected === 'string') {
            isMatch = check.actual === check.expected;
          } else {
            isMatch = Math.abs(parseFloat(check.actual) - parseFloat(check.expected)) < 0.01;
          }
          console.log(`${check.key}: ${check.actual} (Expected: ${check.expected}) ${isMatch ? '✅' : '❌'}`);
        } else {
          console.log(`${check.key}: NOT EXTRACTED ❌ (Expected: ${check.expected})`);
        }
      });
      
      // Check shareholding accuracy
      if (financialData.shareholdingPattern) {
        console.log('\nShareholding Pattern Accuracy:');
        financialData.shareholdingPattern.forEach(actual => {
          const expected = expectedValues.shareholding[actual.category];
          if (expected) {
            const isAccurate = Math.abs(actual.percentage - expected) < 0.01;
            console.log(`  ${actual.category}: ${actual.percentage}% (Expected: ${expected}%) ${isAccurate ? '✅' : '❌'}`);
          } else {
            console.log(`  ${actual.category}: ${actual.percentage}% (Unexpected category) ⚠️`);
          }
        });
      } else {
        console.log('Shareholding Pattern: NOT EXTRACTED ❌');
      }
      
    } else {
      console.log('❌ API returned unsuccessful response or no data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSuzlonData();