import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { AIResponseFormatter } from './AIResponseFormatter';

// Import new services
import { GrowwApiService, StockQuote, TechnicalAnalysis } from '../../services/growwApiService';
import { NewsSearchService, TrendingStock, StockNews } from '../../services/newsSearchService';
import { InvestmentAnalysisService, StockAnalysisReport, InvestmentRecommendation } from '../../services/investmentAnalysisService';
import { PortfolioAllocationService, StructuredPortfolioResponse } from '../../services/portfolioAllocationService';
import { ExcelBasedStockAnalysisService } from '../../services/excelBasedStockAnalysis';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  stockAnalysis?: StockAnalysisReport;
  investmentRecommendation?: InvestmentRecommendation;
  isStreaming?: boolean;
  isComplete?: boolean;
}

interface QueryAnalysis {
  queryType: 'STOCK_ANALYSIS' | 'INVESTMENT_RECOMMENDATION' | 'GENERIC_FINANCIAL';
  stockSymbol?: string;
  investmentAmount?: number;
  investmentFrequency?: 'LUMP_SUM' | 'SIP' | 'RECURRING';
  confidence: number;
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
      text: "Hello! I'm your AI financial assistant powered by real-time data from Groww API and comprehensive market analysis. I can help you with:\n\n📊 **Stock Analysis**: Get detailed analysis of any Indian stock with real-time prices, technical indicators, and buy/sell recommendations\n\n💼 **Investment Recommendations**: Receive personalized portfolio allocations based on your budget and risk appetite\n\n💰 **Financial Planning**: Loan analysis, EMI optimization, and tax-saving strategies\n\nHow can I assist you today?",
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
      
      const heightDiff = window.screen.height - newHeight;
      if (heightDiff > 150) {
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

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  /**
   * Analyze user query to determine the type and extract relevant information
   */
  const analyzeUserQuery = (query: string): QueryAnalysis => {
    const lowerQuery = query.toLowerCase();
    
    console.log(`🔍 Analyzing query: "${query}"`);
    
    // Check for investment amount patterns
    const amountMatches = query.match(/(\d+(?:,\d+)*)\s*(?:k|thousand|lakh|lakhs|crore|crores|rupees|rs|₹)?/gi);
    let investmentAmount: number | undefined;
    
    if (amountMatches) {
      const amountText = amountMatches[0].toLowerCase();
      const numericValue = parseInt(amountText.replace(/[^\d]/g, ''));
      
      if (amountText.includes('k') || amountText.includes('thousand')) {
        investmentAmount = numericValue * 1000;
      } else if (amountText.includes('lakh')) {
        investmentAmount = numericValue * 100000;
      } else if (amountText.includes('crore')) {
        investmentAmount = numericValue * 10000000;
      } else if (numericValue >= 1000) {
        investmentAmount = numericValue;
      }
    }
    
    // Check for investment frequency patterns
    let investmentFrequency: 'LUMP_SUM' | 'SIP' | 'RECURRING' = 'LUMP_SUM';
    if (lowerQuery.includes('monthly') || lowerQuery.includes('every month') || lowerQuery.includes('sip')) {
      investmentFrequency = 'SIP';
    } else if (lowerQuery.includes('recurring') || lowerQuery.includes('regular')) {
      investmentFrequency = 'RECURRING';
    }
    
    // Check for stock symbol using our Excel-based service
    const stockSymbol = ExcelBasedStockAnalysisService.parseStockSymbol(query) || undefined;
    
    // Determine query type based on patterns
    let queryType: 'STOCK_ANALYSIS' | 'INVESTMENT_RECOMMENDATION' | 'GENERIC_FINANCIAL' = 'GENERIC_FINANCIAL';
    let confidence = 50;
    
    if (stockSymbol) {
      queryType = 'STOCK_ANALYSIS';
      confidence = 85;
      console.log(`📊 Detected stock analysis query for: ${stockSymbol}`);
    } else if (investmentAmount && (lowerQuery.includes('invest') || lowerQuery.includes('portfolio') || lowerQuery.includes('stocks') || lowerQuery.includes('recommend'))) {
      queryType = 'INVESTMENT_RECOMMENDATION';
      confidence = 80;
      console.log(`💼 Detected investment recommendation query for ₹${investmentAmount}`);
    } else if (lowerQuery.includes('invest') || lowerQuery.includes('stock') || lowerQuery.includes('share') || lowerQuery.includes('portfolio')) {
      queryType = 'INVESTMENT_RECOMMENDATION';
      confidence = 60;
      console.log(`💼 Detected general investment query`);
    }
    
    return {
      queryType,
      stockSymbol,
      investmentAmount,
      investmentFrequency,
      confidence
    };
  };

  /**
   * Handle stock analysis queries
   */
  const handleStockAnalysis = async (stockSymbol: string, aiMessageId: string) => {
    try {
      console.log(`📊 Starting stock analysis for ${stockSymbol}...`);
      
      // Update message to show progress
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `🔄 Analyzing ${stockSymbol}...\n\n• Fetching real-time data from Groww API\n• Gathering market news and sentiment\n• Performing technical analysis\n• Generating recommendations` }
          : msg
      ));
      
