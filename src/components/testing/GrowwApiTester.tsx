/**
 * Groww API Testing Component
 * Use this component to test the automated token system
 */

import React, { useState } from 'react';
import { GrowwApiUtils } from '../../services/growwApiUtils';
import { GrowwTokenManager } from '../../services/growwTokenManager';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export const GrowwApiTester: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (success: boolean, message: string, data?: any) => {
    const result: TestResult = {
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
  };

  const testTokenGeneration = async () => {
    setTesting(true);
    try {
      addResult(true, 'Starting token generation test...');
      
      const success = await GrowwApiUtils.testTokenGeneration();
      
      if (success) {
        addResult(true, '✅ Token generation test passed successfully!');
      } else {
        addResult(false, '❌ Token generation test failed');
      }
    } catch (error) {
      addResult(false, `❌ Token generation error: ${error}`);
    }
    setTesting(false);
  };

  const checkTokenStatus = async () => {
    setTesting(true);
    try {
      const tokenManager = GrowwTokenManager.getInstance();
      const tokenInfo = tokenManager.getTokenInfo();
      
      addResult(true, '📊 Token Status Retrieved', {
        hasToken: tokenInfo.hasToken,
        isValid: tokenInfo.isValid,
        expiresAt: tokenInfo.expiresAt?.toLocaleString() || 'Unknown'
      });
    } catch (error) {
      addResult(false, `❌ Error checking token status: ${error}`);
    }
    setTesting(false);
  };

  const refreshToken = async () => {
    setTesting(true);
    try {
      const success = await GrowwApiUtils.refreshToken();
      if (success) {
        addResult(true, '🔄 Token refreshed successfully');
      } else {
        addResult(false, '❌ Token refresh failed');
      }
    } catch (error) {
      addResult(false, `❌ Token refresh failed: ${error}`);
    }
    setTesting(false);
  };

  const testApiCall = async () => {
    setTesting(true);
    try {
      addResult(true, '🌐 Testing API call with TCS stock...');
      
      // Test with a simple stock query
      const response = await fetch('/api/groww-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: ['TCS'],
          type: 'stock'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.TCS) {
          addResult(true, '✅ API call successful!', {
            symbol: 'TCS',
            price: data.data.TCS.currentPrice,
            change: data.data.TCS.dayChangePercent
          });
        } else {
          addResult(false, '❌ API returned no data for TCS');
        }
      } else {
        addResult(false, `❌ API call failed: ${response.status}`);
      }
    } catch (error) {
      addResult(false, `❌ API call error: ${error}`);
    }
    setTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🧪 Groww API Token System Tester
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testTokenGeneration}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {testing ? '⏳ Testing...' : '🔐 Test Token Generation'}
        </button>
        
        <button
          onClick={checkTokenStatus}
          disabled={testing}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {testing ? '⏳ Checking...' : '📊 Check Token Status'}
        </button>
        
        <button
          onClick={refreshToken}
          disabled={testing}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {testing ? '⏳ Refreshing...' : '🔄 Refresh Token'}
        </button>
        
        <button
          onClick={testApiCall}
          disabled={testing}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {testing ? '⏳ Testing...' : '🌐 Test API Call'}
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Test Results ({results.length})
        </h3>
        <button
          onClick={clearResults}
          className="text-sm bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No test results yet. Click any button above to start testing.
          </div>
        ) : (
          results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                result.success
                  ? 'bg-green-50 border-green-400 dark:bg-green-900/20'
                  : 'bg-red-50 border-red-400 dark:bg-red-900/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.message}
                  </p>
                  {result.data && (
                    <pre className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                  {result.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 What Each Test Does:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li><strong>🔐 Test Token Generation:</strong> Tests complete TOTP → Token flow</li>
          <li><strong>📊 Check Token Status:</strong> Shows current token validity and expiry</li>
          <li><strong>🔄 Refresh Token:</strong> Forces a new token generation</li>
          <li><strong>🌐 Test API Call:</strong> Tests actual Groww API call with TCS stock</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ If Tests Fail:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>1. Check environment variables: REACT_APP_GROWW_API_KEY & REACT_APP_GROWW_TOTP_SECRET</li>
          <li>2. Verify credentials in Groww API dashboard</li>
          <li>3. Check browser console for detailed error messages</li>
          <li>4. Ensure system time is accurate (TOTP is time-sensitive)</li>
        </ul>
      </div>
    </div>
  );
};

export default GrowwApiTester;