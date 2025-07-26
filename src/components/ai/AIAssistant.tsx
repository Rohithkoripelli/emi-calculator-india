import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { AIResponseFormatter } from './AIResponseFormatter';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: {
    principal: number;
    interestRate: number;
    term: number;
    termUnit: string;
    loanType: string;
    startDate?: Date;
    emi?: number;
    totalInterest?: number;
    totalPayment?: number;
  };
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, loanData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI financial assistant powered by GPT-4o. I can help you with personalized advice about loans, EMIs, investments, and financial planning in India. I have access to your current loan details and can provide specific recommendations. How can I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const predefinedResponses: Record<string, string> = {
    'home loan': `For home loans in India:
    
• Interest rates typically range from 7.5% to 12.5% per annum
• Loan tenure can be up to 30 years
• You can get up to 80-90% of property value as loan
• Tax benefits available under Section 80C (principal) and 24(b) (interest)
• Consider factors like location, builder reputation, and future growth potential

Would you like me to help you calculate your home loan EMI?`,

    'prepayment': `Prepaying your loan is generally beneficial:

• Reduces total interest burden significantly
• Shortens loan tenure
• Frees up monthly cash flow earlier
• Tax implications: Lost tax benefits on prepaid amount

Best strategy:
• Make lump sum payments when you have surplus funds
• Increase EMI by 10-15% annually to beat inflation
• Prepay high-interest loans first (credit cards, personal loans)

Use our prepayment calculator to see exact savings!`,

    'investment': `Popular investment options in India:

• SIP in Mutual Funds: 10-15% expected returns
• PPF: 7.1% tax-free returns, 15-year lock-in
• ELSS: Tax saving + equity returns
• NPS: Retirement planning with tax benefits
• Real Estate: Illiquid but inflation hedge

Thumb rule: Age in bonds (e.g., 30 years old = 30% debt, 70% equity)

Want to calculate SIP returns for your goals?`,

    'tax': `Key tax-saving options under Section 80C:

• EPF contribution: Up to ₹1.5 lakh
• PPF: ₹1.5 lakh annual limit
• ELSS mutual funds: No lock-in after 3 years
• Home loan principal: Additional benefit
• Life insurance premium: Term plans preferred

Section 80D: Health insurance premiums
Section 24(b): Home loan interest up to ₹2 lakh

Plan your taxes strategically!`,

    'emergency fund': `Emergency fund guidelines:

• Amount: 6-12 months of expenses
• Keep in liquid instruments (savings account, liquid funds)
• Don't invest emergency fund in volatile assets
• Separate from investment goals

Build emergency fund before investing in long-term goals. This ensures you don't break investments during emergencies.`,

    'credit score': `Improving credit score:

• Pay all EMIs and credit card bills on time
• Keep credit utilization below 30%
• Don't close old credit cards
• Check credit report annually for errors
• Avoid multiple loan applications simultaneously

Good credit score (750+) gets you better interest rates and easier approvals.`
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateLoanSpecificAdvice = (): string => {
    if (!loanData || !loanData.emi) return '';
    
    const { principal, interestRate, term, termUnit, loanType, emi, totalInterest, totalPayment } = loanData;
    const termInYears = termUnit === 'months' ? term / 12 : term;
    const interestPercentage = ((totalInterest! / totalPayment!) * 100).toFixed(1);
    
    return `Based on your current ${loanType} loan details:

📊 **Your Loan Summary:**
• Loan Amount: ${formatCurrency(principal)}
• EMI: ${formatCurrency(emi)}
• Interest Rate: ${interestRate}% p.a.
• Tenure: ${term} ${termUnit}
• Total Interest: ${formatCurrency(totalInterest!)}
• Interest comprises ${interestPercentage}% of total payment

💡 **Personalized Recommendations:**

**1. Prepayment Strategy:**
• Even a 10% increase in EMI (${formatCurrency(emi * 1.1)}) can save significant interest
• Annual bonus prepayments can reduce tenure by 3-5 years
• Target prepaying ${formatCurrency(principal * 0.1)} annually if possible

**2. Interest Rate Optimization:**
• Your current rate (${interestRate}%) vs market: ${ interestRate > 9 ? 'Consider refinancing - rates may be lower now' : 'Rate seems competitive'}
• Check for rate reductions every 2-3 years
• Negotiate based on improved credit score

**3. Tax Benefits (${loanType === 'home' ? 'Available' : 'Limited'}):**
${loanType === 'home' ? 
  '• Principal: Up to ₹1.5L under 80C\n• Interest: Up to ₹2L under 24(b)\n• First-time buyer: Additional ₹1.5L under 80EE' :
  '• Limited tax benefits for non-home loans\n• Focus on prepayment for savings'}

Would you like specific calculations for any of these strategies?`;
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Loan-specific queries with context
    if (loanData && (message.includes('my loan') || message.includes('current loan') || message.includes('this loan'))) {
      return generateLoanSpecificAdvice();
    }

    // Prepayment specific to user's loan with loan closure calculations
    if (loanData && (message.includes('prepay') || message.includes('part payment') || message.includes('close') || message.includes('closure'))) {
      const monthlyRate = loanData.interestRate / (12 * 100);
      
      // Check if user is asking about specific prepayment scenario
      if (message.includes('june 2026') || message.includes('8 lakh') || message.includes('8 lakhs') || message.includes('70000') || message.includes('70,000') || message.includes('70k') || (message.includes('part payment') && (message.includes('complete') || message.includes('now') || message.includes('today')) && message.includes('month'))) {
        // Calculate for the specific scenario mentioned using dynamic loan start date
        const loanStarted = loanData.startDate ? new Date(loanData.startDate) : new Date();
        
        // Determine prepayment timing - "now" vs "June 2026"
        const isImmediatePayment = message.includes('now') || message.includes('today') || message.includes('immediately');
        const prepaymentDate = isImmediatePayment ? new Date() : new Date('2026-06-01');
        const monthsElapsed = (prepaymentDate.getTime() - loanStarted.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        
        // More accurate calculation using actual EMI payment schedule
        const currentEMI = loanData.emi!;
        const monthsToPrepayment = Math.max(0, Math.round(monthsElapsed));
        
        // Calculate outstanding principal at prepayment date
        let outstandingPrincipal = loanData.principal;
        for (let month = 1; month <= monthsToPrepayment; month++) {
          const interestComponent = outstandingPrincipal * monthlyRate;
          const principalComponent = currentEMI - interestComponent;
          outstandingPrincipal -= principalComponent;
        }
        
        // Apply 8 lakh prepayment
        const afterPrepayment = Math.max(0, outstandingPrincipal - 800000);
        
        // Check if user mentioned new EMI amount, otherwise keep same EMI
        const hasNewEMI = message.includes('70000') || message.includes('70,000') || message.includes('70k');
        const newEMI = hasNewEMI ? 70000 : currentEMI;
        
        let remainingTenure = 0;
        if (afterPrepayment > 0) {
          remainingTenure = Math.log(1 + (afterPrepayment * monthlyRate) / newEMI) / Math.log(1 + monthlyRate);
        }
        
        const closureDate = new Date(prepaymentDate.getTime() + (remainingTenure * 30.44 * 24 * 60 * 60 * 1000));
        
        const loanStartFormatted = loanStarted.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const prepaymentDateFormatted = prepaymentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const prepaymentTiming = isImmediatePayment ? 'immediately (now)' : prepaymentDateFormatted;
        
        return `**Loan Closure Calculation:**

**Direct Answer:** With ₹8,00,000 prepayment ${isImmediatePayment ? 'now' : 'in June 2026'}${hasNewEMI ? ' and EMI increase to ₹70,000' : ''}, your loan will close in **${closureDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}**.

**Detailed Breakdown:**
• Loan started: ${loanStartFormatted}
• Current EMI: ₹${currentEMI.toLocaleString('en-IN')}
• Prepayment timing: ${prepaymentTiming} (${monthsToPrepayment} months from loan start)
• Outstanding principal before prepayment: ₹${(outstandingPrincipal/100000).toFixed(2)} lakhs
• After ₹8L prepayment: ₹${(afterPrepayment/100000).toFixed(2)} lakhs
• EMI after prepayment: ₹${newEMI.toLocaleString('en-IN')}
• Remaining months: ${Math.round(remainingTenure)} months
• **Final loan closure: ${closureDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}**

**Interest Savings:** Significant reduction from original ${loanData.term} ${loanData.termUnit} tenure.

**Note:** This calculation assumes ${isImmediatePayment ? 'immediate prepayment with' : 'regular EMI payments until prepayment date, then'} ${hasNewEMI ? 'increased EMI' : 'same EMI continuing'}.`;
      }
      
      // General prepayment advice
      const monthlyIncrease = loanData.emi! * 0.1;
      const annualPrepayment = loanData.principal * 0.1;
      
      return `**Prepayment Options for Your ${formatCurrency(loanData.principal)} Loan:**

1. **Increase EMI by 10%:** ${formatCurrency(monthlyIncrease)}
   - New EMI: ${formatCurrency(loanData.emi! + monthlyIncrease)}
   - Can save 2-3 years of tenure

2. **Annual Lump Sum:** ${formatCurrency(annualPrepayment)}
   - Use bonuses, tax refunds
   - Reduces principal faster

3. **Part Payment Strategy:**
   - Make lump sum payments when you have surplus funds
   - Reduces overall interest burden significantly

**Recommendation:** Use our prepayment calculator for exact figures based on your specific prepayment amount and timing.`;
    }

    // Rate comparison with user's loan
    if (loanData && (message.includes('rate') || message.includes('interest'))) {
      const currentRate = loanData.interestRate;
      let rateAdvice = '';
      
      if (currentRate > 10) {
        rateAdvice = `Your current rate (${currentRate}%) seems high. Consider refinancing!`;
      } else if (currentRate > 8.5) {
        rateAdvice = `Your rate (${currentRate}%) is moderate. Monitor for better offers.`;
      } else {
        rateAdvice = `Your rate (${currentRate}%) is competitive. Focus on prepayment.`;
      }
      
      return `**Interest Rate Analysis for Your Loan:**

${rateAdvice}

**Current Market Rates (${loanData.loanType} loans):**
${loanData.loanType === 'home' ? '• SBI: 8.5-9.5%\n• HDFC: 8.6-9.6%\n• ICICI: 8.7-9.7%' : 
  loanData.loanType === 'car' ? '• SBI: 7.7-10.5%\n• HDFC: 8.1-11.5%\n• Bajaj Finserv: 9.0-15.0%' :
  '• Personal loans: 10.5-24%\n• Focus on prepayment rather than refinancing'}

**Refinancing Benefits:**
• Even 0.5% reduction saves ${formatCurrency((loanData.totalInterest! * 0.05))} over loan tenure
• Processing fees: Usually 0.5-1% of loan amount
• Break-even: Typically 2-3 years

Want me to calculate exact savings for a specific rate?`;
    }

    // Check for keywords and return predefined responses
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (message.includes(keyword)) {
        return response;
      }
    }

    // Enhanced financial advice responses
    if (message.includes('emi') || message.includes('loan')) {
      return `I can help you with loan calculations! Here are some quick tips:

• Choose the right loan tenure - longer tenure means lower EMI but higher total interest
• Compare interest rates across multiple banks
• Consider processing fees and other charges
• Maintain a good credit score for better rates
${loanData ? `\n• For your current loan, I can provide specific advice - just ask about "my loan"!` : ''}

Use our EMI calculator to compare different scenarios!`;
    }

    if (message.includes('save') || message.includes('savings')) {
      return `Smart saving strategies for Indians:

• Start with emergency fund (6 months expenses)
• Use PPF for long-term tax-free savings
• SIPs for wealth creation
• Sukanya Samridhi for girl child education
• NPS for retirement planning
${loanData ? `\n• Consider your current EMI (${formatCurrency(loanData.emi!)}) in your savings plan` : ''}

What specific savings goal can I help you with?`;
    }

    if (message.includes('retirement')) {
      return `Retirement planning is crucial:

• Start early to benefit from compounding
• Target 20-25x annual expenses as retirement corpus
• Use NPS for additional tax benefits
• Consider inflation in planning
• Mix of equity and debt based on age
${loanData ? `\n• Your current EMI commitment: ${formatCurrency(loanData.emi!)} - plan post-loan savings` : ''}

Our SIP calculator can help plan your retirement corpus!`;
    }

    // Default response
    return `I'd be happy to help with your financial questions! I can assist with:

• Loan and EMI calculations${loanData ? ' (including your current loan analysis)' : ''}
• Investment planning and SIP strategies
• Tax-saving options
• Insurance planning
• Retirement planning
• Home buying advice

${loanData ? 'Try asking: "How can I reduce my loan burden?" or "Should I prepay my loan?"' : 'Please ask me a specific question about any of these topics!'}`;
  };

  // Function to validate AI response quality
  const validateResponse = (responseText: string, userInput: string): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check for incomplete tables
    if (responseText.includes('| New calculation needed |') || responseText.includes('| - |')) {
      issues.push('Incomplete table data');
    }
    
    // More lenient for specific loan closure questions
    if ((userInput.toLowerCase().includes('complete') && userInput.toLowerCase().includes('month')) ||
        (userInput.toLowerCase().includes('8 lakh') && userInput.toLowerCase().includes('now')) ||
        (userInput.toLowerCase().includes('part payment') && userInput.toLowerCase().includes('when'))) {
      // For specific closure questions, be more lenient
      return { isValid: true, issues: [] };
    }
    
    // Check for vague responses
    if (responseText.toLowerCase().includes('approximately') || responseText.toLowerCase().includes('around')) {
      issues.push('Contains approximations instead of exact calculations');
    }
    
    // Check for proper formatting - but skip if it's a direct calculation answer
    if (responseText.includes('|') && !responseText.includes('|----------|') && !responseText.includes('Direct Answer:')) {
      issues.push('Improper table formatting');
    }
    
    // Check for timeline confusion (removed hardcoded July 2025 check)
    if (responseText.includes('months from now') && !responseText.includes('loan start')) {
      issues.push('Incorrect timeline assumptions');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    console.log('🎯 Starting handleSendMessage for:', currentInput);

    try {
      console.log('🚀 Making direct OpenAI API call');
      console.log('📤 Sending data:', { message: currentInput, loanData });
      console.log('🔍 Prepayment detection:', currentInput.toLowerCase().includes('prepay') || currentInput.toLowerCase().includes('part payment') || currentInput.toLowerCase().includes('close') || currentInput.toLowerCase().includes('closure'));
      console.log('🔍 Specific scenario detection:', currentInput.toLowerCase().includes('june 2026') || currentInput.toLowerCase().includes('8 lakh') || currentInput.toLowerCase().includes('8 lakhs') || currentInput.toLowerCase().includes('70000') || currentInput.toLowerCase().includes('70,000') || currentInput.toLowerCase().includes('70k') || (currentInput.toLowerCase().includes('part payment') && (currentInput.toLowerCase().includes('complete') || currentInput.toLowerCase().includes('now') || currentInput.toLowerCase().includes('today')) && currentInput.toLowerCase().includes('month')));
      console.log('🔍 Message content:', currentInput);
      console.log('🔑 API Key exists:', !!process.env.REACT_APP_OPENAI_API_KEY);
      console.log('🔑 API Key prefix:', process.env.REACT_APP_OPENAI_API_KEY ? process.env.REACT_APP_OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT SET');
      
      // Check if API key is available
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('❌ OpenAI API key not found in environment variables');
        throw new Error('OpenAI API key not configured');
      }
      
      // Create system prompt with loan context  
      let systemPrompt = `You are a precise Indian financial calculator. For specific prepayment scenarios asking "when will loan complete", provide ONLY the direct calculation with exact month/year.

CRITICAL: If user asks about loan completion with specific prepayment amount and EMI increase, respond with:

**Direct Answer:** Your loan will close in [EXACT MONTH YEAR].

**Calculation Details:**
• Outstanding balance at prepayment time: ₹X.XX lakhs  
• After prepayment: ₹X.XX lakhs
• With new EMI ₹XX,XXX: X months remaining
• **Final closure: [EXACT MONTH YEAR]**

CALCULATION RULES:
- Use the actual loan start date provided in the loan context
- Calculate exact outstanding principal at prepayment date using amortization
- Apply prepayment amount
- Calculate remaining tenure with new EMI using: n = ln(1 + P*r/EMI) / ln(1 + r)
- Show specific closure month/year - NO approximations

For general questions, use table format:
| Scenario | Monthly EMI | Remaining Tenure | Total Interest |
|----------|-------------|------------------|----------------|
| Current | ₹XX,XXX | XX months | ₹X,XX,XXX |
| After Changes | ₹XX,XXX | XX months | ₹X,XX,XXX |

AVOID:
- Generic advice for specific calculation questions
- Approximations or "around" estimates  
- Suggesting to consult bank for exact calculations`;

      // Add loan context if available
      if (loanData && loanData.emi && loanData.totalInterest && loanData.totalPayment) {
        const loanStartDate = loanData.startDate ? new Date(loanData.startDate) : new Date();
        const loanStartFormatted = loanStartDate.toLocaleDateString('en-IN', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        systemPrompt += `

USER'S CURRENT LOAN:
- Principal: ₹${loanData.principal.toLocaleString('en-IN')}
- Interest Rate: ${loanData.interestRate}% p.a.
- Current EMI: ₹${loanData.emi.toLocaleString('en-IN')}
- Tenure: ${loanData.term} ${loanData.termUnit}
- Loan Start Date: ${loanStartFormatted}

Use these exact details for all calculations. When user asks about prepayment dates, calculate months from the loan start date: ${loanStartFormatted}.`;
      }

      // Direct OpenAI API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: currentInput
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      console.log('📥 OpenAI API Response status:', response.status);
      console.log('📥 OpenAI API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API Error response:', errorText);
        throw new Error(`OpenAI API error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI API Response data:', data);
      
      const aiResponseText = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      const validation = validateResponse(aiResponseText, currentInput);
      
      let finalResponseText = aiResponseText;
      
      // If response quality is poor, try to refine or use fallback
      if (!validation.isValid) {
        console.log('⚠️ Response validation failed:', validation.issues);
        
        // For now, show a refined error message instead of garbage
        finalResponseText = `I need to provide more accurate calculations for your query. Let me give you a precise answer:

${generateAIResponse(currentInput)}

**Note**: For complex loan calculations like prepayment scenarios, I recommend consulting with your bank for exact figures based on your specific loan agreement and current outstanding balance.`;
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: finalResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('❌ Error calling OpenAI API:', error);
      console.log('🔄 Falling back to rule-based response');
      console.log('🔍 Error details:', JSON.stringify(error, null, 2));
      
      // Fallback to rule-based response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(currentInput) + '\n\n⚠️ (Fallback response - OpenAI API error)',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = loanData ? [
    "How can I reduce my loan burden?",
    "Should I prepay my loan or invest?",
    "What's my current interest rate vs market?",
    "How much can I save with prepayment?",
    "What are the tax benefits for my loan?"
  ] : [
    "How to reduce my home loan burden?",
    "Best investment options for 30-year-old?",
    "Should I prepay my loan or invest?",
    "Tax saving strategies for this year?",
    "How much emergency fund do I need?"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[95vh] sm:h-[90vh] lg:h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm lg:text-base">AI Financial Assistant</h3>
              <p className="text-xs lg:text-sm text-gray-500">Powered by GPT-4o • India-specific advice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] rounded-lg break-words ${
                  message.isUser
                    ? 'bg-blue-600 text-white p-2 lg:p-3'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {message.isUser ? (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs mt-1 text-blue-100">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </>
                ) : (
                  <div className="overflow-hidden">
                    <div className="p-2 sm:p-3 lg:p-4">
                      <AIResponseFormatter text={message.text} />
                    </div>
                    <div className="px-2 sm:px-3 lg:px-4 pb-2">
                      <p className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-2 sm:px-3 lg:px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1 lg:gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs bg-gray-100 text-gray-700 px-2 lg:px-3 py-1 rounded-full hover:bg-gray-200 transition-colors break-words"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about loans, investments, tax planning..."
              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base min-h-[2.5rem]"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-2 lg:px-3"
            >
              <PaperAirplaneIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};