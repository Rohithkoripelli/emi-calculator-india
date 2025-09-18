"use strict";
/**
 * Portfolio Allocation Service
 * Creates structured investment recommendations with proper formatting and allocation tables
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.PortfolioAllocationService = void 0;
var intelligentPortfolioEngine_1 = __importDefault(require("./intelligentPortfolioEngine"));
var stockDatabaseService_1 = __importDefault(require("./stockDatabaseService"));
var stockDataFetcher_1 = __importDefault(require("./stockDataFetcher"));
var PortfolioAllocationService = /** @class */ (function () {
    function PortfolioAllocationService() {
    }
    /**
     * Get predefined allocation strategies
     */
    PortfolioAllocationService.getAllocationStrategies = function () {
        return {
            conservative: { large: 60, mid: 30, small: 10 },
            balanced: { large: 50, mid: 30, small: 20 },
            aggressive: { large: 30, mid: 40, small: 30 } // Growth-focused
        };
    };
    /**
     * Parse allocation ratios from user question
     * E.g., "40,30,30 ratio in large, mid & small cap" → {large: 40, mid: 30, small: 30}
     */
    PortfolioAllocationService.parseAllocationRatio = function (userQuestion) {
        console.log("\uD83D\uDD0D Parsing allocation ratio from: \"".concat(userQuestion, "\""));
        // Pattern for ratios like "40,30,30", "50:30:20", "60-25-15"
        var ratioPatterns = [
            /(\d+)[\s,]*(\d+)[\s,]*(\d+).*(?:ratio|split).*(?:large|mid|small)/i,
            /(?:large|mid|small).*(\d+)[\s,]*(\d+)[\s,]*(\d+)/i,
            /(\d+)[\s,:;\-]*(\d+)[\s,:;\-]*(\d+)[\s%]*(?:in|for|across).*(?:cap|fund)/i
        ];
        for (var _i = 0, ratioPatterns_1 = ratioPatterns; _i < ratioPatterns_1.length; _i++) {
            var pattern = ratioPatterns_1[_i];
            var match = userQuestion.match(pattern);
            if (match) {
                var first = match[1], second = match[2], third = match[3];
                var allocation = {
                    large: parseInt(first),
                    mid: parseInt(second),
                    small: parseInt(third)
                };
                console.log("\u2705 Found allocation ratio:", allocation);
                return allocation;
            }
        }
        console.log("\u26A0\uFE0F No custom allocation ratio found, using default");
        return null;
    };
    /**
     * Create multiple portfolio approaches (Conservative, Balanced, Aggressive)
     */
    PortfolioAllocationService.createMultipleApproaches = function (investmentAmount, frequency, stockQuotes, trendingStocks, marketSentiment) {
        return __awaiter(this, void 0, void 0, function () {
            var strategies, _a, conservative, balanced, aggressive;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        strategies = this.getAllocationStrategies();
                        return [4 /*yield*/, Promise.all([
                                this.createStructuredResponse(investmentAmount, frequency, stockQuotes, trendingStocks, marketSentiment, strategies.conservative),
                                this.createStructuredResponse(investmentAmount, frequency, stockQuotes, trendingStocks, marketSentiment, strategies.balanced),
                                this.createStructuredResponse(investmentAmount, frequency, stockQuotes, trendingStocks, marketSentiment, strategies.aggressive)
                            ])];
                    case 1:
                        _a = _b.sent(), conservative = _a[0], balanced = _a[1], aggressive = _a[2];
                        return [2 /*return*/, {
                                conservative: conservative,
                                balanced: balanced,
                                aggressive: aggressive
                            }];
                }
            });
        });
    };
    /**
     * Create structured portfolio response for specific allocation
     */
    PortfolioAllocationService.createStructuredResponse = function (investmentAmount, frequency, stockQuotes, trendingStocks, marketSentiment, customAllocation) {
        return __awaiter(this, void 0, void 0, function () {
            var categorizedStocks, allocation, sipStrategy, response;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCCB Creating structured portfolio response for \u20B9".concat(investmentAmount, "..."));
                        return [4 /*yield*/, this.categorizeStocksByMarketCapWithScreener(stockQuotes, trendingStocks)];
                    case 1:
                        categorizedStocks = _a.sent();
                        allocation = this.createAllocation(investmentAmount, categorizedStocks, customAllocation);
                        sipStrategy = frequency === 'SIP' ?
                            this.createSIPStrategy(investmentAmount, categorizedStocks) : [];
                        response = {
                            executive_summary: {
                                investment_amount: "\u20B9".concat(this.formatCurrency(investmentAmount)),
                                investment_type: frequency === 'SIP' ? 'Systematic Investment Plan (SIP)' : 'Lump Sum Investment',
                                strategy_overview: this.generateStrategyOverview(investmentAmount, frequency, marketSentiment),
                                expected_timeline: frequency === 'SIP' ? '12-24 months for portfolio building' : '18-36 months for wealth creation'
                            },
                            market_analysis: {
                                current_sentiment: this.formatMarketSentiment(marketSentiment),
                                trending_sectors: this.extractTrendingSectors(trendingStocks),
                                market_highlights: this.generateMarketHighlights(trendingStocks, marketSentiment)
                            },
                            recommended_allocation: {
                                large_cap_stocks: categorizedStocks.largeCap.map(function (stock) { return _this.createPortfolioStock(stock, 'Large Cap'); }),
                                mid_cap_stocks: categorizedStocks.midCap.map(function (stock) { return _this.createPortfolioStock(stock, 'Mid Cap'); }),
                                small_cap_stocks: categorizedStocks.smallCap.map(function (stock) { return _this.createPortfolioStock(stock, 'Small Cap'); })
                            },
                            allocation_table: allocation,
                            investment_strategy: {
                                strategy_type: this.determineStrategyType(investmentAmount, frequency),
                                key_benefits: this.generateKeyBenefits(frequency, marketSentiment),
                                risk_level: this.determineRiskLevel(investmentAmount, frequency),
                                suggested_approach: this.generateSuggestedApproach(frequency, investmentAmount)
                            },
                            sip_strategy: sipStrategy,
                            risk_management: {
                                diversification_approach: this.generateDiversificationApproach(categorizedStocks),
                                stop_loss_strategy: this.generateStopLossStrategy(investmentAmount),
                                portfolio_review: frequency === 'SIP' ? 'Monthly review with quarterly rebalancing' : 'Quarterly review with semi-annual rebalancing',
                                risk_mitigation: this.generateRiskMitigation(marketSentiment, investmentAmount)
                            },
                            tax_considerations: {
                                investment_type: 'Equity Investment',
                                tax_benefits: this.generateTaxBenefits(),
                                holding_strategy: 'Hold for more than 1 year to qualify for Long Term Capital Gains (LTCG) tax benefits'
                            },
                            next_steps: {
                                immediate_actions: this.generateImmediateActions(frequency),
                                platform_suggestions: this.generatePlatformSuggestions(),
                                monitoring_approach: this.generateMonitoringApproach(frequency)
                            },
                            disclaimer: this.generateDisclaimer()
                        };
                        console.log("\u2705 Structured portfolio response created with ".concat(allocation.length, " stock recommendations"));
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * Format the response for display similar to ChatGPT example
     */
    /**
     * Format multiple approaches for display
     */
    PortfolioAllocationService.formatMultipleApproachesForDisplay = function (approaches, investmentAmount) {
        var output = '';
        // Header
        output += "# \uD83D\uDCBC Portfolio Investment Strategies for \u20B9".concat(this.formatCurrency(investmentAmount), "\n\n");
        output += "Choose the approach that best matches your risk tolerance and investment goals:\n\n";
        // Strategy Overview Table
        output += "## \uD83D\uDCCA Strategy Comparison\n\n";
        output += "| Approach | Large Cap | Mid Cap | Small Cap | Risk Level | Best For |\n";
        output += "|----------|-----------|---------|-----------|------------|----------|\n";
        output += "| \uD83D\uDEE1\uFE0F **Conservative** | 60% | 30% | 10% | Low | Capital preservation, stable returns |\n";
        output += "| \u2696\uFE0F **Balanced** | 50% | 30% | 20% | Medium | Balanced growth and stability |\n";
        output += "| \uD83D\uDE80 **Aggressive** | 30% | 40% | 30% | High | Maximum growth potential |\n\n";
        // Conservative Approach
        output += "---\n\n## \uD83D\uDEE1\uFE0F CONSERVATIVE APPROACH (60-30-10)\n";
        output += "**Best for:** First-time investors, risk-averse investors, those nearing retirement\n\n";
        output += this.formatSingleApproachForDisplay(approaches.conservative, 'Conservative');
        // Balanced Approach  
        output += "\n---\n\n## \u2696\uFE0F BALANCED APPROACH (50-30-20)\n";
        output += "**Best for:** Most investors seeking growth with manageable risk\n\n";
        output += this.formatSingleApproachForDisplay(approaches.balanced, 'Balanced');
        // Aggressive Approach
        output += "\n---\n\n## \uD83D\uDE80 AGGRESSIVE APPROACH (30-40-30)\n";
        output += "**Best for:** Young investors, high risk tolerance, long-term wealth building\n\n";
        output += this.formatSingleApproachForDisplay(approaches.aggressive, 'Aggressive');
        // Conclusion
        output += "\n---\n\n## \uD83C\uDFAF Recommendation Summary\n\n";
        output += "- **New to investing?** Start with **Conservative** approach\n";
        output += "- **Want balanced growth?** Go with **Balanced** approach\n";
        output += "- **Seeking maximum returns?** Consider **Aggressive** approach\n\n";
        output += "**Remember:** You can always adjust your strategy as your experience and risk tolerance evolve!\n\n";
        return output;
    };
    /**
     * Format single approach for display (simplified version)
     */
    PortfolioAllocationService.formatSingleApproachForDisplay = function (response, approachName) {
        var output = '';
        // Allocation Summary
        var totalAllocated = response.allocation_table.reduce(function (sum, item) {
            var amount = parseFloat(item.amount.replace(/[₹,]/g, ''));
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        output += "**Total Allocated:** \u20B9".concat(this.formatCurrency(totalAllocated), "\n\n");
        // Allocation Table
        output += "| Stock | Sector | Investment Details | Reasoning |\n";
        output += "|-------|--------|------------------|----------|\n";
        response.allocation_table.forEach(function (allocation) {
            output += "| ".concat(allocation.stock, " | ").concat(allocation.sector, " | ").concat(allocation.amount, " | ").concat(allocation.reasoning, " |\n");
        });
        return output;
    };
    PortfolioAllocationService.formatResponseForDisplay = function (response) {
        var output = '';
        // Executive Summary
        output += "## \uD83D\uDCCA Investment Recommendation for ".concat(response.executive_summary.investment_amount, "\n\n");
        output += "**Investment Type:** ".concat(response.executive_summary.investment_type, "\n");
        output += "**Strategy:** ".concat(response.executive_summary.strategy_overview, "\n");
        output += "**Timeline:** ".concat(response.executive_summary.expected_timeline, "\n\n");
        // Market Analysis
        output += "## \uD83C\uDFAF Current Market Analysis\n\n";
        output += "**Market Sentiment:** ".concat(response.market_analysis.current_sentiment, "\n");
        output += "**Trending Sectors:** ".concat(response.market_analysis.trending_sectors.join(', '), "\n\n");
        response.market_analysis.market_highlights.forEach(function (highlight, index) {
            output += "".concat(index + 1, ". ").concat(highlight, "\n");
        });
        output += '\n';
        // Recommended Allocation Table
        output += "## \uD83D\uDCBC Suggested Portfolio Allocation\n\n";
        // Calculate and display allocation summary
        var totalAllocated = response.allocation_table.reduce(function (sum, item) {
            var amount = parseFloat(item.amount.replace(/[₹,]/g, ''));
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        output += "**Total Investment:** ".concat(response.executive_summary.investment_amount, "\n");
        output += "**Total Allocated:** \u20B9".concat(this.formatCurrency(totalAllocated), "\n\n");
        output += "| Stock | Sector | Investment Details | Reasoning |\n";
        output += "|-------|--------|------------------|----------|\n";
        response.allocation_table.forEach(function (allocation) {
            output += "| ".concat(allocation.stock, " | ").concat(allocation.sector, " | ").concat(allocation.amount, " | ").concat(allocation.reasoning, " |\n");
        });
        output += '\n';
        // Large Cap Recommendations
        if (response.recommended_allocation.large_cap_stocks.length > 0) {
            output += "### \uD83C\uDFE2 Large Cap Stocks (Stability Focus)\n\n";
            response.recommended_allocation.large_cap_stocks.forEach(function (stock, index) {
                output += "**".concat(index + 1, ". ").concat(stock.stock, "** - ").concat(stock.sector, "\n");
                output += "- **Current Price:** \u20B9".concat(stock.current_price, "\n");
                output += "- **Allocation:** ".concat(stock.suggested_allocation, "\n");
                output += "- **Rationale:** ".concat(stock.rationale, "\n\n");
            });
        }
        // Mid Cap Recommendations
        if (response.recommended_allocation.mid_cap_stocks.length > 0) {
            output += "### \uD83D\uDE80 Mid Cap Stocks (Growth Focus)\n\n";
            response.recommended_allocation.mid_cap_stocks.forEach(function (stock, index) {
                output += "**".concat(index + 1, ". ").concat(stock.stock, "** - ").concat(stock.sector, "\n");
                output += "- **Current Price:** \u20B9".concat(stock.current_price, "\n");
                output += "- **Allocation:** ".concat(stock.suggested_allocation, "\n");
                output += "- **Rationale:** ".concat(stock.rationale, "\n\n");
            });
        }
        // Small Cap Recommendations
        if (response.recommended_allocation.small_cap_stocks.length > 0) {
            output += "### \uD83D\uDC8E Small Cap Stocks (High Growth Potential)\n\n";
            response.recommended_allocation.small_cap_stocks.forEach(function (stock, index) {
                output += "**".concat(index + 1, ". ").concat(stock.stock, "** - ").concat(stock.sector, "\n");
                output += "- **Current Price:** \u20B9".concat(stock.current_price, "\n");
                output += "- **Allocation:** ".concat(stock.suggested_allocation, "\n");
                output += "- **Rationale:** ".concat(stock.rationale, "\n\n");
            });
        }
        // Investment Strategy
        output += "## \uD83D\uDCC8 Investment Strategy\n\n";
        output += "**Strategy Type:** ".concat(response.investment_strategy.strategy_type, "\n");
        output += "**Risk Level:** ".concat(response.investment_strategy.risk_level, "\n\n");
        output += "### Key Benefits:\n";
        response.investment_strategy.key_benefits.forEach(function (benefit, index) {
            output += "".concat(index + 1, ". ").concat(benefit, "\n");
        });
        output += '\n';
        output += "### Suggested Approach:\n";
        response.investment_strategy.suggested_approach.forEach(function (approach, index) {
            output += "".concat(index + 1, ". ").concat(approach, "\n");
        });
        output += '\n';
        // SIP Strategy (if applicable)
        if (response.sip_strategy.length > 0) {
            output += "## \uD83D\uDCC5 SIP Implementation Strategy\n\n";
            response.sip_strategy.forEach(function (strategy, index) {
                output += "**".concat(strategy.month, ":**\n");
                output += "- Stocks: ".concat(strategy.stocks_to_buy.join(', '), "\n");
                output += "- Amount per stock: ".concat(strategy.amount_per_stock, "\n");
                output += "- Total: ".concat(strategy.total_allocation, "\n\n");
            });
        }
        // Risk Management
        output += "## \u26A0\uFE0F Risk Management\n\n";
        output += "**Diversification:** ".concat(response.risk_management.diversification_approach, "\n");
        output += "**Stop Loss:** ".concat(response.risk_management.stop_loss_strategy, "\n");
        output += "**Review Frequency:** ".concat(response.risk_management.portfolio_review, "\n\n");
        output += "### Risk Mitigation Strategies:\n";
        response.risk_management.risk_mitigation.forEach(function (mitigation, index) {
            output += "".concat(index + 1, ". ").concat(mitigation, "\n");
        });
        output += '\n';
        // Tax Considerations
        output += "## \uD83D\uDCB0 Tax Implications\n\n";
        output += "**Investment Type:** ".concat(response.tax_considerations.investment_type, "\n");
        output += "**Holding Strategy:** ".concat(response.tax_considerations.holding_strategy, "\n\n");
        output += "### Tax Benefits:\n";
        response.tax_considerations.tax_benefits.forEach(function (benefit, index) {
            output += "".concat(index + 1, ". ").concat(benefit, "\n");
        });
        output += '\n';
        // Next Steps
        output += "## \uD83C\uDFAF Next Steps\n\n";
        output += "### Immediate Actions:\n";
        response.next_steps.immediate_actions.forEach(function (action, index) {
            output += "".concat(index + 1, ". ").concat(action, "\n");
        });
        output += '\n';
        output += "### Recommended Platforms:\n";
        response.next_steps.platform_suggestions.forEach(function (platform, index) {
            output += "".concat(index + 1, ". ").concat(platform, "\n");
        });
        output += '\n';
        output += "### Monitoring Approach:\n";
        response.next_steps.monitoring_approach.forEach(function (approach, index) {
            output += "".concat(index + 1, ". ").concat(approach, "\n");
        });
        output += '\n';
        // Disclaimer
        output += "## \u26A0\uFE0F Important Disclaimer\n\n";
        output += response.disclaimer;
        return output;
    };
    // Helper methods
    /**
     * Categorize stocks using real-time screener.in data for accurate market cap classification
     */
    PortfolioAllocationService.categorizeStocksByMarketCapWithScreener = function (stockQuotes, trendingStocks) {
        return __awaiter(this, void 0, void 0, function () {
            var qualityStocks, largeCap, midCap, smallCap, _loop_1, this_1, _i, qualityStocks_1, quote, sortStocks, sortedLargeCap, sortedMidCap, sortedSmallCap;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qualityStocks = stockQuotes.filter(function (quote) {
                            // Filter criteria for quality stocks
                            return quote.currentPrice >= 50 && // Minimum ₹50 to avoid penny stocks
                                quote.volume > 100000 && // Minimum trading volume
                                quote.symbol.length <= 12; // Avoid obscure symbols
                        });
                        console.log("\uD83D\uDD0D Filtered ".concat(qualityStocks.length, " quality stocks from ").concat(stockQuotes.length, " total stocks"));
                        largeCap = [];
                        midCap = [];
                        smallCap = [];
                        _loop_1 = function (quote) {
                            var ScreenerDataService, screenerData, marketCapCategory, trendingStock, stockData, error_1, marketCapCategory;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 3, , 4]);
                                        console.log("\uD83D\uDCCA Fetching screener.in data for ".concat(quote.symbol, "..."));
                                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./screenerDataService')); })];
                                    case 1:
                                        ScreenerDataService = (_b.sent()).ScreenerDataService;
                                        return [4 /*yield*/, ScreenerDataService.getFinancialMetrics(quote.symbol)];
                                    case 2:
                                        screenerData = _b.sent();
                                        marketCapCategory = void 0;
                                        if (screenerData === null || screenerData === void 0 ? void 0 : screenerData.marketCap) {
                                            // Parse market cap from screener.in (e.g., "₹7,758 Cr" or "₹1.2 L Cr")
                                            marketCapCategory = this_1.parseMarketCapCategory(screenerData.marketCap);
                                            console.log("\u2705 ".concat(quote.symbol, ": ").concat(screenerData.marketCap, " \u2192 ").concat(marketCapCategory));
                                        }
                                        else {
                                            trendingStock = trendingStocks.find(function (ts) { return ts.symbol === quote.symbol; });
                                            marketCapCategory = (trendingStock === null || trendingStock === void 0 ? void 0 : trendingStock.marketCap) || this_1.determineMarketCapFromCompany(quote.symbol, quote.currentPrice);
                                            console.log("\u26A0\uFE0F ".concat(quote.symbol, ": Using fallback \u2192 ").concat(marketCapCategory));
                                        }
                                        stockData = __assign(__assign({}, quote), { marketCapCategory: marketCapCategory, screenerData: screenerData, reason: screenerData ? 'Strong fundamentals with verified financial metrics' : 'Strong market performance' });
                                        if (marketCapCategory === 'LARGE_CAP') {
                                            largeCap.push(stockData);
                                        }
                                        else if (marketCapCategory === 'MID_CAP') {
                                            midCap.push(stockData);
                                        }
                                        else {
                                            smallCap.push(stockData);
                                        }
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_1 = _b.sent();
                                        console.error("\u274C Error fetching screener data for ".concat(quote.symbol, ":"), error_1);
                                        marketCapCategory = this_1.determineMarketCapFromCompany(quote.symbol, quote.currentPrice);
                                        smallCap.push(__assign(__assign({}, quote), { marketCapCategory: marketCapCategory, reason: 'Market performance (limited fundamental data)' }));
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, qualityStocks_1 = qualityStocks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < qualityStocks_1.length)) return [3 /*break*/, 4];
                        quote = qualityStocks_1[_i];
                        return [5 /*yield**/, _loop_1(quote)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        sortStocks = function (stocks) {
                            return stocks.sort(function (a, b) {
                                // Prefer stocks with screener.in data and good fundamentals
                                var scoreA = _this.calculateQualityScore(a);
                                var scoreB = _this.calculateQualityScore(b);
                                return scoreB - scoreA;
                            });
                        };
                        sortedLargeCap = sortStocks(largeCap);
                        sortedMidCap = sortStocks(midCap);
                        sortedSmallCap = sortStocks(smallCap);
                        console.log("\uD83D\uDCCA Categorized stocks with screener.in data: ".concat(sortedLargeCap.length, " Large, ").concat(sortedMidCap.length, " Mid, ").concat(sortedSmallCap.length, " Small"));
                        return [2 /*return*/, {
                                largeCap: sortedLargeCap.slice(0, 4),
                                midCap: sortedMidCap.slice(0, 3),
                                smallCap: sortedSmallCap.slice(0, 2) // Top 2 small cap
                            }];
                }
            });
        });
    };
    /**
     * Legacy method for backwards compatibility - now calls the screener-enhanced version
     */
    PortfolioAllocationService.categorizeStocksByMarketCap = function (stockQuotes, trendingStocks) {
        // For now, call the async version - in production, this should be refactored
        return this.categorizeStocksByMarketCapWithScreener(stockQuotes, trendingStocks);
    };
    PortfolioAllocationService.createAllocation = function (investmentAmount, categorizedStocks, customAllocation) {
        var _this = this;
        var allocation = [];
        // Use custom allocation or default percentages
        var largeCapPercent = ((customAllocation === null || customAllocation === void 0 ? void 0 : customAllocation.large) || 50) / 100;
        var midCapPercent = ((customAllocation === null || customAllocation === void 0 ? void 0 : customAllocation.mid) || 30) / 100;
        var smallCapPercent = ((customAllocation === null || customAllocation === void 0 ? void 0 : customAllocation.small) || 20) / 100;
        var largeCapAmount = investmentAmount * largeCapPercent;
        var midCapAmount = investmentAmount * midCapPercent;
        var smallCapAmount = investmentAmount * smallCapPercent;
        var totalAllocated = 0;
        var skippedAmount = 0;
        console.log("\uD83D\uDCB0 Allocating \u20B9".concat(investmentAmount, ": Large \u20B9").concat(largeCapAmount.toFixed(0), ", Mid \u20B9").concat(midCapAmount.toFixed(0), ", Small \u20B9").concat(smallCapAmount.toFixed(0)));
        // Large Cap Allocation with smart skipping
        if (categorizedStocks.largeCap.length > 0) {
            var perLargeCapStock_1 = largeCapAmount / categorizedStocks.largeCap.length;
            categorizedStocks.largeCap.forEach(function (stock) {
                var shareCalc = _this.calculateOptimalShares(stock.currentPrice, perLargeCapStock_1, investmentAmount);
                if (shareCalc.isAffordable && shareCalc.shares > 0) {
                    allocation.push({
                        stock: "".concat(stock.companyName, " (").concat(stock.symbol, ")"),
                        sector: _this.determineSector(stock.companyName),
                        amount: shareCalc.displayAmount,
                        reasoning: _this.generateStockReasoning(stock, 'Large Cap')
                    });
                    totalAllocated += shareCalc.actualAmount;
                }
                else {
                    console.log("\uD83D\uDEAB Skipping ".concat(stock.symbol, ": ").concat(shareCalc.displayAmount));
                    skippedAmount += perLargeCapStock_1;
                }
            });
        }
        // Mid Cap Allocation with smart skipping
        if (categorizedStocks.midCap.length > 0) {
            var perMidCapStock_1 = midCapAmount / categorizedStocks.midCap.length;
            categorizedStocks.midCap.forEach(function (stock) {
                var shareCalc = _this.calculateOptimalShares(stock.currentPrice, perMidCapStock_1, investmentAmount);
                if (shareCalc.isAffordable && shareCalc.shares > 0) {
                    allocation.push({
                        stock: "".concat(stock.companyName, " (").concat(stock.symbol, ")"),
                        sector: _this.determineSector(stock.companyName),
                        amount: shareCalc.displayAmount,
                        reasoning: _this.generateStockReasoning(stock, 'Mid Cap')
                    });
                    totalAllocated += shareCalc.actualAmount;
                }
                else {
                    console.log("\uD83D\uDEAB Skipping ".concat(stock.symbol, ": ").concat(shareCalc.displayAmount));
                    skippedAmount += perMidCapStock_1;
                }
            });
        }
        // Small Cap Allocation with smart skipping
        if (categorizedStocks.smallCap.length > 0) {
            var perSmallCapStock_1 = smallCapAmount / categorizedStocks.smallCap.length;
            categorizedStocks.smallCap.forEach(function (stock) {
                var shareCalc = _this.calculateOptimalShares(stock.currentPrice, perSmallCapStock_1, investmentAmount);
                if (shareCalc.isAffordable && shareCalc.shares > 0) {
                    allocation.push({
                        stock: "".concat(stock.companyName, " (").concat(stock.symbol, ")"),
                        sector: _this.determineSector(stock.companyName),
                        amount: shareCalc.displayAmount,
                        reasoning: _this.generateStockReasoning(stock, 'Small Cap')
                    });
                    totalAllocated += shareCalc.actualAmount;
                }
                else {
                    console.log("\uD83D\uDEAB Skipping ".concat(stock.symbol, ": ").concat(shareCalc.displayAmount));
                    skippedAmount += perSmallCapStock_1;
                }
            });
        }
        console.log("\uD83D\uDCCA Allocation Summary: Allocated \u20B9".concat(totalAllocated.toFixed(0), " of \u20B9").concat(investmentAmount, " (").concat(((totalAllocated / investmentAmount) * 100).toFixed(1), "%)"));
        if (skippedAmount > 0) {
            console.log("\u26A0\uFE0F Skipped \u20B9".concat(skippedAmount.toFixed(0), " due to expensive stocks"));
        }
        // Add summary comment if significantly under-allocated
        if (totalAllocated < investmentAmount * 0.8) {
            allocation.push({
                stock: '📝 Portfolio Note',
                sector: 'Summary',
                amount: "\u20B9".concat((investmentAmount - totalAllocated).toFixed(0), " remaining"),
                reasoning: 'Some stocks were too expensive for allocation. Consider lower-priced alternatives or increase budget for expensive stocks.'
            });
        }
        return allocation;
    };
    /**
     * Calculate optimal share quantities with intelligent allocation logic
     */
    PortfolioAllocationService.calculateOptimalShares = function (sharePrice, idealAmount, totalInvestment) {
        // SMART LOGIC: If stock price is more than 80% of allocation, it's too expensive
        if (sharePrice > idealAmount * 0.8) {
            return {
                shares: 0,
                actualAmount: 0,
                displayAmount: "Skip (\u20B9".concat(this.formatCurrency(sharePrice), " per share - exceeds 80% of \u20B9").concat(this.formatCurrency(idealAmount), " allocation)"),
                isAffordable: false
            };
        }
        // SMART LOGIC: If stock price is more than 50% of allocation, buy only 1 share
        if (sharePrice > idealAmount * 0.5) {
            return {
                shares: 1,
                actualAmount: sharePrice,
                displayAmount: "1 share = \u20B9".concat(this.formatCurrency(sharePrice), " (50%+ of allocation)"),
                isAffordable: true
            };
        }
        // OPTIMAL LOGIC: Calculate best whole number of shares within allocation
        var maxAffordableShares = Math.floor(idealAmount / sharePrice);
        var optimalShares = Math.max(1, maxAffordableShares);
        var actualAmount = optimalShares * sharePrice;
        // Ensure we don't exceed allocation by more than 20%
        if (actualAmount > idealAmount * 1.2) {
            var conservativeShares = Math.floor(idealAmount / sharePrice);
            var conservativeAmount = conservativeShares * sharePrice;
            return {
                shares: conservativeShares,
                actualAmount: conservativeAmount,
                displayAmount: "".concat(conservativeShares, " share").concat(conservativeShares > 1 ? 's' : '', " = \u20B9").concat(this.formatCurrency(conservativeAmount)),
                isAffordable: conservativeShares > 0
            };
        }
        return {
            shares: optimalShares,
            actualAmount: actualAmount,
            displayAmount: "".concat(optimalShares, " share").concat(optimalShares > 1 ? 's' : '', " = \u20B9").concat(this.formatCurrency(actualAmount)),
            isAffordable: true
        };
    };
    PortfolioAllocationService.createPortfolioStock = function (stock, marketCap) {
        return {
            stock: "".concat(stock.companyName, " (").concat(stock.symbol, ")"),
            sector: this.determineSector(stock.companyName),
            suggested_allocation: this.calculateAllocationPercent(marketCap),
            rationale: stock.reason || this.generateGenericRationale(marketCap),
            current_price: stock.currentPrice,
            market_cap: marketCap
        };
    };
    PortfolioAllocationService.createSIPStrategy = function (investmentAmount, categorizedStocks) {
        var strategy = [];
        var monthlyAmount = investmentAmount;
        var totalStocks = categorizedStocks.largeCap.length + categorizedStocks.midCap.length + categorizedStocks.smallCap.length;
        if (totalStocks === 0)
            return strategy;
        var amountPerStock = monthlyAmount / Math.min(totalStocks, 3); // Max 3 stocks per month
        // Create 3 month strategy
        for (var month = 1; month <= 3; month++) {
            var monthStocks = [];
            if (month === 1 && categorizedStocks.largeCap.length > 0) {
                monthStocks.push("".concat(categorizedStocks.largeCap[0].companyName, " (").concat(categorizedStocks.largeCap[0].symbol, ")"));
                if (categorizedStocks.midCap.length > 0) {
                    monthStocks.push("".concat(categorizedStocks.midCap[0].companyName, " (").concat(categorizedStocks.midCap[0].symbol, ")"));
                }
            }
            else if (month === 2) {
                if (categorizedStocks.largeCap.length > 1) {
                    monthStocks.push("".concat(categorizedStocks.largeCap[1].companyName, " (").concat(categorizedStocks.largeCap[1].symbol, ")"));
                }
                if (categorizedStocks.smallCap.length > 0) {
                    monthStocks.push("".concat(categorizedStocks.smallCap[0].companyName, " (").concat(categorizedStocks.smallCap[0].symbol, ")"));
                }
            }
            else if (month === 3) {
                if (categorizedStocks.midCap.length > 1) {
                    monthStocks.push("".concat(categorizedStocks.midCap[1].companyName, " (").concat(categorizedStocks.midCap[1].symbol, ")"));
                }
                if (categorizedStocks.largeCap.length > 2) {
                    monthStocks.push("".concat(categorizedStocks.largeCap[2].companyName, " (").concat(categorizedStocks.largeCap[2].symbol, ")"));
                }
            }
            if (monthStocks.length > 0) {
                strategy.push({
                    month: "Month ".concat(month),
                    stocks_to_buy: monthStocks,
                    amount_per_stock: "\u20B9".concat(this.formatCurrency(amountPerStock)),
                    total_allocation: "\u20B9".concat(this.formatCurrency(monthlyAmount))
                });
            }
        }
        return strategy;
    };
    // Utility methods
    PortfolioAllocationService.formatCurrency = function (amount) {
        return new Intl.NumberFormat('en-IN').format(Math.round(amount));
    };
    /**
     * Parse market cap category from screener.in market cap string
     * Examples: "₹7,758 Cr" → MID_CAP, "₹1.2 L Cr" → LARGE_CAP
     */
    PortfolioAllocationService.parseMarketCapCategory = function (marketCapStr) {
        // Remove currency symbol and normalize
        var cleanStr = marketCapStr.replace(/[₹,]/g, '').trim().toUpperCase();
        // Extract numeric value and unit
        var match = cleanStr.match(/(\d+(?:\.\d+)?)\s*([A-Z]+)/);
        if (!match)
            return 'SMALL_CAP';
        var value = parseFloat(match[1]);
        var unit = match[2];
        // Convert to crores for comparison
        var crores;
        if (unit.includes('L')) {
            // Lakh crores (L Cr) = value * 100,000 crores
            crores = value * 100000;
        }
        else if (unit.includes('CR') || unit.includes('CRORE')) {
            // Just crores
            crores = value;
        }
        else {
            // Unknown unit, assume crores
            crores = value;
        }
        // Classification based on SEBI guidelines:
        // Large Cap: > ₹20,000 Cr market cap
        // Mid Cap: ₹5,000 Cr - ₹20,000 Cr
        // Small Cap: < ₹5,000 Cr
        if (crores > 20000) {
            return 'LARGE_CAP';
        }
        else if (crores > 5000) {
            return 'MID_CAP';
        }
        else {
            return 'SMALL_CAP';
        }
    };
    /**
     * Calculate quality score based on screener.in fundamentals
     */
    PortfolioAllocationService.calculateQualityScore = function (stock) {
        var score = 0;
        // Base score for having screener data
        if (stock.screenerData) {
            score += 10;
            // ROE score (higher is better)
            if (stock.screenerData.roe) {
                if (stock.screenerData.roe > 15)
                    score += 5;
                else if (stock.screenerData.roe > 10)
                    score += 3;
                else if (stock.screenerData.roe > 5)
                    score += 1;
            }
            // P/E ratio score (moderate is better)
            if (stock.screenerData.pe) {
                if (stock.screenerData.pe > 5 && stock.screenerData.pe < 25)
                    score += 5;
                else if (stock.screenerData.pe < 40)
                    score += 2;
            }
            // ROCE score
            if (stock.screenerData.roce) {
                if (stock.screenerData.roce > 15)
                    score += 5;
                else if (stock.screenerData.roce > 10)
                    score += 3;
            }
            // Debt-to-equity score (lower is better)
            if (stock.screenerData.debtToEquity !== undefined) {
                if (stock.screenerData.debtToEquity < 0.5)
                    score += 5;
                else if (stock.screenerData.debtToEquity < 1)
                    score += 3;
                else if (stock.screenerData.debtToEquity < 2)
                    score += 1;
            }
        }
        // Volume and price stability
        if (stock.volume > 500000)
            score += 3;
        if (stock.currentPrice > 100)
            score += 2;
        return score;
    };
    /**
     * Determine market cap based on company knowledge, not just stock price
     */
    PortfolioAllocationService.determineMarketCapFromCompany = function (symbol, price) {
        // Known large cap companies (market cap > ₹1 lakh crore)
        var largeCaps = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK',
            'LT', 'ITC', 'SBIN', 'BHARTIARTL', 'ASIANPAINT', 'AXISBANK', 'MARUTI',
            'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA', 'TITAN', 'NESTLEIND',
            'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC', 'TECHM', 'POWERGRID',
            'LTIM', 'NTPC', 'JSWSTEEL', 'TATAMOTORS', 'COALINDIA', 'GRASIM',
            'HINDALCO', 'ADANIENT', 'INDUSINDBK', 'HDFCLIFE', 'SBILIFE'
        ];
        // Known mid cap companies (market cap ₹20K-₹1L crore)
        var midCaps = [
            'CIPLA', 'BPCL', 'TATACONSUM', 'EICHERMOT', 'APOLLOHOSP', 'BRITANNIA',
            'DIVISLAB', 'ADANIPORTS', 'HEROMOTOCO', 'DRREDDY', 'UPL', 'BAJAJ-AUTO',
            'SHRIRAMFIN', 'GODREJCP', 'PIDILITIND', 'DABUR', 'MARICO', 'MCDOWELL-N',
            'COLPAL', 'BERGEPAINT', 'TRENT', 'PAGEIND', 'HAVELLS', 'VOLTAS',
            'CUMMINSIND', 'MPHASIS', 'PERSISTENT', 'COFORGE', 'MINDTREE'
        ];
        if (largeCaps.includes(symbol)) {
            return 'LARGE_CAP';
        }
        else if (midCaps.includes(symbol)) {
            return 'MID_CAP';
        }
        else {
            // For unknown companies, use price as a rough indicator with higher thresholds
            if (price > 1500)
                return 'LARGE_CAP';
            if (price > 200)
                return 'MID_CAP';
            return 'SMALL_CAP';
        }
    };
    PortfolioAllocationService.determineMarketCapFromPrice = function (price) {
        // Legacy method - still used as fallback
        if (price > 1500)
            return 'LARGE_CAP';
        if (price > 200)
            return 'MID_CAP';
        return 'SMALL_CAP';
    };
    PortfolioAllocationService.determineSector = function (companyName) {
        var sectors = {
            'Banking & Finance': ['hdfc', 'icici', 'sbi', 'kotak', 'axis', 'bank'],
            'Information Technology': ['tcs', 'infosys', 'wipro', 'tech mahindra', 'hcl tech'],
            'Automobile': ['maruti', 'tata motors', 'mahindra', 'bajaj', 'hero motocorp'],
            'Pharmaceuticals': ['sun pharma', 'cipla', 'lupin', 'biocon', 'dr reddy'],
            'Energy & Power': ['reliance', 'ongc', 'coal india', 'power grid', 'ntpc'],
            'FMCG': ['hindustan unilever', 'itc', 'nestle', 'britannia', 'godrej'],
            'Telecommunications': ['bharti airtel', 'vodafone idea', 'jio']
        };
        var lowerName = companyName.toLowerCase();
        for (var _i = 0, _a = Object.entries(sectors); _i < _a.length; _i++) {
            var _b = _a[_i], sector = _b[0], keywords = _b[1];
            if (keywords.some(function (keyword) { return lowerName.includes(keyword); })) {
                return sector;
            }
        }
        return 'Diversified';
    };
    PortfolioAllocationService.generateStockReasoning = function (stock, marketCap) {
        var reasonings = {
            'Large Cap': [
                'Stable dividend yield and consistent performance',
                'Strong fundamentals and market leadership',
                'Lower volatility with steady growth potential'
            ],
            'Mid Cap': [
                'Strong growth trajectory with expanding market share',
                'Good balance of growth potential and stability',
                'Benefiting from sector tailwinds and expansion'
            ],
            'Small Cap': [
                'High growth potential with emerging market opportunities',
                'Innovative business model with scalable operations',
                'Early stage growth with significant upside potential'
            ]
        };
        var options = reasonings[marketCap] || reasonings['Mid Cap'];
        return options[Math.floor(Math.random() * options.length)];
    };
    PortfolioAllocationService.calculateAllocationPercent = function (marketCap) {
        var allocations = {
            'Large Cap': '20-25%',
            'Mid Cap': '15-20%',
            'Small Cap': '8-12%'
        };
        return allocations[marketCap];
    };
    PortfolioAllocationService.generateGenericRationale = function (marketCap) {
        var rationales = {
            'Large Cap': 'Established market leader with strong fundamentals',
            'Mid Cap': 'Growth-oriented company with expanding market presence',
            'Small Cap': 'High growth potential with innovative business approach'
        };
        return rationales[marketCap];
    };
    PortfolioAllocationService.generateStrategyOverview = function (amount, frequency, sentiment) {
        var amountStr = amount < 50000 ? 'conservative diversified approach' : 'balanced growth strategy';
        var sentimentStr = sentiment === 'BULLISH' ? 'taking advantage of positive market momentum' : 'focusing on fundamentally strong stocks';
        return "".concat(amountStr, " ").concat(sentimentStr, " across market cap segments");
    };
    PortfolioAllocationService.formatMarketSentiment = function (sentiment) {
        var sentiments = {
            'BULLISH': '📈 Bullish - Positive market momentum with growth opportunities',
            'BEARISH': '📉 Bearish - Cautious approach recommended with defensive positioning',
            'MIXED': '📊 Mixed - Selective stock picking with balanced risk approach'
        };
        return sentiments[sentiment] || sentiments['MIXED'];
    };
    PortfolioAllocationService.extractTrendingSectors = function (trendingStocks) {
        var sectors = new Set(trendingStocks.map(function (stock) { return stock.sector; }));
        return Array.from(sectors).slice(0, 5);
    };
    PortfolioAllocationService.generateMarketHighlights = function (trendingStocks, sentiment) {
        var highlights = [];
        if (sentiment === 'BULLISH') {
            highlights.push('Strong sectoral rotation driving momentum');
            highlights.push('Institutional buying supporting market levels');
        }
        else if (sentiment === 'BEARISH') {
            highlights.push('Market consolidation phase with selective opportunities');
            highlights.push('Focus on quality stocks with strong fundamentals');
        }
        else {
            highlights.push('Mixed signals requiring careful stock selection');
            highlights.push('Earnings growth driving individual stock performance');
        }
        highlights.push("".concat(trendingStocks.length, " stocks showing strong momentum across sectors"));
        return highlights;
    };
    PortfolioAllocationService.determineStrategyType = function (amount, frequency) {
        if (frequency === 'SIP') {
            return amount < 10000 ? 'Conservative SIP Strategy' : 'Aggressive SIP Growth Strategy';
        }
        else {
            return amount < 50000 ? 'Focused Value Strategy' : 'Diversified Growth Strategy';
        }
    };
    PortfolioAllocationService.generateKeyBenefits = function (frequency, sentiment) {
        var benefits = [];
        if (frequency === 'SIP') {
            benefits.push('Rupee cost averaging reduces volatility impact');
            benefits.push('Disciplined investment approach builds long-term wealth');
            benefits.push('Lower entry barrier with gradual portfolio building');
        }
        else {
            benefits.push('Immediate market exposure to capitalize on opportunities');
            benefits.push('Full diversification from day one');
            benefits.push('Flexibility to time market entries');
        }
        if (sentiment === 'BULLISH') {
            benefits.push('Positioned to benefit from positive market momentum');
        }
        return benefits;
    };
    PortfolioAllocationService.determineRiskLevel = function (amount, frequency) {
        if (amount < 25000 && frequency === 'SIP')
            return 'Moderate Risk';
        if (amount > 100000)
            return 'Moderate to High Risk';
        return 'Moderate Risk';
    };
    PortfolioAllocationService.generateSuggestedApproach = function (frequency, amount) {
        var approaches = [];
        if (frequency === 'SIP') {
            approaches.push('Start with 2-3 stocks in first month, gradually add more');
            approaches.push('Focus on large-cap stocks initially for stability');
            approaches.push('Add mid and small-cap exposure after 2-3 months');
        }
        else {
            approaches.push('Invest across all market cap segments simultaneously');
            approaches.push('Maintain 50-60% in large-cap for stability');
            approaches.push('Monitor and rebalance quarterly');
        }
        approaches.push('Set stop-loss levels at 8-10% below entry price');
        approaches.push('Review portfolio performance monthly');
        return approaches;
    };
    PortfolioAllocationService.generateDiversificationApproach = function (categorizedStocks) {
        var _this = this;
        var totalStocks = categorizedStocks.largeCap.length + categorizedStocks.midCap.length + categorizedStocks.smallCap.length;
        return "".concat(totalStocks, "-stock diversification across ").concat(new Set(__spreadArray(__spreadArray(__spreadArray([], categorizedStocks.largeCap, true), categorizedStocks.midCap, true), categorizedStocks.smallCap, true).map(function (stock) { return _this.determineSector(stock.companyName); })).size, " sectors");
    };
    PortfolioAllocationService.generateStopLossStrategy = function (amount) {
        if (amount < 50000) {
            return '8-10% stop-loss with trailing stop as profits grow';
        }
        else {
            return '10-12% stop-loss with sector-wise risk management';
        }
    };
    PortfolioAllocationService.generateRiskMitigation = function (sentiment, amount) {
        var mitigations = [
            'Diversification across market cap and sectors',
            'Position sizing to limit single stock exposure',
            'Regular portfolio review and rebalancing'
        ];
        if (sentiment === 'BEARISH') {
            mitigations.push('Increased cash position for buying opportunities');
            mitigations.push('Focus on defensive sectors during market stress');
        }
        if (amount > 100000) {
            mitigations.push('Staggered entry over 2-3 sessions to average price');
        }
        return mitigations;
    };
    PortfolioAllocationService.generateTaxBenefits = function () {
        return [
            'LTCG tax exemption up to ₹1 lakh per financial year',
            'No tax on dividends received from stocks',
            'Tax loss harvesting opportunities for portfolio optimization',
            'Indexation benefits not applicable but lower LTCG rate of 10%'
        ];
    };
    PortfolioAllocationService.generateImmediateActions = function (frequency) {
        var actions = [
            'Open Demat and Trading account with a reliable broker',
            'Complete KYC and bank account linking',
            'Set up fund transfer methods (UPI/Net Banking)'
        ];
        if (frequency === 'SIP') {
            actions.push('Set up SIP mandates for automated investments');
            actions.push('Schedule monthly investment dates');
        }
        else {
            actions.push('Plan entry timing over 1-2 sessions');
            actions.push('Prepare watchlist and price targets');
        }
        return actions;
    };
    PortfolioAllocationService.generatePlatformSuggestions = function () {
        return [
            'Zerodha - Low brokerage with good research tools',
            'Groww - User-friendly interface ideal for beginners',
            'Upstox - Competitive pricing with advanced features',
            'Angel One - Comprehensive research and advisory services'
        ];
    };
    PortfolioAllocationService.generateMonitoringApproach = function (frequency) {
        var approaches = [
            'Track portfolio performance using mobile apps',
            'Set price alerts for major movements',
            'Follow quarterly earnings and annual reports'
        ];
        if (frequency === 'SIP') {
            approaches.push('Monthly SIP execution review');
            approaches.push('Quarterly portfolio rebalancing assessment');
        }
        else {
            approaches.push('Weekly performance review');
            approaches.push('Monthly rebalancing consideration');
        }
        return approaches;
    };
    PortfolioAllocationService.generateDisclaimer = function () {
        return "**Investment Advisory Notice:** This recommendation is based on comprehensive analysis of real-time market data, technical indicators, and fundamental research. All investments carry inherent market risks, and returns are not guaranteed. Please align investments with your risk tolerance, financial goals, and investment timeline. Consider consulting a qualified financial advisor for personalized advice. Conduct thorough due diligence before making investment decisions.";
    };
    /**
     * NEW INTELLIGENT SYSTEM: Generate recommendations using MongoDB-based intelligent portfolio engine
     */
    PortfolioAllocationService.generateIntelligentRecommendations = function (investmentAmount, frequency) {
        if (frequency === void 0) { frequency = 'LUMP_SUM'; }
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, conservative, balanced, aggressive, dataStatus, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Generating intelligent portfolio recommendations for \u20B9".concat(investmentAmount.toLocaleString('en-IN'), "..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Ensure data freshness
                        return [4 /*yield*/, intelligentPortfolioEngine_1["default"].ensureDataFreshness()];
                    case 2:
                        // Ensure data freshness
                        _a.sent();
                        return [4 /*yield*/, intelligentPortfolioEngine_1["default"].generateMultipleStrategies(investmentAmount, 4)];
                    case 3:
                        recommendations = _a.sent();
                        conservative = this.convertIntelligentToLegacyFormat(recommendations.conservative, frequency);
                        balanced = this.convertIntelligentToLegacyFormat(recommendations.balanced, frequency);
                        aggressive = this.convertIntelligentToLegacyFormat(recommendations.aggressive, frequency);
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStats()];
                    case 4:
                        dataStatus = _a.sent();
                        console.log("\u2705 Intelligent recommendations generated using ".concat(dataStatus.stocksWithFundamentals, " stocks with fundamentals"));
                        return [2 /*return*/, {
                                conservative: conservative,
                                balanced: balanced,
                                aggressive: aggressive,
                                dataStatus: dataStatus
                            }];
                    case 5:
                        error_2 = _a.sent();
                        console.error("\u274C Error generating intelligent recommendations:", error_2);
                        console.log("\uD83D\uDD04 Falling back to legacy recommendation system...");
                        // Fallback to legacy system
                        throw new Error("Intelligent recommendation system temporarily unavailable. Please try again.");
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert intelligent portfolio recommendation to legacy format
     */
    PortfolioAllocationService.convertIntelligentToLegacyFormat = function (recommendation, frequency) {
        var _a;
        // Convert stock recommendations to PortfolioStock format
        var convertToPortfolioStocks = function (stocks, marketCapType) {
            return stocks.map(function (stock) { return ({
                stock: "".concat(stock.name, " (").concat(stock.symbol, ")"),
                sector: stock.sector,
                suggested_allocation: "".concat(stock.quantity, " share").concat(stock.quantity > 1 ? 's' : '', " = \u20B9").concat(stock.allocation.toLocaleString('en-IN')),
                rationale: stock.reasoning,
                current_price: stock.price,
                market_cap: marketCapType
            }); });
        };
        // Create allocation table
        var allocation = [];
        // Add large cap stocks to allocation table
        recommendation.categories.largeCap.stocks.forEach(function (stock) {
            allocation.push({
                stock: "".concat(stock.name, " (").concat(stock.symbol, ")"),
                sector: stock.sector,
                amount: "\u20B9".concat(stock.allocation.toLocaleString('en-IN')),
                reasoning: stock.reasoning
            });
        });
        // Add mid cap stocks to allocation table
        recommendation.categories.midCap.stocks.forEach(function (stock) {
            allocation.push({
                stock: "".concat(stock.name, " (").concat(stock.symbol, ")"),
                sector: stock.sector,
                amount: "\u20B9".concat(stock.allocation.toLocaleString('en-IN')),
                reasoning: stock.reasoning
            });
        });
        // Add small cap stocks to allocation table
        recommendation.categories.smallCap.stocks.forEach(function (stock) {
            allocation.push({
                stock: "".concat(stock.name, " (").concat(stock.symbol, ")"),
                sector: stock.sector,
                amount: "\u20B9".concat(stock.allocation.toLocaleString('en-IN')),
                reasoning: stock.reasoning
            });
        });
        // Calculate percentages for strategy overview
        var largePct = (recommendation.categories.largeCap.allocatedAmount / recommendation.totalAmount) * 100;
        var midPct = (recommendation.categories.midCap.allocatedAmount / recommendation.totalAmount) * 100;
        var smallPct = (recommendation.categories.smallCap.allocatedAmount / recommendation.totalAmount) * 100;
        var strategyName = largePct >= 60 ? 'Conservative' : smallPct >= 30 ? 'Aggressive' : 'Balanced';
        // Extract unique sectors for trending sectors
        var allStocks = __spreadArray(__spreadArray(__spreadArray([], recommendation.categories.largeCap.stocks, true), recommendation.categories.midCap.stocks, true), recommendation.categories.smallCap.stocks, true);
        var trendingSectors = Array.from(new Set(allStocks.map(function (stock) { return stock.sector; }))).slice(0, 5);
        return {
            executive_summary: {
                investment_amount: "\u20B9".concat(recommendation.totalAmount.toLocaleString('en-IN')),
                investment_type: frequency === 'SIP' ? 'Systematic Investment Plan (SIP)' : 'Lump Sum Investment',
                strategy_overview: "".concat(strategyName, " approach (").concat(largePct.toFixed(0), "-").concat(midPct.toFixed(0), "-").concat(smallPct.toFixed(0), ") using data-driven stock selection with ").concat(recommendation.summary.totalStocks, " carefully selected stocks based on fundamental analysis. Average quality score: ").concat((recommendation.summary.avgScore * 100).toFixed(1), "%."),
                expected_timeline: frequency === 'SIP' ? '12-24 months for portfolio building' : '18-36 months for wealth creation'
            },
            market_analysis: {
                current_sentiment: "\uD83D\uDCCA Data-Driven - Using real-time fundamentals and ".concat(recommendation.summary.riskLevel.toLowerCase(), " risk profile"),
                trending_sectors: trendingSectors,
                market_highlights: [
                    "".concat(recommendation.summary.totalStocks, " stocks selected from comprehensive fundamental analysis"),
                    "Average quality score of ".concat((recommendation.summary.avgScore * 100).toFixed(1), "% ensures high-quality selections"),
                    "Expected returns: ".concat(recommendation.summary.expectedReturn, " based on current fundamentals"),
                    "Allocation efficiency: ".concat(((recommendation.allocatedAmount / recommendation.totalAmount) * 100).toFixed(1), "%")
                ]
            },
            recommended_allocation: {
                large_cap_stocks: convertToPortfolioStocks(recommendation.categories.largeCap.stocks, 'Large Cap'),
                mid_cap_stocks: convertToPortfolioStocks(recommendation.categories.midCap.stocks, 'Mid Cap'),
                small_cap_stocks: convertToPortfolioStocks(recommendation.categories.smallCap.stocks, 'Small Cap')
            },
            allocation_table: allocation,
            investment_strategy: {
                strategy_type: "Data-Driven ".concat(strategyName, " Strategy"),
                key_benefits: [
                    'Real-time fundamental analysis ensures quality stock selection',
                    "Comprehensive scoring model evaluates ".concat(Object.keys(((_a = allStocks[0]) === null || _a === void 0 ? void 0 : _a.fundamentals) || {}).length, "+ financial metrics"),
                    'Automated index-based classification (Nifty50, Nifty Next 50, etc.)',
                    'Rate-limited data fetching ensures reliable and fresh information',
                    "Expected returns: ".concat(recommendation.summary.expectedReturn, " based on historical performance")
                ],
                risk_level: recommendation.summary.riskLevel,
                suggested_approach: [
                    "Start with ".concat(strategyName.toLowerCase(), " allocation: ").concat(largePct.toFixed(0), "% Large, ").concat(midPct.toFixed(0), "% Mid, ").concat(smallPct.toFixed(0), "% Small cap"),
                    'Monitor quarterly earnings and fundamental changes',
                    'Rebalance portfolio every 6 months or when allocation drifts >5%',
                    'Review stock quality scores monthly for any significant changes'
                ]
            },
            sip_strategy: frequency === 'SIP' ? this.createSIPStrategy(recommendation.totalAmount, {
                largeCap: recommendation.categories.largeCap.stocks,
                midCap: recommendation.categories.midCap.stocks,
                smallCap: recommendation.categories.smallCap.stocks
            }) : [],
            risk_management: {
                diversification_approach: "".concat(recommendation.summary.totalStocks, "-stock diversification across ").concat(trendingSectors.length, " sectors with data-driven selection"),
                stop_loss_strategy: "8-10% stop-loss with trailing stops; monitor quality score changes",
                portfolio_review: frequency === 'SIP' ? 'Monthly SIP execution with quarterly fundamental review' : 'Monthly performance review with quarterly rebalancing',
                risk_mitigation: [
                    'Fundamental-based stock selection reduces company-specific risks',
                    'Cross-sector diversification minimizes sector concentration',
                    'Real-time price and fundamental monitoring for early warning signals',
                    'Quality score threshold ensures only high-grade stocks are selected'
                ]
            },
            tax_considerations: {
                investment_type: 'Equity Investment',
                tax_benefits: this.generateTaxBenefits(),
                holding_strategy: 'Hold for more than 1 year to qualify for Long Term Capital Gains (LTCG) tax benefits'
            },
            next_steps: {
                immediate_actions: [
                    'Open Demat and Trading account with a reliable broker',
                    'Complete KYC and bank account linking',
                    'Set up fund transfer methods (UPI/Net Banking)',
                    frequency === 'SIP' ? 'Set up SIP mandates for automated investments' : 'Plan entry timing over 1-2 sessions'
                ],
                platform_suggestions: this.generatePlatformSuggestions(),
                monitoring_approach: [
                    'Track portfolio performance using mobile apps',
                    'Set price alerts for major movements (>5%)',
                    'Monitor monthly fundamental updates from screener.in',
                    'Review quality scores and rebalance when needed'
                ]
            },
            disclaimer: this.generateDisclaimer()
        };
    };
    /**
     * Initialize the intelligent portfolio system
     */
    PortfolioAllocationService.initializeIntelligentSystem = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Initializing intelligent portfolio system...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Initialize essential stocks data
                        return [4 /*yield*/, stockDataFetcher_1["default"].initializeEssentialStocks()];
                    case 2:
                        // Initialize essential stocks data
                        _a.sent();
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStats()];
                    case 3:
                        stats = _a.sent();
                        console.log("\u2705 Intelligent system initialized with ".concat(stats.stocksWithFundamentals, " stocks with fundamental data"));
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("\u274C Error initializing intelligent system:", error_3);
                        throw new Error('Failed to initialize intelligent portfolio system');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get system status for debugging
     */
    PortfolioAllocationService.getSystemStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var database, rateLimits;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, stockDatabaseService_1["default"].getStats()];
                    case 1:
                        database = _a.sent();
                        rateLimits = stockDataFetcher_1["default"].getRateLimitStats();
                        return [2 /*return*/, {
                                database: database,
                                rateLimits: rateLimits,
                                recommendations: {
                                    available: database.stocksWithFundamentals >= 10,
                                    lastGenerated: database.lastUpdate
                                }
                            }];
                }
            });
        });
    };
    return PortfolioAllocationService;
}());
exports.PortfolioAllocationService = PortfolioAllocationService;
