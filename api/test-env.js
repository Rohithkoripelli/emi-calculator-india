// Simple test endpoint to verify environment variables are accessible
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;
    
    const allEnvKeys = Object.keys(process.env);
    const growwKeys = allEnvKeys.filter(key => key.includes('GROWW'));
    
    console.log('Environment test - All env keys count:', allEnvKeys.length);
    console.log('Environment test - Groww keys found:', growwKeys);
    console.log('Environment test - API Key exists:', !!apiKey);
    console.log('Environment test - API Secret exists:', !!apiSecret);
    
    return res.status(200).json({
      success: true,
      environment: {
        totalEnvVars: allEnvKeys.length,
        growwEnvVars: growwKeys,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiSecretLength: apiSecret ? apiSecret.length : 0,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
    
  } catch (error) {
    console.error('Environment test error:', error);
    return res.status(500).json({
      error: 'Environment test failed',
      message: error.message
    });
  }
};