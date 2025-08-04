// Test specifically for access token approach
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const accessToken = process.env.GROWW_ACCESS_TOKEN;
    const apiKey = process.env.GROWW_API_KEY;
    
    const result = {
      step1_check: {
        hasAccessToken: !!accessToken,
        hasApiKey: !!apiKey,
        accessTokenLength: accessToken ? accessToken.length : 0,
        apiKeyLength: apiKey ? apiKey.length : 0,
        availableKeys: Object.keys(process.env).filter(key => key.includes('GROWW'))
      }
    };

    if (!accessToken) {
      return res.status(400).json({
        error: 'Missing GROWW_ACCESS_TOKEN',
        message: 'Please generate an Access Token (NOT API Key) from https://groww.in/user/profile/trading-apis and set it as GROWW_ACCESS_TOKEN environment variable',
        result
      });
    }

    // Test access token with live data endpoint
    const testUrl = 'https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=NIFTY';
    
    console.log('Testing with access token:', accessToken.substring(0, 20) + '...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-VERSION': '1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { rawText: text };
    }

    result.step2_test = {
      url: testUrl,
      status: response.status,
      success: response.ok,
      data: data
    };

    if (response.ok && data.status === 'SUCCESS') {
      result.conclusion = '✅ SUCCESS! Access token works for live data';
    } else if (response.status === 403) {
      result.conclusion = '❌ Access token found but forbidden - may need live data permissions';
    } else {
      result.conclusion = `❌ Access token test failed with status ${response.status}`;
    }

    return res.status(200).json({
      success: response.ok,
      message: result.conclusion,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};