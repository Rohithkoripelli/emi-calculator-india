/**
 * Trading Types for Groww Order Placement
 */

export interface OrderParams {
  trading_symbol: string;          // Stock symbol (e.g., "WIPRO", "TCS")
  quantity: number;                 // Number of shares
  price?: number;                   // Price for LIMIT orders
  trigger_price?: number;           // Trigger price for SL/SL-M orders
  validity: 'DAY' | 'IOC';         // Order validity
  exchange: 'NSE' | 'BSE';         // Stock exchange
  segment: 'CASH';                  // Trading segment
  product: 'CNC' | 'MIS';          // Product type (CNC = delivery, MIS = intraday)
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';  // Order type
  transaction_type: 'BUY' | 'SELL'; // Buy or Sell
  order_reference_id?: string;      // Optional reference ID
  preview_only?: boolean;           // If true, only calculate costs without placing order
}

export interface OrderResponse {
  status: 'SUCCESS' | 'FAILED';
  payload?: {
    groww_order_id: string;
    order_status: string;           // OPEN, COMPLETE, CANCELLED, etc.
    order_reference_id: string;
    remark: string;
  };
  error?: string;
  paper_trading?: boolean;          // True if this was a paper trading order
}

export interface OrderPreview {
  preview: true;
  stock: string;
  company_name: string;
  quantity: number;
  current_price: number;
  order_type: string;
  transaction_type: string;
  total_value: number;
  brokerage: number;
  stt: number;                      // Securities Transaction Tax
  exchange_charges: number;
  gst: number;
  sebi_charges: number;
  stamp_duty: number;
  total_charges: number;
  net_amount: number;               // Total amount user will pay
}

export interface MarketStatus {
  is_open: boolean;
  next_open_time?: string;
  market: string;                   // 'NSE' or 'BSE'
  current_time: string;
}

export interface OrderValidation {
  valid: boolean;
  message: string;
  errors?: string[];
}

export interface TradingConfig {
  paper_trading_mode: boolean;      // If true, don't place real orders
  max_order_value: number;          // Maximum order value in rupees
  max_daily_orders: number;         // Maximum orders per day
  max_daily_value: number;          // Maximum total value per day
  require_confirmation: boolean;     // Always require user confirmation
}

// Default trading configuration (live trading with safety limits)
export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  paper_trading_mode: false,        // LIVE TRADING enabled by default
  max_order_value: 100000,          // ₹1 Lakh max per order
  max_daily_orders: 10,             // 10 orders per day
  max_daily_value: 500000,          // ₹5 Lakhs max per day
  require_confirmation: true         // Always require confirmation
};
