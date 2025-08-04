import React from 'react';
import { NavigationItem } from '../../types';

interface AdditionalCalculatorsProps {
  calculators: NavigationItem[];
  onCalculatorSelect: (calculatorId: string) => void;
}

export const AdditionalCalculators: React.FC<AdditionalCalculatorsProps> = ({ 
  calculators, 
  onCalculatorSelect 
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
          🧮 Additional Financial Calculators
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
          Choose from our comprehensive suite of financial calculators designed specifically for Indian users.
        </p>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {calculators.map((calculator) => (
          <div
            key={calculator.id}
            onClick={() => onCalculatorSelect(calculator.id)}
            className="bg-white dark:bg-dark-surface rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-dark-border group hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {calculator.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {calculator.name}
              </h3>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                {calculator.description}
              </p>
              <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors">
                Open Calculator
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-8">
          Why Choose Our Calculators?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
              Accurate Calculations
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
              All calculations follow RBI guidelines and standard banking formulas used in India
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
              Mobile Optimized
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
              Fully responsive design that works perfectly on all devices
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
              Export Results
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm">
              Download your calculations as PDF or Excel files for future reference
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};