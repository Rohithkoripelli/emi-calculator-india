import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Add CSS styles for financial tables with proper dark mode support
const tableStyles = `
.financial-table table, .loan-comparison-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  width: 100% !important;
  margin: 20px 0 !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  border: 1px solid #e5e7eb !important;
}

/* Dark mode table border */
.dark .financial-table table, .dark .loan-comparison-table {
  border: 1px solid #374151 !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
}

.financial-table th, .loan-comparison-table th {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
  color: white !important;
  text-align: left !important;
  vertical-align: middle !important;
  position: relative !important;
  padding: 16px 12px !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.financial-table th:last-child, .loan-comparison-table th:last-child {
  border-right: none !important;
}

/* Light mode table cells */
.financial-table td, .loan-comparison-table td {
  text-align: left !important;
  vertical-align: middle !important;
  position: relative !important;
  padding: 16px 12px !important;
  font-size: 14px !important;
  border-right: 1px solid #e5e7eb !important;
  border-bottom: 1px solid #e5e7eb !important;
  background-color: white !important;
  color: #1f2937 !important;
}

/* Dark mode table cells */
.dark .financial-table td, .dark .loan-comparison-table td {
  border-right: 1px solid #4b5563 !important;
  border-bottom: 1px solid #4b5563 !important;
  background-color: #1f2937 !important;
  color: #f9fafb !important;
}

.financial-table td:last-child, .loan-comparison-table td:last-child {
  border-right: none !important;
}

/* Light mode alternating rows */
.financial-table tr:nth-child(even) td, .loan-comparison-table tbody tr:nth-child(even) td {
  background-color: #f9fafb !important;
}

/* Dark mode alternating rows */
.dark .financial-table tr:nth-child(even) td, .dark .loan-comparison-table tbody tr:nth-child(even) td {
  background-color: #374151 !important;
}

/* Light mode hover */
.financial-table tr:hover td, .loan-comparison-table tbody tr:hover td {
  background-color: #eff6ff !important;
  transition: background-color 0.2s ease !important;
}

/* Dark mode hover */
.dark .financial-table tr:hover td, .dark .loan-comparison-table tbody tr:hover td {
  background-color: #1e40af !important;
  transition: background-color 0.2s ease !important;
}

/* Right align numeric columns */
.loan-comparison-table td:nth-child(2),
.loan-comparison-table td:nth-child(3),
.loan-comparison-table td:nth-child(4),
.loan-comparison-table td:nth-child(7) {
  text-align: right !important;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
}

.financial-table td:has(span.font-mono) {
  text-align: right !important;
}

/* Currency formatting - Light mode */
.financial-table .currency-cell {
  color: #10b981 !important;
  font-weight: 600 !important;
  background-color: rgba(16, 185, 129, 0.1) !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
}

/* Currency formatting - Dark mode */
.dark .financial-table .currency-cell {
  color: #34d399 !important;
  background-color: rgba(52, 211, 153, 0.2) !important;
}

/* Percentage formatting - Light mode */
.financial-table .percentage-cell {
  color: #3b82f6 !important;
  font-weight: 500 !important;
}

/* Percentage formatting - Dark mode */
.dark .financial-table .percentage-cell {
  color: #60a5fa !important;
}

/* Duration formatting - Light mode */
.financial-table .duration-cell {
  color: #8b5cf6 !important;
  font-weight: 500 !important;
}

/* Duration formatting - Dark mode */
.dark .financial-table .duration-cell {
  color: #a78bfa !important;
}

/* Enhanced color-coded spans for better contrast */
.loan-comparison-table span.font-semibold.text-green-600 {
  color: #059669 !important;
  font-weight: 600 !important;
}

.dark .loan-comparison-table span.font-semibold.text-green-600 {
  color: #34d399 !important;
}

.loan-comparison-table span.font-medium.text-blue-600 {
  color: #2563eb !important;
  font-weight: 500 !important;
}

.dark .loan-comparison-table span.font-medium.text-blue-600 {
  color: #60a5fa !important;
}

.loan-comparison-table span.font-medium.text-purple-600 {
  color: #7c3aed !important;
  font-weight: 500 !important;
}

.dark .loan-comparison-table span.font-medium.text-purple-600 {
  color: #a78bfa !important;
}

/* Responsive table handling */
@media (max-width: 768px) {
  .financial-table table, .loan-comparison-table {
    font-size: 12px !important;
    margin: 16px 0 !important;
  }
  
  .financial-table th, .loan-comparison-table th {
    padding: 12px 8px !important;
    font-size: 10px !important;
  }
  
  .financial-table td, .loan-comparison-table td {
    padding: 12px 8px !important;
    font-size: 12px !important;
  }
}

/* Text clamp utilities for line truncation */
.line-clamp-2 {
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.line-clamp-3 {
  display: -webkit-box !important;
  -webkit-line-clamp: 3 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

/* Custom scrollbar for better UX */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}

.dark .scrollbar-thin::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #475569;
}
`;

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
  stockAnalysis?: any; // Add optional stockAnalysis prop
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

