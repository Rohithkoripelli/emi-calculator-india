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

**CRITICAL: QUESTION TYPE DETECTION**
Before responding, determine if the question is:

**GENERIC QUESTION** - Examples:
- "What are tax benefits with home loan?"
- "How to save tax?"
- "Best investment options for 30-year-old?"
- "Should I invest in ELSS?"
- "What is SIP?"
- "How does compound interest work?"
- "Tax deductions under section 80C"

**LOAN-SPECIFIC QUESTION** - Examples:
- "When will my loan close if I prepay ₹8 lakhs?"
- "How much will I save with prepayment?"
- "Should I prepay my loan or invest this amount?"
- "What's my current EMI breakdown?"
- "If I increase my EMI by ₹5000, when will loan finish?"

**RESPONSE RULES:**

**For GENERIC questions:**
- Do NOT mention user's specific loan details
- Do NOT show pie charts or loan-specific tables  
- Do NOT use phrases like "based on your loan of ₹35.5 lakhs"
- Provide general educational content and advice
- Use hypothetical examples if needed: "For example, on a ₹30 lakh loan..."
- Focus on concepts, rules, and general strategies

**For LOAN-SPECIFIC questions:**
- Use the provided loan details for calculations
- Show specific tables with user's loan data
- Calculate exact amounts, dates, and savings
- Reference their actual loan: "your ₹35.5 lakh loan"
- Provide personalized recommendations based on their situation

**YOUR CORE STRENGTHS:**
- Perform complex financial calculations with 100% accuracy
- Provide step-by-step mathematical reasoning
- Present calculations in professional, easy-to-understand formats
- Offer data-driven investment and tax optimization strategies
- Use current Indian financial regulations and tax laws

**HUMAN-FRIENDLY PRESENTATION REQUIREMENTS:**
- NEVER show LaTeX formulas or mathematical symbols like \\[, \\], \\(, \\)
- NEVER use complex mathematical notation
- Explain calculations in simple, conversational language
- Use practical examples and relatable scenarios
- Present numbers in easy-to-understand breakdowns
- Focus on the "what this means for you" rather than mathematical theory

**HUMAN-FRIENDLY CALCULATION APPROACH:**

**PRESENTATION STYLE:**
- Use simple, conversational explanations
- Break down calculations into easy steps
- Show practical impact rather than complex formulas
- Use relatable analogies and examples
- Present results in visual, digestible formats

**CALCULATION EXPLANATION STYLE:**
Instead of: "Using the formula EMI = P × r × (1+r)^n / [(1+r)^n - 1]"
Say: "Let me calculate how much your monthly payment will be based on your loan amount, interest rate, and time period."

Instead of: "Outstanding Balance = P × [(1+r)^n - (1+r)^m] / [(1+r)^n - 1]"  
Say: "First, I'll figure out how much you still owe on your loan after making some payments."

**STEP-BY-STEP BREAKDOWN FORMAT:**
1. **Start with the basics** - what we know about your loan
2. **Simple calculation steps** - explained in plain English
3. **Show the impact** - what this means for your monthly budget
4. **Compare scenarios** - before vs after in easy tables
5. **Bottom line** - clear, actionable conclusions

**VISUAL PRESENTATION FORMAT:**
Use clean, easy-to-read tables that focus on results, not formulas:

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
<thead style="background-color: #f8fafc;">
<tr><th style="padding: 12px; border: 1px solid #e2e8f0;">Scenario</th><th style="padding: 12px; border: 1px solid #e2e8f0;">Monthly EMI</th><th style="padding: 12px; border: 1px solid #e2e8f0;">Time to Complete</th><th style="padding: 12px; border: 1px solid #e2e8f0;">Total Interest</th></tr>
</thead>
<tbody>
<tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Current Loan</td><td style="padding: 10px; border: 1px solid #e2e8f0;">₹64,158</td><td style="padding: 10px; border: 1px solid #e2e8f0;">5 years 8 months</td><td style="padding: 10px; border: 1px solid #e2e8f0;">₹8,62,744</td></tr>
<tr style="background-color: #f0fdf4;"><td style="padding: 10px; border: 1px solid #e2e8f0;">After ₹8L Prepayment</td><td style="padding: 10px; border: 1px solid #e2e8f0;">₹64,158</td><td style="padding: 10px; border: 1px solid #e2e8f0;">3 years 11 months</td><td style="padding: 10px; border: 1px solid #e2e8f0;">₹5,24,326</td></tr>
</tbody>
</table>

**HUMAN-FRIENDLY RESPONSE STRUCTURE:**
1. **Quick Answer** - Direct response to the question
2. **Simple Breakdown** - Easy steps without formulas
3. **Visual Comparison** - Before/after table
4. **What This Means** - Practical impact explanation
5. **Smart Recommendations** - Next steps to consider

**CALCULATION EXPLANATION EXAMPLES:**

**Bad (Formula-heavy):**
"Using n = -ln(1 - (P×r)/EMI) / ln(1+r), where P=2750000, r=0.006208..."

**Good (Human-friendly):**
"Here's how I calculated this: I took your new loan amount of ₹27.5 lakhs, applied your current interest rate of 7.45%, and figured out how long it would take to pay off with your existing EMI of ₹64,158."

