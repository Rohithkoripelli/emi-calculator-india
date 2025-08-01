// Test if the app fix works by simulating the same calls
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Simulate the app calling the backend
    const symbols = ['^NSEI', '^BSESN', '^CNXBANK'];
    
    // Call our own backend endpoint
    const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/groww-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbols })
    });

    const data = await response.json();
    
    return res.status(200).json({
      message: 'App fix test results',
      backendResponse: {
        status: response.status,
        success: response.ok,
        data: data
      },
      diagnosis: {
        expectation: 'Should see data for NIFTY, SENSEX, BANKNIFTY with real prices',
        fixed: response.ok && data.success && Object.keys(data.data || {}).length > 0,
        nextStep: response.ok ? 'App should now work in browser!' : 'Check GROWW_ACCESS_TOKEN setup'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      diagnosis: {
        issue: 'Backend communication failed',
        nextStep: 'Check if GROWW_ACCESS_TOKEN is set correctly'
      },
      timestamp: new Date().toISOString()
    });
  }
};