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

// Enhanced financial formatting for AI responses
const formatFinancialText = (text: string): string => {
  let formattedText = text;
  
  // Fix interest rate formatting - add % symbol if missing
  formattedText = formattedText.replace(/interest rate of (\d+(?:\.\d+)?)\b(?![%])/gi, 'interest rate of $1%');
  formattedText = formattedText.replace(/(\d+(?:\.\d+)?)\s*percent/gi, '$1%');
  formattedText = formattedText.replace(/rate:\s*(\d+(?:\.\d+)?)\b(?![%])/gi, 'rate: $1%');
  
  // Fix EMI formatting - ensure ₹ symbol and proper Indian formatting
  formattedText = formattedText.replace(/EMI of (\d+(?:,\d+)*(?:\.\d+)?)\b/gi, (match, amount) => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!isNaN(num)) {
      return `EMI of ${formatCurrency(amount)}`;
    }
    return match;
  });
  
  // Fix general currency amounts - add ₹ if missing for Indian context
  formattedText = formattedText.replace(/\b(\d{1,2}(?:,\d{2})*(?:,\d{3})+)\b(?![%])/g, (match, amount) => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (num >= 1000) { // Only format larger amounts as currency
      return `₹${amount}`;
    }
    return match;
  });
  
  // Fix loan amount formatting
  formattedText = formattedText.replace(/loan amount of (\d+(?:,\d+)*(?:\.\d+)?)\b/gi, (match, amount) => {
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!isNaN(num)) {
      return `loan amount of ${formatCurrency(amount)}`;
    }
    return match;
  });
  
  // Fix tenure formatting - ensure proper units
  formattedText = formattedText.replace(/(\d+)\s*year(?!s)/gi, '$1 years');
  formattedText = formattedText.replace(/(\d+)\s*month(?!s)/gi, '$1 months');
  
  return formattedText;
};

const extractTableData = (text: string): ComparisonData[] => {
  const comparisons: ComparisonData[] = [];
  
  // Don't extract table data if HTML tables are present
  if (text.includes('<table')) {
    return comparisons;
  }
  
  // Don't extract table data for generic responses
  if (!isRelevantForMetrics(text)) {
    return comparisons;
  }
  
  // Look for scenario comparisons with specific patterns
  const lines = text.split('\n');
  
  // Look for comparison scenarios
  const scenarioPatterns = [
    /current.*scenario/i,
    /after.*prepayment/i,
    /with.*prepayment/i,
    /original.*loan/i,
    /new.*scenario/i
  ];
  
  let currentScenario: Partial<ComparisonData> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line describes a scenario
    const isScenario = scenarioPatterns.some(pattern => pattern.test(trimmedLine));
    
    if (isScenario) {
      // Save previous scenario if complete
      if (currentScenario.scenario && currentScenario.emi) {
        comparisons.push(currentScenario as ComparisonData);
      }
      
      // Start new scenario
      currentScenario = {
        scenario: trimmedLine
      };
    }
    
    // Extract EMI (only actual EMI amounts, not principal)
    const emiMatch = trimmedLine.match(/EMI.*?₹([\d,]+)/i) || 
                     trimmedLine.match(/₹([\d,]+).*EMI/i);
    if (emiMatch && !trimmedLine.toLowerCase().includes('principal') && 
        !trimmedLine.toLowerCase().includes('amount')) {
      currentScenario.emi = '₹' + emiMatch[1];
    }
    
    // Extract tenure (months or years)
    const tenureMatch = trimmedLine.match(/(\d+)\s*(months?|years?)/i);
    if (tenureMatch && currentScenario.scenario) {
      currentScenario.tenure = `${tenureMatch[1]} ${tenureMatch[2]}`;
    }
    
    // Extract savings
    const savingsMatch = trimmedLine.match(/sav.*?₹([\d,]+)/i) ||
                        trimmedLine.match(/₹([\d,]+).*sav/i);
    if (savingsMatch) {
      currentScenario.savings = '₹' + savingsMatch[1];
    }
  }
  
  // Add final scenario
  if (currentScenario.scenario && currentScenario.emi) {
    comparisons.push(currentScenario as ComparisonData);
  }
  
  return comparisons;
};

