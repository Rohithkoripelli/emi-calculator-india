import React, { useState, useMemo } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EMIInput, LoanType, TermUnit, PaymentFrequency } from '../../types';
import { calculateEMIDetails, formatCurrency, generatePaymentSchedule, calculateEMIWithPrepayments } from '../../utils/calculations';
import { format } from 'date-fns';
import { EMIBarChart } from '../charts/EMIBarChart';
import { EMIPieChart } from '../charts/EMIPieChart';
import { PaymentScheduleTable } from '../ui/PaymentScheduleTable';
import { PrepaymentForm } from '../ui/PrepaymentForm';
import { ExportOptions } from '../ui/ExportOptions';
import { validateEMIInputs } from '../../utils/validation';

export const EMICalculator: React.FC = () => {
  const [inputs, setInputs] = useState<EMIInput>({
    principal: 1000000,
    interestRate: 8.5,
    term: 20,
    termUnit: 'years',
    loanType: 'home',
    startDate: new Date(),
    paymentFrequency: 'monthly',
    prepayments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);
  const [showPrepayments, setShowPrepayments] = useState(false);

  const loanTypeOptions = [
    { value: 'home', label: 'Home Loan' },
    { value: 'car', label: 'Car Loan' },
    { value: 'personal', label: 'Personal Loan' }
  ];

  const termUnitOptions = [
    { value: 'years', label: 'Years' },
    { value: 'months', label: 'Months' }
  ];

  const paymentFrequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half Yearly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const calculation = useMemo(() => {
    if (inputs.principal > 0 && inputs.interestRate > 0 && inputs.term > 0) {
      return inputs.prepayments && inputs.prepayments.length > 0 
        ? calculateEMIWithPrepayments(inputs)
        : calculateEMIDetails(inputs);
    }
    return null;
  }, [inputs]);

  const paymentSchedule = useMemo(() => {
    if (calculation) {
      return generatePaymentSchedule(inputs);
    }
    return [];
  }, [calculation, inputs]);

  const handleInputChange = (field: keyof EMIInput, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInputs = () => {
    const validation = validateEMIInputs(inputs);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const getInterestRateGuidance = (loanType: LoanType): string => {
    const ranges = {
      home: '7.5% - 12.5%',
      car: '7% - 15%',
      personal: '10% - 24%'
    };
    return `Typical range for ${loanType} loans: ${ranges[loanType]}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">EMI Calculator</h1>
        <p className="text-sm sm:text-base text-gray-600">Calculate your Equated Monthly Installment for loans in India</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Form */}
        <Card title="Loan Details" className="h-fit">
          <div className="space-y-4">
            <Select
              label="Loan Type"
              options={loanTypeOptions}
              value={inputs.loanType}
              onChange={(e) => handleInputChange('loanType', e.target.value as LoanType)}
            />

            <Input
              label="Principal Amount"
              type="number"
              prefix="₹"
              value={inputs.principal}
              onChange={(e) => handleInputChange('principal', parseFloat(e.target.value) || 0)}
              error={errors.principal}
              placeholder="Enter loan amount"
            />

            <div>
              <Input
                label="Interest Rate"
                type="number"
                suffix="%"
                step="0.1"
                value={inputs.interestRate}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                error={errors.interestRate}
                placeholder="Enter annual interest rate"
              />
              <p className="text-xs text-gray-500 mt-1">
                {getInterestRateGuidance(inputs.loanType)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Loan Term"
                type="number"
                value={inputs.term}
                onChange={(e) => handleInputChange('term', parseFloat(e.target.value) || 0)}
                error={errors.term}
                placeholder="Enter term"
              />
              <Select
                label="Term Unit"
                options={termUnitOptions}
                value={inputs.termUnit}
                onChange={(e) => handleInputChange('termUnit', e.target.value as TermUnit)}
              />
            </div>

            <Input
              label="Loan Start Date"
              type="date"
              value={format(inputs.startDate, 'yyyy-MM-dd')}
              onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
            />

            <Select
              label="Payment Frequency"
              options={paymentFrequencyOptions}
              value={inputs.paymentFrequency}
              onChange={(e) => handleInputChange('paymentFrequency', e.target.value as PaymentFrequency)}
            />

            <Button 
              onClick={validateInputs}
              className="w-full"
              disabled={!calculation}
            >
              Calculate EMI
            </Button>

            {/* Advanced Options Toggle */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowPrepayments(!showPrepayments)}
                className="flex items-center justify-between w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Advanced Options</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${showPrepayments ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPrepayments && (
                <div className="mt-4">
                  <PrepaymentForm
                    prepayments={inputs.prepayments || []}
                    onPrepaymentsChange={(prepayments) => handleInputChange('prepayments', prepayments)}
                    maxMonths={inputs.termUnit === 'years' ? inputs.term * 12 : inputs.term}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results */}
        {calculation && (
          <Card title="EMI Calculation Results">
            <div className="space-y-6">
              {/* Main EMI Amount */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Monthly EMI</h3>
                <p className="text-4xl font-bold text-blue-600">
                  {formatCurrency(calculation.emi)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Principal Amount</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(calculation.principal)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Total Interest</span>
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

              {/* Key Statistics */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Loan Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Interest as % of total payment:</span>
                    <span className="font-medium">
                      {((calculation.totalInterest / calculation.totalPayment) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total payments:</span>
                    <span className="font-medium">
                      {paymentSchedule.length} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan completion date:</span>
                    <span className="font-medium">
                      {paymentSchedule.length > 0 ? format(paymentSchedule[paymentSchedule.length - 1].date, 'MMM yyyy') : 'N/A'}
                    </span>
                  </div>
                  {inputs.prepayments && inputs.prepayments.length > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>With prepayments:</span>
                        <span className="font-medium">
                          {paymentSchedule.length} months (vs {inputs.termUnit === 'years' ? inputs.term * 12 : inputs.term} original)
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Interest savings:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            calculateEMIDetails(inputs).totalInterest - calculation.totalInterest
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Charts and Payment Schedule */}
      {calculation && paymentSchedule.length > 0 && (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <div></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMonthlyChart(false)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      !showMonthlyChart 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setShowMonthlyChart(true)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      showMonthlyChart 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <EMIBarChart data={paymentSchedule} showMonthly={showMonthlyChart} />
            </Card>

            <Card>
              <EMIPieChart calculation={calculation} />
            </Card>
          </div>

          {/* Payment Schedule */}
          <Card>
            <PaymentScheduleTable schedule={paymentSchedule} />
          </Card>

          {/* Export Options */}
          <ExportOptions
            calculation={calculation}
            inputs={inputs}
            schedule={paymentSchedule}
            calculatorType="EMI"
          />
        </div>
      )}
    </div>
  );
};