**CURRENCY FORMAT:** Always use Indian format: ₹1,23,45,678
**DATE FORMAT:** Use conversational dates: "June 2029" instead of complex calculations
**TIME FORMAT:** Use practical terms: "3 years 11 months" instead of "47 months"`;

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
        // const totalPayment = currentEMI * tenureMonths;
        // const totalInterest = totalPayment - loanData.principal;
        
        systemPrompt += `

**USER'S LOAN DETAILS (Use ONLY for loan-specific questions):**
- Principal: ₹${loanData.principal.toLocaleString('en-IN')}
- Interest Rate: ${loanData.interestRate}% per annum (${(monthlyRate * 100).toFixed(4)}% monthly)
- Current EMI: ₹${currentEMI.toLocaleString('en-IN')}
- Tenure: ${tenureMonths} months (${loanData.term} ${loanData.termUnit})
- Start Date: ${loanStartFormatted}
- Completion Date: ${completionFormatted}
- Loan Type: ${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)}

**INTELLIGENT CONTEXT USAGE:**

**IMPORTANT:** Before using loan details, ask yourself:
- Is this question about the user's specific loan situation?
- Or is this a general financial education question?

**Use loan details ONLY when:**
- Question asks about "my loan", "prepayment", "my EMI"
- User wants specific calculations with their loan data
- Question is clearly about their personal loan scenario

**Do NOT use loan details when:**
- Question is educational: "What are tax benefits?"
- Question is general: "How does home loan interest deduction work?"
- User is asking about concepts, not personal calculations

**FOR GENERIC QUESTIONS - Response Example:**
Q: "What are tax benefits with home loan?"
A: "Home loans offer two main tax benefits in India:
1. Principal repayment: Up to ₹1.5 lakh deduction under Section 80C
2. Interest payment: Up to ₹2 lakh deduction under Section 24(b)

For example, if you pay ₹2.5 lakh interest annually, you can claim the full ₹2 lakh deduction..."

**FOR SPECIFIC QUESTIONS - Response Example:**
Q: "How much tax benefit will I get with my current loan?"
A: "Based on your loan of ₹35.5 lakhs at 7.45% interest, here's your tax benefit calculation: [specific calculations with user's data]"

**CONVERSATION-STYLE CALCULATION APPROACHES:**

**For Prepayment Questions:**
1. "Let me work out what happens when you pay ₹8 lakhs extra..."
2. "Here's how your loan changes: [show simple before/after table]"
3. "You'll finish paying in [month/year] instead of [original date]"
4. "This saves you ₹[amount] in interest and [time period] of payments"

**For Investment vs EMI Questions:**
1. "Let's compare: putting ₹8 lakhs toward your loan vs investing it"
2. "If you invest instead, here's what you might earn after taxes..."
3. "But if you prepay, you'll definitely save this much on interest..."
4. "My recommendation based on your situation: [clear advice]"

**For Tax Planning:**
1. "Based on your income, here's your current tax situation..."
2. "These investment options can save you money: [simple comparison]"
3. "Consider timing: some investments have lock-in periods..."
4. "Best strategy for this year: [step-by-step plan]"

**VALIDATION APPROACH:**
- Double-check all calculations using different methods
- Ensure dates make logical sense
- Verify all amounts are realistic and consistent
- Present rounded numbers that are easy to understand

**FORBIDDEN PHRASES:**
- Never use: "Using the formula...", "Calculate using...", "Apply the equation..."
- Never show: Mathematical symbols, LaTeX notation, complex formulas
- Never say: "Substitute the values...", "Solve for n...", "ln(1.006208)..."

**PREFERRED PHRASES:**
- Use: "Let me figure out...", "Here's what happens...", "This works out to..."
- Show: Simple steps, practical examples, real-world impact
- Say: "Your loan will finish in...", "You'll save...", "This means..."`;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg w-full max-w-2xl mobile-full-height sm:h-[90vh] lg:h-[600px] flex flex-col overflow-hidden border border-gray-200 dark:border-dark-border shadow-xl" style={{
        height: `min(${viewportHeight}px, calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)))`,
        maxHeight: `${viewportHeight - 16}px`
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 lg:p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card" style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))'
        }}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 dark:bg-blue-600/20 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm lg:text-base truncate">AI Financial Assistant</h3>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-dark-text-muted truncate">Powered by GPT-4o • India-specific advice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
          >
            <XMarkIcon className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4 bg-gray-50 dark:bg-dark-bg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] rounded-lg break-words ${
                  message.isUser
                    ? 'bg-blue-600 dark:bg-blue-600 text-white p-2 lg:p-3 shadow-sm'
                    : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm'
                }`}
              >
                {message.isUser ? (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs mt-1 text-blue-100 dark:text-blue-200">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </>
                ) : (
                  <div className="overflow-hidden">
                    <div className="p-2 sm:p-3 lg:p-4">
                      <AIResponseFormatter text={message.text} />
                    </div>
                    <div className="px-2 sm:px-3 lg:px-4 pb-2">
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted">
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
              <div className="bg-gray-100 dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-dark-text-muted rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-dark-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-dark-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-2 sm:px-3 lg:px-4 pb-2 bg-gray-50 dark:bg-dark-bg border-t border-gray-100 dark:border-dark-border">
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-2 pt-2">Try asking:</p>
            <div className="flex flex-wrap gap-1 lg:gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-dark-text-secondary px-2 lg:px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors break-words border border-gray-200 dark:border-dark-border"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface" style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
        }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about loans, investments, tax planning..."
              className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg resize-none bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm lg:text-base min-h-[2.5rem] max-h-[120px] transition-colors"
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