const extractTableDataOld = (text: string): ComparisonData[] => {
  const comparisons: ComparisonData[] = [];
  
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

const isRelevantForMetrics = (text: string): boolean => {
  // Only show metrics for loan-specific responses that contain actual calculations
  const relevantKeywords = [
    'your loan', 'your emi', 'prepayment', 'current scenario', 'after prepayment',
    'loan breakdown', 'emi breakdown', 'your current loan', 'based on your loan'
  ];
  
  const genericKeywords = [
    'tax benefits', 'how to save', 'investment options', 'what is', 'types of', 
    'generally', 'typically', 'for example', 'in india', 'deduction under'
  ];
  
  const textLower = text.toLowerCase();
  const hasRelevant = relevantKeywords.some(keyword => textLower.includes(keyword));
  const hasGeneric = genericKeywords.some(keyword => textLower.includes(keyword));
  
  // Only show metrics if it's clearly about user's specific loan and not generic advice
  return hasRelevant && !hasGeneric;
};

const extractKeyMetrics = (text: string): LoanData[] => {
  // Don't extract metrics for generic responses
  if (!isRelevantForMetrics(text)) {
    return [];
  }
  
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
      const amount = parseInt(match[1].replace(/,/g, ''));
      // Only show realistic loan amounts (₹1 lakh to ₹10 crore)
      if (amount >= 100000 && amount <= 100000000) {
        metrics.push({
          label: 'Principal Amount',
          value: '₹' + match[1],
          type: 'currency'
        });
      }
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
      const amount = parseInt(match[1].replace(/,/g, ''));
      // Only show realistic EMI amounts (₹1,000 to ₹10 lakh)
      if (amount >= 1000 && amount <= 1000000) {
        metrics.push({
          label: 'Monthly EMI',
          value: '₹' + match[1],
          type: 'currency'
        });
      }
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
  // Don't create charts for generic responses
  if (!isRelevantForMetrics(text)) {
    return null;
  }
  
  // Only create charts for meaningful financial breakdowns
  
  // Look for explicit interest savings comparisons
  const savingsMatch = text.match(/(?:save|saving).*?₹([\d,]+)/i);
  const interestSavedMatch = text.match(/interest.*?saved.*?₹([\d,]+)/i);
  const remainingInterestMatch = text.match(/remaining.*?interest.*?₹([\d,]+)/i);
  
  if (savingsMatch && (interestSavedMatch || remainingInterestMatch)) {
    const savedAmount = parseInt(savingsMatch[1].replace(/,/g, ''));
    const remainingAmount = remainingInterestMatch ? 
      parseInt(remainingInterestMatch[1].replace(/,/g, '')) : 
      savedAmount * 2; // Reasonable estimate
    
    if (savedAmount > 0 && remainingAmount > 0) {
      return [
        { name: 'Interest Saved', value: savedAmount, color: '#10B981' },
        { name: 'Remaining Interest', value: remainingAmount, color: '#EF4444' }
      ];
    }
  }
  
  // Look for principal vs interest breakdown
  const principalMatch = text.match(/principal.*?₹([\d,]+)/i);
  const totalInterestMatch = text.match(/total.*?interest.*?₹([\d,]+)/i);
  
  if (principalMatch && totalInterestMatch) {
    const principal = parseInt(principalMatch[1].replace(/,/g, ''));
    const interest = parseInt(totalInterestMatch[1].replace(/,/g, ''));
    
    if (principal > 0 && interest > 0 && principal > interest / 10) { // Sanity check
      return [
        { name: 'Principal Amount', value: principal, color: '#3B82F6' },
        { name: 'Total Interest', value: interest, color: '#EF4444' }
      ];
    }
  }
  
  // Only return null if no meaningful financial breakdown is found
  return null;
};

const LoanMetricsCard: React.FC<{ metrics: LoanData[] }> = ({ metrics }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 my-4">
    {metrics.map((metric, index) => (
      <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-600/20 p-3 lg:p-4 rounded-lg border border-blue-100 dark:border-blue-600/30">
        <div className="text-xs lg:text-sm text-gray-600 dark:text-dark-text-secondary mb-1">{metric.label}</div>
        <div className={`text-base lg:text-lg font-bold ${
          metric.type === 'currency' ? 'text-green-600 dark:text-green-400' : 
          metric.type === 'percentage' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-dark-text-primary'
        }`}>
          {metric.value}
        </div>
      </div>
    ))}
  </div>
);

const ComparisonTable: React.FC<{ data: ComparisonData[] }> = ({ data }) => (
  <div className="my-4 lg:my-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border text-xs sm:text-sm">
      <thead className="bg-gray-50 dark:bg-dark-card">
        <tr>
          <th className="px-2 sm:px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
            Scenario
          </th>
          <th className="px-2 sm:px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
            EMI
          </th>
          <th className="px-2 sm:px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
            Tenure
          </th>
          <th className="px-2 sm:px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
            Savings
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-dark-card'}>
            <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-900 dark:text-dark-text-primary break-words">
              {row.scenario}
            </td>
            <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs lg:text-sm text-gray-900 dark:text-dark-text-primary font-semibold text-green-600 dark:text-green-400 break-words">
              {row.emi || '-'}
            </td>
            <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs lg:text-sm text-gray-900 dark:text-dark-text-primary break-words">
              {row.tenure || '-'}
            </td>
            <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs lg:text-sm font-semibold text-green-600 dark:text-green-400 break-words">
              {row.savings || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SavingsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="my-4 lg:my-6 bg-white dark:bg-dark-card p-2 sm:p-3 lg:p-4 rounded-lg border border-gray-200 dark:border-dark-border">
    <h4 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-gray-800 dark:text-dark-text-primary">Financial Breakdown</h4>
    <div className="flex flex-col lg:flex-row items-center gap-4">
      {/* Chart */}
      <div className="flex-1 w-full max-w-xs sm:max-w-sm lg:max-w-none">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={60}
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
      <div className="flex-1 w-full lg:min-w-[200px]">
        <div className="space-y-2 sm:space-y-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-surface rounded-lg">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary break-words">{entry.name}</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-dark-text-primary flex-shrink-0">
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
  // First check for HTML tables and handle them separately
  const htmlTableRegex = /<table[\s\S]*?<\/table>/gi;
  const htmlTables = text.match(htmlTableRegex);
  
  if (htmlTables && htmlTables.length > 0) {
    // Split text by HTML tables and render each part
    const parts = text.split(htmlTableRegex);
    const elements: React.ReactElement[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      // Add text part
      if (parts[i].trim()) {
        elements.push(
          <div key={`text-${i}`}>
            <EnhancedTextContent text={parts[i]} />
          </div>
        );
      }
      
      // Add HTML table if it exists
      if (htmlTables[i]) {
        elements.push(
          <div 
            key={`table-${i}`} 
            dangerouslySetInnerHTML={{ __html: htmlTables[i] }}
            className="my-6 overflow-x-auto"
          />
        );
      }
    }
    
    return <div className="space-y-4">{elements}</div>;
  }
  
  // If no HTML tables, use regular processing
  return <EnhancedTextContent text={text} />;
};

const EnhancedTextContent: React.FC<{ text: string }> = ({ text }) => {
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
            <div key={i} className="my-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-600/20">
                  <tr>
                    {headers.map((header, idx) => (
                      <th key={idx} className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider border-r border-gray-200 dark:border-dark-border last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                  {tableData.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-dark-card'}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary border-r border-gray-100 dark:border-dark-border last:border-r-0">
                          <span className={cell.includes('₹') ? 'font-semibold text-green-600 dark:text-green-400' : ''}>
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
        <div key={i} className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-blue-50 dark:bg-blue-600/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
          <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs lg:text-sm font-bold">
            {number}
          </span>
          <div className="flex-1">
            <p className="text-gray-800 dark:text-dark-text-primary font-medium text-sm lg:text-base">{content}</p>
          </div>
        </div>
      );
    }
    
    // Handle bold headings (**text**)
    else if (trimmedLine.match(/^\*\*(.*?)\*\*:?$/)) {
      const content = trimmedLine.replace(/^\*\*|\*\*:?$/g, '');
      processedElements.push(
        <h3 key={i} className="text-base lg:text-lg font-bold text-gray-900 dark:text-dark-text-primary mt-4 lg:mt-6 mb-2 pb-2 border-b border-gray-200 dark:border-dark-border">
          {content}
        </h3>
      );
    }
    
    // Handle section headers (###)
    else if (trimmedLine.match(/^#{1,3}\s/)) {
      const content = trimmedLine.replace(/^#{1,3}\s/, '');
      processedElements.push(
        <h2 key={i} className="text-lg lg:text-xl font-bold text-gray-900 dark:text-dark-text-primary mt-4 lg:mt-6 mb-2 lg:mb-3 pb-2 border-b-2 border-blue-200 dark:border-blue-600/30">
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
          <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed flex-1 text-sm lg:text-base">{content}</p>
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
          className="text-gray-700 dark:text-dark-text-secondary leading-relaxed text-sm lg:text-base"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }
    
    i++;
  }
  
  return <div className="space-y-3">{processedElements}</div>;
};

export const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ text }) => {
  // Apply financial formatting to fix interest rates, EMI values, and currency display
  const formattedText = formatFinancialText(text);
  
  const keyMetrics = extractKeyMetrics(formattedText);
  const comparisonData = extractTableData(formattedText);
  const savingsChartData = createSavingsChart(formattedText);
  
  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      {keyMetrics.length > 0 && <LoanMetricsCard metrics={keyMetrics} />}
      
      {/* Comparison Table */}
      {comparisonData.length > 0 && <ComparisonTable data={comparisonData} />}
      
      {/* Savings Chart */}
      {savingsChartData && <SavingsChart data={savingsChartData} />}
      
      {/* Enhanced Text Formatting */}
      <EnhancedText text={formattedText} />
    </div>
  );
};