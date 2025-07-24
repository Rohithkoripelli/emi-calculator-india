import React, { useState, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CreditCardInput } from '../../types';
import { calculateCreditCardEMI, formatCurrency } from '../../utils/calculations';

export const CreditCardCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CreditCardInput>({
    purchaseAmount: 50000,
    gstRate: 18,
    interestRate: 36,
    tenure: 12
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const gstOptions = [
    { value: '0', label: 'No GST (0%)' },
    { value: '5', label: 'GST 5%' },
    { value: '12', label: 'GST 12%' },
    { value: '18', label: 'GST 18%' },
    { value: '28', label: 'GST 28%' }
  ];

  const calculation = useMemo(() => {
    if (inputs.purchaseAmount > 0 && inputs.interestRate > 0 && inputs.tenure > 0) {
      return calculateCreditCardEMI(inputs);
    }
    return null;
  }, [inputs]);

  const handleInputChange = (field: keyof CreditCardInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    if (inputs.purchaseAmount <= 0) {
      newErrors.purchaseAmount = 'Purchase amount must be greater than 0';
    }
    if (inputs.purchaseAmount > 10000000) {
      newErrors.purchaseAmount = 'Purchase amount seems too high';
    }
    if (inputs.gstRate < 0 || inputs.gstRate > 50) {
      newErrors.gstRate = 'GST rate should be between 0% and 50%';
    }
    if (inputs.interestRate <= 0 || inputs.interestRate > 60) {
      newErrors.interestRate = 'Interest rate should be between 0.1% and 60%';
    }
    if (inputs.tenure < 1 || inputs.tenure > 60) {
      newErrors.tenure = 'Tenure should be between 1 and 60 months';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit Card EMI + GST Calculator</h1>
        <p className="text-gray-600">Calculate EMI for credit card purchases including GST implications</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card title="Purchase & EMI Details" className="h-fit">
          <div className="space-y-4">
            <Input
              label="Purchase Amount (Before GST)"
              type="number"
              prefix="₹"
              value={inputs.purchaseAmount}
              onChange={(e) => handleInputChange('purchaseAmount', parseFloat(e.target.value) || 0)}
              error={errors.purchaseAmount}
              placeholder="Enter purchase amount"
            />

            <Select
              label="GST Rate"
              options={gstOptions}
              value={inputs.gstRate.toString()}
              onChange={(e) => handleInputChange('gstRate', parseFloat(e.target.value) || 0)}
            />

            <Input
              label="Credit Card Interest Rate"
              type="number"
              suffix="% p.a."
              step="0.1"
              value={inputs.interestRate}
              onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
              error={errors.interestRate}
              placeholder="Enter annual interest rate"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Typical credit card rates: 24% - 48% per annum
            </p>

            <Input
              label="EMI Tenure"
              type="number"
              suffix="months"
              value={inputs.tenure}
              onChange={(e) => handleInputChange('tenure', parseFloat(e.target.value) || 0)}
              error={errors.tenure}
              placeholder="Enter EMI tenure"
            />
            <p className="text-xs text-gray-500 -mt-3">
              Most banks offer 3 to 24 months EMI options
            </p>

            <Button 
              onClick={validateInputs}
              className="w-full"
              disabled={!calculation}
            >
              Calculate EMI
            </Button>
          </div>
        </Card>

        {/* Results */}
        {calculation && (
          <Card title="Credit Card EMI Results">
            <div className="space-y-6">
              {/* Main EMI Amount */}
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Monthly EMI</h3>
                <p className="text-4xl font-bold text-red-600">
                  {formatCurrency(calculation.emi)}
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Purchase Amount</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(inputs.purchaseAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">GST Amount ({inputs.gstRate}%)</span>
                  <span className="text-lg font-semibold text-orange-600">
                    {formatCurrency(calculation.gstAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Amount (Including GST)</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculation.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Interest Charges</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(calculation.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Payment</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculation.totalPayment)}
                  </span>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Cost Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Effective cost of purchase:</span>
                    <span className="font-medium">
                      {formatCurrency(calculation.totalPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional cost due to EMI:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(calculation.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional cost percentage:</span>
                    <span className="font-medium">
                      {((calculation.totalInterest / calculation.totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly interest rate:</span>
                    <span className="font-medium">
                      {(inputs.interestRate / 12).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* GST Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">GST Information:</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• GST is calculated on the purchase amount before EMI conversion</p>
                  <p>• Total amount (including GST) is converted to EMI</p>
                  <p>• GST input credit available for business purchases</p>
                  <p>• Personal purchases don't qualify for GST input credit</p>
                </div>
              </div>

              {/* Credit Card Tips */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Smart Tips</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Compare EMI rates across different banks and cards</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Check for processing fees and other charges</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Consider 0% EMI offers during festive seasons</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Shorter tenure means lower total interest cost</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Avoid converting small amounts to EMI due to high interest</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2">Important Warnings:</h5>
                <div className="text-sm text-red-700 space-y-1">
                  <p>• Credit card EMIs carry high interest rates compared to personal loans</p>
                  <p>• Missing EMI payments can severely impact your credit score</p>
                  <p>• Additional charges may apply for EMI conversion</p>
                  <p>• Pre-closure of EMI may not be allowed by all banks</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};