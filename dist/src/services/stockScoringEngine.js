"use strict";
/**
 * Stock Scoring Engine
 * Advanced weighted scoring model for ranking stocks based on fundamental metrics
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var stockDataModels_1 = require("./stockDataModels");
var stockDatabaseService_1 = __importDefault(require("./stockDatabaseService"));
var StockScoringEngine = /** @class */ (function () {
    function StockScoringEngine() {
    }
    /**
     * Update scoring weights
     */
    StockScoringEngine.updateScoringWeights = function (weights) {
        this.scoringWeights = __assign(__assign({}, this.scoringWeights), weights);
        console.log("\uD83D\uDCCA Updated scoring weights:", this.scoringWeights);
    };
    /**
     * Normalize a metric value using z-score normalization
     */
    StockScoringEngine.normalizeMetric = function (value, values, invert, optimalRange) {
        if (invert === void 0) { invert = false; }
        if (values.length === 0)
            return 0;
        // Remove outliers (values beyond 3 standard deviations)
        var mean = values.reduce(function (sum, v) { return sum + v; }, 0) / values.length;
        var stdDev = Math.sqrt(values.reduce(function (sum, v) { return sum + Math.pow(v - mean, 2); }, 0) / values.length);
        var filteredValues = values.filter(function (v) { return Math.abs(v - mean) <= 3 * stdDev; });
        if (filteredValues.length === 0)
            return 0;
        var filteredMean = filteredValues.reduce(function (sum, v) { return sum + v; }, 0) / filteredValues.length;
        var filteredStdDev = Math.sqrt(filteredValues.reduce(function (sum, v) { return sum + Math.pow(v - filteredMean, 2); }, 0) / filteredValues.length);
        if (filteredStdDev === 0)
            return 0.5; // All values are the same
        // Z-score normalization
        var normalized = (value - filteredMean) / filteredStdDev;
        // Convert to 0-1 scale using sigmoid function
        normalized = 1 / (1 + Math.exp(-normalized));
        // Handle optimal range metrics (like current ratio)
        if (optimalRange) {
            if (value >= optimalRange.min && value <= optimalRange.max) {
                normalized = Math.max(normalized, 0.7); // Boost score if in optimal range
            }
        }
        // Invert if lower values are better (like P/E ratio, debt-to-equity)
        if (invert) {
            normalized = 1 - normalized;
        }
        return Math.max(0, Math.min(1, normalized));
    };
    /**
     * Normalize metrics for a collection of stocks
     */
    StockScoringEngine.normalizeMetricsForStocks = function (stocks) {
        var normalizedMap = new Map();
        // Extract all metric values for normalization
        var metrics = {
            peRatio: stocks.map(function (s) { return s.fundamentals.peRatio; }).filter(function (v) { return v !== undefined && v > 0 && v < 100; }),
            roe: stocks.map(function (s) { return s.fundamentals.roe; }).filter(function (v) { return v !== undefined && v > -50 && v < 100; }),
            roce: stocks.map(function (s) { return s.fundamentals.roce; }).filter(function (v) { return v !== undefined && v > -50 && v < 100; }),
            debtToEquity: stocks.map(function (s) { return s.fundamentals.debtToEquity; }).filter(function (v) { return v !== undefined && v >= 0 && v < 10; }),
            revenueGrowth: stocks.map(function (s) { return s.fundamentals.revenueGrowth; }).filter(function (v) { return v !== undefined && v > -100 && v < 200; }),
            profitGrowth: stocks.map(function (s) { return s.fundamentals.profitGrowth; }).filter(function (v) { return v !== undefined && v > -100 && v < 200; }),
            dividendYield: stocks.map(function (s) { return s.fundamentals.dividendYield; }).filter(function (v) { return v !== undefined && v >= 0 && v < 20; }),
            currentRatio: stocks.map(function (s) { return s.fundamentals.currentRatio; }).filter(function (v) { return v !== undefined && v > 0 && v < 10; })
        };
        // Normalize each stock's metrics
        for (var _i = 0, stocks_1 = stocks; _i < stocks_1.length; _i++) {
            var stock = stocks_1[_i];
            var f = stock.fundamentals;
            normalizedMap.set(stock._id, {
                peRatio: f.peRatio !== undefined ?
                    this.normalizeMetric(f.peRatio, metrics.peRatio, true) : 0,
                roe: f.roe !== undefined ?
                    this.normalizeMetric(f.roe, metrics.roe, false) : 0,
                roce: f.roce !== undefined ?
                    this.normalizeMetric(f.roce, metrics.roce, false) : 0,
                debtToEquity: f.debtToEquity !== undefined ?
                    this.normalizeMetric(f.debtToEquity, metrics.debtToEquity, true) : 0,
                revenueGrowth: f.revenueGrowth !== undefined ?
                    this.normalizeMetric(f.revenueGrowth, metrics.revenueGrowth, false) : 0,
                profitGrowth: f.profitGrowth !== undefined ?
                    this.normalizeMetric(f.profitGrowth, metrics.profitGrowth, false) : 0,
                dividendYield: f.dividendYield !== undefined ?
                    this.normalizeMetric(f.dividendYield, metrics.dividendYield, false) : 0,
                currentRatio: f.currentRatio !== undefined ?
                    this.normalizeMetric(f.currentRatio, metrics.currentRatio, false, { min: 1.5, max: 3.0 }) : 0
            });
        }
        return normalizedMap;
    };
    /**
     * Calculate quality score for a single stock
     */
    StockScoringEngine.calculateStockScore = function (stock, normalizedMetrics) {
        var f = stock.fundamentals;
        var missingMetrics = [];
        // Use provided normalized metrics or calculate individual ones
        var normalized;
        if (normalizedMetrics) {
            normalized = normalizedMetrics;
        }
        else {
            // Individual normalization (less accurate than group normalization)
            normalized = {
                peRatio: f.peRatio !== undefined ? Math.max(0, 1 - (f.peRatio / 50)) : 0,
                roe: f.roe !== undefined ? Math.max(0, Math.min(1, f.roe / 30)) : 0,
                roce: f.roce !== undefined ? Math.max(0, Math.min(1, f.roce / 30)) : 0,
                debtToEquity: f.debtToEquity !== undefined ? Math.max(0, 1 - (f.debtToEquity / 2)) : 0,
                revenueGrowth: f.revenueGrowth !== undefined ? Math.max(0, Math.min(1, (f.revenueGrowth + 10) / 40)) : 0,
                profitGrowth: f.profitGrowth !== undefined ? Math.max(0, Math.min(1, (f.profitGrowth + 10) / 40)) : 0,
                dividendYield: f.dividendYield !== undefined ? Math.max(0, Math.min(1, f.dividendYield / 8)) : 0,
                currentRatio: f.currentRatio !== undefined ? Math.max(0, 1 - Math.abs(2 - f.currentRatio) / 2) : 0
            };
        }
        // Track missing metrics
        if (f.peRatio === undefined)
            missingMetrics.push('PE Ratio');
        if (f.roe === undefined)
            missingMetrics.push('ROE');
        if (f.roce === undefined)
            missingMetrics.push('ROCE');
        if (f.debtToEquity === undefined)
            missingMetrics.push('Debt-to-Equity');
        if (f.revenueGrowth === undefined)
            missingMetrics.push('Revenue Growth');
        if (f.profitGrowth === undefined)
            missingMetrics.push('Profit Growth');
        if (f.dividendYield === undefined)
            missingMetrics.push('Dividend Yield');
        if (f.currentRatio === undefined)
            missingMetrics.push('Current Ratio');
        // Calculate component scores
        var componentScores = {
            peRatio: normalized.peRatio * this.scoringWeights.peRatio,
            roe: normalized.roe * this.scoringWeights.roe,
            roce: normalized.roce * this.scoringWeights.roce,
            debtToEquity: normalized.debtToEquity * this.scoringWeights.debtToEquity,
            revenueGrowth: normalized.revenueGrowth * this.scoringWeights.revenueGrowth,
            profitGrowth: normalized.profitGrowth * this.scoringWeights.profitGrowth,
            dividendYield: normalized.dividendYield * this.scoringWeights.dividendYield,
            currentRatio: normalized.currentRatio * this.scoringWeights.currentRatio
        };
        // Calculate total score
        var totalScore = Object.values(componentScores).reduce(function (sum, score) { return sum + score; }, 0);
        // Apply penalty for missing metrics
        var missingPenalty = missingMetrics.length * 0.05; // 5% penalty per missing metric
        var adjustedScore = Math.max(0, totalScore - missingPenalty);
        return {
            totalScore: adjustedScore,
            componentScores: componentScores,
            weights: this.scoringWeights,
            missingMetrics: missingMetrics
        };
    };
    /**
     * Score and rank stocks in a category
     */
    StockScoringEngine.scoreAndRankStocks = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var stocks, normalizedMetrics, scoredStocks, scores, avgScore, medianScore, topScore, validMetrics;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCCA Scoring and ranking ".concat(category, " stocks..."));
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStocksByCategory(category)];
                    case 1:
                        stocks = _a.sent();
                        if (stocks.length === 0) {
                            console.warn("\u26A0\uFE0F No stocks found in ".concat(category, " category"));
                            return [2 /*return*/, {
                                    stocks: [],
                                    categoryStats: {
                                        totalStocks: 0,
                                        avgScore: 0,
                                        medianScore: 0,
                                        topScore: 0,
                                        validMetrics: {
                                            peRatio: 0, roe: 0, roce: 0, debtToEquity: 0,
                                            revenueGrowth: 0, profitGrowth: 0, dividendYield: 0, currentRatio: 0
                                        }
                                    }
                                }];
                        }
                        normalizedMetrics = this.normalizeMetricsForStocks(stocks);
                        scoredStocks = stocks.map(function (stock) {
                            var normalizedForStock = normalizedMetrics.get(stock._id);
                            var scoreBreakdown = _this.calculateStockScore(stock, normalizedForStock);
                            // Update stock's quality score in database
                            stock.qualityScore = scoreBreakdown.totalScore;
                            return __assign(__assign({}, stock), { scoreBreakdown: scoreBreakdown });
                        });
                        // Sort by score (highest first)
                        scoredStocks.sort(function (a, b) { return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore; });
                        scores = scoredStocks.map(function (s) { return s.scoreBreakdown.totalScore; });
                        avgScore = scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length;
                        medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
                        topScore = scores.length > 0 ? scores[0] : 0;
                        validMetrics = {
                            peRatio: stocks.filter(function (s) { return s.fundamentals.peRatio !== undefined; }).length,
                            roe: stocks.filter(function (s) { return s.fundamentals.roe !== undefined; }).length,
                            roce: stocks.filter(function (s) { return s.fundamentals.roce !== undefined; }).length,
                            debtToEquity: stocks.filter(function (s) { return s.fundamentals.debtToEquity !== undefined; }).length,
                            revenueGrowth: stocks.filter(function (s) { return s.fundamentals.revenueGrowth !== undefined; }).length,
                            profitGrowth: stocks.filter(function (s) { return s.fundamentals.profitGrowth !== undefined; }).length,
                            dividendYield: stocks.filter(function (s) { return s.fundamentals.dividendYield !== undefined; }).length,
                            currentRatio: stocks.filter(function (s) { return s.fundamentals.currentRatio !== undefined; }).length
                        };
                        console.log("\u2705 Scored ".concat(stocks.length, " ").concat(category, " stocks. Avg score: ").concat(avgScore.toFixed(3), ", Top score: ").concat(topScore.toFixed(3)));
                        return [2 /*return*/, {
                                stocks: scoredStocks,
                                categoryStats: {
                                    totalStocks: stocks.length,
                                    avgScore: avgScore,
                                    medianScore: medianScore,
                                    topScore: topScore,
                                    validMetrics: validMetrics
                                }
                            }];
                }
            });
        });
    };
    /**
     * Get top N stocks from each category
     */
    StockScoringEngine.getTopStocksByCategory = function (topN) {
        if (topN === void 0) { topN = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, largeCapResult, midCapResult, smallCapResult, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("\uD83C\uDFC6 Getting top ".concat(topN, " stocks from each category..."));
                        return [4 /*yield*/, Promise.all([
                                this.scoreAndRankStocks('LARGE_CAP'),
                                this.scoreAndRankStocks('MID_CAP'),
                                this.scoreAndRankStocks('SMALL_CAP')
                            ])];
                    case 1:
                        _a = _b.sent(), largeCapResult = _a[0], midCapResult = _a[1], smallCapResult = _a[2];
                        result = {
                            largeCap: largeCapResult.stocks.slice(0, topN),
                            midCap: midCapResult.stocks.slice(0, topN),
                            smallCap: smallCapResult.stocks.slice(0, topN),
                            summary: {
                                totalAnalyzed: largeCapResult.stocks.length + midCapResult.stocks.length + smallCapResult.stocks.length,
                                averageScores: {
                                    largeCap: largeCapResult.categoryStats.avgScore,
                                    midCap: midCapResult.categoryStats.avgScore,
                                    smallCap: smallCapResult.categoryStats.avgScore
                                }
                            }
                        };
                        console.log("\u2705 Top stocks retrieved: ".concat(result.largeCap.length, " Large, ").concat(result.midCap.length, " Mid, ").concat(result.smallCap.length, " Small"));
                        console.log("\uD83D\uDCCA Category averages: Large=".concat(result.summary.averageScores.largeCap.toFixed(3), ", Mid=").concat(result.summary.averageScores.midCap.toFixed(3), ", Small=").concat(result.summary.averageScores.smallCap.toFixed(3)));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Explain score calculation for a stock
     */
    StockScoringEngine.explainScore = function (scoreBreakdown) {
        var explanations = [];
        explanations.push("Total Quality Score: ".concat((scoreBreakdown.totalScore * 100).toFixed(1), "%"));
        if (scoreBreakdown.componentScores.peRatio > 0) {
            explanations.push("\u2022 P/E Ratio contributes ".concat((scoreBreakdown.componentScores.peRatio * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.peRatio * 100, "% weight)"));
        }
        if (scoreBreakdown.componentScores.roe > 0) {
            explanations.push("\u2022 ROE contributes ".concat((scoreBreakdown.componentScores.roe * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.roe * 100, "% weight)"));
        }
        if (scoreBreakdown.componentScores.roce > 0) {
            explanations.push("\u2022 ROCE contributes ".concat((scoreBreakdown.componentScores.roce * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.roce * 100, "% weight)"));
        }
        if (scoreBreakdown.componentScores.debtToEquity > 0) {
            explanations.push("\u2022 Debt-to-Equity contributes ".concat((scoreBreakdown.componentScores.debtToEquity * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.debtToEquity * 100, "% weight)"));
        }
        if (scoreBreakdown.componentScores.revenueGrowth > 0) {
            explanations.push("\u2022 Revenue Growth contributes ".concat((scoreBreakdown.componentScores.revenueGrowth * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.revenueGrowth * 100, "% weight)"));
        }
        if (scoreBreakdown.componentScores.profitGrowth > 0) {
            explanations.push("\u2022 Profit Growth contributes ".concat((scoreBreakdown.componentScores.profitGrowth * 100).toFixed(1), "% (").concat(scoreBreakdown.weights.profitGrowth * 100, "% weight)"));
        }
        if (scoreBreakdown.missingMetrics.length > 0) {
            explanations.push("\u26A0\uFE0F Missing metrics: ".concat(scoreBreakdown.missingMetrics.join(', '), " (").concat(scoreBreakdown.missingMetrics.length * 5, "% penalty applied)"));
        }
        return explanations.join('\n');
    };
    StockScoringEngine.scoringWeights = stockDataModels_1.DEFAULT_SCORING_WEIGHTS;
    return StockScoringEngine;
}());
exports["default"] = StockScoringEngine;