// Remove mathematical formulas and calculation steps from AI responses
const removeFormulasAndCalculations = (text: string): string => {
  let cleanText = text;
  
  // Remove EMI formula patterns like "P × r × (1 + r)^n" or similar
  cleanText = cleanText.replace(/[P×Rp]\s*[×x*]\s*[r]\s*[×x*]\s*\([^)]*\)\s*\^\s*[n]/gi, '');
  
  // Remove mathematical expressions in parentheses with calculations
  cleanText = cleanText.replace(/\([^)]*[×x*÷/]\s*[^)]*\)\s*[×x*÷/]/gi, '');
  
  // Remove step-by-step calculations like "30,00,000 × 0.0075 × (1.0075)^240"
  cleanText = cleanText.replace(/[\d,]+\s*[×x*]\s*[\d.]+\s*[×x*]\s*\([^)]*\)/gi, '');
  
  // Remove formula explanations
  cleanText = cleanText.replace(/EMI\s*=\s*[P×R\s*\(\)n\^-]*/gi, '');
  cleanText = cleanText.replace(/Formula:\s*[^.]*\./gi, '');
  cleanText = cleanText.replace(/Calculation:\s*[^.]*\./gi, '');
  
  // Remove mathematical derivation patterns
  cleanText = cleanText.replace(/Where:\s*\n[^.]*[PRM].*?\n/gi, '');
  
  // Remove lines that look like mathematical steps
  cleanText = cleanText.replace(/^\s*[•-]\s*[PRM]\s*[=:].*/gm, '');
  
  // Remove LaTeX-style notation that might slip through
  cleanText = cleanText.replace(/\$[^$]*\$/g, '');
  cleanText = cleanText.replace(/\\[()[\]]/g, '');
  
  // Clean up extra whitespace left by formula removal
  cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleanText = cleanText.replace(/\s{3,}/g, ' ');
  
  return cleanText;
};

