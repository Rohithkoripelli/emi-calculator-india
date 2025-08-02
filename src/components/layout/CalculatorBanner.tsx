import React from 'react';
import { NavigationItem } from '../../types';
import { Logo } from '../ui/Logo';

interface CalculatorBannerProps {
  calculators: NavigationItem[];
  activeCalculator: string;
  onCalculatorChange: (calculatorId: string) => void;
}

export const CalculatorBanner: React.FC<CalculatorBannerProps> = ({
  calculators,
  activeCalculator,
  onCalculatorChange
}) => {
  return (
    <>
      {/* Desktop Header - Minimalistic Design */}
      <div className="hidden lg:block bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Header with Logo */}
          <div className="py-4 border-b border-gray-100 dark:border-dark-border">
            <div className="flex items-center">
              <Logo 
                onClick={() => onCalculatorChange('emi')}
                className="mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinCalcPro</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Indian Financial Tools</p>
              </div>
            </div>
          </div>

          {/* Navigation Cards - Clean Grid */}
          <div className="py-6">
            <div className="flex justify-center">
              <div className="grid grid-cols-4 gap-4 max-w-4xl w-full">
                {calculators.map((calculator) => (
                <button
                  key={calculator.id}
                  onClick={() => onCalculatorChange(calculator.id)}
                  className={`
                    group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md
                    ${activeCalculator === calculator.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                      : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-3">{calculator.icon}</div>
                    <h3 className={`font-semibold text-sm mb-1 ${
                      activeCalculator === calculator.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {calculator.name}
                    </h3>
                    <p className={`text-xs ${
                      activeCalculator === calculator.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {calculator.description}
                    </p>
                  </div>
                  
                  {/* Active indicator - subtle border */}
                  {activeCalculator === calculator.id && (
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-500 dark:border-blue-400 pointer-events-none"></div>
                  )}
                </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};