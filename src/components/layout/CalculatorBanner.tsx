import React from 'react';
import { NavigationItem } from '../../types';

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
      <div className="hidden lg:block bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="py-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Financial Calculators for India
            </h1>
            <p className="text-base text-blue-100 max-w-2xl mx-auto">
              AI-powered financial planning tools designed for Indian market
            </p>
          </div>

          {/* Calculator Navigation */}
          <div className="pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {calculators.map((calculator) => (
                <button
                  key={calculator.id}
                  onClick={() => onCalculatorChange(calculator.id)}
                  className={`
                    group relative p-3 rounded-xl transition-all duration-200 transform hover:scale-105
                    ${activeCalculator === calculator.id
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-blue-700 hover:bg-blue-600 text-white border border-blue-500'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{calculator.icon}</div>
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">
                      {calculator.name}
                    </h3>
                    <p className={`text-xs ${
                      activeCalculator === calculator.id ? 'text-blue-500' : 'text-blue-200'
                    }`}>
                      {calculator.description}
                    </p>
                  </div>
                  
                  {/* Active indicator */}
                  {activeCalculator === calculator.id && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};