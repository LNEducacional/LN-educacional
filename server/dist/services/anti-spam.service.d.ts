interface SpamCheckResult {
    isSpam: boolean;
    confidence: number;
    reasons: string[];
    action: 'allow' | 'block' | 'challenge';
}
interface RateLimitInfo {
    count: number;
    windowStart: number;
    blocked: boolean;
    resetTime: number;
}
interface AntiSpamConfig {
    enabled: boolean;
    rateLimiting: {
        maxRequests: number;
        windowMs: number;
        blockDurationMs: number;
    };
    contentAnalysis: {
        enabled: boolean;
        spamKeywords: string[];
        suspiciousKeywords: string[];
        maxLinkCount: number;
        minMessageLength: number;
        maxMessageLength: number;
    };
    honeypot: {
        enabled: boolean;
        fieldName: string;
    };
    ipBlacklist: {
        enabled: boolean;
        ips: string[];
        autoBlock: boolean;
        autoBlockThreshold: number;
    };
}
declare class AntiSpamService {
    private config;
    private rateLimitStore;
    private ipBlacklist;
    private suspiciousIPs;
    constructor(config: AntiSpamConfig);
    checkMessage(data: {
        ip: string;
        email: string;
        name: string;
        message: string;
        subject: string;
        honeypot?: string;
        userAgent?: string;
    }): Promise<SpamCheckResult>;
    private checkRateLimit;
    private recordRequest;
    private analyzeContent;
    private checkSuspiciousBehavior;
    private hasRepetitiveContent;
    private calculateCapsRatio;
    private isSuspiciousEmail;
    private isSuspiciousUserAgent;
    private isGenericName;
    private isDisposableEmail;
    private isIPBlacklisted;
    private recordSuspiciousActivity;
    private initializeBlacklist;
    private startCleanupTimer;
    private cleanupOldEntries;
    addToBlacklist(ip: string): void;
    removeFromBlacklist(ip: string): void;
    getBlacklist(): string[];
    getRateLimitInfo(ip: string): RateLimitInfo | null;
    getSuspiciousIPs(): Array<{
        ip: string;
        count: number;
    }>;
    updateConfig(newConfig: Partial<AntiSpamConfig>): void;
    getConfig(): AntiSpamConfig;
    getStats(): {
        totalBlacklisted: number;
        totalSuspicious: number;
        rateLimitedIPs: number;
    };
}
export declare const antiSpamService: AntiSpamService;
export { AntiSpamService, type SpamCheckResult, type AntiSpamConfig };
//# sourceMappingURL=anti-spam.service.d.ts.map