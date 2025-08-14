// Test which Groww domains actually exist and respond
const https = require('https');
const { URL } = require('url');

// Simple HTTP request to test domain connectivity
function testDomain(url, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: timeout,
        headers: {
          'User-Agent': 'DomainTest/1.0'
        }
      };

      const req = https.request(requestOptions, (res) => {
        resolve({
          domain: parsedUrl.hostname,
          status: res.statusCode,
          reachable: true,
          headers: res.headers
        });
      });

      req.on('error', (error) => {
        resolve({
          domain: parsedUrl.hostname,
          status: null,
          reachable: false,
          error: error.code || error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          domain: parsedUrl.hostname,
          status: null,
          reachable: false,
          error: 'TIMEOUT'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        domain: 'unknown',
        status: null,
        reachable: false,
        error: error.message
      });
    }
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
    console.log('🧪 Testing Groww domain connectivity...');
    
    const domainsToTest = [
      'https://groww.in',
      'https://api.groww.in',
      'https://openapi.groww.in',
      'https://backend.groww.in',
      'https://trade-api.groww.in',
      'https://app.groww.in',
      'https://www.groww.in'
    ];
    
    console.log(`Testing ${domainsToTest.length} domains...`);
    
    const results = await Promise.all(
      domainsToTest.map(domain => testDomain(domain, 8000))
    );
    
    const reachableDomains = results.filter(r => r.reachable);
    const unreachableDomains = results.filter(r => !r.reachable);
    
    console.log(`✅ Reachable domains: ${reachableDomains.length}`);
    console.log(`❌ Unreachable domains: ${unreachableDomains.length}`);
    
    return res.status(200).json({ 
      success: true,
      message: 'Domain connectivity test complete',
      summary: {
        totalTested: results.length,
        reachable: reachableDomains.length,
        unreachable: unreachableDomains.length
      },
      reachableDomains: reachableDomains.map(d => ({
        domain: d.domain,
        status: d.status
      })),
      unreachableDomains: unreachableDomains.map(d => ({
        domain: d.domain,
        error: d.error
      })),
      allResults: results
    });

  } catch (error) {
    console.error('Domain Test Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Domain test failed',
      message: error.message
    });
  }
};