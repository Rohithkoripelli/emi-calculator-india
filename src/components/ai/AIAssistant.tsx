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
import { IntentAnalysisService, QueryIntent } from '../../services/intentAnalysisService';
import { StockComparisonService, StockComparison } from '../../services/stockComparisonService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  stockAnalysis?: StockAnalysisReport;
  stockComparison?: StockComparison;
  investmentRecommendation?: InvestmentRecommendation;
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
      text: "Hello! I'm your AI financial assistant powered by real-time market data and comprehensive analysis. I can help you with:\n\n📊 **Stock Analysis**: Get detailed analysis of any Indian stock with real-time prices, technical indicators, and buy/sell recommendations\n\n💼 **Investment Recommendations**: Receive personalized portfolio allocations based on your budget and risk appetite\n\n💰 **Financial Planning**: Loan analysis, EMI optimization, and tax-saving strategies\n\nHow can I assist you today?",
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
   * Analyze user query using AI-powered intent analysis
   */
  const analyzeUserQuery = async (query: string): Promise<QueryIntent> => {
    console.log(`🧠 Starting intelligent analysis for: "${query}"`);
    
    try {
      const intent = await IntentAnalysisService.analyzeIntent(query);
      console.log(`✅ Intent analysis result:`, intent);
      return intent;
    } catch (error) {
      console.error('❌ Error in intent analysis:', error);
      // Fallback to a basic analysis
      return {
        type: 'GENERIC_FINANCIAL',
        confidence: 50,
        entities: {},
        reasoning: 'Fallback analysis due to error'
      };
    }
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
          ? { ...msg, text: `🔄 Analyzing ${stockSymbol}...\n\n• Fetching real-time market data\n• Gathering market news and sentiment\n• Performing technical analysis\n• Generating recommendations` }
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
   * Handle stock comparison queries
   */
  const handleStockComparison = async (stockSymbols: string[], aiMessageId: string) => {
    try {
      console.log(`🔄 Starting stock comparison for: ${stockSymbols.join(' vs ')}`);
      
      // Update message to show progress
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `🔄 Comparing ${stockSymbols.join(' vs ')}...\n\n• Fetching real-time data for all stocks\n• Performing detailed analysis\n• Calculating comparison metrics\n• Generating investment recommendation` }
          : msg
      ));
      
      // Use the stock symbols directly from fuzzy logic (already normalized)
      
      // Get comprehensive stock comparison
      const stockComparison = await StockComparisonService.compareStocks(stockSymbols);
      
      if (!stockComparison) {
        throw new Error(`Unable to compare ${stockSymbols.join(' and ')}. Please check if they are valid stock symbols.`);
      }
      
      // Format response for display
      const response = StockComparisonService.formatComparisonResponse(stockComparison);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: response, 
              stockComparison, 
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
      
    } catch (error) {
      console.error('❌ Error in stock comparison:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: `❌ Sorry, I couldn't compare ${stockSymbols.join(' and ')} at the moment. ${error instanceof Error ? error.message : 'Please try again later.'}\n\nYou can try asking about individual stocks first, like:\n• "Analyze HDFC Bank stock"\n• "What's the current price of SBI?"`,
              isStreaming: false, 
              isComplete: true 
            }
          : msg
      ));
    }
  };

  /**
   * Handle market news and sector analysis queries
   */
  const handleMarketAnalysis = async (query: string, queryIntent: QueryIntent, aiMessageId: string) => {
    try {
      console.log(`📰 Handling market analysis for: "${query}"`);
      
      // Update message to show progress
      const analysisType = queryIntent.type === 'MARKET_NEWS_ANALYSIS' ? 'market news' : 'sector analysis';
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `📊 Analyzing ${analysisType}...\n\n• Gathering latest market data\n• Processing news and trends\n• Generating insights and recommendations` }
          : msg
      ));
      
      // Route to generic financial handler with enhanced context
      await handleGenericFinancialQuery(query, aiMessageId);
      
    } catch (error) {
      console.error('❌ Error in market analysis:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              text: `❌ Sorry, I couldn't analyze the market data at the moment. ${error instanceof Error ? error.message : 'Please try again later.'}\n\nYou can try asking about:\n• Specific stocks or sectors\n• Investment recommendations\n• General market trends`,
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
          ? { ...msg, text: `💼 Creating investment strategy for ₹${amount.toLocaleString('en-IN')}...\n\n• Discovering trending stocks through market research\n• Fetching real-time market prices\n• Analyzing market sentiment and trends\n• Creating personalized portfolio allocation\n• Generating comprehensive investment plan` }
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
      console.log('🧠 Processing financial query...');
      
      // Update message to show progress
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: `🔄 Analyzing your query...\n\n• Processing loan and tax analysis\n• Calculating optimal strategies\n• Generating personalized recommendations` }
          : msg
      ));

      // Check if AI API key is available
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('❌ AI API key not found in environment variables');
        console.error('Please set REACT_APP_OPENAI_API_KEY in your Vercel environment variables');
        throw new Error('AI API key not configured');
      }
      
      console.log('✅ AI API key found, preparing analysis request...');

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
- "How soon can I close my home loan if I prepay X amount?"
- "What's the impact of lump sum prepayment on tenure?"

