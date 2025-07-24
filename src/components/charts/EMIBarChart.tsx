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
      const total = payload[0].value + payload[1].value;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-sm">Principal: {formatCurrency(payload[0].value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span className="text-sm">Interest: {formatCurrency(payload[1].value)}</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <span className="text-sm font-medium">Total: {formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          EMI Breakdown - {showMonthly ? 'Monthly' : 'Yearly'} View
        </h3>
        <p className="text-sm text-gray-600">
          Principal vs Interest payments over time
        </p>
      </div>
      
      <div className="h-80">
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
            <Legend />
            <Bar 
              dataKey="Principal" 
              stackId="a" 
              fill="#3b82f6" 
              name="Principal"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Interest" 
              stackId="a" 
              fill="#ef4444" 
              name="Interest"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};