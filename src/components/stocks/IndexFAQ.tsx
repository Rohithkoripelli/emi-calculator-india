import React, { useState } from 'react';
import { IndexFAQ as FAQ } from '../../types/stock';

interface IndexFAQProps {
  faqs: FAQ[];
  indexName: string;
}

export const IndexFAQ: React.FC<IndexFAQProps> = ({ faqs, indexName }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const defaultFAQs: FAQ[] = [
    {
      question: "What is a stock market index?",
      answer: "A stock market index is a measurement of the value of a section of the stock market. It is computed from the prices of selected stocks and is used as a benchmark to track the performance of a particular market segment."
    },
    {
      question: "How are index values calculated?",
      answer: "Most Indian indices use the free-float market capitalization method. This means the index value is calculated based on the market value of shares that are available for trading, excluding shares held by promoters, government, and other strategic investors."
    },
    {
      question: "What does it mean when an index goes up or down?",
      answer: "When an index goes up, it means the overall value of the stocks in that index has increased. This generally indicates positive market sentiment and economic growth. When it goes down, it suggests the opposite."
    },
    {
      question: "Can I invest directly in an index?",
      answer: "You cannot invest directly in an index, but you can invest in index funds or Exchange Traded Funds (ETFs) that track the performance of the index. These funds hold the same stocks in the same proportions as the index."
    },
    {
      question: "How often are indices updated?",
      answer: "Stock market indices are calculated and updated in real-time during market hours. The values change continuously as the prices of constituent stocks fluctuate throughout the trading day."
    }
  ];

  const displayFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">
          Frequently Asked Questions
        </h3>
        <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
          {faqs.length > 0 
            ? `Common questions about ${indexName}`
            : "General information about stock market indices"
          }
        </p>

        <div className="space-y-4">
          {displayFAQs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <span className="font-medium text-gray-900 dark:text-dark-text">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openItems.has(index) ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openItems.has(index) && (
                <div className="px-6 py-4 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border">
                  <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">
          Additional Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">
              📚 Learn More
            </h4>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
              Understanding stock market indices is crucial for making informed investment decisions.
            </p>
            <ul className="text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
              <li>• Market analysis and trends</li>
              <li>• Investment strategies</li>
              <li>• Risk management</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">
              💡 Investment Tips
            </h4>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
              Consider these points before making investment decisions.
            </p>
            <ul className="text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
              <li>• Diversify your portfolio</li>
              <li>• Consider your risk tolerance</li>
              <li>• Consult financial advisors</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Disclaimer</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              The information provided is for educational purposes only and should not be considered as investment advice. 
              Past performance does not guarantee future results. Please consult with a qualified financial advisor before making any investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};