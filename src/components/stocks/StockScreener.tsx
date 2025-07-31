import React, { useState, useEffect } from 'react';
import { INDIAN_INDICES } from '../../data/indices';
import { StockIndex, IndexData } from '../../types/stock';
import { StockApiService } from '../../services/stockApi';
import { IndexDetail } from './IndexDetail';

export const StockScreener: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<StockIndex | null>(null);
  const [indexData, setIndexData] = useState<Record<string, IndexData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIndexData();
  }, []);

  const loadIndexData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = INDIAN_INDICES.slice(0, 15).map(async (index) => {
        const data = await StockApiService.getIndexData(index.symbol);
        return { index: index.id, data };
      });

      const results = await Promise.allSettled(promises);
      const newIndexData: Record<string, IndexData> = {};

      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.data) {
          newIndexData[result.value.index] = result.value.data;
        }
      });

      setIndexData(newIndexData);
    } catch (err) {
      setError('Failed to load stock data. Please try again later.');
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
      <div key={index.id} className="border-b border-gray-200 dark:border-dark-border">
        <div
          onClick={() => handleIndexClick(index)}
          className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text text-lg">
                {index.name}
              </h3>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-text-secondary rounded">
                {index.exchange}
              </span>
              {index.sector && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {index.sector}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
              {index.description}
            </p>
          </div>

          <div className="text-right">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : data ? (
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-dark-text">
                  {StockApiService.formatNumber(data.price)}
                </div>
                <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                  isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>{isPositive ? '+' : ''}{StockApiService.formatNumber(data.change)}</span>
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
              <div className="text-sm text-gray-500 dark:text-dark-text-muted">No data</div>
            )}
          </div>

          <div className="ml-4">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${
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

        {/* Inline Index Details */}
        {isSelected && (
          <div className="border-t border-gray-200 dark:border-dark-border">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
          📈 Indian Stock Market Indices
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
          Track real-time performance of major Indian stock market indices. Click on any index to view detailed charts, constituents, and analysis.
        </p>
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
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
          🏛️ Broad Market Indices
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden">
          {categorizedIndices.broad.map(renderIndexRow)}
        </div>
      </section>

      {/* Size-based Indices */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
          📊 Size-based Indices
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden">
          {categorizedIndices.size.map(renderIndexRow)}
        </div>
      </section>

      {/* Sectoral Indices */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
          🏭 Sectoral Indices
        </h2>
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden">
          {categorizedIndices.sectoral.map(renderIndexRow)}
        </div>
      </section>

      {/* Special Indices */}
      {categorizedIndices.special.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 flex items-center gap-2">
            ⚡ Special Indices
          </h2>
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg overflow-hidden">
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
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Disclaimer</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Stock market data is provided for informational purposes only and may be delayed. 
              This is not investment advice. Please consult with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};