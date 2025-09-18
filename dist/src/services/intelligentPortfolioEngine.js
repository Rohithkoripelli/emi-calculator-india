"use strict";
/**
 * Intelligent Portfolio Engine
 * Advanced portfolio allocation with data-driven stock recommendations
 */
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
var stockScoringEngine_1 = __importDefault(require("./stockScoringEngine"));
var stockDatabaseService_1 = __importDefault(require("./stockDatabaseService"));
var stockDataFetcher_1 = __importDefault(require("./stockDataFetcher"));
var IntelligentPortfolioEngine = /** @class */ (function () {
    function IntelligentPortfolioEngine() {
    }
    /**
     * Get predefined allocation strategies
     */
    IntelligentPortfolioEngine.getAllocationStrategies = function () {
        return {
            conservative: {
                name: 'Conservative',
                description: 'Focus on capital preservation with steady returns',
                allocations: { largeCap: 60, midCap: 30, smallCap: 10 },
                riskLevel: 'LOW',
                expectedReturnRange: '8-12% annually',
                bestFor: 'Risk-averse investors, those nearing retirement'
            },
            balanced: {
                name: 'Balanced',
                description: 'Balanced growth with manageable risk',
                allocations: { largeCap: 50, midCap: 30, smallCap: 20 },
                riskLevel: 'MEDIUM',
                expectedReturnRange: '10-15% annually',
                bestFor: 'Most investors seeking growth with stability'
            },
            aggressive: {
                name: 'Aggressive',
                description: 'Maximum growth potential with higher risk',
                allocations: { largeCap: 30, midCap: 40, smallCap: 30 },
                riskLevel: 'HIGH',
                expectedReturnRange: '12-20% annually',
                bestFor: 'Young investors, high risk tolerance, long-term wealth building'
            }
        };
    };
    /**
     * Generate portfolio recommendation based on allocation request
     */
    IntelligentPortfolioEngine.generateRecommendation = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var totalPercentage, targetAmounts, topStocks, largeCap, midCap, smallCap, allocatedAmount, unallocatedAmount, totalStocks, allStocks, avgScore, riskLevel, expectedReturn, recommendation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCBC Generating portfolio recommendation for \u20B9".concat(request.totalAmount.toLocaleString('en-IN'), "..."));
                        totalPercentage = request.allocations.largeCap + request.allocations.midCap + request.allocations.smallCap;
                        if (Math.abs(totalPercentage - 100) > 0.01) {
                            throw new Error("Allocation percentages must sum to 100%. Current sum: ".concat(totalPercentage, "%"));
                        }
                        targetAmounts = {
                            largeCap: (request.totalAmount * request.allocations.largeCap) / 100,
                            midCap: (request.totalAmount * request.allocations.midCap) / 100,
                            smallCap: (request.totalAmount * request.allocations.smallCap) / 100
                        };
                        console.log("\uD83C\uDFAF Target allocations: Large=\u20B9".concat(targetAmounts.largeCap.toLocaleString('en-IN'), ", Mid=\u20B9").concat(targetAmounts.midCap.toLocaleString('en-IN'), ", Small=\u20B9").concat(targetAmounts.smallCap.toLocaleString('en-IN')));
                        return [4 /*yield*/, stockScoringEngine_1["default"].getTopStocksByCategory(request.maxStocksPerCategory + 2)];
                    case 1:
                        topStocks = _a.sent();
                        return [4 /*yield*/, this.allocateStocksInCategory(topStocks.largeCap, targetAmounts.largeCap, request.maxStocksPerCategory, 'LARGE_CAP')];
                    case 2:
                        largeCap = _a.sent();
                        return [4 /*yield*/, this.allocateStocksInCategory(topStocks.midCap, targetAmounts.midCap, request.maxStocksPerCategory, 'MID_CAP')];
                    case 3:
                        midCap = _a.sent();
                        return [4 /*yield*/, this.allocateStocksInCategory(topStocks.smallCap, targetAmounts.smallCap, request.maxStocksPerCategory, 'SMALL_CAP')];
                    case 4:
                        smallCap = _a.sent();
                        allocatedAmount = largeCap.allocatedAmount + midCap.allocatedAmount + smallCap.allocatedAmount;
                        unallocatedAmount = request.totalAmount - allocatedAmount;
                        totalStocks = largeCap.stocks.length + midCap.stocks.length + smallCap.stocks.length;
                        allStocks = __spreadArray(__spreadArray(__spreadArray([], largeCap.stocks, true), midCap.stocks, true), smallCap.stocks, true);
                        avgScore = allStocks.length > 0 ?
                            allStocks.reduce(function (sum, stock) { return sum + stock.score; }, 0) / allStocks.length : 0;
                        riskLevel = this.determineRiskLevel(request.allocations);
                        expectedReturn = this.estimateExpectedReturn(request.allocations, avgScore);
                        recommendation = {
                            totalAmount: request.totalAmount,
                            allocatedAmount: allocatedAmount,
                            unallocatedAmount: unallocatedAmount,
                            categories: {
                                largeCap: largeCap,
                                midCap: midCap,
                                smallCap: smallCap
                            },
                            summary: {
                                totalStocks: totalStocks,
                                avgScore: avgScore,
                                riskLevel: riskLevel,
                                expectedReturn: expectedReturn
                            },
                            generatedAt: new Date()
                        };
                        console.log("\u2705 Portfolio recommendation generated: ".concat(totalStocks, " stocks, \u20B9").concat(allocatedAmount.toLocaleString('en-IN'), " allocated, avg score ").concat((avgScore * 100).toFixed(1), "%"));
                        return [2 /*return*/, recommendation];
                }
            });
        });
    };
    /**
     * Allocate stocks within a specific category
     */
    IntelligentPortfolioEngine.allocateStocksInCategory = function (topStocks, targetAmount, maxStocks, category) {
        return __awaiter(this, void 0, void 0, function () {
            var stocks, allocatedAmount, sortedStocks, baseAllocation, i, stock, scoreWeight, allocation, quantity, actualAllocation;
            return __generator(this, function (_a) {
                stocks = [];
                allocatedAmount = 0;
                if (topStocks.length === 0 || targetAmount <= 0) {
                    return [2 /*return*/, { targetAmount: targetAmount, allocatedAmount: 0, stocks: [] }];
                }
                sortedStocks = topStocks.sort(function (a, b) { return (b.qualityScore || 0) - (a.qualityScore || 0); });
                baseAllocation = targetAmount / Math.min(maxStocks, sortedStocks.length);
                for (i = 0; i < Math.min(maxStocks, sortedStocks.length); i++) {
                    stock = sortedStocks[i];
                    // Skip stocks with missing critical data
                    if (!stock.price || stock.price <= 0) {
                        console.warn("\u26A0\uFE0F Skipping ".concat(stock._id, ": Invalid price data"));
                        continue;
                    }
                    scoreWeight = 0.8 + 0.4 * (stock.qualityScore || 0);
                    allocation = Math.floor(baseAllocation * scoreWeight);
                    quantity = Math.floor(allocation / stock.price);
                    actualAllocation = quantity * stock.price;
                    if (quantity > 0) {
                        stocks.push({
                            symbol: stock._id,
                            name: stock.name,
                            sector: stock.sector,
                            price: stock.price,
                            allocation: actualAllocation,
                            quantity: quantity,
                            score: stock.qualityScore || 0,
                            reasoning: this.generateReasoning(stock, category),
                            fundamentals: {
                                peRatio: stock.fundamentals.peRatio,
                                roe: stock.fundamentals.roe,
                                roce: stock.fundamentals.roce,
                                marketCap: stock.fundamentals.marketCap
                            }
                        });
                        allocatedAmount += actualAllocation;
                    }
                }
                console.log("\uD83D\uDCCA ".concat(category, ": ").concat(stocks.length, " stocks, \u20B9").concat(allocatedAmount.toLocaleString('en-IN'), " allocated of \u20B9").concat(targetAmount.toLocaleString('en-IN'), " target"));
                return [2 /*return*/, {
                        targetAmount: targetAmount,
                        allocatedAmount: allocatedAmount,
                        stocks: stocks
                    }];
            });
        });
    };
    /**
     * Generate reasoning for stock recommendation
     */
    IntelligentPortfolioEngine.generateReasoning = function (stock, category) {
        var reasons = [];
        var f = stock.fundamentals;
        // Quality score
        var scorePercent = ((stock.qualityScore || 0) * 100).toFixed(1);
        reasons.push("Quality score of ".concat(scorePercent, "% indicates strong fundamentals"));
        // Specific metric highlights
        if (f.roe && f.roe > 15) {
            reasons.push("Strong ROE of ".concat(f.roe.toFixed(1), "% shows efficient management"));
        }
        if (f.roce && f.roce > 15) {
            reasons.push("Good ROCE of ".concat(f.roce.toFixed(1), "% indicates effective capital utilization"));
        }
        if (f.peRatio && f.peRatio < 25) {
            reasons.push("Reasonable valuation with P/E ratio of ".concat(f.peRatio.toFixed(1)));
        }
        if (f.debtToEquity !== undefined && f.debtToEquity < 0.5) {
            reasons.push("Low debt-to-equity ratio of ".concat(f.debtToEquity.toFixed(2), " indicates financial stability"));
        }
        if (f.revenueGrowth && f.revenueGrowth > 10) {
            reasons.push("Revenue growth of ".concat(f.revenueGrowth.toFixed(1), "% shows business expansion"));
        }
        if (f.dividendYield && f.dividendYield > 1) {
            reasons.push("Dividend yield of ".concat(f.dividendYield.toFixed(1), "% provides regular income"));
        }
        // Category-specific reasons
        if (category === 'LARGE_CAP') {
            reasons.push('Large-cap stability with established market presence');
        }
        else if (category === 'MID_CAP') {
            reasons.push('Mid-cap growth potential with balanced risk-return profile');
        }
        else {
            reasons.push('Small-cap high growth potential for long-term wealth creation');
        }
        return reasons.join('. ') + '.';
    };
    /**
     * Determine overall risk level based on allocation
     */
    IntelligentPortfolioEngine.determineRiskLevel = function (allocations) {
        if (allocations.largeCap >= 60)
            return 'LOW';
        if (allocations.smallCap >= 30)
            return 'HIGH';
        return 'MEDIUM';
    };
    /**
     * Estimate expected return based on allocation and stock quality
     */
    IntelligentPortfolioEngine.estimateExpectedReturn = function (allocations, avgScore) {
        // Base returns by category (annual %)
        var baseReturns = {
            largeCap: 10,
            midCap: 13,
            smallCap: 16 // 16% base for small cap
        };
        // Calculate weighted average return
        var weightedReturn = ((allocations.largeCap / 100) * baseReturns.largeCap +
            (allocations.midCap / 100) * baseReturns.midCap +
            (allocations.smallCap / 100) * baseReturns.smallCap);
        // Adjust based on stock quality (score)
        var qualityAdjustment = (avgScore - 0.5) * 4; // -2% to +2% adjustment
        var adjustedReturn = weightedReturn + qualityAdjustment;
        var minReturn = Math.max(6, adjustedReturn - 2);
        var maxReturn = adjustedReturn + 3;
        return "".concat(minReturn.toFixed(0), "-").concat(maxReturn.toFixed(0), "% annually");
    };
    /**
     * Generate portfolio recommendation with predefined strategy
     */
    IntelligentPortfolioEngine.generateRecommendationWithStrategy = function (totalAmount, strategy, maxStocksPerCategory) {
        if (maxStocksPerCategory === void 0) { maxStocksPerCategory = 4; }
        return __awaiter(this, void 0, void 0, function () {
            var strategies, selectedStrategy, request;
            return __generator(this, function (_a) {
                strategies = this.getAllocationStrategies();
                selectedStrategy = strategies[strategy];
                request = {
                    totalAmount: totalAmount,
                    allocations: selectedStrategy.allocations,
                    maxStocksPerCategory: maxStocksPerCategory,
                    riskTolerance: selectedStrategy.riskLevel
                };
                return [2 /*return*/, this.generateRecommendation(request)];
            });
        });
    };
    /**
     * Generate multiple strategy recommendations for comparison
     */
    IntelligentPortfolioEngine.generateMultipleStrategies = function (totalAmount, maxStocksPerCategory) {
        if (maxStocksPerCategory === void 0) { maxStocksPerCategory = 4; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, conservative, balanced, aggressive, strategies, comparison;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83C\uDFAF Generating multiple portfolio strategies for \u20B9".concat(totalAmount.toLocaleString('en-IN'), "..."));
                        return [4 /*yield*/, Promise.all([
                                this.generateRecommendationWithStrategy(totalAmount, 'conservative', maxStocksPerCategory),
                                this.generateRecommendationWithStrategy(totalAmount, 'balanced', maxStocksPerCategory),
                                this.generateRecommendationWithStrategy(totalAmount, 'aggressive', maxStocksPerCategory)
                            ])];
                    case 1:
                        _a = _b.sent(), conservative = _a[0], balanced = _a[1], aggressive = _a[2];
                        strategies = this.getAllocationStrategies();
                        comparison = {
                            strategies: [
                                {
                                    name: strategies.conservative.name,
                                    allocation: "".concat(strategies.conservative.allocations.largeCap, "%-").concat(strategies.conservative.allocations.midCap, "%-").concat(strategies.conservative.allocations.smallCap, "%"),
                                    riskLevel: strategies.conservative.riskLevel,
                                    expectedReturn: conservative.summary.expectedReturn,
                                    totalStocks: conservative.summary.totalStocks,
                                    avgScore: conservative.summary.avgScore
                                },
                                {
                                    name: strategies.balanced.name,
                                    allocation: "".concat(strategies.balanced.allocations.largeCap, "%-").concat(strategies.balanced.allocations.midCap, "%-").concat(strategies.balanced.allocations.smallCap, "%"),
                                    riskLevel: strategies.balanced.riskLevel,
                                    expectedReturn: balanced.summary.expectedReturn,
                                    totalStocks: balanced.summary.totalStocks,
                                    avgScore: balanced.summary.avgScore
                                },
                                {
                                    name: strategies.aggressive.name,
                                    allocation: "".concat(strategies.aggressive.allocations.largeCap, "%-").concat(strategies.aggressive.allocations.midCap, "%-").concat(strategies.aggressive.allocations.smallCap, "%"),
                                    riskLevel: strategies.aggressive.riskLevel,
                                    expectedReturn: aggressive.summary.expectedReturn,
                                    totalStocks: aggressive.summary.totalStocks,
                                    avgScore: aggressive.summary.avgScore
                                }
                            ]
                        };
                        console.log("\u2705 Generated ".concat(comparison.strategies.length, " portfolio strategies with avg scores: C=").concat((conservative.summary.avgScore * 100).toFixed(1), "%, B=").concat((balanced.summary.avgScore * 100).toFixed(1), "%, A=").concat((aggressive.summary.avgScore * 100).toFixed(1), "%"));
                        return [2 /*return*/, {
                                conservative: conservative,
                                balanced: balanced,
                                aggressive: aggressive,
                                comparison: comparison
                            }];
                }
            });
        });
    };
    /**
     * Ensure database is updated before generating recommendations
     */
    IntelligentPortfolioEngine.ensureDataFreshness = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, now, oneHour, oneDay, needsPriceUpdate, needsFundamentalUpdate, stocksNeedingPrices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD04 Ensuring data freshness for portfolio recommendations...");
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStats()];
                    case 1:
                        stats = _a.sent();
                        now = new Date();
                        oneHour = 60 * 60 * 1000;
                        oneDay = 24 * oneHour;
                        needsPriceUpdate = !stats.lastUpdate || (now.getTime() - stats.lastUpdate.getTime()) > oneHour;
                        needsFundamentalUpdate = stats.stocksWithFundamentals < 50;
                        if (!(needsPriceUpdate || needsFundamentalUpdate)) return [3 /*break*/, 7];
                        console.log("\uD83D\uDCCA Database status: ".concat(stats.stocksWithPrices, " with prices, ").concat(stats.stocksWithFundamentals, " with fundamentals"));
                        if (!needsFundamentalUpdate) return [3 /*break*/, 3];
                        // Initialize with essential stocks if we don't have enough data
                        return [4 /*yield*/, stockDataFetcher_1["default"].initializeEssentialStocks()];
                    case 2:
                        // Initialize with essential stocks if we don't have enough data
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!needsPriceUpdate) return [3 /*break*/, 6];
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStocksNeedingPriceUpdate()];
                    case 4:
                        stocksNeedingPrices = _a.sent();
                        if (!(stocksNeedingPrices.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, stockDataFetcher_1["default"].bulkUpdatePrices(stocksNeedingPrices.slice(0, 50))];
                    case 5:
                        _a.sent(); // Limit to 50 for quick update
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        console.log("\u2705 Data is fresh: ".concat(stats.stocksWithPrices, " stocks with prices, ").concat(stats.stocksWithFundamentals, " with fundamentals"));
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return IntelligentPortfolioEngine;
}());
exports["default"] = IntelligentPortfolioEngine;