      // Get comprehensive stock analysis
      const stockAnalysis = await InvestmentAnalysisService.analyzeStock(stockSymbol);
      
      if (!stockAnalysis) {
        throw new Error(`Unable to analyze ${stockSymbol}. Please check if it's a valid NSE/BSE stock symbol.`);
      }
      
      // Format response for display
      const response = formatStockAnalysisResponse(stockAnalysis);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: response, 
              stockAnalysis, 
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Error in stock analysis:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: `❌ Sorry, I couldn't analyze ${stockSymbol} at the moment. ${error instanceof Error ? error.message : 'Please try again later.'}`,
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
    }
  };

  /**
   * Handle investment recommendation queries
   */
  const handleInvestmentRecommendation = async (
    query: string,
    amount: number | undefined,
    frequency: 'LUMP_SUM' | 'SIP' | 'RECURRING',
    aiMessageId: string
  ) => {
    try {
      console.log(`💼 Generating investment recommendation for query: "${query}"`);
      
      // If no amount specified, ask for clarification
      if (!amount) {
        const clarificationResponse = `I'd be happy to help you with investment recommendations! 

To provide personalized advice, could you please specify:

1. **Investment Amount**: How much are you planning to invest? (e.g., "10,000 rupees", "1 lakh", etc.)

2. **Investment Pattern**: 
   - One-time lump sum investment
   - Monthly SIP (Systematic Investment Plan)
   - Any other frequency

3. **Investment Goal**: Short-term (1-2 years) or Long-term (3+ years)

For example, you could ask:
- "I want to invest 50,000 rupees as a lump sum for long-term growth"
- "I want to invest 10,000 rupees monthly through SIP"
- "Where should I invest 2 lakh rupees for the next 2 years?"

Please provide these details so I can give you a comprehensive portfolio recommendation with real stock prices and proper allocation!`;

        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: clarificationResponse, isStreaming: false, isComplete: true }
            : msg
        ));
        return;
      }
      
      // Update message to show progress
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `💼 Creating investment strategy for ₹${amount.toLocaleString('en-IN')}...\n\n• Discovering trending stocks through market research\n• Fetching real-time prices from Groww API\n• Analyzing market sentiment and trends\n• Creating personalized portfolio allocation\n• Generating comprehensive investment plan` }
          : msg
      ));
      
      // Generate comprehensive investment recommendation
      const recommendation = await InvestmentAnalysisService.generateInvestmentRecommendation(
        query,
        amount,
        frequency
      );
      
      if (!recommendation) {
        throw new Error('Unable to generate investment recommendation at the moment.');
      }
      
      // Create structured portfolio response
      const trendingStocks = await NewsSearchService.discoverTrendingStocks('recent');
      const stockQuotes = await GrowwApiService.getBatchQuotes(
        trendingStocks.slice(0, 9).map(stock => stock.symbol)
      );
      
      const structuredResponse = PortfolioAllocationService.createStructuredResponse(
        amount,
        frequency,
        stockQuotes,
        trendingStocks,
        recommendation.market_overview.current_sentiment
      );
      
      // Format response for display
      const response = PortfolioAllocationService.formatResponseForDisplay(structuredResponse);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: response,
              investmentRecommendation: recommendation,
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Error in investment recommendation:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: `❌ Sorry, I couldn't generate investment recommendations at the moment. ${error instanceof Error ? error.message : 'Please try again later.'}\n\nYou can try asking questions like:\n• "I want to invest 50,000 rupees for long term"\n• "Monthly SIP of 10,000 rupees recommendations"\n• "Best stocks to buy with 1 lakh rupees"`,
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
    }
  };

  /**
   * Handle generic financial queries (loan analysis, tax planning, etc.)
   */
  const handleGenericFinancialQuery = async (query: string, aiMessageId: string) => {
    try {
      console.log('🧠 Processing financial query with OpenAI...');
      
      // Update message to show progress
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `🔄 Analyzing your query...\n\n• Processing loan and tax analysis\n• Calculating optimal strategies\n• Generating personalized recommendations` }
          : msg
      ));

      // Check if OpenAI API key is available
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.log('OpenAI API key not found, using fallback response');
        throw new Error('OpenAI API key not configured');
      }

      // Enhanced system prompt for loan/tax analysis
      let systemPrompt = `You are an expert Indian financial advisor with advanced mathematical capabilities, specialized in precise loan calculations, tax planning, investment strategies, and financial planning in India.

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
        
        const monthlyRate = loanData.interestRate / 12 / 100;
        const tenureMonths = loanData.termUnit === 'years' ? loanData.term * 12 : loanData.term;
        
        // Calculate exact completion date
        const completionDate = new Date(loanStartDate);
        completionDate.setMonth(completionDate.getMonth() + tenureMonths);
        const completionFormatted = completionDate.toLocaleDateString('en-IN', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        const currentEMI = loanData.emi || 0;
        
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
- If the question is about general financial advice, tax benefits, or investment strategies → Don't use loan details
- If the question is specifically about their loan, prepayment, or EMI calculations → Use loan details for precise calculations`;
      }

      systemPrompt += `

**RESPONSE QUALITY STANDARDS:**
- Always provide actionable, practical advice
- Include relevant examples and scenarios
- Consider current Indian tax laws and financial regulations
- Provide multiple options when applicable
- Include risk considerations and disclaimers when appropriate
- Use professional yet conversational tone
- Focus on educating the user while solving their problem`;

      // Prepare messages for OpenAI API
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user', 
          content: query
        }
      ];

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-2024-11-20',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.0,
          seed: 42
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Validate response
      if (!aiResponse || aiResponse.trim().length < 20) {
        throw new Error('Invalid or too short response from OpenAI');
      }

      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: aiResponse, isStreaming: false, isComplete: true }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Error in generic query:', error);
      
      // Use enhanced fallback that maintains loan/tax capabilities
      const fallbackResponse = generateFallbackResponse(query);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: fallbackResponse, isStreaming: false, isComplete: true }
          : msg
      ));
    }
  };

  /**
   * Format stock analysis response for display
   */
  const formatStockAnalysisResponse = (analysis: StockAnalysisReport): string => {
    const stock = analysis.stock_info;
    const tech = analysis.technical_analysis;
    const recommendation = analysis.recommendation;
    const risk = analysis.risk_analysis;
    
    let response = `# 📊 ${stock.company_name} (${stock.symbol}) Analysis\n\n`;
    
    // Current Price and Change
    response += `## 💰 Current Market Data\n`;
    response += `**Current Price:** ₹${stock.current_price}\n`;
    response += `**Day Change:** ${stock.day_change >= 0 ? '+' : ''}₹${stock.day_change.toFixed(2)} (${stock.day_change_percent >= 0 ? '+' : ''}${stock.day_change_percent.toFixed(2)}%)\n`;
    response += `**Sector:** ${stock.sector} | **Market Cap:** ${stock.market_cap}\n\n`;
    
    // Recommendation
    response += `## 🎯 Recommendation\n`;
    response += `**Action:** ${recommendation.action} (${recommendation.confidence}% confidence)\n`;
    response += `**Time Horizon:** ${recommendation.time_horizon.replace('_', ' ')}\n`;
    
    if (recommendation.target_price) {
      response += `**Target Price:** ₹${recommendation.target_price.toFixed(2)}\n`;
    }
    if (recommendation.stop_loss) {
      response += `**Stop Loss:** ₹${recommendation.stop_loss.toFixed(2)}\n`;
    }
    response += '\n';
    
    // Reasoning
    response += `### 📝 Key Reasoning:\n`;
    recommendation.reasoning.forEach((reason, index) => {
      response += `${index + 1}. ${reason}\n`;
    });
    response += '\n';
    
    // Technical Analysis
    if (tech) {
      response += `## 📈 Technical Analysis\n`;
      response += `**Trend:** ${tech.trend} | **RSI:** ${tech.rsi.toFixed(1)}\n`;
      response += `**Support:** ₹${tech.support} | **Resistance:** ₹${tech.resistance}\n`;
      response += `**30-Day Performance:** ${tech.priceChange30Days >= 0 ? '+' : ''}${tech.priceChange30Days.toFixed(1)}%\n`;
      response += `**Volatility:** ${tech.volatility.toFixed(1)}%\n\n`;
    }
    
    // News Sentiment
    if (analysis.news_sentiment.key_news.length > 0) {
      response += `## 📰 Recent News Sentiment: ${analysis.news_sentiment.overall_sentiment}\n`;
      analysis.news_sentiment.key_news.slice(0, 3).forEach((news, index) => {
        response += `${index + 1}. **${news.sentiment}**: ${news.headline}\n`;
      });
      response += '\n';
    }
    
    // Risk Analysis
    response += `## ⚠️ Risk Assessment\n`;
    response += `**Risk Level:** ${risk.risk_level}\n`;
    response += `**Key Risks:**\n`;
    risk.key_risks.forEach((riskFactor, index) => {
      response += `• ${riskFactor}\n`;
    });
    response += '\n';
    
    // Disclaimer
    response += `## ⚠️ Disclaimer\n`;
    response += `This analysis is based on real-time data from Groww API, technical indicators, and market news. It's for educational purposes only and not financial advice. Please consult with a qualified financial advisor and do your own research before making investment decisions.`;
    
    return response;
  };

  /**
   * Generate comprehensive fallback response showing all capabilities
   */
  const generateFallbackResponse = (userMessage: string): string => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return `I'm your comprehensive AI financial advisor with expertise in Indian finance. I can help you with:

## 💰 **Loan Analysis & EMI Optimization**
• **Prepayment Strategies**: "Should I prepay ₹5 lakhs or invest it?"
• **EMI Calculations**: "When will my loan close if I prepay ₹8 lakhs?"
• **Loan Restructuring**: "What if I increase my EMI by ₹10,000?"
• **Interest Savings**: Calculate exact savings from different prepayment scenarios
• **Optimal Payment Strategies**: Balance between loan closure and investments

## 📊 **Tax Planning & Optimization** 
• **Home Loan Benefits**: Section 24(b) interest deduction up to ₹2 lakhs
• **Section 80C Investments**: ELSS, PPF, ULIP optimization strategies
• **Capital Gains Planning**: LTCG vs STCG tax strategies
• **Tax-Saving Investments**: Best options based on your income bracket
• **Section 80EE/80EEA**: Additional home loan benefits for first-time buyers

## 🏠 **Real Estate & Property Finance**
• **Home Loan vs Rent**: Financial analysis with exact calculations
• **Property Investment**: ROI calculations and market timing
• **Refinancing Decisions**: When to switch lenders
• **Joint vs Individual Loans**: Tax and EMI implications

## 📈 **Investment & Wealth Planning**
• **SIP Planning**: Optimal amount and fund selection
• **Portfolio Rebalancing**: Asset allocation strategies
• **Retirement Planning**: Corpus calculation with inflation
• **Emergency Fund**: Ideal amount and investment options
• **Goal-Based Investing**: Education, marriage, retirement planning

## 📊 **NEW: Stock Market Analysis**
• **Real-time Stock Analysis**: "Analyze Reliance stock" → Live data + recommendations
• **Investment Recommendations**: "Invest ₹50,000 in stocks" → Dynamic portfolio
• **Technical Analysis**: RSI, moving averages, support/resistance
• **Portfolio Allocation**: Risk-based distribution across market caps

${loanData ? `\n## 🎯 **Your Current Loan Analysis Available:**\n• **Loan Amount**: ${formatCurrency(loanData.principal)}\n• **Current EMI**: ${formatCurrency(loanData.emi || 0)}\n• **Interest Rate**: ${loanData.interestRate}% p.a.\n• **Remaining Tenure**: ${loanData.term} ${loanData.termUnit}\n• **Loan Type**: ${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)}\n\n**I can calculate exact scenarios for:**\n• Prepayment impact and savings\n• EMI restructuring options\n• Loan closure timeline\n• Tax benefits optimization\n• Investment vs prepayment decisions` : ''}

