/**
 * Excel-based Stock Analysis Service
 * Uses the comprehensive company list from Excel file for accurate stock symbol recognition
 */

// Import the processed companies data
import excelCompanies from '../data/excel-companies.json';

interface ExcelCompany {
  symbol: string;
  name: string;
  cleanName: string;
  searchTerms: string[];
}

export class ExcelBasedStockAnalysisService {
  private static companies: ExcelCompany[] = excelCompanies;
  private static symbolToCompany = new Map<string, ExcelCompany>();
  private static searchIndex = new Map<string, ExcelCompany[]>();
  private static initialized = false;

  // Enhanced stop words list with financial context
  private static readonly STOP_WORDS = new Set([
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

  private static initialize() {
    if (this.initialized) return;

    console.log(`🚀 Initializing Excel-based stock analysis with ${this.companies.length} companies...`);

    // Build symbol to company mapping
    this.companies.forEach(company => {
      this.symbolToCompany.set(company.symbol, company);

      // Build search index
      company.searchTerms.forEach(term => {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, []);
        }
        this.searchIndex.get(term)!.push(company);
      });
    });

    this.initialized = true;
    console.log(`✅ Initialized with ${this.symbolToCompany.size} symbols and ${this.searchIndex.size} search terms`);
  }

  /**
   * Smart stock symbol extraction from user query
   */
  static parseStockSymbol(query: string): string | null {
    this.initialize();

    const cleanQuery = query.toLowerCase().trim();
    console.log(`🔍 Excel-based stock detection for: "${cleanQuery}"`);

    // Step 1: Extract meaningful words (remove stop words)
    const words = cleanQuery.split(/\s+/);
    const meaningfulWords = words.filter(word => {
      const cleanWord = word.replace(/[^\w&]/g, ''); // Keep & for companies like L&T
      return cleanWord.length > 1 && !this.STOP_WORDS.has(cleanWord.toLowerCase());
    });

    console.log(`📝 Meaningful words: ${meaningfulWords.join(', ')}`);

    if (meaningfulWords.length === 0) {
      console.log('❌ No meaningful words found');
      return null;
    }

    // Step 2: Direct symbol lookup
    for (const word of meaningfulWords) {
      const upperWord = word.toUpperCase();
      if (this.symbolToCompany.has(upperWord)) {
        console.log(`✅ Direct symbol match: ${upperWord} → ${this.symbolToCompany.get(upperWord)!.name}`);
        return upperWord;
      }
    }

    // Step 3: Search index lookup with improved scoring
    const candidates = new Map<string, number>(); // symbol -> score

    // Exact term matches (highest priority)
    for (const word of meaningfulWords) {
      const lowerWord = word.toLowerCase();
      if (this.searchIndex.has(lowerWord)) {
        this.searchIndex.get(lowerWord)!.forEach(company => {
          const current = candidates.get(company.symbol) || 0;
          candidates.set(company.symbol, current + 20); // Very high score for exact matches
        });
      }
    }

    // Enhanced partial matches with context-aware scoring
    
    this.companies.forEach(company => {
      let score = candidates.get(company.symbol) || 0;

      // Special handling for well-known companies
      const isWellKnownMatch = this.checkWellKnownMatches(meaningfulWords, company);
      if (isWellKnownMatch > 0) {
        score += isWellKnownMatch;
      }

      // Enhanced matching logic with better precision
      for (const word of meaningfulWords) {
        const lowerWord = word.toLowerCase();
        
        // Exact word match in company name gets highest score
        const companyNameWords = company.cleanName.split(/\s+/);
        const exactWordMatch = companyNameWords.includes(lowerWord);
        
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
        for (const term of company.searchTerms) {
          if (term === lowerWord) {
            score += 12; // Exact search term match
          } else if (lowerWord.length > 3 && (term.includes(lowerWord) || lowerWord.includes(term))) {
            score += 2; // Reduced score for partial matches
          }
        }
      }
      
      // Boost score for multiple word matches (company name matching)
      let wordMatches = 0;
      for (const word of meaningfulWords) {
        const lowerWord = word.toLowerCase();
        const companyNameWords = company.cleanName.split(/\s+/);
        if (companyNameWords.includes(lowerWord)) {
          wordMatches++;
        }
      }
      
      // Boost score significantly if multiple words match
      if (wordMatches > 1) {
        score += wordMatches * 10; // Extra points for multiple word matches
      }

      // Penalty for generic terms that match too many companies
      if (this.isGenericTerm(meaningfulWords, company)) {
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
    const sorted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]);
    const bestSymbol = sorted[0][0];
    const bestCompany = this.symbolToCompany.get(bestSymbol)!;
    const bestScore = sorted[0][1];

    // Enhanced threshold logic - be more strict about matches
    const threshold = meaningfulWords.length === 1 ? 50 : 40; // Higher threshold for single words
    if (bestScore < threshold) {
      console.log(`⚠️ Best match score too low (${bestScore} < ${threshold}), rejecting`);
      
      // Additional check: if multiple candidates have similar scores, it's ambiguous
      if (sorted.length > 1 && sorted[1][1] > bestScore * 0.7) {
        console.log(`⚠️ Ambiguous match detected - top scores too close: ${bestScore} vs ${sorted[1][1]}`);
        return null;
      }
      return null;
    }

    console.log(`🎯 Best match: ${bestCompany.name} (${bestSymbol}) - Score: ${bestScore}`);

    // Show top 3 matches for debugging
    if (sorted.length > 1) {
      console.log('🔝 Top matches:');
      sorted.slice(0, 3).forEach((entry, index) => {
        const company = this.symbolToCompany.get(entry[0])!;
        console.log(`   ${index + 1}. ${company.name} (${company.symbol}) - Score: ${entry[1]}`);
      });
    }

    return bestSymbol;
  }

  /**
   * Enhanced fuzzy matching for well-known company patterns and disambiguation
   */
  private static checkWellKnownMatches(meaningfulWords: string[], company: ExcelCompany): number {
    const words = meaningfulWords.map(w => w.toLowerCase());
    const joinedQuery = words.join(' ');
    
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
      if (words.includes('steel') && company.symbol === 'TATASTEEL') return 80;
      if (words.includes('motors') && company.symbol === 'TATAMOTORS') return 80;
      if (words.includes('power') && company.symbol === 'TATAPOWER') return 80;
      if (words.includes('chemicals') && company.symbol === 'TATACHEM') return 80;
      if (words.includes('consumer') && company.symbol === 'TATACONSUM') return 80;
      if (words.includes('consultancy') && company.symbol === 'TCS') return 90;
    }
    
    // Adani Group companies
    if (words.includes('adani')) {
      if (words.includes('ports') && company.symbol === 'ADANIPORTS') return 80;
      if (words.includes('green') && company.symbol === 'ADANIGREEN') return 80;
      if (words.includes('power') && company.symbol === 'ADANIPOWER') return 80;
      if (words.includes('enterprises') && company.symbol === 'ADANIENT') return 80;
    }
    
    // Aditya Birla Group
    if ((words.includes('aditya') && words.includes('birla')) || words.includes('ultratech')) {
      if (words.includes('cement') || words.includes('ultratech') && company.symbol === 'ULTRACEMCO') return 80;
    }
    
    // Common abbreviations and aliases
    const abbreviations: Record<string, { symbol: string, score: number }> = {
      'ril': { symbol: 'RELIANCE', score: 70 },
      'itc': { symbol: 'ITC', score: 90 },
      'wipro': { symbol: 'WIPRO', score: 80 },
      'hul': { symbol: 'HINDUNILVR', score: 80 },
      'bajaj': { symbol: 'BAJFINANCE', score: 60 }, // Default to Bajaj Finance
      'maruti': { symbol: 'MARUTI', score: 80 },
      'mahindra': { symbol: 'M&M', score: 70 },
    };
    
    for (const word of words) {
      if (abbreviations[word] && company.symbol === abbreviations[word].symbol) {
        return abbreviations[word].score;
      }
    }
    
    return 0;
  }

