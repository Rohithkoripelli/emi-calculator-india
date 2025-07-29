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
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle viewport changes for mobile keyboards
  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight;
      setViewportHeight(newHeight);
      
      // Detect keyboard appearance on mobile
      const heightDiff = window.screen.height - newHeight;
      if (heightDiff > 150) { // Keyboard likely visible
        setTimeout(() => {
          if (textareaRef.current && document.activeElement === textareaRef.current) {
            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setViewportHeight(window.innerHeight);
      }
    };

    // Use both resize and orientationchange for better mobile support
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };


  // Simple fallback for when OpenAI API fails
  const generateFallbackResponse = (userMessage: string): string => {
    return `I'm your AI financial assistant powered by GPT-4o. I can help you with:

• Loan analysis and prepayment strategies
• EMI calculations and optimization
• Investment planning and SIP advice  
• Tax-saving strategies
• Financial planning questions

${loanData ? `I have access to your current loan details:
• Loan Amount: ${formatCurrency(loanData.principal)}
• EMI: ${formatCurrency(loanData.emi || 0)}
• Interest Rate: ${loanData.interestRate}% p.a.
• Tenure: ${loanData.term} ${loanData.termUnit}

Ask me anything about your loan or financial planning!` : 'Please ask me any financial question!'}`;
  };

  // Simplified validation for API responses
  const validateResponse = (responseText: string): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Only check for obvious API errors
    if (responseText.trim().length < 20) {
      issues.push('Response too short');
    }
    
    if (responseText.includes('I cannot') || responseText.includes('I don\'t have access') || responseText.includes('I\'m not able')) {
      issues.push('API limitation response');
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
    
    try {
      console.log('Calling OpenAI API with:', currentInput);
      
      // Check if API key is available
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('ERROR: OpenAI API key not found in environment variables');
        throw new Error('OpenAI API key not configured');
      }
      
      // Enhanced system prompt for user-friendly responses with HTML tables
      let systemPrompt = `You are an expert Indian financial advisor specialized in loan planning and EMI optimization. 

**YOUR ROLE:**
- Provide personalized, user-friendly financial advice
- Present calculations in clean, professional HTML table format
- Hide complex mathematical formulas from responses
- Focus on actionable insights and recommendations

**CRITICAL: USE HTML TABLES FOR ALL TABULAR DATA**

When presenting any tabular information, ALWAYS use this HTML table format:

<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: Arial, sans-serif;">
<thead>
<tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
<th style="padding: 12px; text-align: left; font-weight: 600; color: #1e293b; border: 1px solid #e2e8f0;">Column 1</th>
<th style="padding: 12px; text-align: left; font-weight: 600; color: #1e293b; border: 1px solid #e2e8f0;">Column 2</th>
</tr>
</thead>
<tbody>
<tr style="border-bottom: 1px solid #e2e8f0;">
<td style="padding: 10px; border: 1px solid #e2e8f0; color: #334155;">Data 1</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; color: #334155; font-weight: 500;">Data 2</td>
</tr>
</tbody>
</table>

**NEVER use ASCII tables like:**
┌─────────────────────┬──────────────┐
| Aspect              | Amount       |  DON'T USE THIS
└─────────────────────┴──────────────┘

**ALWAYS use HTML tables like above**

**FORMATTING REQUIREMENTS:**
1. **Use HTML tables** for ALL comparisons, schedules, breakdowns
2. **Indian number format**: ₹50,00,000 (not ₹5000000)
3. **Summary cards** with emojis for key insights
4. **Bold headings** with ** syntax
5. **Professional color scheme** in table styles

**Response Structure:**
1. Brief introduction
2. HTML table with key data
3. Key insights with emojis
4. Actionable next steps`;

      // Add loan context if available
      if (loanData) {
        const loanStartDate = loanData.startDate ? new Date(loanData.startDate) : new Date();
        const loanStartFormatted = loanStartDate.toLocaleDateString('en-IN', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        // const currentDate = new Date();
        const monthlyRate = loanData.interestRate / 12 / 100;
        const tenureMonths = loanData.termUnit === 'years' ? loanData.term * 12 : loanData.term;
        
        // Calculate exact completion date
        const completionDate = new Date(loanStartDate);
        completionDate.setMonth(completionDate.getMonth() + tenureMonths);
        const completionFormatted = completionDate.toLocaleDateString('en-IN', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        // Pre-calculate common scenarios to prevent AI errors
        const currentEMI = loanData.emi || 0;
        const totalPayment = currentEMI * tenureMonths;
        const totalInterest = totalPayment - loanData.principal;
        
        systemPrompt += `

**EXACT LOAN DETAILS (COPY THESE NUMBERS EXACTLY - DO NOT RECALCULATE):**

<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: Arial, sans-serif;">
<tbody>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Amount</td><td style="padding: 8px; border: 1px solid #ddd;">₹${loanData.principal.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Interest Rate</td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.interestRate}% per annum</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Monthly Rate</td><td style="padding: 8px; border: 1px solid #ddd;">${(monthlyRate * 100).toFixed(4)}% per month</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Current EMI</td><td style="padding: 8px; border: 1px solid #ddd;">₹${currentEMI.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Original Tenure</td><td style="padding: 8px; border: 1px solid #ddd;">${tenureMonths} months (${loanData.term} ${loanData.termUnit})</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Start Date</td><td style="padding: 8px; border: 1px solid #ddd;">${loanStartFormatted}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Original Completion</td><td style="padding: 8px; border: 1px solid #ddd;">${completionFormatted}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Payment</td><td style="padding: 8px; border: 1px solid #ddd;">₹${totalPayment.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Interest</td><td style="padding: 8px; border: 1px solid #ddd;">₹${totalInterest.toLocaleString('en-IN')}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Loan Type</td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)} Loan</td></tr>
</tbody>
</table>

**CRITICAL: USE EXACT VALUES ABOVE - DO NOT CALCULATE OR MODIFY THESE NUMBERS!**

**CRITICAL CALCULATION RULES:**

**VALIDATION CHECKLIST (VERIFY BEFORE RESPONDING):**

**Before sending any response, CHECK:**
1. Interest rate shown = ${loanData.interestRate}% (exactly)
2. Original tenure shown = ${tenureMonths} months (exactly)  
3. Completion date calculation = ${loanStartFormatted} + ${tenureMonths} months = ${completionFormatted}
4. All currency amounts use Indian comma format: ₹X,XX,XXX
5. Month calculations: 12 months = 1 year, 24 months = 2 years

**COMMON MISTAKES TO AVOID:**
- Do NOT show ${loanData.interestRate}% as any other number
- Do NOT show ${tenureMonths} months as ${tenureMonths - 20} or any other number
- Do NOT calculate ${completionFormatted} as anything else
- Do NOT show raw mathematical formulas to user

**STEP-BY-STEP PREPAYMENT CALCULATION:**

**CRITICAL: For immediate prepayment (current month), use these formulas:**

1. **Current Outstanding Balance = ₹${loanData.principal.toLocaleString('en-IN')} (use this exact amount)**

2. **After Prepayment Formula:**
   - New Principal = ₹${loanData.principal.toLocaleString('en-IN')} - Prepayment Amount
   - For ₹8,00,000 prepayment: New Principal = ₹${(loanData.principal - 800000).toLocaleString('en-IN')}

3. **New Tenure Calculation (Same EMI):**
   - Use EMI formula: EMI = P × r × (1+r)^n / [(1+r)^n - 1]
   - Where P = New Principal, r = ${(monthlyRate * 100).toFixed(4)}% monthly, EMI = ₹${currentEMI.toLocaleString('en-IN')}
   - Solve for n (months): n = log(1 + (P×r/EMI)) / log(1+r)
   
4. **Pre-calculated for ₹8,00,000 prepayment:**
   - New Principal: ₹${(loanData.principal - 800000).toLocaleString('en-IN')}
   - Monthly Rate: ${(monthlyRate * 100).toFixed(4)}%
   - Same EMI: ₹${currentEMI.toLocaleString('en-IN')}
   - New Tenure: ${Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months
   - Original: ${tenureMonths} months → New: ${Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months (Reduction: ${tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months)

5. **New Completion Date:**
   - Start: ${loanStartFormatted}
   - New Duration: ${Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months
   - New Completion: ${new Date(new Date(loanStartDate).setMonth(new Date(loanStartDate).getMonth() + Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate)))).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
   - Time Saved: ${Math.floor((tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) / 12)} years ${(tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) % 12} months

**ACCURACY REQUIREMENTS:**
- Use EXACT dates provided above
- Show step-by-step date calculations  
- Verify all month-year conversions
- Cross-check completion dates with tenure reductions

**EXACT RESPONSE FORMAT FOR PREPAYMENT QUESTIONS:**

**Question:** "If I pay ₹8,00,000 prepayment and increase EMI by ₹5,000, when will loan close?"

**Required Response Structure:**
1. **Current Scenario Analysis** (in HTML table)
2. **Step-by-step Calculation:**
   - Outstanding balance at prepayment time
   - New principal after prepayment
   - New EMI amount
   - Remaining months calculation
3. **Final Answer with Exact Dates**

**HTML Table Format (MANDATORY - COPY THESE EXACT CALCULATED VALUES):**

**For ₹8,00,000 prepayment with same EMI:**
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
<thead>
<tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Scenario</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Principal</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">EMI Amount</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Tenure</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Completion Date</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 10px; border: 1px solid #e2e8f0;">Current Scenario</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">₹${loanData.principal.toLocaleString('en-IN')}</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">₹${currentEMI.toLocaleString('en-IN')}</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">${tenureMonths} months</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">${completionFormatted}</td>
</tr>
<tr style="background-color: #f0fdf4;">
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">After ₹8,00,000 Prepayment</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">₹${(loanData.principal - 800000).toLocaleString('en-IN')}</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">₹${currentEMI.toLocaleString('en-IN')}</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${new Date(new Date(loanStartDate).setMonth(new Date(loanStartDate).getMonth() + Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate)))).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</td>
</tr>
<tr style="background-color: #fef3c7;">
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e;">Savings</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e;">₹8,00,000 less</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e;">Same</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e;">${tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))} months saved</td>
<td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e;">${Math.floor((tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) / 12)} years ${(tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) % 12} months earlier</td>
</tr>
</tbody>
</table>

**FINAL ANSWER FORMAT:**
"Your loan will close in ${new Date(new Date(loanStartDate).setMonth(new Date(loanStartDate).getMonth() + Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate)))).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} after the ₹8,00,000 prepayment, which is ${Math.floor((tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) / 12)} years ${(tenureMonths - Math.ceil(-Math.log(1 - ((loanData.principal - 800000) * monthlyRate) / currentEMI) / Math.log(1 + monthlyRate))) % 12} months earlier than the original completion date."

**DOUBLE-CHECK THESE EXACT VALUES:**
- Current EMI: ₹${currentEMI.toLocaleString('en-IN')} (not ₹64,158 or any other number)
- Original tenure: ${tenureMonths} months (not 48 months or any other number)  
- Interest rate: ${loanData.interestRate}% p.a. (not any other percentage)
- Completion date: ${completionFormatted} (not any other month/year)

Remember: EVERY calculation must be deterministic and repeatable with same inputs!`;
      }

      // Direct OpenAI API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
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
          max_tokens: 2000,
          temperature: 0.0,  // Maximum consistency
          seed: 42,          // Deterministic responses
        }),
      });

      console.log('📥 OpenAI API Response status:', response.status);
      console.log('📥 OpenAI API Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error response:', errorText);
        throw new Error(`OpenAI API error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const aiResponseText = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      const validation = validateResponse(aiResponseText);
      
      // Always use OpenAI response unless it's clearly an error
      const finalResponseText = aiResponseText.trim() ? aiResponseText : generateFallbackResponse(currentInput);
      
      // Log validation issues for debugging but don't reject the response
      if (!validation.isValid) {
        console.warn('Response validation issues (but using response anyway):', validation.issues);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: finalResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Simple fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateFallbackResponse(currentInput) + '\n\n(API temporarily unavailable)',
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
      <div className="bg-white rounded-lg w-full max-w-2xl mobile-full-height sm:h-[90vh] lg:h-[600px] flex flex-col overflow-hidden" style={{
        height: `min(${viewportHeight}px, calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)))`,
        maxHeight: `${viewportHeight - 16}px`
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200" style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))'
        }}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">AI Financial Assistant</h3>
              <p className="text-xs lg:text-sm text-gray-500 truncate">Powered by GPT-4o • India-specific advice</p>
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
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200" style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
        }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about loans, investments, tax planning..."
              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base min-h-[2.5rem] max-h-[120px]"
              rows={2}
              disabled={isLoading}
              style={{
                minHeight: '40px',
                maxHeight: '120px'
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-2 sm:px-3 lg:px-3 h-[40px] min-w-[40px] flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};