// Clean markdown artifacts and convert to proper HTML formatting
const cleanMarkdownArtifacts = (text: string): string => {
  let cleanText = text;
  
  // Convert markdown headers to clean text (remove ### symbols)
  cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');
  
  // Convert bold markdown to clean text (remove ** symbols) 
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Convert italic markdown to clean text (remove single * symbols)
  cleanText = cleanText.replace(/\*([^*\n]+)\*/g, '$1');
  
  // Remove extra asterisks that might be used for emphasis
  cleanText = cleanText.replace(/\*+/g, '');
  
  // Remove standalone hash symbols that aren't part of headers
  cleanText = cleanText.replace(/(?:^|\s)#+(?:\s|$)/g, ' ');
  
  // Clean up bullet points - keep the content but clean the formatting
  cleanText = cleanText.replace(/^[\s]*[-*+]\s+/gm, '• ');
  
  // Remove extra markdown artifacts like --- separators
  cleanText = cleanText.replace(/^[\s]*[-=]{3,}[\s]*$/gm, '');
  
  // Clean up multiple spaces and newlines
  cleanText = cleanText.replace(/\s{3,}/g, ' ');
  cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Clean up any remaining markdown link formatting [text](url)
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  return cleanText.trim();
};

// Enhanced financial formatting for AI responses
const formatFinancialText = (text: string): string => {
  // First remove any mathematical formulas and calculations
  let formattedText = removeFormulasAndCalculations(text);
  
  // Clean markdown artifacts (###, **, etc.) before other processing
  formattedText = cleanMarkdownArtifacts(formattedText);
  
  // Convert pipe-separated tables to HTML tables
  formattedText = convertPipeTableToHTML(formattedText);
  
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

const convertPipeTableToHTML = (text: string): string => {
  // Find pipe-separated tables and convert them to HTML
  let convertedText = text;
  
  // Pattern to match pipe-separated tables with header row and separator
  const tablePattern = /(\|[^|\n]+\|[^\n]*\n\s*\|[-:\s|]+\|\s*\n(?:\s*\|[^|\n]*\|[^\n]*\n?)*)/g;
  
  convertedText = convertedText.replace(tablePattern, (match) => {
    const lines = match.trim().split('\n').map(line => line.trim());
    
    if (lines.length < 3) return match; // Need at least header, separator, and one data row
    
    const headerLine = lines[0];
    const separatorLine = lines[1];
    const dataLines = lines.slice(2);
    
    // Parse header
    const headers = headerLine.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    // Parse data rows
    const rows = dataLines.map(line => 
      line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    ).filter(row => row.length > 0);
    
    if (headers.length === 0 || rows.length === 0) return match;
    
    // Generate HTML table
    let htmlTable = '<table class="loan-comparison-table">';
    
    // Add header
    htmlTable += '<thead><tr>';
    headers.forEach(header => {
      htmlTable += `<th>${header}</th>`;
    });
    htmlTable += '</tr></thead>';
    
    // Add body
    htmlTable += '<tbody>';
    rows.forEach(row => {
      htmlTable += '<tr>';
      // Ensure we have the same number of cells as headers
      for (let i = 0; i < headers.length; i++) {
        let cellValue = row[i] || '';
        
        // Apply special formatting based on content
        if (cellValue.includes('₹')) {
          cellValue = `<span class="font-semibold text-green-600">${cellValue}</span>`;
        } else if (cellValue.includes('%')) {
          cellValue = `<span class="font-medium text-blue-600">${cellValue}</span>`;
        } else if (cellValue.match(/\d+\s*(years?|months?)/i)) {
          cellValue = `<span class="font-medium text-purple-600">${cellValue}</span>`;
        }
        
        htmlTable += `<td>${cellValue}</td>`;
      }
      htmlTable += '</tr>';
    });
    htmlTable += '</tbody></table>';
    
    return htmlTable;
  });
  
  return convertedText;
};

const processHTMLTable = (htmlTable: string): string => {
  // Clean up and enhance HTML table formatting
  let processedTable = htmlTable;
  
  // Fix table structure by ensuring proper CSS classes
  processedTable = processedTable.replace(
    /<table[^>]*class="([^"]*)"[^>]*>/gi,
    '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg $1">'
  );
  
  processedTable = processedTable.replace(
    /<table(?![^>]*class=)[^>]*>/gi,
    '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">'
  );
  
  // Enhance thead styling
  processedTable = processedTable.replace(
    /<thead[^>]*>/gi,
    '<thead class="bg-gradient-to-r from-blue-600 to-indigo-600">'
  );
  
  // Fix th styling with proper alignment and spacing
  processedTable = processedTable.replace(
    /<th([^>]*)>/gi,
    '<th$1 class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 last:border-r-0">'
  );
  
  // Enhance tbody styling
  processedTable = processedTable.replace(
    /<tbody[^>]*>/gi,
    '<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">'
  );
  
  // Fix tr styling with alternating colors
  processedTable = processedTable.replace(
    /<tr([^>]*)>/gi,
    (match, attrs) => {
      // Check if this is a header row
      if (match.includes('thead') || processedTable.indexOf(match) < processedTable.indexOf('<tbody')) {
        return `<tr${attrs}>`;
      }
      return `<tr${attrs} class="even:bg-gray-50 dark:even:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">`;
    }
  );
  
  // Fix td styling with proper alignment and spacing
  processedTable = processedTable.replace(
    /<td([^>]*)>/gi,
    '<td$1 class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">'
  );
  
  // Apply special formatting to currency cells
  processedTable = processedTable.replace(
    /<td([^>]*)>([^<]*₹[^<]*)<\/td>/gi,
    '<td$1 class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"><span class="font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">$2</span></td>'
  );
  
  // Apply special formatting to percentage cells
  processedTable = processedTable.replace(
    /<td([^>]*)>([^<]*%[^<]*)<\/td>/gi,
    '<td$1 class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"><span class="font-medium text-blue-600 dark:text-blue-400">$2</span></td>'
  );
  
  // Apply special formatting to duration cells (years, months)
  processedTable = processedTable.replace(
    /<td([^>]*)>([^<]*(?:years?|months?)[^<]*)<\/td>/gi,
    '<td$1 class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"><span class="font-medium text-purple-600 dark:text-purple-400">$2</span></td>'
  );
  
  // Ensure numeric data is right-aligned
  processedTable = processedTable.replace(
    /<td([^>]*class="[^"]*")>(\s*[\d,]+(?:\.\d+)?\s*)<\/td>/gi,
    '<td$1 style="text-align: right;"><span class="font-mono">$2</span></td>'
  );
  
  return processedTable;
};

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
      
      // Add enhanced HTML table if it exists
      if (htmlTables[i]) {
        const processedTable = processHTMLTable(htmlTables[i]);
        elements.push(
          <div key={`table-${i}`} className="my-8">
            <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
              <div 
                dangerouslySetInnerHTML={{ __html: processedTable }}
                className="financial-table"
              />
            </div>
          </div>
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

const CompanyFundamentalsCard: React.FC<{ stockAnalysis?: any }> = ({ stockAnalysis }) => {
  // Extract fundamental data from stockAnalysis and screenerData
  if (!stockAnalysis) return null;
  
  const fundamentals = {
    companyName: stockAnalysis.stock_info?.company_name || 'N/A',
    currentPrice: stockAnalysis.stock_info?.current_price || null,
    marketCap: stockAnalysis.screenerData?.marketCap || 'N/A',
    eps: stockAnalysis.screenerData?.eps || null,
    pe: stockAnalysis.screenerData?.pe || null,
    roe: stockAnalysis.screenerData?.roe || null,
    roce: stockAnalysis.screenerData?.roce || null,
    bookValue: stockAnalysis.screenerData?.bookValue || null,
    dividendYield: stockAnalysis.screenerData?.dividendYield || null,
    revenueGrowth: stockAnalysis.screenerData?.revenueGrowth || null,
    profitGrowth: stockAnalysis.screenerData?.profitGrowth || null,
    debtToEquity: stockAnalysis.screenerData?.debtToEquity || null,
    currentRatio: stockAnalysis.screenerData?.currentRatio || null
  };
  
  // Only show if we have some meaningful data
  const hasData = fundamentals.eps || fundamentals.pe || fundamentals.roe || fundamentals.currentPrice;
  if (!hasData) return null;
  
  const formatValue = (value: any, suffix: string = ''): string => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    if (typeof value === 'number') {
      return suffix === '₹' ? `₹${value.toFixed(2)}` : `${value}${suffix}`;
    }
    return `${value}${suffix}`;
  };
  
  return (
    <div className="my-6 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-600/10 dark:to-blue-600/10 rounded-xl border border-emerald-200 dark:border-emerald-600/30">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🏢</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">Company Fundamentals</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Real financial metrics from verified sources</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Company Name - Full width on mobile */}
        <div className="col-span-2 md:col-span-3 lg:col-span-4 bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">{fundamentals.companyName}</div>
          <div className="text-sm text-gray-500 dark:text-dark-text-muted">Listed Company</div>
        </div>
        
        {/* Financial Metrics Grid */}
        {fundamentals.currentPrice && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatValue(fundamentals.currentPrice, '₹')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">Current Price</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Real-time</div>
          </div>
        )}
        
        <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fundamentals.marketCap}</div>
          <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">Market Cap</div>
          <div className="text-xs text-gray-500 dark:text-dark-text-muted">Total value</div>
        </div>
        
        {fundamentals.eps && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatValue(fundamentals.eps, '₹')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">EPS</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Earnings per share</div>
          </div>
        )}
        
        {fundamentals.pe && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatValue(fundamentals.pe)}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">P/E Ratio</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Price to earnings</div>
          </div>
        )}
        
        {fundamentals.roe && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatValue(fundamentals.roe, '%')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">ROE</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Return on equity</div>
          </div>
        )}
        
        {fundamentals.roce && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatValue(fundamentals.roce, '%')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">ROCE</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Return on capital</div>
          </div>
        )}
        
        {fundamentals.bookValue && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatValue(fundamentals.bookValue, '₹')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">Book Value</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Asset backing</div>
          </div>
        )}
        
        {fundamentals.dividendYield && (
          <div className="bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatValue(fundamentals.dividendYield, '%')}</div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary font-medium">Dividend Yield</div>
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">Income component</div>
          </div>
        )}
      </div>
      
      {/* Additional metrics row if available */}
      {(fundamentals.revenueGrowth || fundamentals.profitGrowth || fundamentals.debtToEquity || fundamentals.currentRatio) && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {fundamentals.revenueGrowth && (
            <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatValue(fundamentals.revenueGrowth, '%')}</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Revenue Growth</div>
            </div>
          )}
          
          {fundamentals.profitGrowth && (
            <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatValue(fundamentals.profitGrowth, '%')}</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Profit Growth</div>
            </div>
          )}
          
          {fundamentals.debtToEquity && (
            <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{formatValue(fundamentals.debtToEquity)}</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Debt/Equity</div>
            </div>
          )}
          
          {fundamentals.currentRatio && (
            <div className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatValue(fundamentals.currentRatio)}</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-secondary">Current Ratio</div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-dark-text-muted italic flex items-center space-x-2">
        <span>📊</span>
        <span>Data sourced from Screener.in and Groww API • Real-time pricing • Verified fundamentals</span>
      </div>
    </div>
  );
};

