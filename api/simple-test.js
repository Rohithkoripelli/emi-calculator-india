// Extremely simple test to check what Groww API actually returns
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GROWW_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'No API key' });
    }

    // Test the official Groww API format
    const testUrl = 'https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=NIFTY';
    
    console.log('Testing URL:', testUrl);
    console.log('Using token:', apiKey.substring(0, 20) + '...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { rawText: text };
    }

    return res.status(200).json({
      testUrl,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};