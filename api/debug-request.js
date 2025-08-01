// Debug what symbols and parameters are being sent to the backend
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Log exactly what the frontend is sending
    const requestData = {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    };

    console.log('=== DEBUG REQUEST ===');
    console.log('Full request data:', JSON.stringify(requestData, null, 2));

    // Extract symbols like the real API does
    const { symbols, type = 'quote' } = req.method === 'GET' ? req.query : req.body;
    const symbolList = Array.isArray(symbols) ? symbols : symbols ? symbols.split(',') : [];
    
    console.log('Parsed symbols:', symbolList);
    console.log('Request type:', type);

    // Check symbol mappings
    const SYMBOL_MAPPING = {
      '^NSEI': { tradingSymbol: 'NIFTY', name: 'NIFTY 50' },
      '^BSESN': { tradingSymbol: 'SENSEX', name: 'BSE SENSEX' },
      '^CNXBANK': { tradingSymbol: 'BANKNIFTY', name: 'NIFTY Bank' }
    };

    const mappingResults = symbolList.map(symbol => ({
      originalSymbol: symbol,
      mapping: SYMBOL_MAPPING[symbol] || null,
      hasMaping: !!SYMBOL_MAPPING[symbol]
    }));

    return res.status(200).json({
      message: 'Request debug information',
      requestData,
      parsedSymbols: symbolList,
      symbolCount: symbolList.length,
      mappingResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      requestInfo: {
        method: req.method,
        hasBody: !!req.body,
        hasQuery: !!req.query
      },
      timestamp: new Date().toISOString()
    });
  }
};