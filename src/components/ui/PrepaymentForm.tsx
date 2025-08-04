import React, { useState } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Prepayment } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface PrepaymentFormProps {
  prepayments: Prepayment[];
  onPrepaymentsChange: (prepayments: Prepayment[]) => void;
  maxMonths: number;
}

export const PrepaymentForm: React.FC<PrepaymentFormProps> = ({
  prepayments,
  onPrepaymentsChange,
  maxMonths
}) => {
  const [newPrepayment, setNewPrepayment] = useState<Prepayment>({
    month: 12,
    amount: 50000,
    type: 'lumpsum'
  });

  const prepaymentTypeOptions = [
    { value: 'lumpsum', label: 'Lump Sum Payment' },
    { value: 'monthly-increase', label: 'Monthly Increase' }
  ];

  const addPrepayment = () => {
    if (newPrepayment.month > 0 && newPrepayment.amount > 0) {
      const updatedPrepayments = [...prepayments, { ...newPrepayment }]
        .sort((a, b) => a.month - b.month);
      onPrepaymentsChange(updatedPrepayments);
      
      // Reset form
      setNewPrepayment({
        month: Math.max(12, newPrepayment.month + 12),
        amount: 50000,
        type: 'lumpsum'
      });
    }
  };

  const removePrepayment = (index: number) => {
    const updatedPrepayments = prepayments.filter((_, i) => i !== index);
    onPrepaymentsChange(updatedPrepayments);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Prepayment Options</h4>
      
      {/* Existing Prepayments */}
      {prepayments.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-600">Scheduled Prepayments:</h5>
          {prepayments.map((prepayment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-900">
                  Month {prepayment.month}: {formatCurrency(prepayment.amount)}
                </span>
                <span className="text-xs text-blue-600 ml-2">
                  ({prepayment.type === 'lumpsum' ? 'Lump Sum' : 'Monthly Increase'})
                </span>
              </div>
              <button
                onClick={() => removePrepayment(index)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Prepayment */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Add Prepayment</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Month"
            type="number"
            value={newPrepayment.month}
            onChange={(e) => setNewPrepayment(prev => ({
              ...prev,
              month: Math.min(maxMonths, Math.max(1, parseInt(e.target.value) || 1))
            }))}
            placeholder="Month number"
          />
          
          <Input
            label="Amount"
            type="number"
            prefix="₹"
            value={newPrepayment.amount}
            onChange={(e) => setNewPrepayment(prev => ({
              ...prev,
              amount: Math.max(0, parseFloat(e.target.value) || 0)
            }))}
            placeholder="Prepayment amount"
          />
          
          <Select
            label="Type"
            options={prepaymentTypeOptions}
            value={newPrepayment.type}
            onChange={(e) => setNewPrepayment(prev => ({
              ...prev,
              type: e.target.value as 'lumpsum' | 'monthly-increase'
            }))}
          />
        </div>
        
        <Button
          onClick={addPrepayment}
          className="mt-3"
          size="sm"
          disabled={newPrepayment.month <= 0 || newPrepayment.amount <= 0}
        >
          Add Prepayment
        </Button>
      </div>

      {/* Prepayment Benefits Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h6 className="font-medium text-green-800 text-sm mb-2">💡 Prepayment Benefits:</h6>
        <div className="text-xs text-green-700 space-y-1">
          <p>• Reduces total interest burden significantly</p>
          <p>• Shortens loan tenure</p>
          <p>• Lump sum: Large one-time payment</p>
          <p>• Monthly increase: Permanent EMI increase</p>
        </div>
      </div>
    </div>
  );
};