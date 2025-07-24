import React from 'react';
import { NavigationItem } from '../../types';

interface NavigationProps {
  activeCalculator: string;
  onCalculatorChange: (calculatorId: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const calculators: NavigationItem[] = [
  {
    id: 'emi',
    name: 'EMI Calculator',
    icon: '🏠',
    description: 'Home, Car & Personal Loans'
  },
  {
    id: 'sukanya',
    name: 'Sukanya Samridhi',
    icon: '👧',
    description: 'Girl Child Savings Scheme'
  },
  {
    id: 'sip',
    name: 'SIP Calculator',
    icon: '📈',
    description: 'Mutual Fund Investments'
  },
  {
    id: 'credit-card',
    name: 'Credit Card EMI',
    icon: '💳',
    description: 'EMI + GST Calculator'
  },
  {
    id: 'gratuity',
    name: 'Gratuity Calculator',
    icon: '💼',
    description: 'Employee Benefits'
  },
  {
    id: 'tests',
    name: 'Accuracy Tests',
    icon: '🧪',
    description: 'Verify Calculations'
  }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeCalculator,
  onCalculatorChange,
  isSidebarOpen,
  onToggleSidebar
}) => {
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={onToggleSidebar}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 sm:w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Calculators</h1>
            <p className="text-sm text-gray-600">India-specific financial tools and calculators</p>
          </div>

          {/* Calculator Navigation */}
          <nav className="space-y-2">
            {calculators.map((calculator) => (
              <button
                key={calculator.id}
                onClick={() => {
                  onCalculatorChange(calculator.id);
                  if (window.innerWidth < 1024) {
                    onToggleSidebar();
                  }
                }}
                className={`
                  w-full text-left p-4 rounded-lg transition-colors duration-200 border
                  ${activeCalculator === calculator.id
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{calculator.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">{calculator.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{calculator.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-gray-600">
              All calculators are designed specifically for Indian financial scenarios with accurate formulas and tax implications.
            </p>
          </div>

          {/* AI Search Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🤖 AI Assistant</h4>
            <p className="text-sm text-blue-700">
              Ask questions about your financial scenarios and get personalized advice.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};