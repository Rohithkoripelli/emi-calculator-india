import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { AIResponseFormatter } from './AIResponseFormatter';
import { StockRecommendationCard } from './StockRecommendationCard';
import { StockInsightsPanel } from './StockInsightsPanel';
import { StockAnalysisApiService, StockAnalysisResult } from '../../services/stockAnalysisApi';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  stockAnalysis?: StockAnalysisResult;
  isStreaming?: boolean;
  isComplete?: boolean;
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
      text: "Hello! I'm your AI financial assistant. I can help you with personalized advice about loans, EMIs, investments, and financial planning in India. I also provide comprehensive stock market analysis with real-time data and buy/sell recommendations for Indian stocks. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
      isComplete: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Cleanup function to abort streaming when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreamingMessageId(null);
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };


  // Simple fallback for when OpenAI API fails
  const generateFallbackResponse = (userMessage: string): string => {
    return `I'm your AI financial assistant. I can help you with:

• Loan analysis and prepayment strategies
• EMI calculations and optimization
• Investment planning and SIP advice  
• Tax-saving strategies
• Financial planning questions
• **NEW:** Stock market analysis with buy/sell recommendations
• **NEW:** Real-time Indian stock data and insights

${loanData ? `I have access to your current loan details:
• Loan Amount: ${formatCurrency(loanData.principal)}
• EMI: ${formatCurrency(loanData.emi || 0)}
• Interest Rate: ${loanData.interestRate}% p.a.
• Tenure: ${loanData.term} ${loanData.termUnit}

Ask me anything about your loan, financial planning, or stock analysis!` : 'Please ask me any financial or stock market question!'}`;
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

  // Function to handle streaming OpenAI responses
  const handleStreamingResponse = async (
    messages: any[], 
    aiMessageId: string,
    stockAnalysis?: StockAnalysisResult
  ) => {
    try {
      // Abort any existing streaming request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setStreamingMessageId(aiMessageId);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.0,
          seed: 42,
          stream: true, // Enable streaming
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Mark streaming as complete
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, isStreaming: false, isComplete: true, stockAnalysis }
                    : msg
                ));
                setStreamingMessageId(null);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  accumulatedText += content;
                  
                  // Update the streaming message
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, text: accumulatedText, isStreaming: true, isComplete: false }
                      : msg
                  ));
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error: any) {
      console.error('Streaming error:', error);
      
      if (error.name === 'AbortError') {
        console.log('Streaming aborted by user');
        return;
      }
      
      // On error, show fallback message
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: generateFallbackResponse(''), 
              isStreaming: false, 
              isComplete: true,
              stockAnalysis 
            }
          : msg
      ));
    } finally {
      setStreamingMessageId(null);
      setIsLoading(false);
    }
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
      console.log('Processing query:', currentInput);
      
      // Check if this is a portfolio/investment recommendation query
      if (this.isPortfolioRecommendationQuery(currentInput)) {
        console.log('Portfolio recommendation query detected, processing...');
        const portfolioResponse = await this.generatePortfolioRecommendation(currentInput);
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: portfolioResponse,
          isUser: false,
          timestamp: new Date(),
          isComplete: true
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }
      
      // Check if this is a specific stock-related query
      const stockAnalysis = await StockAnalysisApiService.analyzeStock(currentInput);
      
      if (stockAnalysis) {
        console.log('Stock analysis detected, processing...');
        
        // Generate detailed response based on the analysis
        const hasRealTimeData = stockAnalysis.stockData.currentPrice > 0;
        
        const analysisText = `**${stockAnalysis.stockData.companyName} Stock Analysis**

${hasRealTimeData ? `**Current Market Data:**
- **Price**: ₹${stockAnalysis.stockData.currentPrice} (${stockAnalysis.stockData.changePercent > 0 ? '+' : ''}${stockAnalysis.stockData.changePercent.toFixed(2)}%)
- **Day Range**: ₹${stockAnalysis.stockData.dayLow} - ₹${stockAnalysis.stockData.dayHigh}
- **Volume**: ${stockAnalysis.stockData.volume > 0 ? (stockAnalysis.stockData.volume / 1000).toFixed(0) + 'K' : 'N/A'}` : `**Analysis Based on Web Research:**
- Real-time price data not available for this symbol
- Analysis focused on market sentiment and news research`}

**Web Research Summary:**
Based on ${stockAnalysis.webInsights.length} recent articles from financial sources${stockAnalysis.webInsights.length > 0 ? ` including ${Array.from(new Set(stockAnalysis.webInsights.map(i => i.source))).slice(0, 3).join(', ')}` : ''}.

**My Recommendation:**
After analyzing ${hasRealTimeData ? 'real-time market data and' : ''} recent news and market sentiment, I recommend **${stockAnalysis.recommendation.action}** with ${stockAnalysis.recommendation.confidence}% confidence.

**Key Analysis Points:**
${stockAnalysis.recommendation.reasoning.map(reason => `• ${reason}`).join('\n')}

${stockAnalysis.recommendation.targetPrice && hasRealTimeData ? `**Target Price**: ₹${stockAnalysis.recommendation.targetPrice.toFixed(2)}` : ''}
${stockAnalysis.recommendation.stopLoss && hasRealTimeData ? `**Stop Loss**: ₹${stockAnalysis.recommendation.stopLoss.toFixed(2)}` : ''}

**Investment Horizon**: ${stockAnalysis.recommendation.timeHorizon.replace('_', ' ').toLowerCase()}

${hasRealTimeData ? 'The analysis below shows detailed insights including the latest market sentiment and news analysis.' : 'The analysis below is based primarily on web research and market sentiment from financial news sources.'}`;

        // Create AI response with stock analysis
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: analysisText,
          isUser: false,
          timestamp: new Date(),
          stockAnalysis: stockAnalysis,
          isComplete: true
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }
      
      console.log('No stock analysis, proceeding with OpenAI API...');
      
      // Check if API key is available
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        console.log('ERROR: OpenAI API key not found in environment variables');
        throw new Error('OpenAI API key not configured');
      }
      
      // Enhanced system prompt leveraging GPT-4o's mathematical capabilities
      let systemPrompt = `You are an expert Indian financial advisor with advanced mathematical capabilities, specialized in precise loan calculations, tax planning, investment strategies, and Indian stock market analysis.

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

**STOCK MARKET QUESTION** - Examples:
- "Should I buy Tata Motors stock?"
- "Analysis of Reliance Industries"
- "Is TCS a good investment?"
- "What's your view on HDFC Bank shares?"
- "Stock analysis for Infosys"

**STOCK ANALYSIS CAPABILITIES:**
- Real-time Indian stock market data analysis
- Technical and fundamental analysis
- Buy/sell/hold recommendations with reasoning
- Risk assessment and target price calculations
- Market sentiment analysis from recent news
- Sector and industry comparison

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

      // Create streaming AI response message
      const aiMessageId = (Date.now() + 1).toString();
      const streamingMessage: Message = {
        id: aiMessageId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
        isComplete: false
      };

      // Add the streaming message to the chat
      setMessages(prev => [...prev, streamingMessage]);

      // Start streaming response
      const chatMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: currentInput
        }
      ];

      await handleStreamingResponse(chatMessages, aiMessageId);
      
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

  // Portfolio/Investment recommendation detection
  const isPortfolioRecommendationQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const portfolioKeywords = [
      'invest', 'investment', 'portfolio', 'rupees', 'amount', 'money',
      'recommendations', 'suggest', 'advice', 'fund', 'funds', 'mutual fund',
      'large cap', 'mid cap', 'small cap', 'risk', 'diversify', 'allocation'
    ];
    
    const investmentPhrases = [
      'i want to invest', 'looking to invest', 'investment advice',
      'portfolio recommendations', 'best stocks', 'good investment',
      'where to invest', 'how to invest', 'investment strategy'
    ];
    
    // Check for investment amount patterns
    const hasAmount = /(\d+k?|\d+,?\d*)\s*(rupees?|rs\.?|₹)/i.test(query);
    const hasKeywords = portfolioKeywords.some(keyword => lowerQuery.includes(keyword));
    const hasPhrases = investmentPhrases.some(phrase => lowerQuery.includes(phrase));
    
    return (hasAmount && hasKeywords) || hasPhrases;
  };

  const generatePortfolioRecommendation = async (query: string): Promise<string> => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        return "I'd be happy to help with investment advice, but I need API access to provide detailed portfolio recommendations. Please contact support to enable this feature.";
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert Indian investment advisor. Provide comprehensive portfolio recommendations based on user queries.

**ALWAYS PROVIDE:**
1. Risk assessment (High/Medium/Low)
2. Asset allocation recommendations
3. Specific fund/stock categories with examples
4. Timeline-based strategy
5. Tax implications
6. Diversification strategy

**FORMAT YOUR RESPONSE WITH:**
- Clear headings with ** **
- Bullet points for easy reading
- Specific Indian market focus (NSE/BSE stocks, Indian mutual funds)
- Risk warnings and disclaimers`
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate portfolio recommendations at this time. Please try again.";
      
    } catch (error) {
      console.error('Portfolio recommendation error:', error);
      return `**Investment Portfolio Recommendations**

I'd love to help you create a comprehensive investment strategy! Here's a general framework:

**Risk Assessment**
- **Low Risk**: Focus on large-cap stocks and debt funds
- **Medium Risk**: Balanced mix of large-cap, mid-cap stocks and hybrid funds  
- **High Risk**: Small-cap stocks, sectoral funds, and growth stocks

**Suggested Asset Allocation**
- **Conservative (Low Risk)**: 70% Debt, 30% Equity
- **Balanced (Medium Risk)**: 50% Debt, 50% Equity
- **Aggressive (High Risk)**: 30% Debt, 70% Equity

**Recommended Categories**
- **Large Cap**: TCS, Reliance, HDFC Bank, Infosys
- **Mid Cap**: Asian Paints, Bajaj Finance, SBI
- **Small Cap**: Research-based selection with higher risk
- **Mutual Funds**: SIP in diversified equity funds

**Important Note**: This is general guidance. Please consult a qualified financial advisor for personalized advice based on your specific financial situation, goals, and risk tolerance.`;
    }
  };

  const suggestedQuestions = loanData ? [
    "How can I reduce my loan burden?",
    "Should I prepay my loan or invest?",
    "Should I buy Tata Motors stock?",
    "Analysis of Reliance Industries",
    "What are the tax benefits for my loan?"
  ] : [
    "Should I buy TCS stock?",
    "Analysis of HDFC Bank shares",
    "Best investment options for 30-year-old?",
    "Is Infosys a good investment?",
    "Tax saving strategies for this year?"
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
                    
                    {/* Stock Analysis Cards */}
                    {message.stockAnalysis && (
                      <div className="p-2 sm:p-3 lg:p-4 pt-0 space-y-4">
                        <StockRecommendationCard
                          stockData={message.stockAnalysis.stockData}
                          recommendation={message.stockAnalysis.recommendation}
                        />
                        <StockInsightsPanel
                          insights={message.stockAnalysis.webInsights}
                          stockSymbol={message.stockAnalysis.stockData.symbol}
                        />
                        
                        {/* Disclaimers */}
                        <div className="bg-yellow-50 dark:bg-yellow-600/10 border border-yellow-200 dark:border-yellow-600/30 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                            Important Disclaimers:
                          </h4>
                          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                            {message.stockAnalysis.disclaimers.map((disclaimer, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{disclaimer}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    <div className="px-2 sm:px-3 lg:px-4 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                        {message.isStreaming && (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Typing...</span>
                          </div>
                        )}
                      </div>
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
            {streamingMessageId ? (
              <Button
                onClick={stopStreaming}
                className="px-2 sm:px-3 lg:px-3 h-[40px] min-w-[40px] flex-shrink-0 bg-red-600 hover:bg-red-700 text-white"
              >
                <XMarkIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-2 sm:px-3 lg:px-3 h-[40px] min-w-[40px] flex-shrink-0"
              >
                <PaperAirplaneIcon className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};