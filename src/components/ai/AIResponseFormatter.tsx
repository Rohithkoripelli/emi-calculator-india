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
  <div className="my-6 lg:my-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl">
      <h4 className="text-lg font-bold flex items-center gap-2">
        <span className="text-xl">📊</span>
        Loan Scenario Comparison
      </h4>
      <p className="text-sm opacity-90 mt-1">Compare different loan scenarios and potential savings</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
        <thead className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-600/20 dark:to-emerald-600/20">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>📋</span>
                <span>Scenario</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>Monthly EMI</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span>Tenure</span>
              </div>
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>💵</span>
                <span>Total Savings</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
          {data.map((row, index) => (
            <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-dark-card'} hover:bg-green-50 dark:hover:bg-green-600/10 transition-colors duration-200`}>
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-dark-text-primary">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                  <span className="font-semibold">{row.scenario}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                {row.emi ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300">
                      {row.emi}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-gray-900 dark:text-dark-text-primary">
                {row.tenure ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-600/20 dark:text-blue-300">
                      {row.tenure}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {row.savings ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-300">
                      🎯 {row.savings}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-3 rounded-b-xl">
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
        💡 Choose the scenario that best fits your financial goals and repayment capacity
      </p>
    </div>
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

const StockRecommendationBadge: React.FC<{ recommendation: string; confidence?: number }> = ({ recommendation, confidence }) => {
  const rec = recommendation.toUpperCase();
  let bgColor = 'bg-gray-500';
  let hoverColor = 'hover:bg-gray-600';
  let textColor = 'text-white';
  let icon = '📊';
  
  if (rec.includes('BUY')) {
    bgColor = 'bg-gradient-to-r from-green-600 to-green-700';
    hoverColor = 'hover:from-green-700 hover:to-green-800';
    textColor = 'text-white';
    icon = '🚀';
  } else if (rec.includes('SELL')) {
    bgColor = 'bg-gradient-to-r from-red-600 to-red-700';
    hoverColor = 'hover:from-red-700 hover:to-red-800';
    textColor = 'text-white';
    icon = '📉';
  } else if (rec.includes('HOLD')) {
    bgColor = 'bg-gradient-to-r from-yellow-600 to-orange-600';
    hoverColor = 'hover:from-yellow-700 hover:to-orange-700';
    textColor = 'text-white';
    icon = '⏸️';
  }
  
  return (
    <div className={`inline-flex items-center px-6 py-4 rounded-2xl text-lg font-bold ${bgColor} ${hoverColor} ${textColor} shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-4 border-white dark:border-gray-800`}>
      <span className="mr-3 text-2xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xl">{recommendation}</span>
        {confidence && (
          <span className="text-sm opacity-90">{confidence}% Confidence</span>
        )}
      </div>
    </div>
  );
};

const ResearchInsightsCard: React.FC<{ text: string }> = ({ text }) => {
  // Check if this is a comprehensive investment analysis
  if (!text.includes('Phase') && !text.includes('comprehensive') && !text.includes('market research')) {
    return null;
  }
  
  return (
    <div className="my-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-600/10 dark:to-purple-600/10 rounded-xl border border-blue-200 dark:border-blue-600/30">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🔬</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-dark-text-primary">Comprehensive Market Research</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">AI-powered analysis across multiple data sources</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Historical Analysis</div>
          <div className="text-xs text-gray-600 dark:text-dark-text-muted">5-6 months trend data</div>
        </div>
        
        <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="text-2xl mb-1">📰</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">News Sentiment</div>
          <div className="text-xs text-gray-600 dark:text-dark-text-muted">Real-time market news</div>
        </div>
        
        <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="text-2xl mb-1">🎯</div>
          <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Stock Ranking</div>
          <div className="text-xs text-gray-600 dark:text-dark-text-muted">Composite scoring system</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-dark-text-muted italic">
        ✅ Research-based recommendations using multiple data points and technical analysis
      </div>
    </div>
  );
};

const NewsArticlesCard: React.FC<{ text: string }> = ({ text }) => {
  // Extract news articles from different sections
  const newsArticles: Array<{ title: string; snippet: string; url?: string; sentiment?: string }> = [];
  
  // Extract from Recent News Sentiment section
  const newsMatch = text.match(/## 📰 Recent News Sentiment[\s\S]*?(?=##|$)/);
  if (newsMatch) {
    const newsSection = newsMatch[0];
    const articleMatches = newsSection.match(/\d+\. \*\*(.*?)\*\*: (.*?)(?=\n|$)/g);
    
    if (articleMatches) {
      articleMatches.forEach(match => {
        const titleMatch = match.match(/\*\*(.*?)\*\*:/);
        const snippetMatch = match.match(/\*\*.*?\*\*: (.*?)$/);
        
        if (titleMatch && snippetMatch) {
          const sentiment = titleMatch[1];
          const headline = snippetMatch[1];
          newsArticles.push({
            title: headline,
            snippet: `Market sentiment: ${sentiment}`,
            sentiment: sentiment
          });
        }
      });
    }
  }
  
  // Extract from web research results
  const webResultsMatch = text.match(/## 🌐 Market Research Sources[\s\S]*?(?=##|$)/);
  if (webResultsMatch) {
    const webResultsSection = webResultsMatch[0];
    const resultMatches = webResultsSection.match(/\*\*(.*?)\*\*\n(.*?)\n🔗 \[Read more\]\((.*?)\)/g);
    
    if (resultMatches) {
      resultMatches.forEach((match) => {
        const titleMatch = match.match(/\*\*(.*?)\*\*/);
        const snippetMatch = match.match(/\*\*.*?\*\*\n(.*?)\n🔗/s);
        const urlMatch = match.match(/🔗 \[Read more\]\((.*?)\)/);
        
        if (titleMatch && snippetMatch && urlMatch) {
          // Avoid duplicates by checking if we already have similar content
          const isDuplicate = newsArticles.some(article => 
            article.title.includes(titleMatch[1]) || titleMatch[1].includes(article.title)
          );
          
          if (!isDuplicate) {
            newsArticles.push({
              title: titleMatch[1],
              snippet: snippetMatch[1].trim(),
              url: urlMatch[1]
            });
          }
        }
      });
    }
  }
  
  // Deduplicate and take only top 5
  const uniqueArticles = newsArticles
    .filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    )
    .slice(0, 5);
  
  if (uniqueArticles.length === 0) return null;
  
  return (
    <div className="my-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary flex items-center gap-3">
          <span className="text-2xl">📰</span>
          Latest Market News & Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
          Key news articles and market research findings
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {uniqueArticles.map((article, index) => {
          const getSentimentColor = (sentiment?: string) => {
            if (!sentiment) return 'bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-600/30';
            switch(sentiment.toUpperCase()) {
              case 'POSITIVE': return 'bg-green-50 dark:bg-green-600/10 border-green-200 dark:border-green-600/30';
              case 'NEGATIVE': return 'bg-red-50 dark:bg-red-600/10 border-red-200 dark:border-red-600/30';
              case 'NEUTRAL': return 'bg-gray-50 dark:bg-gray-600/10 border-gray-200 dark:border-gray-600/30';
              default: return 'bg-blue-50 dark:bg-blue-600/10 border-blue-200 dark:border-blue-600/30';
            }
          };
          
          const getSentimentIcon = (sentiment?: string) => {
            if (!sentiment) return '📊';
            switch(sentiment.toUpperCase()) {
              case 'POSITIVE': return '📈';
              case 'NEGATIVE': return '📉';
              case 'NEUTRAL': return '📊';
              default: return '📊';
            }
          };
          
          return (
            <div
              key={index}
              className={`${getSentimentColor(article.sentiment)} border rounded-xl p-4 hover:shadow-lg transition-all duration-200 group cursor-pointer transform hover:scale-105`}
              onClick={() => article.url && window.open(article.url, '_blank')}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg flex-shrink-0">{getSentimentIcon(article.sentiment)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm leading-tight line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h4>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-dark-text-secondary line-clamp-3 flex-1">
                  {article.snippet}
                </p>
                
                {article.sentiment && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      article.sentiment.toUpperCase() === 'POSITIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300'
                        : article.sentiment.toUpperCase() === 'NEGATIVE'
                        ? 'bg-red-100 text-red-800 dark:bg-red-600/20 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600/20 dark:text-gray-300'
                    }`}>
                      {article.sentiment}
                    </span>
                  </div>
                )}
                
                {article.url && (
                  <div className="mt-3 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                      <span>Read More</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EnhancedTextContent: React.FC<{ text: string }> = ({ text }) => {
  // Split text into lines and format each line
  const lines = text.split('\n').filter(line => line.trim());
  const processedElements: React.ReactElement[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const trimmedLine = lines[i].trim();
    
    // Handle ASCII tables with dashes (enhanced formatting)
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
          // Create formatted table with enhanced styling
          const headers = headerLine.split(/\s{2,}|\t/).map(h => h.trim()).filter(h => h);
          const tableData = tableRows.map(row => 
            row.split(/\s{2,}|\t/).map(cell => cell.trim()).filter(cell => cell)
          );
          
          processedElements.push(
            <div key={i} className="my-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-border shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Investment Analysis Table
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-600/20">
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-dark-text-primary uppercase tracking-wider border-r border-gray-200 dark:border-dark-border last:border-r-0">
                          <div className="flex items-center gap-2">
                            {header.includes('Stock') && <span>🏢</span>}
                            {header.includes('Price') && <span>💰</span>}
                            {header.includes('Change') && <span>📈</span>}
                            {header.includes('Volume') && <span>📊</span>}
                            {header.includes('Recommendation') && <span>🎯</span>}
                            <span>{header}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-dark-border">
                    {tableData.map((row, rowIdx) => (
                      <tr key={rowIdx} className={`${rowIdx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50 dark:bg-dark-card'} hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-colors duration-200`}>
                        {row.map((cell, cellIdx) => {
                          // Enhanced cell styling based on content
                          let cellClass = 'px-6 py-4 text-sm text-gray-900 dark:text-dark-text-primary border-r border-gray-100 dark:border-dark-border last:border-r-0';
                          let cellContent: string | React.ReactNode = cell;
                          
                          // Special formatting for different data types
                          if (cell.includes('₹')) {
                            cellClass += ' font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-600/10';
                            cellContent = cell;
                          } else if (cell.includes('%')) {
                            const isPositive = cell.includes('+');
                            cellClass += isPositive 
                              ? ' font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-600/10'
                              : ' font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-600/10';
                          } else if (['BUY', 'SELL', 'HOLD'].some(action => cell.toUpperCase().includes(action))) {
                            const action = cell.toUpperCase();
                            if (action.includes('BUY')) {
                              cellClass += ' font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-600/20';
                              cellContent = <span className="inline-flex items-center gap-1"><span>🚀</span>{cell}</span>;
                            } else if (action.includes('SELL')) {
                              cellClass += ' font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-600/20';
                              cellContent = <span className="inline-flex items-center gap-1"><span>📉</span>{cell}</span>;
                            } else if (action.includes('HOLD')) {
                              cellClass += ' font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-600/20';
                              cellContent = <span className="inline-flex items-center gap-1"><span>⏸️</span>{cell}</span>;
                            }
                          } else if (cellIdx === 0) {
                            // First column (usually company names) - make it stand out
                            cellClass += ' font-semibold text-blue-700 dark:text-blue-300';
                          }
                          
                          return (
                            <td key={cellIdx} className={cellClass}>
                              <div className="flex items-center">
                                {cellContent}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
          
          i = j;
          continue;
        }
      }
    }
    
    // Handle numbered lists (1. 2. etc.) with enhanced styling
    if (trimmedLine.match(/^\d+\.\s/)) {
      const number = trimmedLine.match(/^\d+/)?.[0];
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      
      // Determine icon based on content
      let icon = '💡';
      if (content.toLowerCase().includes('buy') || content.toLowerCase().includes('invest')) {
        icon = '🚀';
      } else if (content.toLowerCase().includes('sell') || content.toLowerCase().includes('avoid')) {
        icon = '⚠️';
      } else if (content.toLowerCase().includes('risk') || content.toLowerCase().includes('caution')) {
        icon = '🛡️';
      } else if (content.toLowerCase().includes('return') || content.toLowerCase().includes('profit')) {
        icon = '📈';
      } else if (content.toLowerCase().includes('diversif') || content.toLowerCase().includes('balance')) {
        icon = '⚖️';
      }
      
      processedElements.push(
        <div key={i} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/20 dark:to-indigo-600/20 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex-shrink-0 flex items-center justify-center">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
              {number}
            </span>
            <span className="ml-2 text-lg">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 dark:text-dark-text-primary font-medium leading-relaxed">{content}</p>
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
    
    // Handle section headers (###) with enhanced styling
    else if (trimmedLine.match(/^#{1,3}\s/)) {
      const content = trimmedLine.replace(/^#{1,3}\s/, '');
      const level = (trimmedLine.match(/^#+/) || [''])[0].length;
      
      // Add contextual icons based on header content
      let icon = '📋';
      if (content.toLowerCase().includes('recommendation')) {
        icon = '🎯';
      } else if (content.toLowerCase().includes('analysis') || content.toLowerCase().includes('technical')) {
        icon = '📊';
      } else if (content.toLowerCase().includes('risk')) {
        icon = '⚠️';
      } else if (content.toLowerCase().includes('news') || content.toLowerCase().includes('sentiment')) {
        icon = '📰';
      } else if (content.toLowerCase().includes('market') || content.toLowerCase().includes('data')) {
        icon = '💰';
      } else if (content.toLowerCase().includes('research') || content.toLowerCase().includes('source')) {
        icon = '🔍';
      }
      
      const headerClass = level === 1 
        ? 'text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-text-primary mt-6 lg:mt-8 mb-4 pb-3 border-b-2 border-gradient-to-r from-blue-500 to-indigo-500'
        : level === 2
        ? 'text-lg lg:text-xl font-bold text-gray-900 dark:text-dark-text-primary mt-4 lg:mt-6 mb-3 pb-2 border-b border-blue-300 dark:border-blue-600/40'
        : 'text-base lg:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mt-3 lg:mt-4 mb-2';
      
      processedElements.push(
        <div key={i} className={`${headerClass} flex items-center gap-3 group`}>
          <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {content}
          </span>
        </div>
      );
    }
    
    // Handle bullet points with enhanced styling
    else if (trimmedLine.match(/^[•-]\s/)) {
      const content = trimmedLine.replace(/^[•-]\s/, '');
      
      // Determine appropriate icon based on content
      let bulletIcon = '▶️';
      if (content.toLowerCase().includes('advantage') || content.toLowerCase().includes('benefit')) {
        bulletIcon = '✅';
      } else if (content.toLowerCase().includes('risk') || content.toLowerCase().includes('disadvantage')) {
        bulletIcon = '⚠️';
      } else if (content.toLowerCase().includes('growth') || content.toLowerCase().includes('increase')) {
        bulletIcon = '📈';
      } else if (content.toLowerCase().includes('dividend') || content.toLowerCase().includes('income')) {
        bulletIcon = '💰';
      } else if (content.toLowerCase().includes('sector') || content.toLowerCase().includes('industry')) {
        bulletIcon = '🏭';
      }
      
      processedElements.push(
        <div key={i} className="flex items-start space-x-3 ml-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors duration-200">
          <span className="text-lg mt-0.5 flex-shrink-0">{bulletIcon}</span>
          <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed flex-1 font-medium">{content}</p>
        </div>
      );
    }
    
    // Handle empty lines
    else if (trimmedLine === '') {
      processedElements.push(<div key={i} className="h-2" />);
    }
    
    // Handle regular paragraphs
    else {
      // Check for stock recommendations
      const buyMatch = trimmedLine.match(/\*\*Action:\*\*\s*(BUY|SELL|HOLD)/i);
      const actionMatch = trimmedLine.match(/Action:\s*(BUY|SELL|HOLD)/i);
      const recommendationMatch = trimmedLine.match(/Recommendation:\s*(BUY|SELL|HOLD)/i);
      
      // Check for confidence in recommendations
      const confidenceMatch = trimmedLine.match(/\((\d+)%\s*confidence\)/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : undefined;
      
      if (buyMatch || actionMatch || recommendationMatch) {
        const recommendation = (buyMatch || actionMatch || recommendationMatch)?.[1] || '';
        const beforeText = trimmedLine.split(/Action:|Recommendation:/i)[0];
        const afterText = trimmedLine.split(/(BUY|SELL|HOLD)/i)[2] || '';
        
        processedElements.push(
          <div key={i} className="flex flex-col items-center justify-center space-y-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-2xl border-2 border-blue-200 dark:border-blue-600/30 my-6">
            {beforeText && (
              <div className="text-center text-gray-700 dark:text-dark-text-secondary text-lg font-medium">
                {beforeText.replace(/\*\*/g, '').trim()}
              </div>
            )}
            <StockRecommendationBadge recommendation={recommendation} confidence={confidence} />
            {afterText && afterText.replace(/\([^)]*confidence\)/i, '').trim() && (
              <div className="text-center text-gray-600 dark:text-dark-text-secondary text-base max-w-2xl">
                {afterText.replace(/\([^)]*confidence\)/i, '').trim()}
              </div>
            )}
          </div>
        );
      } else {
        // Highlight currency amounts and share quantities
        let formattedText = trimmedLine.replace(
          /₹[\d,]+/g, 
          '<span class="font-semibold text-green-600 bg-green-50 dark:bg-green-600/20 px-1 rounded">$&</span>'
        );
        
        // Highlight share quantities
        formattedText = formattedText.replace(
          /(\d+)\s+shares?\s*=/g,
          '<span class="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-600/20 px-1 rounded">$1 shares</span> ='
        );
        
        // Highlight "Skip" recommendations for expensive stocks
        formattedText = formattedText.replace(
          /Skip\s*\([^)]+\)/g,
          '<span class="font-semibold text-orange-600 bg-orange-50 dark:bg-orange-600/20 px-2 py-1 rounded">$&</span>'
        );
        
        processedElements.push(
          <p 
            key={i} 
            className="text-gray-700 dark:text-dark-text-secondary leading-relaxed text-sm lg:text-base"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        );
      }
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
      {/* Research Insights Card for investment analysis */}
      <ResearchInsightsCard text={formattedText} />
      
      {/* Key Metrics Cards */}
      {keyMetrics.length > 0 && <LoanMetricsCard metrics={keyMetrics} />}
      
      {/* Comparison Table */}
      {comparisonData.length > 0 && <ComparisonTable data={comparisonData} />}
      
      {/* Savings Chart */}
      {savingsChartData && <SavingsChart data={savingsChartData} />}
      
      {/* News Articles Card */}
      <NewsArticlesCard text={formattedText} />
      
      {/* Enhanced Text Formatting */}
      <EnhancedText text={formattedText} />
    </div>
  );
};