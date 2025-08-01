// Check current setup status and provide clear next steps
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
    const apiSecret = process.env.GROWW_API_SECRET;
    
    const status = {
      timestamp: new Date().toISOString(),
      currentSetup: {
        hasAccessToken: !!accessToken,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        accessTokenLength: accessToken ? accessToken.length : 0,
        apiKeyType: apiKey ? (apiKey.startsWith('eyJ') ? 'JWT Token' : 'Unknown') : 'None'
      }
    };

    // Determine setup status and next steps
    if (accessToken) {
      status.setupStatus = '✅ READY TO TEST';
      status.nextStep = {
        action: 'Test your access token',
        instruction: 'Visit /api/token-test to verify your setup works',
        url: '/api/token-test'
      };
      
      // Quick test of the access token
      try {
        const testResponse = await fetch('https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=NIFTY', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-API-VERSION': '1.0',
            'Accept': 'application/json'
          }
        });
        
        status.quickTest = {
          status: testResponse.status,
          working: testResponse.ok,
          message: testResponse.ok ? '✅ Access token is working!' : `❌ Error ${testResponse.status}`
        };
      } catch (error) {
        status.quickTest = {
          error: error.message,
          working: false,
          message: '❌ Network error during test'
        };
      }
      
    } else if (apiKey && apiSecret) {
      status.setupStatus = '⚠️ OUTDATED SETUP';
      status.nextStep = {
        action: 'Generate proper access token',
        instruction: 'TOTP endpoints don\'t work publicly. You need a direct access token.',
        steps: [
          '1. Go to https://groww.in/user/profile/trading-apis',
          '2. Click "Generate New Token" (not API Key)',
          '3. Set GROWW_ACCESS_TOKEN environment variable',
          '4. Remove GROWW_API_KEY and GROWW_API_SECRET'
        ]
      };
      
    } else {
      status.setupStatus = '❌ NOT CONFIGURED';
      status.nextStep = {
        action: 'Complete initial setup',
        instruction: 'No Groww API credentials found',
        steps: [
          '1. Go to https://groww.in/user/profile/trading-apis',
          '2. Generate an access token',
          '3. Set GROWW_ACCESS_TOKEN environment variable',
          '4. Redeploy your application'
        ]
      };
    }

    return res.status(200).json(status);

  } catch (error) {
    return res.status(500).json({
      error: 'Setup check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};