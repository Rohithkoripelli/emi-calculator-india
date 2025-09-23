"use strict";
/**
 * Groww API Token Manager
 * Handles automated token generation using API Key + TOTP
 * Based on Groww API documentation: https://groww.in/trade-api/docs/python-sdk
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
exports.__esModule = true;
exports.GrowwTokenManager = void 0;
// Simple TOTP implementation for browser compatibility
/**
 * Simple Base32 decoder for browser compatibility
 */
var SimpleBase32 = /** @class */ (function () {
    function SimpleBase32() {
    }
    SimpleBase32.decode = function (encoded) {
        encoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
        var length = encoded.length;
        var bits = 0;
        var value = 0;
        var index = 0;
        var output = new Uint8Array(Math.floor((length * 5) / 8));
        for (var i = 0; i < length; i++) {
            var idx = this.ALPHABET.indexOf(encoded[i]);
            if (idx === -1)
                continue;
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                output[index++] = (value >>> (bits - 8)) & 0xff;
                bits -= 8;
            }
        }
        return output.slice(0, index);
    };
    SimpleBase32.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return SimpleBase32;
}());
/**
 * Simple HMAC-SHA1 implementation using Web Crypto API
 */
var SimpleHMAC = /** @class */ (function () {
    function SimpleHMAC() {
    }
    SimpleHMAC.sha1 = function (key, message) {
        return __awaiter(this, void 0, void 0, function () {
            var cryptoKey, signature;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])];
                    case 1:
                        cryptoKey = _a.sent();
                        return [4 /*yield*/, crypto.subtle.sign('HMAC', cryptoKey, message)];
                    case 2:
                        signature = _a.sent();
                        return [2 /*return*/, new Uint8Array(signature)];
                }
            });
        });
    };
    return SimpleHMAC;
}());
var GrowwTokenManager = /** @class */ (function () {
    function GrowwTokenManager() {
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.API_BASE = 'https://openapi.groww.in';
        this.apiKey = process.env.REACT_APP_GROWW_API_KEY || process.env.GROWW_API_KEY || '';
        this.totpSecret = process.env.REACT_APP_GROWW_TOTP_SECRET || process.env.GROWW_TOTP_SECRET || '';
        if (!this.apiKey || !this.totpSecret) {
            console.warn('⚠️ Groww API credentials not found. Set REACT_APP_GROWW_API_KEY and REACT_APP_GROWW_TOTP_SECRET for automated tokens');
            console.log('💡 Or set REACT_APP_GROWW_ACCESS_TOKEN for manual tokens');
        }
        else {
            console.log('✅ Groww API credentials found - will use automated token generation');
        }
        console.log('🚀 Initialized automated token manager');
    }
    GrowwTokenManager.getInstance = function () {
        if (!GrowwTokenManager.instance) {
            GrowwTokenManager.instance = new GrowwTokenManager();
        }
        return GrowwTokenManager.instance;
    };
    /**
     * Generate TOTP code using the secret (browser-compatible implementation)
     */
    GrowwTokenManager.prototype.generateTOTP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var key, timeStep, timeBuffer, timeView, hmac, offset, code, totpCode, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.totpSecret) {
                            throw new Error('TOTP secret not configured');
                        }
                        key = SimpleBase32.decode(this.totpSecret);
                        timeStep = Math.floor(Date.now() / 1000 / 30);
                        timeBuffer = new ArrayBuffer(8);
                        timeView = new DataView(timeBuffer);
                        timeView.setUint32(4, timeStep, false); // big-endian
                        return [4 /*yield*/, SimpleHMAC.sha1(key, new Uint8Array(timeBuffer))];
                    case 1:
                        hmac = _a.sent();
                        offset = hmac[hmac.length - 1] & 0xf;
                        code = ((hmac[offset] & 0x7f) << 24 |
                            (hmac[offset + 1] & 0xff) << 16 |
                            (hmac[offset + 2] & 0xff) << 8 |
                            (hmac[offset + 3] & 0xff)) % 1000000;
                        totpCode = code.toString().padStart(6, '0');
                        console.log("\uD83D\uDD10 Generated TOTP: ".concat(totpCode));
                        return [2 /*return*/, totpCode];
                    case 2:
                        error_1 = _a.sent();
                        console.error('❌ Error generating TOTP:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get access token using Railway authentication service
     */
    GrowwTokenManager.prototype.fetchAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authServiceUrl, controller_1, timeoutId, response, errorText, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('🔄 Requesting access token from Railway auth service...');
                        authServiceUrl = process.env.NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL ||
                            'https://emi-calculator-india-production.up.railway.app';
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 30000);
                        return [4 /*yield*/, fetch("".concat(authServiceUrl, "/auth/token"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                signal: controller_1.signal
                            })];
                    case 1:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error("\u274C Railway auth service error (".concat(response.status, "):"), errorText);
                        throw new Error("Failed to get access token from Railway: ".concat(response.status, " - ").concat(errorText));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        if (!data.success) {
                            throw new Error(data.error || 'Railway token generation failed');
                        }
                        if (!data.access_token) {
                            throw new Error('No access token in Railway response');
                        }
                        console.log('✅ Successfully obtained access token from Railway auth service');
                        console.log('🎉 Using automated TOTP + Groww SDK authentication');
                        console.log("\u23F0 Token expires at: ".concat(data.expires_at));
                        // Set expiry time based on Railway response
                        if (data.expires_at) {
                            this.tokenExpiry = new Date(data.expires_at).getTime();
                        }
                        else {
                            // Default to 11 hours
                            this.tokenExpiry = Date.now() + (11 * 60 * 60 * 1000);
                        }
                        return [2 /*return*/, data.access_token];
                    case 5:
                        error_2 = _a.sent();
                        console.error('❌ Error fetching Groww access token from Railway:', error_2);
                        throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get valid access token, refreshing if needed
     */
    GrowwTokenManager.prototype.getAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        // Check if we have a valid token
                        if (this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) { // 5 min buffer
                            console.log('✅ Using existing valid Groww token');
                            return [2 /*return*/, this.accessToken];
                        }
                        // Token expired or doesn't exist, get a new one
                        if (this.accessToken) {
                            console.log('🔄 Groww token expired, refreshing...');
                        }
                        else {
                            console.log('🆕 No Groww token found, generating new one...');
                        }
                        _a = this;
                        return [4 /*yield*/, this.fetchAccessToken()];
                    case 1:
                        _a.accessToken = _b.sent();
                        return [2 /*return*/, this.accessToken];
                    case 2:
                        error_3 = _b.sent();
                        console.error('❌ Failed to get Groww access token:', error_3);
                        // If we have an old token, try using it as fallback
                        if (this.accessToken) {
                            console.warn('⚠️ Using potentially expired token as fallback');
                            return [2 /*return*/, this.accessToken];
                        }
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear stored token (useful for testing or error recovery)
     */
    GrowwTokenManager.prototype.clearToken = function () {
        this.accessToken = null;
        this.tokenExpiry = 0;
        console.log('🗑️ Cleared stored Groww token');
    };
    /**
     * Check if token is valid and not expired
     */
    GrowwTokenManager.prototype.isTokenValid = function () {
        return !!(this.accessToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000);
    };
    /**
     * Get token expiry info for debugging
     */
    GrowwTokenManager.prototype.getTokenInfo = function () {
        return {
            hasToken: !!this.accessToken,
            expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry) : null,
            isValid: this.isTokenValid()
        };
    };
    /**
     * Test the Railway authentication service
     */
    GrowwTokenManager.prototype.testTokenGeneration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authServiceUrl, statusResponse, status_1, token, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log('🧪 Testing Railway Groww authentication service...');
                        authServiceUrl = process.env.NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL ||
                            'https://emi-calculator-india-production.up.railway.app';
                        return [4 /*yield*/, fetch("".concat(authServiceUrl, "/auth/status"))];
                    case 1:
                        statusResponse = _a.sent();
                        if (!statusResponse.ok) {
                            console.error('❌ Railway auth service not available');
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, statusResponse.json()];
                    case 2:
                        status_1 = _a.sent();
                        console.log('📊 Railway auth service status:', status_1);
                        if (!status_1.success || !status_1.status.configured) {
                            console.error('❌ Railway service not configured properly');
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.getAccessToken()];
                    case 3:
                        token = _a.sent();
                        console.log("\u2705 Railway authentication working: ".concat(token.substring(0, 20), "..."));
                        return [2 /*return*/, true];
                    case 4:
                        error_4 = _a.sent();
                        console.error('❌ Railway token generation test failed:', error_4);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return GrowwTokenManager;
}());
exports.GrowwTokenManager = GrowwTokenManager;
exports["default"] = GrowwTokenManager;
