import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EMICalculation } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface EMIPieChartProps {
  calculation: EMICalculation;
}

const COLORS = {
  Principal: '#3b82f6',
  Interest: '#ef4444'
};

export const EMIPieChart: React.FC<EMIPieChartProps> = ({ calculation }) => {
  const data = [
    {
      name: 'Principal',
      value: calculation.principal,
      percentage: ((calculation.principal / calculation.totalPayment) * 100).toFixed(1)
    },
    {
      name: 'Interest',
      value: calculation.totalInterest,
      percentage: ((calculation.totalInterest / calculation.totalPayment) * 100).toFixed(1)
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded-sm" 
              style={{ backgroundColor: COLORS[data.name as keyof typeof COLORS] }}
            ></div>
            <span className="font-medium text-gray-900">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div>Amount: {formatCurrency(data.value)}</div>
            <div>Percentage: {data.percentage}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {percentage}%
      </text>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Total Payment Breakdown
        </h3>
        <p className="text-sm text-gray-600">
          Overall distribution of principal and interest
        </p>
      </div>
      
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value}: {formatCurrency(data.find(d => d.name === value)?.value || 0)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700">Principal Amount</div>
          <div className="text-lg font-bold text-blue-900">
            {formatCurrency(calculation.principal)}
          </div>
          <div className="text-xs text-blue-600">
            {((calculation.principal / calculation.totalPayment) * 100).toFixed(1)}% of total
          </div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-700">Interest Amount</div>
          <div className="text-lg font-bold text-red-900">
            {formatCurrency(calculation.totalInterest)}
          </div>
          <div className="text-xs text-red-600">
            {((calculation.totalInterest / calculation.totalPayment) * 100).toFixed(1)}% of total
          </div>
        </div>
      </div>
    </div>
  );
};