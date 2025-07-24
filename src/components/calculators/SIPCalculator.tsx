import React, { useState, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SIPInput } from '../../types';
import { calculateSIP, formatCurrency } from '../../utils/calculations';

export const SIPCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<SIPInput>({
    monthlyInvestment: 5000,
    expectedReturn: 12,
    investmentPeriod: 10,
    stepUpPercentage: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculation = useMemo(() => {
    if (inputs.monthlyInvestment > 0 && inputs.expectedReturn > 0 && inputs.investmentPeriod > 0) {
      return calculateSIP(inputs);
    }
    return null;
  }, [inputs]);

  const handleInputChange = (field: keyof SIPInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    if (inputs.monthlyInvestment < 500) {
      newErrors.monthlyInvestment = 'Minimum SIP amount is typically ₹500';
    }
    if (inputs.monthlyInvestment > 10000000) {
      newErrors.monthlyInvestment = 'Monthly investment amount seems too high';
    }
    if (inputs.expectedReturn <= 0 || inputs.expectedReturn > 50) {
      newErrors.expectedReturn = 'Expected return should be between 0.1% and 50%';
    }
    if (inputs.investmentPeriod < 1 || inputs.investmentPeriod > 50) {
      newErrors.investmentPeriod = 'Investment period should be between 1 and 50 years';
    }
    if (inputs.stepUpPercentage && (inputs.stepUpPercentage < 0 || inputs.stepUpPercentage > 50)) {
      newErrors.stepUpPercentage = 'Step-up percentage should be between 0% and 50%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SIP Calculator</h1>
        <p className="text-gray-600">Calculate returns for Systematic Investment Plan (SIP) in mutual funds</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card title="SIP Investment Details" className="h-fit">
          <div className="space-y-4">
            <Input
              label="Monthly Investment Amount"
              type="number"
              prefix="₹"
              value={inputs.monthlyInvestment}
              onChange={(e) => handleInputChange('monthlyInvestment', parseFloat(e.target.value) || 0)}
              error={errors.monthlyInvestment}
              placeholder="Enter monthly SIP amount"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Minimum SIP amount varies by fund (typically ₹500 - ₹1,000)
            </p>

            <Input
              label="Expected Annual Return"
              type="number"
              suffix="%"
              step="0.1"
              value={inputs.expectedReturn}
              onChange={(e) => handleInputChange('expectedReturn', parseFloat(e.target.value) || 0)}
              error={errors.expectedReturn}
              placeholder="Enter expected return"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Equity funds: 10-15%, Debt funds: 6-8%, Hybrid funds: 8-12%
            </p>

            <Input
              label="Investment Period"
              type="number"
              suffix="years"
              value={inputs.investmentPeriod}
              onChange={(e) => handleInputChange('investmentPeriod', parseFloat(e.target.value) || 0)}
              error={errors.investmentPeriod}
              placeholder="Enter investment period"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Longer investment periods help achieve better returns through compounding
            </p>

            <Input
              label="Annual Step-up Percentage (Optional)"
              type="number"
              suffix="%"
              step="0.1"
              value={inputs.stepUpPercentage || 0}
              onChange={(e) => handleInputChange('stepUpPercentage', parseFloat(e.target.value) || 0)}
              error={errors.stepUpPercentage}
              placeholder="Enter step-up percentage"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Annual increase in SIP amount (recommended: 10-15% to beat inflation)
            </p>

            <Button 
              onClick={validateInputs}
              className="w-full"
              disabled={!calculation}
            >
              Calculate Returns
            </Button>
          </div>
        </Card>

        {/* Results */}
        {calculation && (
          <Card title="SIP Investment Results">
            <div className="space-y-6">
              {/* Main Future Value */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Future Value</h3>
                <p className="text-4xl font-bold text-blue-600">
                  {formatCurrency(calculation.futureValue)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Investment</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculation.totalInvestment)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Returns</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculation.totalReturns)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total SIP Installments</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {inputs.investmentPeriod * 12}
                  </span>
                </div>
              </div>

              {/* Returns Analysis */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Returns Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Return on Investment:</span>
                    <span className="font-medium">
                      {((calculation.totalReturns / calculation.totalInvestment) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wealth multiplier:</span>
                    <span className="font-medium">
                      {(calculation.futureValue / calculation.totalInvestment).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual growth rate:</span>
                    <span className="font-medium">{inputs.expectedReturn}% p.a.</span>
                  </div>
                  {inputs.stepUpPercentage && inputs.stepUpPercentage > 0 && (
                    <div className="flex justify-between">
                      <span>With step-up benefit:</span>
                      <span className="font-medium text-green-600">
                        +{inputs.stepUpPercentage}% annually
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SIP Benefits */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">SIP Benefits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Rupee cost averaging reduces market volatility impact</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Power of compounding grows wealth over time</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Flexible investment amount and frequency</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Disciplined approach to long-term wealth creation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Tax benefits under ELSS funds (Section 80C)</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-medium text-amber-800 mb-2">Important Notes:</h5>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• SIP returns are market-linked and not guaranteed</p>
                  <p>• Past performance doesn't guarantee future returns</p>
                  <p>• Consider fund performance, expense ratio, and fund manager track record</p>
                  <p>• Review and rebalance portfolio periodically</p>
                  <p>• Stay invested for longer periods to achieve better returns</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};