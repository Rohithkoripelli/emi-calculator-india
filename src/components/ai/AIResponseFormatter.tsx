import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LoanData {
  label: string;
  value: string;
  type?: 'currency' | 'percentage' | 'duration' | 'text';
}

interface ComparisonData {
  scenario: string;
  emi?: string;
  tenure?: string;
  totalInterest?: string;
  savings?: string;
}

interface AIResponseFormatterProps {
  text: string;
}

const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount.replace(/[₹,]/g, ''));
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(num);
};

const extractTableData = (text: string): ComparisonData[] => {
  const comparisons: ComparisonData[] = [];
  
  // Look for ASCII table patterns with dashes and multiple columns
  const lines = text.split('\n');
  let tableStartIndex = -1;
  let headerLine = '';
  
  // Find table header with dashes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('---') && line.length > 10) {
      tableStartIndex = i;
      headerLine = lines[i - 1]?.trim() || '';
      break;
    }
  }
  
  // If we found a table with dashes, parse it
  if (tableStartIndex > 0 && headerLine) {
    for (let i = tableStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.includes('---')) continue;
      
      // Split by multiple spaces or tabs and filter empty cells
      const cells = line.split(/\s{2,}|\t/).map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 2) {
        comparisons.push({
          scenario: cells[0] || `Scenario ${i - tableStartIndex}`,
          emi: cells[1] || '',
          tenure: cells[2] || '',
          savings: cells[3] || ''
        });
      }
    }
  }
  
  // Fallback: Look for pipe-separated tables
  if (comparisons.length === 0) {
    const tableMatches = text.match(/\|.*\|/g);
    if (tableMatches && tableMatches.length > 2) {
      // Skip header and separator rows
      const dataRows = tableMatches.filter(row => 
        !row.includes('---') && 
        !row.toLowerCase().includes('scenario') && 
        !row.toLowerCase().includes('emi') &&
        row.includes('₹')
      );
      
      dataRows.forEach((row, index) => {
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length >= 2) {
          comparisons.push({
            scenario: cells[0] || `Scenario ${index + 1}`,
            emi: cells[1] || '',
            tenure: cells[2] || '',
            savings: cells[4] || cells[3] || '' // Try both positions for savings
          });
        }
      });
    }
  }
  
  // Final fallback: Look for structured text patterns
  if (comparisons.length === 0) {
    const emiMatches = text.match(/₹[\d,]+/g);
    if (emiMatches && emiMatches.length >= 2) {
      const lines = text.split('\n');
      let scenarios: ComparisonData[] = [];
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().includes('current') && trimmedLine.includes('₹')) {
          const emiMatch = trimmedLine.match(/₹[\d,]+/);
          const tenureMatch = trimmedLine.match(/₹([\d,]+)/g);
          scenarios.push({
            scenario: 'Current Scenario',
            emi: emiMatch?.[0] || '',
            tenure: tenureMatch?.[1] || '',
            savings: ''
          });
        } else if ((trimmedLine.toLowerCase().includes('after') || trimmedLine.toLowerCase().includes('new')) && trimmedLine.includes('₹')) {
          const matches = trimmedLine.match(/₹[\d,]+/g);
          scenarios.push({
            scenario: 'After Optimization',
            emi: matches?.[0] || '',
            tenure: matches?.[1] || '',
            savings: matches?.[2] || ''
          });
        }
      });
      
      comparisons.push(...scenarios);
    }
  }
  
  return comparisons;
};

const extractKeyMetrics = (text: string): LoanData[] => {
  const metrics: LoanData[] = [];
  
  // Extract all currency values
  const currencyMatches = text.match(/₹[\d,]+/g);
  
  // Extract principal amounts - more flexible patterns
  const principalPatterns = [
    /(?:Principal|Loan Amount|Amount).*?₹([\d,]+)/i,
    /₹([\d,]+).*?(?:principal|loan amount)/i
  ];
  
  for (const pattern of principalPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        label: 'Principal Amount',
        value: '₹' + match[1],
        type: 'currency'
      });
      break;
    }
  }
  
  // Extract interest rates - more flexible
  const ratePatterns = [
    /(?:Interest Rate|Rate).*?(\d+\.?\d*)%/i,
    /(\d+\.?\d*)%.*?(?:interest|rate)/i,
    /(\d+\.?\d*)\s*%\s*p\.a/i
  ];
  
  for (const pattern of ratePatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        label: 'Interest Rate',
        value: match[1] + '% p.a.',
        type: 'percentage'
      });
      break;
    }
  }
  
  // Extract EMI - more flexible
  const emiPatterns = [
    /(?:EMI|Monthly EMI).*?₹([\d,]+)/i,
    /₹([\d,]+).*?(?:EMI|monthly)/i
  ];
  
  for (const pattern of emiPatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        label: 'Monthly EMI',
        value: '₹' + match[1],
        type: 'currency'
      });
      break;
    }
  }
  
  // Extract tenure - more flexible
  const tenurePatterns = [
    /(?:Tenure|Term|Duration).*?(\d+)\s*(years?|months?)/i,
    /(\d+)\s*(years?|months?).*?(?:tenure|term|duration)/i
  ];
  
  for (const pattern of tenurePatterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({
        label: 'Loan Tenure',
        value: `${match[1]} ${match[2]}`,
        type: 'duration'
      });
      break;
    }
  }
  
  // Extract total interest if mentioned
  const totalInterestMatch = text.match(/(?:Total Interest|Interest Amount).*?₹([\d,]+)/i);
  if (totalInterestMatch) {
    metrics.push({
      label: 'Total Interest',
      value: '₹' + totalInterestMatch[1],
      type: 'currency'
    });
  }
  
  return metrics;
};

