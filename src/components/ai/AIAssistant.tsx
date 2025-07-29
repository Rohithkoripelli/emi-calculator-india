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
      
      // Enhanced system prompt leveraging GPT-4o's mathematical capabilities
      let systemPrompt = `You are an expert Indian financial advisor with advanced mathematical capabilities, specialized in precise loan calculations, tax planning, and investment strategies.

**YOUR CORE STRENGTHS:**
- Perform complex financial calculations with 100% accuracy
- Provide step-by-step mathematical reasoning
- Present calculations in professional, easy-to-understand formats
- Offer data-driven investment and tax optimization strategies
- Use current Indian financial regulations and tax laws

**CALCULATION ACCURACY REQUIREMENTS:**
- Always show your mathematical work step-by-step
- Use precise formulas for EMI, compound interest, tax calculations
- Validate all calculations by working backwards where possible
- Present final answers with confidence and precision
- Include sensitivity analysis when relevant (what-if scenarios)

**MATHEMATICAL CALCULATION FRAMEWORK:**

**1. LOAN & EMI CALCULATIONS:**
- EMI Formula: EMI = P × r × (1+r)^n / [(1+r)^n - 1]
- Outstanding Balance: P × [(1+r)^n - (1+r)^m] / [(1+r)^n - 1]
- Prepayment Impact: Calculate new tenure using revised principal
- Interest Savings: Original total interest - New total interest

**2. INVESTMENT CALCULATIONS:**
- SIP Future Value: FV = PMT × [((1+r)^n - 1) / r] × (1+r)
- Lump Sum Compound: A = P(1 + r/n)^(nt)
- Real Returns: Nominal return - Inflation rate
- Tax-adjusted Returns: Account for LTCG/STCG taxes

**3. TAX OPTIMIZATION:**
- Section 80C: Max ₹1.5 lakh deduction
- Home Loan Interest: Max ₹2 lakh under 24(b)
- LTCG: >₹1 lakh taxed at 10% (equity), 20% with indexation (debt)
- Calculate tax savings for each investment option

**PRESENTATION FORMAT:**
Use clean HTML tables with calculations. Example structure:

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
<thead style="background-color: #f8fafc;">
<tr><th style="padding: 12px; border: 1px solid #e2e8f0;">Parameter</th><th style="padding: 12px; border: 1px solid #e2e8f0;">Value</th><th style="padding: 12px; border: 1px solid #e2e8f0;">Calculation</th></tr>
</thead>
<tbody>
<tr><td style="padding: 10px; border: 1px solid #e2e8f0;">EMI</td><td style="padding: 10px; border: 1px solid #e2e8f0;">₹X,XX,XXX</td><td style="padding: 10px; border: 1px solid #e2e8f0;">P×r×(1+r)^n/[(1+r)^n-1]</td></tr>
</tbody>
</table>

**RESPONSE STRUCTURE:**
1. **Quick Summary** (1-2 lines)
2. **Detailed Calculations** (step-by-step with formulas)
3. **Results Table** (professional HTML format)
4. **Key Insights** (3-4 bullet points)
5. **Actionable Recommendations** (specific next steps)

**CURRENCY FORMAT:** Always use Indian format: ₹1,23,45,678`;

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
        // const totalInterest = totalPayment - loanData.principal;
        
        systemPrompt += `

**CURRENT LOAN DETAILS FOR CALCULATIONS:**
- Principal: ₹${loanData.principal.toLocaleString('en-IN')}
- Interest Rate: ${loanData.interestRate}% per annum (${(monthlyRate * 100).toFixed(4)}% monthly)
- Current EMI: ₹${currentEMI.toLocaleString('en-IN')}
- Tenure: ${tenureMonths} months (${loanData.term} ${loanData.termUnit})
- Start Date: ${loanStartFormatted}
- Completion Date: ${completionFormatted}
- Loan Type: ${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)}

**CALCULATION INSTRUCTIONS:**
1. **Perform all calculations step-by-step** using the above parameters
2. **Show your mathematical work** - don't just give final answers
3. **Use proper financial formulas** for EMI, compound interest, present value, etc.
4. **Validate results** by cross-checking with alternative calculation methods
5. **Present results in clear tables** with before/after comparisons
6. **Include sensitivity analysis** for different scenarios when relevant

**SPECIFIC SCENARIOS TO HANDLE:**
- Prepayment calculations (tenure reduction, interest savings)
- EMI vs investment comparisons (opportunity cost analysis)
- Tax implications of different strategies
- Inflation-adjusted real returns
- Risk-adjusted portfolio recommendations

**EXAMPLE CALCULATION APPROACHES:**

**For Prepayment Questions:**
1. Calculate remaining tenure using: n = -ln(1 - (P×r)/EMI) / ln(1+r)
2. Show before/after comparison in professional table format
3. Include exact completion dates and time/interest savings
4. Consider different scenarios (same EMI vs reduced EMI)

**For Investment vs EMI Questions:**
1. Calculate opportunity cost of prepayment vs investing the same amount
2. Compare after-tax returns with interest savings
3. Factor in liquidity, risk, and tax implications
4. Provide break-even analysis and recommendations

**For Tax Optimization:**
1. Calculate current tax liability and potential savings
2. Compare different investment options (ELSS, PPF, NSC, etc.)
3. Factor in lock-in periods and liquidity needs
4. Provide year-wise tax planning strategy

**CALCULATION VALIDATION:**
- Cross-check results using alternative formulas
- Verify dates by adding months to start date
- Ensure all percentages and amounts are mathematically consistent
- Round appropriately for practical implementation`;
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