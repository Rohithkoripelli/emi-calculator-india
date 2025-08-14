import React from 'react';

interface TableCell {
  content: string;
  isHeader?: boolean;
  className?: string;
}

interface TableRow {
  cells: TableCell[];
  isHeader?: boolean;
}

interface FormattedTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

/**
 * Enhanced Table Formatter for AI Responses
 * Fixes alignment, removes unwanted symbols, ensures proper formatting
 */
export class EnhancedTableFormatter {
  
  /**
   * Clean table content by removing unwanted symbols and formatting
   */
  static cleanTableContent(content: string): string {
    return content
      // Remove markdown symbols
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\|/g, '')
      .replace(/---/g, '')
      .replace(/--/g, '')
      .replace(/_/g, '')
      .replace(/~/g, '')
      
      // Clean up multiple spaces and line breaks
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      
      // Clean currency formatting
      .replace(/₹\s+/g, '₹')
      .replace(/\s+₹/g, ' ₹')
      
      // Remove extra symbols and brackets
      .replace(/[\[\]()]/g, '')
      .replace(/[#@$%^&]/g, '')
      
      // Clean percentage formatting
      .replace(/%\s+/g, '%')
      .replace(/\s+%/g, '%')
      
      .trim();
  }

  /**
   * Parse HTML table and return structured data
   */
  static parseHTMLTable(htmlTable: string): FormattedTable | null {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlTable;
    
    const table = tempDiv.querySelector('table');
    if (!table) return null;

    const headers: string[] = [];
    const rows: string[][] = [];

    // Extract headers
    const headerRows = table.querySelectorAll('thead tr, tr:first-child');
    if (headerRows.length > 0) {
      const headerCells = headerRows[0].querySelectorAll('th, td');
      headerCells.forEach(cell => {
        const content = this.cleanTableContent(cell.textContent || '');
        if (content && content.length > 0) {
          headers.push(content);
        }
      });
    }

    // Extract data rows
    const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      const rowData: string[] = [];
      
      cells.forEach(cell => {
        const content = this.cleanTableContent(cell.textContent || '');
        rowData.push(content);
      });
      
      // Only add rows that have meaningful content
      if (rowData.some(cell => cell.length > 0)) {
        rows.push(rowData);
      }
    });

    // Extract caption if exists
    const caption = table.querySelector('caption')?.textContent?.trim();

