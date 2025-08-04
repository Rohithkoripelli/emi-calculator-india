import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CapitalGainsData {
  investmentType: 'equity' | 'debt' | 'gold' | 'real-estate';
  taxType: 'stcg' | 'ltcg';
  purchasePrice: number;
  sellPrice: number;
  quantity: number;
  purchaseDate: string;
  sellDate: string;
  // Detailed Transfer Expenses
  brokerageBuy: number;
  brokerageSell: number;
  sttBuy: number;
  sttSell: number;
  stampDuty: number;
  exchangeCharges: number;
  sebiCharges: number;
  gst: number;
  otherExpenses: number;
  previousYearLTCGUsed: number;
}

interface CapitalGainsResult {
  capitalGain: number;
  taxableGain: number;
  taxAmount: number;
  netGain: number;
  taxRate: number;
  holdingPeriod: number;
  isLongTerm: boolean;
  exemptionUsed: number;
  exemptionRemaining: number;
  totalTransferExpenses: number;
  sttDetails: {
    buySTT: number;
    sellSTT: number;
    totalSTT: number;
  };
}

export const CapitalGainsCalculator: React.FC = () => {
  const [formData, setFormData] = useState<CapitalGainsData>({
    investmentType: 'equity',
    taxType: 'stcg',
    purchasePrice: 100,
    sellPrice: 150,
    quantity: 100,
    purchaseDate: '',
    sellDate: '',
    // Initialize all transfer expenses to 0
    brokerageBuy: 0,
    brokerageSell: 0,
    sttBuy: 0,
    sttSell: 0,
    stampDuty: 0,
    exchangeCharges: 0,
    sebiCharges: 0,
    gst: 0,
    otherExpenses: 0,
    previousYearLTCGUsed: 0
  });

  const [result, setResult] = useState<CapitalGainsResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Set default dates
  useEffect(() => {
    if (!formData.purchaseDate || !formData.sellDate) {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      setFormData(prev => ({
        ...prev,
        purchaseDate: oneYearAgo.toISOString().split('T')[0],
        sellDate: today.toISOString().split('T')[0]
      }));
    }
  }, [formData.purchaseDate, formData.sellDate]);

  const calculateHoldingPeriod = (purchaseDate: string, sellDate: string): number => {
    const purchase = new Date(purchaseDate);
    const sell = new Date(sellDate);
    const diffTime = Math.abs(sell.getTime() - purchase.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getClassification = (investmentType: string, holdingDays: number): 'stcg' | 'ltcg' => {
    switch (investmentType) {
      case 'equity':
        return holdingDays > 365 ? 'ltcg' : 'stcg';
      case 'debt':
        // Post April 2023 - all debt gains are taxed as per slab rate
        return 'stcg';
      case 'gold':
      case 'real-estate':
        return holdingDays > (2 * 365) ? 'ltcg' : 'stcg';
      default:
        return 'stcg';
    }
  };

  const getTaxRate = (investmentType: string, taxType: 'stcg' | 'ltcg'): number => {
    if (investmentType === 'equity') {
      return taxType === 'stcg' ? 20 : 12.5; // Updated July 23, 2024 rates
    } else if (investmentType === 'debt') {
      return 30; // Taxed at slab rate (assuming highest bracket)
    } else if (investmentType === 'gold') {
      return taxType === 'stcg' ? 30 : 12.5;
    } else if (investmentType === 'real-estate') {
      return taxType === 'stcg' ? 30 : 12.5;
    }
    return 30;
  };

  // Accurate STT calculation based on 2024 rates
  const calculateSTT = (investmentType: string, purchaseValue: number, sellValue: number) => {
    let buySTT = 0;
    let sellSTT = 0;

    if (investmentType === 'equity') {
      // Equity STT rates (delivery-based): 0.1% on both buy and sell
      buySTT = purchaseValue * 0.001; // 0.1%
      sellSTT = sellValue * 0.001; // 0.1%
    } else if (investmentType === 'debt') {
      // No STT on debt funds
      buySTT = 0;
      sellSTT = 0;
    } else if (investmentType === 'gold') {
      // Gold ETF STT: 0.1% on sell side only
      buySTT = 0;
      sellSTT = sellValue * 0.001; // 0.1%
    }

    // Round off STT as per rules: >= 50 paise rounds up, < 50 paise rounds down
    const roundSTT = (amount: number) => {
      const paise = (amount * 100) % 100;
      return paise >= 50 ? Math.ceil(amount) : Math.floor(amount);
    };

    return {
      buySTT: roundSTT(buySTT),
      sellSTT: roundSTT(sellSTT),
      totalSTT: roundSTT(buySTT + sellSTT)
    };
  };

  // Auto-calculate STT when investment type or values change
  const autoCalculateSTT = (investmentType: string, purchasePrice: number, sellPrice: number, quantity: number) => {
    const purchaseValue = purchasePrice * quantity;
    const sellValue = sellPrice * quantity;
    return calculateSTT(investmentType, purchaseValue, sellValue);
  };

  const calculateCapitalGains = useCallback((): CapitalGainsResult => {
    const { 
      purchasePrice, sellPrice, quantity, purchaseDate, sellDate, previousYearLTCGUsed, investmentType,
      brokerageBuy, brokerageSell, sttBuy, sttSell, stampDuty, exchangeCharges, sebiCharges, gst, otherExpenses
    } = formData;
    
    const totalPurchaseValue = purchasePrice * quantity;
    const totalSellValue = sellPrice * quantity;
    
    // Calculate total transfer expenses
    const totalTransferExpenses = brokerageBuy + brokerageSell + sttBuy + sttSell + 
                                  stampDuty + exchangeCharges + sebiCharges + gst + otherExpenses;
    
    // Auto-calculate STT for reference (user can override)
    const sttDetails = autoCalculateSTT(investmentType, purchasePrice, sellPrice, quantity);
    
    // Capital gain = Sale Value - Purchase Value - All Transfer Expenses
    const capitalGain = totalSellValue - totalPurchaseValue - totalTransferExpenses;
    
    const holdingDays = calculateHoldingPeriod(purchaseDate, sellDate);
    const actualTaxType = getClassification(investmentType, holdingDays);
    const isLongTerm = actualTaxType === 'ltcg';
    
    let taxableGain = capitalGain;
    let exemptionUsed = 0;
    let exemptionRemaining = 0;
    
    // Apply LTCG exemption for equity (₹1.25 lakh for FY 2024-25)
    if (investmentType === 'equity' && isLongTerm && capitalGain > 0) {
      const totalExemptionLimit = 125000; // ₹1.25 lakh
      const availableExemption = Math.max(0, totalExemptionLimit - previousYearLTCGUsed);
      exemptionUsed = Math.min(capitalGain, availableExemption);
      exemptionRemaining = availableExemption - exemptionUsed;
      taxableGain = Math.max(0, capitalGain - exemptionUsed);
    }
    
    const taxRate = getTaxRate(investmentType, actualTaxType);
    const taxAmount = taxableGain > 0 ? (taxableGain * taxRate) / 100 : 0;
    const netGain = capitalGain - taxAmount;
    
    return {
      capitalGain,
      taxableGain,
      taxAmount,
      netGain,
      taxRate,
      holdingPeriod: holdingDays,
      isLongTerm,
      exemptionUsed,
      exemptionRemaining,
      totalTransferExpenses,
      sttDetails
    };
  }, [formData, autoCalculateSTT]);

  useEffect(() => {
    if (formData.purchaseDate && formData.sellDate) {
      const calculatedResult = calculateCapitalGains();
      setResult(calculatedResult);
      
      // Auto-update tax type based on holding period
      const holdingDays = calculateHoldingPeriod(formData.purchaseDate, formData.sellDate);
      const actualTaxType = getClassification(formData.investmentType, holdingDays);
      if (actualTaxType !== formData.taxType) {
        setFormData(prev => ({ ...prev, taxType: actualTaxType }));
      }
    }
  }, [formData, calculateCapitalGains]);

  const handleInputChange = (field: keyof CapitalGainsData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-populate STT fields when investment type or values change
  const autoPopulateSTT = () => {
    const sttCalc = autoCalculateSTT(formData.investmentType, formData.purchasePrice, formData.sellPrice, formData.quantity);
    setFormData(prev => ({
      ...prev,
      sttBuy: sttCalc.buySTT,
      sttSell: sttCalc.sellSTT
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInvestmentTypeInfo = () => {
    switch (formData.investmentType) {
      case 'equity':
        return 'Shares, Equity Mutual Funds, ELSS';
      case 'debt':
        return 'Debt Mutual Funds, Bonds, FDs';
      case 'gold':
        return 'Gold ETFs, Gold Mutual Funds, Physical Gold';
      case 'real-estate':
        return 'Property, Land, Real Estate';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
          Capital Gains Tax Calculator
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary">
          Calculate STCG & LTCG tax as per latest Indian tax rules (Updated July 2024)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Form */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-4 sm:mb-6">
            Investment Details
          </h2>

          <div className="space-y-4">
            {/* Investment Type */}
            <Select
              label="Investment Type"
              value={formData.investmentType}
              onChange={(e) => handleInputChange('investmentType', e.target.value)}
              options={[
                { value: 'equity', label: 'Equity (Shares/Equity MF)' },
                { value: 'debt', label: 'Debt (Debt MF/Bonds)' },
                { value: 'gold', label: 'Gold (ETF/Physical)' },
                { value: 'real-estate', label: 'Real Estate' }
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-dark-text-muted -mt-2 mb-4">
              {getInvestmentTypeInfo()}
            </p>

            {/* Purchase Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Purchase Price (₹)"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
              <Input
                label="Quantity/Units"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.001"
              />
            </div>

            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
            />

            {/* Sale Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sale Price (₹)"
                type="number"
                value={formData.sellPrice}
                onChange={(e) => handleInputChange('sellPrice', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
              <Input
                label="Sale Date"
                type="date"
                value={formData.sellDate}
                onChange={(e) => handleInputChange('sellDate', e.target.value)}
              />
            </div>

            {/* Transfer Expenses Section */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-dark-surface rounded-lg border">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm sm:text-base">
                  Transfer Expenses
                </h4>
                <button
                  type="button"
                  onClick={autoPopulateSTT}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Auto-calculate STT
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Brokerage (Buy) ₹"
                  type="number"
                  value={formData.brokerageBuy}
                  onChange={(e) => handleInputChange('brokerageBuy', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <Input
                  label="Brokerage (Sell) ₹"
                  type="number"
                  value={formData.brokerageSell}
                  onChange={(e) => handleInputChange('brokerageSell', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <Input
                  label="STT (Buy) ₹"
                  type="number"
                  value={formData.sttBuy}
                  onChange={(e) => handleInputChange('sttBuy', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="Auto-calculated"
                />
                <Input
                  label="STT (Sell) ₹"
                  type="number"
                  value={formData.sttSell}
                  onChange={(e) => handleInputChange('sttSell', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="Auto-calculated"
                />
                <Input
                  label="Stamp Duty ₹"
                  type="number"
                  value={formData.stampDuty}
                  onChange={(e) => handleInputChange('stampDuty', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.003% of buy value"
                />
                <Input
                  label="Exchange Charges ₹"
                  type="number"
                  value={formData.exchangeCharges}
                  onChange={(e) => handleInputChange('exchangeCharges', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="NSE/BSE charges"
                />
                <Input
                  label="SEBI Charges ₹"
                  type="number"
                  value={formData.sebiCharges}
                  onChange={(e) => handleInputChange('sebiCharges', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="₹10 per crore"
                />
                <Input
                  label="GST ₹"
                  type="number"
                  value={formData.gst}
                  onChange={(e) => handleInputChange('gst', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="18% on brokerage + charges"
                />
              </div>
              
              <Input
                label="Other Expenses ₹"
                type="number"
                value={formData.otherExpenses}
                onChange={(e) => handleInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="Any other transaction costs"
              />
              
              {result && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                    Total Transfer Expenses: {formatCurrency(result.totalTransferExpenses)}
                  </div>
                  {result.sttDetails.totalSTT > 0 && (
                    <div className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">
                      STT Reference: Buy ₹{result.sttDetails.buySTT.toFixed(0)}, Sell ₹{result.sttDetails.sellSTT.toFixed(0)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LTCG Exemption Used */}
            {formData.investmentType === 'equity' && result?.isLongTerm && (
              <Input
                label="LTCG Exemption Already Used This Year (₹)"
                type="number"
                value={formData.previousYearLTCGUsed}
                onChange={(e) => handleInputChange('previousYearLTCGUsed', parseFloat(e.target.value) || 0)}
                min="0"
                max="125000"
                step="1000"
                placeholder="Out of ₹1,25,000 annual limit"
              />
            )}
          </div>
        </Card>

        {/* Results */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-4 sm:mb-6">
            Tax Calculation Results
          </h2>

          {result && (
            <div className="space-y-4">
              {/* Tax Classification */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {result.isLongTerm ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-dark-text text-sm sm:text-base">
                    {result.isLongTerm ? 'Long Term Capital Gains (LTCG)' : 'Short Term Capital Gains (STCG)'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary">
                  Holding Period: {result.holdingPeriod} days ({Math.floor(result.holdingPeriod / 365)} years, {result.holdingPeriod % 365} days)
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary">
                  Tax Rate: {result.taxRate}%
                </p>
              </div>

              {/* Capital Gain Calculation */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-secondary">Sale Value:</span>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">
                    {formatCurrency(formData.sellPrice * formData.quantity)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-secondary">Purchase Value:</span>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">
                    {formatCurrency(formData.purchasePrice * formData.quantity)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-secondary">Transfer Expenses:</span>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">
                    {formatCurrency(result.totalTransferExpenses)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">Capital Gain:</span>
                  <span className={`font-bold text-base sm:text-lg ${result.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(result.capitalGain)}
                  </span>
                </div>

                {/* LTCG Exemption */}
                {formData.investmentType === 'equity' && result.isLongTerm && result.capitalGain > 0 && (
                  <>
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-secondary">LTCG Exemption Used:</span>
                      <span className="font-medium text-sm sm:text-base text-green-600">
                        {formatCurrency(result.exemptionUsed)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm sm:text-base text-gray-700 dark:text-dark-text-secondary">Remaining Exemption:</span>
                      <span className="font-medium text-sm sm:text-base text-green-600">
                        {formatCurrency(result.exemptionRemaining)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">Taxable Gain:</span>
                  <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-text">
                    {formatCurrency(result.taxableGain)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">Tax Amount:</span>
                  <span className="font-bold text-base sm:text-lg text-red-600">
                    {formatCurrency(result.taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 sm:p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-dark-text">Net Gain After Tax:</span>
                  <span className="font-bold text-lg sm:text-xl text-green-600">
                    {formatCurrency(result.netGain)}
                  </span>
                </div>
              </div>

              {/* Additional Info Button */}
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                className="w-full mt-4 text-sm sm:text-base"
              >
                <InformationCircleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                {showDetails ? 'Hide' : 'Show'} Tax Rules & Info
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <Card className="p-4 sm:p-6 mt-4 sm:mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
            Capital Gains Tax Rules (Updated July 2024)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-dark-text mb-3">Equity Investments</h4>
              <ul className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li><strong>STCG:</strong> Holding ≤ 12 months → 20% tax (effective July 23, 2024)</li>
                <li><strong>LTCG:</strong> Holding &gt; 12 months → 12.5% tax (effective July 23, 2024)</li>
                <li><strong>Exemption:</strong> First ₹1.25 lakh LTCG is tax-free annually</li>
                <li><strong>STT:</strong> 0.1% on both buy and sell for delivery trades</li>
                <li><strong>Stamp Duty:</strong> 0.003% on purchase value</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-dark-text mb-3">Debt Investments</h4>
              <ul className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li><strong>All Gains:</strong> Taxed at income tax slab rate</li>
                <li><strong>No Indexation:</strong> Indexation benefit removed from April 2023</li>
                <li><strong>No LTCG:</strong> All debt fund gains are now STCG</li>
                <li><strong>Maximum Rate:</strong> Up to 30% + cess for highest bracket</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-dark-text mb-3">Gold & Real Estate</h4>
              <ul className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li><strong>STCG:</strong> Holding ≤ 24 months → 30% (slab rate)</li>
                <li><strong>LTCG:</strong> Holding &gt; 24 months → 12.5% (no indexation)</li>
                <li><strong>No Exemption:</strong> No annual exemption limit</li>
                <li><strong>Previous Benefit:</strong> 20% with indexation removed</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-dark-text mb-3">Transfer Expenses (Accurate Rates)</h4>
              <ul className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li><strong>STT Equity:</strong> 0.1% on buy + 0.1% on sell (delivery)</li>
                <li><strong>STT Intraday:</strong> 0.025% on sell side only</li>
                <li><strong>Stamp Duty:</strong> 0.003% on purchase value (all states)</li>
                <li><strong>Exchange Charges:</strong> NSE ~0.0035%, BSE ~0.003%</li>
                <li><strong>SEBI Charges:</strong> ₹10 per crore of turnover</li>
                <li><strong>GST:</strong> 18% on (brokerage + exchange + SEBI charges)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-dark-text mb-3">Important Notes</h4>
              <ul className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li><strong>Rate Changes:</strong> New rates effective July 23, 2024</li>
                <li><strong>STT Rounding:</strong> ≥50 paise rounds up, &lt;50 paise rounds down</li>
                <li><strong>All Expenses:</strong> Include all transfer costs for accurate calculation</li>
                <li><strong>Set-off:</strong> Capital losses can be set off against gains</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Disclaimer:</strong> This calculator provides estimates based on current tax rules. 
              Consult a tax advisor for complex scenarios or specific advice. Tax rules may change, 
              and individual circumstances may affect calculations.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};