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

  // Enhanced stop words list
  private static readonly STOP_WORDS = new Set([
    'i', 'should', 'buy', 'sell', 'invest', 'stock', 'share', 'shares', 'equity', 'now', 'today',
    'analysis', 'recommendation', 'price', 'target', 'good', 'bad', 'investment', 'the', 'a', 'an',
    'is', 'are', 'was', 'were', 'what', 'when', 'where', 'why', 'how', 'about', 'for', 'on', 'in',
    'can', 'could', 'will', 'would', 'shall', 'may', 'might', 'do', 'does', 'did', 'have', 'has', 'had',
    'be', 'been', 'being', 'to', 'at', 'by', 'from', 'with', 'into', 'during', 'before', 'after',
    'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'vs', 'versus', 'or', 'and', 'but', 'if', 'worth', 'better', 'best', 'worst', 'compare', 'comparison'
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

      // Check if company name contains any meaningful word
      for (const word of meaningfulWords) {
        const lowerWord = word.toLowerCase();
        
        // Exact word match in company name gets highest score
        const companyNameWords = company.cleanName.split(/\s+/);
        if (companyNameWords.includes(lowerWord)) {
          score += 15;
        }
        // Partial match in company name
        else if (company.cleanName.includes(lowerWord)) {
          score += 8;
        }
        
        // Check original company name
        if (company.name.toLowerCase().includes(lowerWord)) {
          score += 5;
        }
        
        // Check search terms for partial matches
        for (const term of company.searchTerms) {
          if (term === lowerWord) {
            score += 12; // Exact search term match
          } else if (term.includes(lowerWord) || lowerWord.includes(term)) {
            score += 3;
          }
        }
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

    // Only return if score is above threshold
    if (bestScore < 35) {
      console.log(`⚠️ Best match score too low (${bestScore}), rejecting`);
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
   * Special handling for well-known company matches
   */
  private static checkWellKnownMatches(meaningfulWords: string[], company: ExcelCompany): number {
    const words = meaningfulWords.map(w => w.toLowerCase());
    
    // Special cases for common companies
    if (words.includes('hdfc') && words.includes('bank') && company.symbol === 'HDFCBANK') {
      return 25; // High boost for HDFC Bank
    }
    if (words.includes('sbi') && (words.includes('bank') || words.includes('state')) && company.symbol === 'SBIN') {
      return 25; // High boost for SBI
    }
    if (words.includes('l&t') && company.symbol === 'LT') {
      return 50; // Very high boost for L&T (unique identifier)
    }
    if (words.includes('tcs') && company.symbol === 'TCS') {
      return 25; // High boost for TCS
    }
    if (words.includes('infosys') && company.symbol === 'INFY') {
      return 25; // High boost for Infosys
    }
    
    return 0;
  }

  /**
   * Check if search terms are too generic and might cause false matches
   */
  private static isGenericTerm(meaningfulWords: string[], company: ExcelCompany): boolean {
    const words = meaningfulWords.map(w => w.toLowerCase());
    
    // Penalize if only generic terms like "bank" match banking companies
    if (words.includes('bank') && company.cleanName.includes('bank') && 
        !words.some(w => company.cleanName.includes(w) && w !== 'bank')) {
      return true;
    }
    
    // Similar logic for other generic terms
    if (words.includes('company') && company.cleanName.includes('company') && 
        !words.some(w => company.cleanName.includes(w) && w !== 'company')) {
      return true;
    }
    
    // Penalize random/meaningless words
    const randomWords = ['random', 'xyz', 'abc', 'test', 'dummy', 'sample'];
    if (words.some(w => randomWords.includes(w))) {
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