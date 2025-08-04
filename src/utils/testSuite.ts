import { calculateEMI, calculateEMIDetails, calculateSukanyaSamridhi, calculateSIP, calculateGratuity, calculateCreditCardEMI } from './calculations';
import { EMIInput, SukanyaInput, SIPInput, GratuityInput, CreditCardInput } from '../types';

export interface TestResult {
  testName: string;
  passed: boolean;
  expected: number;
  actual: number;
  tolerance: number;
  description: string;
}

const isWithinTolerance = (actual: number, expected: number, tolerance: number = 0.01): boolean => {
  return Math.abs(actual - expected) <= tolerance;
};

export const runCalculationTests = (): TestResult[] => {
  const results: TestResult[] = [];

  // Test 1: Basic EMI Calculation
  const basicEMI = calculateEMI(1000000, 8.5, 240); // 10L, 8.5%, 20 years
  const expectedBasicEMI = 8678; // Manually calculated
  results.push({
    testName: 'Basic EMI Calculation',
    passed: isWithinTolerance(basicEMI, expectedBasicEMI, 50),
    actual: basicEMI,
    expected: expectedBasicEMI,
    tolerance: 50,
    description: 'Principal: ₹10L, Rate: 8.5%, Tenure: 240 months'
  });

  // Test 2: EMI Details Calculation
  const emiInput: EMIInput = {
    principal: 500000,
    interestRate: 10,
    term: 10,
    termUnit: 'years',
    loanType: 'home',
    startDate: new Date(),
    paymentFrequency: 'monthly',
    prepayments: []
  };
  
  const emiDetails = calculateEMIDetails(emiInput);
  const expectedMonthlyEMI = 6607; // Manually calculated
  results.push({
    testName: 'EMI Details Calculation',
    passed: isWithinTolerance(emiDetails.emi, expectedMonthlyEMI, 50),
    actual: emiDetails.emi,
    expected: expectedMonthlyEMI,
    tolerance: 50,
    description: 'Principal: ₹5L, Rate: 10%, Tenure: 10 years'
  });

  // Test 3: Total Interest Calculation
  const expectedTotalInterest = 292840; // Manually calculated
  results.push({
    testName: 'Total Interest Calculation',
    passed: isWithinTolerance(emiDetails.totalInterest, expectedTotalInterest, 1000),
    actual: emiDetails.totalInterest,
    expected: expectedTotalInterest,
    tolerance: 1000,
    description: 'Total interest for ₹5L loan at 10% for 10 years'
  });

  // Test 4: Sukanya Samridhi Calculation
  const sukanyaInput: SukanyaInput = {
    depositAmount: 150000,
    currentAge: 5,
    termInYears: 16,
    interestRate: 8.0
  };
  
  const sukanyaResult = calculateSukanyaSamridhi(sukanyaInput);
  const expectedSukanyaMaturity = 6500000; // Approximate calculation
  results.push({
    testName: 'Sukanya Samridhi Calculation',
    passed: isWithinTolerance(sukanyaResult.maturityAmount, expectedSukanyaMaturity, 500000),
    actual: sukanyaResult.maturityAmount,
    expected: expectedSukanyaMaturity,
    tolerance: 500000,
    description: '₹1.5L annual deposit for 16 years at 8%'
  });

  // Test 5: SIP Calculation
  const sipInput: SIPInput = {
    monthlyInvestment: 10000,
    expectedReturn: 12,
    investmentPeriod: 10,
    stepUpPercentage: 0
  };
  
  const sipResult = calculateSIP(sipInput);
  const expectedSIPValue = 2320000; // Approximate calculation
  results.push({
    testName: 'SIP Future Value Calculation',
    passed: isWithinTolerance(sipResult.futureValue, expectedSIPValue, 100000),
    actual: sipResult.futureValue,
    expected: expectedSIPValue,
    tolerance: 100000,
    description: '₹10K monthly SIP for 10 years at 12% return'
  });

  // Test 6: Gratuity Calculation
  const gratuityInput: GratuityInput = {
    monthlySalary: 50000,
    yearsOfService: 10,
    lastDrawnSalary: 60000
  };
  
  const gratuityResult = calculateGratuity(gratuityInput);
  const expectedGratuity = Math.round((60000 * 10 * 15) / 26); // Formula: (Last salary * years * 15) / 26
  results.push({
    testName: 'Gratuity Calculation',
    passed: isWithinTolerance(gratuityResult.gratuityAmount, expectedGratuity, 1000),
    actual: gratuityResult.gratuityAmount,
    expected: expectedGratuity,
    tolerance: 1000,
    description: '₹60K last salary, 10 years service'
  });

  // Test 7: Credit Card EMI Calculation
  const creditCardInput: CreditCardInput = {
    purchaseAmount: 100000,
    gstRate: 18,
    interestRate: 36,
    tenure: 12
  };
  
  const creditCardResult = calculateCreditCardEMI(creditCardInput);
  const totalAmountWithGST = 100000 + (100000 * 18 / 100); // ₹1,18,000
  const expectedCreditEMI = calculateEMI(totalAmountWithGST, 36, 12);
  results.push({
    testName: 'Credit Card EMI Calculation',
    passed: isWithinTolerance(creditCardResult.emi, expectedCreditEMI, 50),
    actual: creditCardResult.emi,
    expected: expectedCreditEMI,
    tolerance: 50,
    description: '₹1L purchase + 18% GST, 36% interest, 12 months'
  });

  // Test 8: GST Calculation
  const expectedGSTAmount = 18000; // 18% of ₹1L
  results.push({
    testName: 'GST Amount Calculation',
    passed: isWithinTolerance(creditCardResult.gstAmount, expectedGSTAmount, 10),
    actual: creditCardResult.gstAmount,
    expected: expectedGSTAmount,
    tolerance: 10,
    description: '18% GST on ₹1L purchase'
  });

  // Test 9: Edge Case - Zero Interest Rate
  const zeroInterestEMI = calculateEMI(120000, 0, 12); // 0% interest
  const expectedZeroInterestEMI = 120000 / 12; // Simple division
  results.push({
    testName: 'Zero Interest Rate EMI',
    passed: isWithinTolerance(zeroInterestEMI, expectedZeroInterestEMI, 1),
    actual: zeroInterestEMI,
    expected: expectedZeroInterestEMI,
    tolerance: 1,
    description: '₹1.2L principal, 0% interest, 12 months'
  });

  // Test 10: High Interest Rate
  const highInterestEMI = calculateEMI(100000, 24, 24); // 24% interest
  const expectedHighInterestEMI = 5244; // Approximate
  results.push({
    testName: 'High Interest Rate EMI',
    passed: isWithinTolerance(highInterestEMI, expectedHighInterestEMI, 100),
    actual: highInterestEMI,
    expected: expectedHighInterestEMI,
    tolerance: 100,
    description: '₹1L principal, 24% interest, 24 months'
  });

  return results;
};

