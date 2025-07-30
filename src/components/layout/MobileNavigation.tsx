import React, { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { NavigationItem } from '../../types';

interface MobileNavigationProps {
  calculators: NavigationItem[];
  activeCalculator: string;
  onCalculatorChange: (calculatorId: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  calculators,
  activeCalculator,
  onCalculatorChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleCalculatorSelect = (calculatorId: string) => {
    onCalculatorChange(calculatorId);
    setIsMenuOpen(false);
  };

  const activeCalc = calculators.find(calc => calc.id === activeCalculator);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border px-3 sm:px-4 py-3 transition-colors">
        <div className="flex items-center justify-between">
          {/* App Logo/Title */}
          <div className="flex items-center space-x-2">
            <CalculatorIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-text-primary truncate">EMI Calculator</h1>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate">Financial Planning Tool</p>
            </div>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-dark-text-primary" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-dark-text-primary" />
            )}
          </button>
        </div>

        {/* Active Calculator Display */}
        <div className="mt-3 flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-600/20 rounded-lg">
          <span className="text-2xl">{activeCalc?.icon}</span>
          <div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-300">{activeCalc?.name}</div>
            <div className="text-xs text-blue-700 dark:text-blue-400">{activeCalc?.description}</div>
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={toggleMenu}
        />

        {/* Menu Content */}
        <div className="absolute right-0 top-0 h-full w-72 sm:w-80 max-w-[90vw] bg-white dark:bg-dark-surface shadow-xl overflow-y-auto">
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Calculators</h2>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
            </button>
          </div>

          {/* Calculator List */}
          <div className="p-4 space-y-2">
            {calculators.map((calculator) => (
              <button
                key={calculator.id}
                onClick={() => handleCalculatorSelect(calculator.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  activeCalculator === calculator.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-dark-card text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-surface'
                }`}
              >
                <span className="text-2xl">{calculator.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{calculator.name}</div>
                  <div className={`text-sm ${
                    activeCalculator === calculator.id ? 'text-blue-100' : 'text-gray-500 dark:text-dark-text-secondary'
                  }`}>
                    {calculator.description}
                  </div>
                </div>
                {activeCalculator === calculator.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Professional Financial Tools
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                Made with ❤️ for Indian Market
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};