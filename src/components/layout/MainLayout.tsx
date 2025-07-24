import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { EMICalculator } from '../calculators/EMICalculator';
import { SukanyaCalculator } from '../calculators/SukanyaCalculator';
import { SIPCalculator } from '../calculators/SIPCalculator';
import { CreditCardCalculator } from '../calculators/CreditCardCalculator';
import { GratuityCalculator } from '../calculators/GratuityCalculator';
import { AIAssistant } from '../ai/AIAssistant';
import { TestResults } from '../ui/TestResults';
import { parseURLParams } from '../../utils/exportUtils';

export const MainLayout: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState('emi');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const handleCalculatorChange = (calculatorId: string) => {
    setActiveCalculator(calculatorId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlData = parseURLParams();
    if (urlData) {
      setActiveCalculator(urlData.calculatorType);
      // Note: Individual calculators will handle their own URL param parsing
    }
  }, []);

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'emi':
        return <EMICalculator />;
      case 'sukanya':
        return <SukanyaCalculator />;
      case 'sip':
        return <SIPCalculator />;
      case 'credit-card':
        return <CreditCardCalculator />;
      case 'gratuity':
        return <GratuityCalculator />;
      case 'tests':
        return <TestResults />;
      default:
        return <EMICalculator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Sidebar */}
      <Navigation
        activeCalculator={activeCalculator}
        onCalculatorChange={handleCalculatorChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        <div className="min-h-screen">
          {renderCalculator()}
        </div>
      </div>

      {/* AI Search Bar - Floating */}
      <div className="fixed bottom-6 right-6 z-30">
        <button 
          onClick={() => setIsAIOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors group"
          title="Ask AI Financial Assistant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AI Assistant
          </div>
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
      />
    </div>
  );
};