  /**
   * Enhanced generic term detection with better disambiguation
   */
  private static isGenericTerm(meaningfulWords: string[], company: ExcelCompany): boolean {
    const words = meaningfulWords.map(w => w.toLowerCase());
    const joinedQuery = words.join(' ');
    
    // Enhanced generic term detection
    const genericTerms = ['bank', 'company', 'limited', 'ltd', 'corporation', 'corp', 'group', 'industries'];
    
    // Check if query consists only of generic terms
    const nonGenericWords = words.filter(w => !genericTerms.includes(w));
    
    // If only generic terms and company name also only has generic terms, penalize heavily
    if (nonGenericWords.length === 0) {
      return true;
    }
    
    // Penalize if only one generic term matches and no specific identifiers
    const specificMatches = nonGenericWords.filter(w => 
      company.cleanName.includes(w) || company.searchTerms.includes(w)
    );
    
    if (specificMatches.length === 0 && words.some(w => genericTerms.includes(w))) {
      return true;
    }
    
    // Enhanced random/test word detection
    const invalidWords = [
      'random', 'xyz', 'abc', 'test', 'dummy', 'sample', 'example', 'demo',
      'hello', 'hi', 'hey', 'nothing', 'something', 'anything', 'whatever'
    ];
    
    if (words.some(w => invalidWords.includes(w))) {
      return true;
    }
    
    // Detect gibberish or very short meaningless words
    const shortWords = words.filter(w => w.length <= 2 && !['lt', 'it', 'mg'].includes(w));
    if (shortWords.length === words.length) {
      return true;
    }
    
    return false;
  }

