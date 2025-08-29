import React, { useState } from 'react';

export interface InvestmentPreferences {
  investmentHorizon: 'short-term' | 'long-term' | '';
  preferredSectors: string[];
  amount: number;
  frequency: 'lump-sum' | 'monthly' | 'quarterly' | '';
}

interface InvestmentQuestionnaireProps {
  initialAmount?: number;
  onComplete: (preferences: InvestmentPreferences) => void;
  onCancel: () => void;
}

const InvestmentQuestionnaire: React.FC<InvestmentQuestionnaireProps> = ({
  initialAmount,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<InvestmentPreferences>({
    investmentHorizon: '',
    preferredSectors: [],
    amount: initialAmount || 0,
    frequency: ''
  });

  const sectors = [
    { id: 'banking', name: 'Banking & Financial Services', description: 'HDFC Bank, ICICI Bank, Axis Bank', icon: '🏦' },
    { id: 'it', name: 'Information Technology', description: 'TCS, Infosys, Wipro, HCL Tech', icon: '💻' },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', description: 'Sun Pharma, Dr. Reddy\'s, Cipla', icon: '💊' },
    { id: 'fmcg', name: 'FMCG & Consumer Goods', description: 'Hindustan Unilever, Nestle, ITC', icon: '🛒' },
    { id: 'energy', name: 'Energy & Oil', description: 'Reliance, ONGC, IOC, BPCL', icon: '⛽' },
    { id: 'automobile', name: 'Automobile', description: 'Maruti Suzuki, Tata Motors, M&M', icon: '🚗' },
    { id: 'defence', name: 'Defence & Aerospace', description: 'HAL, BEL, Cochin Shipyard', icon: '🚀' },
    { id: 'psu', name: 'Public Sector Units', description: 'NTPC, Coal India, SAIL, BHEL', icon: '🏭' },
    { id: 'infrastructure', name: 'Infrastructure', description: 'L&T, Ultratech Cement, Adani Ports', icon: '🏗️' },
    { id: 'telecom', name: 'Telecommunications', description: 'Bharti Airtel, Vi, Jio', icon: '📱' }
  ];

  const questions = [
    {
      title: "Investment Time Horizon",
      subtitle: "How long do you plan to stay invested?",
      type: "horizon"
    },
    {
      title: "Investment Frequency", 
      subtitle: "How would you like to invest your money?",
      type: "frequency"
    },
    {
      title: "Preferred Sectors",
      subtitle: "Which sectors interest you? (Select multiple)",
      type: "sectors"
    }
  ];

  const handleHorizonSelect = (horizon: 'short-term' | 'long-term') => {
    setPreferences(prev => ({ ...prev, investmentHorizon: horizon }));
    setTimeout(() => setCurrentStep(1), 300);
  };

  const handleFrequencySelect = (frequency: 'lump-sum' | 'monthly' | 'quarterly') => {
    setPreferences(prev => ({ ...prev, frequency }));
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleSectorToggle = (sectorId: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredSectors: prev.preferredSectors.includes(sectorId)
        ? prev.preferredSectors.filter(s => s !== sectorId)
        : [...prev.preferredSectors, sectorId]
    }));
  };

  const handleComplete = () => {
    onComplete(preferences);
  };

  const canProceedToComplete = preferences.investmentHorizon && preferences.frequency && preferences.preferredSectors.length > 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-700/50 shadow-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl">📊</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Investment Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help us understand your investment goals to provide personalized recommendations
        </p>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          {questions.map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < questions.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="min-h-[400px]">
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

        {/* Step 0: Investment Horizon */}
        {currentStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleHorizonSelect('short-term')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 transform ${
                preferences.investmentHorizon === 'short-term'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-3">⏱️</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Short Term (3-12 months)
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Focus on stable, liquid investments with moderate growth potential. 
                Ideal for near-term goals and capital preservation.
              </p>
            </button>

            <button
              onClick={() => handleHorizonSelect('long-term')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 transform ${
                preferences.investmentHorizon === 'long-term'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-3">📈</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Long Term (12+ months)
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Maximize growth potential with quality stocks and systematic investing. 
                Perfect for wealth building and long-term financial goals.
              </p>
            </button>
          </div>
        )}

        {/* Step 1: Investment Frequency */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleFrequencySelect('lump-sum')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.frequency === 'lump-sum'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-3">💰</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Lump Sum
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Invest the entire amount at once
              </p>
            </button>

            <button
              onClick={() => handleFrequencySelect('monthly')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.frequency === 'monthly'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-3">📅</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Monthly SIP
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Systematic investment every month
              </p>
            </button>

            <button
              onClick={() => handleFrequencySelect('quarterly')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 transform ${
                preferences.frequency === 'quarterly'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-3">🗓️</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Quarterly
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Invest every 3 months
              </p>
            </button>
          </div>
        )}

        {/* Step 2: Sector Preferences */}
        {currentStep === 2 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
              {sectors.map(sector => (
                <button
                  key={sector.id}
                  onClick={() => handleSectorToggle(sector.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-102 transform ${
                    preferences.preferredSectors.includes(sector.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{sector.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {sector.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {sector.description}
                      </p>
                    </div>
                    {preferences.preferredSectors.includes(sector.id) && (
                      <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {preferences.preferredSectors.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-500 text-lg">✅</span>
                  <span className="font-medium text-gray-900 dark:text-white">Selected Sectors:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredSectors.map(sectorId => {
                    const sector = sectors.find(s => s.id === sectorId);
                    return (
                      <span
                        key={sectorId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200"
                      >
                        {sector?.icon} {sector?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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

        {currentStep === 2 && (
          <button
            onClick={handleComplete}
            disabled={!canProceedToComplete}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
              canProceedToComplete
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Get Recommendations →
          </button>
        )}
      </div>
    </div>
  );
};

export default InvestmentQuestionnaire;