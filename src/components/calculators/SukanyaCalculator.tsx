import React, { useState, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SukanyaInput } from '../../types';
import { calculateSukanyaSamridhi, formatCurrency } from '../../utils/calculations';

export const SukanyaCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<SukanyaInput>({
    depositAmount: 1500,
    currentAge: 10,
    termInYears: 15,
    interestRate: 8.0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculation = useMemo(() => {
    if (inputs.depositAmount > 0 && inputs.currentAge > 0 && inputs.termInYears > 0) {
      return calculateSukanyaSamridhi(inputs);
    }
    return null;
  }, [inputs]);

  const handleInputChange = (field: keyof SukanyaInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    if (inputs.depositAmount < 250) {
      newErrors.depositAmount = 'Minimum deposit amount is ₹250 per year';
    }
    if (inputs.depositAmount > 150000) {
      newErrors.depositAmount = 'Maximum deposit amount is ₹1.5 lakh per year';
    }
    if (inputs.currentAge < 0 || inputs.currentAge > 10) {
      newErrors.currentAge = 'Girl child age must be between 0 and 10 years';
    }
    if (inputs.termInYears < 15 || inputs.termInYears > 21) {
      newErrors.termInYears = 'Term must be between 15 and 21 years';
    }
    if (inputs.interestRate <= 0 || inputs.interestRate > 15) {
      newErrors.interestRate = 'Interest rate must be between 0.1% and 15%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sukanya Samridhi Calculator</h1>
        <p className="text-gray-600">Calculate returns for Sukanya Samridhi Yojana - Government savings scheme for girl child</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card title="Sukanya Samridhi Details" className="h-fit">
          <div className="space-y-4">
            <Input
              label="Annual Deposit Amount"
              type="number"
              prefix="₹"
              value={inputs.depositAmount}
              onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value) || 0)}
              error={errors.depositAmount}
              placeholder="Enter annual deposit"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Minimum: ₹250, Maximum: ₹1,50,000 per year
            </p>

            <Input
              label="Girl Child's Current Age"
              type="number"
              suffix="years"
              value={inputs.currentAge}
              onChange={(e) => handleInputChange('currentAge', parseFloat(e.target.value) || 0)}
              error={errors.currentAge}
              placeholder="Enter current age"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Account can be opened for girl child up to 10 years of age
            </p>

            <Input
              label="Investment Period"
              type="number"
              suffix="years"
              value={inputs.termInYears}
              onChange={(e) => handleInputChange('termInYears', parseFloat(e.target.value) || 0)}
              error={errors.termInYears}
              formatDisplay={true}
              placeholder="Enter investment period"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Default: 15 years (can extend up to 21 years)
            </p>

            <Input
              label="Expected Interest Rate"
              type="number"
              suffix="%"
              step="0.1"
              value={inputs.interestRate}
              onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
              error={errors.interestRate}
              placeholder="Enter interest rate"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Current rate: 8.0% p.a. (Government declared rates change annually)
            </p>

            <Button 
              onClick={validateInputs}
              className="w-full"
              disabled={!calculation}
            >
              Calculate Maturity
            </Button>
          </div>
        </Card>

        {/* Results */}
        {calculation && (
          <Card title="Sukanya Samridhi Results">
            <div className="space-y-6">
              {/* Main Maturity Amount */}
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Maturity Amount</h3>
                <p className="text-4xl font-bold text-green-600">
                  {formatCurrency(calculation.maturityAmount)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Investment</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculation.totalDeposit)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Interest Earned</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculation.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Maturity Age</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {calculation.maturityAge} years
                  </span>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Key Benefits & Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Tax deduction up to ₹1.5 lakh under Section 80C</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Tax-free interest and maturity amount</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Partial withdrawal allowed after age 18 for higher education</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Account can be transferred anywhere in India</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Premature closure allowed after girl completes 18 years</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-medium text-amber-800 mb-2">Important Notes:</h5>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Deposits can be made for 15 years from account opening</p>
                  <p>• After 15 years, no deposits required but account continues to earn interest</p>
                  <p>• Account matures after 21 years from opening date</p>
                  <p>• Interest rates are declared by Government annually</p>
                </div>
              </div>

              {/* Returns Analysis */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Returns Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Return on Investment:</span>
                    <span className="font-medium">
                      {((calculation.totalInterest / calculation.totalDeposit) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual growth rate:</span>
                    <span className="font-medium">{inputs.interestRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wealth multiplier:</span>
                    <span className="font-medium">
                      {(calculation.maturityAmount / calculation.totalDeposit).toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};