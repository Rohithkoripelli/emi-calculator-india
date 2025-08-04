export type LoanType = 'home' | 'car' | 'personal';
export type TermUnit = 'years' | 'months';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export interface EMICalculation {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
}

export interface EMIInput {
  principal: number;
  interestRate: number;
  term: number;
  termUnit: TermUnit;
  loanType: LoanType;
  startDate: Date;
  paymentFrequency: PaymentFrequency;
  prepayments?: Prepayment[];
}

export interface Prepayment {
  month: number;
  amount: number;
  type: 'lumpsum' | 'monthly-increase';
}

export interface PaymentScheduleItem {
  month: number;
  date: Date;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  year: number;
}

export interface SukanyaInput {
  depositAmount: number;
  currentAge: number;
  termInYears: number;
  interestRate: number;
}

export interface SIPInput {
  monthlyInvestment: number;
  expectedReturn: number;
  investmentPeriod: number;
  stepUpPercentage?: number;
}

export interface GratuityInput {
  monthlySalary: number;
  yearsOfService: number;
  lastDrawnSalary: number;
}

export interface CreditCardInput {
  purchaseAmount: number;
  gstRate: number;
  interestRate: number;
  tenure: number;
}

export interface ChartData {
  name: string;
  principal: number;
  interest: number;
  year: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface CalculatorState {
  activeCalculator: 'emi' | 'sukanya' | 'sip' | 'gratuity' | 'credit-card';
  inputs: {
    emi: EMIInput;
    sukanya: SukanyaInput;
    sip: SIPInput;
    gratuity: GratuityInput;
    creditCard: CreditCardInput;
  };
}

export interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}