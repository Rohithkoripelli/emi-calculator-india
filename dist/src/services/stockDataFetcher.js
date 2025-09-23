"use strict";
/**
 * Stock Data Fetcher Service
 * Rate-limited data fetching from Groww API and Screener.in with MongoDB integration
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var growwApiService_1 = require("./growwApiService");
var screenerDataService_1 = require("./screenerDataService");
var stockDatabaseService_1 = __importDefault(require("./stockDatabaseService"));
var StockDataFetcher = /** @class */ (function () {
    function StockDataFetcher() {
    }
    /**
     * Reset daily counters if needed
     */
    StockDataFetcher.resetDailyCountersIfNeeded = function () {
        var today = new Date().toDateString();
        if (today !== this.lastResetDate) {
            this.screenerCallsToday = 0;
            this.growwCallsToday = 0;
            this.lastResetDate = today;
            console.log("\uD83D\uDCC5 Reset daily API call counters for ".concat(today));
        }
    };
    /**
     * Apply rate limiting for screener.in (10 symbols per minute max)
     */
    StockDataFetcher.applyScreenerRateLimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, timeSinceLastCall, delayNeeded_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        timeSinceLastCall = now - this.lastScreenerCall;
                        if (!(timeSinceLastCall < this.SCREENER_DELAY)) return [3 /*break*/, 2];
                        delayNeeded_1 = this.SCREENER_DELAY - timeSinceLastCall;
                        console.log("\u23F3 Screener.in rate limiting: waiting ".concat(delayNeeded_1, "ms (10 symbols/minute limit)"));
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayNeeded_1); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.lastScreenerCall = Date.now();
                        this.screenerCallsToday++;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Apply rate limiting for Groww API
     */
    StockDataFetcher.applyGrowwRateLimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, timeSinceLastCall, delayNeeded_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        timeSinceLastCall = now - this.lastGrowwCall;
                        if (!(timeSinceLastCall < this.GROWW_DELAY)) return [3 /*break*/, 2];
                        delayNeeded_2 = this.GROWW_DELAY - timeSinceLastCall;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayNeeded_2); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.lastGrowwCall = Date.now();
                        this.growwCallsToday++;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch and update price data for a single stock
     */
    StockDataFetcher.updateStockPrice = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var result, quote, success, error_1, errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = {
                            symbol: symbol,
                            priceUpdated: false,
                            fundamentalsUpdated: false,
                            errors: [],
                            lastUpdate: new Date()
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        console.log("\uD83D\uDCB0 Fetching price for ".concat(symbol, "..."));
                        return [4 /*yield*/, this.applyGrowwRateLimit()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, growwApiService_1.GrowwApiService.getRealTimeQuote(symbol)];
                    case 3:
                        quote = _a.sent();
                        if (!quote) return [3 /*break*/, 5];
                        return [4 /*yield*/, stockDatabaseService_1["default"].updateStockPrice(symbol, {
                                price: quote.currentPrice,
                                dayChange: quote.dayChange,
                                dayChangePercent: quote.dayChangePercent,
                                volume: quote.volume
                            })];
                    case 4:
                        success = _a.sent();
                        if (success) {
                            result.priceUpdated = true;
                            console.log("\u2705 Updated price for ".concat(symbol, ": \u20B9").concat(quote.currentPrice, " (").concat(quote.dayChangePercent > 0 ? '+' : '').concat(quote.dayChangePercent.toFixed(2), "%)"));
                        }
                        else {
                            result.errors.push('Failed to save price to database');
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        result.errors.push('No quote data received from Groww API');
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        errorMsg = "Error fetching price: ".concat(error_1);
                        result.errors.push(errorMsg);
                        console.error("\u274C ".concat(errorMsg, " for ").concat(symbol));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Fetch and update fundamental data for a single stock
     */
    StockDataFetcher.updateStockFundamentals = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var result, fundamentals, stockFundamentals, companyInfo, success, error_2, errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = {
                            symbol: symbol,
                            priceUpdated: false,
                            fundamentalsUpdated: false,
                            errors: [],
                            lastUpdate: new Date()
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        console.log("\uD83D\uDCCA Fetching fundamentals for ".concat(symbol, "..."));
                        return [4 /*yield*/, this.applyScreenerRateLimit()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, screenerDataService_1.ScreenerDataService.getFinancialMetrics(symbol)];
                    case 3:
                        fundamentals = _a.sent();
                        if (!fundamentals) return [3 /*break*/, 5];
                        stockFundamentals = {
                            peRatio: fundamentals.pe,
                            pbRatio: fundamentals.pbv,
                            roe: fundamentals.roe,
                            roce: fundamentals.roce,
                            debtToEquity: fundamentals.debtToEquity,
                            revenueGrowth: fundamentals.revenueGrowth,
                            profitGrowth: fundamentals.profitGrowth,
                            dividendYield: fundamentals.dividendYield,
                            currentRatio: fundamentals.currentRatio,
                            eps: fundamentals.eps,
                            bookValue: fundamentals.bookValue,
                            marketCap: fundamentals.marketCap,
                            faceValue: fundamentals.faceValue,
                            evEbitda: fundamentals.evEbitda,
                            quarterlyResults: fundamentals.quarterlyResults,
                            shareholdingPattern: fundamentals.shareholdingPattern
                        };
                        companyInfo = {
                            name: fundamentals.companyName,
                            sector: fundamentals.sector,
                            industry: fundamentals.industry
                        };
                        return [4 /*yield*/, stockDatabaseService_1["default"].updateStockFundamentals(symbol, stockFundamentals, companyInfo)];
                    case 4:
                        success = _a.sent();
                        if (success) {
                            result.fundamentalsUpdated = true;
                            console.log("\u2705 Updated fundamentals for ".concat(symbol, ": PE=").concat(fundamentals.pe, ", ROE=").concat(fundamentals.roe, "%, Market Cap=").concat(fundamentals.marketCap));
                        }
                        else {
                            result.errors.push('Failed to save fundamentals to database');
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        result.errors.push('No fundamental data received from Screener.in');
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        errorMsg = "Error fetching fundamentals: ".concat(error_2);
                        result.errors.push(errorMsg);
                        console.error("\u274C ".concat(errorMsg, " for ").concat(symbol));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Bulk update prices for multiple stocks
     */
    StockDataFetcher.bulkUpdatePrices = function (symbols) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, results, successful, failed, skipped, totalRequests, _i, symbols_1, symbol, result, error_3, endTime, duration, bulkResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.resetDailyCountersIfNeeded();
                        startTime = Date.now();
                        results = [];
                        successful = 0;
                        failed = 0;
                        skipped = 0;
                        totalRequests = 0;
                        console.log("\uD83D\uDD04 Starting bulk price update for ".concat(symbols.length, " stocks..."));
                        _i = 0, symbols_1 = symbols;
                        _a.label = 1;
                    case 1:
                        if (!(_i < symbols_1.length)) return [3 /*break*/, 6];
                        symbol = symbols_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.updateStockPrice(symbol)];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        totalRequests++;
                        if (result.priceUpdated) {
                            successful++;
                        }
                        else if (result.errors.length > 0) {
                            failed++;
                        }
                        else {
                            skipped++;
                        }
                        // Progress logging
                        if (totalRequests % 10 === 0) {
                            console.log("\uD83D\uDCCA Progress: ".concat(totalRequests, "/").concat(symbols.length, " stocks processed"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("\u274C Critical error updating ".concat(symbol, ":"), error_3);
                        failed++;
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        endTime = Date.now();
                        duration = endTime - startTime;
                        bulkResult = {
                            totalRequested: symbols.length,
                            successful: successful,
                            failed: failed,
                            skipped: skipped,
                            results: results,
                            duration: duration,
                            rateLimit: {
                                requestsMade: totalRequests,
                                averageDelay: totalRequests > 0 ? duration / totalRequests : 0
                            }
                        };
                        // Log the operation
                        return [4 /*yield*/, stockDatabaseService_1["default"].logUpdate({
                                type: 'PRICE_UPDATE',
                                status: failed === 0 ? 'SUCCESS' : (successful > 0 ? 'PARTIAL' : 'FAILED'),
                                recordsUpdated: successful,
                                startTime: new Date(startTime),
                                endTime: new Date(endTime),
                                duration: duration,
                                errors: results.filter(function (r) { return r.errors.length > 0; }).map(function (r) { return "".concat(r.symbol, ": ").concat(r.errors.join(', ')); }),
                                rateLimit: {
                                    requestsMade: totalRequests,
                                    delayApplied: this.GROWW_DELAY
                                }
                            })];
                    case 7:
                        // Log the operation
                        _a.sent();
                        console.log("\u2705 Bulk price update completed: ".concat(successful, " successful, ").concat(failed, " failed, ").concat(skipped, " skipped in ").concat(duration, "ms"));
                        return [2 /*return*/, bulkResult];
                }
            });
        });
    };
    /**
     * Bulk update fundamentals for multiple stocks (respecting daily limits)
     */
    StockDataFetcher.bulkUpdateFundamentals = function (symbols, maxDaily) {
        if (maxDaily === void 0) { maxDaily = 500; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, results, successful, failed, skipped, totalRequests, remainingQuota, symbolsToProcess, _i, symbolsToProcess_1, symbol, result, error_4, endTime, duration, bulkResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.resetDailyCountersIfNeeded();
                        // Check daily limit
                        if (this.screenerCallsToday >= maxDaily) {
                            console.warn("\u26A0\uFE0F Daily screener.in limit reached (".concat(this.screenerCallsToday, "/").concat(maxDaily, "). Skipping fundamental updates."));
                            return [2 /*return*/, {
                                    totalRequested: symbols.length,
                                    successful: 0,
                                    failed: 0,
                                    skipped: symbols.length,
                                    results: [],
                                    duration: 0,
                                    rateLimit: {
                                        requestsMade: 0,
                                        averageDelay: 0
                                    }
                                }];
                        }
                        startTime = Date.now();
                        results = [];
                        successful = 0;
                        failed = 0;
                        skipped = 0;
                        totalRequests = 0;
                        remainingQuota = maxDaily - this.screenerCallsToday;
                        symbolsToProcess = symbols.slice(0, remainingQuota);
                        console.log("\uD83D\uDD04 Starting bulk fundamental update for ".concat(symbolsToProcess.length, " stocks (quota: ").concat(remainingQuota, "/").concat(maxDaily, ")..."));
                        _i = 0, symbolsToProcess_1 = symbolsToProcess;
                        _a.label = 1;
                    case 1:
                        if (!(_i < symbolsToProcess_1.length)) return [3 /*break*/, 6];
                        symbol = symbolsToProcess_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.updateStockFundamentals(symbol)];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        totalRequests++;
                        if (result.fundamentalsUpdated) {
                            successful++;
                        }
                        else if (result.errors.length > 0) {
                            failed++;
                        }
                        else {
                            skipped++;
                        }
                        // Progress logging
                        if (totalRequests % 5 === 0) {
                            console.log("\uD83D\uDCCA Progress: ".concat(totalRequests, "/").concat(symbolsToProcess.length, " stocks processed, ").concat(this.screenerCallsToday, " daily calls made"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        console.error("\u274C Critical error updating ".concat(symbol, ":"), error_4);
                        failed++;
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        endTime = Date.now();
                        duration = endTime - startTime;
                        bulkResult = {
                            totalRequested: symbols.length,
                            successful: successful,
                            failed: failed,
                            skipped: skipped + (symbols.length - symbolsToProcess.length),
                            results: results,
                            duration: duration,
                            rateLimit: {
                                requestsMade: totalRequests,
                                averageDelay: totalRequests > 0 ? duration / totalRequests : 0
                            }
                        };
                        // Log the operation
                        return [4 /*yield*/, stockDatabaseService_1["default"].logUpdate({
                                type: 'FUNDAMENTAL_UPDATE',
                                status: failed === 0 ? 'SUCCESS' : (successful > 0 ? 'PARTIAL' : 'FAILED'),
                                recordsUpdated: successful,
                                startTime: new Date(startTime),
                                endTime: new Date(endTime),
                                duration: duration,
                                errors: results.filter(function (r) { return r.errors.length > 0; }).map(function (r) { return "".concat(r.symbol, ": ").concat(r.errors.join(', ')); }),
                                rateLimit: {
                                    requestsMade: totalRequests,
                                    delayApplied: this.SCREENER_DELAY
                                }
                            })];
                    case 7:
                        // Log the operation
                        _a.sent();
                        console.log("\u2705 Bulk fundamental update completed: ".concat(successful, " successful, ").concat(failed, " failed, ").concat(skipped, " skipped in ").concat((duration / 1000).toFixed(1), "s"));
                        console.log("\uD83D\uDCCA Daily usage: ".concat(this.screenerCallsToday, "/").concat(maxDaily, " screener.in calls, ").concat(this.growwCallsToday, " Groww calls"));
                        return [2 /*return*/, bulkResult];
                }
            });
        });
    };
    /**
     * Auto-update routine: prices (hourly) and fundamentals (daily)
     */
    StockDataFetcher.performAutoUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stocksNeedingPrices, stocksNeedingFundamentals, priceUpdate, fundamentalUpdate, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83E\uDD16 Starting automated data update routine...");
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStocksNeedingPriceUpdate()];
                    case 1:
                        stocksNeedingPrices = _a.sent();
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStocksNeedingFundamentalUpdate()];
                    case 2:
                        stocksNeedingFundamentals = _a.sent();
                        console.log("\uD83D\uDCCA Update requirements: ".concat(stocksNeedingPrices.length, " need price updates, ").concat(stocksNeedingFundamentals.length, " need fundamental updates"));
                        return [4 /*yield*/, this.bulkUpdatePrices(stocksNeedingPrices)];
                    case 3:
                        priceUpdate = _a.sent();
                        return [4 /*yield*/, this.bulkUpdateFundamentals(stocksNeedingFundamentals, 500)];
                    case 4:
                        fundamentalUpdate = _a.sent();
                        return [4 /*yield*/, stockDatabaseService_1["default"].getStats()];
                    case 5:
                        stats = _a.sent();
                        console.log("\uD83D\uDCC8 Database stats after update:", stats);
                        return [2 /*return*/, {
                                priceUpdate: priceUpdate,
                                fundamentalUpdate: fundamentalUpdate
                            }];
                }
            });
        });
    };
    /**
     * Get rate limiting statistics
     */
    StockDataFetcher.getRateLimitStats = function () {
        this.resetDailyCountersIfNeeded();
        return {
            screenerCallsToday: this.screenerCallsToday,
            growwCallsToday: this.growwCallsToday,
            screenerDelayMs: this.SCREENER_DELAY,
            growwDelayMs: this.GROWW_DELAY,
            lastScreenerCall: new Date(this.lastScreenerCall),
            lastGrowwCall: new Date(this.lastGrowwCall)
        };
    };
    /**
     * Initialize database with essential stocks
     */
    StockDataFetcher.initializeEssentialStocks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var indices, allSymbols, symbolArray, prioritySymbols, fundamentalResult, stocksWithFundamentals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Initializing database with essential stocks...");
                        return [4 /*yield*/, stockDatabaseService_1["default"].getAllIndices()];
                    case 1:
                        indices = _a.sent();
                        allSymbols = new Set();
                        indices.forEach(function (index) {
                            index.stocks.forEach(function (symbol) { return allSymbols.add(symbol); });
                        });
                        symbolArray = Array.from(allSymbols);
                        console.log("\uD83D\uDCCA Found ".concat(symbolArray.length, " unique stocks across ").concat(indices.length, " indices"));
                        prioritySymbols = symbolArray.slice(0, 100);
                        return [4 /*yield*/, this.bulkUpdateFundamentals(prioritySymbols, 100)];
                    case 2:
                        fundamentalResult = _a.sent();
                        stocksWithFundamentals = fundamentalResult.results
                            .filter(function (r) { return r.fundamentalsUpdated; })
                            .map(function (r) { return r.symbol; });
                        if (!(stocksWithFundamentals.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.bulkUpdatePrices(stocksWithFundamentals)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        console.log("\u2705 Database initialization completed with ".concat(stocksWithFundamentals.length, " stocks"));
                        return [2 /*return*/];
                }
            });
        });
    };
    StockDataFetcher.lastScreenerCall = 0;
    StockDataFetcher.SCREENER_DELAY = 6000; // 6 seconds = 10 symbols per minute
    StockDataFetcher.GROWW_DELAY = 100; // 100ms between Groww API calls
    StockDataFetcher.lastGrowwCall = 0;
    // Rate limiting statistics
    StockDataFetcher.screenerCallsToday = 0;
    StockDataFetcher.growwCallsToday = 0;
    StockDataFetcher.lastResetDate = new Date().toDateString();
    return StockDataFetcher;
}());
exports["default"] = StockDataFetcher;
