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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Schedule</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Year-wise breakdown of your loan payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors font-medium"
          >
            📋 Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            📁 Collapse All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📅 Payment Period
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  💰 EMI Amount
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                  🏦 Principal
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                  📊 Interest
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📈 Outstanding
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {yearlyGroups.map((yearGroup, yearIndex) => (
                <React.Fragment key={yearGroup.year}>
                  {/* Year Header Row */}
                  <tr 
                    className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200"
                    onClick={() => toggleYear(yearGroup.year)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {expandedYears.has(yearGroup.year) ? (
                          <ChevronDownIcon className="h-5 w-5 text-blue-600 mr-2 transition-transform" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2 transition-transform" />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">Year {yearGroup.year}</span>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            {yearGroup.payments.length} months
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">
                        {formatCurrency(yearGroup.totalEmi)}
                      </div>
                      <div className="text-xs text-gray-500">Total yearly EMI</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-blue-700 text-sm">
                        {formatCurrency(yearGroup.totalPrincipal)}
                      </div>
                      <div className="text-xs text-blue-600">Principal paid</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-red-700 text-sm">
                        {formatCurrency(yearGroup.totalInterest)}
                      </div>
                      <div className="text-xs text-red-600">Interest paid</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">
                        {formatCurrency(yearGroup.endingBalance)}
                      </div>
                      <div className="text-xs text-gray-500">Year-end balance</div>
                    </td>
                  </tr>

                  {/* Monthly Detail Rows */}
                  {expandedYears.has(yearGroup.year) && yearGroup.payments.map((payment, monthIndex) => (
                    <tr 
                      key={`${yearGroup.year}-${payment.month}`}
                      className={`${monthIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-300`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap pl-12">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Month {payment.month}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(payment.date, 'MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.emi)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {formatCurrency(payment.principal)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrency(payment.interest)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.balance)}
                        </div>
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