    return {
      headers: headers.length > 0 ? headers : [],
      rows,
      caption
    };
  }

  /**
   * Parse markdown table and return structured data
   */
  static parseMarkdownTable(text: string): FormattedTable[] {
    const tables: FormattedTable[] = [];
    
    // Find all table-like structures
    const tablePattern = /\|[^|\n]*\|[\s\S]*?(?=\n\n|\n[^|]|$)/g;
    const tableMatches = text.match(tablePattern);
    
    if (!tableMatches) return tables;

    tableMatches.forEach(tableMatch => {
      const lines = tableMatch.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) return;

      const headers: string[] = [];
      const rows: string[][] = [];

      // Process each line
      lines.forEach((line, index) => {
        // Skip separator lines (containing --- or ===)
        if (line.includes('---') || line.includes('===')) return;

        const cells = line.split('|')
          .map(cell => this.cleanTableContent(cell))
          .filter(cell => cell.length > 0);

        if (cells.length === 0) return;

        // First non-separator line is headers
        if (headers.length === 0) {
          headers.push(...cells);
        } else {
          // Ensure row has same number of cells as headers
          while (cells.length < headers.length) {
            cells.push('');
          }
          if (cells.length > headers.length) {
            cells.splice(headers.length);
          }
          rows.push(cells);
        }
      });

      if (headers.length > 0 && rows.length > 0) {
        tables.push({ headers, rows });
      }
    });

    return tables;
  }

  /**
   * Generate clean HTML table
   */
  static generateCleanTable(tableData: FormattedTable, className: string = ''): string {
    const { headers, rows, caption } = tableData;

    // Validate data
    if (headers.length === 0 || rows.length === 0) return '';

    // Remove empty columns
    const validColumnIndices: number[] = [];
    for (let i = 0; i < headers.length; i++) {
      const hasContent = headers[i].length > 0 || 
                        rows.some(row => row[i] && row[i].length > 0);
      if (hasContent) {
        validColumnIndices.push(i);
      }
    }

    if (validColumnIndices.length === 0) return '';

    const filteredHeaders = validColumnIndices.map(i => headers[i]);
    const filteredRows = rows.map(row => 
      validColumnIndices.map(i => row[i] || '')
    );

    // Generate table HTML
    let html = `<table class="enhanced-ai-table ${className}">`;
    
    if (caption) {
      html += `<caption class="table-caption">${caption}</caption>`;
    }

    // Generate headers
    html += '<thead><tr>';
    filteredHeaders.forEach(header => {
      html += `<th class="table-header">${this.formatCellContent(header)}</th>`;
    });
    html += '</tr></thead>';

    // Generate rows
    html += '<tbody>';
    filteredRows.forEach((row, rowIndex) => {
      html += '<tr>';
      row.forEach((cell, cellIndex) => {
        const isNumeric = this.isNumericValue(cell);
        const cellClass = isNumeric ? 'table-cell numeric' : 'table-cell';
        html += `<td class="${cellClass}">${this.formatCellContent(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    html += '</table>';
    return html;
  }

  /**
   * Check if value is numeric (currency, percentage, number)
   */
  static isNumericValue(value: string): boolean {
    if (!value) return false;
    
    // Check for currency symbols
    if (value.includes('₹') || value.includes('$') || value.includes('€')) {
      return true;
    }
    
    // Check for percentage
    if (value.includes('%')) {
      return true;
    }
    
    // Check for pure numbers (including formatted numbers with commas)
    const numericValue = value.replace(/[₹$€,%\s]/g, '');
    return !isNaN(parseFloat(numericValue)) && isFinite(parseFloat(numericValue));
  }

  /**
   * Format cell content with proper styling
   */
  static formatCellContent(content: string): string {
    if (!content) return '';

    let formatted = content;

    // Format currency values
    if (formatted.includes('₹')) {
      const amount = formatted.match(/₹[\d,\.]+/)?.[0];
      if (amount) {
        const numericPart = amount.replace(/₹|,/g, '');
        const number = parseFloat(numericPart);
        if (!isNaN(number)) {
          formatted = formatted.replace(
            amount,
            `<span class="currency-value">₹${number.toLocaleString('en-IN')}</span>`
          );
        }
      }
    }

    // Format percentage values
    if (formatted.includes('%')) {
      formatted = formatted.replace(
        /(\d+(?:\.\d+)?)%/g,
        '<span class="percentage-value">$1%</span>'
      );
    }

    // Format duration (years, months)
    formatted = formatted.replace(
      /(\d+)\s*(years?|months?)/gi,
      '<span class="duration-value">$1 $2</span>'
    );

    return formatted;
  }

  /**
   * Extract and format amortization tables specifically
   */
  static formatAmortizationTable(text: string): string | null {
    // Look for amortization-specific patterns
    const amortizationKeywords = [
      'amortization', 'payment schedule', 'loan schedule', 
      'emi breakdown', 'principal', 'interest', 'balance'
    ];

    const hasAmortization = amortizationKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );

    if (!hasAmortization) return null;

    // Extract table data
    const tables = this.parseMarkdownTable(text);
    if (tables.length === 0) return null;

    // Find the table that looks like an amortization schedule
    const amortizationTable = tables.find(table => {
      const headerText = table.headers.join(' ').toLowerCase();
      return headerText.includes('payment') ||
             headerText.includes('principal') ||
             headerText.includes('interest') ||
             headerText.includes('balance');
    });

    if (!amortizationTable) return null;

    // Ensure proper column headers for amortization
    const standardHeaders = ['Payment No.', 'EMI Amount', 'Principal', 'Interest', 'Balance'];
    
    // Map existing headers to standard ones if possible
    const mappedHeaders = amortizationTable.headers.map(header => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('payment') || lowerHeader.includes('no')) return 'Payment No.';
      if (lowerHeader.includes('emi')) return 'EMI Amount';
      if (lowerHeader.includes('principal')) return 'Principal';
      if (lowerHeader.includes('interest')) return 'Interest';
      if (lowerHeader.includes('balance') || lowerHeader.includes('outstanding')) return 'Balance';
      return header;
    });

    return this.generateCleanTable({
      ...amortizationTable,
      headers: mappedHeaders
    }, 'amortization-table');
  }

  /**
   * Calculate accurate loan amortization
   */
  static calculateLoanAmortization(
    principal: number,
    annualRate: number,
    tenureMonths: number
  ): { payment: number, principal: number, interest: number, balance: number }[] {
    const monthlyRate = annualRate / 100 / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const schedule = [];
    let remainingBalance = principal;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = emi - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      schedule.push({
        payment: month,
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(remainingBalance)
      });
    }

    return schedule;
  }

  /**
   * Generate accurate amortization table HTML
   */
  static generateAmortizationTable(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    showFullSchedule: boolean = false
  ): string {
    const schedule = this.calculateLoanAmortization(principal, annualRate, tenureMonths);
    
    // For display, show first few months, some middle months, and last few months
    let displaySchedule = schedule;
    if (!showFullSchedule && schedule.length > 12) {
      displaySchedule = [
        ...schedule.slice(0, 6),    // First 6 months
        ...schedule.slice(Math.floor(schedule.length / 2) - 1, Math.floor(schedule.length / 2) + 1), // Middle
        ...schedule.slice(-6)       // Last 6 months
      ];
    }

    const emi = schedule.length > 0 ? 
      Math.round(schedule[0].principal + schedule[0].interest) : 0;

    let html = `
      <div class="amortization-container">
        <div class="amortization-summary">
          <div class="summary-item">
            <span class="label">Loan Amount:</span>
            <span class="value currency-value">₹${principal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-item">
            <span class="label">Interest Rate:</span>
            <span class="value percentage-value">${annualRate}%</span>
          </div>
          <div class="summary-item">
            <span class="label">Tenure:</span>
            <span class="value duration-value">${tenureMonths} months</span>
          </div>
          <div class="summary-item">
            <span class="label">EMI:</span>
            <span class="value currency-value">₹${emi.toLocaleString('en-IN')}</span>
          </div>
        </div>
        
        <table class="enhanced-ai-table amortization-table">
          <thead>
            <tr>
              <th class="table-header">Payment No.</th>
              <th class="table-header">EMI Amount</th>
              <th class="table-header">Principal</th>
              <th class="table-header">Interest</th>
              <th class="table-header">Balance</th>
            </tr>
          </thead>
          <tbody>
    `;

    displaySchedule.forEach((row, index) => {
      const isEllipsis = !showFullSchedule && schedule.length > 12 && 
                       index === 6 && displaySchedule.length > 12;
      
      if (isEllipsis) {
        html += `
          <tr class="ellipsis-row">
            <td colspan="5" class="table-cell ellipsis">...</td>
          </tr>
        `;
      }

      html += `
        <tr>
          <td class="table-cell">${row.payment}</td>
          <td class="table-cell numeric currency-value">₹${emi.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${row.principal.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${row.interest.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${row.balance.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }
}

/**
 * React component for rendering enhanced tables
 */
interface EnhancedTableProps {
  content: string;
  className?: string;
}

export const EnhancedTable: React.FC<EnhancedTableProps> = ({ 
  content, 
  className = '' 
}) => {
  // Check if this is HTML table content
  if (content.includes('<table')) {
    const tableData = EnhancedTableFormatter.parseHTMLTable(content);
    if (tableData) {
      const cleanTable = EnhancedTableFormatter.generateCleanTable(tableData, className);
      return (
        <div 
          className={`enhanced-table-wrapper ${className}`}
          dangerouslySetInnerHTML={{ __html: cleanTable }}
        />
      );
    }
  }

  // Check for amortization content
  const amortizationTable = EnhancedTableFormatter.formatAmortizationTable(content);
  if (amortizationTable) {
    return (
      <div 
        className={`enhanced-table-wrapper amortization-wrapper ${className}`}
        dangerouslySetInnerHTML={{ __html: amortizationTable }}
      />
    );
  }

  // Parse markdown tables
  const tables = EnhancedTableFormatter.parseMarkdownTable(content);
  if (tables.length > 0) {
    return (
      <div className={`enhanced-table-wrapper ${className}`}>
        {tables.map((table, index) => (
          <div
            key={index}
            dangerouslySetInnerHTML={{ 
              __html: EnhancedTableFormatter.generateCleanTable(table, className) 
            }}
            className="table-instance"
          />
        ))}
      </div>
    );
  }

  // No tables found, return original content
  return <div className={className}>{content}</div>;
};

export default EnhancedTable;