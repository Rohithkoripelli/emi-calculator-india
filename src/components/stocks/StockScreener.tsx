import React, { useState, useEffect } from 'react';
import { INDIAN_INDICES } from '../../data/indices';
import { StockIndex, IndexData } from '../../types/stock';
import { HybridStockApiService } from '../../services/hybridStockApi';
import { IndexDetail } from './IndexDetail';

export const StockScreener: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<StockIndex | null>(null);
  const [indexData, setIndexData] = useState<Record<string, IndexData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [apiInfo, setApiInfo] = useState(HybridStockApiService.getApiInfo());

  useEffect(() => {
    loadIndexData();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing stock data...');
      loadIndexData();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadIndexData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update API info
      setApiInfo(HybridStockApiService.getApiInfo());
      
      // Load data for main indices first (higher priority)
      const priorityIndices = INDIAN_INDICES.slice(0, 12); // Load first 12 indices
      const symbols = priorityIndices.map(index => index.symbol);
      
      // Use bulk API for better performance
      const bulkData = await HybridStockApiService.getBulkIndexData(symbols);
      
      const newIndexData: Record<string, IndexData> = {};
      let successCount = 0;
      
      priorityIndices.forEach(index => {
        const data = bulkData[index.symbol];
        if (data) {
          newIndexData[index.id] = data;
          successCount++;
        }
      });

      setIndexData(newIndexData);

      if (successCount === 0) {
        setError('Unable to load live market data. Please check your internet connection and try again. Our system tries multiple data sources to ensure accuracy.');
      } else if (successCount < priorityIndices.length / 2) {
        setError(`Loaded ${successCount}/${priorityIndices.length} indices successfully. Some data may be delayed - this is normal as we prioritize accuracy over speed.`);
      } else {
        // Success case - show data freshness info
        console.log(`Successfully loaded ${successCount}/${priorityIndices.length} indices with real-time data`);
      }

    } catch (err) {
      setError('Failed to load stock market data. This may be due to API limitations or network issues.');
      console.error('Error loading index data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIndexClick = (index: StockIndex) => {
    setSelectedIndex(index);
  };

  const handleBackToList = () => {
    setSelectedIndex(null);
  };

  const renderIndexRow = (index: StockIndex) => {
    const data = indexData[index.id];
    const isPositive = data ? data.change >= 0 : true;
    const isSelected = selectedIndex?.id === index.id;

    return (
      <div key={index.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <div
          onClick={() => handleIndexClick(index)}
          className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
          }`}
        >
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {index.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded flex-shrink-0">
                    {index.exchange}
                  </span>
                </div>
                {index.sector && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded mb-1">
                    {index.sector}
                  </span>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {index.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : data ? (
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {HybridStockApiService.formatNumber(data.price)}
                      </div>
                      <div className={`flex items-center justify-end gap-1 text-xs font-medium ${
                        isPositive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span>{isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
                        {isPositive ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>
                  )}
                </div>
                
                <div className="ml-2">
                  <svg 
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                      isSelected ? 'transform rotate-90' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {index.name}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {index.exchange}
                </span>
                {index.sector && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                    {index.sector}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {index.description}
              </p>
            </div>

            <div className="text-right">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : data ? (
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {HybridStockApiService.formatNumber(data.price)}
                  </div>
                  <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                    isPositive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span>{isPositive ? '+' : ''}{HybridStockApiService.formatNumber(data.change)}</span>
                    <span>({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)</span>
                    {isPositive ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No data</div>
              )}
            </div>

            <div className="ml-4">
              <svg 
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                  isSelected ? 'transform rotate-90' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Inline Index Details */}
        {isSelected && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <IndexDetail 
              index={selectedIndex} 
              onBack={handleBackToList}
              inline={true}
            />
          </div>
        )}
      </div>
    );
  };

  const categorizedIndices = {
    broad: INDIAN_INDICES.filter(index => index.category === 'broad'),
    sectoral: INDIAN_INDICES.filter(index => index.category === 'sectoral'),
    size: INDIAN_INDICES.filter(index => index.category === 'size'),
    special: INDIAN_INDICES.filter(index => index.category === 'volatility')
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
          📈 Indian Stock Market Indices
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2">
          Track real-time performance of major Indian stock market indices. Click on any index to view detailed charts, constituents, and analysis.
        </p>
        
        {/* API Status Banner */}
        <div className={`mt-4 p-3 rounded-lg border ${
          apiInfo.configured 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <div className={`w-2 h-2 rounded-full ${apiInfo.configured ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className={`font-medium ${
              apiInfo.configured 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {apiInfo.configured ? '🚀 Professional Grade Data' : '⚠️ Basic Data Mode'}
            </span>
            <span className={`hidden sm:inline ${
              apiInfo.configured 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              • {apiInfo.primary} • {apiInfo.accuracy}
            </span>
          </div>
          {!apiInfo.configured && apiInfo.setupRequired && (
            <div className="mt-2 text-center">
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                Missing: {apiInfo.missingCredentials.join(', ')} • Add to .env for trading-grade accuracy
              </span>
            </div>
          )}
        </div>

        {/* Data Freshness Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span>
            {loading ? 'Updating...' : `Last updated: ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </span>
          <span className="hidden sm:inline">• Auto-refresh every 30s</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Broad Market Indices */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-1">
          🏛️ Broad Market Indices
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {categorizedIndices.broad.map(renderIndexRow)}
        </div>
      </section>

      {/* Size-based Indices */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-1">
          📊 Size-based Indices
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {categorizedIndices.size.map(renderIndexRow)}
        </div>
      </section>

      {/* Sectoral Indices */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-1">
          🏭 Sectoral Indices
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {categorizedIndices.sectoral.map(renderIndexRow)}
        </div>
      </section>

      {/* Special Indices */}
      {categorizedIndices.special.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 px-1">
            ⚡ Special Indices
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {categorizedIndices.special.map(renderIndexRow)}
          </div>
        </section>
      )}

      {/* Refresh Button */}
      <div className="text-center mb-8">
        <button
          onClick={loadIndexData}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Real-Time Data & Disclaimer</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Our system aggregates data from multiple reliable sources including Yahoo Finance, NSE APIs, and market data providers to ensure accuracy. 
              Data is refreshed every 15-30 seconds during market hours. This information is for educational purposes only and not investment advice. 
              Please consult with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};