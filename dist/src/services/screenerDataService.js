"use strict";
/**
 * Screener.in Data Service - Extract comprehensive financial metrics
 * Dynamically constructs URLs and scrapes financial data from Screener.in
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
exports.ScreenerDataService = void 0;
var ScreenerDataService = /** @class */ (function () {
    function ScreenerDataService() {
    }
    /**
     * Build dynamic URL for Screener.in based on stock symbol
     */
    ScreenerDataService.buildScreenerUrl = function (stockSymbol) {
        var url = "".concat(this.BASE_URL, "/").concat(stockSymbol, "/consolidated/");
        console.log("\uD83D\uDCCA Built Screener URL for ".concat(stockSymbol, ": ").concat(url));
        return url;
    };
    /**
     * Extract financial metrics from Screener.in page
     */
    ScreenerDataService.getFinancialMetrics = function (stockSymbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, prompt_1, apiResponse, apiData, financialData, WebFetch, extractedData, hasQuarterlyData, hasShareholdingData, financialMetrics, jsonMatch, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log("\uD83D\uDCB0 Fetching financial data from Screener.in for ".concat(stockSymbol, "..."));
                        url = this.buildScreenerUrl(stockSymbol);
                        prompt_1 = "\n        IMPORTANT: Analyze the COMPLETE Screener.in page for stock ".concat(stockSymbol, " from TOP to BOTTOM.\n        This is a long page with multiple sections - you MUST scroll through ALL content to find the data.\n        \n        Extract comprehensive financial metrics from the ENTIRE page:\n        \n        BASIC METRICS (Located in TOP section):\n        - Market Cap (\u20B9 Cr)\n        - Current Price (\u20B9)\n        - Book Value (\u20B9)\n        - Dividend Yield (%)\n        - Face Value (\u20B9)\n        \n        PROFITABILITY RATIOS (Located in TOP section):\n        - EPS (Earnings Per Share) in \u20B9\n        - P/E Ratio\n        - ROE (Return on Equity) %\n        - ROCE (Return on Capital Employed) %\n        \n        FINANCIAL HEALTH (Located in TOP section):\n        - Debt to Equity Ratio\n        - Current Ratio\n        \n        OTHER RATIOS (Located in TOP section):\n        - P/BV (Price to Book Value)\n        - EV/EBITDA\n        \n        QUARTERLY RESULTS (CRITICAL - Located in MIDDLE section of page):\n        Scroll down to the MIDDLE section to find the \"Quarterly Results\" table.\n        From this table, extract data from the LAST 4 COLUMNS only (most recent quarters):\n        \n        IMPORTANT TABLE EXTRACTION RULES:\n        1. Find the \"Sales\" row - extract values from LAST 4 COLUMNS and label as \"revenue\"\n        2. Find the \"Net Profit\" row - extract values from LAST 4 COLUMNS and label as \"profit\"  \n        3. Find the \"EPS in Rs\" row - extract values from LAST 4 COLUMNS and label as \"eps\"\n        4. Quarter names are in the column headers of those LAST 4 COLUMNS\n        \n        CRITICAL COLUMN ORDER: The LAST column is the LATEST/MOST RECENT quarter.\n        - Last column (rightmost) = Latest quarter (e.g., Jun 2025)\n        - 2nd last column = Previous quarter (e.g., Mar 2025) \n        - 3rd last column = Quarter before that (e.g., Dec 2024)\n        - 4th last column = Oldest of the 4 quarters (e.g., Sep 2024)\n        \n        Return quarters in LATEST-TO-OLDEST order (most recent first):\n        - Quarter names from the last 4 column headers (latest first)\n        - Sales/Revenue values from \"Sales\" row, last 4 columns (in \u20B9 Cr)\n        - Net Profit values from \"Net Profit\" row, last 4 columns (in \u20B9 Cr)\n        - EPS values from \"EPS in Rs\" row, last 4 columns (in \u20B9)\n        \n        SHAREHOLDING PATTERN (CRITICAL - Located at the BOTTOM section of page):\n        Continue scrolling to the BOTTOM of the page to find the \"Shareholding Pattern\" table.\n        \n        IMPORTANT TABLE EXTRACTION RULES:\n        1. Find the \"Shareholding Pattern\" table\n        2. Extract data from the LAST COLUMN ONLY (most recent data)\n        3. Get ALL row names and their corresponding values from that last column\n        4. Include ALL categories shown in the table rows (Promoters, FII, DII, Public, Government, Others, etc.)\n        \n        Extract exactly like this structure:\n        - Category name from each row label\n        - Percentage value from the LAST COLUMN only for each row\n        \n        IMPORTANT: You MUST scroll through the ENTIRE page content to find all sections.\n        - TOP section: Basic metrics, ratios\n        - MIDDLE section: Quarterly results \n        - BOTTOM section: Shareholding pattern\n        \n        If you cannot find quarterly results or shareholding data, return null for these fields.\n        The quarterly results and shareholding arrays are MANDATORY if the data exists on the page.\n        \n        COMPANY INFO:\n        - Company Name\n        - Sector\n        - Industry\n        \n        Return ONLY a JSON object with the extracted values. Use null for any metrics not found.\n        Format numbers without currency symbols or percentage signs (just the numeric value).\n        \n        CRITICAL: If you find quarterly results or shareholding data, you MUST include them as arrays.\n        Do NOT return null for these if the data exists on the page.\n        \n        Example format:\n        {\n          \"marketCap\": \"\u20B97,758 Cr\",\n          \"currentPrice\": 631.25,\n          \"eps\": 24.5,\n          \"pe\": 25.8,\n          \"roe\": 15.2,\n          \"roce\": 12.8,\n          \"bookValue\": 245.6,\n          \"dividendYield\": 1.2,\n          \"quarterlyResults\": [\n            {\"quarter\": \"Mar 2024\", \"revenue\": 1250.5, \"profit\": 235.8, \"eps\": 12.4},\n            {\"quarter\": \"Dec 2023\", \"revenue\": 1180.2, \"profit\": 210.3, \"eps\": 11.1},\n            {\"quarter\": \"Sep 2023\", \"revenue\": 1095.7, \"profit\": 198.5, \"eps\": 10.5},\n            {\"quarter\": \"Jun 2023\", \"revenue\": 1020.3, \"profit\": 185.2, \"eps\": 9.8}\n          ],\n          \"shareholdingPattern\": [\n            {\"category\": \"Promoters\", \"percentage\": 52.5},\n            {\"category\": \"FII\", \"percentage\": 18.3},\n            {\"category\": \"DII\", \"percentage\": 12.7},\n            {\"category\": \"Public\", \"percentage\": 16.5}\n          ],\n          \"companyName\": \"Vimta Labs Limited\",\n          \"sector\": \"Healthcare\",\n          \"industry\": \"Testing Services\"\n        }\n      ");
                        // Use our accurate webfetch API instead of Claude WebFetch for 100% precision
                        console.log("\uD83C\uDFAF Using accurate webfetch API for ".concat(stockSymbol, " data extraction..."));
                        return [4 /*yield*/, fetch('/api/webfetch', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    stockSymbol: stockSymbol,
                                    url: url,
                                    prompt: 'Extract comprehensive financial metrics from Screener.in'
                                })
                            })];
                    case 1:
                        apiResponse = _a.sent();
                        if (!apiResponse.ok) {
                            throw new Error("API responded with status: ".concat(apiResponse.status));
                        }
                        return [4 /*yield*/, apiResponse.json()];
                    case 2:
                        apiData = _a.sent();
                        console.log("\u2705 Accurate API response for ".concat(stockSymbol, ":"), apiData);
                        if (apiData.success && apiData.data) {
                            financialData = apiData.data;
                            // Map the accurate webfetch data to our interface
                            return [2 /*return*/, {
                                    // Basic metrics
                                    marketCap: financialData.marketCap,
                                    currentPrice: financialData.currentPrice,
                                    bookValue: financialData.bookValue,
                                    dividendYield: financialData.dividendYield,
                                    faceValue: financialData.faceValue,
                                    // Profitability ratios  
                                    eps: financialData.eps,
                                    pe: financialData.pe,
                                    roe: financialData.roe,
                                    roce: financialData.roce,
                                    // Growth metrics (if available)
                                    revenueGrowth: financialData.revenueGrowth,
                                    profitGrowth: financialData.profitGrowth,
                                    // Financial health
                                    debtToEquity: financialData.debtToEquity,
                                    currentRatio: financialData.currentRatio,
                                    // Valuation metrics
                                    pbv: financialData.pbv || (financialData.currentPrice && financialData.bookValue ?
                                        (financialData.currentPrice / financialData.bookValue).toFixed(2) : null),
                                    evEbitda: financialData.evEbitda,
                                    // Company info
                                    sector: financialData.sector,
                                    industry: financialData.industry,
                                    companyName: financialData.companyName,
                                    // Shareholding pattern
                                    shareholdingPattern: financialData.shareholdingPattern,
                                    // Quarterly results (newly implemented)
                                    quarterlyResults: financialData.quarterlyResults,
                                    // Metadata
                                    lastUpdated: financialData.lastUpdated,
                                    extractionMethod: 'accurate_webfetch_api'
                                }];
                        }
                        // Fallback to old method if API fails
                        console.log("\u26A0\uFE0F API extraction failed, falling back to Claude WebFetch for ".concat(stockSymbol));
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/webSearchUtil')); })];
                    case 3:
                        WebFetch = (_a.sent()).WebFetch;
                        return [4 /*yield*/, WebFetch(url, prompt_1)];
                    case 4:
                        extractedData = _a.sent();
                        console.log("\uD83D\uDCCA Raw Screener data for ".concat(stockSymbol, ":"), extractedData);
                        hasQuarterlyData = extractedData.includes('quarterly') || extractedData.includes('Quarter') ||
                            extractedData.includes('Mar 2024') || extractedData.includes('Dec 2023');
                        hasShareholdingData = extractedData.includes('Promoter') || extractedData.includes('FII') ||
                            extractedData.includes('shareholding') || extractedData.includes('Shareholding');
                        console.log("\uD83D\uDD0D Quarterly data indicators found: ".concat(hasQuarterlyData));
                        console.log("\uD83D\uDD0D Shareholding data indicators found: ".concat(hasShareholdingData));
                        financialMetrics = {};
                        try {
                            jsonMatch = extractedData.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                financialMetrics = JSON.parse(jsonMatch[0]);
                                console.log("\u2705 Successfully parsed Screener data for ".concat(stockSymbol, ":"), financialMetrics);
                            }
                            else {
                                console.log("\u26A0\uFE0F No JSON found in Screener response for ".concat(stockSymbol));
                                // Try to extract key metrics manually from text
                                financialMetrics = this.parseTextualData(extractedData, stockSymbol);
                            }
                        }
                        catch (parseError) {
                            console.log("\u26A0\uFE0F Failed to parse JSON, attempting text extraction for ".concat(stockSymbol));
                            financialMetrics = this.parseTextualData(extractedData, stockSymbol);
                        }
                        // Add metadata
                        financialMetrics.lastUpdated = new Date().toISOString();
                        if (Object.keys(financialMetrics).length > 1) { // More than just lastUpdated
                            console.log("\u2705 Successfully extracted ".concat(Object.keys(financialMetrics).length - 1, " financial metrics for ").concat(stockSymbol));
                            return [2 /*return*/, financialMetrics];
                        }
                        else {
                            console.log("\u274C No financial metrics extracted for ".concat(stockSymbol));
                            return [2 /*return*/, null];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error("\u274C Error fetching Screener data for ".concat(stockSymbol, ":"), error_1);
                        return [2 /*return*/, null];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse textual data when JSON parsing fails
     */
    ScreenerDataService.parseTextualData = function (text, stockSymbol) {
        console.log("\uD83D\uDD0D Attempting text parsing for ".concat(stockSymbol, "..."));
        var metrics = {};
        // Common patterns for extracting metrics from text
        var patterns = {
            eps: /(?:eps|earnings per share).*?₹?\s*(\d+(?:\.\d+)?)/i,
            pe: /(?:p\/e|pe ratio|price.*earnings).*?(\d+(?:\.\d+)?)/i,
            roe: /(?:roe|return on equity).*?(\d+(?:\.\d+)?)%?/i,
            roce: /(?:roce|return on capital).*?(\d+(?:\.\d+)?)%?/i,
            bookValue: /(?:book value).*?₹?\s*(\d+(?:\.\d+)?)/i,
            dividendYield: /(?:dividend yield).*?(\d+(?:\.\d+)?)%?/i,
            marketCap: /(?:market cap).*?(₹[\d,]+\s*(?:cr|crore))/i,
            currentPrice: /(?:current price|price).*?₹?\s*(\d+(?:\.\d+)?)/i
        };
        // Extract metrics using patterns
        for (var _i = 0, _a = Object.entries(patterns); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], pattern = _b[1];
            var match = text.match(pattern);
            if (match) {
                if (key === 'marketCap') {
                    metrics[key] = match[1];
                }
                else {
                    var value = parseFloat(match[1]);
                    if (!isNaN(value)) {
                        metrics[key] = value;
                        console.log("\uD83D\uDCCA Extracted ".concat(key, ": ").concat(value, " for ").concat(stockSymbol));
                    }
                }
            }
        }
        return metrics;
    };
    /**
     * Format financial metrics for display
     */
    ScreenerDataService.formatMetricsForDisplay = function (metrics) {
        var displayMetrics = [];
        if (metrics.eps !== undefined) {
            displayMetrics.push("EPS (earnings per share) stands at \u20B9".concat(metrics.eps, ". This indicates the company's profit allocation per share"));
        }
        if (metrics.roe !== undefined) {
            displayMetrics.push("Company has maintained a Return on Equity of ".concat(metrics.roe, "%, indicating management's ability to generate profits from equity"));
        }
        if (metrics.pe !== undefined) {
            displayMetrics.push("Stock is trading at a P/E ratio of ".concat(metrics.pe, ", indicating the valuation relative to earnings"));
        }
        if (metrics.roce !== undefined) {
            displayMetrics.push("Return on Capital Employed is ".concat(metrics.roce, "%, showing efficiency in capital utilization"));
        }
        if (metrics.bookValue !== undefined) {
            displayMetrics.push("Book value per share is \u20B9".concat(metrics.bookValue, ", representing net asset value per share"));
        }
        if (metrics.dividendYield !== undefined) {
            displayMetrics.push("Company maintains a dividend yield of ".concat(metrics.dividendYield, "%, providing regular income to shareholders"));
        }
        // Revenue and profit growth removed as requested
        return displayMetrics;
    };
    /**
     * Format quarterly results for table display
     */
    ScreenerDataService.formatQuarterlyResultsTable = function (quarterlyResults) {
        if (!quarterlyResults || quarterlyResults.length === 0) {
            return '';
        }
        var table = "\n## \uD83D\uDCCA Quarterly Results (Last 4 Quarters)\n\n| Quarter | Revenue (\u20B9 Cr) | Profit (\u20B9 Cr) | EPS (\u20B9) |\n|---------|---------------|---------------|---------|";
        quarterlyResults.forEach(function (quarter) {
            table += "\n| ".concat(quarter.quarter, " | ").concat(quarter.revenue.toFixed(2), " | ").concat(quarter.profit.toFixed(2), " | ").concat(quarter.eps.toFixed(2), " |");
        });
        return table + '\n';
    };
    /**
     * Format shareholding pattern for table display
     */
    ScreenerDataService.formatShareholdingPatternTable = function (shareholdingPattern) {
        if (!shareholdingPattern || shareholdingPattern.length === 0) {
            return '';
        }
        var table = "\n## \uD83D\uDC65 Shareholding Pattern\n\n| Category | Percentage |\n|----------|------------|";
        shareholdingPattern.forEach(function (holder) {
            table += "\n| ".concat(holder.category, " | ").concat(holder.percentage.toFixed(2), "% |");
        });
        return table + '\n';
    };
    ScreenerDataService.BASE_URL = 'https://www.screener.in/company';
    return ScreenerDataService;
}());
exports.ScreenerDataService = ScreenerDataService;
