"use strict";
/**
 * News Search Service
 * Handles dynamic stock discovery, news search, and trending stocks analysis
 */
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
exports.__esModule = true;
exports.NewsSearchService = void 0;
var NewsSearchService = /** @class */ (function () {
    function NewsSearchService() {
    }
    /**
     * Discover trending/best performing stocks through web search
     */
    NewsSearchService.discoverTrendingStocks = function (timeframe) {
        if (timeframe === void 0) { timeframe = 'recent'; }
        return __awaiter(this, void 0, void 0, function () {
            var searchQueries, discoveredStocks_1, _i, searchQueries_1, query, WebSearch, searchResults, extractedStocks, error_1, trendingStocks, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 14, , 16]);
                        console.log("\uD83D\uDD0D Discovering trending stocks for timeframe: ".concat(timeframe, "..."));
                        searchQueries = this.getTrendingStockQueries(timeframe);
                        discoveredStocks_1 = new Map();
                        _i = 0, searchQueries_1 = searchQueries;
                        _a.label = 1;
                    case 1:
                        if (!(_i < searchQueries_1.length)) return [3 /*break*/, 10];
                        query = searchQueries_1[_i];
                        console.log("\uD83D\uDD0E Searching: \"".concat(query, "\""));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 9]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/webSearchUtil')); })];
                    case 3:
                        WebSearch = (_a.sent()).WebSearch;
                        return [4 /*yield*/, WebSearch(query)];
                    case 4:
                        searchResults = _a.sent();
                        if (!(searchResults && searchResults.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.extractStocksFromSearchResults(searchResults, query)];
                    case 5:
                        extractedStocks = _a.sent();
                        // Merge results with confidence scoring
                        extractedStocks.forEach(function (stock) {
                            if (discoveredStocks_1.has(stock.symbol)) {
                                // Increase confidence for stocks found in multiple searches
                                var existing = discoveredStocks_1.get(stock.symbol);
                                existing.confidence = Math.min(95, existing.confidence + 15);
                            }
                            else {
                                discoveredStocks_1.set(stock.symbol, stock);
                            }
                        });
                        _a.label = 6;
                    case 6: 
                    // Add delay between searches to be respectful
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 7:
                        // Add delay between searches to be respectful
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        console.error("\u274C Error searching \"".concat(query, "\":"), error_1);
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10:
                        trendingStocks = Array.from(discoveredStocks_1.values())
                            .sort(function (a, b) { return b.confidence - a.confidence; })
                            .slice(0, 15);
                        console.log("\u2705 Discovered ".concat(trendingStocks.length, " trending stocks"));
                        if (!(trendingStocks.length > 0)) return [3 /*break*/, 11];
                        return [2 /*return*/, trendingStocks];
                    case 11:
                        console.log("\u26A0\uFE0F No trending stocks found via web search, trying targeted stock discovery...");
                        return [4 /*yield*/, this.getTargetedStockDiscovery()];
                    case 12: return [2 /*return*/, _a.sent()];
                    case 13: return [3 /*break*/, 16];
                    case 14:
                        error_2 = _a.sent();
                        console.error('❌ Error discovering trending stocks:', error_2);
                        console.log("\uD83C\uDFAF Using targeted stock discovery due to discovery error...");
                        return [4 /*yield*/, this.getTargetedStockDiscovery()];
                    case 15: return [2 /*return*/, _a.sent()];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Targeted stock discovery using rate-limited searches for specific high-quality companies
     */
    NewsSearchService.getTargetedStockDiscovery = function () {
        return __awaiter(this, void 0, void 0, function () {
            var targetedQueries, discoveredStocks, _i, targetedQueries_1, query, WebSearch, searchResults, extractedStocks, error_3, targetedStocks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83C\uDFAF Starting CONSERVATIVE targeted stock discovery with minimal API calls...");
                        targetedQueries = [
                            // Only top 3 large cap searches  
                            "TCS Tata Consultancy Services stock NSE latest",
                            "HDFCBANK HDFC Bank stock analysis",
                            "RELIANCE Industries stock price",
                            // Only 1 mid cap search
                            "CIPLA pharmaceutical stock NSE",
                            // Only 1 small cap search  
                            "TRENT retail stock NSE performance"
                        ];
                        discoveredStocks = new Map();
                        _i = 0, targetedQueries_1 = targetedQueries;
                        _a.label = 1;
                    case 1:
                        if (!(_i < targetedQueries_1.length)) return [3 /*break*/, 10];
                        query = targetedQueries_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 9]);
                        console.log("\uD83D\uDD0D Targeted search: \"".concat(query, "\""));
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/webSearchUtil')); })];
                    case 3:
                        WebSearch = (_a.sent()).WebSearch;
                        return [4 /*yield*/, WebSearch(query, 3)];
                    case 4:
                        searchResults = _a.sent();
                        if (!(searchResults && searchResults.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.extractStocksFromSearchResults(searchResults, query)];
                    case 5:
                        extractedStocks = _a.sent();
                        extractedStocks.forEach(function (stock) {
                            var existing = discoveredStocks.get(stock.symbol);
                            if (!existing || stock.confidence > existing.confidence) {
                                discoveredStocks.set(stock.symbol, stock);
                            }
                        });
                        _a.label = 6;
                    case 6: 
                    // Add LONGER delay between searches to be very conservative with API usage
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2500); })];
                    case 7:
                        // Add LONGER delay between searches to be very conservative with API usage
                        _a.sent(); // 2.5 seconds between searches
                        return [3 /*break*/, 9];
                    case 8:
                        error_3 = _a.sent();
                        console.warn("\u26A0\uFE0F Error in targeted search for \"".concat(query, "\":"), error_3);
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10:
                        targetedStocks = Array.from(discoveredStocks.values())
                            .sort(function (a, b) { return b.confidence - a.confidence; })
                            .slice(0, 15);
                        console.log("\u2705 Targeted discovery found ".concat(targetedStocks.length, " quality stocks"));
                        // If we still don't have enough stocks, use a minimal emergency set
                        if (targetedStocks.length < 5) {
                            console.log("\u26A0\uFE0F Insufficient stocks from targeted discovery, using emergency minimal set...");
                            return [2 /*return*/, this.getEmergencyMinimalStocks()];
                        }
                        return [2 /*return*/, targetedStocks];
                }
            });
        });
    };
    /**
     * Emergency minimal stock set when all discovery methods fail
     */
    NewsSearchService.getEmergencyMinimalStocks = function () {
        // Only return the absolute minimum required for basic functionality
        var emergencyStocks = [
            { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', marketCap: 'LARGE_CAP', sector: 'Oil & Gas', reason: 'Market leader - emergency fallback', confidence: 80 },
            { symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', marketCap: 'LARGE_CAP', sector: 'Information Technology', reason: 'IT services leader - emergency fallback', confidence: 79 },
            { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', marketCap: 'LARGE_CAP', sector: 'Banking', reason: 'Banking leader - emergency fallback', confidence: 78 },
            { symbol: 'CIPLA', companyName: 'Cipla Limited', marketCap: 'MID_CAP', sector: 'Pharmaceuticals', reason: 'Pharma leader - emergency fallback', confidence: 77 },
            { symbol: 'TRENT', companyName: 'Trent Limited', marketCap: 'SMALL_CAP', sector: 'Retail', reason: 'Retail growth - emergency fallback', confidence: 76 }
        ];
        console.log("\uD83D\uDEA8 Using emergency minimal stock set: ".concat(emergencyStocks.length, " stocks"));
        return emergencyStocks;
    };
    /**
     * Search for specific stock news and analysis
     */
    NewsSearchService.getStockNews = function (symbol, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            var searchStockNews, searchResults, newsArticles, sortedNews, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log("\uD83D\uDCF0 Fetching news for ".concat(symbol, " (").concat(companyName, ")..."));
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/webSearchUtil')); })];
                    case 1:
                        searchStockNews = (_a.sent()).searchStockNews;
                        return [4 /*yield*/, searchStockNews(symbol, companyName)];
                    case 2:
                        searchResults = _a.sent();
                        if (!(searchResults && searchResults.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.extractNewsFromSearchResults(searchResults, symbol)];
                    case 3:
                        newsArticles = _a.sent();
                        sortedNews = newsArticles
                            .sort(function (a, b) { return b.relevanceScore - a.relevanceScore; })
                            .slice(0, 5);
                        console.log("\u2705 Found ".concat(sortedNews.length, " relevant news articles for ").concat(symbol));
                        return [2 /*return*/, sortedNews];
                    case 4:
                        // Fallback to generic news if no specific results
                        console.log("\u26A0\uFE0F No specific news found for ".concat(symbol, ", using fallback"));
                        return [2 /*return*/, this.getFallbackNews(symbol, companyName)];
                    case 5:
                        error_4 = _a.sent();
                        console.error('❌ Error fetching stock news:', error_4);
                        return [2 /*return*/, this.getFallbackNews(symbol, companyName)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Provide fallback news when search is not available
     */
    NewsSearchService.getFallbackNews = function (symbol, companyName) {
        var currentDate = new Date().toISOString();
        return [
            {
                headline: "".concat(companyName, " Stock Analysis and Market Outlook"),
                summary: "Current market analysis for ".concat(companyName, " (").concat(symbol, ") suggests mixed sentiment with focus on fundamental performance and technical indicators."),
                url: "#".concat(symbol.toLowerCase(), "-analysis"),
                publishedAt: currentDate,
                sentiment: 'NEUTRAL',
                relevanceScore: 75,
                source: 'Market Analysis'
            },
            {
                headline: "".concat(symbol, " Technical and Fundamental Review"),
                summary: "Comprehensive review of ".concat(companyName, " covering technical analysis, fundamental metrics, and future growth prospects based on current market conditions."),
                url: "#".concat(symbol.toLowerCase(), "-review"),
                publishedAt: currentDate,
                sentiment: 'POSITIVE',
                relevanceScore: 70,
                source: 'Investment Research'
            }
        ];
    };
    /**
     * Analyze overall market trends and sentiment
     */
    NewsSearchService.analyzeMarketTrends = function () {
        return __awaiter(this, void 0, void 0, function () {
            var marketQueries, trendingStocks, sectorAnalysis, positiveCount, totalStocks, marketSentiment, marketSummary, trends, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('📊 Analyzing current market trends...');
                        marketQueries = [
                            'best performing indian stocks 2025 NSE BSE',
                            'top sectoral gainers indian stock market today',
                            'bullish bearish market sentiment india stocks',
                            'large cap mid cap small cap best stocks 2025'
                        ];
                        return [4 /*yield*/, this.discoverTrendingStocks('recent')];
                    case 1:
                        trendingStocks = _a.sent();
                        sectorAnalysis = this.analyzeSectorDistribution(trendingStocks);
                        positiveCount = trendingStocks.filter(function (stock) {
                            return stock.reason.toLowerCase().includes('gain') ||
                                stock.reason.toLowerCase().includes('growth') ||
                                stock.reason.toLowerCase().includes('bullish');
                        }).length;
                        totalStocks = trendingStocks.length;
                        marketSentiment = 'MIXED';
                        if (positiveCount / totalStocks > 0.7) {
                            marketSentiment = 'BULLISH';
                        }
                        else if (positiveCount / totalStocks < 0.3) {
                            marketSentiment = 'BEARISH';
                        }
                        marketSummary = this.generateMarketSummary(trendingStocks, marketSentiment, sectorAnalysis);
                        trends = {
                            trending_stocks: trendingStocks,
                            market_sentiment: marketSentiment,
                            key_sectors: sectorAnalysis,
                            market_summary: marketSummary
                        };
                        console.log("\u2705 Market analysis complete: ".concat(marketSentiment, " sentiment with ").concat(sectorAnalysis.length, " active sectors"));
                        return [2 /*return*/, trends];
                    case 2:
                        error_5 = _a.sent();
                        console.error('❌ Error analyzing market trends:', error_5);
                        return [2 /*return*/, {
                                trending_stocks: [],
                                market_sentiment: 'MIXED',
                                key_sectors: [],
                                market_summary: 'Unable to analyze market trends at the moment.'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get search queries for different timeframes
     */
    NewsSearchService.getTrendingStockQueries = function (timeframe) {
        // DRASTICALLY reduced queries to prevent API overuse
        var baseQueries = [
            'best indian stocks NSE 2025' // Only 1 base query instead of 3
        ];
        switch (timeframe) {
            case '6months':
                return [
                    'top indian stocks 6 months 2025' // Only 1 query per timeframe
                ];
            case '1year':
                return [
                    'best indian stocks 2024 returns' // Only 1 query per timeframe
                ];
            default: // recent
                return baseQueries; // Use only the 1 base query
        }
    };
    /**
     * Extract stock information from search results
     */
    NewsSearchService.extractStocksFromSearchResults = function (searchResults, query) {
        return __awaiter(this, void 0, void 0, function () {
            var stocks, ExcelBasedStockAnalysisService, _i, _a, result, content, stockSymbols, companyNames, _b, stockSymbols_1, symbol, companyInfo, marketCap, sector, reason, _c, companyNames_1, name_1, companies, company, marketCap, sector, reason, uniqueStocks;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        stocks = [];
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./excelBasedStockAnalysis')); })];
                    case 1:
                        ExcelBasedStockAnalysisService = (_d.sent()).ExcelBasedStockAnalysisService;
                        for (_i = 0, _a = searchResults.slice(0, 5); _i < _a.length; _i++) { // Process top 5 results
                            result = _a[_i];
                            try {
                                content = "".concat(result.title, " ").concat(result.snippet).toLowerCase();
                                stockSymbols = this.extractStockSymbols(content);
                                companyNames = this.extractCompanyNames(content);
                                // Validate stocks using our internal database
                                for (_b = 0, stockSymbols_1 = stockSymbols; _b < stockSymbols_1.length; _b++) {
                                    symbol = stockSymbols_1[_b];
                                    companyInfo = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
                                    if (companyInfo) {
                                        marketCap = this.determineMarketCap(companyInfo.name, content);
                                        sector = this.determineSector(companyInfo.name, content);
                                        reason = this.extractStockReason(content, symbol, companyInfo.name);
                                        stocks.push({
                                            symbol: symbol,
                                            companyName: companyInfo.name,
                                            marketCap: marketCap,
                                            sector: sector,
                                            reason: reason,
                                            confidence: this.calculateStockConfidence(content, symbol, query)
                                        });
                                    }
                                }
                                // Also try to find stocks by company names mentioned
                                for (_c = 0, companyNames_1 = companyNames; _c < companyNames_1.length; _c++) {
                                    name_1 = companyNames_1[_c];
                                    companies = ExcelBasedStockAnalysisService.searchCompanies(name_1, 1);
                                    if (companies.length > 0) {
                                        company = companies[0];
                                        marketCap = this.determineMarketCap(company.name, content);
                                        sector = this.determineSector(company.name, content);
                                        reason = this.extractStockReason(content, company.symbol, company.name);
                                        stocks.push({
                                            symbol: company.symbol,
                                            companyName: company.name,
                                            marketCap: marketCap,
                                            sector: sector,
                                            reason: reason,
                                            confidence: this.calculateStockConfidence(content, company.symbol, query)
                                        });
                                    }
                                }
                            }
                            catch (error) {
                                console.error('❌ Error extracting stocks from result:', error);
                                continue;
                            }
                        }
                        uniqueStocks = stocks.filter(function (stock, index, self) {
                            return index === self.findIndex(function (s) { return s.symbol === stock.symbol; });
                        });
                        return [2 /*return*/, uniqueStocks];
                }
            });
        });
    };
    /**
     * Extract news from search results
     */
    NewsSearchService.extractNewsFromSearchResults = function (searchResults, symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var news, _i, _a, result, sentiment, relevanceScore;
            return __generator(this, function (_b) {
                news = [];
                for (_i = 0, _a = searchResults.slice(0, 3); _i < _a.length; _i++) {
                    result = _a[_i];
                    try {
                        sentiment = this.analyzeSentiment(result.title + ' ' + result.snippet);
                        relevanceScore = this.calculateNewsRelevance(result, symbol);
                        if (relevanceScore > 30) { // Only include relevant news
                            news.push({
                                headline: result.title,
                                summary: result.snippet,
                                sentiment: sentiment,
                                source: this.extractSource(result.url),
                                publishedAt: new Date().toISOString(),
                                relevanceScore: relevanceScore,
                                url: result.url
                            });
                        }
                    }
                    catch (error) {
                        console.error('❌ Error extracting news from result:', error);
                        continue;
                    }
                }
                return [2 /*return*/, news];
            });
        });
    };
    // Helper methods
    NewsSearchService.extractStockSymbols = function (content) {
        var symbolPattern = /\b[A-Z]{3,12}\b/g;
        var matches = content.toUpperCase().match(symbolPattern) || [];
        // Filter out common false positives
        var falsePositives = ['NSE', 'BSE', 'SEBI', 'RBI', 'FII', 'DII', 'IPO', 'CEO', 'CFO', 'USA', 'UK', 'UAE', 'GDP', 'CPI'];
        return matches.filter(function (symbol) { return !falsePositives.includes(symbol); });
    };
    NewsSearchService.extractCompanyNames = function (content) {
        // Look for company-like patterns (capitalized words, "Ltd", "Limited", etc.)
        var companyPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Ltd|Limited|Corporation|Corp|Inc|Industries|Bank|Insurance|Motors|Steel|Power|Energy|Pharma|Pharmaceuticals)))/g;
        var matches = content.match(companyPattern) || [];
        return matches.map(function (name) { return name.trim(); });
    };
    NewsSearchService.determineMarketCap = function (companyName, content) {
        var largeCap = ['reliance', 'tcs', 'hdfc', 'icici', 'infosys', 'bharti', 'sbi', 'itc', 'hindustan unilever', 'larsen'];
        var name = companyName.toLowerCase();
        if (largeCap.some(function (large) { return name.includes(large); }))
            return 'LARGE_CAP';
        if (content.includes('small cap') || content.includes('smallcap'))
            return 'SMALL_CAP';
        if (content.includes('mid cap') || content.includes('midcap'))
            return 'MID_CAP';
        // Default classification based on common knowledge
        return largeCap.some(function (large) { return name.includes(large); }) ? 'LARGE_CAP' : 'MID_CAP';
    };
    NewsSearchService.determineSector = function (companyName, content) {
        var sectorKeywords = {
            'IT': ['software', 'technology', 'tech', 'IT'],
            'Banking': ['bank', 'banking', 'finance', 'financial'],
            'Pharma': ['pharma', 'pharmaceutical', 'drug', 'medicine'],
            'Auto': ['auto', 'automobile', 'car', 'motor', 'vehicle'],
            'Energy': ['oil', 'gas', 'energy', 'petroleum', 'power'],
            'Telecom': ['telecom', 'telecommunication', 'mobile', 'airtel']
        };
        var lowerContent = content.toLowerCase();
        var lowerName = companyName.toLowerCase();
        for (var _i = 0, _a = Object.entries(sectorKeywords); _i < _a.length; _i++) {
            var _b = _a[_i], sector = _b[0], keywords = _b[1];
            if (keywords.some(function (keyword) { return lowerContent.includes(keyword) || lowerName.includes(keyword); })) {
                return this.SECTORS_MAP[sector] || sector;
            }
        }
        return 'Diversified';
    };
    NewsSearchService.extractStockReason = function (content, symbol, companyName) {
        var reasonKeywords = {
            'Strong earnings growth': ['earnings', 'profit', 'revenue', 'growth'],
            'Positive market sentiment': ['bullish', 'positive', 'optimistic', 'confident'],
            'Sector outperformance': ['outperform', 'leader', 'top performer'],
            'Recent developments': ['expansion', 'acquisition', 'new product', 'partnership']
        };
        var lowerContent = content.toLowerCase();
        for (var _i = 0, _a = Object.entries(reasonKeywords); _i < _a.length; _i++) {
            var _b = _a[_i], reason = _b[0], keywords = _b[1];
            if (keywords.some(function (keyword) { return lowerContent.includes(keyword); })) {
                return reason;
            }
        }
        return 'Market momentum and investor interest';
    };
    NewsSearchService.calculateStockConfidence = function (content, symbol, query) {
        var confidence = 50; // Base confidence
        // Increase confidence for direct mentions
        if (content.includes(symbol.toLowerCase()))
            confidence += 20;
        // Increase confidence for performance indicators
        var performanceKeywords = ['gain', 'up', 'rise', 'bullish', 'target', 'buy'];
        var matchingKeywords = performanceKeywords.filter(function (keyword) { return content.includes(keyword); }).length;
        confidence += matchingKeywords * 5;
        // Query relevance boost
        if (query.includes('best') || query.includes('top'))
            confidence += 10;
        return Math.min(95, confidence);
    };
    NewsSearchService.analyzeSentiment = function (text) {
        var positiveWords = ['gain', 'rise', 'up', 'bullish', 'positive', 'strong', 'growth', 'buy', 'outperform'];
        var negativeWords = ['fall', 'drop', 'down', 'bearish', 'negative', 'weak', 'decline', 'sell', 'underperform'];
        var lowerText = text.toLowerCase();
        var positiveCount = positiveWords.filter(function (word) { return lowerText.includes(word); }).length;
        var negativeCount = negativeWords.filter(function (word) { return lowerText.includes(word); }).length;
        if (positiveCount > negativeCount)
            return 'POSITIVE';
        if (negativeCount > positiveCount)
            return 'NEGATIVE';
        return 'NEUTRAL';
    };
    NewsSearchService.calculateNewsRelevance = function (result, symbol) {
        var relevance = 0;
        var content = "".concat(result.title, " ").concat(result.snippet).toLowerCase();
        if (content.includes(symbol.toLowerCase()))
            relevance += 40;
        if (content.includes('stock') || content.includes('share'))
            relevance += 20;
        if (content.includes('analysis') || content.includes('recommendation'))
            relevance += 20;
        if (content.includes('price') || content.includes('target'))
            relevance += 15;
        return Math.min(100, relevance);
    };
    NewsSearchService.extractSource = function (url) {
        try {
            var domain = new URL(url).hostname;
            return domain.replace('www.', '');
        }
        catch (_a) {
            return 'Unknown Source';
        }
    };
    NewsSearchService.deduplicateNews = function (news) {
        var seen = new Set();
        return news.filter(function (article) {
            var key = article.headline.toLowerCase().substring(0, 50);
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    };
    NewsSearchService.analyzeSectorDistribution = function (stocks) {
        var sectorCounts = {};
        stocks.forEach(function (stock) {
            sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
        });
        return Object.entries(sectorCounts)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .map(function (_a) {
            var sector = _a[0];
            return sector;
        });
    };
    NewsSearchService.generateMarketSummary = function (stocks, sentiment, sectors) {
        var stockCount = stocks.length;
        var topSectors = sectors.slice(0, 3).join(', ');
        return "Current market shows ".concat(sentiment.toLowerCase(), " sentiment with ").concat(stockCount, " trending stocks. ") +
            "Key active sectors include ".concat(topSectors, ". ") +
            "Market is driven by sectoral rotation and earnings momentum.";
    };
    /**
     * Test the news search functionality
     */
    NewsSearchService.testNewsSearch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var trending, news, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing News Search Service...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Test trending stocks discovery
                        console.log('1. Testing trending stocks discovery...');
                        return [4 /*yield*/, this.discoverTrendingStocks('recent')];
                    case 2:
                        trending = _a.sent();
                        console.log("\u2705 Found ".concat(trending.length, " trending stocks"));
                        if (trending.length > 0) {
                            console.log("\uD83D\uDCCA Sample: ".concat(trending[0].companyName, " (").concat(trending[0].symbol, ") - ").concat(trending[0].reason));
                        }
                        if (!(trending.length > 0)) return [3 /*break*/, 4];
                        console.log('2. Testing stock news search...');
                        return [4 /*yield*/, this.getStockNews(trending[0].symbol, trending[0].companyName)];
                    case 3:
                        news = _a.sent();
                        console.log("\u2705 Found ".concat(news.length, " news articles"));
                        if (news.length > 0) {
                            console.log("\uD83D\uDCF0 Sample: ".concat(news[0].headline, " - ").concat(news[0].sentiment));
                        }
                        _a.label = 4;
                    case 4:
                        console.log('✅ News Search Service test completed');
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        console.error('❌ News Search Service test failed:', error_6);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    NewsSearchService.SECTORS_MAP = {
        'IT': 'Information Technology',
        'Banking': 'Banking & Finance',
        'Pharma': 'Pharmaceuticals',
        'Auto': 'Automobile',
        'FMCG': 'Consumer Goods',
        'Telecom': 'Telecommunications',
        'Energy': 'Oil & Gas',
        'Infrastructure': 'Infrastructure & Construction',
        'Metals': 'Metals & Mining',
        'Textiles': 'Textiles',
        'Chemicals': 'Chemicals',
        'Cement': 'Cement',
        'Power': 'Power & Utilities',
        'Realty': 'Real Estate'
    };
    return NewsSearchService;
}());
exports.NewsSearchService = NewsSearchService;
