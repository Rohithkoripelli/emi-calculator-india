import React, { useState } from 'react';

export interface StockAnalysisPreferences {
  investmentPeriod: 'short-term' | 'long-term';
  currentHolding: 'yes' | 'no';
  riskTolerance: 'low' | 'medium' | 'high';
  stockSymbol: string;
  stockName: string;
}

interface StockAnalysisQuestionnaireProps {
  stockSymbol: string;
  stockName: string;
  onComplete: (preferences: StockAnalysisPreferences) => void;
  onCancel: () => void;
}

const StockAnalysisQuestionnaire: React.FC<StockAnalysisQuestionnaireProps> = ({
  stockSymbol,
  stockName,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    investmentPeriod: '' as 'short-term' | 'long-term' | '',
    currentHolding: '' as 'yes' | 'no' | '',
    riskTolerance: '' as 'low' | 'medium' | 'high' | '',
    stockSymbol,
    stockName
  });

  const questions = [
    {
      title: "Investment Time Period",
      subtitle: "How long are you planning to hold this stock?",
      type: "period"
    },
    {
      title: "Current Holdings",
      subtitle: "Do you currently own shares of this company?",
      type: "holding"
    },
    {
      title: "Risk Tolerance",
      subtitle: "What is your risk tolerance for this investment?",
      type: "risk"
    }
  ];

  const handlePeriodSelect = (period: 'short-term' | 'long-term') => {
    setPreferences(prev => ({ ...prev, investmentPeriod: period }));
    setTimeout(() => setCurrentStep(1), 300);
  };

  const handleHoldingSelect = (holding: 'yes' | 'no') => {
    setPreferences(prev => ({ ...prev, currentHolding: holding }));
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleRiskSelect = (risk: 'low' | 'medium' | 'high') => {
    setPreferences(prev => ({ ...prev, riskTolerance: risk }));
    // Complete the questionnaire after final selection
    setTimeout(() => {
      const finalPreferences = { 
        investmentPeriod: preferences.investmentPeriod as 'short-term' | 'long-term',
        currentHolding: preferences.currentHolding as 'yes' | 'no',
        riskTolerance: risk,
        stockSymbol,
        stockName
      };
      onComplete(finalPreferences);
    }, 300);
  };

  const canProceed = preferences.investmentPeriod && preferences.currentHolding && preferences.riskTolerance;

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-700/50 shadow-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl">📈</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Stock Analysis Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Help us understand your investment profile for <strong>{stockName}</strong>
        </p>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium">
          {stockSymbol}
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          {questions.map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < questions.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="min-h-[300px]">
        {currentStep < questions.length && (
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {questions[currentStep].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {questions[currentStep].subtitle}
            </p>
          </div>
        )}

        {/* Step 0: Investment Period */}
        {currentStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handlePeriodSelect('short-term')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 transform ${
                preferences.investmentPeriod === 'short-term'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Short Term (1-12 months)
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Looking for quick gains or short-term trading opportunities. 
                Focus on technical analysis and market momentum.
              </p>
            </button>

            <button
              onClick={() => handlePeriodSelect('long-term')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 transform ${
                preferences.investmentPeriod === 'long-term'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-3">🌱</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Long Term (1+ years)
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Building wealth through fundamentally strong companies. 
                Focus on business quality and long-term growth potential.
              </p>
            </button>
          </div>
        )}

        {/* Step 1: Current Holdings */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleHoldingSelect('yes')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.currentHolding === 'yes'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-4xl mb-3">✅</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Yes, I Hold This Stock
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                I currently own shares of {stockName} and want advice on whether to 
                hold, buy more, or sell my position.
              </p>
            </button>

            <button
              onClick={() => handleHoldingSelect('no')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.currentHolding === 'no'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-4xl mb-3">🆕</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No, New Investment
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                I don't currently own this stock and am considering it as a 
                new investment opportunity.
              </p>
            </button>
          </div>
        )}

        {/* Step 2: Risk Tolerance */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleRiskSelect('low')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.riskTolerance === 'low'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Low Risk
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Conservative approach, prefer stable blue-chip stocks with steady returns
              </p>
            </button>

            <button
              onClick={() => handleRiskSelect('medium')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.riskTolerance === 'medium'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-3">⚖️</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Medium Risk
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Balanced approach, willing to accept moderate volatility for better returns
              </p>
            </button>

            <button
              onClick={() => handleRiskSelect('high')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.riskTolerance === 'high'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300'
              }`}
            >
              <div className="text-3xl mb-3">🚀</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                High Risk
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Aggressive approach, comfortable with high volatility for maximum growth potential
              </p>
            </button>
          </div>
        )}

        {/* Profile Summary (after completion) */}
        {currentStep >= questions.length && canProceed && (
          <div className="text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Investment Profile Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Time Period</div>
                  <div className="text-green-600 dark:text-green-400 font-bold">
                    {preferences.investmentPeriod === 'short-term' ? 'Short Term' : 'Long Term'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Current Holding</div>
                  <div className="text-green-600 dark:text-green-400 font-bold">
                    {preferences.currentHolding === 'yes' ? 'Yes' : 'New Investment'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Risk Tolerance</div>
                  <div className="text-green-600 dark:text-green-400 font-bold">
                    {preferences.riskTolerance?.charAt(0).toUpperCase() + preferences.riskTolerance?.slice(1)} Risk
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-300"
        >
          ← Cancel
        </button>

        {currentStep > 0 && currentStep < questions.length && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-6 py-3 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium transition-colors duration-300"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default StockAnalysisQuestionnaire;