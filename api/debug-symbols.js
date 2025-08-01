// Test individual symbols to find the correct trading symbols
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const accessToken = process.env.GROWW_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'No access token' });
    }

    // Test different trading symbols for NIFTY
    const symbolsToTest = [
      { name: 'NIFTY (Original)', symbol: 'NIFTY' },
      { name: 'NIFTY 50', symbol: 'NIFTY_50' },
      { name: 'NIFTY50', symbol: 'NIFTY50' },
      { name: 'Nifty 50', symbol: 'Nifty 50' },
      { name: 'SENSEX', symbol: 'SENSEX' },
      { name: 'BSE SENSEX', symbol: 'BSE_SENSEX' },
      { name: 'BANKNIFTY', symbol: 'BANKNIFTY' },
      { name: 'NIFTY BANK', symbol: 'NIFTY_BANK' },
      { name: 'BANK NIFTY', symbol: 'BANK_NIFTY' }
    ];

    const results = [];

    for (const testSymbol of symbolsToTest) {
      try {
        const url = `https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${testSymbol.symbol}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-API-VERSION': '1.0',
            'Accept': 'application/json'
          }
        });

        const data = await response.json();
        
        results.push({
          name: testSymbol.name,
          symbol: testSymbol.symbol,
          url: url,
          status: response.status,
          success: response.ok,
          hasData: !!(data.payload?.last_price),
          price: data.payload?.last_price || null,
          response: response.ok ? data : { error: data }
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          name: testSymbol.name,
          symbol: testSymbol.symbol,
          status: 'error',
          success: false,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Symbol testing results',
      results: results,
      workingSymbols: results.filter(r => r.success && r.hasData),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};