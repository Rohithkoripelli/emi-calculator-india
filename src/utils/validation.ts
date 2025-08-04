import { EMIInput, SukanyaInput, SIPInput, GratuityInput, CreditCardInput } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEMIInputs = (inputs: EMIInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Principal validation
  if (!inputs.principal || inputs.principal <= 0) {
    errors.principal = 'Principal amount must be greater than 0';
  } else if (inputs.principal > 100000000) { // 10 crores
    errors.principal = 'Principal amount cannot exceed ₹10 crores';
  } else if (inputs.principal < 10000) {
    errors.principal = 'Minimum loan amount is typically ₹10,000';
  }

  // Interest rate validation
  if (!inputs.interestRate || inputs.interestRate <= 0) {
    errors.interestRate = 'Interest rate must be greater than 0';
  } else if (inputs.interestRate > 50) {
    errors.interestRate = 'Interest rate cannot exceed 50%';
  } else if (inputs.interestRate < 0.1) {
    errors.interestRate = 'Interest rate must be at least 0.1%';
  }

  // Term validation
  if (!inputs.term || inputs.term <= 0) {
    errors.term = 'Loan term must be greater than 0';
  } else if (inputs.termUnit === 'years') {
    if (inputs.term > 50) {
      errors.term = 'Loan term cannot exceed 50 years';
    }
    if (inputs.loanType === 'car' && inputs.term > 7) {
      errors.term = 'Car loan term typically does not exceed 7 years';
    }
    if (inputs.loanType === 'personal' && inputs.term > 5) {
      errors.term = 'Personal loan term typically does not exceed 5 years';
    }
  } else { // months
    if (inputs.term > 600) {
      errors.term = 'Loan term cannot exceed 600 months';
    }
  }

  // Loan type specific validations
  if (inputs.loanType === 'home') {
    if (inputs.principal < 100000) {
      errors.principal = 'Home loan amount is typically at least ₹1 lakh';
    }
    if (inputs.interestRate < 6 || inputs.interestRate > 15) {
      errors.interestRate = 'Home loan interest rates typically range from 6% to 15%';
    }
  } else if (inputs.loanType === 'car') {
    if (inputs.principal < 50000) {
      errors.principal = 'Car loan amount is typically at least ₹50,000';
    }
    if (inputs.interestRate < 7 || inputs.interestRate > 20) {
      errors.interestRate = 'Car loan interest rates typically range from 7% to 20%';
    }
  } else if (inputs.loanType === 'personal') {
    if (inputs.principal > 5000000) {
      errors.principal = 'Personal loan amount typically does not exceed ₹50 lakhs';
    }
    if (inputs.interestRate < 10 || inputs.interestRate > 30) {
      errors.interestRate = 'Personal loan interest rates typically range from 10% to 30%';
    }
  }

  // Start date validation
  const today = new Date();
  const startDate = new Date(inputs.startDate);
  const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  
  if (startDate < today) {
    errors.startDate = 'Start date cannot be in the past';
  } else if (startDate > oneYearFromNow) {
    errors.startDate = 'Start date cannot be more than 1 year in the future';
  }

  // Prepayment validation
  if (inputs.prepayments && inputs.prepayments.length > 0) {
    const maxTenure = inputs.termUnit === 'years' ? inputs.term * 12 : inputs.term;
    inputs.prepayments.forEach((prepayment, index) => {
      if (prepayment.month <= 0 || prepayment.month > maxTenure) {
        errors[`prepayment_${index}_month`] = `Prepayment month must be between 1 and ${maxTenure}`;
      }
      if (prepayment.amount <= 0) {
        errors[`prepayment_${index}_amount`] = 'Prepayment amount must be greater than 0';
      }
      if (prepayment.amount > inputs.principal) {
        errors[`prepayment_${index}_amount`] = 'Prepayment amount cannot exceed principal amount';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSukanyaInputs = (inputs: SukanyaInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Deposit amount validation
  if (!inputs.depositAmount || inputs.depositAmount < 250) {
    errors.depositAmount = 'Minimum annual deposit is ₹250';
  } else if (inputs.depositAmount > 150000) {
    errors.depositAmount = 'Maximum annual deposit is ₹1,50,000';
  }

  // Age validation
  if (!inputs.currentAge || inputs.currentAge < 0) {
    errors.currentAge = 'Age cannot be negative';
  } else if (inputs.currentAge > 10) {
    errors.currentAge = 'Account can only be opened for girls up to 10 years of age';
  }

  // Term validation
  if (!inputs.termInYears || inputs.termInYears < 15) {
    errors.termInYears = 'Minimum investment period is 15 years';
  } else if (inputs.termInYears > 21) {
    errors.termInYears = 'Maximum investment period is 21 years';
  }

  // Interest rate validation
  if (!inputs.interestRate || inputs.interestRate <= 0) {
    errors.interestRate = 'Interest rate must be greater than 0';
  } else if (inputs.interestRate > 15) {
    errors.interestRate = 'Interest rate seems too high (current rate is around 8%)';
  } else if (inputs.interestRate < 5) {
    errors.interestRate = 'Interest rate seems too low for Sukanya Samridhi Yojana';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSIPInputs = (inputs: SIPInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Monthly investment validation
  if (!inputs.monthlyInvestment || inputs.monthlyInvestment < 500) {
    errors.monthlyInvestment = 'Minimum SIP amount is typically ₹500';
  } else if (inputs.monthlyInvestment > 1000000) {
    errors.monthlyInvestment = 'Monthly SIP amount seems very high';
  }

  // Expected return validation
  if (!inputs.expectedReturn || inputs.expectedReturn <= 0) {
    errors.expectedReturn = 'Expected return must be greater than 0';
  } else if (inputs.expectedReturn > 50) {
    errors.expectedReturn = 'Expected return seems unrealistically high';
  } else if (inputs.expectedReturn < 1) {
    errors.expectedReturn = 'Expected return seems too low';
  }

  // Investment period validation
  if (!inputs.investmentPeriod || inputs.investmentPeriod < 1) {
    errors.investmentPeriod = 'Investment period must be at least 1 year';
  } else if (inputs.investmentPeriod > 50) {
    errors.investmentPeriod = 'Investment period cannot exceed 50 years';
  }

  // Step-up percentage validation
  if (inputs.stepUpPercentage !== undefined) {
    if (inputs.stepUpPercentage < 0) {
      errors.stepUpPercentage = 'Step-up percentage cannot be negative';
    } else if (inputs.stepUpPercentage > 50) {
      errors.stepUpPercentage = 'Step-up percentage seems too high';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateGratuityInputs = (inputs: GratuityInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Monthly salary validation
  if (!inputs.monthlySalary || inputs.monthlySalary <= 0) {
    errors.monthlySalary = 'Monthly salary must be greater than 0';
  } else if (inputs.monthlySalary > 1000000) {
    errors.monthlySalary = 'Monthly salary seems very high';
  }

  // Last drawn salary validation
  if (!inputs.lastDrawnSalary || inputs.lastDrawnSalary <= 0) {
    errors.lastDrawnSalary = 'Last drawn salary must be greater than 0';
  } else if (inputs.lastDrawnSalary > 1000000) {
    errors.lastDrawnSalary = 'Last drawn salary seems very high';
  }

  // Cross validation
  if (inputs.lastDrawnSalary < inputs.monthlySalary * 0.5) {
    errors.lastDrawnSalary = 'Last drawn salary seems too low compared to current salary';
  }

  // Years of service validation
  if (inputs.yearsOfService < 0) {
    errors.yearsOfService = 'Years of service cannot be negative';
  } else if (inputs.yearsOfService > 50) {
    errors.yearsOfService = 'Years of service seems too high';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCreditCardInputs = (inputs: CreditCardInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Purchase amount validation
  if (!inputs.purchaseAmount || inputs.purchaseAmount <= 0) {
    errors.purchaseAmount = 'Purchase amount must be greater than 0';
  } else if (inputs.purchaseAmount > 10000000) {
    errors.purchaseAmount = 'Purchase amount seems very high';
  } else if (inputs.purchaseAmount < 1000) {
    errors.purchaseAmount = 'Purchase amount seems too low for EMI conversion';
  }

  // GST rate validation
  if (inputs.gstRate < 0) {
    errors.gstRate = 'GST rate cannot be negative';
  } else if (inputs.gstRate > 50) {
    errors.gstRate = 'GST rate cannot exceed 50%';
  }

  // Interest rate validation
  if (!inputs.interestRate || inputs.interestRate <= 0) {
    errors.interestRate = 'Interest rate must be greater than 0';
  } else if (inputs.interestRate > 60) {
    errors.interestRate = 'Interest rate seems too high';
  } else if (inputs.interestRate < 12) {
    errors.interestRate = 'Credit card interest rate is typically at least 12% p.a.';
  }

  // Tenure validation
  if (!inputs.tenure || inputs.tenure < 1) {
    errors.tenure = 'Tenure must be at least 1 month';
  } else if (inputs.tenure > 60) {
    errors.tenure = 'Credit card EMI tenure typically does not exceed 60 months';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Test calculation accuracy
export const testCalculationAccuracy = () => {
  const testResults = [];

  // Test EMI calculation
  const testEMI1 = {
    principal: 1000000,
    rate: 8.5,
    tenure: 240 // 20 years
  };
  
  // Manual calculation: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const r = testEMI1.rate / (12 * 100);
  const n = testEMI1.tenure;
  const expectedEMI = (testEMI1.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  
  testResults.push({
    test: 'EMI Calculation',
    expected: Math.round(expectedEMI),
    description: 'Basic EMI formula verification'
  });

  // Test compound interest calculation
  const testCompound = {
    principal: 100000,
    rate: 10,
    time: 5
  };
  
  const expectedCompound = testCompound.principal * Math.pow(1 + testCompound.rate / 100, testCompound.time);
  
  testResults.push({
    test: 'Compound Interest',
    expected: Math.round(expectedCompound),
    description: 'Compound interest formula verification'
  });

  return testResults;
};