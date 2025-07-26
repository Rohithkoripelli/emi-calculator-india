import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { EMIInput, LoanType, TermUnit, PaymentFrequency } from '../../types';
import { calculateEMIDetails, formatCurrency, generatePaymentSchedule, calculateEMIWithPrepayments, formatIndianNumber } from '../../utils/calculations';
import { format } from 'date-fns';
import { EMIBarChart } from '../charts/EMIBarChart';
import { EMIPieChart } from '../charts/EMIPieChart';
import { PaymentScheduleTable } from '../ui/PaymentScheduleTable';
import { PrepaymentForm } from '../ui/PrepaymentForm';
import { ExportOptions } from '../ui/ExportOptions';
import { validateEMIInputs } from '../../utils/validation';

interface ImprovedEMICalculatorProps {
  onLoanDataChange?: (loanData: any) => void;
  onAIOpen?: () => void;
}

export const ImprovedEMICalculator: React.FC<ImprovedEMICalculatorProps> = ({ onLoanDataChange, onAIOpen }) => {
  const [inputs, setInputs] = useState<EMIInput>({
    principal: 5000000, // 50 lakhs for home loan - REAL VALUE
    interestRate: 8.5,
    term: 20,
    termUnit: 'years',
    loanType: 'home',
    startDate: new Date(),
    paymentFrequency: 'monthly',
    prepayments: []
  });

  // Default values based on loan type
  const getDefaults = (loanType: LoanType) => {
    switch (loanType) {
      case 'home':
        return {
          principal: 5000000, // 50 lakhs
          interestRate: 8.5,
          term: 20,
          termUnit: 'years' as TermUnit
        };
      case 'car':
        return {
          principal: 1000000, // 10 lakhs
          interestRate: 9.5,
          term: 5,
          termUnit: 'years' as TermUnit
        };
      case 'personal':
        return {
          principal: 1000000, // 10 lakhs
          interestRate: 11.0,
          term: 3,
          termUnit: 'years' as TermUnit
        };
      default:
        return {
          principal: 5000000,
          interestRate: 8.5,
          term: 20,
          termUnit: 'years' as TermUnit
        };
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);
  const [showPrepayments, setShowPrepayments] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'charts' | 'schedule'>('results');

  const loanTypeOptions = [
    { value: 'home', label: 'Home Loan' },
    { value: 'car', label: 'Car Loan' },
    { value: 'personal', label: 'Personal Loan' }
  ];

  const termUnitOptions = [
    { value: 'years', label: 'Years' },
    { value: 'months', label: 'Months' }
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
    if (field === 'loanType') {
      // When loan type changes, update all defaults
      const defaults = getDefaults(value as LoanType);
      setInputs(prev => ({ 
        ...prev, 
        loanType: value,
        principal: defaults.principal,
        interestRate: defaults.interestRate,
        term: defaults.term,
        termUnit: defaults.termUnit
      }));
    } else {
      setInputs(prev => ({ ...prev, [field]: value }));
    }
    
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
    return `Typical range: ${ranges[loanType]}`;
  };

  // Quick calculation for display without validation
  const quickCalc = useMemo(() => {
    if (inputs.principal > 0 && inputs.interestRate > 0 && inputs.term > 0) {
      try {
        return calculateEMIDetails(inputs);
      } catch {
        return null;
      }
    }
    return null;
  }, [inputs]);

  // Update loan data for AI Assistant
  useEffect(() => {
    if (calculation && onLoanDataChange) {
      const loanData = {
        principal: inputs.principal,
        interestRate: inputs.interestRate,
        term: inputs.term,
        termUnit: inputs.termUnit,
        loanType: inputs.loanType,
        startDate: inputs.startDate,
        emi: calculation.emi,
        totalInterest: calculation.totalInterest,
        totalPayment: calculation.totalPayment
      };
      onLoanDataChange(loanData);
    }
  }, [calculation, inputs, onLoanDataChange]);

  return (
    <div className="space-y-6">
      {/* AI Promotional Banner */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">🤖 Ask Our AI Financial Assistant</h3>
              <p className="text-sm text-green-100">Get personalized advice, compare scenarios, and optimize your loans with GPT-4 powered insights!</p>
            </div>
          </div>
          <button 
            onClick={() => onAIOpen?.()}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <span>Try Now</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hero Section with Quick Calculation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">EMI Calculator</h2>
              <p className="text-gray-600">Calculate your Equated Monthly Installment instantly</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {loanTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange('loanType', option.value as LoanType)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    inputs.loanType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Input
                label="Loan Amount"
                type="number"
                prefix="₹"
                value={inputs.principal}
                onChange={(e) => handleInputChange('principal', parseFloat(e.target.value) || 0)}
                error={errors.principal}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Interest Rate"
                  type="number"
                  suffix="%"
                  step="0.1"
                  value={inputs.interestRate}
                  onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                  error={errors.interestRate}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Tenure"
                    type="number"
                    value={inputs.term}
                    onChange={(e) => handleInputChange('term', parseFloat(e.target.value) || 0)}
                    error={errors.term}
                  />
                  <Select
                    label="Unit"
                    options={termUnitOptions}
                    value={inputs.termUnit}
                    onChange={(e) => handleInputChange('termUnit', e.target.value as TermUnit)}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {getInterestRateGuidance(inputs.loanType)}
              </div>
            </div>
          </div>

          {/* Quick Results */}
          <div className="lg:pl-8">
            {quickCalc ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Monthly EMI</div>
                  <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-1">
                    {formatCurrency(quickCalc.emi)}
                  </div>
                  <div className="text-sm text-gray-500">
                    for {formatIndianNumber(inputs.principal)} at {inputs.interestRate}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(quickCalc.totalInterest)}
                    </div>
                    <div className="text-sm text-gray-500">Total Interest</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(quickCalc.totalPayment)}
                    </div>
                    <div className="text-sm text-gray-500">Total Payment</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    Interest: {((quickCalc.totalInterest / quickCalc.totalPayment) * 100).toFixed(1)}% of total payment
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🏠</div>
                  <div>Enter loan details to see EMI calculation</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Results Section */}
      {calculation && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Results & Options
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'charts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Charts & Analysis
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Schedule
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'results' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Detailed Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                <Card title="Loan Breakdown">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculation.principal)}
                      </div>
                      <div className="text-sm text-blue-700">Principal Amount</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(calculation.totalInterest)}
                      </div>
                      <div className="text-sm text-red-700">Total Interest</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount to Pay</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(calculation.totalPayment)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Advanced Options */}
                <Card title="Advanced Options">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Start Date"
                        type="date"
                        value={format(inputs.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                      />
                      <Select
                        label="Payment Frequency"
                        options={[
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'quarterly', label: 'Quarterly' }
                        ]}
                        value={inputs.paymentFrequency}
                        onChange={(e) => handleInputChange('paymentFrequency', e.target.value as PaymentFrequency)}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => setShowPrepayments(!showPrepayments)}
                        className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium">Prepayment Options</span>
                        <span className="text-gray-500">
                          {showPrepayments ? '−' : '+'}
                        </span>
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
              </div>

              {/* Summary Stats */}
              <div>
                <Card title="Quick Summary">
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700">EMI Amount</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculation.emi)}
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Loan Term:</span>
                        <span className="font-medium">
                          {paymentSchedule.length} months
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Rate:</span>
                        <span className="font-medium">{inputs.interestRate}% p.a.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loan Type:</span>
                        <span className="font-medium capitalize">{inputs.loanType}</span>
                      </div>
                    </div>

                    {inputs.prepayments && inputs.prepayments.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-green-700 mb-2">
                          Prepayment Benefits:
                        </div>
                        <div className="text-sm text-green-600">
                          Interest Saved: {formatCurrency(
                            calculateEMIDetails(inputs).totalInterest - calculation.totalInterest
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">EMI Breakdown</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowMonthlyChart(false)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          !showMonthlyChart ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Yearly
                      </button>
                      <button
                        onClick={() => setShowMonthlyChart(true)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          showMonthlyChart ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
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
            </div>
          )}

          {activeTab === 'schedule' && (
            <Card>
              <PaymentScheduleTable schedule={paymentSchedule} />
            </Card>
          )}

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