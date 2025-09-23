"use strict";
/**
 * Stock Database Service
 * MongoDB integration for stock data management with comprehensive CRUD operations
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
var _this = this;
exports.__esModule = true;
// Mock MongoDB operations since we don't have actual MongoDB setup
// In production, replace with actual MongoDB driver operations
var StockDatabaseService = /** @class */ (function () {
    function StockDatabaseService() {
    }
    /**
     * Initialize sample index data for classification
     */
    StockDatabaseService.initializeSampleData = function () {
        var _this = this;
        // Initialize major indices
        var indices = [
            {
                _id: 'NIFTY50',
                name: 'Nifty 50',
                category: 'LARGE_CAP',
                description: 'Top 50 companies by market capitalization',
                stocks: [
                    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
                    'KOTAKBANK', 'LT', 'ITC', 'SBIN', 'BHARTIARTL', 'ASIANPAINT',
                    'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA',
                    'TITAN', 'NESTLEIND', 'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC',
                    'TECHM', 'POWERGRID', 'LTIM', 'NTPC', 'JSWSTEEL', 'TATAMOTORS',
                    'COALINDIA', 'GRASIM', 'HINDALCO', 'ADANIENT', 'INDUSINDBK',
                    'HDFCLIFE', 'SBILIFE', 'BRITANNIA', 'TATACONSUM', 'DIVISLAB',
                    'EICHERMOT', 'BPCL', 'CIPLA', 'APOLLOHOSP', 'HEROMOTOCO',
                    'DRREDDY', 'UPL', 'BAJAJ-AUTO', 'SHRIRAMFIN', 'GODREJCP'
                ],
                totalStocks: 50,
                lastUpdated: new Date()
            },
            {
                _id: 'NIFTYNEXT50',
                name: 'Nifty Next 50',
                category: 'MID_CAP',
                description: 'Next 50 companies after Nifty 50',
                stocks: [
                    'PIDILITIND', 'DABUR', 'MARICO', 'MCDOWELL-N', 'COLPAL', 'BERGEPAINT',
                    'TRENT', 'PAGEIND', 'HAVELLS', 'VOLTAS', 'CUMMINSIND', 'MPHASIS',
                    'PERSISTENT', 'COFORGE', 'MINDTREE', 'LICI', 'NMDC', 'SAIL',
                    'VEDL', 'HINDZINC', 'AMBUJACEM', 'ACC', 'SHREECEM', 'RAMCOCEM',
                    'JINDALSTEL', 'TATASTEEL', 'JSWENERGY', 'TORNTPHARM', 'LUPIN',
                    'AUBANK', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK', 'PNB',
                    'CANBK', 'IOC', 'GAIL', 'PETRONET', 'IGL', 'MGL', 'ATGL',
                    'RECLTD', 'PFC', 'IRCTC', 'CONCOR', 'GMRINFRA', 'ADANIPORTS',
                    'SIEMENS', 'ABB', 'BHEL', 'BEL'
                ],
                totalStocks: 50,
                lastUpdated: new Date()
            },
            {
                _id: 'NIFTYSMALLCAP100',
                name: 'Nifty SmallCap 100',
                category: 'SMALL_CAP',
                description: 'Top 100 small-cap companies',
                stocks: [
                    'TATAINVEST', 'CREDITACC', 'MANAPPURAM', 'UJJIVAN', 'CHOLAFIN',
                    'MOTILALOFS', 'IIFL', 'ANGELONE', 'POLICYBZR', 'PAYTM',
                    'ZOMATO', 'NYKAA', 'DELHIVERY', 'EASEMYTRIP', 'CARTRADE',
                    'DEVYANI', 'BHARATFORG', 'ESCORTS', 'EXIDEIND', 'MOTHERSON',
                    'ASHOKLEY', 'BALKRISIND', 'APOLLOTYRE', 'CEAT', 'MRF',
                    'RELAXO', 'BATAINDIA', 'VBL', 'MARICO', 'GODREJIND',
                    'HONAUT', 'THERMAX', 'CROMPTON', 'POLYCAB', 'FINOLEX',
                    'ASTRAL', 'SUPREME', 'NILKAMAL', 'KANSAINER', 'SINTEX'
                ],
                totalStocks: 100,
                lastUpdated: new Date()
            }
        ];
        indices.forEach(function (index) {
            _this.mockIndexDB.set(index._id, index);
        });
        console.log("\uD83D\uDCCA Initialized ".concat(indices.length, " stock indices with ").concat(indices.reduce(function (sum, idx) { return sum + idx.totalStocks; }, 0), " total stocks"));
    };
    /**
     * Get stock by symbol
     */
    StockDatabaseService.getStock = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var stock;
            return __generator(this, function (_b) {
                try {
                    stock = this.mockStockDB.get(symbol.toUpperCase());
                    return [2 /*return*/, stock || null];
                }
                catch (error) {
                    console.error("\u274C Error fetching stock ".concat(symbol, ":"), error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Update stock price data
     */
    StockDatabaseService.updateStockPrice = function (symbol, priceData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, newStock;
            return __generator(this, function (_b) {
                try {
                    existing = this.mockStockDB.get(symbol.toUpperCase());
                    if (existing) {
                        existing.price = priceData.price;
                        existing.dayChange = priceData.dayChange;
                        existing.dayChangePercent = priceData.dayChangePercent;
                        existing.volume = priceData.volume;
                        existing.lastPriceUpdate = new Date();
                        existing.updatedAt = new Date();
                        this.mockStockDB.set(symbol.toUpperCase(), existing);
                    }
                    else {
                        newStock = {
                            _id: symbol.toUpperCase(),
                            name: "".concat(symbol, " Limited"),
                            sector: 'Unknown',
                            marketCapCategory: 'SMALL_CAP',
                            price: priceData.price,
                            dayChange: priceData.dayChange,
                            dayChangePercent: priceData.dayChangePercent,
                            volume: priceData.volume,
                            fundamentals: {},
                            lastPriceUpdate: new Date(),
                            lastFundamentalUpdate: new Date(0),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            indices: []
                        };
                        this.mockStockDB.set(symbol.toUpperCase(), newStock);
                    }
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error("\u274C Error updating stock price for ".concat(symbol, ":"), error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Update stock fundamentals from screener.in
     */
    StockDatabaseService.updateStockFundamentals = function (symbol, fundamentals, companyInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, newStock;
            return __generator(this, function (_b) {
                try {
                    existing = this.mockStockDB.get(symbol.toUpperCase());
                    if (existing) {
                        existing.fundamentals = __assign(__assign({}, existing.fundamentals), fundamentals);
                        existing.lastFundamentalUpdate = new Date();
                        existing.updatedAt = new Date();
                        if (companyInfo) {
                            if (companyInfo.name)
                                existing.name = companyInfo.name;
                            if (companyInfo.sector)
                                existing.sector = companyInfo.sector;
                            if (companyInfo.industry)
                                existing.industry = companyInfo.industry;
                        }
                        // Update market cap category based on fundamentals
                        if (fundamentals.marketCap) {
                            existing.marketCapCategory = this.determineMarketCapCategory(fundamentals.marketCap);
                        }
                        // Update index memberships
                        existing.indices = this.determineIndexMemberships(symbol);
                        this.mockStockDB.set(symbol.toUpperCase(), existing);
                    }
                    else {
                        newStock = {
                            _id: symbol.toUpperCase(),
                            name: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.name) || "".concat(symbol, " Limited"),
                            sector: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.sector) || 'Unknown',
                            industry: companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.industry,
                            marketCapCategory: fundamentals.marketCap ?
                                this.determineMarketCapCategory(fundamentals.marketCap) : 'SMALL_CAP',
                            price: 0,
                            dayChange: 0,
                            dayChangePercent: 0,
                            volume: 0,
                            fundamentals: fundamentals,
                            lastPriceUpdate: new Date(0),
                            lastFundamentalUpdate: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            indices: this.determineIndexMemberships(symbol)
                        };
                        this.mockStockDB.set(symbol.toUpperCase(), newStock);
                    }
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error("\u274C Error updating stock fundamentals for ".concat(symbol, ":"), error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Determine market cap category from screener.in market cap string
     */
    StockDatabaseService.determineMarketCapCategory = function (marketCapStr) {
        var cleanStr = marketCapStr.replace(/[₹,]/g, '').trim().toUpperCase();
        var match = cleanStr.match(/(\d+(?:\.\d+)?)\s*([A-Z]+)/);
        if (!match)
            return 'SMALL_CAP';
        var value = parseFloat(match[1]);
        var unit = match[2];
        var crores;
        if (unit.includes('L')) {
            crores = value * 100000; // Lakh crores
        }
        else if (unit.includes('CR') || unit.includes('CRORE')) {
            crores = value;
        }
        else {
            crores = value;
        }
        // SEBI guidelines
        if (crores > 20000)
            return 'LARGE_CAP';
        else if (crores > 5000)
            return 'MID_CAP';
        else
            return 'SMALL_CAP';
    };
    /**
     * Determine index memberships for a stock
     */
    StockDatabaseService.determineIndexMemberships = function (symbol) {
        var memberships = [];
        Array.from(this.mockIndexDB.entries()).forEach(function (_b) {
            var indexId = _b[0], index = _b[1];
            if (index.stocks.includes(symbol.toUpperCase())) {
                memberships.push(indexId);
            }
        });
        return memberships;
    };
    /**
     * Get stocks by market cap category
     */
    StockDatabaseService.getStocksByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var stocks_1;
            return __generator(this, function (_b) {
                try {
                    stocks_1 = [];
                    Array.from(this.mockStockDB.values()).forEach(function (stock) {
                        if (stock.marketCapCategory === category && stock.price > 0 &&
                            Object.keys(stock.fundamentals).length > 0) {
                            stocks_1.push(stock);
                        }
                    });
                    return [2 /*return*/, stocks_1.sort(function (a, b) { return (b.qualityScore || 0) - (a.qualityScore || 0); })];
                }
                catch (error) {
                    console.error("\u274C Error fetching stocks by category ".concat(category, ":"), error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get all indices
     */
    StockDatabaseService.getAllIndices = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                try {
                    return [2 /*return*/, Array.from(this.mockIndexDB.values())];
                }
                catch (error) {
                    console.error("\u274C Error fetching indices:", error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get stocks that need price updates (older than 1 hour)
     */
    StockDatabaseService.getStocksNeedingPriceUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oneHourAgo_1, symbols_1;
            return __generator(this, function (_b) {
                try {
                    oneHourAgo_1 = new Date(Date.now() - 60 * 60 * 1000);
                    symbols_1 = [];
                    Array.from(this.mockStockDB.values()).forEach(function (stock) {
                        if (stock.lastPriceUpdate < oneHourAgo_1) {
                            symbols_1.push(stock._id);
                        }
                    });
                    return [2 /*return*/, symbols_1];
                }
                catch (error) {
                    console.error("\u274C Error fetching stocks needing price update:", error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get stocks that need fundamental updates (older than 24 hours)
     */
    StockDatabaseService.getStocksNeedingFundamentalUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oneDayAgo_1, symbols_2, allSymbols_1;
            var _this = this;
            return __generator(this, function (_b) {
                try {
                    oneDayAgo_1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    symbols_2 = [];
                    allSymbols_1 = new Set();
                    Array.from(this.mockIndexDB.values()).forEach(function (index) {
                        index.stocks.forEach(function (symbol) { return allSymbols_1.add(symbol); });
                    });
                    Array.from(allSymbols_1).forEach(function (symbol) {
                        var stock = _this.mockStockDB.get(symbol);
                        if (!stock || stock.lastFundamentalUpdate < oneDayAgo_1) {
                            symbols_2.push(symbol);
                        }
                    });
                    return [2 /*return*/, symbols_2];
                }
                catch (error) {
                    console.error("\u274C Error fetching stocks needing fundamental update:", error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Log data update operation
     */
    StockDatabaseService.logUpdate = function (log) {
        return __awaiter(this, void 0, void 0, function () {
            var logEntry;
            return __generator(this, function (_b) {
                try {
                    logEntry = __assign({ _id: "".concat(log.type, "-").concat(Date.now()) }, log);
                    this.mockUpdateLogs.push(logEntry);
                    // Keep only last 100 logs
                    if (this.mockUpdateLogs.length > 100) {
                        this.mockUpdateLogs.splice(0, this.mockUpdateLogs.length - 100);
                    }
                    console.log("\uD83D\uDCDD Logged ".concat(log.type, " operation: ").concat(log.status, ", ").concat(log.recordsUpdated, " records, ").concat(log.duration, "ms"));
                }
                catch (error) {
                    console.error("\u274C Error logging update:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get database statistics
     */
    StockDatabaseService.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oneHourAgo_2, oneDayAgo_2, stocksWithPrices_1, stocksWithFundamentals_1, recentPriceUpdates_1, recentFundamentalUpdates_1, lastUpdate_1;
            return __generator(this, function (_b) {
                try {
                    oneHourAgo_2 = new Date(Date.now() - 60 * 60 * 1000);
                    oneDayAgo_2 = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    stocksWithPrices_1 = 0;
                    stocksWithFundamentals_1 = 0;
                    recentPriceUpdates_1 = 0;
                    recentFundamentalUpdates_1 = 0;
                    lastUpdate_1 = null;
                    Array.from(this.mockStockDB.values()).forEach(function (stock) {
                        if (stock.price > 0)
                            stocksWithPrices_1++;
                        if (Object.keys(stock.fundamentals).length > 0)
                            stocksWithFundamentals_1++;
                        if (stock.lastPriceUpdate > oneHourAgo_2)
                            recentPriceUpdates_1++;
                        if (stock.lastFundamentalUpdate > oneDayAgo_2)
                            recentFundamentalUpdates_1++;
                        if (!lastUpdate_1 || stock.updatedAt > lastUpdate_1) {
                            lastUpdate_1 = stock.updatedAt;
                        }
                    });
                    return [2 /*return*/, {
                            totalStocks: this.mockStockDB.size,
                            stocksWithPrices: stocksWithPrices_1,
                            stocksWithFundamentals: stocksWithFundamentals_1,
                            recentPriceUpdates: recentPriceUpdates_1,
                            recentFundamentalUpdates: recentFundamentalUpdates_1,
                            totalIndices: this.mockIndexDB.size,
                            lastUpdate: lastUpdate_1
                        }];
                }
                catch (error) {
                    console.error("\u274C Error getting database stats:", error);
                    return [2 /*return*/, {
                            totalStocks: 0,
                            stocksWithPrices: 0,
                            stocksWithFundamentals: 0,
                            recentPriceUpdates: 0,
                            recentFundamentalUpdates: 0,
                            totalIndices: 0,
                            lastUpdate: null
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Clear all data (for testing/reset)
     */
    StockDatabaseService.clearAllData = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                this.mockStockDB.clear();
                this.mockUpdateLogs.length = 0;
                console.log("\uD83D\uDDD1\uFE0F Cleared all stock data");
                return [2 /*return*/];
            });
        });
    };
    var _a;
    _a = StockDatabaseService;
    StockDatabaseService.mockStockDB = new Map();
    StockDatabaseService.mockIndexDB = new Map();
    StockDatabaseService.mockUpdateLogs = [];
    // Initialize with some sample data
    (function () {
        _a.initializeSampleData();
    })();
    return StockDatabaseService;
}());
exports["default"] = StockDatabaseService;
