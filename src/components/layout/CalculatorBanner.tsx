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
      {/* Desktop Banner - Hidden on mobile */}
      <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Header */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Logo 
                  onClick={() => onCalculatorChange('emi')}
                  className="mr-4"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">Fincalcpro</h1>
                  <p className="text-sm text-blue-100">Professional Financial Tools</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Financial Calculators for India
              </h2>
              <p className="text-base text-blue-100 dark:text-blue-200 max-w-2xl mx-auto">
                AI-powered financial planning tools designed for Indian market
              </p>
            </div>
          </div>

          {/* Calculator Navigation - 4 Cards in Single Line */}
          <div className="pb-4">
            <div className="flex justify-center">
              <div className="flex flex-wrap justify-center gap-3 lg:gap-4 max-w-6xl">
                {calculators.map((calculator) => (
                <button
                  key={calculator.id}
                  onClick={() => onCalculatorChange(calculator.id)}
                  className={`
                    group relative p-3 lg:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 
                    flex-shrink-0 w-[220px] lg:w-[240px]
                    ${activeCalculator === calculator.id
                      ? 'bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 shadow-lg'
                      : 'bg-blue-700 dark:bg-blue-800 hover:bg-blue-600 dark:hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-600'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl mb-1">{calculator.icon}</div>
                    <h3 className="font-semibold text-xs lg:text-sm mb-1 lg:mb-2 leading-tight">
                      {calculator.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${
                      activeCalculator === calculator.id ? 'text-blue-500 dark:text-blue-600' : 'text-blue-200 dark:text-blue-300'
                    }`}>
                      {calculator.description}
                    </p>
                  </div>
                  
                  {/* Active indicator */}
                  {activeCalculator === calculator.id && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 lg:border-l-8 lg:border-r-8 lg:border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                    </div>
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