## 💡 **Sample Questions You Can Ask:**

**Loan & EMI:**
• "How much will I save if I prepay ₹5 lakhs now?"
• "Should I prepay my loan or invest in mutual funds?"
• "What's my loan amortization schedule?"

**Tax Planning:**
• "How to save tax under Section 80C?"
• "What are home loan tax benefits?"
• "ELSS vs PPF - which is better?"

**Investments:**
• "Best SIP amount for ₹50,000 monthly income?"
• "Should I invest lump sum or SIP in current market?"
• "Analyze HDFC Bank stock for long-term investment"

**Stock Analysis:**
• "Analyze TCS stock" → Real-time data + buy/sell recommendation
• "I want to invest ₹1 lakh in stocks" → Dynamic portfolio allocation
• "Best performing stocks for monthly SIP of ₹10,000"

**How can I assist you today?** 🚀`;
  };

  /**
   * Handle sending message with new architecture
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
      isComplete: true
    };

    // Add AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMessageId,
      text: 'Analyzing your query...',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true,
      isComplete: false
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);

    try {
      // Analyze the user query
      const queryAnalysis = analyzeUserQuery(userMessage);
      
      console.log(`🎯 Query analysis:`, queryAnalysis);
      
      // Route to appropriate handler based on query type
      switch (queryAnalysis.queryType) {
        case 'STOCK_ANALYSIS':
          if (queryAnalysis.stockSymbol) {
            await handleStockAnalysis(queryAnalysis.stockSymbol, aiMessageId);
          } else {
            throw new Error('Could not identify stock symbol');
          }
          break;
          
        case 'INVESTMENT_RECOMMENDATION':
          await handleInvestmentRecommendation(
            userMessage,
            queryAnalysis.investmentAmount,
            queryAnalysis.investmentFrequency || 'LUMP_SUM',
            aiMessageId
          );
          break;
          
        default:
          await handleGenericFinancialQuery(userMessage, aiMessageId);
          break;
      }
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: `❌ I encountered an error processing your request. ${error instanceof Error ? error.message : 'Please try again.'}\n\n${generateFallbackResponse(userMessage)}`,
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div 
        className="bg-white dark:bg-dark-card w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-4xl rounded-t-xl md:rounded-xl shadow-2xl flex flex-col"
        style={{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">AI Financial Assistant</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Powered by real-time market data</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-800 dark:text-dark-text-primary'
                }`}
              >
                {message.isUser ? (
                  <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                ) : (
                  <div className="text-sm">
                    <AIResponseFormatter text={message.text} />
                    {message.isStreaming && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="animate-pulse flex space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <button
                          onClick={stopStreaming}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {!message.isUser && message.stockAnalysis && (
                    <span className="text-xs opacity-70">Real-time data</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-dark-border p-4">
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about stocks, investments, or financial planning..."
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-dark-text-primary"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
            Powered by Groww API • Real-time stock data • AI analysis
          </p>
        </div>
      </div>
    </div>
  );
};