**PREPAYMENT CALCULATION METHODOLOGY:**
For prepayment scenarios, calculate:
1. **Remaining Principal**: Current outstanding principal balance
2. **New Principal**: Outstanding balance minus prepayment amount
3. **Revised Tenure**: Calculate months needed to pay new principal with same EMI
4. **Time Savings**: Original tenure minus revised tenure
5. **Interest Savings**: Total interest in original scenario minus revised scenario
6. **New Completion Date**: Start date plus revised tenure

Present results in a clear table format with before/after comparison.

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
- NEVER use complex mathematical notation or display EMI formulas like "P × r × (1 + r)^n"
- NEVER show calculation steps or mathematical working (e.g., "30,00,000 × 0.0075 × (1.0075)^240")
- NEVER display mathematical expressions, equations, or formula breakdowns
- NEVER show intermediate calculation steps or mathematical derivations
- NEVER use markdown formatting symbols like ###, **, *, ---, === in your responses
- NEVER use hashtags (#) for headers - use plain text headings instead
- NEVER use asterisks (**) for bold text - just write clear, descriptive text
- Use clean, plain text without any markdown artifacts or symbols
- Write section headers as simple text: "Scenario 1: Increase EMI" not "**Scenario 1: Increase EMI**"
- ALWAYS preserve exact decimal values - NEVER round interest rates or percentages
- When mentioning interest rates, use the EXACT value provided (e.g., 7.45% not 7% or 8%)
- Perform ALL calculations in the background - users should only see final results
- Explain calculations in simple, conversational language without revealing formulas
- Use practical examples and relatable scenarios
- Present numbers in easy-to-understand breakdowns
- Focus on the "what this means for you" rather than mathematical theory
- Replace formula explanations with plain language: "Based on your loan details, your EMI works out to..."

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
- Interest Rate: EXACTLY ${loanData.interestRate}% per annum (NEVER round this - use exact value ${loanData.interestRate}%)
- Current EMI: ₹${currentEMI.toLocaleString('en-IN')}
- Tenure: ${tenureMonths} months (${loanData.term} ${loanData.termUnit})
- Start Date: ${loanStartFormatted}
- Completion Date: ${completionFormatted}
- Loan Type: ${loanData.loanType.charAt(0).toUpperCase() + loanData.loanType.slice(1)}

**CRITICAL: When referring to the user's interest rate, ALWAYS use the EXACT value ${loanData.interestRate}% - NEVER round to ${Math.round(loanData.interestRate)}% or any other value.**

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

      // Prepare messages for AI processing
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

      // Call AI service
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
        const errorText = await response.text();
        console.error(`❌ AI API error (${response.status}):`, errorText);
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Validate response
      if (!aiResponse || aiResponse.trim().length < 20) {
        throw new Error('Invalid or too short response from AI service');
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
    
    // Skip news sentiment here - will be added at the end with web research
    
    // Risk Analysis
    response += `## ⚠️ Risk Assessment\n`;
    response += `**Risk Level:** ${risk.risk_level}\n`;
    response += `**Key Risks:**\n`;
    risk.key_risks.forEach((riskFactor, index) => {
      response += `• ${riskFactor}\n`;
    });
    response += '\n';
    
    // Only add the news sentiment and web research in the modern card format (handled by NewsArticlesCard component)
    // This section now only adds the research data to be picked up by the NewsArticlesCard component
    
    if (analysis.news_sentiment.key_news.length > 0 || (analysis.web_research && analysis.web_research.search_results.length > 0)) {
      // Add news sentiment data for the NewsArticlesCard to process
      if (analysis.news_sentiment.key_news.length > 0) {
        response += `## 📰 Recent News Sentiment: ${analysis.news_sentiment.overall_sentiment}\n`;
        analysis.news_sentiment.key_news.slice(0, 3).forEach((news, index) => {
          response += `${index + 1}. **${news.sentiment}**: ${news.headline}\n`;
        });
        response += '\n';
      }
      
      // Add web research results for the NewsArticlesCard to process  
      if (analysis.web_research && analysis.web_research.search_results.length > 0) {
        response += `## 🌐 Market Research Sources\n`;
        response += `Based on comprehensive web research using ${analysis.web_research.search_queries.length} search queries:\n\n`;
        
        analysis.web_research.search_results.forEach((result, index) => {
          response += `**${result.title}**\n`;
          response += `${result.snippet}\n`;
          response += `🔗 [Read more](${result.url})\n\n`;
        });
      }
    }
    
    // Disclaimer
    response += `## ⚠️ Disclaimer\n`;
    response += `This analysis is based on real-time market data, technical indicators, and market news. It's for educational purposes only and not financial advice. Please consult with a qualified financial advisor and do your own research before making investment decisions.`;
    
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

**Stock Analysis & Comparison:**
• "Analyze TCS stock" → Real-time data + buy/sell recommendation
• "Compare HDFC Bank and SBI stocks" → Detailed comparison with top pick
• "Which is better: Reliance or TCS?" → Side-by-side analysis

**Market News & Sector Analysis:**
• "How is the market performing today?" → Market sentiment + trends
• "Banking sector outlook" → Sector-specific analysis + recommendations
• "What's happening in IT stocks?" → Industry insights + stock picks

**Investment & Portfolio Planning:**
• "I want to invest ₹1 lakh in stocks" → Dynamic portfolio allocation
• "Best performing stocks for monthly SIP of ₹10,000"
• "How to diversify my portfolio?" → Asset allocation strategies

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
      // Analyze the user query using AI-powered intent analysis
      const queryIntent = await analyzeUserQuery(userMessage);
      
      console.log(`🎯 Intent analysis:`, queryIntent);
      
      // Route to appropriate handler based on intent type
      switch (queryIntent.type) {
        case 'SINGLE_STOCK_ANALYSIS':
          // Use both AI-extracted stocks AND fuzzy logic for accurate symbol identification
          let stockSymbol: string | undefined;
          
          if (queryIntent.entities.stocks && queryIntent.entities.stocks.length > 0) {
            // First try AI-extracted stock names with fuzzy matching
            for (const aiStock of queryIntent.entities.stocks) {
              const fuzzySymbol = ExcelBasedStockAnalysisService.parseStockSymbol(aiStock);
              if (fuzzySymbol) {
                stockSymbol = fuzzySymbol;
                break;
              }
            }
          }
          
          // If AI extraction failed, use fuzzy logic on the entire query
          if (!stockSymbol) {
            stockSymbol = ExcelBasedStockAnalysisService.parseStockSymbol(userMessage) || undefined;
          }
          
          if (stockSymbol) {
            console.log(`✅ Stock symbol identified: ${stockSymbol} from query: "${userMessage}"`);
            await handleStockAnalysis(stockSymbol, aiMessageId);
          } else {
            // Stock not found in Excel database - try web search to find correct symbol
            console.log(`🔍 Stock not found in Excel database, searching web for: "${userMessage}"`);
            
            try {
              // Import web search utility functions
              const { WebSearch, extractStockSymbolFromResults } = await import('../../utils/webSearchUtil');
              
              // Extract company name from user message
              const companyQuery = userMessage
                .replace(/should\s+i\s+buy|stock|shares?|invest|investment/gi, '')
                .replace(/\?|now|\!|stocks?/gi, '')
                .trim();
              
              // Search for the company's stock symbol using Google Custom Search API
              const searchQuery = `"${companyQuery}" NSE BSE stock symbol ticker`;
              console.log(`🔍 Searching Google API: "${searchQuery}"`);
              
              const searchResults = await WebSearch(searchQuery, 3);
              
              if (searchResults && searchResults.length > 0) {
                console.log(`📊 Received ${searchResults.length} search results from Google API`);
                
                // Use the utility function to extract stock symbol
                const foundSymbol = extractStockSymbolFromResults(searchResults, companyQuery);
                
                if (foundSymbol) {
                  console.log(`✅ Google search found symbol: ${foundSymbol} for query: "${userMessage}"`);
                  await handleStockAnalysis(foundSymbol, aiMessageId);
                } else {
                  throw new Error(`Could not find stock symbol for "${companyQuery}". Please try with more specific company names or known stock symbols.`);
                }
              } else {
                throw new Error(`No search results found for "${companyQuery}". Please try with specific company names like "Reliance", "TCS", "HDFC Bank", etc.`);
              }
            } catch (webSearchError) {
              console.error('❌ Web search failed:', webSearchError);
              throw new Error(`Could not identify stock symbol for "${userMessage}". Please try with specific company names like "Reliance", "TCS", "HDFC Bank", etc.`);
            }
          }
          break;
          
        case 'STOCK_COMPARISON':
          // Use fuzzy logic to identify actual stock symbols for comparison
          const stockSymbols: string[] = [];
          
          if (queryIntent.entities.stocks && queryIntent.entities.stocks.length >= 2) {
            // Try AI-extracted stocks with fuzzy matching
            for (const aiStock of queryIntent.entities.stocks) {
              const fuzzySymbol = ExcelBasedStockAnalysisService.parseStockSymbol(aiStock);
              if (fuzzySymbol && !stockSymbols.includes(fuzzySymbol)) {
                stockSymbols.push(fuzzySymbol);
              }
            }
          }
          
          // If we don't have enough from AI extraction, use fuzzy logic on entire query
          if (stockSymbols.length < 2) {
            // Use ExcelBasedStockAnalysisService to find multiple stocks in the query
            const fuzzyMatches = ExcelBasedStockAnalysisService.findMultipleStocks(userMessage);
            for (const match of fuzzyMatches) {
              if (!stockSymbols.includes(match)) {
                stockSymbols.push(match);
              }
            }
          }
          
          if (stockSymbols.length >= 2) {
            console.log(`✅ Stock symbols identified for comparison: ${stockSymbols.join(' vs ')} from query: "${userMessage}"`);
            await handleStockComparison(stockSymbols, aiMessageId);
          } else {
            throw new Error('Need at least 2 valid stock symbols for comparison. Please mention specific company names like "Compare Reliance and TCS" or "HDFC Bank vs SBI".');
          }
          break;
          
        case 'MARKET_NEWS_ANALYSIS':
        case 'SECTOR_ANALYSIS':
          await handleMarketAnalysis(userMessage, queryIntent, aiMessageId);
          break;
          
        case 'INVESTMENT_RECOMMENDATION':
        case 'PORTFOLIO_ALLOCATION':
          await handleInvestmentRecommendation(
            userMessage,
            queryIntent.entities.amount,
            queryIntent.entities.frequency || 'LUMP_SUM',
            aiMessageId
          );
          break;
          
        case 'TAX_PLANNING':
        case 'FINANCIAL_PLANNING':
        case 'CALCULATOR_REQUEST':
        case 'LOAN_ANALYSIS':
        case 'GENERIC_FINANCIAL':
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
        className="bg-white dark:bg-gray-800 w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-4xl rounded-t-xl md:rounded-xl shadow-2xl flex flex-col"
        style={{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Financial Assistant</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300">Powered by real-time market data</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            AI generated responses can be inaccurate
          </p>
        </div>
      </div>
    </div>
  );
};