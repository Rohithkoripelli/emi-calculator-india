import React from 'react';
import { 
  MinusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StockRecommendation, StockAnalysisData } from '../../services/stockAnalysisApi';

interface StockRecommendationCardProps {
  stockData: StockAnalysisData;
  recommendation: StockRecommendation;
  className?: string;
}

export const StockRecommendationCard: React.FC<StockRecommendationCardProps> = ({
  stockData,
  recommendation,
  className = ''
}) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-600/20 dark:text-green-400 dark:border-green-600/30';
      case 'SELL':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-600/20 dark:text-red-400 dark:border-red-600/30';
      case 'HOLD':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-600/20 dark:text-yellow-400 dark:border-yellow-600/30';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-600/20 dark:text-gray-400 dark:border-gray-600/30';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <ChartBarIcon className="w-8 h-8" />;
      case 'SELL':
        return <ChartBarIcon className="w-8 h-8" />;
      case 'HOLD':
        return <MinusIcon className="w-8 h-8" />;
      default:
        return <InformationCircleIcon className="w-8 h-8" />;
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return { level: 'High', color: 'text-green-600 dark:text-green-400' };
    if (confidence >= 60) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
    return { level: 'Low', color: 'text-red-600 dark:text-red-400' };
  };

  const getTimeHorizonDisplay = (timeHorizon: string) => {
    switch (timeHorizon) {
      case 'SHORT_TERM':
        return { text: '1-3 months', icon: '📅' };
      case 'MEDIUM_TERM':
        return { text: '3-12 months', icon: '🗓️' };
      case 'LONG_TERM':
        return { text: '1+ years', icon: '📆' };
      default:
        return { text: 'Not specified', icon: '⏰' };
    }
  };

  const confidenceInfo = getConfidenceLevel(recommendation.confidence);
  const timeHorizonInfo = getTimeHorizonDisplay(recommendation.timeHorizon);

  return (
    <div className={`bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden ${className}`}>
      {/* Header with Stock Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-indigo-600/10 p-4 lg:p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-dark-text-primary">
              {stockData.companyName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {stockData.symbol} • {stockData.sector}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
              ₹{stockData.currentPrice.toFixed(2)}
            </div>
            <div className={`text-sm font-medium ${
              stockData.changePercent >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
              ({stockData.changePercent >= 0 ? '+' : ''}₹{stockData.change.toFixed(2)})
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Section */}
      <div className="p-4 lg:p-6">
        {/* Main Recommendation */}
        <div className={`flex items-center justify-center p-4 lg:p-6 rounded-xl border-2 mb-6 ${getActionColor(recommendation.action)}`}>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getActionIcon(recommendation.action)}
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold">
                {recommendation.action}
              </div>
              <div className="text-sm opacity-75 mt-1">
                Confidence: <span className={confidenceInfo.color}>{recommendation.confidence}%</span> ({confidenceInfo.level})
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Time Horizon */}
          <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
              <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
                Time Horizon
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {timeHorizonInfo.icon} {timeHorizonInfo.text}
            </div>
          </div>

          {/* Target Price */}
          {recommendation.targetPrice && (
            <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BanknotesIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
                  Target Price
                </span>
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                ₹{recommendation.targetPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                {((recommendation.targetPrice - stockData.currentPrice) / stockData.currentPrice * 100).toFixed(1)}% upside
              </div>
            </div>
          )}

          {/* Stop Loss */}
          {recommendation.stopLoss && (
            <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
                <span className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
                  Stop Loss
                </span>
              </div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                ₹{recommendation.stopLoss.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                {Math.abs((recommendation.stopLoss - stockData.currentPrice) / stockData.currentPrice * 100).toFixed(1)}% risk
              </div>
            </div>
          )}
        </div>

        {/* Analysis Reasoning */}
        <div className="mb-6">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Analysis Summary
          </h4>
          <div className="space-y-2">
            {recommendation.reasoning.map((reason, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-600/10 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary leading-relaxed">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-600/10 dark:to-blue-600/10 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-3">
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-dark-text-muted block">Day High</span>
              <span className="font-semibold text-gray-900 dark:text-dark-text-primary">₹{stockData.dayHigh.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-dark-text-muted block">Day Low</span>
              <span className="font-semibold text-gray-900 dark:text-dark-text-primary">₹{stockData.dayLow.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-dark-text-muted block">Volume</span>
              <span className="font-semibold text-gray-900 dark:text-dark-text-primary">
                {stockData.volume > 0 ? (stockData.volume / 1000).toFixed(0) + 'K' : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-dark-text-muted block">Sector</span>
              <span className="font-semibold text-gray-900 dark:text-dark-text-primary">{stockData.sector}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button 
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
              recommendation.action === 'BUY' 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-card'
            }`}
            disabled={recommendation.action !== 'BUY'}
          >
            {recommendation.action === 'BUY' ? '🚀 Consider Buying' : 'Buy Not Recommended'}
          </button>
          
          <button 
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
              recommendation.action === 'SELL' 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-card'
            }`}
            disabled={recommendation.action !== 'SELL'}
          >
            {recommendation.action === 'SELL' ? '📉 Consider Selling' : 'Sell Not Recommended'}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-600/10 border border-yellow-200 dark:border-yellow-600/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Disclaimer:</strong> This is an AI-generated analysis for educational purposes only. 
              Not financial advice. Please consult with a qualified financial advisor before making investment decisions. 
              Past performance does not guarantee future results.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};