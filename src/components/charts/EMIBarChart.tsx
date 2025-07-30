import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PaymentScheduleItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface EMIBarChartProps {
  data: PaymentScheduleItem[];
  showMonthly?: boolean;
}

export const EMIBarChart: React.FC<EMIBarChartProps> = ({ data, showMonthly = false }) => {
  const chartData = React.useMemo(() => {
    if (showMonthly) {
      return data.slice(0, Math.min(24, data.length)).map(item => ({
        period: `Month ${item.month}`,
        Principal: item.principal,
        Interest: item.interest,
        year: item.year
      }));
    } else {
      // Group by year for yearly view
      const yearlyData = data.reduce((acc, item) => {
        const existingYear = acc.find(y => y.year === item.year);
        if (existingYear) {
          existingYear.Principal += item.principal;
          existingYear.Interest += item.interest;
        } else {
          acc.push({
            period: item.year.toString(),
            Principal: item.principal,
            Interest: item.interest,
            year: item.year
          });
        }
        return acc;
      }, [] as Array<{period: string; Principal: number; Interest: number; year: number}>);
      
      return yearlyData.sort((a, b) => a.year - b.year);
    }
  }, [data, showMonthly]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const principal = payload[0].value;
      const interest = payload[1].value;
      const total = principal + interest;
      const principalPercentage = ((principal / total) * 100).toFixed(1);
      const interestPercentage = ((interest / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white dark:bg-dark-card p-4 border border-gray-200 dark:border-dark-border rounded-xl shadow-xl dark:shadow-none">
          <div className="font-bold text-gray-900 dark:text-dark-text-primary mb-3 pb-2 border-b border-gray-100 dark:border-dark-border">
            📊 {label}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary">Principal</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(principal)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{principalPercentage}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary">Interest</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(interest)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{interestPercentage}%</div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Total Payment</span>
                <span className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 EMI Breakdown - {showMonthly ? 'Monthly' : 'Yearly'} Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Track how your payments are split between principal and interest over time
        </p>
      </div>
      
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              stroke="#666"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            />
            <Bar 
              dataKey="Principal" 
              stackId="a" 
              fill="#3b82f6" 
              name="🏦 Principal Payment"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Interest" 
              stackId="a" 
              fill="#ef4444" 
              name="📊 Interest Payment"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};