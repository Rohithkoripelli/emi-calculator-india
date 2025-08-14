/**
 * Enhanced Loan Calculation Service
 * Provides accurate financial calculations for loan amortization, EMI, and tax benefits
 */

export interface LoanDetails {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  loanType?: 'home' | 'personal' | 'car' | 'education';
}

export interface AmortizationEntry {
  month: number;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

export interface LoanSummary {
  monthlyEMI: number;
  totalAmount: number;
  totalInterest: number;
  totalPrincipal: number;
  interestToIncomeRatio?: number;
}

export interface PrepaymentScenario {
  originalLoan: LoanSummary;
  afterPrepayment: LoanSummary;
  savings: {
    interestSaved: number;
    tenureReduced: number;
    totalSavings: number;
  };
  prepaymentAmount: number;
  prepaymentMonth: number;
}

export interface TaxBenefit {
  principalDeduction: number;
  interestDeduction: number;
  totalDeduction: number;
  taxSaved: number;
  effectiveInterestRate: number;
}

export class LoanCalculationService {
  
  /**
   * Calculate accurate EMI using the standard formula
   */
  static calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) {
      return principal / tenureMonths;
    }
    
    const monthlyRate = annualRate / 100 / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    
    return Math.round(emi);
  }

  /**
   * Generate complete amortization schedule
   */
  static generateAmortizationSchedule(loanDetails: LoanDetails): AmortizationEntry[] {
    const { principal, annualInterestRate, tenureMonths } = loanDetails;
    const monthlyRate = annualInterestRate / 100 / 12;
    const emi = this.calculateEMI(principal, annualInterestRate, tenureMonths);
    
    const schedule: AmortizationEntry[] = [];
    let outstandingBalance = principal;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestComponent = Math.round(outstandingBalance * monthlyRate);
      const principalComponent = emi - interestComponent;
      
      outstandingBalance = Math.max(0, outstandingBalance - principalComponent);
      cumulativePrincipal += principalComponent;
      cumulativeInterest += interestComponent;

      schedule.push({
        month,
        emiAmount: emi,
        principalComponent,
        interestComponent,
        outstandingBalance,
        cumulativePrincipal,
        cumulativeInterest
      });
    }

    return schedule;
  }

  /**
   * Calculate loan summary
   */
  static calculateLoanSummary(loanDetails: LoanDetails): LoanSummary {
    const { principal, annualInterestRate, tenureMonths } = loanDetails;
    const monthlyEMI = this.calculateEMI(principal, annualInterestRate, tenureMonths);
    const totalAmount = monthlyEMI * tenureMonths;
    const totalInterest = totalAmount - principal;

    return {
      monthlyEMI,
      totalAmount,
      totalInterest,
      totalPrincipal: principal
    };
  }

  /**
   * Calculate prepayment scenarios
   */
  static calculatePrepaymentScenario(
    loanDetails: LoanDetails,
    prepaymentAmount: number,
    prepaymentMonth: number,
    reduceEMI: boolean = false
  ): PrepaymentScenario {
    const originalSummary = this.calculateLoanSummary(loanDetails);
    const originalSchedule = this.generateAmortizationSchedule(loanDetails);

    // Find outstanding balance at prepayment month
    const outstandingAtPrepayment = originalSchedule[prepaymentMonth - 1]?.outstandingBalance || loanDetails.principal;
    const newPrincipal = Math.max(0, outstandingAtPrepayment - prepaymentAmount);

    let newLoanDetails: LoanDetails;
    
    if (reduceEMI) {
      // Reduce EMI, keep tenure same
      const remainingMonths = loanDetails.tenureMonths - prepaymentMonth + 1;
      newLoanDetails = {
        ...loanDetails,
        principal: newPrincipal,
        tenureMonths: remainingMonths
      };
    } else {
      // Reduce tenure, keep EMI same (approximately)
      const newTenure = this.calculateNewTenure(
        newPrincipal,
        loanDetails.annualInterestRate,
        originalSummary.monthlyEMI
      );
      newLoanDetails = {
        ...loanDetails,
        principal: newPrincipal,
        tenureMonths: newTenure
      };
    }

    const newSummary = this.calculateLoanSummary(newLoanDetails);
    
    // Calculate actual savings
    const interestPaidTillPrepayment = originalSchedule
      .slice(0, prepaymentMonth - 1)
      .reduce((sum, entry) => sum + entry.interestComponent, 0);
    
    const totalOriginalInterest = originalSummary.totalInterest;
    const totalNewInterest = interestPaidTillPrepayment + newSummary.totalInterest;
    
    return {
      originalLoan: originalSummary,
      afterPrepayment: newSummary,
      savings: {
        interestSaved: totalOriginalInterest - totalNewInterest,
        tenureReduced: loanDetails.tenureMonths - (prepaymentMonth - 1 + newLoanDetails.tenureMonths),
        totalSavings: totalOriginalInterest - totalNewInterest + 
                     (originalSummary.monthlyEMI * (loanDetails.tenureMonths - (prepaymentMonth - 1 + newLoanDetails.tenureMonths)))
      },
      prepaymentAmount,
      prepaymentMonth
    };
  }

  /**
   * Calculate new tenure for given principal and EMI
   */
  private static calculateNewTenure(principal: number, annualRate: number, targetEMI: number): number {
    const monthlyRate = annualRate / 100 / 12;
    
    if (monthlyRate === 0) {
      return Math.ceil(principal / targetEMI);
    }

    const tenure = Math.log(1 + (principal * monthlyRate) / targetEMI) / 
                   Math.log(1 + monthlyRate);
    
    return Math.ceil(tenure);
  }

  /**
   * Calculate tax benefits for home loans
   */
  static calculateHomeLoanTaxBenefits(
    loanDetails: LoanDetails,
    taxBracket: number,
    isFirstTimeHomeBuyer: boolean = false,
    jointOwnership: boolean = false
  ): TaxBenefit {
    const schedule = this.generateAmortizationSchedule(loanDetails);
    const firstYearData = schedule.slice(0, 12);
    
    const annualPrincipal = firstYearData.reduce((sum, entry) => sum + entry.principalComponent, 0);
    const annualInterest = firstYearData.reduce((sum, entry) => sum + entry.interestComponent, 0);

    // Standard deductions (per individual)
    let principalDeductionLimit = 150000; // Section 80C
    let interestDeductionLimit = 200000;  // Section 24

    // First-time home buyer additional benefit
    if (isFirstTimeHomeBuyer) {
      principalDeductionLimit += 50000; // Additional under Section 80EE
    }

    // Joint ownership doubles the limits
    if (jointOwnership) {
      principalDeductionLimit *= 2;
      interestDeductionLimit *= 2;
    }

    const principalDeduction = Math.min(annualPrincipal, principalDeductionLimit);
    const interestDeduction = Math.min(annualInterest, interestDeductionLimit);
    const totalDeduction = principalDeduction + interestDeduction;
    
    const taxSaved = totalDeduction * (taxBracket / 100);
    const effectiveInterestRate = ((annualInterest - (interestDeduction * taxBracket / 100)) / 
                                  loanDetails.principal) * 100;

    return {
      principalDeduction,
      interestDeduction,
      totalDeduction,
      taxSaved,
      effectiveInterestRate
    };
  }

  /**
   * Compare multiple loan scenarios
   */
  static compareLoanScenarios(scenarios: LoanDetails[]): {
    scenario: string;
    summary: LoanSummary;
    ranking: number;
  }[] {
    const results = scenarios.map((loan, index) => ({
      scenario: `Scenario ${index + 1}`,
      summary: this.calculateLoanSummary(loan),
      ranking: 0
    }));

    // Rank by total interest (lower is better)
    const sortedByInterest = [...results].sort((a, b) => a.summary.totalInterest - b.summary.totalInterest);
    sortedByInterest.forEach((item, index) => {
      const originalIndex = results.findIndex(r => r.scenario === item.scenario);
      results[originalIndex].ranking = index + 1;
    });

    return results.sort((a, b) => a.ranking - b.ranking);
  }

  /**
   * Generate formatted amortization table for display
   */
  static generateFormattedAmortizationTable(
    loanDetails: LoanDetails,
    showFullSchedule: boolean = false,
    maxRowsToShow: number = 24
  ): {
    summary: LoanSummary;
    schedule: AmortizationEntry[];
    displaySchedule: AmortizationEntry[];
    tableHTML: string;
  } {
    const summary = this.calculateLoanSummary(loanDetails);
    const schedule = this.generateAmortizationSchedule(loanDetails);
    
    let displaySchedule = schedule;
    
    // If not showing full schedule and we have too many entries, sample them
    if (!showFullSchedule && schedule.length > maxRowsToShow) {
      const firstSix = schedule.slice(0, 6);
      const middle = schedule.slice(
        Math.floor(schedule.length / 2) - 1,
        Math.floor(schedule.length / 2) + 1
      );
      const lastSix = schedule.slice(-6);
      displaySchedule = [...firstSix, ...middle, ...lastSix];
    }

    // Generate HTML table
    let tableHTML = `
      <div class="loan-summary-container">
        <div class="loan-summary-grid">
          <div class="summary-card">
            <div class="summary-label">Loan Amount</div>
            <div class="summary-value currency">₹${loanDetails.principal.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Interest Rate</div>
            <div class="summary-value percentage">${loanDetails.annualInterestRate}%</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Tenure</div>
            <div class="summary-value duration">${loanDetails.tenureMonths} months</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Monthly EMI</div>
            <div class="summary-value currency">₹${summary.monthlyEMI.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <table class="enhanced-ai-table amortization-table">
        <thead>
          <tr>
            <th class="table-header">Month</th>
            <th class="table-header">EMI Amount</th>
            <th class="table-header">Principal</th>
            <th class="table-header">Interest</th>
            <th class="table-header">Balance</th>
          </tr>
        </thead>
        <tbody>
    `;

    displaySchedule.forEach((entry, index) => {
      // Add ellipsis row if this is a sampled schedule
      if (!showFullSchedule && schedule.length > maxRowsToShow && index === 6) {
        tableHTML += `
          <tr class="ellipsis-row">
            <td colspan="5" class="table-cell ellipsis">⋮</td>
          </tr>
        `;
      }

      tableHTML += `
        <tr>
          <td class="table-cell">${entry.month}</td>
          <td class="table-cell numeric currency-value">₹${entry.emiAmount.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${entry.principalComponent.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${entry.interestComponent.toLocaleString('en-IN')}</td>
          <td class="table-cell numeric currency-value">₹${entry.outstandingBalance.toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    return {
      summary,
      schedule,
      displaySchedule,
      tableHTML
    };
  }

  /**
   * Validate loan parameters
   */
  static validateLoanDetails(loanDetails: LoanDetails): string[] {
    const errors: string[] = [];

    if (loanDetails.principal <= 0) {
      errors.push('Principal amount must be greater than zero');
    }

    if (loanDetails.principal > 100000000) { // 10 crores
      errors.push('Principal amount seems too high');
    }

    if (loanDetails.annualInterestRate < 0 || loanDetails.annualInterestRate > 50) {
      errors.push('Interest rate must be between 0% and 50%');
    }

    if (loanDetails.tenureMonths <= 0 || loanDetails.tenureMonths > 600) { // 50 years max
      errors.push('Tenure must be between 1 month and 50 years');
    }

    const emi = this.calculateEMI(loanDetails.principal, loanDetails.annualInterestRate, loanDetails.tenureMonths);
    if (emi < 100) {
      errors.push('EMI calculated is too low, check your inputs');
    }

    return errors;
  }
}

export default LoanCalculationService;