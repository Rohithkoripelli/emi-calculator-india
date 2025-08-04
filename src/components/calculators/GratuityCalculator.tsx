import React, { useState, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GratuityInput } from '../../types';
import { calculateGratuity, formatCurrency } from '../../utils/calculations';

export const GratuityCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<GratuityInput>({
    monthlySalary: 50000,
    yearsOfService: 10,
    lastDrawnSalary: 60000
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculation = useMemo(() => {
    if (inputs.lastDrawnSalary > 0 && inputs.yearsOfService > 0) {
      return calculateGratuity(inputs);
    }
    return null;
  }, [inputs]);

  const handleInputChange = (field: keyof GratuityInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    if (inputs.monthlySalary <= 0) {
      newErrors.monthlySalary = 'Monthly salary must be greater than 0';
    }
    if (inputs.lastDrawnSalary <= 0) {
      newErrors.lastDrawnSalary = 'Last drawn salary must be greater than 0';
    }
    if (inputs.yearsOfService < 0) {
      newErrors.yearsOfService = 'Years of service cannot be negative';
    }
    if (inputs.yearsOfService > 50) {
      newErrors.yearsOfService = 'Years of service seems too high';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gratuity Calculator</h1>
        <p className="text-gray-600">Calculate gratuity amount as per Indian labor laws</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card title="Employment Details" className="h-fit">
          <div className="space-y-4">
            <Input
              label="Current Monthly Salary"
              type="number"
              prefix="₹"
              value={inputs.monthlySalary}
              onChange={(e) => handleInputChange('monthlySalary', parseFloat(e.target.value) || 0)}
              error={errors.monthlySalary}
              placeholder="Enter current monthly salary"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Current basic salary + dearness allowance (if applicable)
            </p>

            <Input
              label="Years of Continuous Service"
              type="number"
              suffix="years"
              value={inputs.yearsOfService}
              onChange={(e) => handleInputChange('yearsOfService', parseFloat(e.target.value) || 0)}
              error={errors.yearsOfService}
              placeholder="Enter years of service"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Minimum 5 years of continuous service required for gratuity eligibility
            </p>

            <Input
              label="Last Drawn Monthly Salary"
              type="number"
              prefix="₹"
              value={inputs.lastDrawnSalary}
              onChange={(e) => handleInputChange('lastDrawnSalary', parseFloat(e.target.value) || 0)}
              error={errors.lastDrawnSalary}
              placeholder="Enter last drawn salary"
              formatDisplay={true}
            />
            <p className="text-xs text-gray-500 -mt-3">
              Salary at the time of leaving/retirement (basic + DA)
            </p>

            <Button 
              onClick={validateInputs}
              className="w-full"
              disabled={!calculation}
            >
              Calculate Gratuity
            </Button>
          </div>
        </Card>

        {/* Results */}
        {calculation && (
          <Card title="Gratuity Calculation Results">
            <div className="space-y-6">
              {/* Eligibility Status */}
              <div className={`text-center p-4 rounded-lg border ${
                calculation.isEligible 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Eligibility Status</h3>
                <p className={`text-xl font-bold ${
                  calculation.isEligible ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculation.isEligible ? 'Eligible for Gratuity' : 'Not Eligible'}
                </p>
                {!calculation.isEligible && (
                  <p className="text-sm text-red-600 mt-2">
                    Minimum 5 years of continuous service required
                  </p>
                )}
              </div>

              {calculation.isEligible && (
                <>
                  {/* Main Gratuity Amount */}
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Gratuity Amount</h3>
                    <p className="text-4xl font-bold text-blue-600">
                      {formatCurrency(calculation.gratuityAmount)}
                    </p>
                  </div>

                  {/* Calculation Details */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Last Drawn Salary</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(inputs.lastDrawnSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Eligible Years of Service</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {calculation.eligibleYears} years
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Maximum Limit</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₹20,00,000
                      </span>
                    </div>
                  </div>

                  {/* Calculation Formula */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Calculation Formula</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-mono text-gray-800">
                        Gratuity = (Last Salary × Years of Service × 15) ÷ 26
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Formula as per Payment of Gratuity Act, 1972
                      </p>
                    </div>
                  </div>

                  {/* Important Information */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Important Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>15 days salary for each completed year of service</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>26 working days considered per month</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Maximum gratuity amount capped at ₹20 lakhs</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Tax exempted up to ₹20 lakhs under Section 10(10)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Payable on retirement, resignation, death, or disablement</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-800 mb-2">Tax Benefits:</h5>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Gratuity up to ₹20 lakhs is completely tax-free</p>
                      <p>• No TDS deduction if within exemption limit</p>
                      <p>• Amount above ₹20 lakhs is taxable as salary income</p>
                    </div>
                  </div>
                </>
              )}

              {/* Legal Information */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-medium text-amber-800 mb-2">Legal Requirements:</h5>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Applicable to organizations with 10+ employees</p>
                  <p>• Must be paid within 30 days of becoming due</p>
                  <p>• Employee can forfeit gratuity in cases of misconduct</p>
                  <p>• Nominee designation recommended for legal purposes</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};