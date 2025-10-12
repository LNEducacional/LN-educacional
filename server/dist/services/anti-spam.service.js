"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiSpamService = exports.antiSpamService = void 0;
class AntiSpamService {
    config;
    rateLimitStore = new Map();
    ipBlacklist = new Set();
    suspiciousIPs = new Map();
    constructor(config) {
        this.config = config;
        this.initializeBlacklist();
        this.startCleanupTimer();
    }
    async checkMessage(data) {
        const result = {
            isSpam: false,
            confidence: 0,
            reasons: [],
            action: 'allow',
        };
        if (!this.config.enabled) {
            return result;
        }
        // Check IP blacklist
        if (this.isIPBlacklisted(data.ip)) {
            result.isSpam = true;
            result.confidence = 1.0;
            result.reasons.push('IP address is blacklisted');
            result.action = 'block';
            return result;
        }
        // Check rate limiting
        const rateLimitCheck = this.checkRateLimit(data.ip);
        if (rateLimitCheck.blocked) {
            result.isSpam = true;
            result.confidence = 0.8;
            result.reasons.push(`Rate limit exceeded (${rateLimitCheck.count} requests)`);
            result.action = 'block';
            this.recordSuspiciousActivity(data.ip);
            return result;
        }
        // Check honeypot
        if (this.config.honeypot.enabled && data.honeypot) {
            result.isSpam = true;
            result.confidence = 0.9;
            result.reasons.push('Honeypot field filled');
            result.action = 'block';
            this.recordSuspiciousActivity(data.ip);
            return result;
        }
        // Content analysis
        if (this.config.contentAnalysis.enabled) {
            const contentResult = this.analyzeContent(data);
            result.confidence = Math.max(result.confidence, contentResult.confidence);
            result.reasons.push(...contentResult.reasons);
            if (contentResult.confidence >= 0.7) {
                result.isSpam = true;
                result.action = 'block';
                this.recordSuspiciousActivity(data.ip);
            }
            else if (contentResult.confidence >= 0.4) {
                result.action = 'challenge';
            }
        }
        // Additional suspicious behavior checks
        const behaviorResult = this.checkSuspiciousBehavior(data);
        result.confidence = Math.max(result.confidence, behaviorResult.confidence);
        result.reasons.push(...behaviorResult.reasons);
        if (behaviorResult.confidence >= 0.6) {
            result.isSpam = true;
            result.action = 'block';
            this.recordSuspiciousActivity(data.ip);
        }
        // Record the request for rate limiting
        this.recordRequest(data.ip);
        return result;
    }
    checkRateLimit(ip) {
        const now = Date.now();
        const existing = this.rateLimitStore.get(ip);
        if (!existing) {
            const info = {
                count: 1,
                windowStart: now,
                blocked: false,
                resetTime: now + this.config.rateLimiting.windowMs,
            };
            this.rateLimitStore.set(ip, info);
            return info;
        }
        // Check if window has expired
        if (now - existing.windowStart > this.config.rateLimiting.windowMs) {
            const info = {
                count: 1,
                windowStart: now,
                blocked: false,
                resetTime: now + this.config.rateLimiting.windowMs,
            };
            this.rateLimitStore.set(ip, info);
            return info;
        }
        // Increment count
        existing.count++;
        // Check if limit exceeded
        if (existing.count > this.config.rateLimiting.maxRequests) {
            existing.blocked = true;
            existing.resetTime = now + this.config.rateLimiting.blockDurationMs;
        }
        return existing;
    }
    recordRequest(ip) {
        const info = this.rateLimitStore.get(ip);
        if (info && !info.blocked) {
            // Request was allowed
            return;
        }
    }
    analyzeContent(data) {
        const reasons = [];
        let confidence = 0;
        const fullText = `${data.subject} ${data.message} ${data.name}`.toLowerCase();
        const { contentAnalysis } = this.config;
        // Check message length
        if (data.message.length < contentAnalysis.minMessageLength) {
            confidence += 0.3;
            reasons.push('Message too short');
        }
        if (data.message.length > contentAnalysis.maxMessageLength) {
            confidence += 0.2;
            reasons.push('Message too long');
        }
        // Check for spam keywords
        const spamKeywordCount = contentAnalysis.spamKeywords.filter(keyword => fullText.includes(keyword.toLowerCase())).length;
        if (spamKeywordCount > 0) {
            confidence += Math.min(spamKeywordCount * 0.3, 0.8);
            reasons.push(`Contains ${spamKeywordCount} spam keywords`);
        }
        // Check for suspicious keywords
        const suspiciousKeywordCount = contentAnalysis.suspiciousKeywords.filter(keyword => fullText.includes(keyword.toLowerCase())).length;
        if (suspiciousKeywordCount > 2) {
            confidence += 0.4;
            reasons.push(`Contains ${suspiciousKeywordCount} suspicious keywords`);
        }
        // Check for excessive links
        const linkCount = (data.message.match(/https?:\/\/[^\s]+/g) || []).length;
        if (linkCount > contentAnalysis.maxLinkCount) {
            confidence += 0.5;
            reasons.push(`Contains ${linkCount} links (max: ${contentAnalysis.maxLinkCount})`);
        }
        // Check for repetitive content
        if (this.hasRepetitiveContent(data.message)) {
            confidence += 0.4;
            reasons.push('Contains repetitive content');
        }
        // Check for all caps
        const capsRatio = this.calculateCapsRatio(data.message);
        if (capsRatio > 0.7) {
            confidence += 0.3;
            reasons.push('Excessive use of capital letters');
        }
        // Check email pattern
        if (this.isSuspiciousEmail(data.email)) {
            confidence += 0.3;
            reasons.push('Suspicious email pattern');
        }
        return { confidence: Math.min(confidence, 1), reasons };
    }
    checkSuspiciousBehavior(data) {
        const reasons = [];
        let confidence = 0;
        // Check for suspicious user agent
        if (data.userAgent) {
            if (this.isSuspiciousUserAgent(data.userAgent)) {
                confidence += 0.4;
                reasons.push('Suspicious user agent');
            }
        }
        // Check for generic names
        if (this.isGenericName(data.name)) {
            confidence += 0.2;
            reasons.push('Generic or suspicious name');
        }
        // Check for disposable email
        if (this.isDisposableEmail(data.email)) {
            confidence += 0.6;
            reasons.push('Disposable email address');
        }
        return { confidence, reasons };
    }
    hasRepetitiveContent(text) {
        const words = text.toLowerCase().split(/\s+/);
        const wordCount = new Map();
        for (const word of words) {
            if (word.length > 3) {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            }
        }
        // Check if any word appears more than 30% of the time
        const totalWords = words.length;
        for (const count of wordCount.values()) {
            if (count / totalWords > 0.3) {
                return true;
            }
        }
        return false;
    }
    calculateCapsRatio(text) {
        const letters = text.replace(/[^a-zA-Z]/g, '');
        if (letters.length === 0)
            return 0;
        const caps = text.replace(/[^A-Z]/g, '');
        return caps.length / letters.length;
    }
    isSuspiciousEmail(email) {
        const suspiciousPatterns = [
            /^\d+@/, // Starts with numbers
            /^[a-z]{1,3}@/, // Very short local part
            /\d{4,}@/, // Contains 4+ consecutive digits
            /@\d+\./, // Domain starts with numbers
        ];
        return suspiciousPatterns.some(pattern => pattern.test(email));
    }
    isSuspiciousUserAgent(userAgent) {
        const suspiciousPatterns = [
            /bot/i,
            /crawler/i,
            /spider/i,
            /scraper/i,
            /^$/, // Empty user agent
            /curl/i,
            /wget/i,
            /python/i,
        ];
        return suspiciousPatterns.some(pattern => pattern.test(userAgent));
    }
    isGenericName(name) {
        const genericNames = [
            'test', 'admin', 'user', 'guest', 'anonymous',
            'john doe', 'jane doe', 'name', 'firstname lastname',
            'asdf', 'qwerty', 'abc', 'xyz',
        ];
        const cleanName = name.toLowerCase().trim();
        return genericNames.includes(cleanName) || cleanName.length < 2;
    }
    isDisposableEmail(email) {
        const disposableDomains = [
            '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
            'tempmail.org', 'yopmail.com', 'maildrop.cc',
            '0-mail.com', '1chuan.com', '1pad.de', '20minutemail.com',
            'temp-mail.org', 'throwaway.email', 'getnada.com',
        ];
        const domain = email.split('@')[1]?.toLowerCase();
        return domain ? disposableDomains.includes(domain) : false;
    }
    isIPBlacklisted(ip) {
        return this.ipBlacklist.has(ip);
    }
    recordSuspiciousActivity(ip) {
        const current = this.suspiciousIPs.get(ip) || 0;
        const newCount = current + 1;
        this.suspiciousIPs.set(ip, newCount);
        // Auto-blacklist if threshold reached
        if (this.config.ipBlacklist.autoBlock &&
            newCount >= this.config.ipBlacklist.autoBlockThreshold) {
            this.addToBlacklist(ip);
            console.log(`Auto-blacklisted IP ${ip} after ${newCount} suspicious activities`);
        }
    }
    initializeBlacklist() {
        this.config.ipBlacklist.ips.forEach(ip => {
            this.ipBlacklist.add(ip);
        });
    }
    startCleanupTimer() {
        // Clean up old rate limit entries every 5 minutes
        setInterval(() => {
            this.cleanupOldEntries();
        }, 5 * 60 * 1000);
    }
    cleanupOldEntries() {
        const now = Date.now();
        const rateLimitExpiry = this.config.rateLimiting.windowMs + this.config.rateLimiting.blockDurationMs;
        // Clean rate limit store
        for (const [ip, info] of this.rateLimitStore.entries()) {
            if (now - info.windowStart > rateLimitExpiry) {
                this.rateLimitStore.delete(ip);
            }
        }
        // Clean suspicious IPs (older than 24 hours)
        const suspiciousExpiry = 24 * 60 * 60 * 1000; // 24 hours
        for (const [ip, timestamp] of this.suspiciousIPs.entries()) {
            if (now - timestamp > suspiciousExpiry) {
                this.suspiciousIPs.delete(ip);
            }
        }
    }
    // Admin methods
    addToBlacklist(ip) {
        this.ipBlacklist.add(ip);
    }
    removeFromBlacklist(ip) {
        this.ipBlacklist.delete(ip);
    }
    getBlacklist() {
        return Array.from(this.ipBlacklist);
    }
    getRateLimitInfo(ip) {
        return this.rateLimitStore.get(ip) || null;
    }
    getSuspiciousIPs() {
        return Array.from(this.suspiciousIPs.entries()).map(([ip, count]) => ({ ip, count }));
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
    // Get spam statistics
    getStats() {
        return {
            totalBlacklisted: this.ipBlacklist.size,
            totalSuspicious: this.suspiciousIPs.size,
            rateLimitedIPs: Array.from(this.rateLimitStore.values()).filter(info => info.blocked).length,
        };
    }
}
exports.AntiSpamService = AntiSpamService;
// Default configuration
const defaultConfig = {
    enabled: process.env.ANTI_SPAM_ENABLED !== 'false',
    rateLimiting: {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '5'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        blockDurationMs: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '3600000'), // 1 hour
    },
    contentAnalysis: {
        enabled: true,
        spamKeywords: [
            'viagra', 'casino', 'lottery', 'winner', 'congratulations',
            'click here', 'make money', 'get rich', 'free money',
            'limited time', 'act now', 'urgent', 'bitcoin',
            'cryptocurrency', 'investment opportunity', 'guaranteed profit',
        ],
        suspiciousKeywords: [
            'buy now', 'discount', 'cheap', 'free', 'promotion',
            'offer', 'deal', 'sale', 'limited', 'exclusive',
        ],
        maxLinkCount: 2,
        minMessageLength: 10,
        maxMessageLength: 5000,
    },
    honeypot: {
        enabled: true,
        fieldName: process.env.HONEYPOT_FIELD_NAME || 'website',
    },
    ipBlacklist: {
        enabled: true,
        ips: [],
        autoBlock: true,
        autoBlockThreshold: 5,
    },
};
exports.antiSpamService = new AntiSpamService(defaultConfig);
//# sourceMappingURL=anti-spam.service.js.map