import React from 'react';
import { StockIndex, IndexData } from '../../types/stock';
import { StockApiService } from '../../services/stockApi';

interface IndexOverviewProps {
  index: StockIndex;
  data: IndexData;
}

export const IndexOverview: React.FC<IndexOverviewProps> = ({ index, data }) => {
  const isPositive = data.change >= 0;

  const getIndexDescription = (index: StockIndex) => {
    const descriptions: Record<string, string> = {
      'nifty50': 'The NIFTY 50 is the flagship index of the National Stock Exchange of India (NSE). It represents the weighted average of 50 Indian company stocks in 12 sectors and is one of the most widely tracked equity indices in India.',
      'sensex': 'The S&P BSE SENSEX is a free-float market-weighted stock market index of 30 well-established and financially sound companies listed on the Bombay Stock Exchange (BSE). It is the oldest stock market index in India.',
      'niftybank': 'The NIFTY Bank Index represents the performance of the banking sector in India. It comprises the most liquid and large capitalized Indian banking stocks.',
      'niftyit': 'The NIFTY IT Index tracks the performance of Indian Information Technology companies listed on the NSE. It includes major IT service providers and software companies.',
    };
    return descriptions[index.id] || index.description;
  };

  const getKeyFeatures = (index: StockIndex) => {
    const features: Record<string, string[]> = {
      'nifty50': [
        'Represents top 50 companies by market cap',
        'Covers 12 major sectors of Indian economy',
        'Base year: 1995, Base value: 1000',
        'Free-float market capitalization weighted',
        'Reviewed semi-annually'
      ],
      'sensex': [
        'Oldest stock market index in India',
        'Comprises 30 well-established companies',
        'Base year: 1978-79, Base value: 100',
        'Free-float market capitalization weighted',
        'Launched on January 1, 1986'
      ],
      'niftybank': [
        'Pure-play banking sector index',
        'Includes both private and public sector banks',
        'High liquidity and trading volume',
        'Sensitive to interest rate changes',
        'Key economic indicator'
      ]
    };
    return features[index.id] || [
      'Sector-specific performance tracking',
      'Market capitalization weighted',
      'Regular rebalancing',
      'High liquidity stocks'
    ];
  };

  return (
    <div className="space-y-8">
      {/* Key Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
          Key Statistics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {StockApiService.formatNumber(data.price)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Current Price</div>
          </div>
          <div className="text-center">
            <div className={`text-xl sm:text-2xl font-bold mb-1 ${
              isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Change %</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {StockApiService.formatNumber(data.dayHigh)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Day High</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {StockApiService.formatNumber(data.dayLow)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Day Low</div>
          </div>
          {data.volume > 0 && (
            <>
              <div className="text-center lg:col-span-2">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {StockApiService.formatNumber(data.volume)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Volume</div>
              </div>
            </>
          )}
          {data.marketCap && (
            <div className="text-center lg:col-span-2">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {StockApiService.formatIndianNumber(data.marketCap)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Market Cap</div>
            </div>
          )}
        </div>
      </div>

      {/* About This Index */}
      <div className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">
          About {index.name}
        </h3>
        <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed mb-6">
          {getIndexDescription(index)}
        </p>
        
        <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
          Key Features
        </h4>
        <ul className="space-y-2">
          {getKeyFeatures(index).map((feature, i) => (
            <li key={i} className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600 dark:text-dark-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Market Information */}
      <div className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">
          Market Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">Exchange</h4>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              {index.exchange === 'NSE' ? 'National Stock Exchange of India' : 'Bombay Stock Exchange'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">Category</h4>
            <p className="text-gray-600 dark:text-dark-text-secondary capitalize">
              {index.category.replace('_', ' ')} Index
            </p>
          </div>
          {index.sector && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">Sector</h4>
              <p className="text-gray-600 dark:text-dark-text-secondary">{index.sector}</p>
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">Symbol</h4>
            <p className="text-gray-600 dark:text-dark-text-secondary font-mono">{index.symbol}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">
          Today's Performance
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-dark-border">
            <span className="text-gray-600 dark:text-dark-text-secondary">Opening Price</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">
              {StockApiService.formatNumber(data.price - data.change)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-dark-border">
            <span className="text-gray-600 dark:text-dark-text-secondary">Current Price</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">
              {StockApiService.formatNumber(data.price)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-dark-border">
            <span className="text-gray-600 dark:text-dark-text-secondary">Change</span>
            <span className={`font-medium ${
              isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? '+' : ''}{StockApiService.formatNumber(data.change)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-dark-border">
            <span className="text-gray-600 dark:text-dark-text-secondary">Day Range</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">
              {StockApiService.formatNumber(data.dayLow)} - {StockApiService.formatNumber(data.dayHigh)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600 dark:text-dark-text-secondary">Last Updated</span>
            <span className="font-medium text-gray-900 dark:text-dark-text">
              {new Date(data.lastUpdated).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};