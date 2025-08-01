// Serverless function to proxy Groww API requests and handle CORS
// This solves CORS issues when calling Groww API from browser

module.exports = async function handler(req, res) {
  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url, headers } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing url parameter' 
      });
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Make request to Groww API from server-side (no CORS restrictions)
    const response = await fetch(url, {
      method: 'GET',
      headers: headers || {},
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groww API Error:', errorText);
      return res.status(response.status).json({ 
        error: `Groww API Error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully proxied Groww API request');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy Service Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};