const createSavingsChart = (text: string) => {
  // More flexible patterns for savings and interest
  const savingsPatterns = [
    /sav[ei].*?₹([\d,]+)/gi,
    /₹([\d,]+).*?sav[ei]/gi,
    /reduc.*?₹([\d,]+)/gi,
    /₹([\d,]+).*?reduc/gi
  ];
  
  const interestPatterns = [
    /(?:total |current )?interest.*?₹([\d,]+)/gi,
    /₹([\d,]+).*?interest/gi
  ];
  
  let savingsAmount = 0;
  let interestAmount = 0;
  
  // Find savings amount
  for (const pattern of savingsPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const amount = parseInt(matches[0].replace(/[₹,\s]/g, '').match(/\d+/)?.[0] || '0');
      if (amount > savingsAmount) {
        savingsAmount = amount;
      }
    }
  }
  
  // Find interest amount
  for (const pattern of interestPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const amount = parseInt(matches[0].replace(/[₹,\s]/g, '').match(/\d+/)?.[0] || '0');
      if (amount > interestAmount) {
        interestAmount = amount;
      }
    }
  }
  
  // Look for any two significant amounts that could represent a comparison
  const allAmounts = text.match(/₹[\d,]+/g);
  if (allAmounts && allAmounts.length >= 2 && (!savingsAmount || !interestAmount)) {
    const amounts = allAmounts.map(amt => parseInt(amt.replace(/[₹,]/g, '')))
      .filter(amt => amt > 1000) // Filter small amounts
      .sort((a, b) => b - a); // Sort descending
    
    if (amounts.length >= 2) {
      interestAmount = interestAmount || amounts[0];
      savingsAmount = savingsAmount || Math.min(amounts[1], interestAmount * 0.5); // Reasonable savings
    }
  }
  
  if (savingsAmount > 0 && interestAmount > savingsAmount) {
    const remainingInterest = interestAmount - savingsAmount;
    
    return [
      { name: 'Interest Saved', value: savingsAmount, color: '#10B981' },
      { name: 'Remaining Interest', value: remainingInterest, color: '#EF4444' }
    ];
  }
  
  // If we have EMI or principal amounts, create a simple breakdown
  if (allAmounts && allAmounts.length >= 2) {
    const amounts = allAmounts.map(amt => parseInt(amt.replace(/[₹,]/g, '')))
      .filter(amt => amt > 1000)
      .sort((a, b) => b - a);
    
    if (amounts.length >= 2) {
      return [
        { name: 'Principal Component', value: amounts[1], color: '#3B82F6' },
        { name: 'Interest Component', value: amounts[0] - amounts[1], color: '#EF4444' }
      ];
    }
  }
  
  return null;
};

const LoanMetricsCard: React.FC<{ metrics: LoanData[] }> = ({ metrics }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 my-4">
    {metrics.map((metric, index) => (
      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 lg:p-4 rounded-lg border border-blue-100">
        <div className="text-xs lg:text-sm text-gray-600 mb-1">{metric.label}</div>
        <div className={`text-base lg:text-lg font-bold ${
          metric.type === 'currency' ? 'text-green-600' : 
          metric.type === 'percentage' ? 'text-blue-600' : 'text-gray-800'
        }`}>
          {metric.value}
        </div>
      </div>
    ))}
  </div>
);

