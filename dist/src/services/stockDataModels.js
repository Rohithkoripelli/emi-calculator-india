"use strict";
/**
 * MongoDB Schema Models for Stock Data Management
 * Comprehensive data models for storing stock fundamentals, prices, and indices
 */
exports.__esModule = true;
exports.DEFAULT_SCORING_WEIGHTS = void 0;
exports.DEFAULT_SCORING_WEIGHTS = {
    peRatio: 0.15,
    roe: 0.20,
    roce: 0.20,
    debtToEquity: 0.10,
    revenueGrowth: 0.15,
    profitGrowth: 0.15,
    dividendYield: 0.05,
    currentRatio: 0.00 // 0% - Will implement later for liquidity assessment
};