export const runValidationTests = (): TestResult[] => {
  const results: TestResult[] = [];

  // Test validation functions exist and work
  results.push({
    testName: 'Calculation Functions Available',
    passed: typeof calculateEMI === 'function' && 
            typeof calculateEMIDetails === 'function' &&
            typeof calculateSukanyaSamridhi === 'function' &&
            typeof calculateSIP === 'function' &&
            typeof calculateGratuity === 'function' &&
            typeof calculateCreditCardEMI === 'function',
    actual: 1,
    expected: 1,
    tolerance: 0,
    description: 'All calculation functions are properly exported'
  });

  return results;
};

export const generateTestReport = (): {
  summary: { total: number; passed: number; failed: number; };
  details: TestResult[];
} => {
  const calculationTests = runCalculationTests();
  const validationTests = runValidationTests();
  const allTests = [...calculationTests, ...validationTests];
  
  const passed = allTests.filter(test => test.passed).length;
  const failed = allTests.length - passed;
  
  return {
    summary: {
      total: allTests.length,
      passed,
      failed
    },
    details: allTests
  };
};

// Performance benchmarks
export const runPerformanceBenchmarks = () => {
  const benchmarks = [];
  
  // Benchmark EMI calculation
  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    calculateEMI(1000000, 8.5, 240);
  }
  const endTime = performance.now();
  
  benchmarks.push({
    test: 'EMI Calculation (1000 iterations)',
    time: `${(endTime - startTime).toFixed(2)}ms`,
    description: 'Performance test for basic EMI calculation'
  });
  
  return benchmarks;
};