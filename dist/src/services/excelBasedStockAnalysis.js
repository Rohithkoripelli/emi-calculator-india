"use strict";
/**
 * Excel-based Stock Analysis Service
 * Uses the comprehensive company list from Excel file for accurate stock symbol recognition
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.ExcelBasedStockAnalysisService = void 0;
// Import the processed companies data
var excel_companies_json_1 = __importDefault(require("../data/excel-companies.json"));
var ExcelBasedStockAnalysisService = /** @class */ (function () {
    function ExcelBasedStockAnalysisService() {
    }
    ExcelBasedStockAnalysisService.initialize = function () {
        var _this = this;
        if (this.initialized)
            return;
        console.log("\uD83D\uDE80 Initializing Excel-based stock analysis with ".concat(this.companies.length, " companies..."));
        // Build symbol to company mapping
        this.companies.forEach(function (company) {
            _this.symbolToCompany.set(company.symbol, company);
            // Build search index
            company.searchTerms.forEach(function (term) {
                if (!_this.searchIndex.has(term)) {
                    _this.searchIndex.set(term, []);
                }
                _this.searchIndex.get(term).push(company);
            });
        });
        this.initialized = true;
        console.log("\u2705 Initialized with ".concat(this.symbolToCompany.size, " symbols and ").concat(this.searchIndex.size, " search terms"));
    };
    /**
     * Smart stock symbol extraction from user query
     */
    ExcelBasedStockAnalysisService.parseStockSymbol = function (query) {
        var _this = this;
        this.initialize();
        var cleanQuery = query.toLowerCase().trim();
        console.log("\uD83D\uDD0D Excel-based stock detection for: \"".concat(cleanQuery, "\""));
        // Step 1: Extract meaningful words (remove stop words)
        var words = cleanQuery.split(/\s+/);
        var meaningfulWords = words.filter(function (word) {
            var cleanWord = word.replace(/[^\w&]/g, ''); // Keep & for companies like L&T
            return cleanWord.length > 1 && !_this.STOP_WORDS.has(cleanWord.toLowerCase());
        });
        console.log("\uD83D\uDCDD Meaningful words: ".concat(meaningfulWords.join(', ')));
        if (meaningfulWords.length === 0) {
            console.log('❌ No meaningful words found');
            return null;
        }
        // Step 2: Direct symbol lookup
        for (var _i = 0, meaningfulWords_1 = meaningfulWords; _i < meaningfulWords_1.length; _i++) {
            var word = meaningfulWords_1[_i];
            var upperWord = word.toUpperCase();
            if (this.symbolToCompany.has(upperWord)) {
                console.log("\u2705 Direct symbol match: ".concat(upperWord, " \u2192 ").concat(this.symbolToCompany.get(upperWord).name));
                return upperWord;
            }
        }
        // Step 3: Search index lookup with improved scoring
        var candidates = new Map(); // symbol -> score
        // Exact term matches (highest priority)
        for (var _a = 0, meaningfulWords_2 = meaningfulWords; _a < meaningfulWords_2.length; _a++) {
            var word = meaningfulWords_2[_a];
            var lowerWord = word.toLowerCase();
            if (this.searchIndex.has(lowerWord)) {
                this.searchIndex.get(lowerWord).forEach(function (company) {
                    var current = candidates.get(company.symbol) || 0;
                    candidates.set(company.symbol, current + 20); // Very high score for exact matches
                });
            }
        }
        // Enhanced partial matches with context-aware scoring
        this.companies.forEach(function (company) {
            var score = candidates.get(company.symbol) || 0;
            // Special handling for well-known companies
            var isWellKnownMatch = _this.checkWellKnownMatches(meaningfulWords, company);
            if (isWellKnownMatch > 0) {
                score += isWellKnownMatch;
            }
            // Enhanced matching logic with better precision
            for (var _i = 0, meaningfulWords_3 = meaningfulWords; _i < meaningfulWords_3.length; _i++) {
                var word = meaningfulWords_3[_i];
                var lowerWord = word.toLowerCase();
                // Exact word match in company name gets highest score
                var companyNameWords = company.cleanName.split(/\s+/);
                var exactWordMatch = companyNameWords.includes(lowerWord);
                if (exactWordMatch) {
                    score += 15;
                }
                // Only give partial match points if word is reasonably unique (length > 3)
                else if (lowerWord.length > 3 && company.cleanName.includes(lowerWord)) {
                    score += 8;
                }
                // Check original company name - be more strict
                if (company.name.toLowerCase().includes(lowerWord) && lowerWord.length > 3) {
                    score += 5;
                }
                // Check search terms for partial matches - prioritize exact matches
                for (var _a = 0, _b = company.searchTerms; _a < _b.length; _a++) {
                    var term = _b[_a];
                    if (term === lowerWord) {
                        score += 12; // Exact search term match
                    }
                    else if (lowerWord.length > 3 && (term.includes(lowerWord) || lowerWord.includes(term))) {
                        score += 2; // Reduced score for partial matches
                    }
                }
            }
            // Boost score for multiple word matches (company name matching)
            var wordMatches = 0;
            for (var _c = 0, meaningfulWords_4 = meaningfulWords; _c < meaningfulWords_4.length; _c++) {
                var word = meaningfulWords_4[_c];
                var lowerWord = word.toLowerCase();
                var companyNameWords = company.cleanName.split(/\s+/);
                if (companyNameWords.includes(lowerWord)) {
                    wordMatches++;
                }
            }
            // Boost score significantly if multiple words match
            if (wordMatches > 1) {
                score += wordMatches * 10; // Extra points for multiple word matches
            }
            // Penalty for generic terms that match too many companies
            if (_this.isGenericTerm(meaningfulWords, company)) {
                score = Math.max(0, score - 30); // Very heavy penalty for generic/random terms
            }
            if (score > 0) {
                candidates.set(company.symbol, score);
            }
        });
        // Step 4: Find best match
        if (candidates.size === 0) {
            console.log('❌ No matches found in Excel database');
            return null;
        }
        // Sort by score and return best match
        var sorted = Array.from(candidates.entries()).sort(function (a, b) { return b[1] - a[1]; });
        var bestSymbol = sorted[0][0];
        var bestCompany = this.symbolToCompany.get(bestSymbol);
        var bestScore = sorted[0][1];
        // Enhanced threshold logic - be more strict about matches
        var threshold = meaningfulWords.length === 1 ? 50 : 40; // Higher threshold for single words
        if (bestScore < threshold) {
            console.log("\u26A0\uFE0F Best match score too low (".concat(bestScore, " < ").concat(threshold, "), rejecting"));
            // Additional check: if multiple candidates have similar scores, it's ambiguous
            if (sorted.length > 1 && sorted[1][1] > bestScore * 0.7) {
                console.log("\u26A0\uFE0F Ambiguous match detected - top scores too close: ".concat(bestScore, " vs ").concat(sorted[1][1]));
                return null;
            }
            return null;
        }
        console.log("\uD83C\uDFAF Best match: ".concat(bestCompany.name, " (").concat(bestSymbol, ") - Score: ").concat(bestScore));
        // Show top 3 matches for debugging
        if (sorted.length > 1) {
            console.log('🔝 Top matches:');
            sorted.slice(0, 3).forEach(function (entry, index) {
                var company = _this.symbolToCompany.get(entry[0]);
                console.log("   ".concat(index + 1, ". ").concat(company.name, " (").concat(company.symbol, ") - Score: ").concat(entry[1]));
            });
        }
        return bestSymbol;
    };
    /**
     * Enhanced fuzzy matching for well-known company patterns and disambiguation
     */
    ExcelBasedStockAnalysisService.checkWellKnownMatches = function (meaningfulWords, company) {
        var words = meaningfulWords.map(function (w) { return w.toLowerCase(); });
        var joinedQuery = words.join(' ');
        // Enhanced pattern matching for common stock queries
        // SBI variants - distinguish between different SBI entities
        if (words.includes('sbi')) {
            if (words.includes('life') && company.symbol === 'SBILIFE') {
                return 80; // Strong boost for SBI Life
            }
            if (words.includes('card') && company.symbol === 'SBICARD') {
                return 80; // Strong boost for SBI Card
            }
            if ((words.includes('bank') || words.includes('state') || joinedQuery.match(/\bsbi\s+(stock|share)\b/)) && company.symbol === 'SBIN') {
                return 60; // High boost for SBI Bank
            }
        }
        // ICICI variants - handle ICICI vs ICICI Prudential confusion
        if (words.includes('icici')) {
            if (words.includes('prudential') || words.includes('insurance') || words.includes('life') && company.symbol === 'ICICIPRUDENTIAL') {
                return 80; // Strong boost for ICICI Prudential
            }
            if ((words.includes('bank') || !words.includes('prudential')) && company.symbol === 'ICICIBANK') {
                return 70; // Prefer ICICI Bank over Prudential when "prudential" not mentioned
            }
        }
        // HDFC variants
        if (words.includes('hdfc')) {
            if (words.includes('bank') && company.symbol === 'HDFCBANK') {
                return 60;
            }
            if (words.includes('life') && company.symbol === 'HDFCLIFE') {
                return 80;
            }
            if (!words.includes('bank') && !words.includes('life') && company.symbol === 'HDFC') {
                return 50; // Default to HDFC Ltd when no specific variant mentioned
            }
        }
        // TCS - very specific match
        if ((words.includes('tcs') || joinedQuery.includes('tata consultancy')) && company.symbol === 'TCS') {
            return 90;
        }
        // Infosys variants
        if ((words.includes('infosys') || words.includes('infy')) && company.symbol === 'INFY') {
            return 80;
        }
        // Reliance variants
        if (words.includes('reliance')) {
            if (words.includes('industries') && company.symbol === 'RELIANCE') {
                return 70;
            }
            if (words.includes('power') && company.symbol === 'RPOWER') {
                return 80;
            }
            if (!words.includes('power') && !words.includes('capital') && company.symbol === 'RELIANCE') {
                return 60; // Default to RIL
            }
        }
        // L&T - unique identifier
        if ((words.includes('l&t') || joinedQuery.includes('larsen') || joinedQuery.includes('toubro')) && company.symbol === 'LT') {
            return 90;
        }
        // Indian Bank disambiguation - major improvement here
        if (words.includes('indian') && words.includes('bank')) {
            if (words.includes('south') && company.symbol === 'SOUTHBANK') {
                return 80; // Strong boost for South Indian Bank when "south" mentioned
            }
            if (words.includes('overseas') && company.symbol === 'IOB') {
                return 80; // Strong boost for Indian Overseas Bank
            }
            if (!words.includes('south') && !words.includes('overseas') && company.symbol === 'INDIANB') {
                return 70; // Prefer Indian Bank when no qualifier mentioned
            }
            if (company.symbol === 'SOUTHBANK' && !words.includes('south')) {
                return -50; // Heavy penalty for South Indian Bank when "south" not mentioned
            }
        }
        // Tata Group companies - enhanced disambiguation
        if (words.includes('tata')) {
            if (words.includes('steel') && company.symbol === 'TATASTEEL')
                return 80;
            if (words.includes('motors') && company.symbol === 'TATAMOTORS')
                return 80;
            if (words.includes('power') && company.symbol === 'TATAPOWER')
                return 80;
            if (words.includes('chemicals') && company.symbol === 'TATACHEM')
                return 80;
            if (words.includes('consumer') && company.symbol === 'TATACONSUM')
                return 80;
            if (words.includes('consultancy') && company.symbol === 'TCS')
                return 90;
        }
        // Adani Group companies
        if (words.includes('adani')) {
            if (words.includes('ports') && company.symbol === 'ADANIPORTS')
                return 80;
            if (words.includes('green') && company.symbol === 'ADANIGREEN')
                return 80;
            if (words.includes('power') && company.symbol === 'ADANIPOWER')
                return 80;
            if (words.includes('enterprises') && company.symbol === 'ADANIENT')
                return 80;
        }
        // Aditya Birla Group
        if ((words.includes('aditya') && words.includes('birla')) || words.includes('ultratech')) {
            if (words.includes('cement') || words.includes('ultratech') && company.symbol === 'ULTRACEMCO')
                return 80;
        }
        // Common abbreviations and aliases
        var abbreviations = {
            'ril': { symbol: 'RELIANCE', score: 70 },
            'itc': { symbol: 'ITC', score: 90 },
            'wipro': { symbol: 'WIPRO', score: 80 },
            'hul': { symbol: 'HINDUNILVR', score: 80 },
            'bajaj': { symbol: 'BAJFINANCE', score: 60 },
            'maruti': { symbol: 'MARUTI', score: 80 },
            'mahindra': { symbol: 'M&M', score: 70 }
        };
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            if (abbreviations[word] && company.symbol === abbreviations[word].symbol) {
                return abbreviations[word].score;
            }
        }
        return 0;
    };
    /**
     * Enhanced generic term detection with better disambiguation
     */
    ExcelBasedStockAnalysisService.isGenericTerm = function (meaningfulWords, company) {
        var words = meaningfulWords.map(function (w) { return w.toLowerCase(); });
        var joinedQuery = words.join(' ');
        // Enhanced generic term detection
        var genericTerms = ['bank', 'company', 'limited', 'ltd', 'corporation', 'corp', 'group', 'industries'];
        // Check if query consists only of generic terms
        var nonGenericWords = words.filter(function (w) { return !genericTerms.includes(w); });
        // If only generic terms and company name also only has generic terms, penalize heavily
        if (nonGenericWords.length === 0) {
            return true;
        }
        // Penalize if only one generic term matches and no specific identifiers
        var specificMatches = nonGenericWords.filter(function (w) {
            return company.cleanName.includes(w) || company.searchTerms.includes(w);
        });
        if (specificMatches.length === 0 && words.some(function (w) { return genericTerms.includes(w); })) {
            return true;
        }
        // Enhanced random/test word detection
        var invalidWords = [
            'random', 'xyz', 'abc', 'test', 'dummy', 'sample', 'example', 'demo',
            'hello', 'hi', 'hey', 'nothing', 'something', 'anything', 'whatever'
        ];
        if (words.some(function (w) { return invalidWords.includes(w); })) {
            return true;
        }
        // Detect gibberish or very short meaningless words
        var shortWords = words.filter(function (w) { return w.length <= 2 && !['lt', 'it', 'mg'].includes(w); });
        if (shortWords.length === words.length) {
            return true;
        }
        return false;
    };
    /**
     * Get company details by symbol
     */
    ExcelBasedStockAnalysisService.getCompanyBySymbol = function (symbol) {
        this.initialize();
        return this.symbolToCompany.get(symbol.toUpperCase()) || null;
    };
    /**
     * Search companies by partial name
     */
    ExcelBasedStockAnalysisService.searchCompanies = function (searchTerm, limit) {
        if (limit === void 0) { limit = 10; }
        this.initialize();
        var lowerTerm = searchTerm.toLowerCase();
        var results = [];
        this.companies.forEach(function (company) {
            var score = 0;
            // Exact name match
            if (company.cleanName === lowerTerm) {
                score += 100;
            }
            // Name starts with search term
            else if (company.cleanName.startsWith(lowerTerm)) {
                score += 50;
            }
            // Name contains search term
            else if (company.cleanName.includes(lowerTerm)) {
                score += 25;
            }
            // Search terms match
            for (var _i = 0, _a = company.searchTerms; _i < _a.length; _i++) {
                var term = _a[_i];
                if (term === lowerTerm) {
                    score += 30;
                }
                else if (term.includes(lowerTerm)) {
                    score += 10;
                }
            }
            if (score > 0) {
                results.push({ company: company, score: score });
            }
        });
        return results
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, limit)
            .map(function (r) { return r.company; });
    };
    /**
     * Get database statistics
     */
    ExcelBasedStockAnalysisService.getStats = function () {
        this.initialize();
        return {
            totalCompanies: this.companies.length,
            uniqueSymbols: this.symbolToCompany.size,
            searchTerms: this.searchIndex.size,
            averageTermsPerCompany: (this.searchIndex.size / this.companies.length).toFixed(2)
        };
    };
    /**
     * Test the matching logic
     */
    /**
     * Find multiple stock symbols in a query for comparison scenarios
     */
    ExcelBasedStockAnalysisService.findMultipleStocks = function (query, maxResults) {
        var _this = this;
        if (maxResults === void 0) { maxResults = 5; }
        this.initialize();
        var cleanQuery = query.toLowerCase().trim();
        console.log("\uD83D\uDD0D Finding multiple stocks in: \"".concat(cleanQuery, "\""));
        // Step 1: Extract meaningful words (remove stop words)
        var words = cleanQuery.split(/\s+/);
        var meaningfulWords = words.filter(function (word) {
            var cleanWord = word.replace(/[^\w&]/g, ''); // Keep & for companies like L&T
            return cleanWord.length > 1 && !_this.STOP_WORDS.has(cleanWord.toLowerCase());
        });
        console.log("\uD83D\uDCDD Meaningful words: ".concat(meaningfulWords.join(', ')));
        if (meaningfulWords.length === 0) {
            console.log('❌ No meaningful words found');
            return [];
        }
        // Step 2: Collect all possible matches with scores
        var candidates = new Map(); // symbol -> score
        // Direct symbol lookup
        for (var _i = 0, meaningfulWords_5 = meaningfulWords; _i < meaningfulWords_5.length; _i++) {
            var word = meaningfulWords_5[_i];
            var upperWord = word.toUpperCase();
            if (this.symbolToCompany.has(upperWord)) {
                candidates.set(upperWord, 100); // Highest score for direct symbol matches
            }
        }
        // Search index lookup
        for (var _a = 0, meaningfulWords_6 = meaningfulWords; _a < meaningfulWords_6.length; _a++) {
            var word = meaningfulWords_6[_a];
            var lowerWord = word.toLowerCase();
            if (this.searchIndex.has(lowerWord)) {
                this.searchIndex.get(lowerWord).forEach(function (company) {
                    var current = candidates.get(company.symbol) || 0;
                    candidates.set(company.symbol, current + 20);
                });
            }
        }
        // Enhanced partial matches
        this.companies.forEach(function (company) {
            var score = candidates.get(company.symbol) || 0;
            // Check for partial matches in company name and search terms
            for (var _i = 0, meaningfulWords_7 = meaningfulWords; _i < meaningfulWords_7.length; _i++) {
                var word = meaningfulWords_7[_i];
                var lowerWord = word.toLowerCase();
                // Check company name parts
                if (company.cleanName.includes(lowerWord)) {
                    score += 15;
                }
                // Check search terms
                for (var _a = 0, _b = company.searchTerms; _a < _b.length; _a++) {
                    var term = _b[_a];
                    if (term.includes(lowerWord)) {
                        score += 10;
                    }
                }
            }
            // Apply well-known matches boost
            score += _this.checkWellKnownMatches(meaningfulWords, company);
            if (score > 0) {
                candidates.set(company.symbol, score);
            }
        });
        // Step 3: Sort by score and return top matches
        var sortedResults = Array.from(candidates.entries())
            .sort(function (a, b) { return b[1] - a[1]; }) // Sort by score descending
            .filter(function (_a) {
            var symbol = _a[0], score = _a[1];
            return score >= 10;
        }) // Minimum threshold
            .slice(0, maxResults)
            .map(function (_a) {
            var _b;
            var symbol = _a[0], score = _a[1];
            console.log("\uD83C\uDFAF Match: ".concat((_b = _this.symbolToCompany.get(symbol)) === null || _b === void 0 ? void 0 : _b.name, " (").concat(symbol, ") - Score: ").concat(score));
            return symbol;
        });
        console.log("\u2705 Found ".concat(sortedResults.length, " stock symbols: ").concat(sortedResults.join(', ')));
        return sortedResults;
    };
    ExcelBasedStockAnalysisService.testMatching = function () {
        var _this = this;
        console.log('🧪 Testing Excel-based stock matching...');
        var testCases = [
            { query: 'Can I buy swiggy shares now?', expected: 'SWIGGY' },
            { query: 'HDFC bank stock analysis', expected: 'HDFCBANK' },
            { query: 'L&T construction stock', expected: 'LT' },
            { query: 'Reliance Industries share price', expected: 'RELIANCE' },
            { query: 'TCS vs Infosys comparison', expected: 'TCS' },
            { query: 'Zomato stock worth buying?', expected: 'ZOMATO' },
            { query: 'Nykaa IPO investment', expected: 'NYKAA' },
            { query: 'Asian Paints vs Berger', expected: 'ASIANPAINT' },
            { query: 'SBI bank shares', expected: 'SBIN' },
            { query: 'Bharti Airtel 5G', expected: 'BHARTIARTL' },
            { query: 'eternal stock', expected: null },
            { query: 'random company xyz', expected: null }
        ];
        var passCount = 0;
        console.log("\uD83D\uDCCA Testing ".concat(testCases.length, " cases...\n"));
        testCases.forEach(function (testCase, index) {
            var result = _this.parseStockSymbol(testCase.query);
            var passed = result === testCase.expected;
            var status = passed ? '✅ PASS' : '❌ FAIL';
            console.log("".concat((index + 1).toString().padStart(2), ". ").concat(status, ": \"").concat(testCase.query, "\""));
            console.log("     Expected: ".concat(testCase.expected || 'null', ", Got: ").concat(result || 'null'));
            if (passed) {
                passCount++;
            }
            else if (result && testCase.expected) {
                var actualCompany = _this.getCompanyBySymbol(result);
                var expectedCompany = _this.getCompanyBySymbol(testCase.expected);
                console.log("     \uD83D\uDD0D Got: ".concat(actualCompany === null || actualCompany === void 0 ? void 0 : actualCompany.name, ", Expected: ").concat(expectedCompany === null || expectedCompany === void 0 ? void 0 : expectedCompany.name));
            }
            console.log('');
        });
        var successRate = (passCount / testCases.length * 100).toFixed(1);
        console.log("\uD83D\uDCC8 Test Results: ".concat(passCount, "/").concat(testCases.length, " passed (").concat(successRate, "%)"));
        var stats = this.getStats();
        console.log("\uD83D\uDCCA Database: ".concat(stats.totalCompanies, " companies, ").concat(stats.searchTerms, " search terms"));
    };
    ExcelBasedStockAnalysisService.companies = excel_companies_json_1["default"];
    ExcelBasedStockAnalysisService.symbolToCompany = new Map();
    ExcelBasedStockAnalysisService.searchIndex = new Map();
    ExcelBasedStockAnalysisService.initialized = false;
    // Enhanced stop words list with financial context
    ExcelBasedStockAnalysisService.STOP_WORDS = new Set([
        // Basic stop words
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
        'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
        'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
        // Articles and determiners
        'the', 'a', 'an', 'this', 'that', 'these', 'those', 'some', 'any', 'all', 'each', 'every',
        // Prepositions
        'in', 'on', 'at', 'by', 'for', 'with', 'about', 'into', 'through', 'during', 'before', 'after',
        'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
        // Conjunctions
        'and', 'or', 'but', 'nor', 'so', 'yet', 'because', 'although', 'since', 'unless', 'while',
        // Verbs
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
        'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might',
        'can', 'shall', 'must', 'ought', 'need', 'dare',
        // Question words
        'what', 'when', 'where', 'why', 'how', 'who', 'whom', 'whose', 'which',
        // Financial context stop words (be more selective)
        'stock', 'share', 'shares', 'equity', 'analysis', 'recommendation', 'price', 'target',
        'good', 'bad', 'investment', 'invest', 'investing', 'buy', 'sell', 'hold', 'trading',
        'market', 'portfolio', 'fund', 'mutual', 'dividend', 'earnings', 'profit', 'loss',
        'financial', 'money', 'cash', 'value', 'worth', 'cost', 'expensive', 'cheap',
        'high', 'low', 'up', 'down', 'rise', 'fall', 'growth', 'decline',
        // Time-related
        'now', 'today', 'tomorrow', 'yesterday', 'week', 'month', 'year', 'time', 'when',
        'current', 'latest', 'recent', 'future', 'past', 'next', 'last', 'previous',
        // Comparative
        'better', 'best', 'worse', 'worst', 'more', 'most', 'less', 'least',
        'compare', 'comparison', 'vs', 'versus', 'between', 'among',
        // Common question patterns
        'tell', 'show', 'give', 'find', 'search', 'look', 'see', 'check', 'analyze',
        'please', 'thanks', 'thank', 'help', 'suggest', 'recommend'
    ]);
    return ExcelBasedStockAnalysisService;
}());
exports.ExcelBasedStockAnalysisService = ExcelBasedStockAnalysisService;
