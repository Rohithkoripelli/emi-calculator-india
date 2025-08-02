import React, { useState, useEffect } from 'react';
import { CalculatorBanner } from './CalculatorBanner';
import { MobileNavigation } from './MobileNavigation';
import { ImprovedEMICalculator } from '../calculators/ImprovedEMICalculator';
import { SukanyaCalculator } from '../calculators/SukanyaCalculator';
import { SIPCalculator } from '../calculators/SIPCalculator';
import { CreditCardCalculator } from '../calculators/CreditCardCalculator';
import { GratuityCalculator } from '../calculators/GratuityCalculator';
import { StockScreener } from '../stocks/StockScreener';
import { AdditionalCalculators } from '../calculators/AdditionalCalculators';
import { CapitalGainsCalculator } from '../calculators/CapitalGainsCalculator';
import { AIAssistant } from '../ai/AIAssistant';
import { TestResults } from '../ui/TestResults';
import { NavigationItem } from '../../types';
import { parseURLParams } from '../../utils/exportUtils';

const calculators: NavigationItem[] = [
  {
    id: 'emi',
    name: 'EMI Calculator',
    icon: '🏠',
    description: 'Home, Car & Personal Loans'
  },
  {
    id: 'capital-gains',
    name: 'Capital Gains Tax',
    icon: '💰',
    description: 'STCG & LTCG Tax Calculator'
  },
  {
    id: 'additional',
    name: 'Additional Calculators',
    icon: '🧮',
    description: 'More Financial Tools'
  },
  {
    id: 'stocks',
    name: 'Stock Screener',
    icon: '📊',
    description: 'Indian Stock Market Indices'
  }
];

const additionalCalculators: NavigationItem[] = [
  {
    id: 'sukanya',
    name: 'Sukanya Samridhi',
    icon: '👧',
    description: 'Girl Child Savings'
  },
  {
    id: 'sip',
    name: 'SIP Calculator',
    icon: '📈',
    description: 'Mutual Fund SIP'
  },
  {
    id: 'credit-card',
    name: 'Credit Card EMI',
    icon: '💳',
    description: 'EMI + GST Calculator'
  },
  {
    id: 'gratuity',
    name: 'Gratuity',
    icon: '💼',
    description: 'Employee Benefits'
  }
];

export const ImprovedMainLayout: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState('emi');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [currentLoanData, setCurrentLoanData] = useState<any>(null);

  const handleCalculatorChange = (calculatorId: string) => {
    setActiveCalculator(calculatorId);
    setShowTests(false);
  };

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlData = parseURLParams();
    if (urlData && calculators.some(calc => calc.id === urlData.calculatorType)) {
      setActiveCalculator(urlData.calculatorType);
    }
  }, []);

  const renderCalculator = () => {
    if (showTests) {
      return <TestResults />;
    }

    switch (activeCalculator) {
      case 'stocks':
        return <StockScreener />;
      case 'emi':
        return <ImprovedEMICalculator onLoanDataChange={setCurrentLoanData} onAIOpen={() => setIsAIOpen(true)} />;
      case 'capital-gains':
        return <CapitalGainsCalculator />;
      case 'additional':
        return <AdditionalCalculators calculators={additionalCalculators} onCalculatorSelect={setActiveCalculator} />;
      case 'sukanya':
        return <SukanyaCalculator />;
      case 'sip':
        return <SIPCalculator />;
      case 'credit-card':
        return <CreditCardCalculator />;
      case 'gratuity':
        return <GratuityCalculator />;
      default:
        return <ImprovedEMICalculator onLoanDataChange={setCurrentLoanData} onAIOpen={() => setIsAIOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
      {/* Mobile Navigation */}
      <MobileNavigation
        calculators={calculators}
        activeCalculator={activeCalculator}
        onCalculatorChange={handleCalculatorChange}
      />

      {/* Desktop Calculator Banner */}
      <CalculatorBanner
        calculators={calculators}
        activeCalculator={activeCalculator}
        onCalculatorChange={handleCalculatorChange}
      />

      {/* Main Content */}
      <div className="relative">
        {/* Calculator Content */}
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
          {renderCalculator()}
        </main>

        {/* Enhanced AI Assistant Floating Button */}
        <div className="fixed bottom-4 right-2 sm:right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col gap-3">
          {/* AI Assistant Button with Enhanced Marketing */}
          <div className="relative">
            <button 
              onClick={() => setIsAIOpen(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white p-4 lg:p-5 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 group animate-pulse"
              title="Ask AI Financial Assistant - Powered by GPT-4"
            >
              <div className="relative">
                <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {/* AI Badge */}
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1 rounded-full">
                  AI
                </div>
              </div>
            </button>
            
            {/* Enhanced Marketing Tooltip */}
            <div className="hidden lg:block absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
              <div className="font-semibold text-green-400">🚀 Ask AI Assistant</div>
              <div className="text-xs text-gray-300">Powered by GPT-4 • India-specific advice</div>
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
            
            {/* Notification Dot */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>

          {/* Test Results Button */}
          <button 
            onClick={() => setShowTests(!showTests)}
            className={`p-3 lg:p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 group ${
              showTests 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
            }`}
            title="View Accuracy Tests"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            {/* Desktop Tooltip */}
            <div className="hidden lg:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Accuracy Tests
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>

        {/* AI Assistant Modal */}
        <AIAssistant 
          isOpen={isAIOpen} 
          onClose={() => setIsAIOpen(false)}
          loanData={activeCalculator === 'emi' ? currentLoanData : null}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-dark-surface text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4">About Our Calculators</h3>
              <p className="text-gray-300 dark:text-dark-text-secondary text-sm">
                Professional-grade financial calculators designed specifically for Indian users. 
                All calculations follow RBI guidelines and standard banking formulas.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Features</h3>
              <ul className="text-gray-300 dark:text-dark-text-secondary text-sm space-y-2">
                <li>✓ Indian number formatting (50,00,000)</li>
                <li>✓ Tax-saving calculations</li>
                <li>✓ PDF & Excel export</li>
                <li>✓ AI financial assistance</li>
                <li>✓ Mobile responsive design</li>
              </ul>
            </div>

            {/* Accuracy */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accuracy Guarantee</h3>
              <p className="text-gray-300 dark:text-dark-text-secondary text-sm mb-4">
                Our calculations are verified by automated tests and follow standard 
                financial formulas used by Indian banks and institutions.
              </p>
              <button 
                onClick={() => setShowTests(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Test Results
              </button>
            </div>
          </div>

          <div className="border-t border-gray-700 dark:border-dark-border mt-8 pt-8 text-center text-gray-400 dark:text-dark-text-muted text-sm">
            <p>&copy; 2025 EMI Calculator India. Built with ❤️ for the Indian financial community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};