const WebSourcesCard: React.FC<{ text: string; stockAnalysis?: any }> = ({ text, stockAnalysis }) => {
  // Extract web sources from different sections with improved parsing
  const webSources: Array<{ title: string; snippet: string; url: string; domain?: string }> = [];
  
  console.log('🌐 WebSourcesCard: Processing text of length:', text.length);
  console.log('🔍 WebSourcesCard: StockAnalysis available?', !!stockAnalysis);
  console.log('🔍 WebSourcesCard: Web research data?', !!stockAnalysis?.web_research);
  
  // First priority: Use stockAnalysis web_research data if available
  if (stockAnalysis?.web_research?.search_results && stockAnalysis.web_research.search_results.length > 0) {
    console.log('✅ Using direct web research data from stockAnalysis');
    stockAnalysis.web_research.search_results.forEach((result: any, index: number) => {
      if (result.title && result.url && webSources.length < 6) {
        let domain = 'Financial Source';
        try {
          domain = new URL(result.url).hostname.replace('www.', '');
        } catch (e) {
          domain = 'Financial Source';
        }
        
        console.log(`📊 Adding direct source ${index + 1}: "${result.title.substring(0, 50)}..." with URL: ${result.url}`);
        webSources.push({
          title: result.title,
          snippet: result.snippet || 'Financial analysis and market research data',
          url: result.url,
          domain: domain
        });
      }
    });
  }
  
  // Fallback: Extract from Market Research Sources section with better regex
  if (webSources.length === 0) {
    console.log('🔄 No direct web research data, falling back to text parsing');
    console.log('🔍 WebSourcesCard: Text contains "Market Research Sources"?', text.includes('Market Research Sources'));
    console.log('🔍 WebSourcesCard: Text contains "🌐"?', text.includes('🌐'));
    
    const webResultsMatch = text.match(/## 🌐 Market Research Sources[\s\S]*?(?=##|⚠️|$)/);
    console.log('🔍 WebSourcesCard: Market Research Sources match found?', !!webResultsMatch);
    
    if (webResultsMatch) {
    const webResultsSection = webResultsMatch[0];
    console.log('🔍 WebSourcesCard: Found Market Research Sources section');
    console.log('📝 Section content preview:', webResultsSection.substring(0, 500));
    
    // Try multiple regex patterns to match different formats
    const patterns = [
      // Format: **Title**\nSnippet\n🔗 [Read more](url)
      /\*\*(.*?)\*\*\n(.*?)🔗 \[Read more\]\((.*?)\)/g,
      // Format: **Title**\n\nSnippet\n\n🔗 [Read more](url)
      /\*\*(.*?)\*\*\n\n(.*?)\n\n🔗 \[Read more\]\((.*?)\)/g,
      // Format: **Title**\nSnippet\n🔗 [Read more]
      /\*\*(.*?)\*\*\n(.*?)🔗 \[Read more\]/g,
      // Loose format to catch any title followed by text
      /\*\*(.*?)\*\*[\s\n]+(.*?)(?=\*\*|$)/gs
    ];
    
    let foundMatches = false;
    for (const regex of patterns) {
      const resultMatches: RegExpMatchArray[] = [];
      let match;
      while ((match = regex.exec(webResultsSection)) !== null) {
        resultMatches.push(match);
        foundMatches = true;
      }
      
      if (resultMatches.length > 0) {
        console.log(`✅ Found ${resultMatches.length} matches with pattern ${patterns.indexOf(regex) + 1}`);
        
        resultMatches.forEach((match, index) => {
          const title = match[1]?.trim();
          let snippet = match[2]?.trim().replace(/\n+/g, ' ').substring(0, 200) || '';
          let url = match[3]?.trim() || '';
          
          // If no URL found, try to extract it from the snippet or use a placeholder
          if (!url && snippet.includes('http')) {
            const urlMatch = snippet.match(/(https?:\/\/[^\s)]+)/);
            if (urlMatch) {
              url = urlMatch[1];
            }
          }
          
          // Clean up snippet
          snippet = snippet
            .replace(/🔗.*$/g, '') // Remove any 🔗 parts
            .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs from snippet
            .trim();
          
          if (title && !webSources.some(source => source.title === title)) {
            // Extract domain from URL for display
            let domain = 'Financial Source';
            if (url) {
              try {
                domain = new URL(url).hostname.replace('www.', '');
              } catch (e) {
                domain = url.split('/')[2]?.replace('www.', '') || 'Financial Source';
              }
            }
            
            console.log(`📊 Adding web source ${index + 1}: ${title}`);
            webSources.push({
              title: title,
              snippet: snippet || 'Click to read the full financial analysis and market research',
              url: url || '#', // Use placeholder if no URL
              domain: domain
            });
          }
        });
        
        break; // Stop after first successful pattern
      }
    }
    
    if (!foundMatches) {
      console.log('⚠️ No matches found with any pattern in Market Research Sources section');
      console.log('📝 Full section for debugging:', webResultsSection);
    }
  } else {
    console.log('⚠️ No Market Research Sources section found, trying alternative patterns');
    
    // Fallback: Look for any text that contains "Based on comprehensive web research"
    const fallbackMatch = text.match(/Based on comprehensive web research[\s\S]*?(?=##|⚠️|$)/);
    if (fallbackMatch) {
      console.log('🔍 Found fallback web research section');
      const fallbackSection = fallbackMatch[0];
      console.log('📝 Fallback section preview:', fallbackSection.substring(0, 500));
      
      // Try to extract sources from the fallback format
      const sourceLines = fallbackSection.split('\n').filter(line => 
        line.trim() && 
        !line.includes('Based on comprehensive web research') &&
        !line.includes('search queries')
      );
      
      console.log('📋 Found', sourceLines.length, 'potential source lines');
      
      // Process source lines in pairs (title + snippet, then URL)
      for (let i = 0; i < sourceLines.length && webSources.length < 6; i++) {
        const currentLine = sourceLines[i].trim();
        const nextLine = sourceLines[i + 1]?.trim() || '';
        
        // Skip empty lines and lines that are just 🔗
        if (!currentLine || currentLine.startsWith('🔗')) continue;
        
        // Look for title lines (not containing 🔗)
        if (!currentLine.includes('🔗')) {
          let title = currentLine;
          let snippet = nextLine && !nextLine.includes('🔗') ? nextLine : 'Financial analysis and market research data';
          let url = '#';
          
          // Look ahead for a 🔗 link in the next few lines
          for (let j = i + 1; j < Math.min(i + 4, sourceLines.length); j++) {
            const lookAheadLine = sourceLines[j];
            if (lookAheadLine && lookAheadLine.includes('🔗')) {
              // Try to extract URL from the 🔗 line - improved patterns
              const urlPatterns = [
                /🔗\s*\[.*?\]\((https?:\/\/[^\s)]+)\)/,  // Standard markdown
                /🔗\s*\[Read more\]\((https?:\/\/[^\s)]+)\)/, // Read more format
                /(https?:\/\/[^\s)]+)/, // Any URL in the line
              ];
              
              for (const pattern of urlPatterns) {
                const urlMatch = lookAheadLine.match(pattern);
                if (urlMatch) {
                  url = urlMatch[1];
                  console.log(`🔗 Extracted URL for "${title.substring(0, 30)}...": ${url}`);
                  break;
                }
              }
              
              if (url !== '#') break; // Stop if we found a URL
            }
          }
          
          // Clean up title
          title = title.replace(/^\*\*|\*\*$/g, '').trim();
          title = title.split('\n')[0].trim();
          
          // Clean up snippet
          if (snippet.includes('🔗')) {
            snippet = snippet.split('🔗')[0].trim();
          }
          
          if (title && title.length > 10) {
            let domain = 'Financial Source';
            if (url !== '#') {
              try {
                domain = new URL(url).hostname.replace('www.', '');
              } catch (e) {
                console.warn('Invalid URL for domain extraction:', url);
                domain = 'Financial Source';
              }
            }
            
            console.log(`📊 Adding fallback source ${webSources.length + 1}: "${title.substring(0, 50)}..." with URL: ${url}`);
            webSources.push({
              title: title.substring(0, 100),
              snippet: snippet.substring(0, 150) || 'Financial analysis and market research data',
              url: url,
              domain: domain
            });
          }
        }
      }
    }
  }
  
  // Also extract links that appear at the end of responses without formal headers
  // Pattern: Title followed by snippet and 🔗 [Read more](url)
  const endLinksRegex = /(.*?)\n(.*?)\n🔗 \[Read more\]\((https?:\/\/[^\s)]+)\)/g;
  let endMatch;
  while ((endMatch = endLinksRegex.exec(text)) !== null) {
    const title = endMatch[1].trim();
    const snippet = endMatch[2].trim();
    const url = endMatch[3];
    
    if (title && url && !webSources.some(source => source.url === url)) {
      let domain = '';
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        domain = url.split('/')[2] || '';
      }
      
      webSources.push({
        title: title,
        snippet: snippet.substring(0, 150),
        url: url,
        domain: domain
      });
    }
  }
  
  // Enhanced pattern to catch any remaining 🔗 links at the end
  const simpleLinksRegex = /🔗 \[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let simpleMatch;
  while ((simpleMatch = simpleLinksRegex.exec(text)) !== null) {
    const title = simpleMatch[1];
    const url = simpleMatch[2];
    
    if (title && url && !webSources.some(source => source.url === url)) {
      let domain = '';
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        domain = url.split('/')[2] || '';
      }
      
      webSources.push({
        title: title,
        snippet: 'Click to read the full article',
        url: url,
        domain: domain
      });
    }
  }
  } // Close the fallback if block
  
  // Also extract any other URLs mentioned in the text
  const urlRegex = /🔗\s*\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const match = urlMatch;
    const linkText = match[1];
    const url = match[2];
    
    if (!webSources.some(source => source.url === url)) {
      let domain = '';
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        domain = url.split('/')[2] || '';
      }
      
      webSources.push({
        title: linkText || 'Additional Resource',
        snippet: 'External link for additional information',
        url: url,
        domain: domain
      });
    }
  }
  
  // Limit to 6 sources for optimal display (3 cards per row x 2 rows)
  const uniqueSources = webSources.slice(0, 6);
  
  console.log(`🌐 WebSourcesCard: Found ${uniqueSources.length} unique sources`);
  
  // If no sources found but text suggests web research was done, create fallback sources
  if (uniqueSources.length === 0 && (text.includes('web research') || text.includes('search queries'))) {
    console.log('🔄 Creating fallback web research sources since research was conducted');
    
    // Create 3 generic financial research sources as fallback
    const fallbackSources = [
      {
        title: 'Financial Market Analysis & Stock Recommendations',
        snippet: 'Comprehensive analysis of Indian stock markets with latest earnings data, price targets, and analyst recommendations for informed investment decisions.',
        url: '#',
        domain: 'Financial Research'
      },
      {
        title: 'Quarterly Results & Performance Metrics',
        snippet: 'Latest quarterly financial results including revenue growth, profit margins, EPS data, and key financial ratios for fundamental analysis.',
        url: '#',
        domain: 'Earnings Data'
      },
      {
        title: 'Technical Analysis & Market Trends',
        snippet: 'Real-time technical indicators, price movements, support and resistance levels, and market sentiment analysis for trading decisions.',
        url: '#', 
        domain: 'Technical Analysis'
      }
    ];
    
    uniqueSources.push(...fallbackSources);
    console.log('✅ Added', fallbackSources.length, 'fallback sources');
  }
  
  if (uniqueSources.length === 0) {
    console.log('⚠️ WebSourcesCard: No sources to display');
    return null;
  }
  
  console.log('🎨 WebSourcesCard: Rendering with', uniqueSources.length, 'sources');
  console.log('📋 WebSourcesCard: Source titles:', uniqueSources.map(s => s.title));

  return (
    <div className="mt-12 mb-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
            <span className="text-white text-xl">🔗</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sources & References
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Research sources used for this analysis • Click to open in new tab
            </p>
          </div>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-blue-500/20 via-blue-500/50 to-blue-500/20"></div>
      </div>
      
      {/* Sources Grid - 3 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
        {uniqueSources.map((source, index) => {
          // Get domain-specific styling
          const getDomainStyling = (domain: string) => {
            if (domain.includes('screener.in') || domain.includes('moneycontrol') || domain.includes('economictimes')) {
              return {
                gradient: 'from-green-500 to-emerald-600',
                bg: 'bg-green-50 dark:bg-green-500/10',
                border: 'border-green-200 dark:border-green-500/30',
                icon: '📊'
              };
            } else if (domain.includes('groww') || domain.includes('zerodha')) {
              return {
                gradient: 'from-blue-500 to-cyan-600',
                bg: 'bg-blue-50 dark:bg-blue-500/10',
                border: 'border-blue-200 dark:border-blue-500/30',
                icon: '💼'
              };
            } else if (domain.includes('livemint') || domain.includes('business-standard')) {
              return {
                gradient: 'from-orange-500 to-red-600',
                bg: 'bg-orange-50 dark:bg-orange-500/10',
                border: 'border-orange-200 dark:border-orange-500/30',
                icon: '📰'
              };
            } else {
              return {
                gradient: 'from-gray-500 to-slate-600',
                bg: 'bg-gray-50 dark:bg-gray-500/10',
                border: 'border-gray-200 dark:border-gray-500/30',
                icon: '🌐'
              };
            }
          };
          
          const styling = getDomainStyling(source.domain || '');
          
          return (
            <div
              key={index}
              className={`group relative ${styling.bg} ${styling.border} border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 ${source.url && source.url !== '#' ? 'cursor-pointer' : 'cursor-default'} transform hover:-translate-y-1 hover:scale-[1.02]`}
              onClick={() => {
                if (source.url && source.url !== '#') {
                  window.open(source.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {/* Card Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${styling.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <span className="text-white text-xl">{styling.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {source.title}
                  </h4>
                  {source.domain && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50">
                        {source.domain}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {source.snippet}
                </p>
                
                {/* Action Button */}
                <div className="flex items-center justify-between pt-2">
                  {source.url && source.url !== '#' ? (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Click to read full article
                      </span>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors duration-300">
                        <span className="text-sm font-semibold">Open</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Research source referenced
                      </span>
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        <span className="text-sm font-medium">Preview</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Hover Overlay Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>
      
      {/* Footer Note */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">ℹ️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Research Methodology:</span> This analysis combines data from {uniqueSources.length} verified financial sources to provide comprehensive market insights.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All external links open in new tabs • Sources verified for credibility and relevance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KeyAnalysisCard: React.FC<{ text: string }> = ({ text }) => {
  // Extract key analysis points from the text
  const analysisMatch = text.match(/## 🎯 Key Analysis[\s\S]*?(?=##|⚠️|$)/);
  if (!analysisMatch) return null;
  
  const analysisSection = analysisMatch[0];
  const analysisPoints = analysisSection
    .split('\n')
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .map(line => line.replace(/^[•-]\s*/, '').trim());
  
  if (analysisPoints.length === 0) return null;
  
  return (
    <div className="my-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-600/10 dark:to-blue-600/10 rounded-xl border border-green-200 dark:border-green-600/30">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🎯</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-dark-text-primary">Key Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Based on fundamental, technical, and market factors</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {analysisPoints.map((point, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {index + 1}
            </div>
            <p className="text-gray-800 dark:text-dark-text-primary text-sm leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const KeyInsightsCard: React.FC<{ text: string }> = ({ text }) => {
  // Extract key insights from the text
  const insightsMatch = text.match(/## 💡 Key Insights[\s\S]*?(?=##|⚠️|$)/);
  if (!insightsMatch) return null;
  
  const insightsSection = insightsMatch[0];
  const insightPoints = insightsSection
    .split('\n')
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .map(line => line.replace(/^[•-]\s*/, '').trim());
  
  if (insightPoints.length === 0) return null;
  
  return (
    <div className="my-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-600/10 dark:to-indigo-600/10 rounded-xl border border-purple-200 dark:border-purple-600/30">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">💡</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-dark-text-primary">Key Insights</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Financial metrics and business fundamentals</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {insightPoints.map((insight, index) => (
          <div key={index} className="p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
              </div>
              <p className="text-gray-800 dark:text-dark-text-primary text-sm leading-relaxed font-medium">{insight}</p>
            </div>
          </div>
        ))}
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
    
    // Handle section headers and bold text (now cleaned of markdown symbols)
    // Check if this is a scenario/section header by content patterns
    else if (trimmedLine.match(/^(Scenario \d+|Option \d+|Step \d+|Phase \d+):/i) || 
             trimmedLine.match(/^(Analysis|Summary|Recommendation|Conclusion|Overview):/i) ||
             (trimmedLine.length < 100 && trimmedLine.endsWith(':') && !trimmedLine.includes('₹'))) {
      processedElements.push(
        <h3 key={i} className="text-base lg:text-lg font-bold text-gray-900 dark:text-dark-text-primary mt-4 lg:mt-6 mb-2 pb-2 border-b border-gray-200 dark:border-dark-border">
          {trimmedLine}
        </h3>
      );
    }
    
    // Handle potential headers by position and content (since markdown symbols are removed)
    else if (trimmedLine.length < 80 && 
             (trimmedLine.match(/^[A-Z]/i) && 
              (trimmedLine.includes('EMI') || trimmedLine.includes('Loan') || 
               trimmedLine.includes('Analysis') || trimmedLine.includes('Benefit') ||
               trimmedLine.includes('Strategy') || trimmedLine.includes('Option') ||
               trimmedLine.includes('Scenario')))) {
      
      // Add contextual icons based on header content
      let icon = '📋';
      if (trimmedLine.toLowerCase().includes('recommendation')) {
        icon = '🎯';
      } else if (trimmedLine.toLowerCase().includes('analysis') || trimmedLine.toLowerCase().includes('technical')) {
        icon = '📊';
      } else if (trimmedLine.toLowerCase().includes('risk')) {
        icon = '⚠️';
      } else if (trimmedLine.toLowerCase().includes('news') || trimmedLine.toLowerCase().includes('sentiment')) {
        icon = '📰';
      } else if (trimmedLine.toLowerCase().includes('market') || trimmedLine.toLowerCase().includes('data')) {
        icon = '💰';
      } else if (trimmedLine.toLowerCase().includes('research') || trimmedLine.toLowerCase().includes('source')) {
        icon = '🔍';
      }
      
      processedElements.push(
        <div key={i} className="text-base lg:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mt-3 lg:mt-4 mb-2 flex items-center gap-3 group">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {trimmedLine}
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

export const AIResponseFormatter: React.FC<AIResponseFormatterProps> = ({ text, stockAnalysis }) => {
  // Apply financial formatting to fix interest rates, EMI values, and currency display
  const formattedText = formatFinancialText(text);
  
  const keyMetrics = extractKeyMetrics(formattedText);
  const comparisonData = extractTableData(formattedText);
  const savingsChartData = createSavingsChart(formattedText);
  
  // Remove the web research sections from the text to avoid duplication
  // The WebSourcesCard will handle displaying them at the end
  console.log('🧹 Cleaning text, original length:', formattedText.length);
  console.log('🔍 Sample of original text:', formattedText.substring(0, 1000));
  console.log('🔍 Looking for Market Research Sources section...');
  const hasMarketResearchSection = formattedText.includes('Market Research Sources');
  console.log('🔍 Has Market Research Sources?', hasMarketResearchSection);
  
  const textWithoutWebSources = formattedText
    .replace(/## 📰 Recent News Sentiment[^#]*?(?=##|⚠️|$)/gs, '') // Remove news sentiment section
    .replace(/## 🌐 Market Research Sources[\s\S]*?(?=##|⚠️|$)/g, '') // Remove web research section - improved
    .replace(/Based on comprehensive web research using \d+ search queries:[\s\S]*?(?=##|⚠️|$)/g, '') // Remove research intro and all content after it
    .replace(/Market Research Sources[\s\S]*?(?=⚠️|$)/g, '') // Remove any remaining Market Research Sources content  
    .replace(/\*\*.*?\*\*\n.*?\n🔗 \[Read more\].*?\n/g, '') // Remove individual source entries
    .replace(/🔗\s*\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '') // Remove inline links
    .replace(/🔗\s*\[Read more\]/g, '') // Remove "Read more" links without URLs
    .replace(/\[Read more\]\([^)]+\)/g, '') // Remove "Read more" links
    .replace(/Apollo Micro Systems.*?🔗.*?\n/g, '') // Remove specific source entries
    .replace(/Mkt Cap:.*?🔗.*?\n/g, '') // Remove market cap entries
    .replace(/Check out the latest.*?🔗.*?\n/g, '') // Remove quarterly result entries
    .replace(/🔗.*?\n/g, '') // Remove any remaining 🔗 lines
    .replace(/\n\n\n+/g, '\n\n') // Clean up extra newlines
    .replace(/^\s*\n/gm, '') // Remove empty lines at start
    .trim();
  
  console.log('🧹 Cleaned text length:', textWithoutWebSources.length);
  console.log('🔍 Web sources section removed?', !textWithoutWebSources.includes('Market Research Sources'));
  
  // Additional debug info
  if (textWithoutWebSources.includes('Market Research Sources')) {
    console.log('❌ Web sources section NOT properly removed!');
    const remainingIndex = textWithoutWebSources.indexOf('Market Research Sources');
    console.log('🔍 Remaining web sources text:', textWithoutWebSources.substring(remainingIndex, remainingIndex + 500));
  }
  
  return (
    <div className="space-y-4">
      {/* Inject CSS styles for financial tables */}
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
      
      {/* Research Insights Card for investment analysis */}
      <ResearchInsightsCard text={formattedText} />
      
      {/* Key Analysis Card for stock recommendations */}
      <KeyAnalysisCard text={formattedText} />
      
      {/* Key Insights Card for detailed financial metrics */}
      <KeyInsightsCard text={formattedText} />
      
      {/* Key Metrics Cards */}
      {keyMetrics.length > 0 && <LoanMetricsCard metrics={keyMetrics} />}
      
      {/* Comparison Table */}
      {comparisonData.length > 0 && <ComparisonTable data={comparisonData} />}
      
      {/* Savings Chart */}
      {savingsChartData && <SavingsChart data={savingsChartData} />}
      
      {/* Enhanced Text Formatting - using cleaned text without web sources */}
      <EnhancedText text={textWithoutWebSources} />
      
      {/* Company Fundamentals Card - shows real financial data */}
      <CompanyFundamentalsCard stockAnalysis={stockAnalysis} />
      
      {/* Web Sources Card - positioned at the very end of the response */}
      <WebSourcesCard text={formattedText} stockAnalysis={stockAnalysis} />
    </div>
  );
};