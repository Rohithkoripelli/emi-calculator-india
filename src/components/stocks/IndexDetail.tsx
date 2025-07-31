import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StockIndex, IndexData, ChartData, CompanyData, TimeFrame } from '../../types/stock';
import { StockApiService } from '../../services/stockApi';
import { INDEX_FAQS } from '../../data/indices';
import { CompanyTable } from './CompanyTable';
import { IndexOverview } from './IndexOverview';
import { IndexFAQ } from './IndexFAQ';

interface IndexDetailProps {
  index: StockIndex;
  onBack: () => void;
  inline?: boolean;
}

const TIME_FRAMES: TimeFrame[] = [
  { id: '1D', label: '1D', value: '1D' },
  { id: '5D', label: '5D', value: '5D' },
  { id: '1M', label: '1M', value: '1M' },
  { id: '1Y', label: '1Y', value: '1Y' },
  { id: '3Y', label: '3Y', value: '3Y' },
  { id: '5Y', label: '5Y', value: '5Y' },
  { id: 'ALL', label: 'All', value: 'ALL' }
];

export const IndexDetail: React.FC<IndexDetailProps> = ({ index, onBack, inline = false }) => {
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame['value']>('1Y');
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'faq'>('overview');

  useEffect(() => {
    loadIndexData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, activeTimeFrame]);

  const loadIndexData = async () => {
    setLoading(true);
    try {
      const [indexResult, companiesResult] = await Promise.all([
        StockApiService.getIndexData(index.symbol),
        StockApiService.getIndexConstituents(index.symbol)
      ]);

      setIndexData(indexResult);
      setCompanies(companiesResult);
    } catch (error) {
      console.error('Error loading index data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const data = await StockApiService.getChartData(index.symbol, activeTimeFrame);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    if (activeTimeFrame === '1D') {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (activeTimeFrame === '5D' || activeTimeFrame === '1M') {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-IN', { year: '2-digit', month: 'short' });
    }
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleString('en-IN');
  };

  const isPositive = indexData ? indexData.change >= 0 : true;

  const containerClass = inline ? "p-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

  return (
    <div className={containerClass}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Indices
            </button>
          </div>
        </div>
      )}

      {/* Index Header */}
      <div className={`${inline ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-dark-surface'} rounded-xl p-6 shadow-lg mb-8`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`${inline ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-gray-900 dark:text-white`}>
                {index.name}
              </h1>
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {index.exchange}
              </span>
              {index.sector && (
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                  {index.sector}
                </span>
              )}
            </div>
            {!inline && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {index.description}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : indexData ? (
            <div className="text-right">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {StockApiService.formatNumber(indexData.price)}
              </div>
              <div className={`flex items-center justify-end gap-2 text-lg font-medium ${
                isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <span>{isPositive ? '+' : ''}{StockApiService.formatNumber(indexData.change)}</span>
                <span>({isPositive ? '+' : ''}{indexData.changePercent.toFixed(2)}%)</span>
                {isPositive ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Range: {StockApiService.formatNumber(indexData.dayLow)} - {StockApiService.formatNumber(indexData.dayHigh)}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Data unavailable
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Price Chart
          </h2>
          <div className="flex flex-wrap gap-2">
            {TIME_FRAMES.map((timeFrame) => (
              <button
                key={timeFrame.id}
                onClick={() => setActiveTimeFrame(timeFrame.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTimeFrame === timeFrame.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {timeFrame.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 sm:h-96">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxisTick}
                  className="text-xs"
                />
                <YAxis 
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => StockApiService.formatNumber(value)}
                  className="text-xs"
                />
                <Tooltip 
                  labelFormatter={formatTooltipLabel}
                  formatter={(value: number) => [StockApiService.formatNumber(value), 'Price']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No chart data available
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'companies'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Companies
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'faq'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          FAQ
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && indexData && (
        <IndexOverview index={index} data={indexData} />
      )}

      {activeTab === 'companies' && (
        <CompanyTable companies={companies} loading={loading} />
      )}

      {activeTab === 'faq' && (
        <IndexFAQ faqs={INDEX_FAQS[index.id] || []} indexName={index.name} />
      )}
    </div>
  );
};