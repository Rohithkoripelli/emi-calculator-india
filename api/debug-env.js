// Debug Environment Variables API
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const envVars = {
      // Frontend environment variables (REACT_APP_ prefix)
      REACT_APP_GROWW_API_KEY: process.env.REACT_APP_GROWW_API_KEY ? 'EXISTS' : 'MISSING',
      REACT_APP_GROWW_TOTP_SECRET: process.env.REACT_APP_GROWW_TOTP_SECRET ? 'EXISTS' : 'MISSING',
      REACT_APP_GROWW_ACCESS_TOKEN: process.env.REACT_APP_GROWW_ACCESS_TOKEN ? 'EXISTS' : 'MISSING',
      
      // Backend environment variables (no prefix)
      GROWW_API_KEY: process.env.GROWW_API_KEY ? 'EXISTS' : 'MISSING',
      GROWW_TOTP_SECRET: process.env.GROWW_TOTP_SECRET ? 'EXISTS' : 'MISSING',
      GROWW_ACCESS_TOKEN: process.env.GROWW_ACCESS_TOKEN ? 'EXISTS' : 'MISSING',
      
      // All available GROWW-related env vars
      allGrowwEnvKeys: Object.keys(process.env).filter(key => key.includes('GROWW')),
      
      // Test values (first 10 characters only for security)
      testApiKey: process.env.REACT_APP_GROWW_API_KEY ? process.env.REACT_APP_GROWW_API_KEY.substring(0, 10) + '...' : 'N/A',
      testTotpSecret: process.env.REACT_APP_GROWW_TOTP_SECRET ? process.env.REACT_APP_GROWW_TOTP_SECRET.substring(0, 10) + '...' : 'N/A',
    };
    
    return res.status(200).json({ 
      success: true,
      message: 'Environment variables debug info',
      data: envVars
    });

  } catch (error) {
    console.error('Debug Environment Variables Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug failed',
      message: error.message
    });
  }
};