const ComparisonTable: React.FC<{ data: ComparisonData[] }> = ({ data }) => (
  <div className="my-4 lg:my-6 overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Scenario
          </th>
          <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            EMI
          </th>
          <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tenure
          </th>
          <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Interest Savings
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
              {row.scenario}
            </td>
            <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 font-semibold text-green-600">
              {row.emi || '-'}
            </td>
            <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
              {row.tenure || '-'}
            </td>
            <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-semibold text-green-600">
              {row.savings || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SavingsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="my-4 lg:my-6 bg-white p-3 lg:p-4 rounded-lg border border-gray-200">
    <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-gray-800">Financial Breakdown</h4>
    <div className="flex flex-col lg:flex-row items-center gap-4">
      {/* Chart */}
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [formatCurrency(value.toString()), '']}
              labelFormatter={(label: any) => `${label}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex-1 min-w-[200px]">
        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                ₹{(entry.value / 100000).toFixed(1)}L
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const EnhancedText: React.FC<{ text: string }> = ({ text }) => {
  // Split text into lines and format each line
  const lines = text.split('\n').filter(line => line.trim());
  const processedElements: React.ReactElement[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const trimmedLine = lines[i].trim();
    
    // Handle ASCII tables with dashes
    if (trimmedLine.includes('---') && trimmedLine.length > 10) {
      const headerLine = lines[i - 1]?.trim();
      if (headerLine) {
        const tableRows: string[] = [];
        let j = i + 1;
        
        // Collect table rows
        while (j < lines.length && lines[j].trim() && !lines[j].includes('---')) {
          tableRows.push(lines[j].trim());
          j++;
        }
        
        if (tableRows.length > 0) {
          // Create formatted table
          const headers = headerLine.split(/\s{2,}|\t/).map(h => h.trim()).filter(h => h);
          const tableData = tableRows.map(row => 
            row.split(/\s{2,}|\t/).map(cell => cell.trim()).filter(cell => cell)
          );
          
          processedElements.push(
            <div key={i} className="my-6 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    {headers.map((header, idx) => (
                      <th key={idx} className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100 last:border-r-0">
                          <span className={cell.includes('₹') ? 'font-semibold text-green-600' : ''}>
                            {cell}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          
          i = j;
          continue;
        }
      }
    }
    
    // Handle numbered lists (1. 2. etc.)
    if (trimmedLine.match(/^\d+\.\s/)) {
      const number = trimmedLine.match(/^\d+/)?.[0];
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      
      processedElements.push(
        <div key={i} className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs lg:text-sm font-bold">
            {number}
          </span>
          <div className="flex-1">
            <p className="text-gray-800 font-medium text-sm lg:text-base">{content}</p>
          </div>
        </div>
      );
    }
    
    // Handle bold headings (**text**)
    else if (trimmedLine.match(/^\*\*(.*?)\*\*:?$/)) {
      const content = trimmedLine.replace(/^\*\*|\*\*:?$/g, '');
      processedElements.push(
        <h3 key={i} className="text-base lg:text-lg font-bold text-gray-900 mt-4 lg:mt-6 mb-2 pb-2 border-b border-gray-200">
          {content}
        </h3>
      );
    }
    
    // Handle section headers (###)
    else if (trimmedLine.match(/^#{1,3}\s/)) {
      const content = trimmedLine.replace(/^#{1,3}\s/, '');
      processedElements.push(
        <h2 key={i} className="text-lg lg:text-xl font-bold text-gray-900 mt-4 lg:mt-6 mb-2 lg:mb-3 pb-2 border-b-2 border-blue-200">
          {content}
        </h2>
      );
    }
    
    // Handle bullet points
    else if (trimmedLine.match(/^[•-]\s/)) {
      const content = trimmedLine.replace(/^[•-]\s/, '');
      processedElements.push(
        <div key={i} className="flex items-start space-x-2 lg:space-x-3 ml-2 lg:ml-4">
          <span className="text-blue-500 mt-1 font-bold text-sm lg:text-base">•</span>
          <p className="text-gray-700 leading-relaxed flex-1 text-sm lg:text-base">{content}</p>
        </div>
      );
    }
    
    // Handle empty lines
    else if (trimmedLine === '') {
      processedElements.push(<div key={i} className="h-2" />);
    }
    
    // Handle regular paragraphs
    else {
      // Highlight currency amounts
      const formattedText = trimmedLine.replace(
        /₹[\d,]+/g, 
        '<span class="font-semibold text-green-600 bg-green-50 px-1 rounded">$&</span>'
      );
      
      processedElements.push(
        <p 
          key={i} 
          className="text-gray-700 leading-relaxed text-sm lg:text-base"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }
    
    i++;
  }
  
  return <div className="space-y-3">{processedElements}</div>;
};

export const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ text }) => {
  const keyMetrics = extractKeyMetrics(text);
  const comparisonData = extractTableData(text);
  const savingsChartData = createSavingsChart(text);
  
  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      {keyMetrics.length > 0 && <LoanMetricsCard metrics={keyMetrics} />}
      
      {/* Comparison Table */}
      {comparisonData.length > 0 && <ComparisonTable data={comparisonData} />}
      
      {/* Savings Chart */}
      {savingsChartData && <SavingsChart data={savingsChartData} />}
      
      {/* Enhanced Text Formatting */}
      <EnhancedText text={text} />
    </div>
  );
};