// Test HTTP functionality - simple test endpoint
const https = require('https');
const { URL } = require('url');

// Simple HTTP request using built-in https module - same as groww-token.js
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const postData = options.body || '';
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': options.headers?.['Content-Type'] || 'application/json',
        'Accept': options.headers?.['Accept'] || 'application/json',
        'User-Agent': options.headers?.['User-Agent'] || 'TestAPI/1.0',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers
      }
    };

    console.log(`🌐 Making HTTP request to: ${url}`);

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      console.log(`📊 Response status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📦 Response received: ${data.length} characters`);
        
        const result = {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (parseError) {
              return Promise.reject(new Error(`Invalid JSON: ${data}`));
            }
          }
        };
        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP request error:', error);
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Testing HTTP functionality...');
    
    // Test with a reliable endpoint (httpbin.org)
    const testResponse = await makeHttpRequest('https://httpbin.org/json', {
      method: 'GET'
    });
    
    if (testResponse.ok) {
      const jsonData = await testResponse.json();
      console.log('✅ HTTP test successful');
      
      return res.status(200).json({ 
        success: true,
        message: 'HTTP functionality working',
        testData: jsonData,
        httpStatus: testResponse.status
      });
    } else {
      console.log('⚠️ HTTP test returned non-200 status');
      
      return res.status(200).json({ 
        success: false,
        message: 'HTTP test failed - non-200 status',
        httpStatus: testResponse.status
      });
    }

  } catch (error) {
    console.error('HTTP Test Error:', error);
    return res.status(500).json({
      success: false,
      error: 'HTTP test failed',
      message: error.message,
      errorType: error.constructor.name
    });
  }
};