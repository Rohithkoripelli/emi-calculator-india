import { EMIInput, EMICalculation, PaymentScheduleItem, SukanyaInput, SIPInput, GratuityInput, CreditCardInput, Prepayment } from '../types';
import { addMonths } from 'date-fns';

export const calculateEMI = (principal: number, rate: number, tenure: number): number => {
  const monthlyRate = rate / (12 * 100);
  if (monthlyRate === 0) return principal / tenure;
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi);
};

export const calculateEMIDetails = (input: EMIInput): EMICalculation => {
  const { principal, interestRate, term, termUnit } = input;
  const tenureInMonths = termUnit === 'years' ? term * 12 : term;
  
  const emi = calculateEMI(principal, interestRate, tenureInMonths);
  const totalPayment = emi * tenureInMonths;
  const totalInterest = totalPayment - principal;
  
  return {
    emi,
    totalPayment,
    totalInterest,
    principal
  };
};

export const generatePaymentSchedule = (input: EMIInput): PaymentScheduleItem[] => {
  const { principal, interestRate, term, termUnit, startDate, prepayments = [] } = input;
  const tenureInMonths = termUnit === 'years' ? term * 12 : term;
  const monthlyRate = interestRate / (12 * 100);
  let emi = calculateEMI(principal, interestRate, tenureInMonths);
  
  const schedule: PaymentScheduleItem[] = [];
  let remainingBalance = principal;
  let currentEmi = emi;
  let month = 1;
  
  // Create prepayment map for easy lookup
  const prepaymentMap = new Map<number, Prepayment>();
  prepayments.forEach(prep => prepaymentMap.set(prep.month, prep));
  
  while (remainingBalance > 1 && month <= tenureInMonths * 2) { // Prevent infinite loop
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = Math.min(currentEmi - interestPayment, remainingBalance);
    
    // Handle prepayments
    const prepayment = prepaymentMap.get(month);
    if (prepayment) {
      if (prepayment.type === 'lumpsum') {
        principalPayment += prepayment.amount;
      } else if (prepayment.type === 'monthly-increase') {
        currentEmi += prepayment.amount;
        principalPayment = Math.min(currentEmi - interestPayment, remainingBalance);
      }
    }
    
    remainingBalance -= principalPayment;
    
    const paymentDate = addMonths(startDate, month - 1);
    
    schedule.push({
      month,
      date: paymentDate,
      emi: Math.round(currentEmi + (prepayment?.type === 'lumpsum' ? prepayment.amount : 0)),
      principal: Math.round(principalPayment),
      interest: Math.round(interestPayment),
      balance: Math.max(0, Math.round(remainingBalance)),
      year: paymentDate.getFullYear()
    });
    
    month++;
    
    if (remainingBalance <= 1) break;
  }
  
  return schedule;
};

export const calculateEMIWithPrepayments = (input: EMIInput): EMICalculation => {
  const schedule = generatePaymentSchedule(input);
  const totalPayment = schedule.reduce((sum, item) => sum + item.emi, 0);
  const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
  const emi = schedule.length > 0 ? schedule[0].emi : 0;
  
  return {
    emi,
    totalPayment,
    totalInterest,
    principal: input.principal
  };
};

export const calculateSukanyaSamridhi = (input: SukanyaInput) => {
  const { depositAmount, currentAge, termInYears, interestRate } = input;
  const maturityAge = currentAge + termInYears;
  const totalDeposit = depositAmount * termInYears;
  const maturityAmount = depositAmount * (((Math.pow(1 + interestRate/100, termInYears)) - 1) / (interestRate/100)) * (1 + interestRate/100);
  
  return {
    maturityAmount: Math.round(maturityAmount),
    totalDeposit,
    totalInterest: Math.round(maturityAmount - totalDeposit),
    maturityAge
  };
};

export const calculateSIP = (input: SIPInput) => {
  const { monthlyInvestment, expectedReturn, investmentPeriod, stepUpPercentage = 0 } = input;
  const monthlyRate = expectedReturn / (12 * 100);
  const totalMonths = investmentPeriod * 12;
  
  let totalInvestment = 0;
  let futureValue = 0;
  let currentMonthlyInvestment = monthlyInvestment;
  
  for (let month = 1; month <= totalMonths; month++) {
    totalInvestment += currentMonthlyInvestment;
    const remainingMonths = totalMonths - month + 1;
    futureValue += currentMonthlyInvestment * Math.pow(1 + monthlyRate, remainingMonths - 1);
    
    if (month % 12 === 0 && stepUpPercentage > 0) {
      currentMonthlyInvestment *= (1 + stepUpPercentage / 100);
    }
  }
  
  return {
    futureValue: Math.round(futureValue),
    totalInvestment: Math.round(totalInvestment),
    totalReturns: Math.round(futureValue - totalInvestment)
  };
};

export const calculateGratuity = (input: GratuityInput) => {
  const { yearsOfService, lastDrawnSalary } = input;
  const gratuityAmount = (lastDrawnSalary * yearsOfService * 15) / 26;
  const maxGratuityLimit = 2000000; // 20 lakh as per current rules
  
  return {
    gratuityAmount: Math.min(Math.round(gratuityAmount), maxGratuityLimit),
    eligibleYears: Math.max(0, yearsOfService - 5), // Minimum 5 years service required
    isEligible: yearsOfService >= 5
  };
};

export const calculateCreditCardEMI = (input: CreditCardInput) => {
  const { purchaseAmount, gstRate, interestRate, tenure } = input;
  const totalAmount = purchaseAmount + (purchaseAmount * gstRate / 100);
  const emi = calculateEMI(totalAmount, interestRate, tenure);
  const totalPayment = emi * tenure;
  const totalInterest = totalPayment - totalAmount;
  
  return {
    totalAmount: Math.round(totalAmount),
    emi,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    gstAmount: Math.round(purchaseAmount * gstRate / 100)
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-IN').format(Math.round(number));
};