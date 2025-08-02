import React, { useState } from 'react';
import { 
  NewspaperIcon, 
  GlobeAltIcon, 
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { WebSearchResult } from '../../services/stockAnalysisApi';

interface StockInsightsPanelProps {
  insights: WebSearchResult[];
  stockSymbol: string;
  className?: string;
}

export const StockInsightsPanel: React.FC<StockInsightsPanelProps> = ({
  insights,
  stockSymbol,
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
      return `${Math.ceil(diffDays / 365)} years ago`;
    } catch {
      return 'Recent';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'web search':
        return <GlobeAltIcon className="w-4 h-4" />;
      case 'news':
        return <NewspaperIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'web search':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-600/20';
      case 'news':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-600/20';
      case 'investment guidelines':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-600/20';
      case 'technical analysis':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-600/20';
      case 'sector research':
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-600/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-600/20';
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 5);

  if (insights.length === 0) {
    return (
      <div className={`bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-6 ${className}`}>
        <div className="text-center">
          <InformationCircleIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
            No Insights Available
          </h3>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Unable to fetch web insights for {stockSymbol} at this time. 
            Try checking financial news websites or analyst reports manually.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-indigo-600/10 p-4 lg:p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-600/30 rounded-lg">
              <NewspaperIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                Market Insights & News
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Latest research and analysis for {stockSymbol}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {insights.length} insights found
            </div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">
              Updated recently
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="p-4 lg:p-6 space-y-4">
        {displayedInsights.map((insight, index) => (
          <div 
            key={index}
            className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Insight Header */}
            <div className="p-4 bg-gray-50 dark:bg-dark-surface">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-dark-text-primary leading-tight mb-2">
                    {insight.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-dark-text-muted">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getSourceColor(insight.source)}`}>
                      {getSourceIcon(insight.source)}
                      <span className="font-medium">{insight.source}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{formatDate(insight.publishedDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {insight.url !== '#' && (
                    <button 
                      onClick={() => window.open(insight.url, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                      title="Open source"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                    title={expandedItems.has(index) ? "Show less" : "Show more"}
                  >
                    {expandedItems.has(index) ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Insight Content */}
            <div className={`p-4 ${expandedItems.has(index) ? 'block' : 'hidden'}`}>
              <p className="text-sm lg:text-base text-gray-700 dark:text-dark-text-secondary leading-relaxed">
                {insight.snippet}
              </p>
              
              {insight.url !== '#' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <a
                    href={insight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    <span>Read full article</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Preview when collapsed */}
            {!expandedItems.has(index) && (
              <div className="p-4 pt-0">
                <p className="text-sm text-gray-600 dark:text-dark-text-muted line-clamp-2">
                  {insight.snippet.length > 120 ? 
                    `${insight.snippet.substring(0, 120)}...` : 
                    insight.snippet
                  }
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Show More/Less Button */}
        {insights.length > 5 && (
          <div className="text-center pt-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-2 bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-600/30 transition-colors font-medium text-sm"
            >
              {showAll ? 
                `Show Less (${insights.length - 5} hidden)` : 
                `Show All Insights (${insights.length - 5} more)`
              }
            </button>
          </div>
        )}
      </div>

      {/* Footer with aggregated sources */}
      <div className="bg-gray-50 dark:bg-dark-surface p-4 border-t border-gray-200 dark:border-dark-border">
        <div className="text-xs text-gray-500 dark:text-dark-text-muted">
          <strong>Sources:</strong> {Array.from(new Set(insights.map(i => i.source))).join(', ')}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          These insights are aggregated from various sources and may not reflect the complete picture. 
          Always verify information and consult multiple sources before making investment decisions.
        </div>
      </div>
    </div>
  );
};