  /**
   * Get company details by symbol
   */
  static getCompanyBySymbol(symbol: string): ExcelCompany | null {
    this.initialize();
    return this.symbolToCompany.get(symbol.toUpperCase()) || null;
  }

  /**
   * Search companies by partial name
   */
  static searchCompanies(searchTerm: string, limit: number = 10): ExcelCompany[] {
    this.initialize();
    
    const lowerTerm = searchTerm.toLowerCase();
    const results: { company: ExcelCompany; score: number }[] = [];

    this.companies.forEach(company => {
      let score = 0;

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
      for (const term of company.searchTerms) {
        if (term === lowerTerm) {
          score += 30;
        } else if (term.includes(lowerTerm)) {
          score += 10;
        }
      }

      if (score > 0) {
        results.push({ company, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.company);
  }

  /**
   * Get database statistics
   */
  static getStats() {
    this.initialize();
    
    return {
      totalCompanies: this.companies.length,
      uniqueSymbols: this.symbolToCompany.size,
      searchTerms: this.searchIndex.size,
      averageTermsPerCompany: (this.searchIndex.size / this.companies.length).toFixed(2)
    };
  }

  /**
   * Test the matching logic
   */
  static testMatching(): void {
    console.log('🧪 Testing Excel-based stock matching...');
    
    const testCases = [
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

    let passCount = 0;
    console.log(`📊 Testing ${testCases.length} cases...\n`);

    testCases.forEach((testCase, index) => {
      const result = this.parseStockSymbol(testCase.query);
      const passed = result === testCase.expected;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${(index + 1).toString().padStart(2)}. ${status}: "${testCase.query}"`);
      console.log(`     Expected: ${testCase.expected || 'null'}, Got: ${result || 'null'}`);
      
      if (passed) {
        passCount++;
      } else if (result && testCase.expected) {
        const actualCompany = this.getCompanyBySymbol(result);
        const expectedCompany = this.getCompanyBySymbol(testCase.expected);
        console.log(`     🔍 Got: ${actualCompany?.name}, Expected: ${expectedCompany?.name}`);
      }
      console.log('');
    });

    const successRate = (passCount / testCases.length * 100).toFixed(1);
    console.log(`📈 Test Results: ${passCount}/${testCases.length} passed (${successRate}%)`);
    
    const stats = this.getStats();
    console.log(`📊 Database: ${stats.totalCompanies} companies, ${stats.searchTerms} search terms`);
  }
}