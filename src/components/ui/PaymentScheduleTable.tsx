import React, { useState, useMemo } from 'react';
import { PaymentScheduleItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleItem[];
}

interface YearGroup {
  year: number;
  payments: PaymentScheduleItem[];
  totalEmi: number;
  totalPrincipal: number;
  totalInterest: number;
  endingBalance: number;
}

export const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({ schedule }) => {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());

  const yearlyGroups = useMemo(() => {
    const groups: YearGroup[] = [];
    
    schedule.forEach(payment => {
      let group = groups.find(g => g.year === payment.year);
      if (!group) {
        group = {
          year: payment.year,
          payments: [],
          totalEmi: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          endingBalance: 0
        };
        groups.push(group);
      }
      
      group.payments.push(payment);
      group.totalEmi += payment.emi;
      group.totalPrincipal += payment.principal;
      group.totalInterest += payment.interest;
      group.endingBalance = payment.balance;
    });
    
    return groups.sort((a, b) => a.year - b.year);
  }, [schedule]);

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const expandAll = () => {
    setExpandedYears(new Set(yearlyGroups.map(g => g.year)));
  };

  const collapseAll = () => {
    setExpandedYears(new Set());
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
        <div className="space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm lg:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year / Month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyGroups.map((yearGroup, yearIndex) => (
                <React.Fragment key={yearGroup.year}>
                  {/* Year Header Row */}
                  <tr 
                    className="bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleYear(yearGroup.year)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {expandedYears.has(yearGroup.year) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                        )}
                        <span className="font-medium text-gray-900">Year {yearGroup.year}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({yearGroup.payments.length} payments)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(yearGroup.totalEmi)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {formatCurrency(yearGroup.totalPrincipal)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(yearGroup.totalInterest)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(yearGroup.endingBalance)}
                    </td>
                  </tr>

                  {/* Monthly Detail Rows */}
                  {expandedYears.has(yearGroup.year) && yearGroup.payments.map((payment, monthIndex) => (
                    <tr 
                      key={`${yearGroup.year}-${payment.month}`}
                      className={`${monthIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-blue-25 transition-colors`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap pl-8">
                        <div className="text-sm text-gray-900">
                          Month {payment.month}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(payment.date, 'MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.emi)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600">
                        {formatCurrency(payment.principal)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                        {formatCurrency(payment.interest)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.balance)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Total EMI</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(schedule.reduce((sum, p) => sum + p.emi, 0))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Total Principal</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(schedule.reduce((sum, p) => sum + p.principal, 0))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Total Interest</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(schedule.reduce((sum, p) => sum + p.interest, 0))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Total Payments</div>
            <div className="text-lg font-semibold text-gray-900">
              {schedule.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};