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
      console.log('🚀 Calling OpenAI API with:', currentInput);
      
      // Check if API key is available
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('❌ OpenAI API key not found in environment variables');
        throw new Error('OpenAI API key not configured');
      }
      
      // Enhanced system prompt for user-friendly responses with HTML tables
      let systemPrompt = `You are an expert Indian financial advisor specialized in loan planning and EMI optimization. 

🎯 **YOUR ROLE:**
- Provide personalized, user-friendly financial advice
- Present calculations in clean, professional HTML table format
- Hide complex mathematical formulas from responses
- Focus on actionable insights and recommendations

📊 **CRITICAL: USE HTML TABLES FOR ALL TABULAR DATA**

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
│ Aspect              │ Amount       │  ❌ DON'T USE THIS
└─────────────────────┴──────────────┘

**ALWAYS use HTML tables like above** ✅

🔍 **FORMATTING REQUIREMENTS:**
1. **Use HTML tables** for ALL comparisons, schedules, breakdowns
2. **Indian number format**: ₹50,00,000 (not ₹5000000)
3. **Summary cards** with emojis for key insights
4. **Bold headings** with ** syntax
5. **Professional color scheme** in table styles

📋 **Response Structure:**
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
        
        const currentDate = new Date();
        const monthlyRate = loanData.interestRate / 12 / 100;
        const tenureMonths = loanData.termUnit === 'years' ? loanData.term * 12 : loanData.term;
        
        systemPrompt += `

💼 **EXACT LOAN DETAILS (USE THESE FOR ALL CALCULATIONS):**
┌─────────────────────┬──────────────────────────┐
│ Loan Amount         │ ₹${loanData.principal.toLocaleString('en-IN')}                │
│ Interest Rate       │ ${loanData.interestRate}% per annum              │
│ Monthly Rate        │ ${(monthlyRate * 100).toFixed(4)}% per month     │
│ Current EMI         │ ₹${(loanData.emi || 0).toLocaleString('en-IN')}                │
│ Tenure              │ ${loanData.term} ${loanData.termUnit} (${tenureMonths} months) │
│ Loan Start Date     │ ${loanStartFormatted}                │
│ Current Date        │ ${currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}              │
│ Payment Frequency   │ Monthly                              │
│ Loan Type           │ ${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)} Loan                │
└─────────────────────┴──────────────────────────┘

🔢 **CRITICAL CALCULATION RULES:**

1. **For Prepayment Calculations:**
   - ALWAYS calculate month-by-month amortization from start date
   - Use exact outstanding balance at prepayment date
   - Apply prepayment to reduce principal
   - Calculate new tenure using: n = -ln(1 - (P × r)/EMI) / ln(1 + r)
   - Add months to prepayment date for completion date

2. **Date Calculation Example:**
   - If prepayment in Month 12: ${loanStartFormatted} + 12 months + remaining tenure
   - ALWAYS show: "From [prepayment month] to [completion month/year]"

3. **Validation Checks:**
   - Tenure reduction in months MUST match year/month difference
   - If reduction is 18 months, completion date should be 18 months earlier
   - VERIFY: Start date + original months vs start date + new months

4. **Required Response Format:**
   - Show month-by-month calculation breakdown
   - Display exact dates: "Loan will complete in [Month Year]"
   - Show tenure reduction: "X months earlier (Y years Z months)"

🎯 **ACCURACY REQUIREMENTS:**
- Use EXACT dates provided above
- Show step-by-step date calculations  
- Verify all month-year conversions
- Cross-check completion dates with tenure reductions

📝 **EXACT RESPONSE FORMAT FOR PREPAYMENT QUESTIONS:**

**Question:** "If I pay ₹8,00,000 prepayment and increase EMI by ₹5,000, when will loan close?"

**Required Response Structure:**
1. **Current Scenario Analysis** (in HTML table)
2. **Step-by-step Calculation:**
   - Outstanding balance at prepayment time
   - New principal after prepayment
   - New EMI amount
   - Remaining months calculation
3. **Final Answer with Exact Dates**

**HTML Table Format (MANDATORY):**
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
<thead>
<tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Scenario</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">EMI Amount</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Remaining Months</th>
<th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Completion Date</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 10px; border: 1px solid #e2e8f0;">Current</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">₹64,158</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">68 months</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">March 2030</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #e2e8f0;">After Prepayment</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">₹69,158</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">36 months</td>
<td style="padding: 10px; border: 1px solid #e2e8f0;">December 2028</td>
</tr>
</tbody>
</table>

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
        console.error('❌ OpenAI API Error response:', errorText);
        throw new Error(`OpenAI API error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const aiResponseText = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      const validation = validateResponse(aiResponseText);
      
      // Always use OpenAI response unless it's clearly an error
      const finalResponseText = aiResponseText.trim() ? aiResponseText : generateFallbackResponse(currentInput);
      
      // Log validation issues for debugging but don't reject the response
      if (!validation.isValid) {
        console.warn('⚠️ Response validation issues (but using response anyway):', validation.issues);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: finalResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      
      // Simple fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateFallbackResponse(currentInput) + '\n\n⚠️ (API temporarily unavailable)',
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