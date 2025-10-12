import Redis from 'ioredis';
export declare function getRedisClient(): Redis | null;
export declare function setCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
export declare function getCache<T>(key: string): Promise<T | null>;
export declare function deleteCache(key: string): Promise<void>;
export declare function deleteCachePattern(pattern: string): Promise<void>;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map