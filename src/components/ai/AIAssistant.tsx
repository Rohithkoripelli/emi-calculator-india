import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI financial assistant. I can help you with questions about loans, EMIs, investments, and financial planning in India. How can I assist you today?",
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

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for keywords and return predefined responses
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (message.includes(keyword)) {
        return response;
      }
    }

    // General financial advice responses
    if (message.includes('emi') || message.includes('loan')) {
      return `I can help you with loan calculations! Here are some quick tips:

• Choose the right loan tenure - longer tenure means lower EMI but higher total interest
• Compare interest rates across multiple banks
• Consider processing fees and other charges
• Maintain a good credit score for better rates

Use our EMI calculator to compare different scenarios!`;
    }

    if (message.includes('save') || message.includes('savings')) {
      return `Smart saving strategies for Indians:

• Start with emergency fund (6 months expenses)
• Use PPF for long-term tax-free savings
• SIPs for wealth creation
• Sukanya Samridhi for girl child education
• NPS for retirement planning

What specific savings goal can I help you with?`;
    }

    if (message.includes('retirement')) {
      return `Retirement planning is crucial:

• Start early to benefit from compounding
• Target 20-25x annual expenses as retirement corpus
• Use NPS for additional tax benefits
• Consider inflation in planning
• Mix of equity and debt based on age

Our SIP calculator can help plan your retirement corpus!`;
    }

    // Default response
    return `I'd be happy to help with your financial questions! I can assist with:

• Loan and EMI calculations
• Investment planning and SIP strategies
• Tax-saving options
• Insurance planning
• Retirement planning
• Home buying advice

Please ask me a specific question about any of these topics!`;
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
    setInputMessage('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputMessage),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "How to reduce my home loan burden?",
    "Best investment options for 30-year-old?",
    "Should I prepay my loan or invest?",
    "Tax saving strategies for this year?",
    "How much emergency fund do I need?"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Financial Assistant</h3>
              <p className="text-sm text-gray-500">Powered by GPT-4 • India-specific advice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
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
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about loans, investments, tax planning..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};